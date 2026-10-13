$base = 'c:\Users\chinm\OneDrive\Desktop\cs\frontend'
$files = Get-ChildItem $base -Recurse -Include '*.tsx','*.ts' | Where-Object { $_.FullName -notlike '*landing*' -and $_.FullName -notlike '*node_modules*' }

foreach ($file in $files) {
  $p = $file.FullName
  $c = Get-Content $p -Raw -Encoding UTF8

  # Replace inline bg-[var(--fg)] + text-[var(--bg)] patterns in className strings
  # with btn-primary class (keeping other classes around them)
  $c = $c -replace 'bg-\[var\(--fg\)\]\s+text-\[var\(--bg\)\]\s+hover:opacity-80', 'btn-primary'
  $c = $c -replace 'bg-\[var\(--fg\)\]\s+hover:opacity-80\s+text-\[var\(--bg\)\]', 'btn-primary'
  $c = $c -replace 'text-\[var\(--bg\)\]\s+bg-\[var\(--fg\)\]\s+hover:opacity-80', 'btn-primary'
  $c = $c -replace 'text-\[var\(--bg\)\]\s+hover:opacity-80\s+bg-\[var\(--fg\)\]', 'btn-primary'

  # Also fix any leftover text-[var(--bg)] -> text-[var(--btn-text)]
  $c = $c -replace 'text-\[var\(--bg\)\]', 'text-[var(--btn-text)]'

  Set-Content $p $c -Encoding UTF8
}
Write-Host "Done replacing btn-primary across all tsx/ts files."
