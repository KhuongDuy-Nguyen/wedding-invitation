Add-Type -AssemblyName System.Drawing
$g = [System.Drawing.Image]::FromFile((Resolve-Path "public/images/qr/qr-groom.jpg"))
$b = [System.Drawing.Image]::FromFile((Resolve-Path "public/images/qr/qr-bride.jpg"))
Write-Host "Groom: $($g.Width) x $($g.Height)"
Write-Host "Bride: $($b.Width) x $($b.Height)"
$g.Dispose()
$b.Dispose()
