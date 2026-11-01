# 그림판 불러오기: 클립보드 그림(또는 흰 종이)을 원본으로 저장하고, 패널 크기로 줄인 픽셀을 JSON 으로 내보낸다.
param([string]$Source, [string]$Dir, [int]$MaxW, [int]$MaxH)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8 # 한글 오류 문구가 패널에서 깨지지 않게
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $Dir | Out-Null

$src = $null
if ($Source -eq 'clip') {
  $src = Get-Clipboard -Format Image
  if (-not $src) { '{"error":"클립보드에 그림이 없어요. Win+Shift+S 로 캡처한 뒤 다시 눌러 주세요."}'; exit }
} else {
  $src = New-Object Drawing.Bitmap 1280, 800
  $g = [Drawing.Graphics]::FromImage($src); $g.Clear([Drawing.Color]::White); $g.Dispose()
}

$base = Join-Path $Dir ('base-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.png')
$src.Save($base, [Drawing.Imaging.ImageFormat]::Png)

# 칸 하나가 픽셀 2개(위아래)라 픽셀이 거의 정사각형: 가로세로 비율을 그대로 둔다
$r = [math]::Min($MaxW / $src.Width, $MaxH / $src.Height)
$w = [math]::Max(8, [int][math]::Floor($src.Width * $r))
$h = [math]::Max(8, [int][math]::Floor($src.Height * $r))
$small = New-Object Drawing.Bitmap $src, $w, $h
# 색을 채널마다 16단계로: 옆 칸과 같은 색이 많아져 패널에서 한 덩어리로 묶인다
$rows = for ($y = 0; $y -lt $h; $y++) {
  $sb = New-Object Text.StringBuilder
  for ($x = 0; $x -lt $w; $x++) { $c = $small.GetPixel($x, $y); [void]$sb.Append(('{0:x}{0:x}{1:x}{1:x}{2:x}{2:x}' -f ($c.R -shr 4), ($c.G -shr 4), ($c.B -shr 4))) }
  $sb.ToString()
}
$small.Dispose(); $src.Dispose()
@{ base = $base; w = $w; h = $h; px = @($rows) } | ConvertTo-Json -Compress
