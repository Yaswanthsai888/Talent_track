#!/bin/bash

# Base URL
BASE_URL="http://localhost:5000/api/users"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to test registration
test_registration() {
    echo "Testing User Registration..."
    
    # Register Regular User
    echo "Registering Regular User..."
    REGULAR_USER_RESPONSE=$(curl -s -X POST $BASE_URL/register \
        -H "Content-Type: application/json" \
        -d '{
            "name": "John Doe",
            "email": "john.doe@example.com",
            "password": "StrongPassword123!",
            "role": "user"
        }')
    
    # Register Admin User
    echo "Registering Admin User..."
    ADMIN_USER_RESPONSE=$(curl -s -X POST $BASE_URL/register \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Admin User",
            "email": "admin@example.com",
            "password": "AdminPassword123!",
            "role": "admin"
        }')
    
    echo "Registration Responses:"
    echo "$REGULAR_USER_RESPONSE"
    echo "$ADMIN_USER_RESPONSE"
}

# Function to test login
test_login() {
    echo "Testing User Login..."
    
    # Login Regular User
    echo "Logging in Regular User..."
    REGULAR_USER_LOGIN=$(curl -s -X POST $BASE_URL/login \
        -H "Content-Type: application/json" \
        -d '{
            "email": "john.doe@example.com",
            "password": "StrongPassword123!"
        }')
    
    # Login Admin User
    echo "Logging in Admin User..."
    ADMIN_USER_LOGIN=$(curl -s -X POST $BASE_URL/login \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@example.com",
            "password": "AdminPassword123!"
        }')
    
    echo "Login Responses:"
    echo "$REGULAR_USER_LOGIN"
    echo "$ADMIN_USER_LOGIN"
}

# Main test function
main() {
    test_registration
    test_login
}

main
