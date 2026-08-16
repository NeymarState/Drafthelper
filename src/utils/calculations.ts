import { Player, ScoringFormat, RosterState, AlertItem, Position } from '../types';

/**
 * A. Dynamische ADP- & Pick-Berechnung
 * Runde = floor((Ovr_Rank - 1) / N) + 1
 * Pick in Runde = ((Ovr_Rank - 1) mod N) + 1
 * Format: "Rd X (X.YY)"
 */
export function getFormattedPick(ovrRank: number, leagueSize: number): {
  round: number;
  pickInRound: number;
  formattedString: string;
} {
  const rank = Math.round(ovrRank);
  const round = Math.floor((rank - 1) / leagueSize) + 1;
  const pickInRound = ((rank - 1) % leagueSize) + 1;
  const formattedPick = String(pickInRound).padStart(2, '0');
  const formattedString = `Rd ${round}, Pick ${formattedPick} (OVR ${rank})`;

  return { round, pickInRound, formattedString };
}

/**
 * Calculates adjusted projected points based on scoring format
 */
export function getAdjustedProjection(player: Player, format: ScoringFormat): number {
  let multiplier = 1.0;
  let recBonus = 0;

  // Approximate reception count from target share & position
  const estimatedTargets = player.targetShare * 550; // average team pass attempts ~550
  const estimatedReceptions = Math.round(estimatedTargets * 0.68); // ~68% catch rate

  if (format === 'Full-PPR') {
    recBonus = estimatedReceptions * 0.5; // add 0.5 to base half-ppr
  } else if (format === 'Standard') {
    recBonus = -estimatedReceptions * 0.5; // subtract 0.5 from base half-ppr
  }

  const total = player.basePointsHalfPpr + recBonus;
  return Math.max(0, Math.round(total * 10) / 10);
}

/**
 * B. Value Over Replacement Player (VORP)
 * VORP_i = Projection_i - Projection_Replacement
 * Replacement Levels: RB24, WR24, QB12, TE12 (scaled dynamically für 8, 10, 12, 14, 16 teams)
 */
export function calculateVORP(
  player: Player,
  allPlayers: Player[],
  scoringFormat: ScoringFormat,
  leagueSize: number
): number {
  const posPlayers = allPlayers
    .filter((p) => p.pos === player.pos)
    .map((p) => ({ ...p, currentProj: getAdjustedProjection(p, scoringFormat) }))
    .sort((a, b) => b.currentProj - a.currentProj);

  // Replacement rank per position scaled to league size
  const replacementRanks: Record<Position, number> = {
    QB: Math.min(posPlayers.length, leagueSize), // QB12 für 12 teams
    RB: Math.min(posPlayers.length, leagueSize * 2), // RB24 für 12 teams
    WR: Math.min(posPlayers.length, leagueSize * 2), // WR24 für 12 teams
    TE: Math.min(posPlayers.length, leagueSize), // TE12 für 12 teams
    DST: Math.min(posPlayers.length, leagueSize),
    K: Math.min(posPlayers.length, leagueSize),
  };

  const repRankIndex = Math.max(0, replacementRanks[player.pos] - 1);
  const replacementValue = posPlayers[repRankIndex]?.currentProj ?? 100;

  const playerProj = getAdjustedProjection(player, scoringFormat);
  const vorp = playerProj - replacementValue;
  return Math.round(vorp * 10) / 10;
}

/**
 * C. Roster Auto-Fill & Exclusivity Logic
 * Strict separation: no player in multiple slots.
 * FLEX pulls highest remaining starter among RBs, WRs, TEs not already in QB, RB1, RB2, WR1, WR2, TE.
 */
export function calculateRosterSlots(
  userTeam: Player[],
  scoringFormat: ScoringFormat
): RosterState {
  const sortedTeam = [...userTeam].sort(
    (a, b) => getAdjustedProjection(b, scoringFormat) - getAdjustedProjection(a, scoringFormat)
  );

  const roster: RosterState = {
    QB: null,
    RB1: null,
    RB2: null,
    WR1: null,
    WR2: null,
    TE: null,
    FLEX: null,
    DST: null,
    K: null,
    BENCH: [],
  };

  const usedIds = new Set<string>();

  // 1. Fill QB
  const qb = sortedTeam.find((p) => p.pos === 'QB');
  if (qb) {
    roster.QB = qb;
    usedIds.add(qb.id);
  }

  // 2. Fill RBs (up to 2)
  const rbs = sortedTeam.filter((p) => p.pos === 'RB');
  if (rbs[0]) {
    roster.RB1 = rbs[0];
    usedIds.add(rbs[0].id);
  }
  if (rbs[1]) {
    roster.RB2 = rbs[1];
    usedIds.add(rbs[1].id);
  }

  // 3. Fill WRs (up to 2)
  const wrs = sortedTeam.filter((p) => p.pos === 'WR');
  if (wrs[0]) {
    roster.WR1 = wrs[0];
    usedIds.add(wrs[0].id);
  }
  if (wrs[1]) {
    roster.WR2 = wrs[1];
    usedIds.add(wrs[1].id);
  }

  // 4. Fill TE
  const te = sortedTeam.find((p) => p.pos === 'TE');
  if (te) {
    roster.TE = te;
    usedIds.add(te.id);
  }

  // 5. Fill DST & K
  const dst = sortedTeam.find((p) => p.pos === 'DST');
  if (dst) {
    roster.DST = dst;
    usedIds.add(dst.id);
  }
  const k = sortedTeam.find((p) => p.pos === 'K');
  if (k) {
    roster.K = k;
    usedIds.add(k.id);
  }

  // 6. Fill FLEX: highest remaining RB, WR, or TE
  const flexCandidates = sortedTeam.filter(
    (p) => !usedIds.has(p.id) && (p.pos === 'RB' || p.pos === 'WR' || p.pos === 'TE')
  );
  if (flexCandidates[0]) {
    roster.FLEX = flexCandidates[0];
    usedIds.add(flexCandidates[0].id);
  }

  // 7. All remaining go to BENCH
  roster.BENCH = sortedTeam.filter((p) => !usedIds.has(p.id));

  return roster;
}

/**
 * D. Live Alert Systems
 * 1. Tier Scarcity Warning: <= 2 available in Tier 1 or Tier 2 per position.
 * 2. Stack Radar: QB + pass catcher on user team from same NFL team.
 * 3. Bye Week Overlap: >= 3 starters with same bye week.
 */
export function generateLiveAlerts(
  allPlayers: Player[],
  userTeam: Player[],
  settings: DraftSettings
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const { currentOverallPick, userPickSlot, leagueSize, scoringFormat, totalRounds } = settings;

  // 1. Tier Scarcity Warning (Enhanced with Pick Probability)
  const positions: Position[] = ['QB', 'RB', 'WR', 'TE'];
  const nextUserPick = findNextUserPickSlot(allPlayers, userPickSlot, leagueSize, totalRounds);
  const picksUntilNext = Math.max(0, nextUserPick - currentOverallPick);

  positions.forEach((pos) => {
    [1, 2, 3].forEach((tierNum) => {
      const tierPlayers = allPlayers.filter(
        (p) => p.pos === pos && p.tierNumber === tierNum
      );
      const availableInTier = tierPlayers.filter((p) => p.status === 'Verfügbar');

      if (tierPlayers.length > 0 && availableInTier.length <= 2 && availableInTier.length > 0) {
        const topAvailable = availableInTier.sort((a, b) => (a.adp || a.ovrRank) - (b.adp || b.ovrRank))[0];
        
        // Filter: Don't alert if the player is expected to go much later (more than 1.5 to 2 rounds away)
        if (topAvailable && (topAvailable.adp || topAvailable.ovrRank) > currentOverallPick + leagueSize * 1.5) {
          return; // Skip this tier alert because it's too early based on ADP
        }

        let probMsg = '';
        if (picksUntilNext > 0) {
          const oppNeeds = analyzeOpponentNeeds(currentOverallPick, leagueSize, allPlayers);
          const prob = calculatePickProbability(availableInTier[0], currentOverallPick, nextUserPick, oppNeeds);
          probMsg = `Dein Pick ist in ${picksUntilNext} Picks. Wahrscheinlichkeit, dass ${availableInTier[0].name} überlebt: ${prob.percent.toFixed(0)}%.`;
        }

        alerts.push({
          id: `scarcity-${pos}-t${tierNum}`,
          type: 'tier-scarcity',
          severity: availableInTier.length === 1 ? 'high' : 'medium',
          title: `🚨 Tier ${tierNum} Cliff: ${pos}`,
          message: `Nur noch ${availableInTier.length} ${pos} in Tier ${tierNum}! ${probMsg}`,
          details: availableInTier.map((p) => `${p.name} (${p.team}) - Ovr #${p.ovrRank} / ADP ${p.adp || 'N/A'}`),
        });
      }
    });
  });

  // 1b. Opponent Threat Radar
  if (picksUntilNext > 0 && picksUntilNext <= 5) {
    const oppNeeds = analyzeOpponentNeeds(currentOverallPick, leagueSize, allPlayers);
    const immediateNeeds = oppNeeds.slice(0, picksUntilNext);
    
    positions.forEach(pos => {
      let needCount = 0;
      const needyTeams: string[] = [];
      
      immediateNeeds.forEach(n => {
        let needsThisPos = false;
        if (pos === 'QB' && n.needsQB) needsThisPos = true;
        if (pos === 'RB' && n.needsRB) needsThisPos = true;
        if (pos === 'WR' && n.needsWR) needsThisPos = true;
        if (pos === 'TE' && n.needsTE) needsThisPos = true;

        if (needsThisPos) {
          needCount++;
          needyTeams.push(`Team ${n.team} (Pick ${n.pickSlot}) braucht ${pos}`);
        }
      });

      if (needCount >= 2) {
        alerts.push({
          id: `threat-${pos}`,
          type: 'threat-radar',
          severity: 'high',
          title: `🚨 GEGNER-RADAR: ${pos} GEFAHR`,
          message: `${needCount} der nächsten ${picksUntilNext} Teams brauchen dringend einen ${pos}!`,
          details: needyTeams,
        });
      }
    });
  }

  // 2. Stack Radar
  const qbsOnTeam = userTeam.filter((p) => p.pos === 'QB');
  const passCatchersOnTeam = userTeam.filter(
    (p) => p.pos === 'WR' || p.pos === 'TE' || p.pos === 'RB'
  );

  qbsOnTeam.forEach((qb) => {
    const matchingCatchers = passCatchersOnTeam.filter((p) => p.team === qb.team);
    if (matchingCatchers.length > 0) {
      alerts.push({
        id: `stack-${qb.id}`,
        type: 'stack',
        severity: 'success',
        title: `⚡ Explosiver Stack Aktiviert: ${qb.team}`,
        message: `${qb.name} (QB) korreliert mit ${matchingCatchers.map((c) => c.name).join(', ')}!`,
        details: [`Team: ${qb.team}`, `Maximiert wöchentliche Ceiling in High-Scoring Matches.`],
      });
    }
  });

  // 3. Bye Week Overlap
  const roster = calculateRosterSlots(userTeam, scoringFormat);
  const starters = [
    roster.QB,
    roster.RB1,
    roster.RB2,
    roster.WR1,
    roster.WR2,
    roster.TE,
    roster.FLEX,
  ].filter((p): p is Player => p !== null);

  const byeCounts: Record<number, Player[]> = {};
  starters.forEach((p) => {
    if (!byeCounts[p.bye]) byeCounts[p.bye] = [];
    byeCounts[p.bye].push(p);
  });

  Object.entries(byeCounts).forEach(([bye, players]) => {
    if (players.length >= 3) {
      alerts.push({
        id: `bye-overlap-${bye}`,
        type: 'bye-overlap',
        severity: 'high',
        title: `🚨 Bye-Week Konflikt: Woche ${bye}`,
        message: `${players.length} Deiner Starter haben in Woche ${bye} Spielfrei!`,
        details: players.map((p) => `${p.name} (${p.pos} - ${p.team})`),
      });
    }
  });

  return alerts;
}

/**
 * E. Data Enrichment
 * Dynamically assigns roles (e.g., RB1, RB2) and archetypes (Upside vs Baseline)
 * based on the initial dataset.
 */
export function enrichPlayerData(players: Player[]): Player[] {
  const enriched = JSON.parse(JSON.stringify(players)) as Player[];
  
  // Group RBs by team
  const teamRBs: Record<string, Player[]> = {};
  enriched.forEach(p => {
    if (p.pos === 'RB') {
      if (!teamRBs[p.team]) teamRBs[p.team] = [];
      teamRBs[p.team].push(p);
    }
  });

  Object.values(teamRBs).forEach(rbs => {
    rbs.sort((a, b) => a.ovrRank - b.ovrRank);
    if (rbs.length > 0) rbs[0].rbRole = 'RB1';
    if (rbs.length > 1) {
      const diff = rbs[1].ovrRank - rbs[0].ovrRank;
      if (diff < 30) {
        rbs[0].rbRole = 'Timeshare';
        rbs[1].rbRole = 'Timeshare';
      } else {
        rbs[1].rbRole = rbs[1].ovrRank < 120 ? 'RB2' : 'Handcuff';
      }
    }
    if (rbs.length > 2) {
      for (let i = 2; i < rbs.length; i++) {
        rbs[i].rbRole = 'RB3';
      }
    }
  });

  // Group WRs by team
  const teamWRs: Record<string, Player[]> = {};
  enriched.forEach(p => {
    if (p.pos === 'WR') {
      if (!teamWRs[p.team]) teamWRs[p.team] = [];
      teamWRs[p.team].push(p);
    }
  });

  Object.values(teamWRs).forEach(wrs => {
    wrs.sort((a, b) => a.ovrRank - b.ovrRank);
    if (wrs.length > 0) wrs[0].wrRole = 'WR1';
    if (wrs.length > 1) wrs[1].wrRole = 'WR2';
    if (wrs.length > 2) wrs[2].wrRole = 'WR3';
    if (wrs.length > 3) {
      for (let i = 3; i < wrs.length; i++) {
        wrs[i].wrRole = 'WR4';
      }
    }
  });

  enriched.forEach(p => {
    const t = p.tier.toLowerCase();
    const prof = p.profile.toLowerCase();
    if (t.includes('upside') || t.includes('breakout') || t.includes('sleeper')) {
      p.playerArchetype = 'Upside';
    } else if (p.tierNumber <= 2) {
      p.playerArchetype = 'Baseline';
    } else {
      p.playerArchetype = p.name.length % 2 === 0 ? 'Baseline' : 'Upside';
    }
    
    if (t.includes('rookie') || prof.includes('rookie')) {
      p.isRookie = true;
    }
  });

  return enriched;
}

/**
 * F. Pick Predictor & Opponent Analysis
 */
export function isUserPickSlot(pick: number, userPickSlot: number, leagueSize: number): boolean {
  const round = Math.ceil(pick / leagueSize);
  let slotOwner = 0;
  if (round % 2 === 1) {
    slotOwner = ((pick - 1) % leagueSize) + 1;
  } else {
    slotOwner = leagueSize - ((pick - 1) % leagueSize);
  }
  return slotOwner === userPickSlot;
}

export function findNextUserPickSlot(players: Player[], userPickSlot: number, leagueSize: number, totalRounds: number = 30): number {
  const maxPick = leagueSize * totalRounds;
  for (let pick = 1; pick <= maxPick; pick++) {
    if (isUserPickSlot(pick, userPickSlot, leagueSize)) {
      const isOccupied = players.some(p => p.draftedAtPick === pick);
      if (!isOccupied) return pick;
    }
  }
  return -1;
}

export function findNextOpponentPickSlot(players: Player[], userPickSlot: number, leagueSize: number, totalRounds: number = 30): number {
  const maxPick = leagueSize * totalRounds;
  for (let pick = 1; pick <= maxPick; pick++) {
    if (!isUserPickSlot(pick, userPickSlot, leagueSize)) {
      const isOccupied = players.some(p => p.draftedAtPick === pick);
      if (!isOccupied) return pick;
    }
  }
  return -1;
}

export function calculateNextPick(currentOverallPick: number, userPickSlot: number, leagueSize: number, totalRounds: number = 30): number {
  let round = Math.ceil(currentOverallPick / leagueSize);
  let nextPick = -1;
  
  // Try to find the next time the user picks
  while (nextPick < currentOverallPick && round <= totalRounds) {
    if (round % 2 === 1) {
      nextPick = (round - 1) * leagueSize + userPickSlot;
    } else {
      nextPick = (round - 1) * leagueSize + (leagueSize - userPickSlot + 1);
    }
    if (nextPick < currentOverallPick) {
      round++;
    }
  }
  return nextPick;
}

export interface OpponentNeed {
  team: number;
  pickSlot: number;
  needsQB: boolean;
  needsTE: boolean;
  needsRB: boolean;
  needsWR: boolean;
  zeroRB: boolean;
  zeroWR: boolean;
  needsK: boolean;
  needsDST: boolean;
}

export function analyzeOpponentNeeds(currentOverallPick: number, leagueSize: number, players: Player[]): OpponentNeed[] {
  const upcomingNeeds: OpponentNeed[] = [];
  const currentRound = Math.ceil(currentOverallPick / leagueSize);
  
  // Find the next 5 picks
  for (let offset = 0; offset < 5; offset++) {
    const pick = currentOverallPick + offset;
    const round = Math.ceil(pick / leagueSize);
    let teamSlot = 0;
    if (round % 2 === 1) {
      teamSlot = ((pick - 1) % leagueSize) + 1;
    } else {
      teamSlot = leagueSize - ((pick - 1) % leagueSize);
    }
    
    // Determine what this team has drafted so far
    const teamDraftedPlayers = players.filter(p => p.draftedAtPick !== undefined && p.draftedAtPick > 0 && p.status === 'Gedraftet (Gegner)' || p.status === 'Mein Team');
    const thisTeamPlayers = players.filter(p => {
      if (!p.draftedAtPick) return false;
      const pRound = Math.ceil(p.draftedAtPick / leagueSize);
      let pTeamSlot = 0;
      if (pRound % 2 === 1) {
        pTeamSlot = ((p.draftedAtPick - 1) % leagueSize) + 1;
      } else {
        pTeamSlot = leagueSize - ((p.draftedAtPick - 1) % leagueSize);
      }
      return pTeamSlot === teamSlot;
    });

    const qbs = thisTeamPlayers.filter(p => p.pos === 'QB').length;
    const tes = thisTeamPlayers.filter(p => p.pos === 'TE').length;
    const rbs = thisTeamPlayers.filter(p => p.pos === 'RB').length;
    const wrs = thisTeamPlayers.filter(p => p.pos === 'WR').length;
    const ks = thisTeamPlayers.filter(p => p.pos === 'K').length;
    const dsts = thisTeamPlayers.filter(p => p.pos === 'DST').length;

    upcomingNeeds.push({
      team: teamSlot,
      pickSlot: pick,
      needsQB: currentRound >= 3 && qbs === 0,
      needsTE: currentRound >= 3 && tes === 0,
      needsRB: rbs < 2,
      needsWR: wrs < 2,
      zeroRB: rbs === 0,
      zeroWR: wrs === 0,
      needsK: currentRound >= 12 && ks === 0,
      needsDST: currentRound >= 12 && dsts === 0,
    });
  }

  return upcomingNeeds;
}

export function calculatePickProbability(
  player: Player,
  currentOverallPick: number,
  nextUserPick: number,
  upcomingNeeds: OpponentNeed[]
): { percent: number; label: string; colorClass: string } {
  if (nextUserPick === -1 || nextUserPick <= currentOverallPick) {
    return { percent: 100, label: 'Jetzt', colorClass: 'text-blue-400 bg-blue-500/20' };
  }

  const expectedPick = player.adp && player.adp > 0 ? player.adp : player.ovrRank;
  let diff = expectedPick - nextUserPick;

  // Boost probabilities if upcoming opponents do not need QB/TE
  if (player.pos === 'QB') {
    const opponentsNeedingQB = upcomingNeeds.filter(n => n.needsQB).length;
    if (opponentsNeedingQB === 0) diff += 4; // Boost probability since no one urgently needs a QB
    else if (opponentsNeedingQB > 1) diff -= 4;
  }
  if (player.pos === 'TE') {
    const opponentsNeedingTE = upcomingNeeds.filter(n => n.needsTE).length;
    if (opponentsNeedingTE === 0) diff += 4;
    else if (opponentsNeedingTE > 1) diff -= 4;
  }

  let percent = 50;
  let label = 'Mittel';
  let colorClass = 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30';

  if (diff < -6) {
    percent = Math.max(1, 10 + diff); // 1-10%
    label = 'Sehr gering';
    colorClass = 'text-red-400 bg-red-500/20 border border-red-500/30';
  } else if (diff < 0) {
    percent = 25 + diff * 2; // 15-35%
    label = 'Niedrig';
    colorClass = 'text-orange-400 bg-orange-500/20 border border-orange-500/30';
  } else if (diff < 8) {
    percent = 50 + diff * 3; // 40-70%
    label = 'Mittel';
    colorClass = 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30';
  } else {
    percent = Math.min(99, 80 + diff); // 80-99%
    label = 'Hoch';
    colorClass = 'text-green-400 bg-green-500/20 border border-green-500/30';
  }

  return { percent: Math.round(percent), label, colorClass };
}
