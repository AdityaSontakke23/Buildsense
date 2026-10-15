package jenkinsfile

import rego.v1

test_valid_jenkinsfile if {
    input_data := {
        "has_triggers": true,
        "has_environment_validation_stage": true,
        "has_policy_as_code_stage": true,
        "hardcoded_secrets": [],
        "uses_credentials": true,
        "image_name": "adityasontakke23/buildsense",
        "has_archive_artifacts": true
    }
    allow with input as input_data
    count(deny) == 0 with input as input_data
}

test_missing_trigger if {
    input_data := {
        "has_triggers": false,
        "has_environment_validation_stage": true,
        "has_policy_as_code_stage": true,
        "hardcoded_secrets": [],
        "uses_credentials": true,
        "image_name": "adityasontakke23/buildsense",
        "has_archive_artifacts": true
    }
    not allow with input as input_data
    count(deny) == 1 with input as input_data
}

test_hardcoded_secret if {
    input_data := {
        "has_triggers": true,
        "has_environment_validation_stage": true,
        "has_policy_as_code_stage": true,
        "hardcoded_secrets": ["password123"],
        "uses_credentials": true,
        "image_name": "adityasontakke23/buildsense",
        "has_archive_artifacts": true
    }
    not allow with input as input_data
    count(deny) == 1 with input as input_data
}
