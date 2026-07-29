import React from 'react';
import { Player, DraftSettings } from '../types';
import { calculateVORP, getAdjustedProjection } from '../utils/calculations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Target, Users, Zap } from 'lucide-react';

interface AnalyticsTabProps {
  players: Player[];
  settings: DraftSettings;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ players, settings }) => {
  // 1. Top VORP Leaders
  const topVorpData = players
    .map((p) => ({
      name: p.name,
      pos: p.pos,
      vorp: calculateVORP(p, players, settings.scoringFormat, settings.leagueSize),
      proj: getAdjustedProjection(p, settings.scoringFormat),
    }))
    .sort((a, b) => b.vorp - a.vorp)
    .slice(0, 15);

  // 2. Positional VORP Drop-Off Curve (Tiers 1 to 4)
  const posPositions = ['RB', 'WR', 'QB', 'TE'] as const;
  const dropoffData = [1, 2, 3, 4].map((tierNum) => {
    const item: Record<string, any> = { tier: `Tier ${tierNum}` };
    posPositions.forEach((pos) => {
      const tierPlayers = players.filter((p) => p.pos === pos && p.tierNumber === tierNum);
      if (tierPlayers.length > 0) {
        const avgVorp =
          tierPlayers.reduce(
            (sum, p) => sum + calculateVORP(p, players, settings.scoringFormat, settings.leagueSize),
            0
          ) / tierPlayers.length;
        item[pos] = Math.round(avgVorp * 10) / 10;
      } else {
        item[pos] = 0;
      }
    });
    return item;
  });

  // 3. Target Share Leaders (WR/TE)
  const targetShareData = players
    .filter((p) => (p.pos === 'WR' || p.pos === 'TE') && p.targetShare > 0)
    .map((p) => ({
      name: p.name,
      pos: p.pos,
      targetSharePercent: Math.round(p.targetShare * 100),
      airYardsPercent: Math.round(p.airYards * 100),
    }))
    .sort((a, b) => b.targetSharePercent - a.targetSharePercent)
    .slice(0, 12);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <div>
            <h2 className="font-bold text-slate-100 uppercase tracking-wider">FANTASY VORP ANALYTICS ENGINE</h2>
            <p className="text-[11px] text-slate-400 font-sans">
              Value Over Replacement, Tier Drop-Off Curves & Target Dominance ({settings.scoringFormat.toUpperCase()})
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-[10px]">
          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-700 text-slate-300">SCORING: {settings.scoringFormat.toUpperCase()}</span>
          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-700 text-emerald-400 font-bold">{settings.leagueSize} TEAMS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Top 15 VORP Leaders */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700 font-mono text-xs">
            <h3 className="font-bold text-slate-300 flex items-center gap-1.5 uppercase">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> TOP 15 VORP LEADERBOARD
            </h3>
            <span className="text-[10px] text-slate-500">PUNKTE ÜBER REPLACEMENT</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVorpData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={10}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '4px', fontSize: '11px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar dataKey="vorp" fill="#3b82f6" radius={[2, 2, 0, 0]} name="VORP Points" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Tier Scarcity Drop-off */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700 font-mono text-xs">
            <h3 className="font-bold text-slate-300 flex items-center gap-1.5 uppercase">
              <Zap className="w-3.5 h-3.5 text-blue-400" /> TIER SCARCITY DROP-OFF CURVE
            </h3>
            <span className="text-[10px] text-slate-500">DURCHSCHNITT VORP NACH TIER</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dropoffData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="tier" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '4px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="RB" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="WR" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="QB" stroke="#eab308" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="TE" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Target Share & Air Yards Breakdown */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700 font-mono text-xs">
          <h3 className="font-bold text-slate-300 flex items-center gap-1.5 uppercase">
            <Target className="w-3.5 h-3.5 text-emerald-400" /> TARGET SHARE VS. AIR YARDS DOMINANCE (WR & TE)
          </h3>
          <span className="text-[10px] text-slate-500">TEAM SHARE %</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={targetShareData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-30} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '4px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="targetSharePercent" fill="#3b82f6" name="Target Share %" radius={[2, 2, 0, 0]} />
              <Bar dataKey="airYardsPercent" fill="#10b981" name="Air Yards Share %" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
