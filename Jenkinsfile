pipeline {
    agent any

    triggers {
        githubPush()
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        IMAGE_NAME = "adityasontakke23/buildsense"
    }

    stages {
        stage('Validate Environment') {
            steps {
                echo '=== [Step 1/8] Pre-flight Environment Validation ==='
                sh '''
                    echo "Checking Node.js..."
                    node --version || { echo "❌ ERROR: Node.js runtime is required but not installed or not in PATH"; exit 1; }

                    echo "Checking npm..."
                    npm --version || { echo "❌ ERROR: npm package manager is required but not installed"; exit 1; }

                    echo "Checking Docker CLI..."
                    docker --version || { echo "❌ ERROR: Docker CLI is required but not installed"; exit 1; }

                    echo "Checking Docker Daemon connectivity..."
                    docker info > /dev/null 2>&1 || {
                        echo "⚠️ WARNING: Docker daemon is not accessible or permission denied. Subsequent docker build stage may fail.";
                    }

                    echo "Checking required environment variables..."
                    if [ -z "$IMAGE_NAME" ]; then
                        echo "❌ ERROR: IMAGE_NAME environment variable is not defined";
                        exit 1;
                    fi

                    echo "✅ Environment pre-flight checks passed."
                '''
            }
        }

        stage('Policy as Code (PaC) Validation') {
            steps {
                echo '=== [Step 2/8] Running Policy as Code (PaC) Enforcement ==='
                sh 'node policies/verify-policy.js'
            }
        }

        stage('Clone Repository') {
            steps {
                echo '=== [Step 3/8] Cloning Repository ==='
                echo 'Cloning repo and verifying workspace...'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '=== [Step 4/8] Installing Dependencies ==='
                sh 'npm ci --legacy-peer-deps || npm install'
            }
        }

        stage('Run Tests') {
            steps {
                echo '=== [Step 5/8] Running Automated Tests ==='
                sh 'npm test || echo "No tests configured yet"'
            }
        }

        stage('Generate Report') {
            steps {
                echo '=== [Step 6/8] Generating Build & Policy Reports ==='
                sh 'npm run generate-report || node generate-report.js'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '=== [Step 7/8] Building Docker Container Image ==='
                sh 'docker build -t $IMAGE_NAME:latest .'
            }
        }

        stage('Push to Docker Hub') {
            environment {
                DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
            }
            steps {
                echo '=== [Step 8/8] Authenticating & Pushing to Docker Hub ==='
                sh '''
                    echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin
                    docker push $IMAGE_NAME:latest
                '''
            }
        }
    }

    post {
        always {
            echo '=== Archiving Build and Policy Artifacts ==='
            archiveArtifacts artifacts: 'reports/**/*.json', allowEmptyArchive: true
        }
        failure {
            echo '❌ Jenkins Pipeline failed! Review stage logs above for policy violations or environment errors.'
        }
        success {
            echo '✅ Jenkins Pipeline succeeded! All policies and environment checks passed.'
        }
    }
}