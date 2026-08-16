import { useState, useEffect } from 'react';
import { Player } from '../types';
import { INITIAL_PLAYERS } from '../data/initialPlayers';
import { getUpdatedPlayers } from '../data/updateRankings';
import { enrichPlayerData } from '../utils/calculations';

const STORAGE_KEY_PLAYERS = 'ff_command_center_players_2026';
const STORAGE_KEY_LEAGUE_SIZE = 'ff_command_center_league_size_2026';
const DATA_VERSION_KEY = 'ff_command_center_data_version_2026';
const CURRENT_DATA_VERSION = 'v21-granular-tiers';

const deduplicatePlayers = (list: Player[]) => {
  const seen = new Set();
  
  const sanitizeName = (name: string) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // removes diacritics
      .replace(/[^a-zA-Z\s.-]/g, "")   // removes corrupted characters
      .trim()
      .toLowerCase();
  };

  return list.filter(p => {
    if (!p || !p.name) return false;
    
    // Quick fix for the specific corrupted Audric Estime
    if (p.name.includes('Estim') && p.id !== 'rb-audricestim') return false;
    
    const name = sanitizeName(p.name);
    if (!name) return false;
    
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

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_PLAYERS && e.newValue) {
        setPlayers(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    setPlayers(prev => {
      const updated = prev.map(p => p.id === playerId ? { ...p, ...updates } : p);
      return recomputeRanks(updated);
    });
  };

  const handleBulkUpdatePlayers = (updates: {id: string, changes: Partial<Player>}[]) => {
    setPlayers(prev => {
      let updated = [...prev];
      updates.forEach(update => {
        updated = updated.map(p => p.id === update.id ? { ...p, ...update.changes } : p);
      });
      return recomputeRanks(updated);
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
       const merged = importedPlayers.map(importedPlayer => {
          const systemPlayer = INITIAL_PLAYERS.find(p => p.name.toLowerCase().trim() === importedPlayer.name.toLowerCase().trim());
          if (systemPlayer) {
             let finalCustomTag = importedPlayer.customTag;
             // Force-strip obsolete Rookie tags from old backups if the system says they aren't a rookie anymore
             if (finalCustomTag === 'Rookie' && systemPlayer.customTag !== 'Rookie') {
                finalCustomTag = undefined;
             }
             
             // Normalize tier strings to remove flavor text (e.g. "Tier 3: Solid RB2s" -> "Tier 3")
             let finalTier = importedPlayer.tier || systemPlayer.tier;
             if (finalTier && finalTier.includes(':')) {
                 finalTier = finalTier.split(':')[0].trim();
             }
             
             return {
                ...importedPlayer,
                playerArchetype: systemPlayer.playerArchetype,
                profile: systemPlayer.profile,
                // The user's JSON backup takes precedence for Tiers and Tags!
                tier: finalTier,
                tierNumber: importedPlayer.tierNumber || systemPlayer.tierNumber,
                customTag: finalCustomTag || systemPlayer.customTag
             };
          }
          return importedPlayer;
       });
       
       INITIAL_PLAYERS.forEach(systemPlayer => {
          if (!merged.find(p => p.name.toLowerCase().trim() === systemPlayer.name.toLowerCase().trim())) {
             merged.push(systemPlayer);
          }
       });
       return recomputeRanks(deduplicatePlayers(merged));
    });
  };

  const handleRecalculateProjections = () => {
    setPlayers(prev => {
      const updated = prev.map(p => {
        // Parse posRank, e.g. "QB12" -> pos="QB", rank=12
        const match = p.posRank.match(/^([A-Z]+)(\d+)$/);
        if (match) {
          const pos = match[1];
          const rank = parseInt(match[2], 10);
          
          // Use the player's existing tier that the user manually set
          const tierNumber = p.tierNumber || 99;
          
          let tierBonus = 0;
          if (tierNumber === 1) tierBonus = 25;
          else if (tierNumber === 2) tierBonus = 10;
          else if (tierNumber === 3) tierBonus = 4;
          
          let basePoints = p.basePointsHalfPpr;
          if (pos === 'QB') basePoints = 250 + 150 * Math.exp(-0.08 * (rank - 1)) + tierBonus;
          if (pos === 'RB') basePoints = 100 + 240 * Math.exp(-0.06 * (rank - 1)) + tierBonus;
          if (pos === 'WR') basePoints = 110 + 220 * Math.exp(-0.045 * (rank - 1)) + tierBonus;
          if (pos === 'TE') basePoints = 90 + 150 * Math.exp(-0.11 * (rank - 1)) + tierBonus;
          if (pos === 'K') basePoints = 120 + 30 * Math.exp(-0.15 * (rank - 1));
          if (pos === 'DST') basePoints = 100 + 30 * Math.exp(-0.15 * (rank - 1));

          return {
            ...p,
            basePointsHalfPpr: parseFloat(basePoints.toFixed(1))
          };
        }
        return p;
      });

      // Compute Replacement Baselines
      const baselines: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 };
      const getBaseline = (pos: string, rankIndex: number) => {
        const posPlayers = updated.filter(p => p.pos === pos).sort((a, b) => b.basePointsHalfPpr - a.basePointsHalfPpr);
        return posPlayers[Math.min(posPlayers.length - 1, rankIndex)]?.basePointsHalfPpr || 0;
      };
      
      baselines['QB'] = getBaseline('QB', leagueSize - 1);
      baselines['RB'] = getBaseline('RB', (leagueSize * 2) - 1);
      baselines['WR'] = getBaseline('WR', (leagueSize * 2) - 1);
      baselines['TE'] = getBaseline('TE', leagueSize - 1);
      baselines['K'] = getBaseline('K', leagueSize - 1);
      baselines['DST'] = getBaseline('DST', leagueSize - 1);

      const getPosRankNum = (posRank: string) => parseInt(posRank.replace(/[^\d]/g, ''), 10) || 99;

      // Calculate raw scores
      const scoredPlayers = updated.map(p => {
        let vorp = p.basePointsHalfPpr - (baselines[p.pos] || 0);
        const rank = getPosRankNum(p.posRank);
        
        let score = vorp;
        if (p.pos === 'K' || p.pos === 'DST') {
          score = -1000 - rank;
        } else if (p.pos === 'QB') {
          score = rank <= 3 ? vorp * 0.85 : vorp * 0.35;
        } else if (p.pos === 'TE') {
          score = rank <= 3 ? vorp * 0.85 : vorp * 0.40;
        }
        
        // Blend with ADP
        score -= (p.adp * 0.4);
        
        return { ...p, _rawScore: score };
      });

      // Enforce monotonicity within each position so Auto-Rank NEVER alters the individual lists!
      ['QB', 'RB', 'WR', 'TE', 'K', 'DST'].forEach(pos => {
        const posList = scoredPlayers.filter(p => p.pos === pos).sort((a, b) => getPosRankNum(a.posRank) - getPosRankNum(b.posRank));
        for (let i = 1; i < posList.length; i++) {
          if (posList[i]._rawScore >= posList[i-1]._rawScore) {
            posList[i]._rawScore = posList[i-1]._rawScore - 0.001;
          }
        }
      });

      // Sort by the strictly monotonic scores
      scoredPlayers.sort((a, b) => b._rawScore - a._rawScore);

      return scoredPlayers.map((p, idx) => {
        const { _rawScore, ...rest } = p as any;
        return { ...rest, ovrRank: idx + 1 };
      });
    });
  };

  const syncAdp = async (provider: 'sleeper' | 'espn' = 'sleeper') => {
    try {
      const adpMap: Record<string, number> = {};
      const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '').replace(/jr$/, '').replace(/sr$/, '').replace(/iii$/, '').replace(/ii$/, '');

      const res = await fetch(`/api/adp?provider=${provider}`);
      if (!res.ok) throw new Error(`Failed to fetch ${provider} ADP data`);
      const data = await res.json();
      
      for (const [name, adpVal] of Object.entries(data)) {
        adpMap[name] = adpVal as number;
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
    handleBulkUpdatePlayers,
    handleReorderPlayers,
    handleMovePlayer,
    handleMoveToRank,
    handleMoveToPosRank,
    handleImportRankings,
    handleRecalculateProjections,
    leagueSize,
    setLeagueSize,
    syncAdp,
    autoAssignRoles
  };
};

