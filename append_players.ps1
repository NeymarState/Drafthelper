$file = 'src\data\initialPlayers.ts'
$c = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

$idx = $c.LastIndexOf('];')
if ($idx -gt 0) {
    $head = $c.Substring(0, $idx)
    $tail = $c.Substring($idx)
    
    $newPlayers = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('LAogIHsKICAgIGlkOiAncmItY2hyaXNicm9va3MnLAogICAgb3ZyUmFuazogOTk5OSwKICAgIHBvc1Jhbms6ICdSQjk5JywKICAgIG5hbWU6ICdDaHJpcyBCcm9va3MnLAogICAgcGxheWVyQXJjaGV0eXBlOiAnQmFzZWxpbmUnLAogICAgcG9zOiAnUkInLAogICAgdGVhbTogJ0dCJywKICAgIGJ5ZTogMTAsCiAgICB0aWVyOiAnVGllciAxMCcsCiAgICB0aWVyTnVtYmVyOiAxMCwKICAgIHN0YXR1czogJ1ZFUkbDnEdCQVInLAogICAgdGFyZ2V0U2hhcmU6IDAsCiAgICByelRvdWNoZXM6IDAsCiAgICBhaXJZYXJkczogMCwKICAgIGFkcDogOTk5LjAsCiAgICBiYXNlUG9pbnRzSGFsZlBwcjogMi4wLAogICAgcHJvZmlsZTogJ01hbnVlbGwgaGluenVnZWZ1ZWd0LicKICB9LAogIHsKICAgIGlkOiAnd3Ita2VlbmFuYWxsZW4nLAogICAgb3ZyUmFuazogOTk5OSwKICAgIHBvc1Jhbms6ICdXUjk5JywKICAgIG5hbWU6ICdLZWVuYW4gQWxsZW4nLAogICAgcGxheWVyQXJjaGV0eXBlOiAnQmFzZWxpbmUnLAogICAgcG9zOiAnV1InLAogICAgdGVhbTogJ0lORCcsCiAgICBieWU6IDE0LAogICAgdGllcjogJ1RpZXIgMTAnLAogICAgdGllck51bWJlcjogMTAsCiAgICBzdGF0dXM6ICdWRVJGw5xHQkFSJywKICAgIHRhcmdldFNoYXJlOiAwLAogICAgcnpUb3VjaGVzOiAwLAogICAgYWlyWWFyZHM6IDAsCiAgICBhZHA6IDk5OS4wLAogICAgYmFzZVBvaW50c0hhbGZQcHI6IDEuNSwKICAgIHByb2ZpbGU6ICdNYW51ZWxsIGhpbnp1Z2VmdWVndC4nCiAgfSwKICB7CiAgICBpZDogJ3JiLW5hamVlaGFycmlzJywKICAgIG92clJhbms6IDk5OTksCiAgICBwb3NSYW5rOiAnUkI5OScsCiAgICBuYW1lOiAnTmFqZWUgSGFycmlzJywKICAgIHBsYXllckFyY2hldHlwZTogJ0Jhc2VsaW5lJywKICAgIHBvczogJ1JCJywKICAgIHRlYW06ICdOWUcnLAogICAgYnllOiAxMSwKICAgIHRpZXI6ICdUaWVyIDEwJywKICAgIHRpZXJOdW1iZXI6IDEwLAogICAgc3RhdHVzOiAnVkVSRsOcR0JBUicsCiAgICB0YXJnZXRTaGFyZTogMCwKICAgIHJ6VG91Y2hlczogMCwKICAgIGFpcllhcmRzOiAwLAogICAgYWRwOiA5OTkuMCwKICAgIGJhc2VQb2ludHNIYWxmUHByOiAxLjAsCiAgICBwcm9maWxlOiAnTWFudWVsbCBoaW56dWdlZnVlZ3QuJwogIH0='))
    
    $c = $head + $newPlayers + "
" + $tail
    [System.IO.File]::WriteAllText($file, $c, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "Appended new players successfully!"
} else {
    Write-Host "Could not find '];' in initialPlayers.ts"
}