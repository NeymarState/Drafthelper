$ErrorActionPreference = 'Stop'
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
Write-Host "Loaded $($adpMap.Count) ADPs."
Write-Host "Josh Allen ADP: $($adpMap['josh allen'])"
