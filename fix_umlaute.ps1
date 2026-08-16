$file = "src\components\Header.tsx"
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)
$lines[91] = '            <span className="text-slate-400">NÄCHSTER PICK IN:</span>'
$lines[211] = '            <span className="text-slate-400 text-[11px]">PICK ÄNDERN:</span>'
[System.IO.File]::WriteAllLines($file, $lines, (New-Object System.Text.UTF8Encoding($false)))

$file = "src\components\CustomizationTab.tsx"
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)
$lines[206] = '              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ligagröße:</label>'
[System.IO.File]::WriteAllLines($file, $lines, (New-Object System.Text.UTF8Encoding($false)))

$file = "src\components\TiersTab.tsx"
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)
$lines[53] = "            const availableCount = players.filter((p) => p.pos === pos && p.status === 'VERFÜGBAR').length;"
$lines[79] = "          const availableCount = tierGroup.filter((p) => p.status === 'VERFÜGBAR').length;"
$lines[120] = '                    {availableCount} / {tierGroup.length} VERFÜGBAR'
$lines[180] = "                        {player.status === 'VERFÜGBAR' ? ("
[System.IO.File]::WriteAllLines($file, $lines, (New-Object System.Text.UTF8Encoding($false)))

$file = "src\components\ValuePlayersTab.tsx"
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)
$lines[178] = '            Finde Spieler mit der größten Differenz zwischen ADP und deinem Ranking.'
[System.IO.File]::WriteAllLines($file, $lines, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Success!"
