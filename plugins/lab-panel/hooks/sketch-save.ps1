# Sketch send: draw the strokes from the panel in magenta (#FF00FF) over the full-size original and save a new file.
# Magenta is the agreed color Claude reads as "marks the user drew".
param([string]$Base, [string]$StrokesFile, [int]$W, [int]$H, [string]$Out)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8 # keep non-ASCII output intact in the panel
Add-Type -AssemblyName System.Drawing

$img = [Drawing.Image]::FromFile($Base)
$bmp = New-Object Drawing.Bitmap $img
$img.Dispose() # release the lock on the original file
$g = [Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$sx = $bmp.Width / $W; $sy = $bmp.Height / $H
$width = [math]::Max(3, [math]::Min($sx, $sy) * 0.9)
$color = [Drawing.Color]::FromArgb(255, 255, 0, 255)
$pen = New-Object Drawing.Pen $color, $width
$pen.StartCap = 'Round'; $pen.EndCap = 'Round'; $pen.LineJoin = 'Round'
$brush = New-Object Drawing.SolidBrush $color

$strokes = Get-Content -Raw -Encoding UTF8 $StrokesFile | ConvertFrom-Json
foreach ($s in $strokes) {
  $pts = [Drawing.PointF[]]@($s | ForEach-Object { New-Object Drawing.PointF ((([float]$_[0]) + 0.5) * $sx), ((([float]$_[1]) + 0.5) * $sy) })
  if ($pts.Count -eq 1) { $g.FillEllipse($brush, $pts[0].X - $width / 2, $pts[0].Y - $width / 2, $width, $width) }
  elseif ($pts.Count -gt 1) { $g.DrawLines($pen, $pts) }
}
$g.Dispose()
$bmp.Save($Out, [Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
'{"ok":true}'
