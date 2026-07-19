Add-Type -AssemblyName System.Speech

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

$dir = "C:\Users\Dell\.gemini\antigravity\scratch\kid-explorer-hub\www\audio\dino"
if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Gender -eq 'Male' -and $_.VoiceInfo.Culture -like 'en-*' }
if ($voices) {
    $synth.SelectVoice($voices[0].VoiceInfo.Name)
}

foreach ($key in $lines.Keys) {
    $file = Join-Path $dir "$key.wav"
    $synth.SetOutputToWaveFile($file)
    $text = $lines[$key]
    
    # Generate with normal rate but high pitch
    $ssml = "<speak version=`"1.0`" xmlns=`"http://www.w3.org/2001/10/synthesis`" xml:lang=`"en-US`">
        <prosody pitch=`"x-high`">$text</prosody>
    </speak>"
    
    $synth.SpeakSsml($ssml)
}
$synth.SetOutputToDefaultAudioDevice()
$synth.Dispose()
Write-Host "Audio regenerated with normal speed."
