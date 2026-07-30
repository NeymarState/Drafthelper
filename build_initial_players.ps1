$ErrorActionPreference = "Stop"

$workspace = "C:\Users\felix\antigravity\Fantasy-Football-Command-Center-2026-2026-07-29-eb277"
$updateRankingsPath = "$workspace\src\data\updateRankings.ts"
$initialPlayersPath = "$workspace\src\data\initialPlayers.ts"

$content = Get-Content $updateRankingsPath -Raw
if ($content -match 'const RAW_DATA = `([\s\S]*?)`;') {
    $rawData = $matches[1].Trim()
} else {
    Write-Host "Could not find RAW_DATA"
    exit 1
}

$blocks = $rawData -split "`n`n"
$posGroups = @("QB", "RB", "WR", "TE")

$players = @()

for ($b = 0; $b -lt $blocks.Count; $b++) {
    $lines = $blocks[$b] -split "`n"
    $pos = $posGroups[[math]::Min($b, 3)]
    
    $i = 0
    while ($i -lt $lines.Count) {
        if (-not $lines[$i].StartsWith("[")) {
            $i++
            continue
        }
        
        if ($lines[$i] -match '\[(.*?)\]') {
            $name = $matches[1]
            $teamByeLine = $lines[$i+1]
            
            $team = "FA"
            $bye = 0
            if ($teamByeLine -match '([A-Z]+)\((\d+)\)') {
                $team = $matches[1]
                $bye = [int]$matches[2]
            }
            
            $rankStr = $lines[$i+2]
            $rank = 99
            if ($rankStr -match '\d+') { $rank = [int]$matches[0] }
            
            # Simple tier assignment
            $tier = "Tier 5: Depth"
            $tierNumber = 5
            
            if ($pos -eq "QB") {
                if ($rank -le 3) { $tier = "Tier 1: Elite"; $tierNumber = 1 }
                elseif ($rank -le 7) { $tier = "Tier 2: High-End QB1"; $tierNumber = 2 }
                elseif ($rank -le 12) { $tier = "Tier 3: Solid QB1"; $tierNumber = 3 }
                elseif ($rank -le 18) { $tier = "Tier 4: Streamers"; $tierNumber = 4 }
                else { $tier = "Tier 5: Depth/Superflex"; $tierNumber = 5 }
            } elseif ($pos -eq "RB") {
                if ($rank -le 4) { $tier = "Tier 1: Legendary"; $tierNumber = 1 }
                elseif ($rank -le 12) { $tier = "Tier 2: High-Volume RB1s"; $tierNumber = 2 }
                elseif ($rank -le 20) { $tier = "Tier 3: Solid RB2s"; $tierNumber = 3 }
                elseif ($rank -le 28) { $tier = "Tier 4: Upside RB2/3"; $tierNumber = 4 }
                elseif ($rank -le 36) { $tier = "Tier 5: Flex Options"; $tierNumber = 5 }
                elseif ($rank -le 46) { $tier = "Tier 6: Premium Handcuffs"; $tierNumber = 6 }
                elseif ($rank -le 56) { $tier = "Tier 7: Committee Backs"; $tierNumber = 7 }
                elseif ($rank -le 66) { $tier = "Tier 8: Lottery Tickets"; $tierNumber = 8 }
                else { $tier = "Tier 9: Deep Flyers"; $tierNumber = 9 }
            } elseif ($pos -eq "WR") {
                if ($rank -le 5) { $tier = "Tier 1: Alpha Targets"; $tierNumber = 1 }
                elseif ($rank -le 12) { $tier = "Tier 2: Elite WR1s"; $tierNumber = 2 }
                elseif ($rank -le 20) { $tier = "Tier 3: High-End WR2s"; $tierNumber = 3 }
                elseif ($rank -le 28) { $tier = "Tier 4: Solid WR2s"; $tierNumber = 4 }
                elseif ($rank -le 36) { $tier = "Tier 5: Upside WR3s"; $tierNumber = 5 }
                elseif ($rank -le 44) { $tier = "Tier 6: Flex Options"; $tierNumber = 6 }
                elseif ($rank -le 54) { $tier = "Tier 7: Bye Week Fillers"; $tierNumber = 7 }
                elseif ($rank -le 64) { $tier = "Tier 8: Boom/Bust"; $tierNumber = 8 }
                elseif ($rank -le 76) { $tier = "Tier 9: Deep Sleepers"; $tierNumber = 9 }
                else { $tier = "Tier 10: Dart Throws"; $tierNumber = 10 }
            } elseif ($pos -eq "TE") {
                if ($rank -le 3) { $tier = "Tier 1: Elite TEs"; $tierNumber = 1 }
                elseif ($rank -le 8) { $tier = "Tier 2: High-End TE1s"; $tierNumber = 2 }
                elseif ($rank -le 14) { $tier = "Tier 3: Solid TE1s"; $tierNumber = 3 }
                elseif ($rank -le 22) { $tier = "Tier 4: Upside TE2s"; $tierNumber = 4 }
                else { $tier = "Tier 5: Streamers"; $tierNumber = 5 }
            }
            
            # Synthesize base points
            $basePoints = 0
            if ($pos -eq "RB") { $basePoints = 350 - ($rank * 3.5) }
            if ($pos -eq "WR") { $basePoints = 345 - ($rank * 2.8) }
            if ($pos -eq "QB") { $basePoints = 285 - ($rank * 3.0) }
            if ($pos -eq "TE") { $basePoints = 280 - ($rank * 3.5) }
            
            $players += @{
                name = $name
                pos = $pos
                team = $team
                bye = $bye
                rank = $rank
                tier = $tier
                tierNumber = $tierNumber
                basePoints = $basePoints
            }
        }
        $i += 6
    }
}

# Add K and DST manually
$kdst = @(
  @{ name="Brandon Aubrey"; pos="K"; team="DAL"; bye=7; rank=1; tier="Tier 1"; tierNumber=1; basePoints=143.5 },
  @{ name="Ka'imi Fairbairn"; pos="K"; team="HOU"; bye=8; rank=2; tier="Tier 1"; tierNumber=1; basePoints=142.0 },
  @{ name="Cameron Dicker"; pos="K"; team="LAC"; bye=7; rank=3; tier="Tier 1"; tierNumber=1; basePoints=140.5 },
  @{ name="Jason Myers"; pos="K"; team="SEA"; bye=11; rank=4; tier="Tier 2"; tierNumber=2; basePoints=139.0 },
  @{ name="Cam Little"; pos="K"; team="JAC"; bye=7; rank=5; tier="Tier 2"; tierNumber=2; basePoints=137.5 },
  @{ name="Tyler Loop"; pos="K"; team="BAL"; bye=13; rank=6; tier="Tier 2"; tierNumber=2; basePoints=136.0 },
  @{ name="Eddy Pineiro"; pos="K"; team="SF"; bye=8; rank=7; tier="Tier 2"; tierNumber=2; basePoints=134.5 },
  @{ name="Cairo Santos"; pos="K"; team="CHI"; bye=10; rank=8; tier="Tier 3"; tierNumber=3; basePoints=133.0 },
  @{ name="Evan McPherson"; pos="K"; team="CIN"; bye=6; rank=9; tier="Tier 3"; tierNumber=3; basePoints=131.5 },
  @{ name="Jake Bates"; pos="K"; team="DET"; bye=6; rank=10; tier="Tier 3"; tierNumber=3; basePoints=130.0 },
  @{ name="Harrison Mevis"; pos="K"; team="LAR"; bye=11; rank=11; tier="Tier 3"; tierNumber=3; basePoints=128.5 },
  @{ name="Andy Borregales"; pos="K"; team="NE"; bye=11; rank=12; tier="Tier 3"; tierNumber=3; basePoints=127.0 },
  @{ name="Chris Boswell"; pos="K"; team="PIT"; bye=9; rank=13; tier="Tier 3"; tierNumber=3; basePoints=125.5 },
  @{ name="Harrison Butker"; pos="K"; team="KC"; bye=5; rank=14; tier="Tier 3"; tierNumber=3; basePoints=124.0 },
  @{ name="Chase McLaughlin"; pos="K"; team="TB"; bye=10; rank=15; tier="Tier 3"; tierNumber=3; basePoints=122.5 },
  @{ name="Wil Lutz"; pos="K"; team="DEN"; bye=10; rank=16; tier="Tier 3"; tierNumber=3; basePoints=121.0 },
  @{ name="Will Reichard"; pos="K"; team="MIN"; bye=6; rank=17; tier="Tier 3"; tierNumber=3; basePoints=119.5 },
  @{ name="Jake Elliott"; pos="K"; team="PHI"; bye=10; rank=18; tier="Tier 4"; tierNumber=4; basePoints=118.0 },
  @{ name="Charlie Smyth"; pos="K"; team="NO"; bye=8; rank=19; tier="Tier 4"; tierNumber=4; basePoints=116.5 },
  @{ name="Blake Grupe"; pos="K"; team="IND"; bye=13; rank=20; tier="Tier 4"; tierNumber=4; basePoints=115.0 },
  @{ name="Chad Ryland"; pos="K"; team="ARI"; bye=14; rank=21; tier="Tier 4"; tierNumber=4; basePoints=113.5 },
  @{ name="Nick Folk"; pos="K"; team="ATL"; bye=11; rank=22; tier="Tier 4"; tierNumber=4; basePoints=112.0 },
  @{ name="Joey Slye"; pos="K"; team="TEN"; bye=9; rank=23; tier="Tier 4"; tierNumber=4; basePoints=110.5 },
  @{ name="Tyler Bass"; pos="K"; team="BUF"; bye=7; rank=24; tier="Tier 4"; tierNumber=4; basePoints=109.0 },
  @{ name="Zane Gonzalez"; pos="K"; team="MIA"; bye=6; rank=25; tier="Tier 4"; tierNumber=4; basePoints=107.5 },
  @{ name="Ryan Fitzgerald"; pos="K"; team="CAR"; bye=5; rank=26; tier="Tier 4"; tierNumber=4; basePoints=106.0 },
  @{ name="Trey Smack"; pos="K"; team="GB"; bye=11; rank=27; tier="Tier 5"; tierNumber=5; basePoints=104.5 },
  @{ name="Daniel Carlson"; pos="K"; team="LV"; bye=13; rank=28; tier="Tier 5"; tierNumber=5; basePoints=103.0 },
  @{ name="Ben Sauls"; pos="K"; team="NYG"; bye=8; rank=29; tier="Tier 5"; tierNumber=5; basePoints=101.5 },
  @{ name="Jake Moody"; pos="K"; team="WAS"; bye=7; rank=30; tier="Tier 5"; tierNumber=5; basePoints=100.0 },
  @{ name="Brandon McManus"; pos="K"; team="FA"; bye=0; rank=31; tier="Tier 5"; tierNumber=5; basePoints=98.5 },
  @{ name="Jason Sanders"; pos="K"; team="NYJ"; bye=13; rank=32; tier="Tier 6"; tierNumber=6; basePoints=97.0 },
  @{ name="Spencer Shrader"; pos="K"; team="IND"; bye=13; rank=33; tier="Tier 6"; tierNumber=6; basePoints=95.5 },
  @{ name="Andre Szmyt"; pos="K"; team="CLE"; bye=11; rank=34; tier="Tier 6"; tierNumber=6; basePoints=94.0 },
  @{ name="Matt Gay"; pos="K"; team="LV"; bye=13; rank=35; tier="Tier 6"; tierNumber=6; basePoints=92.5 },
  @{ name="Cade York"; pos="K"; team="NYJ"; bye=13; rank=36; tier="Tier 6"; tierNumber=6; basePoints=91.0 },
  @{ name="Riley Patterson"; pos="K"; team="MIA"; bye=6; rank=37; tier="Tier 6"; tierNumber=6; basePoints=89.5 },
  @{ name="B.T. Potter"; pos="K"; team="TB"; bye=10; rank=38; tier="Tier 6"; tierNumber=6; basePoints=88.0 },
  @{ name="Texans DST"; pos="DST"; team="HOU"; bye=8; rank=1; tier="Tier 1"; tierNumber=1; basePoints=130 },
  @{ name="Broncos DST"; pos="DST"; team="DEN"; bye=10; rank=2; tier="Tier 1"; tierNumber=1; basePoints=129.5 },
  @{ name="Seahawks DST"; pos="DST"; team="SEA"; bye=11; rank=3; tier="Tier 1"; tierNumber=1; basePoints=129 },
  @{ name="Rams DST"; pos="DST"; team="LAR"; bye=11; rank=4; tier="Tier 1"; tierNumber=1; basePoints=128.5 },
  @{ name="Eagles DST"; pos="DST"; team="PHI"; bye=10; rank=5; tier="Tier 2"; tierNumber=2; basePoints=128 },
  @{ name="Vikings DST"; pos="DST"; team="MIN"; bye=6; rank=6; tier="Tier 2"; tierNumber=2; basePoints=127.5 },
  @{ name="Patriots DST"; pos="DST"; team="NE"; bye=11; rank=7; tier="Tier 2"; tierNumber=2; basePoints=127 },
  @{ name="Jaguars DST"; pos="DST"; team="JAC"; bye=7; rank=8; tier="Tier 2"; tierNumber=2; basePoints=126.5 },
  @{ name="Steelers DST"; pos="DST"; team="PIT"; bye=9; rank=9; tier="Tier 3"; tierNumber=3; basePoints=126 },
  @{ name="Chargers DST"; pos="DST"; team="LAC"; bye=7; rank=10; tier="Tier 3"; tierNumber=3; basePoints=125.5 },
  @{ name="Ravens DST"; pos="DST"; team="BAL"; bye=13; rank=11; tier="Tier 3"; tierNumber=3; basePoints=125 },
  @{ name="Packers DST"; pos="DST"; team="GB"; bye=11; rank=12; tier="Tier 3"; tierNumber=3; basePoints=124.5 },
  @{ name="Chiefs DST"; pos="DST"; team="KC"; bye=5; rank=13; tier="Tier 3"; tierNumber=3; basePoints=124 },
  @{ name="Lions DST"; pos="DST"; team="DET"; bye=6; rank=14; tier="Tier 3"; tierNumber=3; basePoints=123.5 },
  @{ name="Bills DST"; pos="DST"; team="BUF"; bye=7; rank=15; tier="Tier 4"; tierNumber=4; basePoints=123 },
  @{ name="Browns DST"; pos="DST"; team="CLE"; bye=11; rank=16; tier="Tier 4"; tierNumber=4; basePoints=122.5 },
  @{ name="49ers DST"; pos="DST"; team="SF"; bye=8; rank=17; tier="Tier 4"; tierNumber=4; basePoints=122 },
  @{ name="Saints DST"; pos="DST"; team="NO"; bye=8; rank=18; tier="Tier 4"; tierNumber=4; basePoints=121.5 },
  @{ name="Falcons DST"; pos="DST"; team="ATL"; bye=11; rank=19; tier="Tier 4"; tierNumber=4; basePoints=121 },
  @{ name="Bears DST"; pos="DST"; team="CHI"; bye=10; rank=20; tier="Tier 4"; tierNumber=4; basePoints=120.5 },
  @{ name="Colts DST"; pos="DST"; team="IND"; bye=13; rank=21; tier="Tier 4"; tierNumber=4; basePoints=120 },
  @{ name="Giants DST"; pos="DST"; team="NYG"; bye=8; rank=22; tier="Tier 4"; tierNumber=4; basePoints=119.5 },
  @{ name="Buccaneers DST"; pos="DST"; team="TB"; bye=10; rank=23; tier="Tier 5"; tierNumber=5; basePoints=119 },
  @{ name="Cowboys DST"; pos="DST"; team="DAL"; bye=14; rank=24; tier="Tier 5"; tierNumber=5; basePoints=118.5 },
  @{ name="Panthers DST"; pos="DST"; team="CAR"; bye=5; rank=25; tier="Tier 5"; tierNumber=5; basePoints=118 },
  @{ name="Titans DST"; pos="DST"; team="TEN"; bye=9; rank=26; tier="Tier 5"; tierNumber=5; basePoints=117.5 },
  @{ name="Bengals DST"; pos="DST"; team="CIN"; bye=6; rank=27; tier="Tier 5"; tierNumber=5; basePoints=117 },
  @{ name="Commanders DST"; pos="DST"; team="WAS"; bye=7; rank=28; tier="Tier 5"; tierNumber=5; basePoints=116.5 },
  @{ name="Dolphins DST"; pos="DST"; team="MIA"; bye=6; rank=29; tier="Tier 5"; tierNumber=5; basePoints=116 },
  @{ name="Raiders DST"; pos="DST"; team="LV"; bye=13; rank=30; tier="Tier 5"; tierNumber=5; basePoints=115.5 },
  @{ name="Jets DST"; pos="DST"; team="NYJ"; bye=13; rank=31; tier="Tier 5"; tierNumber=5; basePoints=115 },
  @{ name="Cardinals DST"; pos="DST"; team="ARI"; bye=14; rank=32; tier="Tier 5"; tierNumber=5; basePoints=114.5 }
)
$players += $kdst

# Deduplicate by Name (First come, first serve)
$uniquePlayers = @()
$seenNames = @{}
foreach ($p in $players) {
    if (-not $seenNames.ContainsKey($p.name)) {
        $uniquePlayers += $p
        $seenNames[$p.name] = $true
    }
}
$players = $uniquePlayers

# Fetch Sleeper ADP to re-rank QBs and TEs
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$response = Invoke-RestMethod -Uri "https://api.sleeper.app/projections/nfl/2026?season_type=regular&position[]=DEF&position[]=K&position[]=QB&position[]=RB&position[]=TE&position[]=WR&order_by=adp"
$adpMap = @{}
foreach ($p in $response) {
    if ($p.player -and $p.player.first_name -and $p.player.last_name -and $p.stats -and $p.stats.adp_half_ppr) {
        $name = "$($p.player.first_name) $($p.player.last_name)" -replace "[^a-zA-Z0-9 ]", ""
        $name = $name.ToLower().Trim()
        $adpMap[$name] = $p.stats.adp_half_ppr
    }
}

# Sort temporarily to get the baseline basePoints distribution
$tempSorted = $players | Sort-Object -Property { [double]$_.basePoints } -Descending
$baselinePoints = @()
foreach ($p in $tempSorted) { $baselinePoints += [double]$p.basePoints }

# Adjust QB and TE basePoints based on their ADP
foreach ($p in $players) {
    if ($p.pos -eq "QB" -or $p.pos -eq "TE") {
        $cleanName = $p.name -replace "[^a-zA-Z0-9 ]", ""
        $cleanName = $cleanName.ToLower().Trim()
        
        if ($adpMap.ContainsKey($cleanName) -and $adpMap[$cleanName] -lt 999) {
            $adp = $adpMap[$cleanName]
            $targetIndex = [math]::Max(0, [math]::Min($baselinePoints.Count - 1, [math]::Floor($adp) - 1))
            # Assign the base points of that rank, plus a tiny fraction to break ties (lower ADP = higher fraction)
            $fraction = 1.0 - ($adp - [math]::Floor($adp))
            $p.basePoints = $baselinePoints[$targetIndex] + ($fraction * 0.9)
        }
    }
}

# Final Sort by updated basePoints
$players = $players | Sort-Object -Property { [double]$_.basePoints } -Descending

$output = "import { Player } from '../types';`n`nconst RAW_INITIAL_PLAYERS: Player[] = [`n"
$ovrRank = 1

foreach ($p in $players) {
    # Check for James Cook II / III / Jr. cleanup
    if ($p.name -match "James Cook") { $p.name = "James Cook" }
    if ($p.name -match "Kyle Pitts") { $p.name = "Kyle Pitts" }
    if ($p.name -match "Hollywood Brown") { $p.name = "Marquise Brown" }
    
    $idName = $p.name.ToLower() -replace '[^a-z]', ''
    $id = "$($p.pos.ToLower())-$idName"
    
    $posRank = "$($p.pos)$($p.rank)"
    
    $output += "  {`n"
    $output += "    id: '$id',`n"
    $output += "    ovrRank: $ovrRank,`n"
    $output += "    posRank: '$posRank',`n"
    # use replace to escape single quotes in name (like D'Andre Swift)
    $escapedName = $p.name -replace "'", "\'"
    $output += "    name: '$escapedName',`n"
    $output += "    pos: '$($p.pos)',`n"
    $output += "    team: '$($p.team)',`n"
    $output += "    bye: $($p.bye),`n"
    $output += "    tier: '$($p.tier)',`n"
    $output += "    tierNumber: $($p.tierNumber),`n"
    $output += "    status: 'Verfügbar',`n"
    $output += "    targetShare: 0,`n"
    $output += "    rzTouches: 0,`n"
    $output += "    airYards: 0,`n"
    # Format base points properly
    $bpString = [math]::Round($p.basePoints, 1).ToString("F1", [cultureinfo]::InvariantCulture)
    $output += "    basePointsHalfPpr: $bpString,`n"
    $output += "    profile: 'Automatisch aktualisiert aus Fantasy Footballers Daten.'`n"
    $output += "  },`n"
    $ovrRank++
}

$output += "];`n`nexport const INITIAL_PLAYERS = RAW_INITIAL_PLAYERS.sort((a,b) => b.basePointsHalfPpr - a.basePointsHalfPpr).map((p, i) => ({ ...p, ovrRank: i + 1 }));`n"

Set-Content -Path $initialPlayersPath -Value $output -Encoding UTF8
Write-Host "Done! Generated $($players.Count) players."






