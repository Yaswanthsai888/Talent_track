#!/bin/bash

# Vault Initialization and Configuration Script

set -e

# Initialize Vault
vault operator init -key-shares=5 -key-threshold=3 > /vault/init-secrets.txt

# Extract root token and unseal keys
ROOT_TOKEN=$(grep "Initial Root Token" /vault/init-secrets.txt | cut -d: -f2 | tr -d ' ')
UNSEAL_KEY_1=$(sed -n '1p' /vault/init-secrets.txt | cut -d: -f2 | tr -d ' ')
UNSEAL_KEY_2=$(sed -n '2p' /vault/init-secrets.txt | cut -d: -f2 | tr -d ' ')
UNSEAL_KEY_3=$(sed -n '3p' /vault/init-secrets.txt | cut -d: -f2 | tr -d ' ')

# Unseal Vault
vault operator unseal $UNSEAL_KEY_1
vault operator unseal $UNSEAL_KEY_2
vault operator unseal $UNSEAL_KEY_3

# Login with root token
vault login $ROOT_TOKEN

# Enable secrets engines
vault secrets enable -path=secret kv-v2
vault secrets enable database
vault secrets enable transit

# Configure database secrets engine for MongoDB
vault write database/config/mongodb \
    plugin_name=mongodb-database-plugin \
    connection_url="mongodb://{{username}}:{{password}}@mongo:27017/admin" \
    allowed_roles="talent-track-role" \
    username="root" \
    password="rootpassword"

# Create a role for dynamic credentials
vault write database/roles/talent-track-role \
    db_name=mongodb \
    creation_statements='[{"db": "admin", "roles": [{"role": "readWrite", "db": "talent_track"}]}]' \
    default_ttl="1h" \
    max_ttl="24h"

# Store initial application secrets
vault kv put secret/talent-track/jwt \
    jwt_secret=$(openssl rand -base64 32) \
    jwt_expiration="7d"

vault kv put secret/talent-track/smtp \
    host="smtp.gmail.com" \
    port=587 \
    username="your-email@gmail.com" \
    password="your-app-specific-password"

# Enable audit logging
vault audit enable file file_path=/vault/audit/audit.log

echo "Vault initialization complete. Please securely store the initialization secrets."
