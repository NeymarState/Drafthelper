export default async function handler(req: any, res: any) {
  try {
    const fetchRes = await fetch("https://www.fantasypros.com/nfl/adp/half-point-ppr-overall.php?export=xls");
    const html = await fetchRes.text();
    
    const match = html.match(/window\.FP\.reportConfig = (\{.*?\});/);
    if (match && match[1]) {
       const json = JSON.parse(match[1]);
       const rows = json.table.rows;
       
       const adpMap: Record<string, number> = {};
       
       for (const row of rows) {
          if (!row.player || !row.player.name) continue;
          const playerName = row.player.name;
          
          // src_4350 is Sleeper ADP, avg is the consensus average, rank is the fallback rank
          let adp = null;
          
          if (typeof row.src_4350 === 'number') {
            adp = row.src_4350;
          } else if (typeof row.avg === 'number') {
            adp = row.avg;
          } else if (typeof row.rank === 'number') {
            adp = row.rank;
          }
          
          if (adp !== null) {
            adpMap[playerName] = adp;
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
