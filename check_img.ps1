Add-Type -AssemblyName System.Drawing

$srcGroom = [System.Drawing.Bitmap]::FromFile('C:/Users/Admin/.gemini/antigravity-ide/brain/9586da4f-d153-4dd3-938b-63ffb5d0d65c/.user_uploaded/media_1790694167909.jpg')
# Groom QR code is dark green pixels (G > 20, R < 60, B < 60)
$gMinX = 9999; $gMaxX = 0; $gMinY = 9999; $gMaxY = 0
for ($y = 0; $y -lt 750; $y += 3) {
    for ($x = 0; $x -lt $srcGroom.Width; $x += 3) {
        $c = $srcGroom.GetPixel($x, $y)
        if ($c.G -gt 20 -and $c.G -lt 80 -and $c.R -lt 50 -and $c.B -lt 60) {
            if ($x -lt $gMinX) { $gMinX = $x }
            if ($x -gt $gMaxX) { $gMaxX = $x }
            if ($y -lt $gMinY) { $gMinY = $y }
            if ($y -gt $gMaxY) { $gMaxY = $y }
        }
    }
}
Write-Host "Groom QR matrix bounds: X = $gMinX to $gMaxX, Y = $gMinY to $gMaxY, W = $($gMaxX - $gMinX), H = $($gMaxY - $gMinY)"
$srcGroom.Dispose()
