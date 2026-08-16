$file = 'src\components\Header.tsx'
$c = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$c = $c -replace '\{settings\.userPickSlot\}.*?T\s*', '{settings.userPickSlot}'
$c = $c -replace '\{settings\.totalRounds\}.*?T\s*', '{settings.totalRounds}'
[System.IO.File]::WriteAllText($file, $c, (New-Object System.Text.UTF8Encoding($false)))

$file = 'src\hooks\usePlayers.ts'
$c = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$repl = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('aWYgKHR5cGVvZiBwLnN0YXR1cyA9PT0gJ3N0cmluZycgJiYgcC5zdGF0dXMudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygndmVyZicpKSB7DQogICAgICAgICAgICBwLnN0YXR1cyA9ICdWZXJmw7xnYmFyJzsNCiAgICAgICAgICB9'))
$c = $c -replace '(?s)if \(typeof p\.status === ''string'' && /\^VERF.*?\$/.test\(p\.status\)\) \{.*?\}', $repl
[System.IO.File]::WriteAllText($file, $c, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Success"