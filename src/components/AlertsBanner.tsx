﻿import React from 'react';
import { AlertTriangle, Zap, Calendar, CheckCircle2 } from 'lucide-react';
import { AlertItem } from '../types';

interface AlertsBannerProps {
  alerts: AlertItem[];
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <div id="no-alerts-bar" className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center justify-between text-xs text-slate-300 shadow-xl">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Keine akuten Tier-Scarcity oder Bye-Week Warnungen. Draft verläuft optimal.</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">ENGINE: LIVE_MONITOR</span>
      </div>
    );
  }

  return (
    <div id="alerts-container" className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl space-y-2">
      <h2 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        Live Alerts & Stack Radar
      </h2>
      <div className="space-y-2 font-mono text-[11px]">
        {alerts.map((alert) => {
          let itemStyle = 'p-2 bg-amber-500/10 border-l-2 border-amber-500 rounded text-amber-200';
          if (alert.severity === 'high') {
            itemStyle = 'p-2 bg-red-500/10 border-l-2 border-red-500 rounded text-red-200';
          } else if (alert.type === 'stack') {
            itemStyle = 'p-2 bg-blue-500/10 border-l-2 border-blue-500 rounded text-blue-200';
          } else if (alert.type === 'bye-overlap') {
            itemStyle = 'p-2 bg-emerald-500/10 border-l-2 border-emerald-500 rounded text-emerald-200';
          }

          return (
            <div key={alert.id} className={itemStyle}>
              <strong>{alert.title.toUpperCase()}:</strong> {alert.message}
              {alert.details && alert.details.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {alert.details.map((detail, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-950/70 border border-slate-700 text-[10px] text-slate-300">
                      {detail}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};



