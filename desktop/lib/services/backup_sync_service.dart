import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'storage_service.dart';

class BackupSyncResult {
  final bool ok;
  final String message;
  final Map<String, dynamic>? data;

  const BackupSyncResult({
    required this.ok,
    required this.message,
    this.data,
  });
}

class BackupSyncService extends ChangeNotifier {
  BackupSyncService(this.storage);

  final StorageService storage;
  static const String backupFileName = 'trading_platform_backup.json';

  Timer? _debounceTimer;
  bool _isSyncing = false;
  String lastStatus = '';

  bool get isSyncing => _isSyncing;

  void attachAutoSync() {
    storage.onSaved = scheduleAutoSync;
  }

  void scheduleAutoSync() {
    if (!storage.autoSyncFolderEnabled && !storage.autoSyncWebDavEnabled) {
      return;
    }
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 1500), () {
      unawaited(runAutoSync());
    });
  }

  Future<void> runAutoSync() async {
    if (_isSyncing) return;
    if (storage.autoSyncFolderEnabled &&
        storage.syncFolderPath.trim().isNotEmpty) {
      await syncToFolder(silent: true);
    }
    if (storage.autoSyncWebDavEnabled &&
        storage.webDavUrl.trim().isNotEmpty) {
      await uploadToWebDav(silent: true);
    }
  }

  String _encodedPayload() {
    const encoder = JsonEncoder.withIndent('  ');
    return encoder.convert(storage.toBackupJson());
  }

  Future<BackupSyncResult> syncToFolder({bool silent = false}) async {
    final folderPath = storage.syncFolderPath.trim();
    if (folderPath.isEmpty) {
      return const BackupSyncResult(
        ok: false,
        message: 'Choose a sync folder first.',
      );
    }
    _setSyncing(true);
    try {
      final dir = Directory(folderPath);
      if (!await dir.exists()) {
        await dir.create(recursive: true);
      }
      final target = File('${dir.path}/$backupFileName');
      final tmp = File('${dir.path}/.$backupFileName.tmp');
      await tmp.writeAsString(_encodedPayload());
      await tmp.rename(target.path);

      storage.lastBackupAtMs = DateTime.now().millisecondsSinceEpoch;
      storage.lastBackupTarget = target.path;
      lastStatus = 'Synced to ${target.path}';
      return BackupSyncResult(
        ok: true,
        message: 'Backup saved to ${target.path}',
      );
    } catch (e) {
      lastStatus = 'Folder sync error: $e';
      return BackupSyncResult(
        ok: false,
        message: 'Could not write to folder: $e',
      );
    } finally {
      _setSyncing(false);
      if (!silent) notifyListeners();
    }
  }

  Future<BackupSyncResult> readFromFolder() async {
    final folderPath = storage.syncFolderPath.trim();
    if (folderPath.isEmpty) {
      return const BackupSyncResult(
        ok: false,
        message: 'Choose a sync folder first.',
      );
    }
    final file = File('$folderPath/$backupFileName');
    return readBackupFile(file.path);
  }

  Uri? _resolveWebDavFileUri(String rawUrl) {
    final trimmed = rawUrl.trim();
    if (trimmed.isEmpty) return null;
    final parsed = Uri.tryParse(trimmed);
    if (parsed == null || !parsed.hasScheme) return null;
    if (trimmed.endsWith('.json') || trimmed.endsWith('.tpbackup')) {
      return parsed;
    }
    final normalized = trimmed.endsWith('/') ? trimmed : '$trimmed/';
    return Uri.tryParse('$normalized$backupFileName');
  }

  Map<String, String> _webDavHeaders() {
    final headers = <String, String>{
      'Content-Type': 'application/json; charset=utf-8',
    };
    final user = storage.webDavUsername.trim();
    final pass = storage.webDavPassword;
    if (user.isNotEmpty || pass.isNotEmpty) {
      final token = base64Encode(utf8.encode('$user:$pass'));
      headers['Authorization'] = 'Basic $token';
    }
    return headers;
  }

  Future<BackupSyncResult> testWebDavConnection() async {
    final fileUri = _resolveWebDavFileUri(storage.webDavUrl);
    if (fileUri == null) {
      return const BackupSyncResult(
        ok: false,
        message: 'Enter a valid http:// or https:// WebDAV folder URL.',
      );
    }
    _setSyncing(true);
    try {
      final folderUri = Uri.parse(
        storage.webDavUrl.trim().endsWith('/')
            ? storage.webDavUrl.trim()
            : '${storage.webDavUrl.trim()}/',
      );
      final req = http.Request('OPTIONS', folderUri)
        ..headers.addAll(_webDavHeaders());
      final streamed =
          await req.send().timeout(const Duration(seconds: 12));
      if (streamed.statusCode >= 200 && streamed.statusCode < 400) {
        return BackupSyncResult(
          ok: true,
          message: 'Connected (${streamed.statusCode}) to $folderUri',
        );
      }
      return BackupSyncResult(
        ok: false,
        message: 'Server returned HTTP ${streamed.statusCode}',
      );
    } catch (e) {
      return BackupSyncResult(
        ok: false,
        message: 'Connection failed: $e',
      );
    } finally {
      _setSyncing(false);
    }
  }

  Future<BackupSyncResult> uploadToWebDav({bool silent = false}) async {
    final fileUri = _resolveWebDavFileUri(storage.webDavUrl);
    if (fileUri == null) {
      return const BackupSyncResult(
        ok: false,
        message: 'Enter a valid http:// or https:// WebDAV folder URL.',
      );
    }
    _setSyncing(true);
    try {
      final resp = await http
          .put(fileUri, headers: _webDavHeaders(), body: _encodedPayload())
          .timeout(const Duration(seconds: 20));
      if (resp.statusCode >= 200 && resp.statusCode < 300) {
        storage.lastBackupAtMs = DateTime.now().millisecondsSinceEpoch;
        storage.lastBackupTarget = fileUri.toString();
        lastStatus = 'Uploaded to $fileUri';
        return BackupSyncResult(
          ok: true,
          message: 'Backup uploaded to $fileUri',
        );
      }
      lastStatus = 'WebDAV HTTP ${resp.statusCode}';
      return BackupSyncResult(
        ok: false,
        message: 'WebDAV upload failed (HTTP ${resp.statusCode})',
      );
    } catch (e) {
      lastStatus = 'WebDAV upload error: $e';
      return BackupSyncResult(
        ok: false,
        message: 'WebDAV upload error: $e',
      );
    } finally {
      _setSyncing(false);
      if (!silent) notifyListeners();
    }
  }

  Future<BackupSyncResult> downloadFromWebDav() async {
    final fileUri = _resolveWebDavFileUri(storage.webDavUrl);
    if (fileUri == null) {
      return const BackupSyncResult(
        ok: false,
        message: 'Enter a valid http:// or https:// WebDAV folder URL.',
      );
    }
    _setSyncing(true);
    try {
      final resp = await http
          .get(fileUri, headers: _webDavHeaders())
          .timeout(const Duration(seconds: 20));
      if (resp.statusCode == 200) {
        return _parseBackupPayload(resp.body, source: fileUri.toString());
      }
      return BackupSyncResult(
        ok: false,
        message: 'WebDAV download failed (HTTP ${resp.statusCode})',
      );
    } catch (e) {
      return BackupSyncResult(
        ok: false,
        message: 'WebDAV download error: $e',
      );
    } finally {
      _setSyncing(false);
    }
  }

  Future<BackupSyncResult> exportBackupToFile(String filePath) async {
    _setSyncing(true);
    try {
      final normalized = filePath.endsWith('.tpbackup') ||
              filePath.endsWith('.json')
          ? filePath
          : '$filePath.tpbackup';
      final file = File(normalized);
      if (!await file.parent.exists()) {
        await file.parent.create(recursive: true);
      }
      await file.writeAsString(_encodedPayload());
      storage.lastBackupAtMs = DateTime.now().millisecondsSinceEpoch;
      storage.lastBackupTarget = file.path;
      await storage.save();
      return BackupSyncResult(
        ok: true,
        message: 'Exported backup to ${file.path}',
      );
    } catch (e) {
      return BackupSyncResult(
        ok: false,
        message: 'Export failed: $e',
      );
    } finally {
      _setSyncing(false);
    }
  }

  Future<BackupSyncResult> readBackupFile(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        return BackupSyncResult(
          ok: false,
          message: 'Backup file not found: $filePath',
        );
      }
      final raw = await file.readAsString();
      return _parseBackupPayload(raw, source: file.path);
    } catch (e) {
      return BackupSyncResult(
        ok: false,
        message: 'Could not read backup file: $e',
      );
    }
  }

  BackupSyncResult _parseBackupPayload(String raw, {required String source}) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) {
        return const BackupSyncResult(
          ok: false,
          message: 'Invalid backup format (expected JSON object).',
        );
      }
      if (decoded['format'] != 'trading-platform-backup') {
        return const BackupSyncResult(
          ok: false,
          message: 'Unrecognized file format (not a Trading Platform backup).',
        );
      }
      return BackupSyncResult(
        ok: true,
        message: 'Loaded backup from $source',
        data: decoded,
      );
    } catch (e) {
      return BackupSyncResult(
        ok: false,
        message: 'Invalid JSON in backup: $e',
      );
    }
  }

  Future<String?> pickFolderDialog() async {
    return _runSystemPicker(
      zenityArgs: ['--file-selection', '--directory', '--title=Select Sync Folder'],
      kdialogArgs: ['--getexistingdirectory', Platform.environment['HOME'] ?? '/'],
    );
  }

  Future<String?> pickSaveBackupFileDialog() async {
    final home = Platform.environment['HOME'] ?? '.';
    final defaultName = '$home/trading_platform_backup.tpbackup';
    return _runSystemPicker(
      zenityArgs: [
        '--file-selection',
        '--save',
        '--confirm-overwrite',
        '--filename=$defaultName',
        '--title=Export Trading Platform Backup',
      ],
      kdialogArgs: ['--getsavefilename', defaultName, '*.tpbackup *.json'],
    );
  }

  Future<String?> pickOpenBackupFileDialog() async {
    final home = Platform.environment['HOME'] ?? '/';
    return _runSystemPicker(
      zenityArgs: [
        '--file-selection',
        '--filename=$home/',
        '--file-filter=Trading Platform Backups (*.tpbackup *.json) | *.tpbackup *.json',
        '--title=Import Trading Platform Backup',
      ],
      kdialogArgs: ['--getopenfilename', home, '*.tpbackup *.json'],
    );
  }

  Future<String?> _runSystemPicker({
    required List<String> zenityArgs,
    required List<String> kdialogArgs,
  }) async {
    if (!Platform.isLinux) return null;
    for (final cmd in [
      ('zenity', zenityArgs),
      ('kdialog', kdialogArgs),
    ]) {
      try {
        final res = await Process.run(cmd.$1, cmd.$2);
        if (res.exitCode == 0) {
          final path = res.stdout.toString().trim();
          if (path.isNotEmpty) return path;
        }
        return null;
      } catch (_) {
        // Try next picker
      }
    }
    return null;
  }

  void _setSyncing(bool value) {
    if (_isSyncing == value) return;
    _isSyncing = value;
    notifyListeners();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }
}
