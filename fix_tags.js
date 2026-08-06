const fs = require('fs');
const path = require('path');

const directory = './src/components';
const files = fs.readdirSync(directory);

for (const file of files) {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(directory, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add Rookie background color
    content = content.replace(
      /player\.customTag === 'Fade' \? 'bg-orange-500\/20 text-orange-400 border-orange-500\/30' :/g,
      "player.customTag === 'Fade' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :\n                                      player.customTag === 'Rookie' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :"
    );

    // Replace the emoji string assignments for tags
    content = content.replace(
      /player\.customTag === 'Fade' \? '.* Fade' :/g,
      "player.customTag === 'Fade' ? '?? Fade' :\n                                     player.customTag === 'Rookie' ? '?? Rookie' :"
    );
    
    // Handle MyTeamTab (no emoji in string)
    content = content.replace(
      /player\.customTag === 'Fade' \? 'Fade' :/g,
      "player.customTag === 'Fade' ? 'Fade' :\n                                     player.customTag === 'Rookie' ? 'Rookie' :"
    );

    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log('Done');
