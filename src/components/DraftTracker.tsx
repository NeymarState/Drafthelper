import React from 'react';
import { Player, DraftSettings } from '../types';
import { TrendingUp } from 'lucide-react';

interface DraftTrackerProps {
  players: Player[];
  settings: DraftSettings;
}

export const DraftTracker: React.FC<DraftTrackerProps> = ({ players, settings }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 h-full flex flex-col">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3 shrink-0">
        <TrendingUp className="w-4 h-4 text-emerald-400" /> GLOBAL DRAFT TRACKER
      </h3>
      <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
        {(['QB', 'RB', 'WR', 'TE'] as const).map((pos) => {
          const availablePlayers = players.filter((p) => p.pos === pos && p.status === 'VERFÜGBAR');
          const totalAvailable = players.filter((p) => p.pos === pos).length;
          const totalDrafted = totalAvailable - availablePlayers.length;
          
          // Absolute Draft Expectations based on league size (15-18 round drafts)
          let expectedMax = 0;
          if (pos === 'QB') expectedMax = Math.round(settings.leagueSize * 2);
          if (pos === 'RB') expectedMax = Math.round(settings.leagueSize * 5.5);
          if (pos === 'WR') expectedMax = Math.round(settings.leagueSize * 6.5);
          if (pos === 'TE') expectedMax = Math.round(settings.leagueSize * 1.5);
          
          const fillPercent = Math.min((totalDrafted / Math.max(1, expectedMax)) * 100, 100);
          
          const highestTier = availablePlayers.length > 0 
            ? Math.min(...availablePlayers.map((p) => p.tierNumber || 99)) 
            : null;
            
          const playersInHighestTier = highestTier && highestTier < 99
            ? availablePlayers.filter((p) => p.tierNumber === highestTier).length
            : 0;
          
          // League threshold for QB and TE (typically 1 per team)
          const threshold = (pos === 'QB' || pos === 'TE') ? settings.leagueSize : null;
          const thresholdPercent = threshold ? Math.min((threshold / Math.max(1, expectedMax)) * 100, 100) : null;
          
          const posStyles: Record<string, { fill: string, badge: string }> = {
            QB: { fill: 'bg-red-500', badge: 'bg-red-500/20 text-red-400 border border-red-500/30' },
            RB: { fill: 'bg-green-500', badge: 'bg-green-500/20 text-green-400 border border-green-500/30' },
            WR: { fill: 'bg-blue-500', badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
            TE: { fill: 'bg-orange-500', badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' }
          };
          
          return (
            <div key={pos} className="space-y-1.5 relative">
              <div className="flex justify-between items-end mb-1">
                <span className="font-bold text-slate-300 flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${posStyles[pos].badge}`}>
                    {pos}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {highestTier ? `Tier ${highestTier} (${playersInHighestTier})` : 'Leer'}
                  </span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-300">
                  {totalDrafted} / {expectedMax}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                <div 
                  className={`h-full transition-all duration-500 ${posStyles[pos].fill}`}
                  style={{ width: `${fillPercent}%` }}
                />
                {thresholdPercent !== null && (
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-white/60 z-10" 
                    style={{ left: `${thresholdPercent}%` }}
                    title={`Starter Threshold (${threshold} Picks)`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};



