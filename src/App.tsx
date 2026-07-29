/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Player, DraftSettings } from './types';
import { INITIAL_PLAYERS } from './data/initialPlayers';
import { getUpdatedPlayers } from './data/updateRankings';
import { calculateRosterSlots, generateLiveAlerts, enrichPlayerData } from './utils/calculations';

// Components
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { MasterBoardTab } from './components/MasterBoardTab';
import { MyTeamTab } from './components/MyTeamTab';
import { SleepersHandcuffsTab } from './components/SleepersHandcuffsTab';
import { TiersTab } from './components/TiersTab';
import { CustomizationTab } from './components/CustomizationTab';
import { ExportModal } from './components/ExportModal';

import { LayoutDashboard, Table, Layers, SlidersHorizontal, Shield, Sparkles } from 'lucide-react';

const STORAGE_KEY_PLAYERS = 'ff_command_center_players_2026';
const STORAGE_KEY_SETTINGS = 'ff_command_center_settings_2026';
const DATA_VERSION_KEY = 'ff_command_center_data_version';
const CURRENT_DATA_VERSION = 'v9-enriched-roles';

const deduplicatePlayers = (list: Player[]) => {
  const seen = new Set();
  return list.filter(p => {
    const name = p.name.toLowerCase().trim();
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
};

export default function App() {
  // 1. Initial State with LocalStorage persistence
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      if (saved) {
        return enrichPlayerData(deduplicatePlayers(JSON.parse(saved)));
      }
    } catch (e) {
      console.error('Failed to load saved players from localStorage', e);
    }
    return enrichPlayerData(deduplicatePlayers(INITIAL_PLAYERS));
  });

  const [settings, setSettings] = useState<DraftSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load saved settings from localStorage', e);
    }
    return {
      leagueSize: 12,
      scoringFormat: 'Half-PPR',
      leagueType: 'Redraft',
      userPickSlot: 1,
      currentOverallPick: 1,
    };
  });

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'board' | 'myteam' | 'sleepers' | 'tiers' | 'customization'
  >('dashboard');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Save to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
    } catch (e) {
      console.error('Failed to save players', e);
    }
  }, [players]);

  // Data update merge logic
  useEffect(() => {
    try {
      const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
      if (storedVersion !== CURRENT_DATA_VERSION) {
        console.log(`Upgrading data from ${storedVersion} to ${CURRENT_DATA_VERSION}`);
        const freshPlayers = getUpdatedPlayers();
        
        // Merge existing status
        const mergedPlayers = freshPlayers.map(fresh => {
          const existing = players.find(p => p.name.toLowerCase().trim() === fresh.name.toLowerCase().trim());
          if (existing && existing.status !== 'Verfügbar') {
            return { ...fresh, status: existing.status };
          }
          return fresh;
        });
        
        setPlayers(enrichPlayerData(deduplicatePlayers(mergedPlayers)));
        localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
      }
    } catch (e) {
      console.error('Failed to apply data update', e);
    }
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  // Total drafted players count
  const totalDraftedCount = players.filter((p) => p.status !== 'Verfügbar').length;

  // Auto-update current pick based on drafted count if not manually overridden
  const userTeam = players.filter((p) => p.status === 'Mein Team');
  const roster = calculateRosterSlots(userTeam, settings.scoringFormat);
  const alerts = generateLiveAlerts(players, userTeam, settings.scoringFormat);

  // Handlers for Draft Actions
  const handleDraftForMe = (player: Player) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...p, status: 'Mein Team' } : p))
    );
    setSettings((prev) => ({
      ...prev,
      currentOverallPick: prev.currentOverallPick + 1,
    }));
  };

  const handleDraftForOpponent = (player: Player) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...p, status: 'Gedraftet (Gegner)' } : p))
    );
    setSettings((prev) => ({
      ...prev,
      currentOverallPick: prev.currentOverallPick + 1,
    }));
  };

  const handleResetStatus = (player: Player) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...p, status: 'Verfügbar' } : p))
    );
  };

  const handleResetDraft = () => {
    if (window.confirm('Möchtest Du wirklich den gesamten Draft zurücksetzen? Alle Picks werden entfernt.')) {
      setPlayers(INITIAL_PLAYERS);
      setSettings((prev) => ({ ...prev, currentOverallPick: 1 }));
    }
  };

  const handleUpdatePlayer = (playerId: string, updates: Partial<Player>) => {
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, ...updates } : p)));
  };

  const recomputeRanks = (list: Player[]) => {
    const sorted = [...list];
    const posCounts: Record<string, number> = {};
    return sorted.map((p, idx) => {
      const pos = p.pos;
      posCounts[pos] = (posCounts[pos] || 0) + 1;
      return {
        ...p,
        ovrRank: idx + 1,
        posRank: `${pos}${posCounts[pos]}`
      };
    });
  };

  const handleReorderPlayers = (draggedId: string, targetId: string) => {
    setPlayers(prev => {
      const draggedIndex = prev.findIndex(p => p.id === draggedId);
      const targetIndex = prev.findIndex(p => p.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      const newList = [...prev];
      const [draggedItem] = newList.splice(draggedIndex, 1);
      newList.splice(targetIndex, 0, draggedItem);
      return recomputeRanks(newList);
    });
  };

  const handleMovePlayer = (playerId: string, direction: 'up' | 'down', currentFilter: string = 'ALL') => {
    setPlayers(prev => {
      const idx = prev.findIndex(p => p.id === playerId);
      if (idx === -1) return prev;
      
      let swapIdx = -1;
      if (direction === 'up') {
        for (let i = idx - 1; i >= 0; i--) {
          if (currentFilter === 'ALL' || prev[i].pos === currentFilter) {
            swapIdx = i;
            break;
          }
        }
      } else {
        for (let i = idx + 1; i < prev.length; i++) {
          if (currentFilter === 'ALL' || prev[i].pos === currentFilter) {
            swapIdx = i;
            break;
          }
        }
      }

      if (swapIdx === -1) return prev;
      
      const newList = [...prev];
      const [movedItem] = newList.splice(idx, 1);
      newList.splice(swapIdx, 0, movedItem);
      return recomputeRanks(newList);
    });
  };

  const handleMoveToRank = (playerId: string, targetRank: number) => {
    setPlayers(prev => {
      const draggedIndex = prev.findIndex(p => p.id === playerId);
      if (draggedIndex === -1) return prev;
      
      const newList = [...prev];
      const [draggedItem] = newList.splice(draggedIndex, 1);
      
      // Calculate target index (1-based to 0-based index)
      // Cap the target index within the array bounds
      let targetIndex = targetRank - 1;
      if (targetIndex < 0) targetIndex = 0;
      if (targetIndex > newList.length) targetIndex = newList.length;
      
      newList.splice(targetIndex, 0, draggedItem);
      return recomputeRanks(newList);
    });
  };

  const handleMoveToPosRank = (playerId: string, targetPosRank: number, pos: string) => {
    setPlayers(prev => {
      const draggedIndex = prev.findIndex(p => p.id === playerId);
      if (draggedIndex === -1) return prev;
      
      const newList = [...prev];
      const [draggedItem] = newList.splice(draggedIndex, 1);
      
      let posCount = 0;
      let targetIndex = newList.length;
      
      for (let i = 0; i < newList.length; i++) {
        if (newList[i].pos === pos) {
          posCount++;
          if (posCount === targetPosRank) {
            targetIndex = i;
            break;
          }
        }
      }
      
      newList.splice(targetIndex, 0, draggedItem);
      return recomputeRanks(newList);
    });
  };

  const handleImportRankings = (importedPlayers: Player[]) => {
    setPlayers(prev => {
       const merged = [...importedPlayers];
       // Add any new players that exist in INITIAL_PLAYERS but not in the imported backup
       // MATCH BY NAME TO AVOID DUPLICATES IF IDs CHANGED
       INITIAL_PLAYERS.forEach(systemPlayer => {
          if (!merged.find(p => p.name.toLowerCase().trim() === systemPlayer.name.toLowerCase().trim())) {
             merged.push(systemPlayer);
          }
       });
       return recomputeRanks(deduplicatePlayers(merged));
    });
  };

  const handleUpdateSettings = (newSettings: Partial<DraftSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans antialiased flex flex-col">
      {/* Header with League Controls */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetDraft={handleResetDraft}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        totalDraftedCount={totalDraftedCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Navigation Tabs Bar */}
        <nav className="flex flex-wrap bg-slate-900/80 border border-slate-700 p-1 rounded-lg shadow-xl gap-1">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'dashboard'
                ? 'border-blue-500 bg-blue-500/10 text-white rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-t'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
            <span>Dashboard</span>
          </button>

          <button
            id="tab-board"
            onClick={() => setActiveTab('board')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'board'
                ? 'border-blue-500 bg-blue-500/10 text-white rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-t'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-blue-400" />
            <span>Master Draft Board</span>
          </button>

          <button
            id="tab-myteam"
            onClick={() => setActiveTab('myteam')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'myteam'
                ? 'border-emerald-500 bg-emerald-500/10 text-white rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-t'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mein Team</span>
            {userTeam.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                {userTeam.length}
              </span>
            )}
          </button>

          <button
            id="tab-sleepers"
            onClick={() => setActiveTab('sleepers')}
            className={`flex-1 min-w-[150px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'sleepers'
                ? 'border-amber-500 bg-amber-500/10 text-white rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-t'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sleepers & Handcuffs</span>
          </button>

          <button
            id="tab-tiers"
            onClick={() => setActiveTab('tiers')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'tiers'
                ? 'border-blue-500 bg-blue-500/10 text-white rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-t'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Positional Tiers</span>
          </button>

          <button
            id="tab-customization"
            onClick={() => setActiveTab('customization')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'customization'
                ? 'border-blue-500 bg-blue-500/10 text-white rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-t'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span>Spieler Anpassen</span>
          </button>
        </nav>

        {/* Tab Contents */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            players={players}
            userTeam={userTeam}
            roster={roster}
            settings={settings}
            alerts={alerts}
            onDraftForMe={handleDraftForMe}
            onDraftForOpponent={handleDraftForOpponent}
            onRemoveFromTeam={handleResetStatus}
          />
        )}

        {activeTab === 'board' && (
          <MasterBoardTab
            players={players}
            settings={settings}
            onDraftForMe={handleDraftForMe}
            onDraftForOpponent={handleDraftForOpponent}
            onResetStatus={handleResetStatus}
          />
        )}

        {activeTab === 'myteam' && (
          <MyTeamTab
            userTeam={userTeam}
            roster={roster}
            settings={settings}
            onRemoveFromTeam={handleResetStatus}
          />
        )}

        {activeTab === 'sleepers' && (
          <SleepersHandcuffsTab
            players={players}
            userTeam={userTeam}
            settings={settings}
            onDraftForMe={handleDraftForMe}
            onDraftForOpponent={handleDraftForOpponent}
          />
        )}

        {activeTab === 'tiers' && (
          <TiersTab
            players={players}
            settings={settings}
            onDraftForMe={handleDraftForMe}
            onDraftForOpponent={handleDraftForOpponent}
          />
        )}

        {activeTab === 'customization' && (
          <CustomizationTab 
            players={players} 
            onUpdatePlayer={handleUpdatePlayer}
            onReorderPlayers={handleReorderPlayers}
            onMovePlayer={handleMovePlayer}
            onMoveToRank={handleMoveToRank}
            onMoveToPosRank={handleMoveToPosRank}
            onImportRankings={handleImportRankings}
          />
        )}
      </main>

      {/* High Density Footer */}
      <footer className="h-8 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-6 text-[10px] font-mono text-slate-500 mt-auto">
        <div>LOGGED AS: SYSTEM_ADMIN (2026-08-15)</div>
        <div className="flex gap-4">
          <span>API STATUS: <span className="text-emerald-500 font-bold">STABLE</span></span>
          <span>ENGINE: BALLERS_LOGIC_V4</span>
          <span>DB: REDRAFT_{settings.scoringFormat.toUpperCase()}</span>
        </div>
      </footer>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        players={players}
        settings={settings}
      />
    </div>
  );
}
