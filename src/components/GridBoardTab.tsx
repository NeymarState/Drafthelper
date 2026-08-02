import React, { useState } from 'react';
import { Player, DraftSettings, Position, AlertItem } from '../types';
import { Search, Maximize2, Minimize2 } from 'lucide-react';
import { getFormattedPick, calculateNextPick, analyzeOpponentNeeds, calculatePickProbability } from '../utils/calculations';
import { AlertsBanner } from './AlertsBanner';

interface GridBoardTabProps {
  players: Player[];
  settings: DraftSettings;
  alerts: AlertItem[];
  onDraftForMe: (player: Player) => void;
  onDraftForOpponent: (player: Player) => void;
  onResetStatus: (player: Player) => void;
}

export const GridBoardTab: React.FC<GridBoardTabProps> = ({
  players,
  settings,
  alerts,
  onDraftForMe,
  onDraftForOpponent,
  onResetStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPos, setSelectedPos] = useState<Position | 'ALL' | 'FLEX'>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getPosBadgeClass = (pos: string) => {
    switch (pos) {
      case 'RB': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'WR': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'TE': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'QB': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'K': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'DST': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getCellBgClass = (pos: string | undefined) => {
    switch (pos) {
      case 'RB': return 'bg-green-900/40 border-green-700/50';
      case 'WR': return 'bg-blue-900/40 border-blue-700/50';
      case 'TE': return 'bg-orange-900/40 border-orange-700/50';
      case 'QB': return 'bg-red-900/40 border-red-700/50';
      case 'K': return 'bg-purple-900/40 border-purple-700/50';
      case 'DST': return 'bg-yellow-900/40 border-yellow-700/50';
      default: return 'bg-slate-800 border-slate-700';
    }
  };

  const numRounds = 16;
  const leagueSize = settings.leagueSize;
  const rounds = Array.from({ length: numRounds }, (_, i) => i + 1);
  const teams = Array.from({ length: leagueSize }, (_, i) => i + 1);

  const getPickForCell = (round: number, col: number) => {
    if (round % 2 === 1) {
      return (round - 1) * leagueSize + col;
    } else {
      return (round - 1) * leagueSize + (leagueSize - col + 1);
    }
  };

  const nextUserPick = calculateNextPick(settings.currentOverallPick, settings.userPickSlot, leagueSize);
  const upcomingNeeds = analyzeOpponentNeeds(settings.currentOverallPick, leagueSize, players);

  const displayPlayers = players
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q);
      const matchesPos = selectedPos === 'ALL' 
        ? true 
        : selectedPos === 'FLEX' 
          ? ['RB', 'WR', 'TE'].includes(p.pos)
          : p.pos === selectedPos;
      return matchesSearch && matchesPos && p.status === 'Verfügbar';
    })
    .sort((a, b) => a.ovrRank - b.ovrRank)
    .slice(0, 50);

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-[#0f172a] p-4 flex flex-col gap-4"
    : "flex flex-col h-[calc(100vh-6rem)] gap-4";

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-center mb-[-0.5rem]">
        <h2 className="text-slate-300 font-bold tracking-wider flex items-center gap-2">
          GRID BOARD
          {isFullscreen && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">VOLLBILD</span>}
        </h2>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 text-xs font-bold transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          {isFullscreen ? 'Beenden' : 'Vollbild'}
        </button>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-lg shadow-xl relative">
        <div className="min-w-max p-4">
          <div className="flex sticky top-0 bg-slate-900 z-10 pb-2 border-b border-slate-700 mb-2">
            <div className="w-8 shrink-0 flex items-end pb-2 font-bold text-slate-500 text-[10px] text-center justify-center">Rnd</div>
            {teams.map(col => (
              <div key={col} className={`w-24 shrink-0 px-1 text-center pb-2 text-[10px] font-bold uppercase tracking-wider ${col === settings.userPickSlot ? 'text-emerald-400' : 'text-slate-400'}`}>
                Team {col}
                {col === settings.userPickSlot && <div className="text-[9px] text-emerald-500/70">DU</div>}
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            {rounds.map(round => (
              <div key={round} className="flex gap-2">
                <div className="w-8 shrink-0 flex items-center justify-center font-bold text-slate-500 text-xs">
                  {round}
                </div>
                {teams.map(col => {
                  const pickNum = getPickForCell(round, col);
                  const draftedPlayer = players.find(p => p.draftedAtPick === pickNum);
                  const isUserTurn = col === settings.userPickSlot;
                  const isCurrentPick = pickNum === settings.currentOverallPick;

                  return (
                    <div 
                      key={col} 
                      onClick={() => {
                        if (draftedPlayer && pickNum === settings.currentOverallPick - 1) {
                          onResetStatus(draftedPlayer);
                        }
                      }}
                      className={`w-24 shrink-0 h-13 rounded flex flex-col p-1 border transition-all ${draftedPlayer && pickNum === settings.currentOverallPick - 1 ? 'cursor-pointer hover:border-red-500 hover:opacity-80' : ''} ${
                        draftedPlayer 
                          ? getCellBgClass(draftedPlayer.pos)
                          : isCurrentPick 
                            ? 'bg-slate-800 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                            : isUserTurn
                              ? 'bg-emerald-950/20 border-emerald-900/30'
                              : 'bg-slate-950/50 border-slate-800/60'
                      }`}
                      title={draftedPlayer && pickNum === settings.currentOverallPick - 1 ? 'Klicken, um diesen Pick rückgängig zu machen' : ''}
                    >
                      <div className="flex justify-between items-start mb-0.5 leading-none">
                        <span className="text-[9px] text-slate-500 font-mono">
                          {getFormattedPick(pickNum, leagueSize).formattedString.split('(')[0].trim().replace('Rd', 'R')}
                        </span>
                        {draftedPlayer && (
                          <span className={`text-[8px] font-mono px-1 rounded font-bold ${getPosBadgeClass(draftedPlayer.pos)}`}>
                            {draftedPlayer.pos}
                          </span>
                        )}
                      </div>
                      
                      {draftedPlayer ? (
                        <div className="flex flex-col flex-1 overflow-hidden justify-start">
                          <span className="font-bold text-[10px] text-slate-100 leading-tight line-clamp-2" title={draftedPlayer.name}>
                            {draftedPlayer.name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          {isCurrentPick && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="shrink-0">
        <AlertsBanner alerts={alerts} />
      </div>

      {/* Bottom Area: Live Draft Pool + Opponent Needs */}
      <div className="h-64 shrink-0 flex gap-4">
        {/* Live Draft Pool */}
        <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Live Draft Pool</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Suche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-slate-950 border border-slate-700 text-slate-100 rounded px-3 py-1 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex bg-slate-950 p-0.5 rounded border border-slate-700">
                {(['ALL', 'FLEX', 'QB', 'RB', 'WR', 'TE'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setSelectedPos(pos)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      selectedPos === pos
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar pr-2 space-y-1.5">
            {displayPlayers.map(player => {
              const prob = calculatePickProbability(player, settings.currentOverallPick, nextUserPick, upcomingNeeds);
              return (
                <div key={player.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded p-2 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 flex flex-col items-center">
                      <span className={`text-[10px] font-mono px-1 py-0.5 rounded font-bold ${getPosBadgeClass(player.pos)}`}>
                        {player.pos}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">#{player.ovrRank}</span>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-200">{player.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{player.team} • Bye {player.bye}</span>
                        <span className={`px-1.5 rounded-sm text-[9px] font-bold ${prob.colorClass}`}>
                          {prob.percent}% Chance bis Pick {nextUserPick}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onDraftForMe(player)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow transition-colors"
                    >
                      DRAFT (ME)
                    </button>
                    <button
                      onClick={() => onDraftForOpponent(player)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded shadow transition-colors"
                    >
                      GEGNER
                    </button>
                  </div>
                </div>
              );
            })}
            {displayPlayers.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-xs italic">Keine Spieler gefunden.</div>
            )}
          </div>
        </div>

        {/* Opponent Analysis */}
        <div className="w-64 shrink-0 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 flex flex-col">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">Gegner Analyse</h3>
          <div className="text-xs text-slate-400 mb-2">Die nächsten 5 Picks und ihre wahrscheinlichen Needs:</div>
          <div className="flex-1 overflow-auto custom-scrollbar space-y-2 pr-1">
            {upcomingNeeds.map((need, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded p-2">
                <div className="font-bold text-slate-300 text-[11px] mb-1">
                  Pick {need.pickSlot} (Team {need.team}) {need.team === settings.userPickSlot && <span className="text-emerald-400"> DU</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {need.needsQB && <span className="text-[9px] bg-red-900/30 text-red-400 border border-red-700/50 px-1 rounded">Braucht QB</span>}
                  {need.needsTE && <span className="text-[9px] bg-orange-900/30 text-orange-400 border border-orange-700/50 px-1 rounded">Braucht TE</span>}
                  {need.zeroRB && <span className="text-[9px] bg-red-600/50 text-white border border-red-500 font-bold px-1 rounded">🚨 KEIN RB!</span>}
                  {!need.zeroRB && need.needsRB && <span className="text-[9px] bg-green-900/30 text-green-400 border border-green-700/50 px-1 rounded">Braucht RB</span>}
                  {need.zeroWR && <span className="text-[9px] bg-red-600/50 text-white border border-red-500 font-bold px-1 rounded">🚨 KEIN WR!</span>}
                  {!need.zeroWR && need.needsWR && <span className="text-[9px] bg-blue-900/30 text-blue-400 border border-blue-700/50 px-1 rounded">Braucht WR</span>}
                  {need.needsK && <span className="text-[9px] bg-purple-900/30 text-purple-400 border border-purple-700/50 px-1 rounded">Braucht Kicker</span>}
                  {need.needsDST && <span className="text-[9px] bg-yellow-900/30 text-yellow-400 border border-yellow-700/50 px-1 rounded">Braucht Defense</span>}
                  
                  {!need.needsQB && !need.needsTE && !need.needsRB && !need.needsWR && !need.needsK && !need.needsDST && (
                    <span className="text-[9px] text-slate-500">Keine dringenden Needs</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
