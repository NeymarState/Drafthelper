import React, { useState } from 'react';
import { Player, RosterState, DraftSettings } from '../types';
import { getAdjustedProjection, calculateVORP } from '../utils/calculations';
import { Shield, Award, Zap, Calendar, UserX, Sparkles, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface MyTeamTabProps {
  userTeam: Player[];
  roster: RosterState;
  settings: DraftSettings;
  onRemoveFromTeam: (player: Player) => void;
}

export const MyTeamTab: React.FC<MyTeamTabProps> = ({
  userTeam,
  roster,
  settings,
  onRemoveFromTeam,
}) => {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const totalPoints = userTeam.reduce(
    (acc, p) => acc + getAdjustedProjection(p, settings.scoringFormat),
    0
  );

  const totalVorp = userTeam.reduce(
    (acc, p) => acc + calculateVORP(p, userTeam, settings.scoringFormat, settings.leagueSize),
    0
  );

  const startersList = [
    { label: 'QB', player: roster.QB },
    { label: 'RB1', player: roster.RB1 },
    { label: 'RB2', player: roster.RB2 },
    { label: 'WR1', player: roster.WR1 },
    { label: 'WR2', player: roster.WR2 },
    { label: 'TE', player: roster.TE },
    { label: 'FLEX', player: roster.FLEX },
    { label: 'DST', player: roster.DST },
    { label: 'K', player: roster.K },
  ].filter((item) => item.player !== null);

  const qbTeam = roster.QB?.team;

  const toggleExpand = (id: string) => {
    setExpandedPlayerId(expandedPlayerId === id ? null : id);
  };

  const getPosBadgeClass = (pos: string) => {
    switch (pos) {
      case 'QB':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'RB':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'WR':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'TE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Team Overview Stats */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl flex flex-wrap items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-100">MEIN FANTASY TEAM ROSTER VIEW</h2>
            <p className="text-[11px] text-slate-400 font-sans">
              Alle gedrafteten Spieler mit Positionen, Projektionen & Fantasy Notes ({settings.scoringFormat.toUpperCase()})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 uppercase">GEDRAFTET</div>
            <div className="text-emerald-400 font-bold">{userTeam.length} Spieler</div>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 uppercase">PROJ TOTAL</div>
            <div className="text-blue-400 font-bold">{Math.round(totalPoints * 10) / 10} pts</div>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 uppercase">TOTAL VORP</div>
            <div className="text-emerald-400 font-bold">+{Math.round(totalVorp * 10) / 10}</div>
          </div>
        </div>
      </div>

      {userTeam.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center space-y-3 shadow-xl">
          <Award className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Noch keine Spieler in Deinem Team</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Nutze den Master Draft Board oder das Live Dashboard, um Spieler für "Mein Team" auszuwählen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Roster Player Cards with Notes */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
              <div className="p-3 border-b border-slate-700 bg-slate-800/40 flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-slate-300 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" /> GEDRAFTETE SPIELER ({userTeam.length})
                </span>
                <span className="text-slate-400 text-[10px]">KLICKE AUF EIN PROFIL FÜR DETAILLIERTE NOTES</span>
              </div>

              <div className="divide-y divide-slate-800">
                {userTeam.map((player) => {
                  const isExpanded = expandedPlayerId === player.id;
                  const proj = getAdjustedProjection(player, settings.scoringFormat);
                  const vorp = calculateVORP(player, userTeam, settings.scoringFormat, settings.leagueSize);
                  const isStack = qbTeam && player.pos !== 'QB' && player.team === qbTeam;

                  return (
                    <div key={player.id} className="p-3 bg-slate-900/60 hover:bg-slate-850/60 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleExpand(player.id)}
                            className="p-1 rounded text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                            title="Player Notes anzeigen"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100 text-sm">{player.name}</span>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${getPosBadgeClass(player.pos)}`}>
                                {player.posRank}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                {player.team}
                              </span>
                              {isStack && (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-blue-400" /> QB STACK
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                              <span>Bye Week {player.bye}</span>
                              <span>•</span>
                              <span className="text-slate-300">{player.tier}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-xs">
                          <div className="text-right">
                            <div className="font-bold text-slate-100">{proj} pts</div>
                            <div className="text-[10px] text-emerald-400 font-bold">+{vorp} VORP</div>
                          </div>
                          <button
                            onClick={() => onRemoveFromTeam(player)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Aus Team entfernen"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Player Notes */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-800 bg-slate-950/80 rounded p-3 text-xs space-y-2">
                          <div className="flex items-center justify-between text-blue-400 font-mono font-bold text-[11px]">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> FANTASY FOOTBALLERS SCOUTING NOTE
                            </span>
                            <span className="text-slate-400 font-normal">
                              Alter: {player.age ?? 26} | Target Share: {player.targetShare ? `${(player.targetShare * 100).toFixed(0)}%` : '-'}
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed font-sans text-xs">
                            {player.profile}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Roster Breakdown & Bye Week Analysis */}
          <div className="lg:col-span-4 space-y-4">
            {/* Starter Roster Summary */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl space-y-2 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-300 font-mono text-xs flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" /> ROSTER POSITIONS
              </h3>
              <div className="space-y-1.5 font-mono text-[11px]">
                {startersList.map(({ label, player }) => (
                  <div key={label} className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="font-bold text-blue-400 w-10">{label}</span>
                    <span className="text-slate-200 font-sans truncate max-w-[130px]">{player?.name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{player ? `${getAdjustedProjection(player, settings.scoringFormat)} pts` : 'Leer'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bye Week Matrix */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl space-y-2 text-xs font-mono">
              <h3 className="font-bold uppercase tracking-wider text-slate-300 text-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" /> BYE WEEK VERTEILUNG
              </h3>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                {[5, 6, 7, 8, 9, 10, 11, 12, 14].map((byeWeek) => {
                  const playersOnBye = userTeam.filter((p) => p.bye === byeWeek);
                  const isOverlap = playersOnBye.length >= 2;
                  return (
                    <div
                      key={byeWeek}
                      className={`p-1.5 rounded border ${
                        isOverlap
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>Week {byeWeek}</div>
                      <div className="font-bold text-xs mt-0.5">{playersOnBye.length}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
