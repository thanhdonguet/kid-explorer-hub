$vocab = @{
  'k' = '1f998'; 'l' = '1f981'; 'm' = '1f435'; 'n' = '1fab9'; 'o' = '1f989';
  'p' = '1f437'; 'q' = '1f478'; 'r' = '1f430'; 's' = '1f40d'; 't' = '1f42f';
  'u' = '2602'; 'v' = '1f3bb'; 'w' = '1f433'; 'x' = '1fa7b'; 'y' = '1f402'; 'z' = '1f993'
}

$themes = @{
  'balloon' = '1f388'; 'rocket' = '1f680'; 'cloud' = '2601'; 'cat' = '1f431';
  'star' = '2b50'; 'bubble' = '1fae7'; 'frog' = '1f438'; 'bird' = '1f426';
  'leaf' = '1f343'; 'fish' = '1f41f'; 'ghost' = '1f47b'; 'car' = '1f697';
  'flower' = '1f338'; 'ufo' = '1f6f8'
}

New-Item -ItemType Directory -Force "www\img\vocab"
New-Item -ItemType Directory -Force "www\img\themes"

foreach ($key in $vocab.Keys) {
  $hex = $vocab[$key]
  $url = "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/$hex.svg"
  $dest = "www\img\vocab\$key.svg"
  try {
      Invoke-WebRequest -Uri $url -OutFile $dest
      Write-Host "Downloaded $dest"
  } catch {
      Write-Host "Failed to download $url"
  }
}

foreach ($key in $themes.Keys) {
  $hex = $themes[$key]
  $url = "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/$hex.svg"
  $dest = "www\img\themes\$key.svg"
  try {
      Invoke-WebRequest -Uri $url -OutFile $dest
      Write-Host "Downloaded $dest"
  } catch {
      Write-Host "Failed to download $url"
  }
}
