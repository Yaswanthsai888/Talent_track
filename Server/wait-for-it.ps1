param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceUrl,
    [int]$Timeout = 60
)

$startTime = Get-Date
$timeoutDateTime = $startTime.AddSeconds($Timeout)

Write-Host "Waiting for $ServiceUrl to be ready..."

while ($true) {
    try {
        $response = Invoke-WebRequest -Uri $ServiceUrl -Method HEAD -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "Service is ready!"
            exit 0
        }
    }
    catch {
        if ((Get-Date) -gt $timeoutDateTime) {
            Write-Host "Timeout after $Timeout seconds"
            exit 1
        }
        Write-Host "Service not ready yet... waiting"
        Start-Sleep -Seconds 5
    }
}
