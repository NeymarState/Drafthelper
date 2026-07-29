import React, { useState } from 'react';
import { Player, Position, PlayerStatus, DraftSettings } from '../types';
import { getFormattedPick, calculateVORP, getAdjustedProjection } from '../utils/calculations';
import { Search, Filter, ChevronDown, ChevronUp, RotateCcw, Sparkles, X, SlidersHorizontal } from 'lucide-react';

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
  const [selectedPos, setSelectedPos] = useState<Position | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<PlayerStatus | 'ALL'>('ALL');
  const [selectedBye, setSelectedBye] = useState<number | 'ALL'>('ALL');
  const [selectedTier, setSelectedTier] = useState<number | 'ALL'>('ALL');
  const [selectedVorpRange, setSelectedVorpRange] = useState<'ALL' | 'HIGH' | 'POSITIVE' | 'NEGATIVE'>('ALL');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // Unique lists for dropdown options
  const teams = Array.from(new Set(players.map((p) => p.team))).sort();
  const byeWeeks = Array.from(new Set(players.map((p) => p.bye || 0))).sort((a: number, b: number) => a - b);
  const tiers = Array.from(new Set(players.map((p) => p.tierNumber || 1))).sort((a: number, b: number) => a - b);

  // Filter logic
  const filteredPlayers = players.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.team.toLowerCase().includes(q) ||
      p.pos.toLowerCase().includes(q) ||
      p.tier.toLowerCase().includes(q) ||
      `bye ${p.bye}`.includes(q) ||
      p.profile.toLowerCase().includes(q);

    const matchesPos = selectedPos === 'ALL' || p.pos === selectedPos;
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

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedPos('ALL');
    setSelectedStatus('ALL');
    setSelectedBye('ALL');
    setSelectedTier('ALL');
    setSelectedVorpRange('ALL');
    setSelectedTeam('ALL');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedPos !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedBye !== 'ALL' ||
    selectedTier !== 'ALL' ||
    selectedVorpRange !== 'ALL' ||
    selectedTeam !== 'ALL';

  const toggleExpand = (id: string) => {
    setExpandedPlayerId(expandedPlayerId === id ? null : id);
  };

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
      {/* Controls Bar: Advanced Search & Multi-Filters */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl space-y-3 font-mono text-xs">
        {/* Row 1: Search & Main Status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Suche Name, Team, Position, Bye Week, Tier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-600 text-slate-100 placeholder-slate-500 rounded px-2.5 py-1 pl-8 text-xs focus:outline-none focus:border-blue-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">STATUS:</span>
            <div className="flex bg-slate-950 p-0.5 rounded border border-slate-700">
              {(['ALL', 'Verfügbar', 'Mein Team', 'Gedraftet (Gegner)'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'Gedraftet (Gegner)' ? 'Gegner' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Advanced Filter Selectors (Bye Week, Tier, VORP Range, Team) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1 font-bold">
            <SlidersHorizontal className="w-3 h-3 text-blue-400" /> FILTER:
          </span>

          {/* Bye Week Selector */}
          <select
            value={selectedBye}
            onChange={(e) => setSelectedBye(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Alle Bye Weeks</option>
            {byeWeeks.map((bw) => (
              <option key={bw} value={bw}>Bye Week {bw}</option>
            ))}
          </select>

          {/* Tier Selector */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Alle Tiers</option>
            {tiers.map((t) => (
              <option key={t} value={t}>Tier {t}</option>
            ))}
          </select>

          {/* VORP Range Selector */}
          <select
            value={selectedVorpRange}
            onChange={(e) => setSelectedVorpRange(e.target.value as any)}
            className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Alle VORP-Werte</option>
            <option value="HIGH">Elite VORP (≥ +40)</option>
            <option value="POSITIVE">Positiver VORP (&gt; 0)</option>
            <option value="NEGATIVE">Neutral / Negativ (≤ 0)</option>
          </select>

          {/* Team Selector */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Alle NFL Teams</option>
            {teams.map((tm) => (
              <option key={tm} value={tm}>{tm}</option>
            ))}
          </select>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="ml-auto px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition-colors cursor-pointer flex items-center gap-1 font-bold"
            >
              <X className="w-3 h-3" /> Reset Filter
            </button>
          )}
        </div>

        {/* Row 3: Position Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
          <span className="text-slate-400 mr-1 font-bold">POS:</span>
          {(['ALL', 'QB', 'RB', 'WR', 'TE', 'DST', 'K'] as const).map((pos) => {
            const count = players.filter(
              (p) => (pos === 'ALL' || p.pos === pos) && p.status === 'Verfügbar'
            ).length;

            return (
              <button
                key={pos}
                onClick={() => setSelectedPos(pos)}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  selectedPos === pos
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
              >
                <span>{pos}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Master Table */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
        <div className="p-3 border-b border-slate-700 bg-slate-800/40 flex justify-between items-center text-xs font-mono">
          <h2 className="font-bold uppercase tracking-wider text-slate-300">LIVE DRAFT POOL ({filteredPlayers.length} SPIELER)</h2>
          {hasActiveFilters && (
            <span className="text-[10px] text-amber-400 font-bold">GEFILTERTE ANSICHT ACTIVE</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-700 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-2 w-10 text-center">RK</th>
                <th className="p-2">NAME</th>
                <th className="p-2">POS</th>
                <th className="p-2">TEAM</th>
                <th className="p-2">BYE</th>
                <th className="p-2">ADP</th>
                <th className="p-2 text-right">PROJ</th>
                <th className="p-2 text-right">VORP</th>
                <th className="p-2">TIER</th>
                <th className="p-2 text-center">STATUS</th>
                <th className="p-2 text-center">AKTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {filteredPlayers.map((player) => {
                const pickInfo = getFormattedPick(player.ovrRank, settings.leagueSize);
                const vorp = calculateVORP(player, players, settings.scoringFormat, settings.leagueSize);
                const proj = getAdjustedProjection(player, settings.scoringFormat);
                const isExpanded = expandedPlayerId === player.id;

                let rowBg = 'bg-slate-900/50 hover:bg-slate-800 cursor-pointer';
                if (player.status === 'Mein Team') {
                  rowBg = 'bg-emerald-900/20 text-emerald-100 border-l-2 border-l-emerald-500 font-bold';
                } else if (player.status === 'Gedraftet (Gegner)') {
                  rowBg = 'opacity-40 grayscale pointer-events-none';
                }

                return (
                  <React.Fragment key={player.id}>
                    <tr className={`transition-colors ${rowBg}`}>
                      {/* Overall Rank */}
                      <td className="p-2 text-center font-mono font-bold text-slate-300">
                        {String(player.ovrRank).padStart(2, '0')}
                      </td>

                      {/* Name & Expand Toggle */}
                      <td className="p-2 font-bold">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleExpand(player.id)}
                            className="text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                            title="Ballers Profile Toggle"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-blue-400" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <span className={player.status === 'Mein Team' ? 'text-emerald-300 font-bold' : player.status === 'Verfügbar' ? 'text-blue-400 font-bold' : 'line-through'}>
                            {player.name}
                          </span>
                        </div>
                      </td>

                      {/* Pos Rank */}
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${getPosBadgeClass(player.pos)}`}>
                          {player.posRank}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="p-2 font-mono text-slate-400 text-[11px]">
                        {player.team}
                      </td>

                      {/* Bye */}
                      <td className="p-2 font-mono text-slate-500 text-[11px]">
                        {player.bye}
                      </td>

                      {/* ADP Pick */}
                      <td className="p-2 font-mono text-slate-300">
                        {pickInfo.formattedString}
                      </td>

                      {/* Proj Pts */}
                      <td className="p-2 text-right font-mono text-slate-200 font-semibold">
                        {proj}
                      </td>

                      {/* VORP */}
                      <td className="p-2 text-right font-mono font-bold text-emerald-400">
                        +{vorp}
                      </td>

                      {/* Tier */}
                      <td className="p-2 italic text-slate-400 text-[11px] truncate max-w-[130px]">
                        {player.tier}
                      </td>

                      {/* Status */}
                      <td className="p-2 text-center font-mono text-[10px] font-bold uppercase">
                        {player.status === 'Mein Team' ? (
                          <span className="text-emerald-400">Mein Team</span>
                        ) : player.status === 'Gedraftet (Gegner)' ? (
                          <span className="text-slate-500 line-through">Gedraftet</span>
                        ) : (
                          <span className="text-blue-500">Verfügbar</span>
                        )}
                      </td>

                      {/* Action Status Buttons */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1 font-mono">
                          {player.status === 'Verfügbar' && (
                            <>
                              <button
                                onClick={() => onDraftForMe(player)}
                                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow cursor-pointer"
                                title="Für MEIN TEAM gedraftet"
                              >
                                + Mein Team
                              </button>
                              <button
                                onClick={() => onDraftForOpponent(player)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] border border-slate-700 cursor-pointer"
                                title="Vom GEGNER gedraftet"
                              >
                                Gegner
                              </button>
                            </>
                          )}

                          {player.status !== 'Verfügbar' && (
                            <button
                              onClick={() => onResetStatus(player)}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                              title="Reset"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Player Profile Notes */}
                    {isExpanded && (
                      <tr className="bg-slate-950 border-b border-slate-700 font-mono">
                        <td colSpan={11} className="p-3">
                          <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800 pb-1.5 font-mono">
                              <span className="flex items-center gap-1.5 text-blue-400">
                                <Sparkles className="w-3.5 h-3.5" />
                                ANALYSE ({player.name})
                              </span>
                              <span>Target Share: {player.targetShare ? `${(player.targetShare * 100).toFixed(0)}%` : '-'} | RZ Touches: {player.rzTouches}</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed text-[11px] pt-1 font-sans">
                              {player.profile}
                            </p>
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
    </div>
  );
};
