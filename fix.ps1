$file = "src\components\Header.tsx"
$c = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$c = $c -replace '<spaN.*?CHSTER PICK IN:</span>', '<span className="text-slate-400">NÄCHSTER PICK IN:</span>'
$c = $c -replace 'PICK .*?NDERN:', 'PICK ÄNDERN:'
[System.IO.File]::WriteAllText($file, $c, (New-Object System.Text.UTF8Encoding($false)))

$file = "src\components\CustomizationTab.tsx"
$c = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$c = $c -replace 'Ligagr.*?Ye:', 'Ligagröße:'
[System.IO.File]::WriteAllText($file, $c, (New-Object System.Text.UTF8Encoding($false)))

$file = "src\components\TiersTab.tsx"
$c = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$c = $c -replace 'VERF.*?GBAR', 'VERFÜGBAR'
[System.IO.File]::WriteAllText($file, $c, (New-Object System.Text.UTF8Encoding($false)))

$file = "src\components\ValuePlayersTab.tsx"
$c = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$c = $c -replace 'gr.*?ten Differenz', 'größten Differenz'
[System.IO.File]::WriteAllText($file, $c, (New-Object System.Text.UTF8Encoding($false)))