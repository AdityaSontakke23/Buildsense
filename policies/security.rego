package security

import rego.v1

default allow := false

# POLICY-SEC-001: No private keys or secret certificate files in repository
deny contains msg if {
    count(input.forbidden_files_found) > 0
    some f in input.forbidden_files_found
    msg := sprintf("POLICY-SEC-001: Sensitive key or credential file detected in workspace: '%v'. Remove immediately.", [f])
}

# POLICY-SEC-002: Security scanner must be clean of high/critical vulnerabilities
deny contains msg if {
    input.critical_vulnerabilities > 0
    msg := sprintf("POLICY-SEC-002: Security policy violation: %v critical vulnerabilities detected.", [input.critical_vulnerabilities])
}

allow if {
    count(deny) == 0
}
