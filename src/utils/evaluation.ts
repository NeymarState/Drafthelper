import { Player, DraftSettings } from '../types';
import { calculateRosterSlots, getAdjustedProjection } from './calculations';

export interface DraftEvaluationTip {
  type: 'positive' | 'negative' | 'warning';
  text: string;
}

export interface TeamRanking {
  teamId: number;
  isUser: boolean;
  projectedPoints: number;
  starterPoints: number;
  benchPoints: number;
}

export interface DraftEvaluationResult {
  grade: string;
  score: number;
  tips: DraftEvaluationTip[];
  powerRanking: number;
  totalTeams: number;
  teamRankings: TeamRanking[];
}

export const evaluateDraft = (
  userTeam: Player[],
  allPlayers: Player[],
  settings: DraftSettings
): DraftEvaluationResult => {
  let score = 75; // Base score
  const tips: DraftEvaluationTip[] = [];

  if (userTeam.length === 0) {
    return {
      grade: 'N/A',
      score: 0,
      tips: [{ type: 'warning', text: 'Dein Team ist leer. Starte den Draft, um eine Bewertung zu erhalten!' }],
      powerRanking: 0,
      totalTeams: settings.leagueSize,
      teamRankings: []
    };
  }

  // --- POWER RANKINGS ---
  const teams = new Map<number, Player[]>();
  for(let i = 1; i <= settings.leagueSize; i++) teams.set(i, []);

  allPlayers.forEach(p => {
    if (p.draftedAtPick) {
      const round = Math.ceil(p.draftedAtPick / settings.leagueSize);
      const positionInRound = p.draftedAtPick % settings.leagueSize || settings.leagueSize;
      const draftedByTeam = round % 2 === 1 ? positionInRound : settings.leagueSize - positionInRound + 1;
      if (teams.has(draftedByTeam)) {
        teams.get(draftedByTeam)!.push(p);
      }
    }
  });

  const teamRankings: TeamRanking[] = [];
  teams.forEach((teamPlayers, teamId) => {
    const roster = calculateRosterSlots(teamPlayers, settings.scoringFormat);
    const starters = [roster.QB, roster.RB1, roster.RB2, roster.WR1, roster.WR2, roster.TE, roster.FLEX, roster.DST, roster.K].filter(Boolean) as Player[];
    const isUser = teamId === settings.userPickSlot;
    
    // Evaluate based on actual projected points using getAdjustedProjection
    const starterPoints = starters.reduce((acc, p) => acc + getAdjustedProjection(p, settings), 0);
    const benchPlayers = teamPlayers.filter(p => !starters.includes(p));
    const benchPoints = benchPlayers.reduce((acc, p) => acc + getAdjustedProjection(p, settings), 0);
    
    // For power rankings, starters are weighted 100% and bench is weighted 15% (for depth value)
    const points = starterPoints + (benchPoints * 0.15);
    
    teamRankings.push({
      teamId,
      isUser,
      projectedPoints: Math.round(points * 10) / 10,
      starterPoints: Math.round(starterPoints * 10) / 10,
      benchPoints: Math.round(benchPoints * 10) / 10
    });
  });

  teamRankings.sort((a, b) => b.projectedPoints - a.projectedPoints);
  const powerRanking = teamRankings.findIndex(t => t.isUser) + 1;

  if (powerRanking <= 3 && powerRanking > 0) {
    score += 10;
    tips.push({ type: 'positive', text: `Glückwunsch! Dein Team wird auf Platz ${powerRanking} von ${settings.leagueSize} in den Power Rankings projiziert.` });
  } else if (powerRanking >= settings.leagueSize - 2) {
    score -= 5;
    tips.push({ type: 'negative', text: `Dein Team liegt in den Power Rankings aktuell nur auf Platz ${powerRanking}. Du brauchst einige Breakouts, um das auszugleichen.` });
  }

  // 1. Roster Construction
  const qbs = userTeam.filter(p => p.pos === 'QB');
  const rbs = userTeam.filter(p => p.pos === 'RB');
  const wrs = userTeam.filter(p => p.pos === 'WR');
  const tes = userTeam.filter(p => p.pos === 'TE');
  const ks = userTeam.filter(p => p.pos === 'K');
  const dsts = userTeam.filter(p => p.pos === 'DST');

  const hasStartingLineup = qbs.length >= 1 && rbs.length >= 2 && wrs.length >= 2 && tes.length >= 1 && (rbs.length + wrs.length + tes.length >= 6);
  if (hasStartingLineup) {
    score += 10;
    tips.push({ type: 'positive', text: 'Starkes Grundgerüst: Du hast alle Starter-Positionen (ohne K/DST) gut abgedeckt.' });
  } else {
    score -= 5;
    tips.push({ type: 'negative', text: 'Lücken im Kader: Dir fehlen wichtige Starter auf den Skill-Positionen (QB/RB/WR/TE).' });
  }

  if (ks.length > 1) {
    score -= 3;
    tips.push({ type: 'warning', text: 'Zu viele Kicker: Es lohnt sich selten, mehr als einen Kicker im Roster zu haben.' });
  } else if (dsts.length > 1) {
    score -= 3;
    tips.push({ type: 'warning', text: 'Zu viele Defenses: Nutze den Roster-Spot lieber für Upside-Spieler auf RB oder WR.' });
  }

  // 1.5 Stacks & Overlaps
  const teamCounts = new Map<string, Player[]>();
  userTeam.forEach(p => {
    if (!teamCounts.has(p.team)) teamCounts.set(p.team, []);
    teamCounts.get(p.team)!.push(p);
  });

  teamCounts.forEach((players, teamName) => {
    if (players.length >= 2) {
      const hasQB = players.some(p => p.pos === 'QB');
      const hasReceiver = players.some(p => p.pos === 'WR' || p.pos === 'TE');
      
      if (hasQB && hasReceiver) {
        score += 8;
        tips.push({ type: 'positive', text: `Guter Stack: Du hast einen wertvollen ${teamName} Stack (z.B. QB + WR/TE). Das erhöht dein wöchentliches Upside signifikant!` });
      } else {
        score -= 5;
        tips.push({ type: 'negative', text: `Klumpenrisiko: Du hast ${players.length} Spieler von den ${teamName}, aber keinen echten QB-Stack. Das limitiert dein Upside und bringt wöchentliches Risiko.` });
      }
    }
  });

  // 2. Early Kicker/Defense
  const rounds = settings.totalRounds || 16;
  const kDstThreshold = settings.leagueSize * Math.max(1, rounds - 3);
  const earlySpecialTeams = userTeam.find(p => (p.pos === 'K' || p.pos === 'DST') && (p.draftedAtPick || 999) <= kDstThreshold);
  if (earlySpecialTeams) {
    score -= 5;
    tips.push({ type: 'negative', text: `Du hast ${earlySpecialTeams.name} sehr früh gedraftet. Kicker und Defenses sollten erst in den letzten 2-3 Runden geholt werden.` });
  }

  // 3. Bye Week Overlaps (Top Starters)
  // We'll check the top QB, top 2 RBs, top 2 WRs, top TE
  const keyStarters = [
    ...qbs.slice(0, 1),
    ...rbs.slice(0, 2),
    ...wrs.slice(0, 2),
    ...tes.slice(0, 1)
  ];
  
  const byeWeekCounts = new Map<number, Player[]>();
  keyStarters.forEach(p => {
    if (p.byeWeek) {
      if (!byeWeekCounts.has(p.byeWeek)) byeWeekCounts.set(p.byeWeek, []);
      byeWeekCounts.get(p.byeWeek)!.push(p);
    }
  });

  let hasByeWeekIssue = false;
  byeWeekCounts.forEach((players, week) => {
    if (players.length >= 3) {
      score -= 3;
      hasByeWeekIssue = true;
      tips.push({ 
        type: 'warning', 
        text: `Bye-Week Problem: Du hast ${players.length} Key-Starter (${players.map(p => p.name).join(', ')}) mit Bye Week ${week}.` 
      });
    }
  });
  if (!hasByeWeekIssue && keyStarters.length >= 5) {
    score += 2;
    tips.push({ type: 'positive', text: 'Gutes Bye-Week Management bei deinen Startern.' });
  }

  // 4. Value Analysis (Reaches and Steals)
  let totalStealValue = 0;
  let totalReachValue = 0;
  let biggestSteal: { player: Player, diff: number } | null = null;
  let biggestReach: { player: Player, diff: number } | null = null;

  userTeam.forEach(p => {
    if (p.draftedAtPick) {
      // Ignore K/DST reaches if they were drafted in the acceptable late rounds
      if ((p.pos === 'K' || p.pos === 'DST') && p.draftedAtPick > kDstThreshold) {
        return;
      }

      // User team is evaluated purely on their own ranking (OvrRank)
      const referenceRank = p.ovrRank;
      const diff = p.draftedAtPick - referenceRank; // Positive = Steal, Negative = Reach
      
      if (diff > 5) {
        totalStealValue += diff;
        if (!biggestSteal || diff > biggestSteal.diff) biggestSteal = { player: p, diff };
      } else if (diff < -5) {
        totalReachValue += Math.abs(diff);
        if (!biggestReach || Math.abs(diff) > biggestReach.diff) biggestReach = { player: p, diff: Math.abs(diff) };
      }
    }
  });

  const stealBonus = Math.min(15, Math.floor(totalStealValue / 5));
  const reachPenalty = Math.min(15, Math.floor(totalReachValue / 5));
  
  score += stealBonus;
  score -= reachPenalty;

  if (biggestSteal && biggestSteal.diff >= 12) {
    tips.push({ type: 'positive', text: `Mega-Steal: Du hast ${biggestSteal.player.name} an Pick ${biggestSteal.player.draftedAtPick} bekommen (Dein Board: ${biggestSteal.player.ovrRank}, ADP: ${biggestSteal.player.adp || 'N/A'}).` });
  }

  if (biggestReach && biggestReach.diff >= 12) {
    // Let's find who was available at that pick who had a better blended value
    const reachPick = biggestReach.player.draftedAtPick!;
    const betterOptions = allPlayers.filter(p => p.adp && p.adp > reachPick && p.adp < reachPick + 12 && p.pos === biggestReach!.player.pos);
    const betterOptionName = betterOptions.length > 0 ? betterOptions[0].name : 'einen besseren Value';
    
    tips.push({ 
      type: 'negative', 
      text: `Reach: Du hast ${biggestReach.player.name} früh geholt (Pick ${reachPick}). Selbst mit deinem eigenen Board (Rank ${biggestReach.player.ovrRank}) und seinem ADP (${biggestReach.player.adp || 'N/A'}) war das ein Reach. Hier hättest du z.B. auf ${betterOptionName} spekulieren können.` 
    });
  }

  // 5. Positional Tendencies (Zero RB / Zero WR)
  const firstFourPicks = userTeam
    .filter(p => p.draftedAtPick)
    .sort((a, b) => a.draftedAtPick! - b.draftedAtPick!)
    .slice(0, 4);

  if (firstFourPicks.length >= 4) {
    const earlyRbs = firstFourPicks.filter(p => p.pos === 'RB').length;
    const earlyWrs = firstFourPicks.filter(p => p.pos === 'WR').length;

    if (earlyRbs === 0) {
      tips.push({ type: 'warning', text: 'Zero-RB Strategie: Du hast in den ersten 4 Runden keinen RB gewählt. Achte extrem auf das Waiver Wire und Backup-RBs mit Upside!' });
    } else if (earlyWrs === 0) {
      tips.push({ type: 'warning', text: 'Zero-WR Strategie: Du bist extrem run-heavy gestartet. WRs auf der Bank müssen jetzt zünden.' });
    }
  }

  // Limit score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine Grade
  let grade = 'F';
  if (score >= 95) grade = 'A+';
  else if (score >= 90) grade = 'A';
  else if (score >= 85) grade = 'B+';
  else if (score >= 80) grade = 'B';
  else if (score >= 75) grade = 'C+';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';

  return {
    grade,
    score,
    tips,
    powerRanking,
    totalTeams: settings.leagueSize,
    teamRankings
  };
};
