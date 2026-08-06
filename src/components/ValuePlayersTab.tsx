import React, { useState, useMemo } from 'react';
import { Player, Position, DraftSettings } from '../types';
import { calculateVORP, getAdjustedProjection, getFormattedPick } from '../utils/calculations';
import { Search, ChevronDown, ChevronUp, Zap, Target, ShieldAlert, PlusCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface ValuePlayersTabProps {
  players: Player[];
  settings: DraftSettings;
  onDraftForMe: (player: Player) => void;
  onDraftForOpponent: (player: Player) => void;
}

export const ValuePlayersTab: React.FC<ValuePlayersTabProps> = ({
  players,
  settings,
  onDraftForMe,
  onDraftForOpponent,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNDERVALUED' | 'OVERVALUED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'DIFF' | 'RANK'>('DIFF');

  const toggleExpand = (id: string) => {
    setExpandedPlayerId(expandedPlayerId === id ? null : id);
  };

  const getPosBadgeClass = (pos: Position) => {
    switch (pos) {
      case 'RB': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'WR': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'TE': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'QB': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'K': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'DST': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Filter and sort players
  const processedPlayers = useMemo(() => {
    let filtered = players.filter(p => {
      // Must have ADP to determine value
      if (p.adp === undefined || p.adp >= 999) return false;
      
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q) || p.pos.toLowerCase().includes(q);

      const roundedAdp = Math.round(p.adp);
      const isUndervalued = roundedAdp - p.ovrRank >= 12;
      const isOvervalued = p.ovrRank - roundedAdp >= 12;

      let matchesFilter = false;
      if (activeFilter === 'ALL') matchesFilter = isUndervalued || isOvervalued;
      else if (activeFilter === 'UNDERVALUED') matchesFilter = isUndervalued;
      else if (activeFilter === 'OVERVALUED') matchesFilter = isOvervalued;

      return matchesSearch && matchesFilter;
    });

    // Sort by largest value difference or overall rank
    filtered.sort((a, b) => {
      if (sortBy === 'DIFF') {
        const diffA = Math.abs(Math.round(a.adp || 0) - a.ovrRank);
        const diffB = Math.abs(Math.round(b.adp || 0) - b.ovrRank);
        return diffB - diffA; // Largest difference first
      } else {
        return a.ovrRank - b.ovrRank;
      }
    });

    return filtered;
  }, [players, activeFilter, searchQuery, sortBy]);

  const renderPlayerCard = (player: Player) => {
    const isExpanded = expandedPlayerId === player.id;
    const isDrafted = player.status !== 'VerfÃ¼gbar';
    const roundedAdp = player.adp !== undefined ? Math.round(player.adp) : 0;
    const isUndervalued = player.adp !== undefined && roundedAdp - player.ovrRank >= 12;
    const valueDiff = player.adp !== undefined ? Math.abs(roundedAdp - player.ovrRank) : 0;
    
    return (
      <div
        key={player.id}
        className={`bg-slate-950 border rounded-lg p-3 transition-all ${
          isDrafted ? 'border-slate-800 opacity-50' : 'border-slate-700 hover:border-blue-500/50'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${isDrafted ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                {player.name}
              </span>
              <span className="text-xs text-slate-500 font-mono">({player.team})</span>
              {isUndervalued ? (
                <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1" title="Market undervalues this player">
                  <TrendingUp className="w-3 h-3" /> +{valueDiff} PICKS VALUE
                </span>
              ) : (
                <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30 flex items-center gap-1" title="Market overvalues this player">
                  <TrendingDown className="w-3 h-3" /> -{valueDiff} PICKS VALUE
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={`px-1.5 py-0.5 rounded font-bold border ${getPosBadgeClass(player.pos)}`}>
                {player.posRank}
              </span>
              <span className="text-slate-400">
                Mein Rank: <span className="text-slate-200 font-bold">{player.ovrRank}</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">
                ADP: <span className="text-blue-400 font-bold">{player.adp}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {player.status === 'VerfÃ¼gbar' && (
              <>
                <button
                  onClick={() => onDraftForMe(player)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors flex items-center gap-1 shadow-lg"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> MEIN TEAM
                </button>
                <button
                  onClick={() => onDraftForOpponent(player)}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold transition-colors border border-slate-700"
                >
                  GEGNER
                </button>
              </>
            )}
            <button
              onClick={() => toggleExpand(player.id)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
              <span className="text-slate-500 block mb-1">PROJ PTS</span>
              <span className="text-slate-200 text-sm font-bold">{getAdjustedProjection(player, settings.scoringFormat)}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
              <span className="text-slate-500 block mb-1">VORP</span>
              <span className="text-emerald-400 text-sm font-bold">+{calculateVORP(player, players, settings.scoringFormat, settings.leagueSize)}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
              <span className="text-slate-500 block mb-1">TIER</span>
              <span className="text-slate-200 text-sm font-bold">{player.tier}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
              <span className="text-slate-500 block mb-1">BYE WEEK</span>
              <span className="text-slate-200 text-sm font-bold">{player.bye || '-'}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="text-blue-400 w-5 h-5" /> VALUE ANALYSE
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Finde Spieler mit der grÃ¶ÃŸten Differenz zwischen ADP und deinem Ranking.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              placeholder="Spieler suchen..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-slate-800 bg-slate-900/50 overflow-x-auto custom-scrollbar">
        <div className="flex gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded font-bold transition-all whitespace-nowrap ${
              activeFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            ALLE WERTE
          </button>
          <button
            onClick={() => setActiveFilter('UNDERVALUED')}
            className={`px-3 py-1.5 rounded font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'UNDERVALUED'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-emerald-500/70 hover:bg-emerald-900/50 hover:text-emerald-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> UNDERVALUED (STEALS)
          </button>
          <button
            onClick={() => setActiveFilter('OVERVALUED')}
            className={`px-3 py-1.5 rounded font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'OVERVALUED'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-800 text-red-500/70 hover:bg-red-900/50 hover:text-red-400'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" /> OVERVALUED (AVOID)
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 mt-2 sm:mt-0 font-mono text-xs">
          <span className="text-slate-500 font-bold">SORTIEREN:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'DIFF' | 'RANK')}
            className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-2 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="DIFF">Nach Abweichung</option>
            <option value="RANK">Nach Gesamtrang</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-900/20">
        <div className="space-y-3">
          {processedPlayers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono">
              Keine Spieler gefunden, die den Kriterien entsprechen. 
              <br/>(Hast du die ADP-Daten unter "Spieler anpassen" synchronisiert?)
            </div>
          ) : (
            processedPlayers.map(renderPlayerCard)
          )}
        </div>
      </div>
    </div>
  );
};



