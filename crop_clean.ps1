Add-Type -AssemblyName System.Drawing

# 1. Bride: crop from media_1790694112184.jpg
# The QR area in bride:
# VietQR is at y ~ 230
# QR code is at x ~ 116 to 488, y ~ 290 to 660
# Napas + Agribank is at y ~ 670 to 715
# Total width of image is 604, height is 1024
# If we crop a square from x=50, y=215, w=504, h=504:
$srcBride = [System.Drawing.Bitmap]::FromFile('C:/Users/Admin/.gemini/antigravity-ide/brain/9586da4f-d153-4dd3-938b-63ffb5d0d65c/.user_uploaded/media_1790694112184.jpg')
$rectBride = New-Object System.Drawing.Rectangle(50, 215, 504, 510)
$bmpBride = $srcBride.Clone($rectBride, $srcBride.PixelFormat)

# Resize/pad to 600x600 pure white background
$targetBride = New-Object System.Drawing.Bitmap(600, 600)
$gBride = [System.Drawing.Graphics]::FromImage($targetBride)
$gBride.Clear([System.Drawing.Color]::White)
$gBride.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gBride.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
# Draw centered with 20px padding
$gBride.DrawImage($bmpBride, 20, 20, 560, 560)
$gBride.Dispose()
$bmpBride.Dispose()
$srcBride.Dispose()
$targetBride.Save('d:/Other/duy-lan-wedding-invitation/public/images/qr/qr-bride-clean.png', [System.Drawing.Imaging.ImageFormat]::Png)
$targetBride.Dispose()
Write-Host "Bride clean saved!"

# 2. Groom: media_1790694167909.jpg
# Image size is 945 x 1024
# The white card starts around x=175, y=25 to x=770, y=755
# Let's inspect exact bounds of the white card in groom
$srcGroom = [System.Drawing.Bitmap]::FromFile('C:/Users/Admin/.gemini/antigravity-ide/brain/9586da4f-d153-4dd3-938b-63ffb5d0d65c/.user_uploaded/media_1790694167909.jpg')
# White card in Groom:
# Let's crop from x=170, y=20, w=605, h=740
$rectGroom = New-Object System.Drawing.Rectangle(175, 22, 595, 735)
$bmpGroom = $srcGroom.Clone($rectGroom, $srcGroom.PixelFormat)

# Make 600x600 clean white
$targetGroom = New-Object System.Drawing.Bitmap(600, 600)
$gGroom = [System.Drawing.Graphics]::FromImage($targetGroom)
$gGroom.Clear([System.Drawing.Color]::White)
$gGroom.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gGroom.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
# Scale to fit inside 600x600
$gGroom.DrawImage($bmpGroom, 20, 10, 560, 580)
$gGroom.Dispose()
$bmpGroom.Dispose()
$srcGroom.Dispose()
$targetGroom.Save('d:/Other/duy-lan-wedding-invitation/public/images/qr/qr-groom-clean.png', [System.Drawing.Imaging.ImageFormat]::Png)
$targetGroom.Dispose()
Write-Host "Groom clean saved!"
