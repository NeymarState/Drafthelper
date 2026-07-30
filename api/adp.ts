export default async function handler(req: any, res: any) {
  try {
    const provider = req.query?.provider || 'sleeper';
    
    // We use the robust Sleeper projections API which provides comprehensive ADP data.
    // FantasyPros hides full ADP lists behind a registration wall, which caused the "only 5 players" bug.
    const url = "https://api.sleeper.app/projections/nfl/2026?season_type=regular&position[]=DEF&position[]=FLEX&position[]=K&position[]=QB&position[]=RB&position[]=TE&position[]=WR&order_by=adp";
    
    const fetchRes = await fetch(url);
    if (!fetchRes.ok) {
      throw new Error(`Failed to fetch from Sleeper API: ${fetchRes.status}`);
    }
    const data = await fetchRes.json();
    
    const adpMap: Record<string, number> = {};
    
    for (const item of data) {
      if (!item.player || !item.stats) continue;
      
      const firstName = item.player.first_name || '';
      const lastName = item.player.last_name || '';
      const rawName = `${firstName} ${lastName}`.trim();
      
      // Fuzzy name matching setup: remove Jr., Sr., III, II, punctuation, spaces, and make lowercase
      const normalizedName = rawName
        .toLowerCase()
        .replace(/[^a-z]/g, '')
        .replace(/jr$/, '')
        .replace(/sr$/, '')
        .replace(/iii$/, '')
        .replace(/ii$/, '');
      
      let adp = null;
      
      // The user requested Half-PPR for both Sleeper and ESPN.
      if (typeof item.stats.adp_half_ppr === 'number' && item.stats.adp_half_ppr < 900) {
        adp = item.stats.adp_half_ppr;
      } else if (typeof item.stats.adp_ppr === 'number' && item.stats.adp_ppr < 900) {
        adp = item.stats.adp_ppr;
      } else if (typeof item.stats.adp_std === 'number' && item.stats.adp_std < 900) {
        adp = item.stats.adp_std;
      }
      
      if (adp !== null) {
        adpMap[normalizedName] = adp;
      }
    }
    
    // Also map team defenses from "Seattle Seahawks" to "Seahawks DST" internally if needed
    // But since our normalizeName strips everything, "seattleseahawks" needs to match "seahawksdst".
    // Let's add explicit defense mapping
    const defenseMap: Record<string, string> = {
      'arizonacardinals': 'cardinalsdst',
      'atlantafalcons': 'falconsdst',
      'baltimoreravens': 'ravensdst',
      'buffalobills': 'billsdst',
      'carolinapanthers': 'panthersdst',
      'chicagobears': 'bearsdst',
      'cincinnatibengals': 'bengalsdst',
      'clevelandbrowns': 'brownsdst',
      'dallascowboys': 'cowboysdst',
      'denverbroncos': 'broncosdst',
      'detroitlions': 'lionsdst',
      'greenbaypackers': 'packersdst',
      'houstontexans': 'texansdst',
      'indianapoliscolts': 'coltsdst',
      'jacksonvillejaguars': 'jaguarsdst',
      'kansascitychiefs': 'chiefsdst',
      'lasvegasraiders': 'raidersdst',
      'losangeleschargers': 'chargersdst',
      'losangelesrams': 'ramsdst',
      'miamidolphins': 'dolphinsdst',
      'minnesotavikings': 'vikingsdst',
      'newenglandpatriots': 'patriotsdst',
      'neworleanssaints': 'saintsdst',
      'newyorkgiants': 'giantsdst',
      'newyorkjets': 'jetsdst',
      'philadelphiaeagles': 'eaglesdst',
      'pittsburghsteelers': 'steelersdst',
      'sanfrancisco49ers': '49ersdst',
      'seattleseahawks': 'seahawksdst',
      'tampabaybuccaneers': 'buccaneersdst',
      'tennesseetitans': 'titansdst',
      'washingtoncommanders': 'commandersdst'
    };

    const finalAdpMap: Record<string, number> = {};
    for (const [key, val] of Object.entries(adpMap)) {
       finalAdpMap[key] = val;
       if (defenseMap[key]) {
         finalAdpMap[defenseMap[key]] = val;
       }
    }

    res.status(200).json(finalAdpMap);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Unknown error" });
  }
}
