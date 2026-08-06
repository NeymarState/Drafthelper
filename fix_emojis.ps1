$files = Get-ChildItem -Path "src\components" -Filter "*.tsx"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    $content = [regex]::Replace($content, "(?s)\{player\.customTag === 'Sleeper' \? '.*? Sleeper' :.*?player\.customTag === 'Rookie' \? '.*? Rookie' :.*?'.*? Value'\}", "{player.customTag === 'Sleeper' ? '⚡ Sleeper' : 
                                 player.customTag === 'Target' ? '🎯 Target' : 
                                 player.customTag === 'Avoid' ? '🚨 Avoid' : 
                                 player.customTag === 'Fade' ? '📉 Fade' : 
                                   player.customTag === 'Rookie' ? '👶 Rookie' : 
                                 '💎 Value'}")
                                 
    $content = [regex]::Replace($content, "(?s)\{player\.playerArchetype === 'Upside' \? '.*? Upside' : '.*? Baseline'\}", "{player.playerArchetype === 'Upside' ? '📈 Upside' : '📉 Baseline'}")
    
    $content = [regex]::Replace($content, "(?s)ROOKIE\s*</span>", "👶 ROOKIE</span>")
    $content = [regex]::Replace($content, "\?", "•")
    $content = [regex]::Replace($content, "Y'Z STEAL", "💎 STEAL")
    $content = [regex]::Replace($content, "Y"^ UNDERVALUED", "📈 UNDERVALUED")
    
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
}
