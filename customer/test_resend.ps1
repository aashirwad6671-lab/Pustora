# Read RESEND_API_KEY from .env.local if not set in environment
$envFile = Join-Path $PSScriptRoot ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*RESEND_API_KEY\s*=\s*(.+)') {
            $env:RESEND_API_KEY = $Matches[1].Trim()
        }
    }
}

$apiKey = $env:RESEND_API_KEY
if (-not $apiKey -or $apiKey -eq "re_placeholder_resend_api_key") {
    Write-Host "ERROR: RESEND_API_KEY not found. Add it to .env.local or set it as an env variable."
    exit 1
}

Write-Host "Using Resend API Key: $($apiKey.Substring(0,8))..."

$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type'  = 'application/json'
}

$body = '{"from":"onboarding@resend.dev","to":["aashirwad6671@gmail.com"],"subject":"Pustora OTP Test","html":"<p>Your Pustora test OTP: <strong>123456</strong></p><p>This is a test email from the local dev script.</p>"}'

try {
    $result = Invoke-RestMethod -Uri 'https://api.resend.com/emails' -Method POST -Headers $headers -Body $body
    Write-Host "SUCCESS: Email sent! ID: $($result.id)"
} catch {
    Write-Host "ERROR: $_"
    try {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        Write-Host "Response: $($reader.ReadToEnd())"
    } catch {}
}
