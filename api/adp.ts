export default async function handler(req: any, res: any) {
  try {
    const provider = req.query?.provider || 'sleeper';
    const adpMap: Record<string, number> = {};

    const normalizeName = (name: string) => name
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/jr$/, '')
      .replace(/sr$/, '')
      .replace(/iii$/, '')
      .replace(/ii$/, '');

    if (provider === 'espn') {
      const espnUrl = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leaguedefaults/3?view=kona_player_info";
      const espnRes = await fetch(espnUrl, {
        headers: {
          "X-Fantasy-Filter": '{"players":{"filterSlotIds":{"value":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,23,24]},"filterStatsForTopScoringPeriodIds":{"value":16,"additionalValue":["002026","102026","002025","022026"]},"sortDraftRanks":{"sortPriority":100,"sortAsc":true,"value":"STANDARD"}}}'
        }
      });
      
      if (!espnRes.ok) {
        throw new Error(`Failed to fetch from ESPN API: ${espnRes.status}`);
      }
      
      const data = await espnRes.json();
      if (data && data.players && Array.isArray(data.players)) {
        for (const p of data.players) {
          if (p.player && p.player.fullName && p.player.ownership && p.player.ownership.averageDraftPosition) {
            const adp = p.player.ownership.averageDraftPosition;
            if (adp > 0 && adp < 900) {
              adpMap[normalizeName(p.player.fullName)] = adp;
            }
          }
        }
      }
    } else {
      // Sleeper (Default)
      const url = "https://api.sleeper.app/projections/nfl/2026?season_type=regular&position[]=DEF&position[]=FLEX&position[]=K&position[]=QB&position[]=RB&position[]=TE&position[]=WR&order_by=adp";
      
      const fetchRes = await fetch(url);
      if (!fetchRes.ok) {
        throw new Error(`Failed to fetch from Sleeper API: ${fetchRes.status}`);
      }
      const data = await fetchRes.json();
      
      for (const item of data) {
        if (!item.player || !item.stats) continue;
        
        const firstName = item.player.first_name || '';
        const lastName = item.player.last_name || '';
        const rawName = `${firstName} ${lastName}`.trim();
        const normName = normalizeName(rawName);
        
        let adp = null;
        if (typeof item.stats.adp_half_ppr === 'number' && item.stats.adp_half_ppr < 900) {
          adp = item.stats.adp_half_ppr;
        } else if (typeof item.stats.adp_ppr === 'number' && item.stats.adp_ppr < 900) {
          adp = item.stats.adp_ppr;
        } else if (typeof item.stats.adp_std === 'number' && item.stats.adp_std < 900) {
          adp = item.stats.adp_std;
        }
        
        if (adp !== null) {
          adpMap[normName] = adp;
        }
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
