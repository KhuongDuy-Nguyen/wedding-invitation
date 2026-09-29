$base64 = Get-Content 'C:/Users/Admin/.gemini/antigravity-ide/brain/4fd6f31f-1e8f-45dd-9df0-fbb152d73a19/scratch/momo_base64.txt' -Raw
$bytes = [System.Convert]::FromBase64String($base64.Trim())
[System.IO.File]::WriteAllBytes("$PSScriptRoot/public/images/logo/momo.png", $bytes)
Write-Host "Written to public/images/logo/momo.png, size: $($bytes.Length)"
