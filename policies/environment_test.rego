package environment

import rego.v1

test_valid_environment if {
    input_data := {
        "env_file_committed": false,
        "dockerignore_exists": true,
        "dockerignore_ignores_env": true,
        "dockerignore_ignores_git": true,
        "dockerignore_ignores_node_modules": true,
        "gitignore_ignores_env": true
    }
    allow with input as input_data
    count(deny) == 0 with input as input_data
}

test_committed_env_rejected if {
    input_data := {
        "env_file_committed": true,
        "dockerignore_exists": true,
        "dockerignore_ignores_env": true,
        "dockerignore_ignores_git": true,
        "dockerignore_ignores_node_modules": true,
        "gitignore_ignores_env": true
    }
    not allow with input as input_data
    count(deny) == 1 with input as input_data
}

test_missing_dockerignore_rejected if {
    input_data := {
        "env_file_committed": false,
        "dockerignore_exists": false,
        "dockerignore_ignores_env": false,
        "dockerignore_ignores_git": false,
        "dockerignore_ignores_node_modules": false,
        "gitignore_ignores_env": true
    }
    not allow with input as input_data
    count(deny) > 0 with input as input_data
}
