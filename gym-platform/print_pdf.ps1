$htmlPath = "C:\Users\DELL\Desktop\TECHEMPRESA\gym-platform\vision_report.html"
$pdfPath = "C:\Users\DELL\Desktop\TECHEMPRESA\Visiones_Agentes_CTO_CPO.pdf"
$exePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $exePath)) { $exePath = "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe" }
if (-not (Test-Path $exePath)) { $exePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe" }
if (Test-Path $exePath) {
    & $exePath --headless --disable-gpu "--print-to-pdf=$pdfPath" "$htmlPath"
} else {
    Write-Host "No se ha encontrado un motor compatible (Edge/Chrome) para renderizar el PDF localmente."
}
