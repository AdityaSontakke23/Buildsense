package environment

default allow = false

# POLICY-ENV-001: Committed .env files are strictly prohibited
deny[msg] {
    input.env_file_committed
    msg := "POLICY-ENV-001: Committed .env file detected in repository. Secrets must never be committed to source control."
}

# POLICY-ENV-002: .dockerignore must exist
deny[msg] {
    not input.dockerignore_exists
    msg := "POLICY-ENV-002: .dockerignore file is missing. A .dockerignore file is required to prevent secret leaks."
}

# POLICY-ENV-003: .dockerignore must ignore .env files
deny[msg] {
    not input.dockerignore_ignores_env
    msg := "POLICY-ENV-003: .dockerignore must ignore '.env*' to prevent secrets from being copied into the container context."
}

# POLICY-ENV-004: .dockerignore must ignore .git
deny[msg] {
    not input.dockerignore_ignores_git
    msg := "POLICY-ENV-004: .dockerignore must ignore '.git' directory to reduce attack surface and build size."
}

# POLICY-ENV-005: .dockerignore must ignore node_modules
deny[msg] {
    not input.dockerignore_ignores_node_modules
    msg := "POLICY-ENV-005: .dockerignore must ignore 'node_modules' to ensure container builds clean dependencies."
}

# POLICY-ENV-006: .gitignore must ignore .env
deny[msg] {
    not input.gitignore_ignores_env
    msg := "POLICY-ENV-006: .gitignore must ignore '.env' to prevent developers from committing local environment secrets."
}

allow {
    count(deny) == 0
}
