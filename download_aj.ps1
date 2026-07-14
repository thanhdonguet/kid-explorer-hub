$vocab = @{
  'a' = '1f34e'; 'b' = '1f43b'; 'c' = '1f431'; 'd' = '1f436'; 'e' = '1f418';
  'f' = '1f98a'; 'g' = '1f992'; 'h' = '1f434'; 'i' = '1f366'; 'j' = '1f9c3'
}

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
