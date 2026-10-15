package dockerfile

import rego.v1

default allow := false

# POLICY-DOCKER-001: Base image must be official node image
deny contains msg if {
    not startswith(input.base_image, "node:")
    msg := sprintf("POLICY-DOCKER-001: Base image '%v' is not permitted. Only official 'node' base images are allowed.", [input.base_image])
}

# POLICY-DOCKER-002: Base image version tag must be pinned
deny contains msg if {
    input.is_latest_tag
    msg := "POLICY-DOCKER-002: Dockerfile base image must pin a specific version tag (e.g., node:20-alpine). Using ':latest' is prohibited."
}

# POLICY-DOCKER-003: WORKDIR must be explicitly defined
deny contains msg if {
    not input.has_workdir
    msg := "POLICY-DOCKER-003: Dockerfile must define an explicit WORKDIR (e.g., WORKDIR /app)."
}

# POLICY-DOCKER-004: Secrets must not be defined in ENV or ARG instructions
deny contains msg if {
    count(input.has_secrets_in_env) > 0
    some secret in input.has_secrets_in_env
    msg := sprintf("POLICY-DOCKER-004: Sensitive variable '%v' found in Dockerfile ENV/ARG instruction. Sensitive data must not be baked into container images.", [secret])
}

# POLICY-DOCKER-005: Production Dockerfile should use clean install
deny contains msg if {
    not input.uses_clean_install
    msg := "POLICY-DOCKER-005: Dockerfile should use 'npm ci' to guarantee deterministic dependency resolution."
}

allow if {
    count(deny) == 0
}
