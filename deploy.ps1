# Set PowerShell to use TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        $docker = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
        if ($null -eq $docker) {
            Write-Host "Docker Desktop is not running. Please start Docker Desktop first."
            exit 1
        }
    }
    catch {
        Write-Host "Error checking Docker status: $_"
        exit 1
    }
}

# Check Docker status
Test-DockerRunning

# Stop and remove existing containers
Write-Host "Stopping existing containers..."
docker-compose down

# Remove unused resources
Write-Host "Cleaning up unused resources..."
docker system prune -f
docker volume prune -f

# Build and start services
Write-Host "Building and starting services..."
docker-compose --env-file .env.production up -d --build

# Watch logs
Write-Host "Deployment complete! Showing logs..."
docker-compose logs -f
