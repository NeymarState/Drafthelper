import React, { useState } from 'react';
import { Player, DraftSettings, RosterState, AlertItem, Position } from '../types';
import { getAdjustedProjection, calculateVORP, getFormattedPick, calculatePickProbability } from '../utils/calculations';
import { AlertsBanner } from './AlertsBanner';
import { VORPChart } from './VORPChart';
import { DraftTracker } from './DraftTracker';
import { DraftEvaluationModal } from './DraftEvaluationModal';
import { Zap, Award, Target, TrendingUp, Search, RotateCcw, ShieldAlert, Activity, Ghost, X, Sparkles } from 'lucide-react';

interface DashboardTabProps {
  players: Player[];
  userTeam: Player[];
  roster: RosterState;
  settings: DraftSettings;
  alerts: AlertItem[];
  onDraftForMe: (player: Player) => void;
  onDraftForOpponent: (player: Player) => void;
  onRemoveFromTeam: (player: Player) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  players,
  userTeam,
  roster,
  settings,
  alerts,
  onDraftForMe,
  onDraftForOpponent,
  onRemoveFromTeam,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPos, setSelectedPos] = useState<Position | 'ALL' | 'FLEX'>('ALL');
  const [showDrafted, setShowDrafted] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [hideQB, setHideQB] = useState(false);
  const [hideTE, setHideTE] = useState(false);
  const [hideK, setHideK] = useState(false);
  const [hideDST, setHideDST] = useState(false);
  const [sortBy, setSortBy] = useState<'OVR' | 'ADP'>('OVR');
  
  const getPosBadgeClass = (pos: string) => {
    switch (pos) {
      case 'RB':
        return 'bg-green-500/20 text-green-400';
      case 'WR':
        return 'bg-blue-500/20 text-blue-400';
      case 'TE':
        return 'bg-orange-500/20 text-orange-400';
      case 'QB':
        return 'bg-red-500/20 text-red-400';
      case 'K':
        return 'bg-purple-500/20 text-purple-400';
      case 'DST':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };
  // Stack target logic
  const myQbTeams = userTeam.filter(p => p.pos === 'QB').map(p => p.team);
  const myFlexTeams = userTeam.filter(p => ['WR', 'RB', 'TE'].includes(p.pos)).map(p => p.team);

  const isStackTarget = (player: Player) => {
    if (['WR', 'RB', 'TE'].includes(player.pos) && myQbTeams.includes(player.team)) return true;
    if (player.pos === 'QB' && myFlexTeams.includes(player.team)) return true;
    return false;
  };

  const isOverlapWarning = (player: Player) => {
    // Wenn es sich um einen Skill-Player handelt und wir bereits einen Skill-Player von demselben Team haben
    if (['WR', 'RB', 'TE'].includes(player.pos) && myFlexTeams.includes(player.team)) {
      return true;
    }
    return false;
  };

  // Filter and sort players für the Dashboard Draft List
  const displayPlayers = players
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q);
      
      const matchesPos = selectedPos === 'ALL' 
        ? true 
        : selectedPos === 'FLEX' 
          ? ['RB', 'WR', 'TE'].includes(p.pos)
          : p.pos === selectedPos;
          
      const matchesStatus = showDrafted ? true : p.status === 'VERFÜGBAR';

      if (hideQB && p.pos === 'QB') return false;
      if (hideTE && p.pos === 'TE') return false;
      if (hideK && p.pos === 'K') return false;
      if (hideDST && p.pos === 'DST') return false;
      
      return matchesSearch && matchesPos && matchesStatus;
    })
    .map((p) => ({
      ...p,
      vorp: calculateVORP(p, players, settings.scoringFormat, settings.leagueSize),
      adjustedProj: getAdjustedProjection(p, settings.scoringFormat),
      pickInfo: getFormattedPick(p.ovrRank, settings.leagueSize),
    }))
    .sort((a, b) => {
      if (sortBy === 'ADP') {
        const adpA = a.adp && a.adp > 0 ? a.adp : 999;
        const adpB = b.adp && b.adp > 0 ? b.adp : 999;
        return adpA - adpB;
      }
      return a.ovrRank - b.ovrRank;
    })
    .slice(0, 15); // Show top 15 in Dashboard

  // Total Projected Points für Starter Lineup
  const starterPlayers = [
    roster.QB,
    roster.RB1,
    roster.RB2,
    roster.WR1,
    roster.WR2,
    roster.TE,
    roster.FLEX,
    roster.DST,
    roster.K,
  ].filter((p): p is Player => p !== null);

  const totalStarterProj = starterPlayers.reduce(
    (sum, p) => sum + getAdjustedProjection(p, settings.scoringFormat),
    0
  );

  // Stack teams in user team
  const qbTeam = roster.QB?.team;

  const renderRosterCard = (slotLabel: string, player: Player | null, isFlex = false) => {
    const isStack = player && qbTeam && player.pos !== 'QB' && player.team === qbTeam;

    return (
      <div
        className={`border rounded-lg p-2.5 flex items-center justify-between gap-3 transition-all text-xs ${
          player
            ? isStack
              ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-100'
              : 'bg-emerald-900/20 border-emerald-500/30 text-slate-200'
            : 'bg-slate-950/60 border-slate-800 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-8 rounded bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-mono shrink-0">
            <span className={`text-[11px] font-bold ${player ? 'text-emerald-400' : 'text-slate-400'}`}>
              {slotLabel}
            </span>
          </div>

          {player ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-xs">{player.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${getPosBadgeClass(player.pos)} font-bold`}>
                  {player.posRank}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {player.team}
                </span>
                {isStack && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-blue-400" /> STACK
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                <span>Bye {player.bye}</span>
                <span>•</span>
                <span className="text-slate-300">{player.tier}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs italic text-slate-600">
              {isFlex ? 'Leer (FLEX Position frei)' : `Leer...`}
            </div>
          )}
        </div>

        {player ? (
          <div className="flex items-center gap-3">
            <div className="text-right font-mono text-xs">
              <div className="font-bold text-white">
                {getAdjustedProjection(player, settings.scoringFormat)} <span className="text-[10px] text-slate-400 font-normal">pts</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">
                +{calculateVORP(player, players, settings.scoringFormat, settings.leagueSize)} VORP
              </div>
            </div>
            <button
              onClick={() => onRemoveFromTeam(player)}
              className="text-slate-500 hover:text-rose-400 p-1 text-xs transition-colors cursor-pointer"
              title="Vom Team entfernen"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-slate-600 font-mono uppercase">Unbesetzt</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Live Alerts Header */}
      <AlertsBanner alerts={alerts} />
      <VORPChart allPlayers={players} scoringFormat={settings.scoringFormat} leagueSize={settings.leagueSize} />

      {/* Main Grid: Live Team Roster + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Starters & Bench Roster */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
            <div className="p-3 border-b border-slate-700 bg-slate-800/40 flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-400" /> MEIN ROSTER (STARTERS)
              </h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowEvaluation(true)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold shadow-lg transition-colors border border-indigo-500/50"
                >
                  <Sparkles className="w-3 h-3" /> BEWERTUNG
                </button>
                <div className="text-right font-mono text-xs hidden sm:block">
                  <span className="text-slate-400 text-[10px] mr-2">STARTER PROJ:</span>
                  <span className="text-emerald-400 font-bold text-sm">{Math.round(totalStarterProj * 10) / 10} PTS</span>
                </div>
              </div>
            </div>

            {/* Starter Slots */}
            <div className="p-3 space-y-2">
              {renderRosterCard('QB', roster.QB)}
              {renderRosterCard('RB1', roster.RB1)}
              {renderRosterCard('RB2', roster.RB2)}
              {renderRosterCard('WR1', roster.WR1)}
              {renderRosterCard('WR2', roster.WR2)}
              {renderRosterCard('TE', roster.TE)}
              {renderRosterCard('FLEX', roster.FLEX, true)}
              {renderRosterCard('DST', roster.DST)}
              {renderRosterCard('K', roster.K)}
            </div>
          </div>

          {/* Bench Roster */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
            <div className="p-3 border-b border-slate-700 bg-slate-800/40 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                BENCH SPIELER ({roster.BENCH.length})
              </h3>
              <span className="text-[10px] font-mono text-slate-500">TIEFENPLÄTZE & HANDCUFFS</span>
            </div>

            <div className="p-3">
              {roster.BENCH.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roster.BENCH.map((player) => (
                    <div key={player.id} className="bg-slate-950 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-200 flex items-center gap-1.5">
                          <span>{player.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border border-transparent ${getPosBadgeClass(player.pos)}`}>
                            {player.posRank}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>{player.team} • Bye {player.bye}</span>
                          <span>•</span>
                          <span className="text-slate-300">{player.tier}</span>
                          {player.customTag && player.customTag !== '' && (
                            <span className={`text-[8px] font-mono px-1 rounded font-bold border flex items-center gap-0.5
                              ${player.customTag === 'Sleeper' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 
                                player.customTag === 'Target' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 
                                player.customTag === 'Avoid' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                                player.customTag === 'Fade' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 
                                player.customTag === 'Rookie' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : 
                                'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                              {player.customTag === 'Sleeper' && <Zap className="w-2 h-2" />}
                              {player.customTag === 'Target' && <Target className="w-2 h-2" />}
                              {player.customTag === 'Avoid' && <ShieldAlert className="w-2 h-2" />}
                              {player.customTag === 'Sleeper' ? 'Sleeper' : 
                               player.customTag === 'Target' ? 'Target' : 
                               player.customTag === 'Avoid' ? 'Avoid' : 
                               player.customTag === 'Fade' ? 'Fade' : 
                               player.customTag === 'Rookie' ? 'Rookie' : 
                               'Value'}
                            </span>
                          )}
                          {player.playerArchetype && (
                            <span className={`text-[8px] font-mono px-1 rounded font-bold border ${player.playerArchetype === 'Upside' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-700/20 text-slate-400 border-slate-700/30'}`}>
                              {player.playerArchetype === 'Upside' ? '⬆️ Upside' : '📊 Baseline'}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveFromTeam(player)}
                        className="text-slate-500 hover:text-rose-400 text-xs px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-xs text-slate-500 italic font-mono">
                  Noch keine Ersatzspieler auf der Bank gedraftet.
                </div>
              )}
            </div>
          </div>
          
          {/* Draft Needs Chart */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
              <Target className="w-4 h-4 text-blue-400" /> DRAFT BEDARF (TEAM NEEDS)
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { pos: 'QB', target: 1, current: userTeam.filter((p) => p.pos === 'QB').length, color: 'bg-red-500' },
                { pos: 'RB', target: 5, current: userTeam.filter((p) => p.pos === 'RB').length, color: 'bg-green-500' },
                { pos: 'WR', target: 5, current: userTeam.filter((p) => p.pos === 'WR').length, color: 'bg-blue-500' },
                { pos: 'TE', target: 1, current: userTeam.filter((p) => p.pos === 'TE').length, color: 'bg-orange-500' },
              ].map((need) => {
                const fillPercent = Math.min((need.current / need.target) * 100, 100);
                const isComplete = need.current >= need.target;
                return (
                  <div key={need.pos} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-[11px] text-slate-300">{need.pos}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {need.current}/{need.target}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${need.color} ${
                          isComplete ? 'opacity-50' : ''
                        }`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DraftTracker players={players} settings={settings} />
        </div>

        {/* Right Column: Dynamic Draft Assistant & Best VORP Available */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Draft Pool (Filtered & Sorted by Rank) */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col h-[500px] transition-colors">
            <div className="p-3 border-b border-slate-700 bg-slate-800/40 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-400">
                  <Target className="w-4 h-4 text-emerald-400" />
                  LIVE DRAFT POOL
                </h3>
              </div>
              <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDrafted}
                  onChange={(e) => setShowDrafted(e.target.checked)}
                  className="accent-blue-500 rounded bg-slate-900 border-slate-700"
                />
                Gedraftete
              </label>

              <div className="flex flex-wrap gap-2 w-full">
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Suche..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 rounded px-2 py-1 pl-7 pr-7 text-[11px] focus:outline-none focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                <div className="flex bg-slate-900 border border-slate-700 rounded p-0.5 w-full">
                  {(['ALL', 'FLEX', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setSelectedPos(pos)}
                      className={`flex-1 px-1 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
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
                    onClick={() => setHideK(!hideK)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors border ${
                      hideK ? 'bg-purple-900/50 text-purple-400 border-purple-500/50' : 'bg-slate-950 text-slate-500 border-slate-700'
                    }`}
                  >
                    NO K
                  </button>
                  <button
                    onClick={() => setHideDST(!hideDST)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors border ${
                      hideDST ? 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50' : 'bg-slate-950 text-slate-500 border-slate-700'
                    }`}
                  >
                    NO DST
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
              {displayPlayers.map((player, index) => {
                const isDrafted = player.status !== 'VERFÜGBAR';
                const previousPlayer = index > 0 ? displayPlayers[index - 1] : null;
                const isNewTier = selectedPos !== 'ALL' && previousPlayer && player.tier !== previousPlayer.tier;
                // Add current pick line if sorting by ovrRank puts us exactly crossing the current pick, or if the very first player is already below the pick
                const crossesCurrentPick = selectedPos === 'ALL' && (
                  (index === 0 && player.ovrRank >= settings.currentOverallPick) ||
                  (previousPlayer && player.ovrRank >= settings.currentOverallPick && previousPlayer.ovrRank < settings.currentOverallPick)
                );
                
                return (
                  <React.Fragment key={player.id}>
                    {crossesCurrentPick && (
                      <div className="flex items-center gap-4 my-3 opacity-80">
                        <div className="h-px bg-blue-500/50 flex-1"></div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-950 px-2 rounded-full border border-blue-500/50 flex items-center gap-1 shadow-lg shadow-blue-500/20">
                          <Target className="w-3 h-3" /> Aktueller Pick ({settings.currentOverallPick})
                        </span>
                        <div className="h-px bg-blue-500/50 flex-1"></div>
                      </div>
                    )}
                    {isNewTier && (
                      <div className="flex items-center gap-4 my-3">
                        <div className="h-px bg-slate-700/80 flex-1"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800/80 px-2 rounded-full border border-slate-700/80 shadow-md">
                          Tier Break: {player.tier}
                        </span>
                        <div className="h-px bg-slate-700/80 flex-1"></div>
                      </div>
                    )}
                    <div
                      className={`bg-slate-950 border rounded-lg p-2.5 transition-all flex items-center justify-between gap-2 group ${
                        isDrafted ? 'border-slate-800 opacity-60' : 'border-slate-800 hover:border-blue-500/50'
                      }`}
                    >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold text-xs flex items-center gap-1 ${isDrafted ? 'text-slate-500 line-through' : 'text-slate-100 group-hover:text-blue-400'} transition-colors`}>
                          {player.name} <span className="text-[10px] text-slate-500 font-normal">({player.team})</span>
                          {isStackTarget(player) && (
                            <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5" /> STACK
                            </span>
                          )}
                          {isOverlapWarning(player) && (
                            <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-0.5" title="Du hast bereits einen WR, RB oder TE von diesem Team!">
                              ⚠️ OVERLAP
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
                                player.customTag === 'Rookie' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : 
                                'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                              {player.customTag === 'Sleeper' ? '💤 Sleeper' : 
                               player.customTag === 'Target' ? '🎯 Target' : 
                               player.customTag === 'Avoid' ? '⛔ Avoid' : 
                               player.customTag === 'Fade' ? '📉 Fade' : 
                               player.customTag === 'Rookie' ? '👶 Rookie' : 
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
                          {player.status === 'VERFÜGBAR' && settings.currentOverallPick - player.ovrRank >= 10 && (
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

                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 font-mono">
                        <span className={player.vorp > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {player.vorp > 0 ? '+' : ''}{player.vorp} VORP
                        </span>
                        {player.adp !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400">
                              ADP {getFormattedPick(player.adp, settings.leagueSize).formattedString}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {!isDrafted ? (
                        <>
                          <button
                            onClick={() => onDraftForMe(player as Player)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all shadow cursor-pointer"
                            title="Mein Team"
                          >
                            + Team
                          </button>
                          <button
                            onClick={() => onDraftForOpponent(player as Player)}
                            className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold transition-all shadow cursor-pointer"
                            title="Gegner"
                          >
                            GEGNER
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onRemoveFromTeam(player as Player)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-[10px] border border-slate-700 cursor-pointer transition-colors font-bold"
                          title="Pick rückgängig machen"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>
                  </div>
                  </React.Fragment>
                );
              })}
              
              {displayPlayers.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-500 italic">
                  Keine Spieler gefunden.
                </div>
              )}
            </div>
          </div>

          {/* Quick Roster Strategy Summary */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-4 h-4 text-blue-400" /> DRAFT STRATEGIE & VALUE GUIDE
            </h4>
            <div className="text-slate-300 space-y-2 leading-relaxed text-[11px]">
              <p>
                • <strong className="text-blue-400">Scarcity Focus:</strong> Achte auf Positionsabfälle (Tier Drops) bei RBs und WRs vor Pick-Runden.
              </p>
              <p>
                • <strong className="text-emerald-400">Stack Radar:</strong> Nutze QB + WR/TE Paare für Korrelations-Boni in wöchentlichen Matchups.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showEvaluation && (
        <DraftEvaluationModal
          onClose={() => setShowEvaluation(false)}
          players={players}
          userTeam={userTeam}
          settings={settings}
        />
      )}
    </div>
  );
};


