/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Player, DraftSettings } from './types';
import { INITIAL_PLAYERS } from './data/initialPlayers';
import { getUpdatedPlayers } from './data/updateRankings';
import { calculateRosterSlots, generateLiveAlerts, findNextUserPickSlot, findNextOpponentPickSlot, isUserPickSlot } from './utils/calculations';
import { playTurnSound, playSuccessSound, playWarningSound } from './utils/audio';
import { usePlayers } from './hooks/usePlayers';

// Components
import { FullDraftboardTab } from './components/FullDraftboardTab';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { MasterBoardTab } from './components/MasterBoardTab';
import { MyTeamTab } from './components/MyTeamTab';
import { SleepersHandcuffsTab } from './components/SleepersHandcuffsTab';
import { ValuePlayersTab } from './components/ValuePlayersTab';
import { TiersTab } from './components/TiersTab';
import { CustomizationTab } from './components/CustomizationTab';
import { GridBoardTab } from './components/GridBoardTab';
import { ExportModal } from './components/ExportModal';

import { LayoutDashboard, Table, Grid, LayoutGrid, Layers, Settings2, Shield, Sparkles, Ghost, Check, X } from 'lucide-react';

const STORAGE_KEY_SETTINGS = 'ff_command_center_settings_2026';

export default function App() {
  const {
    players,
    handleDraftForMe,
    handleDraftForOpponent,
    handleResetStatus,
    handleResetDraft,
    handleUpdatePlayer,
    handleReorderPlayers,
    handleMovePlayer,
    handleMoveToRank,
    handleMoveToPosRank,
    handleImportRankings,
    leagueSize,
    setLeagueSize,
    syncAdp,
    autoAssignRoles
  } = usePlayers();

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
      totalRounds: 16,
      scoringFormat: 'Half-PPR',
      leagueType: 'Redraft',
      userPickSlot: 1,
      currentOverallPick: 1,
    };
  });

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'board' | 'grid' | 'fullboard' | 'myteam' | 'sleepers' | 'value' | 'tiers' | 'customization'
  >('dashboard');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Global Ghost Draft Mode
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [ghostPicks, setGhostPicks] = useState<{playerId: string, isUser: boolean}[]>([]);

  // Save to LocalStorage on changes

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_SETTINGS && e.newValue) {
        setSettings(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Total drafted players count
  const totalDraftedCount = players.filter((p) => p.status !== 'Verfügbar').length;

  // Audio Feedback on Turn
  useEffect(() => {
    if (totalDraftedCount > 0 && isUserPickSlot(settings.currentOverallPick, settings.userPickSlot, settings.leagueSize)) {
      playTurnSound();
    }
  }, [settings.currentOverallPick, settings.userPickSlot, settings.leagueSize, totalDraftedCount]);

  // Auto-update current pick based on drafted count if not manually overridden
  const activePlayers = useMemo(() => {
    if (!isGhostMode) return players;
    return players.map(p => {
      const ghostIndex = ghostPicks.findIndex(g => g.playerId === p.id);
      if (ghostIndex !== -1) {
        const ghost = ghostPicks[ghostIndex];
        return {
          ...p,
          status: ghost.isUser ? 'Mein Team' : 'Gedraftet (Gegner)',
          draftedAtPick: settings.currentOverallPick + ghostIndex,
          isGhostPick: true
        } as Player;
      }
      return p;
    });
  }, [players, isGhostMode, ghostPicks, settings.currentOverallPick]);

  const activeSettings = useMemo(() => {
    if (!isGhostMode) return settings;
    return {
      ...settings,
      currentOverallPick: settings.currentOverallPick + ghostPicks.length
    };
  }, [settings, isGhostMode, ghostPicks]);

  const userTeam = activePlayers.filter((p) => p.status === 'Mein Team');
  const roster = calculateRosterSlots(userTeam, activeSettings.scoringFormat);
  const alerts = generateLiveAlerts(activePlayers, userTeam, activeSettings);

  const onDraftForMeWrapper = (player: Player) => {
    if (isGhostMode) {
      setGhostPicks(prev => [...prev, { playerId: player.id, isUser: true }]);
      return;
    }
    if (player.customTag === 'Sleeper' || player.customTag === 'Target') playSuccessSound();
    if (player.customTag === 'Avoid' || player.customTag === 'Fade') playWarningSound();
    
    const assignedSlot = findNextUserPickSlot(players, settings.userPickSlot, settings.leagueSize, settings.totalRounds);
    handleDraftForMe(player, assignedSlot);
    setSettings((prev) => ({
      ...prev,
      currentOverallPick: Math.max(prev.currentOverallPick, assignedSlot + 1),
    }));
  };

  const onDraftForOpponentWrapper = (player: Player) => {
    if (isGhostMode) {
      setGhostPicks(prev => [...prev, { playerId: player.id, isUser: false }]);
      return;
    }
    const assignedSlot = findNextOpponentPickSlot(players, settings.userPickSlot, settings.leagueSize, settings.totalRounds);
    handleDraftForOpponent(player, assignedSlot);
    setSettings((prev) => ({
      ...prev,
      currentOverallPick: Math.max(prev.currentOverallPick, assignedSlot + 1),
    }));
  };

  const onResetStatusWrapper = (player: Player) => {
    if (isGhostMode && player.isGhostPick) {
      setGhostPicks(prev => prev.filter(g => g.playerId !== player.id));
      return;
    }
    handleResetStatus(player);
    if (player.draftedAtPick === settings.currentOverallPick - 1) {
      setSettings((prev) => ({
        ...prev,
        currentOverallPick: Math.max(1, prev.currentOverallPick - 1),
      }));
    }
  };

  const applyGhostPicks = () => {
    let currentOverall = settings.currentOverallPick;
    ghostPicks.forEach(ghost => {
      const p = players.find(p => p.id === ghost.playerId);
      if (p) {
        if (ghost.isUser) {
          handleDraftForMe(p, currentOverall);
        } else {
          handleDraftForOpponent(p, currentOverall);
        }
        currentOverall++;
      }
    });
    setSettings(prev => ({ ...prev, currentOverallPick: currentOverall }));
    setGhostPicks([]);
    setIsGhostMode(false);
  };

  const onResetDraftWrapper = () => {
    if (window.confirm('Möchtest Du wirklich den gesamten Draft zurücksetzen? Alle Picks werden entfernt.')) {
      handleResetDraft();
      setSettings((prev) => ({ ...prev, currentOverallPick: 1 }));
    }
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
        onResetDraft={onResetDraftWrapper}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        totalDraftedCount={totalDraftedCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Global Ghost Draft Banner */}
        {isGhostMode && (
          <div className="bg-purple-900/40 border border-purple-500 rounded-lg p-3 flex items-center justify-between shadow-[0_0_15px_rgba(168,85,247,0.2)] animate-pulse-slow">
            <div className="flex items-center gap-3">
              <Ghost className="w-6 h-6 text-purple-400 animate-bounce" />
              <div>
                <h2 className="text-purple-300 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  Ghost Draft Modus Aktiv
                </h2>
                <p className="text-[11px] text-purple-200/70 font-mono">
                  {ghostPicks.length} Picks simuliert. Die Auswirkungen werden live im Dashboard berechnet.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setGhostPicks([]);
                  setIsGhostMode(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-600"
              >
                <X className="w-4 h-4" /> Verwerfen & Beenden
              </button>
              <button
                onClick={applyGhostPicks}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
              >
                <Check className="w-4 h-4" /> Szenario Übernehmen
              </button>
            </div>
          </div>
        )}

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
            MASTER DRAFT BOARD
          </button>

          <button
            id="tab-grid"
            onClick={() => setActiveTab('grid')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'grid'
                ? 'border-blue-500 bg-blue-500/10 text-white rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-t'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-blue-400" />
            GRID BOARD
          </button>

          <button
            id="tab-fullboard"
            onClick={() => setActiveTab('fullboard')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'fullboard'
                ? 'border-blue-500 bg-blue-500/10 text-white rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-t'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
            FULL BOARD
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
            id="tab-value"
            onClick={() => setActiveTab('value')}
            className={`flex-1 min-w-[150px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === 'value'
                ? 'border-emerald-500 bg-emerald-500/10 text-white rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-t'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Value Analyse</span>
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
            <Settings2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Setup & Liga</span>
          </button>

          <button
            onClick={() => setIsGhostMode(!isGhostMode)}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition-all cursor-pointer rounded-lg border ${
              isGhostMode
                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                : 'bg-purple-900/20 border-purple-700/50 text-purple-400 hover:bg-purple-900/40 hover:text-purple-300'
            }`}
            title="Szenarien mit fiktiven Picks durchspielen"
          >
            <Ghost className="w-3.5 h-3.5" />
            <span>{isGhostMode ? 'GHOST BEENDEN' : 'GHOST STARTEN'}</span>
          </button>
        </nav>

        {/* Tab Contents */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            players={activePlayers}
            userTeam={userTeam}
            roster={roster}
            settings={activeSettings}
            alerts={alerts}
            onDraftForMe={onDraftForMeWrapper}
            onDraftForOpponent={onDraftForOpponentWrapper}
            onRemoveFromTeam={onResetStatusWrapper}
          />
        )}

        {activeTab === 'board' && (
          <MasterBoardTab
            players={activePlayers}
            settings={activeSettings}
            onDraftForMe={onDraftForMeWrapper}
            onDraftForOpponent={onDraftForOpponentWrapper}
            onResetStatus={onResetStatusWrapper}
          />
        )}

        {activeTab === 'grid' && (
          <GridBoardTab
            players={activePlayers}
            userTeam={userTeam}
            settings={activeSettings}
            alerts={alerts}
            onDraftForMe={onDraftForMeWrapper}
            onDraftForOpponent={onDraftForOpponentWrapper}
            onResetStatus={onResetStatusWrapper}
          />
        )}

        {activeTab === 'fullboard' && (
          <FullDraftboardTab
            players={activePlayers}
            settings={activeSettings}
          />
        )}

        {activeTab === 'myteam' && (
          <MyTeamTab
            players={activePlayers}
            userTeam={userTeam}
            roster={roster}
            settings={activeSettings}
            onRemoveFromTeam={onResetStatusWrapper}
          />
        )}

        {activeTab === 'sleepers' && (
          <SleepersHandcuffsTab
            players={activePlayers}
            userTeam={userTeam}
            settings={activeSettings}
            onDraftForMe={onDraftForMeWrapper}
            onDraftForOpponent={onDraftForOpponentWrapper}
          />
        )}

        {activeTab === 'value' && (
          <ValuePlayersTab
            players={activePlayers}
            settings={activeSettings}
            onDraftForMe={onDraftForMeWrapper}
            onDraftForOpponent={onDraftForOpponentWrapper}
          />
        )}

        {activeTab === 'tiers' && (
          <TiersTab
            players={activePlayers}
            settings={activeSettings}
            onDraftForMe={onDraftForMeWrapper}
            onDraftForOpponent={onDraftForOpponentWrapper}
          />
        )}

        {activeTab === 'customization' && (
          <CustomizationTab 
            players={activePlayers} 
            onUpdatePlayer={handleUpdatePlayer}
            onReorderPlayers={handleReorderPlayers}
            onMovePlayer={handleMovePlayer}
            onMoveToRank={handleMoveToRank}
            onMoveToPosRank={handleMoveToPosRank}
            onImportRankings={handleImportRankings}
            leagueSize={leagueSize}
            onLeagueSizeChange={setLeagueSize}
            onSyncAdp={syncAdp}
            onAutoAssignRoles={autoAssignRoles}
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
