package jenkinsfile

test_valid_jenkinsfile {
    input := {
        "has_triggers": true,
        "has_environment_validation_stage": true,
        "has_policy_as_code_stage": true,
        "hardcoded_secrets": [],
        "uses_credentials": true,
        "image_name": "adityasontakke23/buildsense",
        "has_archive_artifacts": true
    }
    allow with input as input
    count(deny) == 0 with input as input
}

test_missing_trigger {
    input := {
        "has_triggers": false,
        "has_environment_validation_stage": true,
        "has_policy_as_code_stage": true,
        "hardcoded_secrets": [],
        "uses_credentials": true,
        "image_name": "adityasontakke23/buildsense",
        "has_archive_artifacts": true
    }
    not allow with input as input
    count(deny) == 1 with input as input
}

test_hardcoded_secret {
    input := {
        "has_triggers": true,
        "has_environment_validation_stage": true,
        "has_policy_as_code_stage": true,
        "hardcoded_secrets": ["password123"],
        "uses_credentials": true,
        "image_name": "adityasontakke23/buildsense",
        "has_archive_artifacts": true
    }
    not allow with input as input
    count(deny) == 1 with input as input
}
