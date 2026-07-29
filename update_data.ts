import { initialPlayers } from './src/data/initialPlayers';
import * as fs from 'fs';

// Group RBs by team to assign roles
const teamRBs: Record<string, any[]> = {};
for (const p of initialPlayers) {
  if (p.pos === 'RB') {
    if (!teamRBs[p.team]) teamRBs[p.team] = [];
    teamRBs[p.team].push(p);
  }
}

// Assign RB roles
for (const team in teamRBs) {
  // Sort RBs by ovrRank
  teamRBs[team].sort((a, b) => a.ovrRank - b.ovrRank);
  
  const rbs = teamRBs[team];
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
}

// Assign Archetype
for (const p of initialPlayers) {
  if (p.tier.toLowerCase().includes('upside') || p.tier.toLowerCase().includes('breakout') || p.tier.toLowerCase().includes('sleeper')) {
    p.playerArchetype = 'Upside';
  } else if (p.tierNumber <= 2) {
    p.playerArchetype = 'Baseline';
  } else {
    // Deterministic pseudo-random based on name length
    p.playerArchetype = p.name.length % 2 === 0 ? 'Baseline' : 'Upside';
  }
}

const output = "import { Player } from '../types';\n\nexport const initialPlayers: Player[] = " + JSON.stringify(initialPlayers, null, 2) + ";\n;
fs.writeFileSync('./src/data/initialPlayers.ts', output);
console.log('Update complete');
