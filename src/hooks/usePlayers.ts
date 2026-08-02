import { useState, useEffect } from 'react';
import { Player } from '../types';
import { INITIAL_PLAYERS } from '../data/initialPlayers';
import { getUpdatedPlayers } from '../data/updateRankings';
import { enrichPlayerData } from '../utils/calculations';

const STORAGE_KEY_PLAYERS = 'ff_command_center_players_2026';
const STORAGE_KEY_LEAGUE_SIZE = 'ff_command_center_league_size_2026';
const DATA_VERSION_KEY = 'ff_command_center_data_version';
const CURRENT_DATA_VERSION = 'v10-data-reset';

const deduplicatePlayers = (list: Player[]) => {
  const seen = new Set();
  return list.filter(p => {
    const name = p.name.toLowerCase().trim();
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
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

export const usePlayers = () => {
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      if (saved) {
        let parsedPlayers: Player[] = JSON.parse(saved);
        // Fix any encoding issues from previous versions
        parsedPlayers = parsedPlayers.map(p => {
          if (typeof p.status === 'string' && /^Verf.*gbar$/.test(p.status)) {
            p.status = 'Verfügbar';
          }
          return p;
        });
        return enrichPlayerData(deduplicatePlayers(parsedPlayers));
      }
    } catch (e) {
      console.error('Failed to load saved players from localStorage', e);
    }
    return enrichPlayerData(deduplicatePlayers(INITIAL_PLAYERS));
  });

  const [leagueSize, setLeagueSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LEAGUE_SIZE);
      if (saved) return parseInt(saved, 10);
    } catch (e) {
      // ignore
    }
    return 12;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LEAGUE_SIZE, leagueSize.toString());
  }, [leagueSize]);

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
        
        // Because CURRENT_DATA_VERSION changed, we want to bring in new generic players
        // from INITIAL_PLAYERS but preserve user statuses and tags
        const freshPlayers = INITIAL_PLAYERS;
        
        // Merge existing status and tags
          const mergedPlayers = freshPlayers.map(fresh => {
            const existing = players.find(p => p.name.toLowerCase().trim() === fresh.name.toLowerCase().trim());
            if (existing) {
              return { 
                ...fresh, 
                status: (existing.status && /^Verf.*gbar$/.test(existing.status)) ? fresh.status : existing.status,
                customTag: existing.customTag || fresh.customTag
              };
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

  const handleDraftForMe = (player: Player, pickNumber: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...p, status: 'Mein Team', draftedAtPick: pickNumber } : p))
    );
  };

  const handleDraftForOpponent = (player: Player, pickNumber: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...p, status: 'Gedraftet (Gegner)', draftedAtPick: pickNumber } : p))
    );
  };

  const handleResetStatus = (player: Player) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === player.id) {
          const { draftedAtPick, ...rest } = p;
          return { ...rest, status: 'Verfügbar' };
        }
        return p;
      })
    );
  };

  const handleResetDraft = () => {
    setPlayers(INITIAL_PLAYERS);
  };

  const handleUpdatePlayer = (playerId: string, updates: Partial<Player>) => {
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, ...updates } : p)));
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
       INITIAL_PLAYERS.forEach(systemPlayer => {
          if (!merged.find(p => p.name.toLowerCase().trim() === systemPlayer.name.toLowerCase().trim())) {
             merged.push(systemPlayer);
          }
       });
       return recomputeRanks(deduplicatePlayers(merged));
    });
  };

  const syncAdp = async (provider: 'sleeper' | 'espn' = 'sleeper') => {
    try {
      const adpMap: Record<string, number> = {};
      const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '').replace(/jr$/, '').replace(/sr$/, '').replace(/iii$/, '').replace(/ii$/, '');

      if (provider === 'sleeper') {
        const res = await fetch("https://api.sleeper.app/projections/nfl/2026?season_type=regular&position[]=DEF&position[]=K&position[]=QB&position[]=RB&position[]=TE&position[]=WR&order_by=adp");
        if (!res.ok) throw new Error('Failed to fetch Sleeper data');
        const data = await res.json();
        
        for (const p of data) {
          if (p.player && p.player.first_name && p.player.last_name && p.stats && p.stats.adp_half_ppr) {
            const name = `${p.player.first_name} ${p.player.last_name}`;
            adpMap[normalizeName(name)] = p.stats.adp_half_ppr;
          }
        }
      } else {
        throw new Error('ESPN ADP Sync is not implemented directly on the client yet.');
      }
      
      setPlayers(prev => prev.map(p => {
        const normName = normalizeName(p.name);
        const adp = adpMap[normName];
        if (adp !== undefined && adp < 999) {
          return { ...p, adp };
        }
        return p;
      }));
      alert(`Erfolgreich ADP Daten von ${provider === 'espn' ? 'ESPN' : 'Sleeper'} synchronisiert!`);
    } catch (error) {
      console.error('Error syncing ADP:', error);
      alert('Fehler beim Synchronisieren der ADP Daten. ' + (error instanceof Error ? error.message : ''));
      throw error;
    }
  };

  const autoAssignRoles = () => {
    setPlayers(prev => {
      // Create a copy and sort by ovrRank to ensure we assign highest rank first
      const sorted = [...prev].sort((a, b) => a.ovrRank - b.ovrRank);
      
      const teamCounts: Record<string, { rb: number, wr: number }> = {};
      
      const mapped = sorted.map(p => {
        if (!teamCounts[p.team]) teamCounts[p.team] = { rb: 0, wr: 0 };
        
        let newP = { ...p };
        if (p.pos === 'RB') {
          teamCounts[p.team].rb += 1;
          const count = teamCounts[p.team].rb;
          if (count === 1) newP.rbRole = 'RB1';
          else if (count === 2) newP.rbRole = 'RB2';
          else if (count === 3) newP.rbRole = 'RB3';
          else if (count === 4) newP.rbRole = 'Handcuff';
        } else if (p.pos === 'WR') {
          teamCounts[p.team].wr += 1;
          const count = teamCounts[p.team].wr;
          if (count === 1) newP.wrRole = 'WR1';
          else if (count === 2) newP.wrRole = 'WR2';
          else if (count === 3) newP.wrRole = 'WR3';
          else if (count >= 4) newP.wrRole = 'WR4';
        }
        return newP;
      });
      
      alert('Depth Chart Rollen wurden basierend auf der aktuellen Rangliste zugewiesen!');
      return mapped.sort((a, b) => a.ovrRank - b.ovrRank);
    });
  };

  return {
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
  };
};

