import React, { useState, useRef } from 'react';
import { Player, Position } from '../types';
import { Target, Zap, ShieldAlert, ArrowUp, ArrowDown, GripVertical, Download, Upload } from 'lucide-react';
import { getFormattedPick } from '../utils/calculations';

interface CustomizationTabProps {
  players: Player[];
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void;
  onReorderPlayers: (draggedId: string, targetId: string) => void;
  onMovePlayer: (playerId: string, direction: 'up' | 'down', currentFilter: Position | 'ALL') => void;
  onMoveToRank: (playerId: string, targetRank: number) => void;
  onMoveToPosRank: (playerId: string, targetPosRank: number, pos: string) => void;
  onImportRankings: (players: Player[]) => void;
  leagueSize?: number;
  onLeagueSizeChange?: (size: number) => void;
  onSyncAdp?: (provider: 'sleeper' | 'espn') => void;
  onAutoAssignRoles?: () => void;
}

export const CustomizationTab: React.FC<CustomizationTabProps> = ({
  players,
  onUpdatePlayer,
  onReorderPlayers,
  onMovePlayer,
  onMoveToRank,
  onMoveToPosRank,
  onImportRankings,
  leagueSize = 12,
  onLeagueSizeChange,
  onSyncAdp,
  onAutoAssignRoles,
}) => {
  const [selectedPos, setSelectedPos] = useState<Position | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'OVR' | 'TIER'>('OVR');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adpLastSync, setAdpLastSync] = useState<string | null>(localStorage.getItem('adpLastSync'));

  const handleSyncAdp = async (provider: 'sleeper' | 'espn') => {
    if (onSyncAdp) {
      try {
        await onSyncAdp(provider);
        const dateStr = new Date().toLocaleString('de-DE');
        localStorage.setItem('adpLastSync', dateStr);
        setAdpLastSync(dateStr);
      } catch (err) {
        // error handled in usePlayers
      }
    }
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(players));
    const el = document.createElement("a");
    el.setAttribute("href", dataStr);
    el.setAttribute("download", "ff_draft_rankings_backup.json");
    document.body.appendChild(el);
    el.click();
    el.remove();
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = (e) => {
      try {
        const importedPlayers = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedPlayers) && importedPlayers.length > 0 && importedPlayers[0].id) {
          onImportRankings(importedPlayers);
          alert('Backup erfolgreich geladen!');
        } else {
          alert('UngÃ¼ltiges Backup-Format.');
        }
      } catch (err) {
        alert("Fehler beim Lesen der Backup-Datei.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
  };

  // Filter and sort players
  const displayPlayers = players
    .filter((p) => {
      const matchesPos = selectedPos === 'ALL' || p.pos === selectedPos;
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPos && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'OVR') {
        return sortOrder === 'asc' ? a.ovrRank - b.ovrRank : b.ovrRank - a.ovrRank;
      }
      if (sortBy === 'TIER') {
        const tierA = a.tierNumber || 99;
        const tierB = b.tierNumber || 99;
        if (tierA !== tierB) {
          return sortOrder === 'asc' ? tierA - tierB : tierB - tierA;
        }
        return a.ovrRank - b.ovrRank;
      }
      return 0;
    });

  const isDefaultSort = sortBy === 'OVR' && sortOrder === 'asc';

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires some data to be set
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent, id: string) => {
    // Only clear if we are leaving the element completely (not just entering a child)
    if (dragOverId === id) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    if (!isDefaultSort) return;
    if (draggedId && draggedId !== targetId) {
      onReorderPlayers(draggedId, targetId);
    }
    setDraggedId(null);
  };

  const getTagBadgeClass = (tag?: string | null) => {
    switch (tag) {
      case 'Sleeper':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Target':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Avoid':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return '';
    }
  };

  const getPosBadgeClass = (pos: string) => {
    switch (pos) {
      case 'RB': return 'bg-blue-500/20 text-blue-400';
      case 'WR': return 'bg-green-500/20 text-green-400';
      case 'TE': return 'bg-red-500/20 text-red-400';
      case 'QB': return 'bg-purple-500/20 text-purple-400';
      case 'K': return 'bg-orange-500/20 text-orange-400';
      case 'DST': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            Spieler Anpassen & Eigene Rankings
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleExportBackup} className="px-2.5 py-1 text-[10px] font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors flex items-center gap-1 shadow cursor-pointer">
              <Download className="w-3 h-3" /> Backup (JSON)
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-2.5 py-1 text-[10px] font-bold uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors flex items-center gap-1 shadow cursor-pointer">
              <Upload className="w-3 h-3" /> Laden (JSON)
            </button>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportBackup} className="hidden" />
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Hier kannst du die Reihenfolge der Spieler manuell Ã¼berschreiben, ihre Tiers anpassen und persÃ¶nliche Tags (Sleeper, Target, Avoid) vergeben. 
          Greife einen Spieler am Griff-Symbol links, um ihn per Drag & Drop zu verschieben, oder nutze die Pfeile.
        </p>
        
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-slate-950/50 rounded border border-slate-800">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">LigagrÃ¶ÃŸe:</label>
              <select
                value={leagueSize}
                onChange={(e) => onLeagueSizeChange?.(Number(e.target.value))}
                className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded px-2 py-1 outline-none focus:border-emerald-500"
              >
                {[8, 10, 12, 14, 16].map(size => (
                  <option key={size} value={size}>{size} Teams</option>
                ))}
              </select>
            </div>
                        <button
                onClick={() => onAutoAssignRoles?.()}
                className="px-3 py-1.5 text-[10px] font-bold uppercase bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors flex items-center gap-1.5 shadow"
              >
                <Zap className="w-3.5 h-3.5" />
                Auto-Assign Roles
              </button>
              
              <div className="flex flex-col gap-1.5 items-end">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSyncAdp('sleeper')}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors flex items-center gap-1.5 shadow"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Sleeper ADP Sync
                  </button>
                  <button
                    onClick={() => handleSyncAdp('espn')}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase bg-red-600 hover:bg-red-500 text-white rounded transition-colors flex items-center gap-1.5 shadow"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    ESPN ADP Sync
                  </button>
                </div>
                {adpLastSync && (
                  <span className="text-[10px] text-slate-400 font-mono">Letzter Sync: {adpLastSync}</span>
                )}
              </div>
            </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Spieler suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
          />
          <div className="flex bg-slate-950 p-1 rounded border border-slate-700">
            {(['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPos(pos)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  selectedPos === pos
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
        
        {!isDefaultSort && (
          <div className="bg-amber-900/30 border border-amber-500/50 text-amber-200 p-2.5 rounded text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Du verwendest eine benutzerdefinierte Sortierung. Drag & Drop und die Pfeiltasten sind temporÃ¤r deaktiviert, bis du wieder nach "OVR / POS" aufsteigend sortierst.</span>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
        {/* List Header */}
        <div className="grid grid-cols-12 gap-2 p-3 bg-slate-800/80 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
          <div className="col-span-4 sm:col-span-5 pl-8">Spieler</div>
          <div 
            className="col-span-2 cursor-pointer hover:text-blue-400 flex items-center gap-1 transition-colors"
            onClick={() => {
              if (sortBy === 'OVR') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else { setSortBy('OVR'); setSortOrder('asc'); }
            }}
          >
            OVR / POS {sortBy === 'OVR' && (sortOrder === 'asc' ? 'â†‘' : 'â†“')}
          </div>
          <div 
            className="col-span-3 sm:col-span-2 cursor-pointer hover:text-blue-400 flex items-center gap-1 transition-colors"
            onClick={() => {
              if (sortBy === 'TIER') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else { setSortBy('TIER'); setSortOrder('asc'); }
            }}
          >
            Tier Override {sortBy === 'TIER' && (sortOrder === 'asc' ? 'â†‘' : 'â†“')}
          </div>
          <div className="col-span-3">Custom Tags</div>
        </div>

        {/* List Body */}
        <div className="max-h-[650px] overflow-y-auto custom-scrollbar">
          {displayPlayers.map((player, index) => {
            const isFirst = index === 0;
            const isLast = index === displayPlayers.length - 1;

            return (
              <div
                key={player.id}
                draggable={isDefaultSort}
                onDragStart={(e) => isDefaultSort && handleDragStart(e, player.id)}
                onDragOver={(e) => isDefaultSort && handleDragOver(e, player.id)}
                onDragLeave={(e) => isDefaultSort && handleDragLeave(e, player.id)}
                onDrop={(e) => isDefaultSort && handleDrop(e, player.id)}
                className={`grid grid-cols-12 gap-2 p-3 items-center bg-slate-950/80 transition-colors ${
                  draggedId === player.id ? 'opacity-50 scale-[0.99] bg-slate-800' : 'hover:bg-slate-900'
                } ${dragOverId === player.id ? 'border-t-2 border-t-blue-500 border-b border-b-slate-800/50' : 'border-b border-slate-800/50'}`}
              >
                <div className="col-span-4 sm:col-span-5 flex items-center gap-2">
                  <div className="flex flex-col items-center gap-0.5 mr-1">
                    <button 
                      onClick={() => !isFirst && isDefaultSort && onMovePlayer(player.id, 'up', selectedPos)}
                      disabled={isFirst || !isDefaultSort}
                      className={`p-0.5 rounded ${isFirst || !isDefaultSort ? 'text-slate-800 cursor-not-allowed' : 'text-slate-500 hover:text-white hover:bg-slate-800'} transition-colors cursor-pointer`}
                      title={isDefaultSort ? "Hoch verschieben" : "Verschieben deaktiviert"}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <div className={`p-0.5 ${isDefaultSort ? 'cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400' : 'cursor-not-allowed text-slate-800'}`} title={isDefaultSort ? "Drag & Drop" : "Drag & Drop deaktiviert"}>
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <button 
                      onClick={() => !isLast && isDefaultSort && onMovePlayer(player.id, 'down', selectedPos)}
                      disabled={isLast || !isDefaultSort}
                      className={`p-0.5 rounded ${isLast || !isDefaultSort ? 'text-slate-800 cursor-not-allowed' : 'text-slate-500 hover:text-white hover:bg-slate-800'} transition-colors cursor-pointer`}
                      title={isDefaultSort ? "Runter verschieben" : "Verschieben deaktiviert"}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <div className="font-bold text-slate-200 text-sm">{player.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{player.team}</span>
                      {player.adp !== undefined && (
                        <span className="text-[10px] text-blue-400/80 font-mono">
                          ADP: {getFormattedPick(player.adp, leagueSize).formattedString}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-right">
                    <div className="flex flex-col items-end gap-1 text-xs font-bold text-slate-300">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-500 font-normal">OVR</span>
                        <input 
                          type="number"
                          defaultValue={player.ovrRank}
                          className="w-12 bg-slate-950 border border-slate-700 text-white px-1 py-0.5 rounded text-center appearance-none cursor-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:bg-slate-800 transition-colors"
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val > 0 && val !== player.ovrRank) {
                              onMoveToRank(player.id, val);
                            } else {
                              e.target.value = String(player.ovrRank);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-500 font-normal">POS</span>
                        <input 
                          type="number"
                          key={player.posRank}
                          defaultValue={parseInt(player.posRank.replace(/[^\d]/g, ''), 10)}
                          className={`w-12 bg-slate-950 border border-slate-700 ${player.pos === 'RB' ? 'text-emerald-400' : player.pos === 'WR' ? 'text-sky-400' : player.pos === 'QB' ? 'text-rose-400' : 'text-amber-400'} px-1 py-0.5 rounded text-center appearance-none cursor-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:bg-slate-800 transition-colors`}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const currentPosRank = parseInt(player.posRank.replace(/[^\d]/g, ''), 10);
                            if (!isNaN(val) && val > 0 && val !== currentPosRank) {
                              onMoveToPosRank(player.id, val, player.pos);
                            } else {
                              e.target.value = String(currentPosRank);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                  <div className="col-span-4 sm:col-span-4 flex items-center gap-2">
                    <select
                      value={player.tierNumber || 99}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdatePlayer(player.id, { 
                          tierNumber: val, 
                          tier: val === 99 ? 'Kein Tier' : `Tier ${val}` 
                        });
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(t => (
                        <option key={t} value={t}>Tier {t}</option>
                      ))}
                      <option value={99}>Kein Tier</option>
                    </select>

                    <select
                      value={player.customTag || ''}
                      onChange={(e) => {
                        const val = e.target.value as 'Sleeper' | 'Target' | 'Avoid' | 'Fade' | 'Value' | 'Rookie' | '';
                        onUpdatePlayer(player.id, { customTag: val === '' ? undefined : val });
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Kein Label</option>
                      <option value="Sleeper">Sleeper</option>
                      <option value="Target">Target</option>
                      <option value="Avoid">Avoid</option>
                      <option value="Fade">Fade</option>
                      <option value="Value">Value</option>
                      <option value="Rookie">Rookie</option>
                    </select>

                    <select
                      value={player.playerArchetype || ''}
                      onChange={(e) => {
                        const val = e.target.value as 'Upside' | 'Baseline' | '';
                        onUpdatePlayer(player.id, { playerArchetype: val === '' ? undefined : val });
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Typ (Offen)</option>
                      <option value="Upside">Upside</option>
                      <option value="Baseline">Baseline</option>
                    </select>
                  </div>
              </div>
            );
          })}
          
          {displayPlayers.length === 0 && (
            <div className="p-8 text-center text-slate-500 italic text-sm">
              Keine Spieler gefunden.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



