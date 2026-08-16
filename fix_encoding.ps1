$files = Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $original = $content
    $content = $content -replace 'Verf.gbar', 'Verfügbar'
    $content = $content -replace 'TIEFENPLATZE', 'TIEFENPLÄTZE'
    $content = $content -replace 'M.chtest', 'Möchtest'
    $content = $content -replace '.berschreibt', 'überschreibt'
    $content = $content -replace '.nderungen', 'Änderungen'
    $content = $content -replace 'w.chentlichen', 'wöchentlichen'
    $content = $content -replace 'f.r ', 'für '
    $content = $content -replace 'auszuw.hlen', 'auszuwählen'
    $content = $content -replace 'n.chsten', 'nächsten'
    $content = $content -replace 'gen.gend', 'genügend'
    $content = $content -replace 'VerfOgbar', 'Verfügbar'
    
    if ($content -cne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, (New-Object System.Text.UTF8Encoding($false)))
        Write-Host "Fixed $($file.Name)"
    }
}
