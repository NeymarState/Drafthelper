import React from 'react';
import { Trophy, RefreshCw, Download, Layers, Users, Award, Zap } from 'lucide-react';
import { DraftSettings } from '../types';
import { getFormattedPick, calculateNextPick } from '../utils/calculations';

interface HeaderProps {
  settings: DraftSettings;
  onUpdateSettings: (newSettings: Partial<DraftSettings>) => void;
  onResetDraft: () => void;
  onOpenExportModal: () => void;
  totalDraftedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onResetDraft,
  onOpenExportModal,
  totalDraftedCount,
}) => {
  const currentPickInfo = getFormattedPick(settings.currentOverallPick, settings.leagueSize);

  return (
    <header id="main-header" className="bg-slate-900/90 border-b border-slate-700 text-slate-100 shadow-xl sticky top-0 z-40 backdrop-blur-md">
      {/* Top Banner */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-md shadow-blue-600/30 shrink-0">
            <Trophy className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              COMMAND CENTER
              <span className="text-blue-500 text-xs font-mono font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                2026.v1
              </span>
            </h1>
          </div>
        </div>

        {/* Live Pick Counter Widget & Summary */}
        <div className="flex items-center gap-3 text-xs font-mono bg-slate-800/50 px-3 py-1.5 rounded border border-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">MEIN PICK-SLOT:</span>
            {totalDraftedCount === 0 ? (
              <select
                value={settings.userPickSlot}
                onChange={(e) => onUpdateSettings({ userPickSlot: Number(e.target.value) })}
                className="bg-slate-950 border border-slate-700 text-emerald-400 font-bold rounded px-1 py-0.5 outline-none focus:border-emerald-500 cursor-pointer"
              >
                {Array.from({ length: settings.leagueSize }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            ) : (
              <span className="text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-950/30 border border-emerald-900/50 rounded">
                {settings.userPickSlot} 🔒
              </span>
            )}
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">AKTUELLER PICK:</span>
            <span className="text-blue-400 font-bold">
              #{settings.currentOverallPick} ({currentPickInfo.formattedString.split('(')[0].trim()})
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">NÄCHSTER PICK IN:</span>
            <span className="text-orange-400 font-bold">
              {(() => {
                const nextUserPick = calculateNextPick(settings.currentOverallPick, settings.userPickSlot, settings.leagueSize);
                if (nextUserPick === -1) return 'N/A';
                if (nextUserPick === settings.currentOverallPick) return 'DU BIST DRAN!';
                return `${nextUserPick - settings.currentOverallPick} Picks`;
              })()}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">GEDRAFTET:</span>
            <span className="text-emerald-400 font-bold">{totalDraftedCount} SPIELER</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="export-code-excel-btn"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-900/30 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel & Python</span>
          </button>

          <button
            id="reset-draft-btn"
            onClick={onResetDraft}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Draft-Zustand zurücksetzen"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Settings Bar */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 sm:px-6 py-1.5">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4">
            {/* League Size */}
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">LIGA:</span>
              <select
                id="league-size-select"
                value={settings.leagueSize}
                onChange={(e) => onUpdateSettings({ leagueSize: Number(e.target.value) })}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-blue-500"
              >
                {[8, 10, 12, 14, 16].map((size) => (
                  <option key={size} value={size}>
                    {size}-TEAM ({size * 15} PICKS)
                  </option>
                ))}
              </select>
            </div>

            {/* Scoring Mode */}
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">SCORING:</span>
              <div className="flex bg-slate-900 p-0.5 rounded border border-slate-750">
                {(['Half-PPR', 'Full-PPR', 'Standard'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => onUpdateSettings({ scoringFormat: fmt })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      settings.scoringFormat === fmt
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* League Type */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">FORMAT:</span>
              <div className="flex bg-slate-900 p-0.5 rounded border border-slate-750">
                {(['Redraft', 'Dynasty'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onUpdateSettings({ leagueType: type })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      settings.leagueType === type
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Pick Override Control */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">PICK ÄNDERN:</span>
            <input
              type="number"
              min={1}
              max={240}
              value={settings.currentOverallPick}
              onChange={(e) => onUpdateSettings({ currentOverallPick: Math.max(1, Number(e.target.value)) })}
              className="w-16 bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-0.5 font-mono text-center text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
