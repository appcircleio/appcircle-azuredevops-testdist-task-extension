/* groovylint-disable CompileStatic, NestedBlockDepth, GStringExpressionWithinString */
pipeline {
    agent { label 'agent' }
    environment {
        // Set the default value for the environment variable
        PUBLISH_TOKEN = credentials('AzureDevOpsPluginPublishToken')
    }

    stages {
        stage('Get Commit Message') {
            steps {
                script {
                    env.GIT_COMMIT_MSG = sh(
                            script: 'git log -1 --pretty=%B ${GIT_COMMIT}'
                            , returnStdout: true
                        ).trim()
                }
            }
        }
        stage('Publish Plugin') {
            steps {
                sh '''
                    chmod u+x pipeline.sh
                    ./pipeline.sh
                '''
            }
        }
    }

    // post {
    //     always {
    //         notifySlack(currentBuild.currentResult, currentBuild.durationString)
    //     }
    // }
}
