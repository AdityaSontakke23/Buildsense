#!/usr/bin/env node

/**
 * BuildSense Policy as Code (PaC) Verification Engine
 * 
 * Enforces declarative compliance and security policies for:
 * - Jenkinsfile (pipeline architecture, triggers, stage order, credential usage)
 * - Dockerfile (base image standards, pinning, non-root, clean install)
 * - Environment (secrets handling, git/docker ignore configurations)
 * - Security (credential leakage, sensitive files)
 * 
 * Can run standalone in Node.js (0 external dependencies) or alongside OPA/Conftest.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT_DIR, 'reports');

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const results = [];

function check(ruleId, domain, description, validator) {
  try {
    const outcome = validator();
    if (outcome === true || outcome === undefined) {
      results.push({ ruleId, domain, description, status: 'PASSED', message: 'Policy check passed.' });
    } else if (typeof outcome === 'string') {
      results.push({ ruleId, domain, description, status: 'FAILED', message: outcome });
    } else if (outcome && outcome.failed) {
      results.push({ ruleId, domain, description, status: 'FAILED', message: outcome.message });
    } else {
      results.push({ ruleId, domain, description, status: 'PASSED', message: 'Policy check passed.' });
    }
  } catch (err) {
    results.push({ ruleId, domain, description, status: 'FAILED', message: `Execution error: ${err.message}` });
  }
}

// -------------------------------------------------------------
// Read configuration files
// -------------------------------------------------------------
const jenkinsfilePath = path.join(ROOT_DIR, 'Jenkinsfile');
const dockerfilePath = path.join(ROOT_DIR, 'Dockerfile');
const dockerignorePath = path.join(ROOT_DIR, '.dockerignore');
const gitignorePath = path.join(ROOT_DIR, '.gitignore');

const jenkinsfile = fs.existsSync(jenkinsfilePath) ? fs.readFileSync(jenkinsfilePath, 'utf8') : '';
const dockerfile = fs.existsSync(dockerfilePath) ? fs.readFileSync(dockerfilePath, 'utf8') : '';
const dockerignore = fs.existsSync(dockerignorePath) ? fs.readFileSync(dockerignorePath, 'utf8') : '';
const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';

// -------------------------------------------------------------
// Policy Suite 1: Jenkinsfile Policies
// -------------------------------------------------------------
check('POLICY-JENKINS-001', 'Jenkinsfile', 'Must declare push triggers (githubPush)', () => {
  if (!jenkinsfile.includes('triggers') || !jenkinsfile.includes('githubPush')) {
    return 'Jenkinsfile must configure `triggers { githubPush() }` to automatically trigger builds upon GitHub commit pushes.';
  }
  return true;
});

check('POLICY-JENKINS-002', 'Jenkinsfile', 'Must include Environment Validation stage', () => {
  const hasEnvStage = /stage\s*\(\s*['"]Validate Environment['"]\s*\)/i.test(jenkinsfile);
  if (!hasEnvStage) {
    return 'Jenkinsfile must define a dedicated `stage(\'Validate Environment\')` to fail fast when runtime dependencies or variables are missing.';
  }
  return true;
});

check('POLICY-JENKINS-003', 'Jenkinsfile', 'Must include Policy as Code (PaC) Validation stage', () => {
  const hasPacStage = /stage\s*\(\s*['"]Policy as Code.*Validation['"]\s*\)/i.test(jenkinsfile);
  if (!hasPacStage) {
    return 'Jenkinsfile must define a dedicated `stage(\'Policy as Code (PaC) Validation\')` to enforce policy compliance before building.';
  }
  return true;
});

check('POLICY-JENKINS-004', 'Jenkinsfile', 'Must not contain plaintext or hardcoded secrets', () => {
  const secretPatterns = [
    /password\s*=\s*['"][^'"]+['"]/i,
    /secret\s*=\s*['"][^'"]+['"]/i,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
    /token\s*=\s*['"][^'"]+['"]/i,
  ];
  for (const pattern of secretPatterns) {
    if (pattern.test(jenkinsfile)) {
      return `Potential hardcoded secret detected matching pattern: ${pattern}. Use Jenkins credentials() instead.`;
    }
  }
  return true;
});

check('POLICY-JENKINS-005', 'Jenkinsfile', 'Must use Jenkins credentials() for DockerHub registry', () => {
  if (!jenkinsfile.includes("credentials('dockerhub-creds')")) {
    return "Jenkinsfile must manage DockerHub credentials using `credentials('dockerhub-creds')`.";
  }
  return true;
});

check('POLICY-JENKINS-006', 'Jenkinsfile', 'Docker image name must adhere to approved repository', () => {
  const match = jenkinsfile.match(/IMAGE_NAME\s*=\s*['"]([^'"]+)['"]/);
  if (!match) {
    return 'IMAGE_NAME environment variable is not defined in Jenkinsfile.';
  }
  const imageName = match[1];
  if (!imageName.startsWith('adityasontakke23/')) {
    return `IMAGE_NAME '${imageName}' is unauthorized. Must start with 'adityasontakke23/'.`;
  }
  return true;
});

check('POLICY-JENKINS-007', 'Jenkinsfile', 'Must archive report artifacts upon build completion', () => {
  if (!jenkinsfile.includes('archiveArtifacts') || !jenkinsfile.includes('reports/')) {
    return "Jenkinsfile must specify `archiveArtifacts artifacts: 'reports/**/*.json'` in post { always { ... } } block.";
  }
  return true;
});

// -------------------------------------------------------------
// Policy Suite 2: Dockerfile Policies
// -------------------------------------------------------------
check('POLICY-DOCKER-001', 'Dockerfile', 'Base image must use official Node.js alpine image', () => {
  const fromMatch = dockerfile.match(/FROM\s+([^\s\n]+)/i);
  if (!fromMatch) return 'Dockerfile has no FROM instruction.';
  const baseImage = fromMatch[1];
  if (!baseImage.startsWith('node:') || !baseImage.includes('alpine')) {
    return `Base image '${baseImage}' does not meet policy. Must be an official node alpine image (e.g. node:20-alpine).`;
  }
  return true;
});

check('POLICY-DOCKER-002', 'Dockerfile', 'Base image version must be pinned (no latest tag)', () => {
  const fromMatch = dockerfile.match(/FROM\s+([^\s\n]+)/i);
  if (!fromMatch) return 'Dockerfile has no FROM instruction.';
  const baseImage = fromMatch[1];
  if (baseImage.endsWith(':latest') || !baseImage.includes(':')) {
    return `Base image '${baseImage}' must specify an explicit version tag instead of 'latest'.`;
  }
  return true;
});

check('POLICY-DOCKER-003', 'Dockerfile', 'Must define an explicit WORKDIR', () => {
  if (!/WORKDIR\s+\/[^\s\n]+/i.test(dockerfile)) {
    return 'Dockerfile must define an explicit WORKDIR (e.g., WORKDIR /app).';
  }
  return true;
});

check('POLICY-DOCKER-004', 'Dockerfile', 'Must not bake sensitive variables via ENV or ARG', () => {
  const sensitiveInDocker = /(ENV|ARG)\s+.*(SECRET|PASSWORD|PRIVATE_KEY|TOKEN|API_KEY)/i;
  if (sensitiveInDocker.test(dockerfile)) {
    return 'Dockerfile contains sensitive ARG or ENV definitions. Pass secrets at runtime only.';
  }
  return true;
});

check('POLICY-DOCKER-005', 'Dockerfile', 'Must use clean install (npm ci)', () => {
  if (!dockerfile.includes('npm ci')) {
    return "Dockerfile must use 'npm ci' to ensure reproducible dependency installs.";
  }
  return true;
});

// -------------------------------------------------------------
// Policy Suite 3: Environment & Configuration Policies
// -------------------------------------------------------------
check('POLICY-ENV-001', 'Environment', 'Committed .env files must not exist in repository', () => {
  const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
  for (const envFile of envFiles) {
    if (fs.existsSync(path.join(ROOT_DIR, envFile))) {
      return `Forbidden file '${envFile}' detected in repository root. Do not commit actual secrets.`;
    }
  }
  return true;
});

check('POLICY-ENV-002', 'Environment', '.dockerignore must exist', () => {
  if (!fs.existsSync(dockerignorePath)) {
    return '.dockerignore file is missing from repository root.';
  }
  return true;
});

check('POLICY-ENV-003', 'Environment', '.dockerignore must ignore .env files', () => {
  if (!dockerignore.includes('.env')) {
    return '.dockerignore must explicitly ignore .env and .env* files.';
  }
  return true;
});

check('POLICY-ENV-004', 'Environment', '.dockerignore must ignore .git', () => {
  if (!dockerignore.includes('.git')) {
    return '.dockerignore must ignore .git to minimize image surface and avoid leaking commit history.';
  }
  return true;
});

check('POLICY-ENV-005', 'Environment', '.dockerignore must ignore node_modules', () => {
  if (!dockerignore.includes('node_modules')) {
    return '.dockerignore must ignore node_modules so container builds its own native dependencies.';
  }
  return true;
});

check('POLICY-ENV-006', 'Environment', '.gitignore must ignore .env', () => {
  if (!gitignore.includes('.env')) {
    return '.gitignore must ignore .env files.';
  }
  return true;
});

// -------------------------------------------------------------
// Policy Suite 4: Repository Security Policies
// -------------------------------------------------------------
check('POLICY-SEC-001', 'Security', 'No sensitive private key or certificate files in workspace', () => {
  const forbiddenPatterns = [/\.pem$/, /\.key$/, /\.p12$/, /\.p8$/, /id_rsa$/];
  const files = fs.readdirSync(ROOT_DIR);
  for (const file of files) {
    for (const pat of forbiddenPatterns) {
      if (pat.test(file)) {
        return `Sensitive credential file found in workspace root: '${file}'.`;
      }
    }
  }
  return true;
});

// -------------------------------------------------------------
// Optional: Run OPA CLI tests if installed
// -------------------------------------------------------------
let opaStatus = 'OPA CLI not installed (executed built-in Policy as Code engine)';
try {
  execSync('opa version', { stdio: 'ignore' });
  try {
    const opaOutput = execSync(`opa test ${path.join(ROOT_DIR, 'policies')} -v`, { encoding: 'utf8' });
    opaStatus = 'OPA unit test suite passed successfully:\n' + opaOutput.trim();
  } catch (opaErr) {
    results.push({
      ruleId: 'POLICY-OPA-EXEC',
      domain: 'OPA Engine',
      description: 'OPA test suite execution',
      status: 'FAILED',
      message: opaErr.stdout || opaErr.message,
    });
  }
} catch {
  // OPA not installed, which is handled gracefully
}

// -------------------------------------------------------------
// Print Results & Generate Report
// -------------------------------------------------------------
console.log('\n' + COLORS.bold + COLORS.cyan + '===========================================================' + COLORS.reset);
console.log(COLORS.bold + COLORS.cyan + '        BuildSense Policy as Code (PaC) Validation         ' + COLORS.reset);
console.log(COLORS.bold + COLORS.cyan + '===========================================================' + COLORS.reset + '\n');

let passCount = 0;
let failCount = 0;

for (const res of results) {
  if (res.status === 'PASSED') {
    passCount++;
    console.log(` ${COLORS.green}✔ [PASS]${COLORS.reset} ${COLORS.bold}${res.ruleId}${COLORS.reset} (${res.domain}) - ${res.description}`);
  } else {
    failCount++;
    console.log(` ${COLORS.red}✖ [FAIL]${COLORS.reset} ${COLORS.bold}${res.ruleId}${COLORS.reset} (${res.domain}) - ${res.description}`);
    console.log(`        ${COLORS.red}Reason: ${res.message}${COLORS.reset}`);
  }
}

console.log('\n' + COLORS.bold + '-----------------------------------------------------------' + COLORS.reset);
console.log(` Total Policy Rules Checked: ${COLORS.bold}${results.length}${COLORS.reset}`);
console.log(` Passed: ${COLORS.green}${COLORS.bold}${passCount}${COLORS.reset} | Failed: ${COLORS.red}${COLORS.bold}${failCount}${COLORS.reset}`);
console.log(` Rego / OPA Status: ${COLORS.gray}${opaStatus.split('\n')[0]}${COLORS.reset}`);
console.log(COLORS.bold + '-----------------------------------------------------------' + COLORS.reset + '\n');

// Write JSON artifact
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const reportPayload = {
  timestamp: new Date().toISOString(),
  appName: 'BuildSense',
  status: failCount === 0 ? 'PASSED' : 'FAILED',
  summary: {
    total: results.length,
    passed: passCount,
    failed: failCount,
  },
  opaStatus,
  results,
};

fs.writeFileSync(path.join(REPORT_DIR, 'policy-report.json'), JSON.stringify(reportPayload, null, 2));
console.log(`📁 Policy report archived to: ${COLORS.cyan}reports/policy-report.json${COLORS.reset}\n`);

if (failCount > 0) {
  console.error(`${COLORS.bold}${COLORS.red}❌ Pipeline blocked by Policy as Code violations! Fix issues above.${COLORS.reset}\n`);
  process.exit(1);
} else {
  console.log(`${COLORS.bold}${COLORS.green}✅ All policies verified! Pipeline compliant with security standards.${COLORS.reset}\n`);
  process.exit(0);
}
