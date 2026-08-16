$file = 'src\components\Header.tsx'
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)
$lines[91] = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('ICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSJ0ZXh0LXNsYXRlLTQwMCI+TsQ0SFNURVIgUElDSyBJTjo8L3NwYW4+'))
$lines[211] = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('ICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSJ0ZXh0LXNsYXRlLTQwMCB0ZXh0LVsxMXB4XSI+UElDSyDDhE5ERVJOOjwvc3Bhbj4='))
[System.IO.File]::WriteAllLines($file, $lines, (New-Object System.Text.UTF8Encoding($false)))

$file = 'src\components\CustomizationTab.tsx'
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)
$lines[206] = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('ICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS00MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIj5MaWdhZ3LDtsOfZTo8L2xhYmVsPg=='))
[System.IO.File]::WriteAllLines($file, $lines, (New-Object System.Text.UTF8Encoding($false)))

$file = 'src\components\TiersTab.tsx'
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)
$lines[53] = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('ICAgICAgICAgICAgY29uc3QgYXZhaWxhYmxlQ291bnQgPSBwbGF5ZXJzLmZpbHRlcigocCkgPT4gcC5wb3MgPT09IHBvcyAmJiBwLnN0YXR1cyA9PT0gJ1ZFUkbDnEdCQVInKS5sZW5ndGg7'))
$lines[79] = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('ICAgICAgICAgIGNvbnN0IGF2YWlsYWJsZUNvdW50ID0gdGllckdyb3VwLmZpbHRlcigocCkgPT4gcC5zdGF0dXMgPT09ICdWRVJGw5xHQkFSJykubGVuZ3RoOw=='))
$lines[120] = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('                    e2F2YWlsYWJsZUNvdW50fSAvIHt0aWVyR3JvdXAubGVuZ3RofSBWRVJGw5xHQkFS'))
$lines[180] = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('                        e3BsYXllci5zdGF0dXMgPT09ICdWRVJGw5xHQkFSJyA/ICg='))
[System.IO.File]::WriteAllLines($file, $lines, (New-Object System.Text.UTF8Encoding($false)))

$file = 'src\components\ValuePlayersTab.tsx'
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)
$lines[178] = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('            RmluZGUgU3BpZWxlciBtaXQgZGVyIGdyw7bDn3RlbiBEaWZmZXJlbnogendpc2NoZW4gQURQIHVuZCBkZWluZW0gUmFua2luZy4='))
[System.IO.File]::WriteAllLines($file, $lines, (New-Object System.Text.UTF8Encoding($false)))