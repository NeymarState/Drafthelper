import React, { useState } from 'react';
import { Player, DraftSettings, RosterState, AlertItem, Position } from '../types';
import { getAdjustedProjection, calculateVORP, getFormattedPick } from '../utils/calculations';
import { AlertsBanner } from './AlertsBanner';
import { Zap, PlusCircle, Award, Target, TrendingUp, Search, RotateCcw } from 'lucide-react';

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
  const [selectedPos, setSelectedPos] = useState<Position | 'ALL'>('ALL');
  const [showDrafted, setShowDrafted] = useState(false);
  
  const getPosBadgeClass = (pos: string) => {
    switch (pos) {
      case 'RB':
        return 'bg-blue-500/20 text-blue-400';
      case 'WR':
        return 'bg-green-500/20 text-green-400';
      case 'TE':
        return 'bg-red-500/20 text-red-400';
      case 'QB':
        return 'bg-purple-500/20 text-purple-400';
      case 'K':
        return 'bg-orange-500/20 text-orange-400';
      case 'DST':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };
  // Filter and sort players for the Dashboard Draft List
  const displayPlayers = players
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q);
      const matchesPos = selectedPos === 'ALL' || p.pos === selectedPos;
      const matchesStatus = showDrafted ? true : p.status === 'Verfügbar';
      
      return matchesSearch && matchesPos && matchesStatus;
    })
    .map((p) => ({
      ...p,
      vorp: calculateVORP(p, players, settings.scoringFormat, settings.leagueSize),
      adjustedProj: getAdjustedProjection(p, settings.scoringFormat),
      pickInfo: getFormattedPick(p.ovrRank, settings.leagueSize),
    }))
    .sort((a, b) => a.ovrRank - b.ovrRank)
    .slice(0, 15); // Show top 15 in Dashboard

  // Total Projected Points for Starter Lineup
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

      {/* Main Grid: Live Team Roster + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Starters & Bench Roster */}
        <div className="lg:col-span-8 space-y-4">
          {/* Draft Needs Chart */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
              <Target className="w-4 h-4 text-blue-400" /> DRAFT BEDARF (TEAM NEEDS)
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { pos: 'QB', target: 1, current: userTeam.filter((p) => p.pos === 'QB').length, color: 'bg-purple-500' },
                { pos: 'RB', target: 5, current: userTeam.filter((p) => p.pos === 'RB').length, color: 'bg-blue-500' },
                { pos: 'WR', target: 5, current: userTeam.filter((p) => p.pos === 'WR').length, color: 'bg-green-500' },
                { pos: 'TE', target: 1, current: userTeam.filter((p) => p.pos === 'TE').length, color: 'bg-red-500' },
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
          {/* Global Draft Tracker */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> GLOBAL DRAFT TRACKER
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {(['QB', 'RB', 'WR', 'TE'] as const).map((pos) => {
                const availablePlayers = players.filter((p) => p.pos === pos && p.status === 'Verfügbar');
                const totalAvailable = players.filter((p) => p.pos === pos).length;
                const totalDrafted = totalAvailable - availablePlayers.length;
                const fillPercent = Math.min((totalDrafted / Math.max(1, totalAvailable)) * 100, 100);
                
                const highestTier = availablePlayers.length > 0 
                  ? Math.min(...availablePlayers.map((p) => p.tierNumber || 99)) 
                  : null;
                
                // League threshold for QB and TE (typically 1 per team)
                const threshold = (pos === 'QB' || pos === 'TE') ? settings.leagueSize : null;
                const thresholdPercent = threshold ? Math.min((threshold / totalAvailable) * 100, 100) : null;
                
                const posColors: Record<string, string> = {
                  QB: 'bg-purple-500',
                  RB: 'bg-blue-500',
                  WR: 'bg-green-500',
                  TE: 'bg-red-500'
                };
                
                return (
                  <div key={pos} className="space-y-1.5 relative">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-[11px] text-slate-300 flex items-center gap-1.5">
                        {pos}
                        {highestTier && highestTier < 99 && (
                          <span className={`text-[9px] font-mono px-1 py-0.5 rounded text-white ${posColors[pos]} opacity-80`}>
                            Tier {highestTier}
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {totalDrafted}/{totalAvailable}
                      </span>
                    </div>
                    <div className="relative h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${posColors[pos]}`}
                        style={{ width: `${fillPercent}%` }}
                      />
                      {thresholdPercent !== null && (
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 shadow-[0_0_5px_rgba(244,63,94,0.8)]"
                          style={{ left: `${thresholdPercent}%` }}
                          title={`Starter-Schwelle (${threshold} Picks)`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
            <div className="p-3 border-b border-slate-700 bg-slate-800/40 flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-400" /> MEIN ROSTER (STARTERS)
              </h2>
              <div className="text-right font-mono text-xs">
                <span className="text-slate-400 text-[10px] mr-2">STARTER PROJ:</span>
                <span className="text-emerald-400 font-bold text-sm">{Math.round(totalStarterProj * 10) / 10} PTS</span>
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
              <span className="text-[10px] font-mono text-slate-500">TIEFENPLATZE & HANDCUFFS</span>
            </div>

            <div className="p-3">
              {roster.BENCH.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roster.BENCH.map((player) => (
                    <div key={player.id} className="bg-slate-950 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-200 flex items-center gap-1.5">
                          <span>{player.name}</span>
                          <span className="text-[10px] px-1 bg-slate-800 text-blue-400 rounded font-mono">{player.posRank}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{player.team} • Bye {player.bye}</div>
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
        </div>

        {/* Right Column: Dynamic Draft Assistant & Best VORP Available */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Draft Pool (Filtered & Sorted by Rank) */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-3 border-b border-slate-700 bg-slate-800/40 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-400" /> LIVE DRAFT POOL
                </h3>
                <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDrafted}
                    onChange={(e) => setShowDrafted(e.target.checked)}
                    className="accent-blue-500 rounded bg-slate-900 border-slate-700"
                  />
                  Gedraftete anzeigen
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Suche..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 rounded px-2 py-1 pl-7 text-[11px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="flex bg-slate-950 p-0.5 rounded border border-slate-700">
                  {(['ALL', 'QB', 'RB', 'WR', 'TE'] as const).map((pos) => (
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

            <div className="p-3 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
              {displayPlayers.map((player) => {
                const isDrafted = player.status !== 'Verfügbar';
                
                return (
                  <div
                    key={player.id}
                    className={`bg-slate-950 border rounded-lg p-2.5 transition-all flex items-center justify-between gap-2 group ${
                      isDrafted ? 'border-slate-800 opacity-60' : 'border-slate-800 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold text-xs ${isDrafted ? 'text-slate-500 line-through' : 'text-slate-100 group-hover:text-blue-400'} transition-colors`}>
                          {player.name}
                        </span>
                        <span className={`text-[10px] font-mono px-1 py-0.5 rounded font-bold border border-transparent ${getPosBadgeClass(player.pos)}`}>
                          {player.posRank}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                        <span className={player.vorp > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {player.vorp > 0 ? '+' : ''}{player.vorp} VORP
                        </span>
                        <span>•</span>
                        <span>OVR #{player.ovrRank}</span>
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
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] border border-slate-700 cursor-pointer"
                            title="Gegner"
                          >
                            Gegner
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
    </div>
  );
};
