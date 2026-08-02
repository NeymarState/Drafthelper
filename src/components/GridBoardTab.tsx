import React, { useState } from 'react';
import { Player, DraftSettings, Position, AlertItem } from '../types';
import { Search, Maximize2, Minimize2 } from 'lucide-react';
import { getFormattedPick, calculateNextPick, analyzeOpponentNeeds, calculatePickProbability } from '../utils/calculations';
import { AlertsBanner } from './AlertsBanner';

interface GridBoardTabProps {
  players: Player[];
  userTeam: Player[];
  settings: DraftSettings;
  alerts: AlertItem[];
  onDraftForMe: (player: Player) => void;
  onDraftForOpponent: (player: Player) => void;
  onResetStatus: (player: Player) => void;
}

export const GridBoardTab: React.FC<GridBoardTabProps> = ({
  players,
  userTeam,
  settings,
  alerts,
  onDraftForMe,
  onDraftForOpponent,
  onResetStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPos, setSelectedPos] = useState<Position | 'ALL' | 'FLEX'>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sortBy, setSortBy] = useState<'OVR' | 'ADP'>('OVR');
  const [hideQB, setHideQB] = useState(false);
  const [hideTE, setHideTE] = useState(false);
  const [showDrafted, setShowDrafted] = useState(false);

  // Stack logic
  const myQbTeams = userTeam.filter(p => p.pos === 'QB').map(p => p.team);
  const myFlexTeams = userTeam.filter(p => ['WR', 'RB', 'TE'].includes(p.pos)).map(p => p.team);

  const isStackTarget = (player: Player) => {
    if (['WR', 'RB', 'TE'].includes(player.pos) && myQbTeams.includes(player.team)) return true;
    if (player.pos === 'QB' && myFlexTeams.includes(player.team)) return true;
    return false;
  };

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
      const isDrafted = p.status !== 'Verfügbar';
      
      if (hideQB && p.pos === 'QB') return false;
      if (hideTE && p.pos === 'TE') return false;
      if (!showDrafted && isDrafted) return false;
      
      return matchesSearch && matchesPos;
    })
    .sort((a, b) => {
      if (sortBy === 'ADP') {
        const adpA = a.adp && a.adp > 0 ? a.adp : 999;
        const adpB = b.adp && b.adp > 0 ? b.adp : 999;
        return adpA - adpB;
      }
      return a.ovrRank - b.ovrRank;
    })
    .slice(0, 50);

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-[#0f172a] p-4 flex flex-col gap-4"
    : "flex flex-col h-[calc(100vh-6rem)] gap-4";

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-center mb-[-0.5rem] shrink-0">
        <h2 className="text-slate-300 font-bold tracking-wider flex items-center gap-2">
          GRID BOARD
          {isFullscreen && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">VOLLBILD</span>}
        </h2>

        {isFullscreen && (
          <div className="flex items-center gap-3 text-[10px] font-mono bg-slate-800/50 px-3 py-1.5 rounded border border-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">AKTUELLER PICK:</span>
              <span className="text-blue-400 font-bold">
                #{settings.currentOverallPick} ({getFormattedPick(settings.currentOverallPick, leagueSize).formattedString.split('(')[0].trim()})
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">NÄCHSTER PICK IN:</span>
              <span className="text-orange-400 font-bold">
                {nextUserPick === -1 ? 'N/A' : nextUserPick === settings.currentOverallPick ? 'DU BIST DRAN!' : `${nextUserPick - settings.currentOverallPick} Picks`}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 text-xs font-bold transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          {isFullscreen ? 'Beenden' : 'Vollbild'}
        </button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Column: Grid + Live Draft Pool */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Grid Area */}
          <div className="flex-1 overflow-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-lg shadow-xl relative">
            <div className="min-w-max p-4">
              <div className="flex gap-2 sticky top-0 bg-slate-900 z-10 pb-2 border-b border-slate-700 mb-2">
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
                            <span className="text-[9px] text-slate-500 font-mono" title={`Pick ${pickNum}`}>
                              {(() => {
                                const formatted = getFormattedPick(pickNum, leagueSize);
                                return `${formatted.round}.${String(formatted.pickInRound).padStart(2, '0')} (${pickNum}.)`;
                              })()}
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

          {/* Live Draft Pool */}
          <div className="h-64 shrink-0 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Live Draft Pool</h3>
                <div className="flex bg-slate-950 p-0.5 rounded border border-slate-700">
                  <button
                    onClick={() => setSortBy('OVR')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      sortBy === 'OVR' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    OVR
                  </button>
                  <button
                    onClick={() => setSortBy('ADP')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      sortBy === 'ADP' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ADP
                  </button>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Suche..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-32 bg-slate-950 border border-slate-700 text-slate-100 rounded px-3 py-1 text-xs focus:outline-none focus:border-blue-500"
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
                <div className="flex gap-1">
                  <button
                    onClick={() => setHideQB(!hideQB)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors border ${
                      hideQB ? 'bg-red-900/50 text-red-400 border-red-500/50' : 'bg-slate-950 text-slate-500 border-slate-700'
                    }`}
                  >
                    NO QB
                  </button>
                  <button
                    onClick={() => setHideTE(!hideTE)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors border ${
                      hideTE ? 'bg-orange-900/50 text-orange-400 border-orange-500/50' : 'bg-slate-950 text-slate-500 border-slate-700'
                    }`}
                  >
                    NO TE
                  </button>
                  <button
                    onClick={() => setShowDrafted(!showDrafted)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors border ${
                      showDrafted ? 'bg-slate-700 text-slate-200 border-slate-500' : 'bg-slate-950 text-slate-500 border-slate-700'
                    }`}
                  >
                    ALL
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar pr-2 space-y-1.5">
              {displayPlayers.map(player => {
                const predictorTargetPick = nextUserPick === settings.currentOverallPick
                  ? calculateNextPick(settings.currentOverallPick + 1, settings.userPickSlot, leagueSize)
                  : nextUserPick;
                  
                const prob = calculatePickProbability(player, settings.currentOverallPick, predictorTargetPick, upcomingNeeds);
                const expectedPick = player.adp && player.adp > 0 ? player.adp : player.ovrRank;
                
                const isDrafted = player.status !== 'Verfügbar';
                
                return (
                  <div key={player.id} className={`flex flex-col bg-slate-950 border rounded-lg p-2 transition-colors gap-2 ${isDrafted ? 'border-slate-800 opacity-50' : 'border-slate-800 hover:border-slate-700'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-xs flex items-center gap-1 ${isDrafted ? 'text-slate-500 line-through' : 'text-slate-100'} transition-colors`}>
                            {player.name} <span className="text-[10px] text-slate-500 font-normal">({player.team})</span>
                            {player.customTag === 'Sleeper' && <Zap className="w-3 h-3 text-blue-400" title="Sleeper" />}
                            {player.customTag === 'Target' && <Target className="w-3 h-3 text-green-400" title="Target" />}
                            {player.customTag === 'Avoid' && <ShieldAlert className="w-3 h-3 text-rose-400" title="Avoid" />}
                            {isStackTarget(player) && (
                              <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5" /> STACK
                              </span>
                            )}
                          </span>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`text-[10px] font-mono px-1 py-0.5 rounded font-bold border border-transparent ${getPosBadgeClass(player.pos)}`}>
                              {player.posRank}
                            </span>
                            {player.rbRole && (
                              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                                {player.rbRole}
                              </span>
                            )}
                            {player.wrRole && (
                              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                                {player.wrRole}
                              </span>
                            )}
                            {player.customTag && player.customTag !== '' && (
                              <span className={`text-[9px] font-mono px-1 py-0.5 rounded font-bold border 
                                ${player.customTag === 'Sleeper' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 
                                  player.customTag === 'Target' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 
                                  player.customTag === 'Avoid' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                                  player.customTag === 'Fade' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 
                                  'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                {player.customTag === 'Sleeper' ? '💤 Sleeper' : 
                                 player.customTag === 'Target' ? '🎯 Target' : 
                                 player.customTag === 'Avoid' ? '⛔ Avoid' : 
                                 player.customTag === 'Fade' ? '📉 Fade' : 
                                 '💎 Value'}
                              </span>
                            )}
                            {player.playerArchetype && (
                              <span className={`text-[9px] font-mono px-1 py-0.5 rounded font-bold border ${player.playerArchetype === 'Upside' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-700/20 text-slate-400 border-slate-700/30'}`}>
                                {player.playerArchetype === 'Upside' ? '⬆️ Upside' : '📊 Baseline'}
                              </span>
                            )}
                            {player.isRookie && (
                              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                🌱 ROOKIE
                              </span>
                            )}
                            {player.status === 'Verfügbar' && settings.currentOverallPick - player.ovrRank >= 10 && (
                              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 font-bold border border-fuchsia-500/30">
                                💎 STEAL
                              </span>
                            )}
                            {player.adp !== undefined && player.adp - player.ovrRank >= 12 && (
                              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30" title={`ADP: ${player.adp} | Rank: ${player.ovrRank}`}>
                                📈 UNDERVALUED
                              </span>
                            )}
                            {player.adp !== undefined && player.ovrRank - player.adp >= 12 && (
                              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30" title={`ADP: ${player.adp} | Rank: ${player.ovrRank}`}>
                                📉 OVERVALUED
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 font-mono mt-1.5">
                          <span className={player.vorp > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                            {player.vorp > 0 ? '+' : ''}{player.vorp} VORP
                          </span>
                          <span>•</span>
                          <span>OVR #{player.ovrRank}</span>
                          {player.adp !== undefined && (
                            <>
                              <span>•</span>
                              <span className="text-blue-400">
                                ADP {getFormattedPick(player.adp, settings.leagueSize).formattedString.split('(')[0].trim()}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className="text-slate-300">Tier {player.tier}</span>
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0 flex-col items-end">
                        {!isDrafted && (
                          <div className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold mb-1 ${prob.colorClass}`}>
                            {prob.percent}% Chance bis Pick {predictorTargetPick}
                          </div>
                        )}
                        {!isDrafted && (
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => onDraftForMe(player)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded shadow transition-colors"
                            >
                              + Team
                            </button>
                            <button
                              onClick={() => onDraftForOpponent(player)}
                              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold rounded shadow transition-colors"
                            >
                              Gegner
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {displayPlayers.length === 0 && (
                <div className="text-center py-4 text-slate-500 text-xs italic">Keine Spieler gefunden.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts + Opponent Needs */}
        <div className="w-[300px] shrink-0 flex flex-col gap-4 overflow-hidden">
          {/* Alerts Area */}
          <div className="shrink-0 max-h-[40%] overflow-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Warnungen & Alerts</h3>
            <AlertsBanner alerts={alerts} />
          </div>

          {/* Opponent Analysis */}
          <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 flex flex-col min-h-0">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">Gegner Analyse</h3>
            <div className="text-xs text-slate-400 mb-2 leading-tight">Die nächsten 5 Picks und ihre wahrscheinlichen Needs:</div>
            <div className="flex-1 overflow-auto custom-scrollbar space-y-2 pr-1">
              {upcomingNeeds.map((need, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded p-2">
                  <div className="font-bold text-slate-300 text-[11px] mb-1.5">
                    Pick {need.pickSlot} (Team {need.team}) {need.team === settings.userPickSlot && <span className="text-emerald-400"> DU</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {need.needsQB && <span className="text-[9px] bg-red-900/30 text-red-400 border border-red-700/50 px-1 rounded">Braucht QB</span>}
                    {need.needsTE && <span className="text-[9px] bg-orange-900/30 text-orange-400 border border-orange-700/50 px-1 rounded">Braucht TE</span>}
                    {need.zeroRB && <span className="text-[9px] bg-red-600/50 text-white border border-red-500 font-bold px-1 rounded shadow-[0_0_8px_rgba(239,68,68,0.5)]">🚨 KEIN RB!</span>}
                    {!need.zeroRB && need.needsRB && <span className="text-[9px] bg-green-900/30 text-green-400 border border-green-700/50 px-1 rounded">Braucht RB</span>}
                    {need.zeroWR && <span className="text-[9px] bg-red-600/50 text-white border border-red-500 font-bold px-1 rounded shadow-[0_0_8px_rgba(239,68,68,0.5)]">🚨 KEIN WR!</span>}
                    {!need.zeroWR && need.needsWR && <span className="text-[9px] bg-blue-900/30 text-blue-400 border border-blue-700/50 px-1 rounded">Braucht WR</span>}
                    {need.needsK && <span className="text-[9px] bg-purple-900/30 text-purple-400 border border-purple-700/50 px-1 rounded">Braucht Kicker</span>}
                    {need.needsDST && <span className="text-[9px] bg-yellow-900/30 text-yellow-400 border border-yellow-700/50 px-1 rounded">Braucht Defense</span>}
                    
                    {!need.needsQB && !need.needsTE && !need.needsRB && !need.needsWR && !need.needsK && !need.needsDST && (
                      <span className="text-[9px] text-slate-500 italic">Keine dringenden Needs</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
