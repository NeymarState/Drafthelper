export default async function handler(req: any, res: any) {
  try {
    const provider = req.query?.provider || 'sleeper';
    
    let url = "https://www.fantasypros.com/nfl/adp/half-point-ppr-overall.php?export=xls";
    let srcKey = "src_4350"; // Sleeper
    
    if (provider === 'espn') {
      url = "https://www.fantasypros.com/nfl/adp/ppr-overall.php?export=xls";
      srcKey = "src_79"; // ESPN
    }

    const fetchRes = await fetch(url);
    const html = await fetchRes.text();
    
    const match = html.match(/window\.FP\.reportConfig = (\{.*?\});/);
    if (match && match[1]) {
       const json = JSON.parse(match[1]);
       const rows = json.table.rows;
       
       const adpMap: Record<string, number> = {};
       
       for (const row of rows) {
          if (!row.player || !row.player.name) continue;
          
          // Fuzzy name matching setup: remove Jr., Sr., III, II, punctuation, spaces, and make lowercase
          // Also mapping defenses (e.g., "San Francisco 49ers" -> "49ers DST") can be tricky.
          // But our frontend uses normalized names as well.
          const rawName = row.player.name;
          const normalizedName = rawName
            .toLowerCase()
            .replace(/[^a-z]/g, '')
            .replace(/jr$/, '')
            .replace(/sr$/, '')
            .replace(/iii$/, '')
            .replace(/ii$/, '');
          
          let adp = null;
          
          if (typeof row[srcKey] === 'number') {
            adp = row[srcKey];
          } else if (typeof row.avg === 'number') {
            adp = row.avg;
          } else if (typeof row.rank === 'number') {
            adp = row.rank;
          }
          
          if (adp !== null) {
            adpMap[normalizedName] = adp;
          }
       }
       
       res.status(200).json(adpMap);
    } else {
       res.status(500).json({ error: "Could not find ADP data in response" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Unknown error" });
  }
}
