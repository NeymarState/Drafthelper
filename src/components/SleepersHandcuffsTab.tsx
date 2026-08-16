import React, { useState } from 'react';
import { Player, Position, DraftSettings } from '../types';
import { calculateVORP, getAdjustedProjection, getFormattedPick } from '../utils/calculations';
import { Sparkles, ShieldAlert, Zap, Search, PlusCircle, CheckCircle2, TrendingUp, Filter, X } from 'lucide-react';

interface SleepersHandcuffsTabProps {
  players: Player[];
  userTeam: Player[];
  settings: DraftSettings;
  onDraftForMe: (player: Player) => void;
  onDraftForOpponent: (player: Player) => void;
}

export const SleepersHandcuffsTab: React.FC<SleepersHandcuffsTabProps> = ({
  players,
  userTeam,
  settings,
  onDraftForMe,
  onDraftForOpponent,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SLEEPERS' | 'HANDCUFFS' | 'INSURANCE'>('ALL');
  const [selectedPos, setSelectedPos] = useState<Position | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // Identify user's starting RBs by team
  const userRbTeams = userTeam.filter((p) => p.pos === 'RB').map((p) => p.team);

  // Helper to check if player is a sleeper
  const isSleeper = (player: Player): boolean => {
    const isLateRound = player.ovrRank > 45;
    const hasHighTargetShare = player.targetShare >= 0.18;
    const hasHighAirYards = player.airYards >= 0.22;
    const profileText = player.profile.toLowerCase();
    const hasSleeperProfile =
      profileText.includes('sleeper') ||
      profileText.includes('breakout') ||
      profileText.includes('upside') ||
      profileText.includes('target-monster') ||
      profileText.includes('volumen') ||
      profileText.includes('stehl') ||
      profileText.includes('geheimtipp');

    return (isLateRound && (hasHighTargetShare || hasHighAirYards || hasSleeperProfile)) || (player.pos === 'WR' && player.ovrRank > 50 && hasSleeperProfile);
  };

  // Helper to check if player is a handcuff
  const isHandcuff = (player: Player): boolean => {
    if (player.pos !== 'RB') return false;
    const profileText = player.profile.toLowerCase();
    const isBackupRb =
      profileText.includes('handcuff') ||
      profileText.includes('backup') ||
      profileText.includes('absicherung') ||
      profileText.includes('versicherung') ||
      profileText.includes('komplementär') ||
      profileText.includes('verletzung') ||
      profileText.includes('rotations-rb') ||
      profileText.includes('schwerpunkt');

    const isLateRb = player.ovrRank > 55 && player.tierNumber >= 4;
    return isBackupRb || isLateRb;
  };

  // Filter candidates
  const candidates = players.filter((player) => {
    const sleeperFlag = isSleeper(player);
    const handcuffFlag = isHandcuff(player);

    if (!sleeperFlag && !handcuffFlag) return false;

    if (activeFilter === 'SLEEPERS' && !sleeperFlag) return false;
    if (activeFilter === 'HANDCUFFS' && !handcuffFlag) return false;
    if (activeFilter === 'INSURANCE' && (!handcuffFlag || !userRbTeams.includes(player.team))) return false;

    if (selectedPos !== 'ALL' && player.pos !== selectedPos) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = player.name.toLowerCase().includes(q);
      const matchTeam = player.team.toLowerCase().includes(q);
      const matchProfile = player.profile.toLowerCase().includes(q);
      if (!matchName && !matchTeam && !matchProfile) return false;
    }

    return true;
  });

  const getPosBadgeClass = (pos: Position) => {
    switch (pos) {
      case 'RB':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'WR':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'QB':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'TE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <div>
            <h2 className="font-bold text-slate-100 uppercase tracking-wider">SLEEPERS & HANDCUFF RADAR</h2>
            <p className="text-[11px] text-slate-400 font-sans">
              Identifiziere unentdeckte High-Upside Targets & essenzielle RB-Handcuff Versicherungen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-400">
            CANDIDATES: <span className="text-amber-400 font-bold">{candidates.length}</span>
          </span>
          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-400">
            STARTER INSURED: <span className="text-emerald-400 font-bold">{userRbTeams.length} TEAMS</span>
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl space-y-3 text-xs font-mono">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Category Buttons */}
          <div className="flex flex-wrap bg-slate-950 p-0.5 rounded border border-slate-700 gap-1">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                activeFilter === 'ALL' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ALLE TARGETS
            </button>
            <button
              onClick={() => setActiveFilter('SLEEPERS')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'SLEEPERS' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-300" /> SLEEPERS
            </button>
            <button
              onClick={() => setActiveFilter('HANDCUFFS')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'HANDCUFFS' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-emerald-300" /> HANDCUFFS
            </button>
            <button
              onClick={() => setActiveFilter('INSURANCE')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'INSURANCE' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-purple-300" /> MEIN ROSTER INSURED
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Suche Sleeper / Team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 rounded px-2.5 py-1 pl-8 pr-7 text-xs focus:outline-none focus:border-blue-500"
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
        </div>

        {/* Positional Sub-Filter */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400 mr-1">POSITION:</span>
          {(['ALL', 'RB', 'WR', 'QB', 'TE'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => setSelectedPos(pos)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                selectedPos === pos
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Sleeper & Handcuff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {candidates.map((player) => {
          const sleeperTag = isSleeper(player);
          const handcuffTag = isHandcuff(player);
          const isUserInsurance = handcuffTag && userRbTeams.includes(player.team);
          const pickInfo = getFormattedPick(player.ovrRank, settings.leagueSize);
          const proj = getAdjustedProjection(player, settings.scoringFormat);
          const vorp = calculateVORP(player, players, settings.scoringFormat, settings.leagueSize);

          let borderClass = 'border-slate-800 bg-slate-900';
          if (isUserInsurance) {
            borderClass = 'border-purple-500/50 bg-purple-950/20';
          } else if (sleeperTag) {
            borderClass = 'border-amber-500/40 bg-amber-950/10';
          } else if (handcuffTag) {
            borderClass = 'border-emerald-500/40 bg-emerald-950/10';
          }

          if (player.status === 'Mein Team') {
            borderClass = 'border-emerald-500 bg-emerald-950/30';
          } else if (player.status === 'Gedraftet (Gegner)') {
            borderClass = 'border-slate-800 bg-slate-950 opacity-40 grayscale';
          }

          return (
            <div
              key={player.id}
              className={`border rounded-lg p-3 flex flex-col justify-between gap-3 shadow-xl transition-all ${borderClass}`}
            >
              <div className="space-y-2">
                {/* Top Badges */}
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-slate-400 font-bold">ADP #{player.ovrRank} ({pickInfo.formattedString})</span>
                  <div className="flex gap-1">
                    {isUserInsurance && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                        â˜… UR STARTER INSURED
                      </span>
                    )}
                    {sleeperTag && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        âš¡ SLEEPER
                      </span>
                    )}
                    {handcuffTag && !isUserInsurance && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        ðŸ›¡ï¸ HANDCUFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Player Main Info */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-100">{player.name}</h3>
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${getPosBadgeClass(player.pos)}`}>
                      {player.posRank}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{player.team}</span>
                    <span>â€¢</span>
                    <span>Bye {player.bye}</span>
                    <span>â€¢</span>
                    <span className="text-slate-300">{player.tier}</span>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px] bg-slate-950 p-2 rounded border border-slate-800">
                  <div>
                    <div className="text-slate-500">PROJ</div>
                    <div className="font-bold text-slate-200">{proj} pts</div>
                  </div>
                  <div>
                    <div className="text-slate-500">VORP</div>
                    <div className="font-bold text-emerald-400">+{vorp}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">TARGET %</div>
                    <div className="font-bold text-amber-400">
                      {player.targetShare ? `${(player.targetShare * 100).toFixed(0)}%` : '-'}
                    </div>
                  </div>
                </div>

                {/* Profile Analysis */}
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-3 italic bg-slate-950/50 p-2 rounded border border-slate-800/80">
                  "{player.profile}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-mono text-xs">
                {player.status === 'VERFÜGBAR' ? (
                  <div className="flex gap-1.5 w-full">
                    <button
                      onClick={() => onDraftForMe(player)}
                      className="flex-1 py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> + Mein Team
                    </button>
                    <button
                      onClick={() => onDraftForOpponent(player)}
                      className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] cursor-pointer"
                    >
                      Gegner
                    </button>
                  </div>
                ) : (
                  <div className="w-full text-center py-1 font-bold uppercase text-[10px] text-slate-400 bg-slate-950 rounded border border-slate-800">
                    STATUS: {player.status}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {candidates.length === 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center text-slate-400 text-xs">
          Keine Sleepers oder Handcuffs entsprechen den aktuellen Filtern.
        </div>
      )}
    </div>
  );
};



