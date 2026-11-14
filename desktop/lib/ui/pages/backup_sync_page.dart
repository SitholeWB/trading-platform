import 'dart:io';
import 'package:flutter/material.dart';
import '../../services/backup_sync_service.dart';
import '../../services/localization_service.dart';
import '../../services/storage_service.dart';

class BackupSyncPage extends StatefulWidget {
  final StorageService storage;
  final BackupSyncService syncService;
  final VoidCallback onStateRestored;

  const BackupSyncPage({
    super.key,
    required this.storage,
    required this.syncService,
    required this.onStateRestored,
  });

  @override
  State<BackupSyncPage> createState() => _BackupSyncPageState();
}

class _BackupSyncPageState extends State<BackupSyncPage> {
  late final TextEditingController _folderController;
  late final TextEditingController _webDavUrlController;
  late final TextEditingController _webDavUserController;
  late final TextEditingController _webDavPassController;
  bool _obscurePassword = true;
  bool _busy = false;

  String get _lang => widget.storage.languageCode;
  String _t(String key, String fallback) => AppL10n.t(_lang, key, fallback);

  @override
  void initState() {
    super.initState();
    _folderController =
        TextEditingController(text: widget.storage.syncFolderPath);
    _webDavUrlController =
        TextEditingController(text: widget.storage.webDavUrl);
    _webDavUserController =
        TextEditingController(text: widget.storage.webDavUsername);
    _webDavPassController =
        TextEditingController(text: widget.storage.webDavPassword);
  }

  @override
  void dispose() {
    _folderController.dispose();
    _webDavUrlController.dispose();
    _webDavUserController.dispose();
    _webDavPassController.dispose();
    super.dispose();
  }

  void _showSnack(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red.shade700 : null,
      ),
    );
  }

  Future<void> _saveSettings() async {
    widget.storage.syncFolderPath = _folderController.text.trim();
    widget.storage.webDavUrl = _webDavUrlController.text.trim();
    widget.storage.webDavUsername = _webDavUserController.text.trim();
    widget.storage.webDavPassword = _webDavPassController.text;
    await widget.storage.save();
  }

  Future<void> _runBusy(Future<void> Function() action) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await action();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _browseSyncFolder() async {
    final picked = await widget.syncService.pickFolderDialog();
    if (picked == null) {
      _showSnack(
        'Enter a folder path directly (for example ~/OneDrive/TradingPlatform) if no system picker appeared.',
      );
      return;
    }
    setState(() => _folderController.text = picked);
    await _saveSettings();
  }

  Future<void> _confirmAndApplyBackup(Map<String, dynamic> data, String sourceLabel) async {
    final strategies = (data['strategies'] as List?)?.length ?? 0;
    final notes = (data['journalEntries'] as List?)?.length ?? 0;
    final alerts = (data['alerts'] as List?)?.length ?? 0;
    final drawings = (data['drawingsBySymbol'] as Map?)?.length ?? 0;
    final exportedAt = data['exportedAtUtc'] as String? ?? 'Unknown';
    final hasSecrets = data['includesSecrets'] == true;

    if (!mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Restore Backup?'),
        content: SizedBox(
          width: 440,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Source: $sourceLabel',
                style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 6),
              Text(
                'Exported at (UTC): $exportedAt',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
              ),
              const Divider(height: 20),
              Text('• Strategies: $strategies'),
              Text('• Journal Notes: $notes'),
              Text('• Price Alerts: $alerts'),
              Text('• Symbols with Chart Drawings: $drawings'),
              Text('• Includes API Keys: ${hasSecrets ? "Yes" : "No"}'),
              const SizedBox(height: 12),
              Text(
                'Restoring will replace your current local notes, strategies, alerts, drawings, and preferences.',
                style: TextStyle(fontSize: 12, color: Colors.amber.shade300),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Restore Now'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    await widget.storage.applyBackupJson(data, restoreSecrets: hasSecrets);
    widget.onStateRestored();
    if (mounted) {
      setState(() {});
      _showSnack('Backup restored successfully.');
    }
  }

  Future<void> _exportPortableFile() async {
    await _runBusy(() async {
      final home = Platform.environment['HOME'] ?? '.';
      final picked = await widget.syncService.pickSaveBackupFileDialog();
      final targetPath = picked ?? '$home/trading_platform_backup.tpbackup';
      final res = await widget.syncService.exportBackupToFile(targetPath);
      if (mounted) setState(() {});
      _showSnack(res.message, isError: !res.ok);
    });
  }

  Future<void> _importPortableFile() async {
    await _runBusy(() async {
      final picked = await widget.syncService.pickOpenBackupFileDialog();
      if (picked == null) {
        final home = Platform.environment['HOME'] ?? '.';
        final fallback = '$home/trading_platform_backup.tpbackup';
        if (await File(fallback).exists()) {
          final res = await widget.syncService.readBackupFile(fallback);
          if (res.ok && res.data != null) {
            await _confirmAndApplyBackup(res.data!, fallback);
          } else {
            _showSnack(res.message, isError: true);
          }
        } else {
          _showSnack('No backup file selected.');
        }
        return;
      }
      final res = await widget.syncService.readBackupFile(picked);
      if (res.ok && res.data != null) {
        await _confirmAndApplyBackup(res.data!, picked);
      } else {
        _showSnack(res.message, isError: true);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final totalDrawings = widget.storage.drawingsBySymbol.values
        .fold<int>(0, (sum, list) => sum + list.length);
    final lastBackupText = widget.storage.lastBackupAtMs > 0
        ? '${DateTime.fromMillisecondsSinceEpoch(widget.storage.lastBackupAtMs).toLocal().toString().substring(0, 19)} (${widget.storage.lastBackupTarget})'
        : 'Never backed up yet';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 980),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.cloud_sync_outlined, size: 26, color: cs.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _t('nav.backup', 'Backup & Cloud Sync'),
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Keep your trading journal notes, strategies, price alerts, chart drawings, and preferences safe across reinstalls or multiple computers — with zero third-party app logins.',
                          style: TextStyle(
                            fontSize: 12.5,
                            color: Colors.grey.shade400,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_busy)
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                ],
              ),
              const SizedBox(height: 16),

              // Summary & Security Banner
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'What Gets Saved',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _statChip(Icons.edit_note,
                              '${widget.storage.journalEntries.length} Journal Notes'),
                          _statChip(Icons.bolt,
                              '${widget.storage.strategies.length} Strategies'),
                          _statChip(Icons.notifications_active_outlined,
                              '${widget.storage.alerts.length} Price Alerts'),
                          _statChip(Icons.draw_outlined,
                              '$totalDrawings Chart Drawings'),
                          _statChip(Icons.tune, 'Theme, Language & Risk Rules'),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Last backup: $lastBackupText',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade400,
                        ),
                      ),
                      const Divider(height: 22),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        value: widget.storage.includeSecretsInBackup,
                        onChanged: (v) async {
                          setState(() =>
                              widget.storage.includeSecretsInBackup = v);
                          await widget.storage.save();
                        },
                        title: const Text(
                          'Include Broker & AI API Keys in Backups',
                          style: TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        subtitle: Text(
                          'Off by default for security. Enable only if you are syncing to a private, encrypted folder or trusted NAS.',
                          style: TextStyle(
                              fontSize: 12, color: Colors.grey.shade400),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Option 1: Auto-Sync Folder
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.folder_copy_outlined, size: 20),
                          const SizedBox(width: 8),
                          const Expanded(
                            child: Text(
                              '1. Auto-Sync Folder (OneDrive, Google Drive, Dropbox, Syncthing)',
                              style: TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Switch(
                            value: widget.storage.autoSyncFolderEnabled,
                            onChanged: (v) async {
                              setState(() =>
                                  widget.storage.autoSyncFolderEnabled = v);
                              await _saveSettings();
                              if (v &&
                                  _folderController.text.trim().isNotEmpty) {
                                final res =
                                    await widget.syncService.syncToFolder();
                                if (mounted) setState(() {});
                                _showSnack(res.message, isError: !res.ok);
                              }
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Point to any folder already synced by OneDrive, Google Drive, Dropbox, Nextcloud Desktop, or Syncthing. Every time you save notes, strategies, or settings, Trading Platform writes trading_platform_backup.json there automatically.',
                        style: TextStyle(
                            fontSize: 12.5, color: Colors.grey.shade400),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _folderController,
                              decoration: const InputDecoration(
                                labelText: 'Sync Folder Path',
                                hintText: '/home/you/OneDrive/TradingPlatform',
                                border: OutlineInputBorder(),
                                isDense: true,
                              ),
                              onChanged: (_) => _saveSettings(),
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton.icon(
                            onPressed: _busy ? null : _browseSyncFolder,
                            icon: const Icon(Icons.folder_open, size: 17),
                            label: const Text('Browse'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          FilledButton.icon(
                            onPressed: _busy
                                ? null
                                : () => _runBusy(() async {
                                      await _saveSettings();
                                      final res = await widget.syncService
                                          .syncToFolder();
                                      if (mounted) setState(() {});
                                      _showSnack(res.message, isError: !res.ok);
                                    }),
                            icon: const Icon(Icons.sync, size: 17),
                            label: const Text('Sync Now'),
                          ),
                          OutlinedButton.icon(
                            onPressed: _busy
                                ? null
                                : () => _runBusy(() async {
                                      await _saveSettings();
                                      final res = await widget.syncService
                                          .readFromFolder();
                                      if (res.ok && res.data != null) {
                                        await _confirmAndApplyBackup(
                                          res.data!,
                                          '${_folderController.text.trim()}/${BackupSyncService.backupFileName}',
                                        );
                                      } else {
                                        _showSnack(res.message, isError: true);
                                      }
                                    }),
                            icon: const Icon(Icons.download_outlined, size: 17),
                            label: const Text('Restore from Folder'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Option 2: Direct WebDAV
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.dns_outlined, size: 20),
                          const SizedBox(width: 8),
                          const Expanded(
                            child: Text(
                              '2. Direct WebDAV Sync (Nextcloud, ownCloud, Synology NAS, Koofr, pCloud)',
                              style: TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Switch(
                            value: widget.storage.autoSyncWebDavEnabled,
                            onChanged: (v) async {
                              setState(() =>
                                  widget.storage.autoSyncWebDavEnabled = v);
                              await _saveSettings();
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Sync directly over HTTPS using your own WebDAV folder URL and app password — no developer OAuth setup or desktop sync client required.',
                        style: TextStyle(
                            fontSize: 12.5, color: Colors.grey.shade400),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _webDavUrlController,
                        decoration: const InputDecoration(
                          labelText: 'WebDAV Folder URL',
                          hintText:
                              'https://cloud.example.com/remote.php/dav/files/you/TradingPlatform/',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        onChanged: (_) => _saveSettings(),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _webDavUserController,
                              decoration: const InputDecoration(
                                labelText: 'Username',
                                border: OutlineInputBorder(),
                                isDense: true,
                              ),
                              onChanged: (_) => _saveSettings(),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextField(
                              controller: _webDavPassController,
                              obscureText: _obscurePassword,
                              decoration: InputDecoration(
                                labelText: 'Password / App Password',
                                border: const OutlineInputBorder(),
                                isDense: true,
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility_off
                                        : Icons.visibility,
                                    size: 18,
                                  ),
                                  onPressed: () => setState(() =>
                                      _obscurePassword = !_obscurePassword),
                                ),
                              ),
                              onChanged: (_) => _saveSettings(),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: _busy
                                ? null
                                : () => _runBusy(() async {
                                      await _saveSettings();
                                      final res = await widget.syncService
                                          .testWebDavConnection();
                                      _showSnack(res.message, isError: !res.ok);
                                    }),
                            icon: const Icon(Icons.wifi_tethering, size: 17),
                            label: const Text('Test Connection'),
                          ),
                          FilledButton.icon(
                            onPressed: _busy
                                ? null
                                : () => _runBusy(() async {
                                      await _saveSettings();
                                      final res = await widget.syncService
                                          .uploadToWebDav();
                                      if (mounted) setState(() {});
                                      _showSnack(res.message, isError: !res.ok);
                                    }),
                            icon: const Icon(Icons.cloud_upload_outlined,
                                size: 17),
                            label: const Text('Upload Now'),
                          ),
                          OutlinedButton.icon(
                            onPressed: _busy
                                ? null
                                : () => _runBusy(() async {
                                      await _saveSettings();
                                      final res = await widget.syncService
                                          .downloadFromWebDav();
                                      if (res.ok && res.data != null) {
                                        await _confirmAndApplyBackup(
                                          res.data!,
                                          _webDavUrlController.text.trim(),
                                        );
                                      } else {
                                        _showSnack(res.message, isError: true);
                                      }
                                    }),
                            icon: const Icon(Icons.cloud_download_outlined,
                                size: 17),
                            label: const Text('Restore from WebDAV'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Option 3: Portable .tpbackup
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.archive_outlined, size: 20),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '3. Portable Backup File (.tpbackup)',
                              style: TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Save a single portable .tpbackup file to upload manually to OneDrive, Google Drive, USB, or transfer to another computer.',
                        style: TextStyle(
                            fontSize: 12.5, color: Colors.grey.shade400),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          FilledButton.icon(
                            onPressed: _busy ? null : _exportPortableFile,
                            icon: const Icon(Icons.upload_file, size: 17),
                            label: const Text('Export .tpbackup'),
                          ),
                          OutlinedButton.icon(
                            onPressed: _busy ? null : _importPortableFile,
                            icon: const Icon(Icons.file_open_outlined, size: 17),
                            label: const Text('Import .tpbackup'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statChip(IconData icon, String label) {
    return Chip(
      avatar: Icon(icon, size: 15),
      label: Text(label, style: const TextStyle(fontSize: 12)),
      visualDensity: VisualDensity.compact,
    );
  }
}
