/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Player, DraftSettings } from './types';
import { INITIAL_PLAYERS } from './data/initialPlayers';
import { getUpdatedPlayers } from './data/updateRankings';
import { calculateRosterSlots, generateLiveAlerts } from './utils/calculations';
import { usePlayers } from './hooks/usePlayers';

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

  // Handlers for Draft Actions that also update settings
  const onDraftForMeWrapper = (player: Player) => {
    handleDraftForMe(player);
    setSettings((prev) => ({
      ...prev,
      currentOverallPick: prev.currentOverallPick + 1,
    }));
  };

  const onDraftForOpponentWrapper = (player: Player) => {
    handleDraftForOpponent(player);
    setSettings((prev) => ({
      ...prev,
      currentOverallPick: prev.currentOverallPick + 1,
    }));
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
            onDraftForMe={onDraftForMeWrapper}
            onDraftForOpponent={onDraftForOpponentWrapper}
            onRemoveFromTeam={handleResetStatus}
          />
        )}

        {activeTab === 'board' && (
          <MasterBoardTab
            players={players}
            settings={settings}
            onDraftForMe={onDraftForMeWrapper}
            onDraftForOpponent={onDraftForOpponentWrapper}
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
            onDraftForMe={onDraftForMeWrapper}
            onDraftForOpponent={onDraftForOpponentWrapper}
          />
        )}

        {activeTab === 'tiers' && (
          <TiersTab
            players={players}
            settings={settings}
            onDraftForMe={onDraftForMeWrapper}
            onDraftForOpponent={onDraftForOpponentWrapper}
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
