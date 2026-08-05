import React from 'react';
import { Player, DraftSettings } from '../types';
import { evaluateDraft, DraftEvaluationResult } from '../utils/evaluation';
import { X, CheckCircle, AlertTriangle, XCircle, Award } from 'lucide-react';

interface DraftEvaluationModalProps {
  onClose: () => void;
  players: Player[];
  userTeam: Player[];
  settings: DraftSettings;
}

export const DraftEvaluationModal: React.FC<DraftEvaluationModalProps> = ({
  onClose,
  players,
  userTeam,
  settings,
}) => {
  const result: DraftEvaluationResult = evaluateDraft(userTeam, players, settings);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]';
    if (grade.startsWith('B')) return 'text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]';
    if (grade.startsWith('C')) return 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]';
    if (grade.startsWith('D')) return 'text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.5)]';
    return 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]';
  };

  const getGradeBg = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-emerald-950/30 border-emerald-500/50';
    if (grade.startsWith('B')) return 'bg-blue-950/30 border-blue-500/50';
    if (grade.startsWith('C')) return 'bg-yellow-950/30 border-yellow-500/50';
    if (grade.startsWith('D')) return 'bg-orange-950/30 border-orange-500/50';
    return 'bg-rose-950/30 border-rose-500/50';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Draft Auswertung</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          <div className="flex flex-col items-center mb-8">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Deine Draft-Note</div>
            <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center ${getGradeBg(result.grade)}`}>
              <span className={`text-6xl font-black ${getGradeColor(result.grade)}`}>{result.grade}</span>
            </div>
            <div className="mt-3 text-slate-400 font-mono text-sm">Score: {result.score}/100</div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700 pb-2">Auswertung & Tipps</h3>
            
            {result.tips.length === 0 ? (
              <div className="text-slate-500 italic text-center py-4">Noch nicht genügend Picks für eine Auswertung.</div>
            ) : (
              <div className="space-y-3">
                {result.tips.map((tip, idx) => {
                  let Icon = CheckCircle;
                  let iconColor = 'text-emerald-400';
                  let bgClass = 'bg-emerald-950/20 border-emerald-900/40';

                  if (tip.type === 'negative') {
                    Icon = XCircle;
                    iconColor = 'text-rose-400';
                    bgClass = 'bg-rose-950/20 border-rose-900/40';
                  } else if (tip.type === 'warning') {
                    Icon = AlertTriangle;
                    iconColor = 'text-yellow-400';
                    bgClass = 'bg-yellow-950/20 border-yellow-900/40';
                  }

                  return (
                    <div key={idx} className={`p-3 rounded-lg border flex gap-3 items-start ${bgClass}`}>
                      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                      <p className="text-sm text-slate-300 leading-relaxed">{tip.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/30 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded shadow transition-colors"
          >
            Schließen
          </button>
        </div>
        
      </div>
    </div>
  );
};
