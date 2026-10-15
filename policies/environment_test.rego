package environment

test_valid_environment {
    input := {
        "env_file_committed": false,
        "dockerignore_exists": true,
        "dockerignore_ignores_env": true,
        "dockerignore_ignores_git": true,
        "dockerignore_ignores_node_modules": true,
        "gitignore_ignores_env": true
    }
    allow with input as input
    count(deny) == 0 with input as input
}

test_committed_env_rejected {
    input := {
        "env_file_committed": true,
        "dockerignore_exists": true,
        "dockerignore_ignores_env": true,
        "dockerignore_ignores_git": true,
        "dockerignore_ignores_node_modules": true,
        "gitignore_ignores_env": true
    }
    not allow with input as input
    count(deny) == 1 with input as input
}

test_missing_dockerignore_rejected {
    input := {
        "env_file_committed": false,
        "dockerignore_exists": false,
        "dockerignore_ignores_env": false,
        "dockerignore_ignores_git": false,
        "dockerignore_ignores_node_modules": false,
        "gitignore_ignores_env": true
    }
    not allow with input as input
    count(deny) > 0 with input as input
}
