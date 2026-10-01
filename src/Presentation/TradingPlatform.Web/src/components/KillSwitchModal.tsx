import React, { useState } from 'react';
import { RiskProfile } from '../types/trading';

interface KillSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  risk: RiskProfile | null;
  onToggleKillSwitch: (engage: boolean, reason?: string) => Promise<void>;
}

export const KillSwitchModal: React.FC<KillSwitchModalProps> = ({
  isOpen,
  onClose,
  risk,
  onToggleKillSwitch,
}) => {
  const [reason, setReason] = useState('Manual emergency override triggered by operator.');
  const [confirmInput, setConfirmInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isEngaged = risk?.isKillSwitchEngaged ?? false;

  const handleSubmit = async () => {
    if (!isEngaged && confirmInput !== 'KILL') return;
    setLoading(true);
    try {
      await onToggleKillSwitch(!isEngaged, reason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-red-800/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-200">
        <div className="flex items-center gap-3 text-red-400">
          <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-xl font-bold">
            ⚠️
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">
              {isEngaged ? 'Disengage Emergency Kill Switch?' : 'Engage Emergency Kill Switch?'}
            </h3>
            <p className="text-xs text-slate-400">Institutional Risk Protocol Override</p>
          </div>
        </div>

        <div className="bg-red-950/30 border border-red-900/50 p-3 rounded-lg text-xs space-y-2 text-red-200">
          <p className="font-bold">Protocol Consequences:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
            <li>All active broker positions across Oanda and MT5 will be immediately closed.</li>
            <li>All incoming trade signals will be rejected with <code className="bg-slate-950 px-1 py-0.5 rounded text-red-400">RejectedByRisk</code>.</li>
            <li>A critical audit log will be written to the database with a high-priority timestamp.</li>
          </ul>
        </div>

        <div>
          <label className="text-xs text-slate-400">Intervention Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200"
          />
        </div>

        {!isEngaged && (
          <div>
            <label className="text-xs text-slate-400">
              Type <strong className="text-red-400">KILL</strong> to confirm emergency execution:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
              placeholder="KILL"
              className="w-full mt-1 bg-slate-950 border border-red-800 rounded-lg p-2.5 text-xs font-mono font-bold text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={(!isEngaged && confirmInput !== 'KILL') || loading}
            className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isEngaged
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
            }`}
          >
            {loading ? 'Executing...' : isEngaged ? 'Reset Kill Switch' : 'CONFIRM KILL'}
          </button>
        </div>
      </div>
    </div>
  );
};
