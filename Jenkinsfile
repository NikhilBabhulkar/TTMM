pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
        DOCKER_USERNAME = credentials('dockerhub-username')
        GIT_REPO = 'https://github.com/NikhilBabhulkar/TTMM.git'
        KUBECONFIG_CREDENTIALS_ID = 'kubeconfig'
        NAMESPACE = 'splitwise'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'master', url: "${GIT_REPO}"
            }
        }
        
        stage('Build Backend Docker Image') {
            steps {
                script {
                    dir('backend') {
                        dockerImageBackend = docker.build("${DOCKER_USERNAME}/splitwise-backend:${BUILD_NUMBER}")
                        dockerImageBackend.tag('latest')
                    }
                }
            }
        }
        
        stage('Build Frontend Docker Image') {
            steps {
                script {
                    dir('frontend') {
                        dockerImageFrontend = docker.build("${DOCKER_USERNAME}/splitwise-frontend:${BUILD_NUMBER}")
                        dockerImageFrontend.tag('latest')
                    }
                }
            }
        }
        
        stage('Push Docker Images') {
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", "${DOCKER_CREDENTIALS_ID}") {
                        dockerImageBackend.push("${BUILD_NUMBER}")
                        dockerImageBackend.push('latest')
                        dockerImageFrontend.push("${BUILD_NUMBER}")
                        dockerImageFrontend.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withKubeConfig([credentialsId: "${KUBECONFIG_CREDENTIALS_ID}"]) {
                        sh """
                            # Create namespace if not exists
                            kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                            
                            # Apply Kubernetes manifests
                            kubectl apply -f k8s/configmap.yaml
                            kubectl apply -f k8s/secrets.yaml
                            kubectl apply -f k8s/postgres-deployment.yaml
                            kubectl apply -f k8s/backend-deployment.yaml
                            kubectl apply -f k8s/frontend-deployment.yaml
                            kubectl apply -f k8s/ingress.yaml
                            
                            # Update images to latest build
                            kubectl set image deployment/backend backend=${DOCKER_USERNAME}/splitwise-backend:${BUILD_NUMBER} -n ${NAMESPACE}
                            kubectl set image deployment/frontend frontend=${DOCKER_USERNAME}/splitwise-frontend:${BUILD_NUMBER} -n ${NAMESPACE}
                            
                            # Wait for rollout
                            kubectl rollout status deployment/backend -n ${NAMESPACE}
                            kubectl rollout status deployment/frontend -n ${NAMESPACE}
                        """
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    withKubeConfig([credentialsId: "${KUBECONFIG_CREDENTIALS_ID}"]) {
                        sh """
                            echo "Checking deployment status..."
                            kubectl get pods -n ${NAMESPACE}
                            kubectl get services -n ${NAMESPACE}
                            kubectl get ingress -n ${NAMESPACE}
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline executed successfully!'
            emailext (
                subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "Good news! The deployment was successful.",
                to: 'your-email@example.com'
            )
        }
        failure {
            echo 'Pipeline failed!'
            emailext (
                subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "Bad news! The deployment failed. Please check Jenkins logs.",
                to: 'your-email@example.com'
            )
        }
        always {
            cleanWs()
        }
    }
}
