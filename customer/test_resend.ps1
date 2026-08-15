$apiKey = if ($env:RESEND_API_KEY) { $env:RESEND_API_KEY } else { "re_placeholder_resend_api_key" }
$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
}
$body = '{"from":"onboarding@resend.dev","to":["aashirwad6671@gmail.com"],"subject":"Pustora OTP Test","html":"<p>Test OTP: <strong>123456</strong></p>"}'
try {
    $result = Invoke-RestMethod -Uri 'https://api.resend.com/emails' -Method POST -Headers $headers -Body $body
    Write-Host "SUCCESS: Email sent! ID: $($result.id)"
} catch {
    Write-Host "ERROR: $_"
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "Response: $($reader.ReadToEnd())"
}
