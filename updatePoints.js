const fs = require('fs');

const path = 'src/data/initialPlayers.ts';
let content = fs.readFileSync(path, 'utf8');

// We need to parse the object array, or just use regex to replace it line by line.
// But we need to know the POS and ADP to generate the new basePoints.
// Let's use regex to find blocks.

let modified = content.replace(/\{([^}]+)\}/g, (match, body) => {
    // Only process if it's a player object
    if (!body.includes('id:') || !body.includes('pos:')) return match;
    
    let posMatch = body.match(/pos:\s*'([^']+)'/);
    let adpMatch = body.match(/adp:\s*([0-9.]+)/);
    
    if (!posMatch || !adpMatch) return match;
    
    let pos = posMatch[1];
    let adp = parseFloat(adpMatch[1]);
    
    // Generate realistic 2026 base points based on ADP and Position
    let points = 100;
    
    // Simple exponential decay curve based on adp
    if (pos === 'QB') {
        points = 380 * Math.exp(-0.005 * adp) + 50; 
    } else if (pos === 'RB') {
        points = 300 * Math.exp(-0.012 * adp) + 40;
    } else if (pos === 'WR') {
        points = 290 * Math.exp(-0.01 * adp) + 40;
    } else if (pos === 'TE') {
        points = 220 * Math.exp(-0.015 * adp) + 30;
    } else if (pos === 'K') {
        points = 150 * Math.exp(-0.002 * adp);
    } else if (pos === 'DST') {
        points = 140 * Math.exp(-0.002 * adp);
    }
    
    points = Math.max(0, Math.round(points * 10) / 10);
    
    return '{' + body.replace(/basePointsHalfPpr:\s*[0-9.]+/, 'basePointsHalfPpr: ' + points.toFixed(1)) + '}';
});

fs.writeFileSync(path, modified, 'utf8');
console.log('Updated all basePointsHalfPpr based on ADP curves for 2026 realism.');
