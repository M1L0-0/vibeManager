$files = @(
    "app\src\pams\stem\index.ts",
    "app\src\pams\timer\index.ts",
    "app\src\pams\wave\index.ts"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $content = $content -replace 'seenWaves', 'seenSignals'
    Set-Content $file $content -NoNewline
    Write-Host "Updated $file"
}
