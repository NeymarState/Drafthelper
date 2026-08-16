import React, { useState } from 'react';
import { Player, Position, PlayerStatus, DraftSettings } from '../types';
import { getFormattedPick, calculateVORP, getAdjustedProjection } from '../utils/calculations';
import { Search, ChevronDown, ChevronUp, RotateCcw, Sparkles, X, SlidersHorizontal, Zap, Target, ShieldAlert } from 'lucide-react';

type SortField = 'RK' | 'POS' | 'ADP' | 'VORP' | 'TIER' | null;

interface MasterBoardTabProps {
  players: Player[];
  settings: DraftSettings;
  onDraftForMe: (player: Player) => void;
  onDraftForOpponent: (player: Player) => void;
  onResetStatus: (player: Player) => void;
}

export const MasterBoardTab: React.FC<MasterBoardTabProps> = ({
  players,
  settings,
  onDraftForMe,
  onDraftForOpponent,
  onResetStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<(Position | 'ALL')[]>(['ALL']);
  const [selectedStatus, setSelectedStatus] = useState<PlayerStatus | 'ALL'>('ALL');
  const [selectedBye, setSelectedBye] = useState<number | 'ALL'>('ALL');
  const [selectedTier, setSelectedTier] = useState<number | 'ALL'>('ALL');
  const [selectedVorpRange, setSelectedVorpRange] = useState<'ALL' | 'HIGH' | 'POSITIVE' | 'NEGATIVE'>('ALL');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Unique lists für dropdown options
  const teams = Array.from(new Set(players.map((p) => p.team))).sort();
  const byeWeeks = Array.from(new Set(players.map((p) => p.bye || 0))).sort((a: number, b: number) => a - b);
  const tiers = Array.from(new Set(players.map((p) => p.tierNumber || 1))).sort((a: number, b: number) => a - b);

  const togglePosition = (pos: Position | 'ALL') => {
    if (pos === 'ALL') {
      setSelectedPositions(['ALL']);
    } else {
      let newSelected = selectedPositions.filter(p => p !== 'ALL');
      if (newSelected.includes(pos)) {
        newSelected = newSelected.filter(p => p !== pos);
        if (newSelected.length === 0) newSelected = ['ALL'];
      } else {
        newSelected.push(pos);
      }
      setSelectedPositions(newSelected);
    }
  };

  const getFilteredPlayers = (posFilter: Position | 'ALL') => {
    let filtered = players.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q) ||
        p.pos.toLowerCase().includes(q) ||
        p.tier.toLowerCase().includes(q) ||
        `bye ${p.bye}`.includes(q) ||
        p.profile.toLowerCase().includes(q);

      const matchesPos = posFilter === 'ALL' || p.pos === posFilter;
      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      const matchesBye = selectedBye === 'ALL' || p.bye === selectedBye;
      const matchesTier = selectedTier === 'ALL' || p.tierNumber === selectedTier;
      const matchesTeam = selectedTeam === 'ALL' || p.team === selectedTeam;

      const vorp = calculateVORP(p, players, settings.scoringFormat, settings.leagueSize);
      let matchesVorp = true;
      if (selectedVorpRange === 'HIGH') matchesVorp = vorp >= 40;
      else if (selectedVorpRange === 'POSITIVE') matchesVorp = vorp > 0;
      else if (selectedVorpRange === 'NEGATIVE') matchesVorp = vorp <= 0;

      return matchesSearch && matchesPos && matchesStatus && matchesBye && matchesTier && matchesTeam && matchesVorp;
    });

    if (sortField) {
      filtered.sort((a, b) => {
        if (sortField === 'POS') {
          return sortAsc 
            ? a.posRank.localeCompare(b.posRank, undefined, { numeric: true })
            : b.posRank.localeCompare(a.posRank, undefined, { numeric: true });
        }
        
        let valA: any = 0;
        let valB: any = 0;
        
        if (sortField === 'RK') { valA = a.ovrRank; valB = b.ovrRank; }
        else if (sortField === 'ADP') { valA = a.ovrRank; valB = b.ovrRank; }
        else if (sortField === 'VORP') { 
          valA = calculateVORP(a, players, settings.scoringFormat, settings.leagueSize);
          valB = calculateVORP(b, players, settings.scoringFormat, settings.leagueSize);
        }
        else if (sortField === 'TIER') { valA = a.tierNumber; valB = b.tierNumber; }
        
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    } else {
      filtered.sort((a, b) => a.ovrRank - b.ovrRank);
    }
    
    return filtered;
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedPositions(['ALL']);
    setSelectedStatus('ALL');
    setSelectedBye('ALL');
    setSelectedTier('ALL');
    setSelectedVorpRange('ALL');
    setSelectedTeam('ALL');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    !selectedPositions.includes('ALL') ||
    selectedStatus !== 'ALL' ||
    selectedBye !== 'ALL' ||
    selectedTier !== 'ALL' ||
    selectedVorpRange !== 'ALL' ||
    selectedTeam !== 'ALL';

  const toggleExpand = (id: string) => {
    setExpandedPlayerId(expandedPlayerId === id ? null : id);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (!sortAsc) {
        setSortField(null);
        setSortAsc(true);
      } else {
        setSortAsc(false);
      }
    } else {
      setSortField(field);
      // Default to descending on first click so the user sees an immediate change
      // (since the default table order is already ascending für most fields)
      setSortAsc(field === 'POS'); 
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <span className="inline-block w-3 opacity-0 group-hover:opacity-30 ml-1"><ChevronUp size={12} /></span>;
    return <span className="inline-block w-3 text-emerald-400 ml-1">{sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>;
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

  const getTierBadgeClass = (tierNum?: number) => {
    switch (tierNum) {
      case 1: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 2: return 'bg-slate-300/20 text-slate-300 border-slate-400/30';
      case 3: return 'bg-orange-700/20 text-orange-500 border-orange-700/30';
      case 4: return 'bg-slate-700/20 text-slate-400 border-slate-700/30';
      default: return 'bg-slate-800/20 text-slate-500 border-slate-800/30';
    }
  };

  const renderTable = (posToRender: Position | 'ALL') => {
    const tablePlayers = getFilteredPlayers(posToRender);
    const isMulti = selectedPositions.length > 1 && !selectedPositions.includes('ALL');

    return (
      <div key={posToRender} className={`bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden flex-1 min-w-[350px] ${isMulti ? 'max-w-full' : ''}`}>
        <div className="p-3 border-b border-slate-700 bg-slate-800/40 flex justify-between items-center text-xs font-mono">
          <h2 className="font-bold uppercase tracking-wider text-slate-300">
            {posToRender === 'ALL' ? 'LIVE DRAFT POOL' : `${posToRender} TIER LIST`} ({tablePlayers.length} SPIELER)
          </h2>
          {hasActiveFilters && (
            <span className="text-[10px] text-amber-400 font-bold">GEFILTERTE ANSICHT</span>
          )}
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-700 font-mono uppercase text-[10px] select-none">
                <tr>
                  <th className="p-2 w-10 text-center cursor-pointer hover:text-slate-200 transition-colors group" onClick={() => handleSort('RK')}>
                    <div className="flex items-center justify-center">RK{renderSortIcon('RK')}</div>
                  </th>
                  <th className="p-2">NAME</th>
                  {!isMulti && (
                    <th className="p-2 cursor-pointer hover:text-slate-200 transition-colors group" onClick={() => handleSort('POS')}>
                      <div className="flex items-center">POS{renderSortIcon('POS')}</div>
                    </th>
                  )}
                  <th className="p-2">TEAM</th>
                  {!isMulti && <th className="p-2">BYE</th>}
                  <th className="p-2 cursor-pointer hover:text-slate-200 transition-colors group" onClick={() => handleSort('ADP')}>
                    <div className="flex items-center">ADP{renderSortIcon('ADP')}</div>
                  </th>
                  <th className="p-2 text-right">PROJ</th>
                  <th className="p-2 text-right cursor-pointer hover:text-slate-200 transition-colors group" onClick={() => handleSort('VORP')}>
                    <div className="flex items-center justify-end">VORP{renderSortIcon('VORP')}</div>
                  </th>
                  <th className="p-2 cursor-pointer hover:text-slate-200 transition-colors group" onClick={() => handleSort('TIER')}>
                    <div className="flex items-center">TIER{renderSortIcon('TIER')}</div>
                  </th>
                  <th className="p-2 text-center">STATUS</th>
                  <th className="p-2 text-center">AKTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-sans">
              {tablePlayers.map((player) => {
                const pickInfo = getFormattedPick(player.ovrRank, settings.leagueSize);
                const vorp = calculateVORP(player, players, settings.scoringFormat, settings.leagueSize);
                const proj = getAdjustedProjection(player, settings.scoringFormat);
                const isExpanded = expandedPlayerId === player.id;

                let rowBg = 'bg-slate-900/50 hover:bg-slate-800 cursor-pointer';
                if (player.isGhostPick) rowBg = 'bg-purple-900/40 text-purple-100 border-l-2 border-l-purple-500 font-bold';
                else if (player.status === 'Mein Team') rowBg = 'bg-emerald-900/20 text-emerald-100 border-l-2 border-l-emerald-500 font-bold';
                else if (player.status === 'Gedraftet (Gegner)') rowBg = 'opacity-40 grayscale';

                return (
                  <React.Fragment key={player.id}>
                    <tr className={`transition-colors ${rowBg}`}>
                      <td className="p-2 text-center font-mono font-bold text-slate-300">{String(player.ovrRank).padStart(2, '0')}</td>
                      <td className="p-2 font-bold">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => toggleExpand(player.id)} className="text-slate-400 hover:text-blue-400 transition-colors cursor-pointer" title="Ballers Profile Toggle">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-blue-400" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <span className={player.status === 'Mein Team' ? 'text-emerald-300 font-bold' : player.status === 'Verfügbar' ? 'text-blue-400 font-bold flex items-center gap-1.5' : 'line-through flex items-center gap-1.5'}>
                              {player.name}
                              {player.customTag === 'Sleeper' && <Zap className="w-3.5 h-3.5 text-blue-400" title="Sleeper" />}
                              {player.customTag === 'Target' && <Target className="w-3.5 h-3.5 text-green-400" title="Target" />}
                              {player.customTag === 'Avoid' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" title="Avoid" />}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 pl-5">
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
                      </td>
                      {!isMulti && (
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${getPosBadgeClass(player.pos)}`}>{player.posRank}</span>
                        </td>
                      )}
                      <td className="p-2 font-mono text-slate-400 text-[11px]">{player.team}</td>
                      {!isMulti && <td className="p-2 font-mono text-slate-500 text-[11px]">{player.bye}</td>}
                      <td className="p-2 font-mono text-slate-300">{pickInfo.formattedString}</td>
                      <td className="p-2 text-right font-mono text-slate-200 font-semibold">{proj}</td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-400">+{vorp}</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border truncate max-w-[130px] inline-block ${getTierBadgeClass(player.tierNumber)}`} title={player.tier}>{player.tier}</span>
                      </td>
                      <td className="p-2 text-center font-mono text-[10px] font-bold uppercase">
                        {player.status === 'Mein Team' ? <span className="text-emerald-400">Mein Team</span> : player.status === 'Gedraftet (Gegner)' ? <span className="text-slate-500 line-through">Gedraftet</span> : <span className="text-blue-500">Verfügbar</span>}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1 font-mono">
                          {player.status === 'Verfügbar' && (
                            <>
                              <button onClick={() => onDraftForMe(player)} className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow cursor-pointer" title="für MEIN TEAM gedraftet">+ Mein Team</button>
                              <button onClick={() => onDraftForOpponent(player)} className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] border border-slate-700 cursor-pointer" title="Vom GEGNER gedraftet">Gegner</button>
                            </>
                          )}
                          {player.status !== 'Verfügbar' && (
                            <button onClick={() => onResetStatus(player)} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer" title="Reset"><RotateCcw className="w-3 h-3" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-950 border-b border-slate-700 font-mono">
                        <td colSpan={isMulti ? 9 : 11} className="p-3">
                          <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800 pb-1.5 font-mono">
                              <span className="flex items-center gap-1.5 text-blue-400"><Sparkles className="w-3.5 h-3.5" /> ANALYSE ({player.name})</span>
                              <span>Target Share: {player.targetShare ? `${(player.targetShare * 100).toFixed(0)}%` : '-'} | RZ Touches: {player.rzTouches}</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed text-[11px] pt-1 font-sans">{player.profile}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPositions = selectedPositions.includes('ALL') ? ['ALL'] : selectedPositions;

  return (
    <div className="space-y-4">
      {/* Controls Bar: Advanced Search & Multi-Filters */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Suche Name, Team, Position, Bye Week, Tier..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-600 text-slate-100 placeholder-slate-500 rounded px-2.5 py-1 pl-8 text-xs focus:outline-none focus:border-blue-500 font-medium" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-3 h-3" /></button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">STATUS:</span>
            <div className="flex bg-slate-950 p-0.5 rounded border border-slate-700">
              {(['ALL', 'Verfügbar', 'Mein Team', 'Gedraftet (Gegner)'] as const).map((st) => (
                <button key={st} onClick={() => setSelectedStatus(st)} className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${selectedStatus === st ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                  {st === 'Gedraftet (Gegner)' ? 'Gegner' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1 font-bold"><SlidersHorizontal className="w-3 h-3 text-blue-400" /> FILTER:</span>
          <select value={selectedBye} onChange={(e) => setSelectedBye(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))} className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer">
            <option value="ALL">Alle Bye Weeks</option>
            {byeWeeks.map((bw) => (<option key={bw} value={bw}>Bye Week {bw}</option>))}
          </select>
          <select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))} className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer">
            <option value="ALL">Alle Tiers</option>
            {tiers.map((t) => (<option key={t} value={t}>Tier {t}</option>))}
          </select>
          <select value={selectedVorpRange} onChange={(e) => setSelectedVorpRange(e.target.value as any)} className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer">
            <option value="ALL">Alle VORP-Werte</option>
            <option value="HIGH">Elite VORP (&gt;= +40)</option>
            <option value="POSITIVE">Positiver VORP (&gt; 0)</option>
            <option value="NEGATIVE">Neutral / Negativ (&lt;= 0)</option>
          </select>
          <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer">
            <option value="ALL">Alle NFL Teams</option>
            {teams.map((tm) => (<option key={tm} value={tm}>{tm}</option>))}
          </select>
          {hasActiveFilters && (
            <button onClick={resetAllFilters} className="ml-auto px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition-colors cursor-pointer flex items-center gap-1 font-bold"><X className="w-3 h-3" /> Reset Filter</button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
          <span className="text-slate-400 mr-1 font-bold">POS:</span>
          {(['ALL', 'QB', 'RB', 'WR', 'TE', 'DST', 'K'] as const).map((pos) => {
            const count = players.filter((p) => (pos === 'ALL' || p.pos === pos) && p.status === 'Verfügbar').length;
            const isSelected = selectedPositions.includes(pos);
            return (
              <button key={pos} onClick={() => togglePosition(pos)} className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${isSelected ? 'bg-blue-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-700'}`}>
                <span>{pos}</span><span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
          <span className="text-[10px] text-slate-500 ml-2 italic">(Mehrfachauswahl möglich)</span>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {renderPositions.map((pos) => (
          <React.Fragment key={pos}>
            {renderTable(pos as Position | 'ALL')}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

