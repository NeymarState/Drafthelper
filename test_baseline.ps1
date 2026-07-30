$workspace = "C:\Users\felix\antigravity\Fantasy-Football-Command-Center-2026-2026-07-29-eb277"
$updateRankingsPath = "$workspace\src\data\updateRankings.ts"
$content = Get-Content $updateRankingsPath -Raw
$rawData = ($content -match 'const RAW_DATA = `([\s\S]*?)`;') ? $matches[1].Trim() : ''
$blocks = $rawData -split "

"
$posGroups = @("QB", "RB", "WR", "TE")
$players = @()
for ($b = 0; $b -lt $blocks.Count; $b++) {
    $lines = $blocks[$b] -split "
"
    $pos = $posGroups[[math]::Min($b, 3)]
    $i = 0
    while ($i -lt $lines.Count) {
        if ($lines[$i] -match '\[(.*?)\]') {
            $rankStr = $lines[$i+2]
            $rank = 99
            if ($rankStr -match '\d+') { $rank = [int]$matches[0] }
            $basePoints = 0
            if ($pos -eq "RB") { $basePoints = 350 - ($rank * 3.5) }
            if ($pos -eq "WR") { $basePoints = 345 - ($rank * 2.8) }
            if ($pos -eq "QB") { $basePoints = 285 - ($rank * 3.0) }
            if ($pos -eq "TE") { $basePoints = 280 - ($rank * 3.5) }
            $players += @{ pos=$pos; basePoints=$basePoints }
        }
        $i += 6
    }
}
$tempSorted = $players | Sort-Object -Property basePoints -Descending
$baselinePoints = @()
foreach ($p in $tempSorted) { $baselinePoints += $p.basePoints }
Write-Host "Total baseline points: $($baselinePoints.Count)"
Write-Host "Index 23 (Rank 24): $($baselinePoints[23])"
Write-Host "Index 24 (Rank 25): $($baselinePoints[24])"
