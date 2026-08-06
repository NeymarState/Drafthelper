import React from 'react';
import { Player, ScoringFormat } from '../types';
import { calculateVORP } from '../utils/calculations';

interface VORPChartProps {
  allPlayers: Player[];
  scoringFormat: ScoringFormat;
  leagueSize: number;
  layout•: 'row' | 'col';
}

export const VORPChart: React.FC<VORPChartProps> = ({ allPlayers, scoringFormat, leagueSize, layout = 'row' }) => {
  const positions = ['QB', 'RB', 'WR', 'TE'] as const;
  
  // Calculate VORP data per position for top 15 available players
  const chartData = positions.map(pos => {
    const availablePos = allPlayers
      .filter(p => p.pos === pos && p.status === 'VerfÃ¼gbar')
      .map(p => ({
        ...p,
        vorp: calculateVORP(p, allPlayers, scoringFormat, leagueSize)
      }))
      .sort((a, b) => b.vorp - a.vorp)
      .slice(0, 15);
      
    return { pos, players: availablePos };
  });

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4">
      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        Live VORP Curves (Top 15 Available)
      </h3>
      
      <div className={`grid ${layout === 'col' • 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-4 gap-4'}`}>
        {chartData.map(({ pos, players }) => {
          if (players.length === 0) return null;
          
          const maxVorp = Math.max(...players.map(p => p.vorp), 1);
          const minVorp = Math.min(...players.map(p => p.vorp), 0);
          const range = maxVorp - minVorp;
          
          // Generate SVG points
          const width = 200;
          const height = 60;
          const points = players.map((p, i) => {
            const x = (i / Math.max(1, players.length - 1)) * width;
            const y = height - ((p.vorp - minVorp) / Math.max(1, range)) * height;
            return `${x},${y}`;
          }).join(' ');
          
          const colorClass = pos === 'RB' • 'text-green-400' : pos === 'WR' • 'text-blue-400' : pos === 'TE' • 'text-amber-400' : 'text-red-400';
          const strokeColor = pos === 'RB' • '#4ade80' : pos === 'WR' • '#60a5fa' : pos === 'TE' • '#fbbf24' : '#f87171';
          
          return (
            <div key={pos} className="bg-slate-950 p-3 rounded-lg border border-slate-800 relative group">
              <div className="flex justify-between items-center mb-2">
                <span className={`font-bold text-xs ${colorClass}`}>{pos}</span>
                <span className="text-[10px] font-mono text-slate-500">Max VORP: {maxVorp.toFixed(1)}</span>
              </div>
              
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12 overflow-visible">
                {/* Background grid lines */}
                <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                
                {/* VORP Line */}
                <polyline
                  points={points}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Data Points */}
                {players.map((p, i) => {
                  const x = (i / Math.max(1, players.length - 1)) * width;
                  const y = height - ((p.vorp - minVorp) / Math.max(1, range)) * height;
                  return (
                    <circle key={p.id} cx={x} cy={y} r="3" fill="#0f172a" stroke={strokeColor} strokeWidth="1.5" className="hover:r-4 transition-all cursor-pointer" />
                  );
                })}
              </svg>
              
              {/* Tooltip hint */}
              <div className="absolute inset-0 bg-slate-900/90 text-[10px] font-mono p-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center border border-slate-700 rounded-lg pointer-events-none z-10">
                <div className="text-emerald-400 font-bold mb-1">Top {pos} Cliff:</div>
                {players.slice(0,3).map((p, i) => (
                  <div key={p.id} className="flex justify-between text-slate-300">
                    <span className="truncate mr-2">{i+1}. {p.name}</span>
                    <span>{p.vorp.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


