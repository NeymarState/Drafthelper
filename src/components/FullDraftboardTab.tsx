import React, { useMemo } from 'react';
import { Player, DraftSettings } from '../types';
import { LayoutGrid } from 'lucide-react';

interface FullDraftboardTabProps {
  players: Player[];
  settings: DraftSettings;
}

export const FullDraftboardTab: React.FC<FullDraftboardTabProps> = ({ players, settings }) => {
  const { leagueSize, totalRounds } = settings;

  // Build a 2D array of picks
  // grid[roundIndex][teamIndex]
  const grid = useMemo(() => {
    const board = Array(totalRounds).fill(null).map(() => Array(leagueSize).fill(null));
    
    // Map drafted players to their pick slots
    const draftedPlayers = players.filter(p => p.status !== 'VerfǬgbar' && p.draftedAtPick);
    
    draftedPlayers.forEach(player => {
      const pick = player.draftedAtPick!;
      const round = Math.ceil(pick / leagueSize);
      let teamIndex = 0;
      if (round % 2 === 1) { // odd round
        teamIndex = (pick - 1) % leagueSize;
      } else { // even round (snake)
        teamIndex = leagueSize - 1 - ((pick - 1) % leagueSize);
      }
      
      if (round <= totalRounds) {
        board[round - 1][teamIndex] = player;
      }
    });
    
    return board;
  }, [players, leagueSize, totalRounds]);

  const getPosColor = (pos: string) => {
    switch (pos) {
      case 'QB': return 'bg-pink-900/40 text-pink-200 border-pink-700/50';
      case 'RB': return 'bg-emerald-900/40 text-emerald-200 border-emerald-700/50';
      case 'WR': return 'bg-blue-900/40 text-blue-200 border-blue-700/50';
      case 'TE': return 'bg-orange-900/40 text-orange-200 border-orange-700/50';
      case 'K': return 'bg-purple-900/40 text-purple-200 border-purple-700/50';
      case 'DST': return 'bg-yellow-900/40 text-yellow-200 border-yellow-700/50';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950">
        <h2 className="font-black tracking-widest uppercase text-slate-100 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-emerald-400" />
          Full Draftboard
        </h2>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-max">
          <div className="flex">
            <div className="w-12 shrink-0"></div> {/* Round column header */}
            {Array.from({ length: leagueSize }).map((_, i) => (
              <div key={i} className={`flex-1 min-w-[120px] text-center font-bold text-xs py-2 px-1 ${i + 1 === settings.userPickSlot ? 'text-emerald-400 bg-emerald-900/20' : 'text-slate-400'}`}>
                Team {i + 1} {i + 1 === settings.userPickSlot ? '(Du)' : ''}
              </div>
            ))}
          </div>
          
          <div className="flex flex-col gap-1 mt-2">
            {grid.map((round, rIndex) => (
              <div key={rIndex} className="flex gap-1 items-stretch">
                <div className="w-12 shrink-0 flex items-center justify-center font-bold text-xs text-slate-500 bg-slate-950 rounded border border-slate-800">
                  R{rIndex + 1}
                </div>
                {round.map((player, tIndex) => {
                  let overallPick = 0;
                  if ((rIndex + 1) % 2 === 1) {
                    overallPick = rIndex * leagueSize + tIndex + 1;
                  } else {
                    overallPick = rIndex * leagueSize + (leagueSize - tIndex);
                  }
                  
                  const isCurrentPick = overallPick === settings.currentOverallPick;
                  
                  if (!player) {
                    return (
                      <div key={tIndex} className={`flex-1 min-w-[120px] h-16 rounded border flex items-center justify-center text-xs font-mono
                        ${isCurrentPick ? 'bg-blue-900/20 border-blue-500 text-blue-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-600'}
                      `}>
                        Pick {overallPick}
                      </div>
                    );
                  }
                  
                  return (
                    <div key={tIndex} className={`flex-1 min-w-[120px] h-16 rounded border p-1.5 flex flex-col justify-between ${getPosColor(player.pos)} ${tIndex + 1 === settings.userPickSlot ? 'ring-1 ring-emerald-500/50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-[10px] leading-tight truncate pr-1" title={player.name}>{player.name}</span>
                        <span className="text-[9px] font-mono opacity-60 shrink-0">{overallPick}</span>
                      </div>
                      <div className="flex justify-between items-end mt-auto">
                        <span className="text-[9px] font-bold">{player.pos} - {player.team}</span>
                        <span className="text-[9px] opacity-60">Bye {player.bye}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
