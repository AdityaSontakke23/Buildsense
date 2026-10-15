package security

default allow = false

# POLICY-SEC-001: No private keys or secret certificate files in repository
deny[msg] {
    count(input.forbidden_files_found) > 0
    f := input.forbidden_files_found[_]
    msg := sprintf("POLICY-SEC-001: Sensitive key or credential file detected in workspace: '%v'. Remove immediately.", [f])
}

# POLICY-SEC-002: Security scanner must be clean of high/critical vulnerabilities
deny[msg] {
    input.critical_vulnerabilities > 0
    msg := sprintf("POLICY-SEC-002: Security policy violation: %v critical vulnerabilities detected.", [input.critical_vulnerabilities])
}

allow {
    count(deny) == 0
}
