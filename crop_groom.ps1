Add-Type -AssemblyName System.Drawing

$srcGroom = [System.Drawing.Bitmap]::FromFile('C:/Users/Admin/.gemini/antigravity-ide/brain/9586da4f-d153-4dd3-938b-63ffb5d0d65c/.user_uploaded/media_1790694167909.jpg')

# Crop tighter inside the white card
# Left of QR: ~230, Right: ~720, Top: ~130, Bottom of logos: ~710
$rectGroom = New-Object System.Drawing.Rectangle(200, 95, 545, 630)
$bmpGroom = $srcGroom.Clone($rectGroom, $srcGroom.PixelFormat)

# Any pixel in bmpGroom that is purple/non-white near borders, set to white
for ($y = 0; $y -lt $bmpGroom.Height; $y++) {
    for ($x = 0; $x -lt $bmpGroom.Width; $x++) {
        $c = $bmpGroom.GetPixel($x, $y)
        # If it's purple (R > 80 and B > 80 and G < 70)
        if ($c.R -gt 70 -and $c.B -gt 70 -and $c.G -lt 65) {
            $bmpGroom.SetPixel($x, $y, [System.Drawing.Color]::White)
        }
    }
}

$targetGroom = New-Object System.Drawing.Bitmap(600, 600)
$gGroom = [System.Drawing.Graphics]::FromImage($targetGroom)
$gGroom.Clear([System.Drawing.Color]::White)
$gGroom.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gGroom.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gGroom.DrawImage($bmpGroom, 40, 20, 520, 560)
$gGroom.Dispose()
$bmpGroom.Dispose()
$srcGroom.Dispose()

$targetGroom.Save('d:/Other/duy-lan-wedding-invitation/public/images/qr/qr-groom-clean.png', [System.Drawing.Imaging.ImageFormat]::Png)
$targetGroom.Dispose()
Write-Host "Groom pure white cleaned!"
