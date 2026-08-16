import React, { useState } from 'react';
import { Player, Position, DraftSettings } from '../types';
import { calculateVORP, getAdjustedProjection } from '../utils/calculations';
import { Award, AlertTriangle } from 'lucide-react';

interface TiersTabProps {
  players: Player[];
  settings: DraftSettings;
  onDraftForMe: (player: Player) => void;
  onDraftForOpponent: (player: Player) => void;
}

export const TiersTab: React.FC<TiersTabProps> = ({
  players,
  settings,
  onDraftForMe,
  onDraftForOpponent,
}) => {
  const [selectedPos, setSelectedPos] = useState<Position>('RB');

  const posPlayers = players.filter((p) => p.pos === selectedPos);

  // Group by Tier Number (safely handling optional/undefined tierNumber)
  const tierNumbers = Array.from(
    new Set(posPlayers.map((p) => (p.tierNumber !== undefined ? p.tierNumber : 1)))
  ).sort((a: number, b: number) => a - b);

  const getPosBadgeClass = (pos: Position) => {
    switch (pos) {
      case 'RB':
        return 'bg-green-500/20 text-green-400';
      case 'WR':
        return 'bg-blue-500/20 text-blue-400';
      case 'QB':
        return 'bg-red-500/20 text-red-400';
      case 'TE':
        return 'bg-amber-500/20 text-amber-400';
      default:
        return 'bg-purple-500/20 text-purple-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Position Selector Bar */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-400" />
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-100 font-mono">POSITIONAL TIERS & SCARCITY LOOKUP</h2>
        </div>

        <div className="flex bg-slate-950 p-0.5 rounded border border-slate-700 gap-1 font-mono text-xs">
          {(['RB', 'WR', 'QB', 'TE', 'DST', 'K'] as const).map((pos) => {
            const availableCount = players.filter((p) => p.pos === pos && p.status === 'VERFÜGBAR').length;
            return (
              <button
                key={pos}
                onClick={() => setSelectedPos(pos)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold text-xs transition-all cursor-pointer ${
                  selectedPos === pos
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{pos}</span>
                <span className="text-[10px] opacity-75">
                  ({availableCount})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="space-y-4">
        {tierNumbers.map((tierNum) => {
          const tierGroup = posPlayers.filter((p) => (p.tierNumber ?? 1) === tierNum);
          const tierName = tierGroup[0]?.tier || `Tier ${tierNum}`;
          const availableCount = tierGroup.filter((p) => p.status === 'VERFÜGBAR').length;
          const isUrgentScarcity = availableCount <= 2 && availableCount > 0;

          return (
            <div
              key={tierNum}
              className={`bg-slate-900 border rounded-lg p-3 shadow-xl transition-all ${
                isUrgentScarcity
                  ? 'border-amber-500/50 bg-amber-950/10'
                  : 'border-slate-700'
              }`}
            >
              {/* Tier Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-3 font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    T{tierNum}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-100 tracking-tight">{tierName}</h3>
                    <div className="text-[10px] text-slate-500">
                      {tierGroup.length} SPIELER IN TIER {tierNum}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isUrgentScarcity && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-amber-400" /> KRITISCHE KNAPPHEIT!
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      availableCount === 0
                        ? 'bg-slate-950 text-slate-500 border-slate-800'
                        : isUrgentScarcity
                        ? 'bg-amber-950 text-amber-300 border-amber-600/50'
                        : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {availableCount} / {tierGroup.length} VERFÜGBAR
                  </span>
                </div>
              </div>

              {/* Cards Grid für Tier Players */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {tierGroup.map((player) => {
                  const vorp = calculateVORP(player, players, settings.scoringFormat, settings.leagueSize);
                  const proj = getAdjustedProjection(player, settings.scoringFormat);

                  let cardStyle = 'bg-slate-950 border-slate-800';
                  if (player.status === 'Mein Team') {
                    cardStyle = 'bg-emerald-900/20 border-emerald-500/50 text-emerald-100';
                  } else if (player.status === 'Gedraftet (Gegner)') {
                    cardStyle = 'bg-slate-950/50 border-slate-850 opacity-40 line-through';
                  }

                  return (
                    <div
                      key={player.id}
                      className={`border rounded-lg p-2.5 flex flex-col justify-between gap-2 transition-all text-xs ${cardStyle}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-slate-300">RK #{player.ovrRank}</span>
                          <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${getPosBadgeClass(player.pos)}`}>
                            {player.posRank} â€¢ {player.team}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-xs text-slate-100">{player.name}</h4>
                          <div className="text-[10px] font-mono text-slate-400">Bye Week {player.bye}</div>
                        </div>

                        {/* Advanced Stats */}
                        {(player.targetShare > 0 || player.rzTouches > 0) && (
                          <div className="flex flex-wrap gap-1 pt-1 text-[10px] font-mono">
                            {player.targetShare > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                Target: {(player.targetShare * 100).toFixed(0)}%
                              </span>
                            )}
                            {player.rzTouches > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                RZ: {player.rzTouches}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer & Actions */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono">
                        <div>
                          <span className="text-slate-200 font-bold">{proj} pts</span>
                          <span className="text-emerald-400 font-bold ml-1 text-[11px]">+{vorp} VORP</span>
                        </div>

                        {player.status === 'VERFÜGBAR' ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onDraftForMe(player)}
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-all cursor-pointer"
                            >
                              + Mein Team
                            </button>
                            <button
                              onClick={() => onDraftForOpponent(player)}
                              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] cursor-pointer"
                            >
                              Gegner
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {player.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};



