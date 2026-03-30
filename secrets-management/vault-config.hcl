storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

ui = true

# Enable key-value secrets engine
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Enable database secrets engine
path "database/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Enable transit secrets engine for encryption
path "transit/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Policy for application services
path "secret/data/talent-track/*" {
  capabilities = ["read"]
}

# Root token rotation policy
max_lease_ttl = "768h"
default_lease_ttl = "768h"

# Audit logging
audit "file" {
  path = "/vault/audit/audit.log"
  log_raw = true
  mode = "file"
}
