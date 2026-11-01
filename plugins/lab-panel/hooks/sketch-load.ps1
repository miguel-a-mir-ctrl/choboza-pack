# Sketch load: save the clipboard image (or white paper) as the original, and print a downscaled pixel grid for the panel as JSON.
param([string]$Source, [string]$Dir, [int]$MaxW, [int]$MaxH)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8 # keep non-ASCII output intact in the panel
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $Dir | Out-Null

$src = $null
if ($Source -eq 'clip') {
  $src = Get-Clipboard -Format Image
  if (-not $src) { '{"error":"noClipImage"}'; exit }
} else {
  $src = New-Object Drawing.Bitmap 1280, 800
  $g = [Drawing.Graphics]::FromImage($src); $g.Clear([Drawing.Color]::White); $g.Dispose()
}

$base = Join-Path $Dir ('base-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.png')
$src.Save($base, [Drawing.Imaging.ImageFormat]::Png)

# One cell holds two pixels (top/bottom), so pixels are nearly square: keep the aspect ratio
$r = [math]::Min($MaxW / $src.Width, $MaxH / $src.Height)
$w = [math]::Max(8, [int][math]::Floor($src.Width * $r))
$h = [math]::Max(8, [int][math]::Floor($src.Height * $r))
$small = New-Object Drawing.Bitmap $src, $w, $h
# 16 levels per channel: more neighbours share a color, so the panel merges them into runs
$rows = for ($y = 0; $y -lt $h; $y++) {
  $sb = New-Object Text.StringBuilder
  for ($x = 0; $x -lt $w; $x++) { $c = $small.GetPixel($x, $y); [void]$sb.Append(('{0:x}{0:x}{1:x}{1:x}{2:x}{2:x}' -f ($c.R -shr 4), ($c.G -shr 4), ($c.B -shr 4))) }
  $sb.ToString()
}
$small.Dispose(); $src.Dispose()
@{ base = $base; w = $w; h = $h; px = @($rows) } | ConvertTo-Json -Compress
