import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Play,
  RefreshCw,
  Sliders,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import {
  BackgroundScannerSettings,
  BackgroundScannerStatus,
  StrategyAlertNotification,
  Timeframe,
} from '../types/trading';
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  sendDesktopNotification,
} from '../utils/desktopNotification';

interface StrategyAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: StrategyAlertNotification[];
  scannerStatus: BackgroundScannerStatus | null;
  settings: BackgroundScannerSettings | null;
  onUpdateSettings: (settings: BackgroundScannerSettings) => Promise<void>;
  onAcknowledgeAlert: (id: string) => Promise<void>;
  onDismissAlert: (id: string) => Promise<void>;
  onClearAllAlerts: () => Promise<void>;
  onTestNotification: () => Promise<void>;
  onNavigateToChart: (symbol: string, timeframe?: Timeframe) => void;
}

export const StrategyAlertsModal: React.FC<StrategyAlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  scannerStatus,
  settings,
  onUpdateSettings,
  onAcknowledgeAlert,
  onDismissAlert,
  onClearAllAlerts,
  onTestNotification,
  onNavigateToChart,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(() => getNotificationPermission());
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const currentSettings: BackgroundScannerSettings = settings || {
    isEnabled: true,
    soundAlertsEnabled: true,
    desktopNotificationEnabled: true,
    reminderIntervalMinutes: 2,
    maxRemindersPerAlert: 5,
  };

  const handleToggleBackgroundScanning = async () => {
    setIsUpdating(true);
    try {
      await onUpdateSettings({
        ...currentSettings,
        isEnabled: !currentSettings.isEnabled,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleDesktopNotifications = async () => {
    if (!currentSettings.desktopNotificationEnabled && permission !== 'granted') {
      const result = await requestNotificationPermission();
      setPermission(result);
    }
    setIsUpdating(true);
    try {
      await onUpdateSettings({
        ...currentSettings,
        desktopNotificationEnabled: !currentSettings.desktopNotificationEnabled,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleSound = async () => {
    setIsUpdating(true);
    try {
      await onUpdateSettings({
        ...currentSettings,
        soundAlertsEnabled: !currentSettings.soundAlertsEnabled,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
  };

  const handleTriggerTest = async () => {
    setTestSent(true);
    try {
      await onTestNotification();
      sendDesktopNotification({
        title: '🔔 Strategy Scanner Alert (Test)',
        body: 'Cross-platform notification confirmed on your system! Background strategy alerts are active.',
        playSound: currentSettings.soundAlertsEnabled,
      });
    } finally {
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  const unacknowledgedCount = alerts.filter((a) => !a.isAcknowledged).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0e1422] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Strategy Alerts & Background Scanner</span>
                {unacknowledgedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-mono border border-amber-500/40">
                    {unacknowledgedCount} unacknowledged
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Smart Background Scanner • Cross-Platform Linux / Windows / Mac / Web Notifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Background Scanner & Notification Settings Card */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Engine & Notification Controls
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                  currentSettings.isEnabled
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    currentSettings.isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                {currentSettings.isEnabled ? 'Background Service Running' : 'Background Service Paused'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option 1: Keep Background Scanning Running */}
              <div
                onClick={handleToggleBackgroundScanning}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  currentSettings.isEnabled
                    ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="space-y-0.5 pr-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Background Scanning</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {currentSettings.isEnabled
                      ? 'Actively evaluating strategies in background'
                      : 'Scanning is stopped (User paused)'}
                  </div>
                </div>
                <div
                  className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                    currentSettings.isEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-3 h-3 rounded-full shadow-md" />
                </div>
              </div>

              {/* Option 2: Desktop OS Notifications */}
              <div
                onClick={handleToggleDesktopNotifications}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  currentSettings.desktopNotificationEnabled
                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="space-y-0.5 pr-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-400" />
                    <span>OS Notifications</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Linux, Windows, Mac & Web alerts
                  </div>
                </div>
                <div
                  className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                    currentSettings.desktopNotificationEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-3 h-3 rounded-full shadow-md" />
                </div>
              </div>

              {/* Option 3: Sound Alerts */}
              <div
                onClick={handleToggleSound}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  currentSettings.soundAlertsEnabled
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="space-y-0.5 pr-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {currentSettings.soundAlertsEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>Sound Alerts</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Web Audio chime on trigger & reminder
                  </div>
                </div>
                <div
                  className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                    currentSettings.soundAlertsEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-3 h-3 rounded-full shadow-md" />
                </div>
              </div>

              {/* Option 4: Notification Test & Permission Status */}
              <div className="p-3 rounded-xl border bg-slate-950/60 border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>OS Permission:</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        permission === 'granted'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : permission === 'denied'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {permission}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Reminds every 2m (up to 5x) until acknowledged
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {permission !== 'granted' && isNotificationSupported() && (
                    <button
                      onClick={handleRequestPermission}
                      className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-all"
                    >
                      Allow
                    </button>
                  )}
                  <button
                    onClick={handleTriggerTest}
                    disabled={testSent}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-all flex items-center gap-1"
                    title="Send a sample desktop notification and chime"
                  >
                    <Play className="w-3 h-3 text-emerald-400" />
                    <span>{testSent ? 'Sent!' : 'Test'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Alerts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <span>Active Strategy Alerts</span>
                <span className="text-[11px] text-slate-400 font-normal">({alerts.length} total)</span>
              </span>

              {alerts.length > 0 && (
                <button
                  onClick={onClearAllAlerts}
                  className="text-[11px] text-slate-400 hover:text-red-400 font-mono flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {alerts.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-sm font-semibold text-slate-300">No Pending Alerts</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-mono">
                  {currentSettings.isEnabled
                    ? 'The background service is running and will notify you with desktop banners and audio whenever a strategy condition is met.'
                    : 'Background scanning is currently paused. Enable it above to resume continuous strategy evaluation.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      alert.isAcknowledged
                        ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                        : 'bg-amber-950/20 border-amber-500/40 text-slate-200 shadow-lg shadow-amber-950/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-xs font-mono">{alert.symbol}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            {alert.timeframe}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 truncate">{alert.strategyName}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              alert.state === 'FullyMet'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {alert.matchScore.toFixed(0)}% Match
                          </span>
                        </div>

                        <p className="text-xs text-slate-300">{alert.summaryMessage}</p>

                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-0.5">
                          <span>Price: ${Number(alert.lastPrice).toFixed(5)}</span>
                          <span>•</span>
                          <span>{new Date(alert.createdAtUtc).toLocaleTimeString()}</span>
                          {alert.reminderCount > 0 && !alert.isAcknowledged && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-semibold animate-pulse">
                                Reminded {alert.reminderCount}x
                              </span>
                            </>
                          )}
                          {alert.isAcknowledged && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400">Acknowledged</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!alert.isAcknowledged && (
                          <button
                            onClick={() => onAcknowledgeAlert(alert.id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-medium transition-colors flex items-center gap-1"
                            title="Acknowledge alert and stop recurring reminder notifications"
                          >
                            <Check className="w-3 h-3" />
                            <span>Ack</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onNavigateToChart(alert.symbol, alert.timeframe);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[11px] font-medium transition-colors flex items-center gap-1"
                          title="Open on Technical Chart"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Chart</span>
                        </button>

                        <button
                          onClick={() => onDismissAlert(alert.id)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
                          title="Dismiss notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>
              Cadence: Scan aligns with candle timeframe (H4 runs every 4h, H1 every 1h, etc.)
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
