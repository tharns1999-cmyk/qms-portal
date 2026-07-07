$files = @("src\store\useStore.js", "src\pages\Tasks\TaskInbox.jsx")
foreach ($f in $files) {
    $content = Get-Content $f -Raw
    $content = $content -replace '(?s)<<<<<<< HEAD.*?=======\r?\n(.*?)\r?\n>>>>>>> [^\r\n]+', '$1'
    Set-Content $f -Value $content -NoNewline
}
Write-Output "Done"
