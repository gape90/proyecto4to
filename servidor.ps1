# POTENCIAR - servidor local (usa PowerShell, que ya viene con Windows)
$raiz = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$tipos = @{
  '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8';
  '.json'='application/json; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg';
  '.jpeg'='image/jpeg'; '.gif'='image/gif'; '.webp'='image/webp'; '.ico'='image/x-icon';
  '.txt'='text/plain; charset=utf-8'; '.md'='text/plain; charset=utf-8'; '.mp3'='audio/mpeg'; '.woff2'='font/woff2'
}
$listener = $null
foreach ($p in 8421..8440) {
  $l = New-Object System.Net.HttpListener
  $l.Prefixes.Add("http://localhost:$p/")
  try { $l.Start(); $listener = $l; $puerto = $p; break } catch { $l.Close() }
}
if (-not $listener) { Write-Host 'No se encontro un puerto libre (8421-8440).'; exit 1 }
$url = "http://localhost:$puerto/index.html"
Write-Host ''
Write-Host "  POTENCIAR funcionando en $url"
Write-Host '  No cierres esta ventana mientras uses la plataforma.'
Write-Host ''
try { Start-Process $url } catch { Write-Host '  Abri esa direccion en el navegador.' }
while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  $res = $ctx.Response
  try {
    $ruta = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($ruta -eq '/' -or $ruta -eq '') { $ruta = '/index.html' }
    $rel = $ruta.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
    $archivo = [IO.Path]::GetFullPath([IO.Path]::Combine($raiz, $rel))
    if ($archivo.StartsWith($raiz, [StringComparison]::OrdinalIgnoreCase) -and [IO.File]::Exists($archivo)) {
      $bytes = [IO.File]::ReadAllBytes($archivo)
      $ext = [IO.Path]::GetExtension($archivo).ToLower()
      if ($tipos.ContainsKey($ext)) { $res.ContentType = $tipos[$ext] } else { $res.ContentType = 'application/octet-stream' }
      $res.Headers.Add('Cache-Control', 'no-store')
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      Write-Host "  No encontrado: $ruta"
    }
  } catch { $res.StatusCode = 500 } finally { $res.Close() }
}
