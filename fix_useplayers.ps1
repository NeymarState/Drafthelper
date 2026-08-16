$file = 'src\hooks\usePlayers.ts'
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)

$lines[69] = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('ICAgICAgICAgICAgcC5zdGF0dXMgPSAnVkVSRsOcR0JBUic7'))
$lines[131] = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('ICAgICAgICAgICAgICAgIHN0YXR1czogKGV4aXN0aW5nLnN0YXR1cyAmJiBleGlzdGluZy5zdGF0dXMudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygndmVyZicpKSA/IGZyZXNoLnN0YXR1cyA6IGV4aXN0aW5nLnN0YXR1cyw='))
$lines[163] = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('ICAgICAgICAgIHJldHVybiB7IC4uLnJlc3QsIHN0YXR1czogJ1ZFUkbDnEdCQVInIH07'))

[System.IO.File]::WriteAllLines($file, $lines, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Replaced!"