$lines = @{
  "intro" = "I'm so hungry! I'm going to find some food!"
  "banana" = "Eating the banana turned me yellow!"
  "peach" = "Eating the peach turned me pink!"
  "tomato" = "Eating the tomato turned me red!"
  "cucumber" = "Eating the cucumber turned me green!"
  "grapes" = "Eating the grapes turned me purple!"
  "orange" = "Eating the orange turned me orange!"
  "full" = "I ate everything! I'm so full! Burp!"
}

$dir = ".\www\audio\dino"
if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

foreach ($key in $lines.Keys) {
    $text = [uri]::EscapeDataString($lines[$key])
    $url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-US&q=$text"
    $file = Join-Path $dir "$key.mp3"
    Write-Host "Downloading $key.mp3..."
    Invoke-WebRequest -Uri $url -OutFile $file -UserAgent "Mozilla/5.0"
}
