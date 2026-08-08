$path = "src/data/initialPlayers.ts"
$content = Get-Content $path -Raw

$regex = [regex]::new("\{([^}]+)\}")
$matches = $regex.Matches($content)

foreach ($match in $matches) {
    $body = $match.Groups[1].Value
    if ($body -match "id:" -and $body -match "pos:") {
        $posMatch = [regex]::Match($body, "pos:\s*'([^']+)'")
        $adpMatch = [regex]::Match($body, "adp:\s*([0-9.]+)")
        
        if ($posMatch.Success -and $adpMatch.Success) {
            $pos = $posMatch.Groups[1].Value
            $adp = [double]::Parse($adpMatch.Groups[1].Value, [System.Globalization.CultureInfo]::InvariantCulture)
            
            $points = 100.0
            
            if ($pos -eq 'QB') {
                $points = 380 * [math]::Exp(-0.005 * $adp) + 50
            } elseif ($pos -eq 'RB') {
                $points = 300 * [math]::Exp(-0.012 * $adp) + 40
            } elseif ($pos -eq 'WR') {
                $points = 290 * [math]::Exp(-0.01 * $adp) + 40
            } elseif ($pos -eq 'TE') {
                $points = 220 * [math]::Exp(-0.015 * $adp) + 30
            } elseif ($pos -eq 'K') {
                $points = 150 * [math]::Exp(-0.002 * $adp)
            } elseif ($pos -eq 'DST') {
                $points = 140 * [math]::Exp(-0.002 * $adp)
            }
            
            $points = [math]::Max(0.0, [math]::Round($points, 1))
            $pointsStr = $points.ToString("0.0", [System.Globalization.CultureInfo]::InvariantCulture)
            
            $newBody = [regex]::Replace($body, "basePointsHalfPpr:\s*[0-9.]+", "basePointsHalfPpr: $pointsStr")
            $content = $content.Replace($body, $newBody)
        }
    }
}

[System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Done updating points!"
