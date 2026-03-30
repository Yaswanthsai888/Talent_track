# Base URL
$BASE_URL = "http://localhost:5000/api/users"

# Function to test registration
function Test-Registration {
    Write-Host "Testing User Registration..."
    
    # Register Regular User
    Write-Host "Registering Regular User..."
    $RegularUserResponse = Invoke-RestMethod -Uri "$BASE_URL/register" -Method Post -ContentType "application/json" -Body @{
        name = "John Doe"
        email = "john.doe@example.com"
        password = "StrongPassword123!"
        role = "user"
    } | ConvertTo-Json

    # Register Admin User
    Write-Host "Registering Admin User..."
    $AdminUserResponse = Invoke-RestMethod -Uri "$BASE_URL/register" -Method Post -ContentType "application/json" -Body @{
        name = "Admin User"
        email = "admin@example.com"
        password = "AdminPassword123!"
        role = "admin"
    } | ConvertTo-Json

    Write-Host "Registration Responses:"
    Write-Host $RegularUserResponse
    Write-Host $AdminUserResponse
}

# Function to test login
function Test-Login {
    Write-Host "Testing User Login..."
    
    # Login Regular User
    Write-Host "Logging in Regular User..."
    $RegularUserLogin = Invoke-RestMethod -Uri "$BASE_URL/login" -Method Post -ContentType "application/json" -Body @{
        email = "john.doe@example.com"
        password = "StrongPassword123!"
    } | ConvertTo-Json

    # Login Admin User
    Write-Host "Logging in Admin User..."
    $AdminUserLogin = Invoke-RestMethod -Uri "$BASE_URL/login" -Method Post -ContentType "application/json" -Body @{
        email = "admin@example.com"
        password = "AdminPassword123!"
    } | ConvertTo-Json

    Write-Host "Login Responses:"
    Write-Host $RegularUserLogin
    Write-Host $AdminUserLogin
}

# Main test function
function Invoke-AuthTests {
    Test-Registration
    Test-Login
}

Invoke-AuthTests
