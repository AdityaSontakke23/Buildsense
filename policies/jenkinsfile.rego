package jenkinsfile

import rego.v1

default allow := false

# POLICY-JENKINS-001: Pipeline must define a push trigger (e.g., githubPush())
deny contains msg if {
    not input.has_triggers
    msg := "POLICY-JENKINS-001: Jenkinsfile must define a push trigger (e.g. triggers { githubPush() }) to enable automatic build execution on GitHub push events."
}

# POLICY-JENKINS-002: Pipeline must have Environment Validation stage
deny contains msg if {
    not input.has_environment_validation_stage
    msg := "POLICY-JENKINS-002: Jenkinsfile must define a 'Validate Environment' stage before build execution to fail fast on invalid environments."
}

# POLICY-JENKINS-003: Pipeline must have Policy as Code Validation stage
deny contains msg if {
    not input.has_policy_as_code_stage
    msg := "POLICY-JENKINS-003: Jenkinsfile must include a 'Policy as Code (PaC) Validation' stage to enforce compliance."
}

# POLICY-JENKINS-004: No hardcoded secrets allowed in Jenkinsfile
deny contains msg if {
    count(input.hardcoded_secrets) > 0
    some secret in input.hardcoded_secrets
    msg := sprintf("POLICY-JENKINS-004: Hardcoded secret detected in Jenkinsfile: '%v'. Secrets must be managed via Jenkins credentials().", [secret])
}

# POLICY-JENKINS-005: Pipeline must use Jenkins credentials for DockerHub authentication
deny contains msg if {
    not input.uses_credentials
    msg := "POLICY-JENKINS-005: Pipeline must use credentials('dockerhub-creds') binding for sensitive Docker registry authentication."
}

# POLICY-JENKINS-006: Image name must match the authorized repository namespace
deny contains msg if {
    input.image_name != ""
    not startswith(input.image_name, "adityasontakke23/")
    msg := sprintf("POLICY-JENKINS-006: Unauthorized Docker image repository '%v'. Image repository must start with 'adityasontakke23/'.", [input.image_name])
}

# POLICY-JENKINS-007: Pipeline must safely archive build reports and artifacts
deny contains msg if {
    not input.has_archive_artifacts
    msg := "POLICY-JENKINS-007: Jenkinsfile must include post { always { archiveArtifacts ... } } to preserve build and policy reports."
}

allow if {
    count(deny) == 0
}
