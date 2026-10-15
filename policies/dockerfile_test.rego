package dockerfile

import rego.v1

test_valid_dockerfile if {
    input_data := {
        "base_image": "node:20-alpine",
        "is_latest_tag": false,
        "has_workdir": true,
        "workdir": "/app",
        "has_secrets_in_env": [],
        "uses_clean_install": true
    }
    allow with input as input_data
    count(deny) == 0 with input as input_data
}

test_latest_tag_rejected if {
    input_data := {
        "base_image": "node:latest",
        "is_latest_tag": true,
        "has_workdir": true,
        "workdir": "/app",
        "has_secrets_in_env": [],
        "uses_clean_install": true
    }
    not allow with input as input_data
    count(deny) == 1 with input as input_data
}

test_secret_in_env_rejected if {
    input_data := {
        "base_image": "node:20-alpine",
        "is_latest_tag": false,
        "has_workdir": true,
        "workdir": "/app",
        "has_secrets_in_env": ["API_KEY"],
        "uses_clean_install": true
    }
    not allow with input as input_data
    count(deny) == 1 with input as input_data
}
