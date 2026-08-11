pipeline {
    agent any
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        IMAGE_NAME = "adityasontakke23/buildsense"
    }
    stages {
        stage('Clone Repository') {
            steps {
                echo 'Cloning repo...'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Run Tests') {
            steps {
                sh 'npm test || echo "No tests configured yet"'
            }
        }
        stage('Generate Report') {
            steps {
                // Replace this with your actual report generation script
                sh 'npm run generate-report || node generate-report.js'
            }
        }
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:latest .'
            }
        }
        stage('Push to Docker Hub') {
            steps {
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
                sh 'docker push $IMAGE_NAME:latest'
            }
        }
    }
    post {
        always {
            // Archives all JSON files inside the reports directory as build artifacts
            archiveArtifacts artifacts: 'reports/**/*.json', allowEmptyArchive: true
        }
    }
}