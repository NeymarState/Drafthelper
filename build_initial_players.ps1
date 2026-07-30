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
                if ($rank -le 3) { $tier = "Tier 1: Elite QBs"; $tierNumber = 1 }
                elseif ($rank -le 7) { $tier = "Tier 2: High-End QB1"; $tierNumber = 2 }
                elseif ($rank -le 12) { $tier = "Tier 3: Solid QB1"; $tierNumber = 3 }
                elseif ($rank -le 18) { $tier = "Tier 4: High-End QB2"; $tierNumber = 4 }
            } elseif ($pos -eq "RB") {
                if ($rank -le 4) { $tier = "Tier 1: Legendary Bellcows"; $tierNumber = 1 }
                elseif ($rank -le 12) { $tier = "Tier 2: High-Volume RB1s"; $tierNumber = 2 }
                elseif ($rank -le 24) { $tier = "Tier 3: Solid RB2s"; $tierNumber = 3 }
                elseif ($rank -le 36) { $tier = "Tier 4: Flex Options / Handcuffs"; $tierNumber = 4 }
            } elseif ($pos -eq "WR") {
                if ($rank -le 5) { $tier = "Tier 1: Alpha Target Monsters"; $tierNumber = 1 }
                elseif ($rank -le 16) { $tier = "Tier 2: Elite WR1s"; $tierNumber = 2 }
                elseif ($rank -le 28) { $tier = "Tier 3: Solid WR2s"; $tierNumber = 3 }
                elseif ($rank -le 48) { $tier = "Tier 4: Flex WRs"; $tierNumber = 4 }
            } elseif ($pos -eq "TE") {
                if ($rank -le 3) { $tier = "Tier 1: Elite TEs"; $tierNumber = 1 }
                elseif ($rank -le 8) { $tier = "Tier 2: High-End TE1s"; $tierNumber = 2 }
                elseif ($rank -le 14) { $tier = "Tier 3: Solid TE1s"; $tierNumber = 3 }
                elseif ($rank -le 24) { $tier = "Tier 4: Upside TE2s"; $tierNumber = 4 }
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
  @{ name="Justin Tucker"; pos="K"; team="BAL"; bye=14; rank=1; tier="Tier 1"; tierNumber=1; basePoints=140 },
  @{ name="Brandon Aubrey"; pos="K"; team="DAL"; bye=7; rank=2; tier="Tier 1"; tierNumber=1; basePoints=138 },
  @{ name="Jake Elliott"; pos="K"; team="PHI"; bye=5; rank=3; tier="Tier 1"; tierNumber=1; basePoints=135 },
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

# Sort by basePoints
$players = $players | Sort-Object -Property basePoints -Descending

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





