import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, X, Plus } from 'lucide-react';
import { Player, DraftSettings } from '../types';

interface DraftManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  settings: DraftSettings;
}

interface DraftProfile {
  id: string;
  name: string;
  createdAt: number;
  playersStr: string;
  settingsStr: string;
}

export const DraftManagerModal: React.FC<DraftManagerModalProps> = ({
  isOpen,
  onClose,
  players,
  settings,
}) => {
  const [profiles, setProfiles] = useState<DraftProfile[]>([]);
  const [newProfileName, setNewProfileName] = useState('');

  const loadProfiles = () => {
    const loadedProfiles: DraftProfile[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ff_command_center_profile_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          loadedProfiles.push({
            id: key,
            name: data.name,
            createdAt: data.createdAt,
            playersStr: data.playersStr,
            settingsStr: data.settingsStr,
          });
        } catch (e) {
          console.error("Error loading profile", e);
        }
      }
    }
    loadedProfiles.sort((a, b) => b.createdAt - a.createdAt);
    setProfiles(loadedProfiles);
  };

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveDraft = () => {
    if (!newProfileName.trim()) return;
    const key = `ff_command_center_profile_${Date.now()}`;
    const data = {
      name: newProfileName.trim(),
      createdAt: Date.now(),
      playersStr: JSON.stringify(players),
      settingsStr: JSON.stringify(settings),
    };
    localStorage.setItem(key, JSON.stringify(data));
    setNewProfileName('');
    loadProfiles();
  };

  const handleLoadDraft = (profile: DraftProfile) => {
    if (confirm(`Möchtest du den Draft "${profile.name}" wirklich laden? Der aktuelle, ungespeicherte Fortschritt geht dabei verloren!`)) {
      localStorage.setItem('ff_command_center_players_2026', profile.playersStr);
      try {
        const pSettings = JSON.parse(profile.settingsStr);
        if (pSettings.leagueSize) {
          localStorage.setItem('ff_command_center_league_size_2026', pSettings.leagueSize.toString());
        }
      } catch(e) {}
      
      window.location.reload();
    }
  };

  const handleDeleteDraft = (id: string) => {
    if (confirm('Dieses Draft-Profil wirklich unwiderruflich löschen?')) {
      localStorage.removeItem(id);
      loadProfiles();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-700 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-xs text-slate-100 uppercase tracking-wider">DRAFT MANAGER</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-6">
          {/* Save New Profile */}
          <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Aktuellen Draft Speichern
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Name (z.B. Slow Draft Liga 1)"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSaveDraft}
                disabled={!newProfileName.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded shadow transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Speichern
              </button>
            </div>
          </div>

          {/* Load Profiles */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-400" /> Gespeicherte Drafts
            </h3>
            
            {profiles.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm border border-slate-800 rounded-lg bg-slate-900/50 border-dashed">
                Keine gespeicherten Drafts gefunden.
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map(profile => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
                    <div>
                      <div className="font-bold text-slate-200 text-sm">{profile.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Gespeichert am: {new Date(profile.createdAt).toLocaleString('de-DE')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoadDraft(profile)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Laden
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(profile.id)}
                        className="p-1.5 bg-rose-950/50 hover:bg-rose-900 text-rose-400 rounded transition-colors border border-rose-900/50 cursor-pointer"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
