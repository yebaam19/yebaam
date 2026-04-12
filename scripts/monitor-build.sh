#!/bin/bash

# Script para monitorear el build de Amplify

APP_ID="db3pppftvsafp"
BRANCH="develop"
REGION="us-east-1"
MAX_CHECKS=60

echo "Monitoreando build de Amplify..."
echo "App: $APP_ID"
echo "Branch: $BRANCH"
echo ""

# Obtener el último job ID
JOB_ID=$(aws amplify list-jobs \
    --app-id $APP_ID \
    --branch-name $BRANCH \
    --max-items 1 \
    --region $REGION \
    --query 'jobSummaries[0].jobId' \
    --output text 2>/dev/null)

if [ -z "$JOB_ID" ] || [ "$JOB_ID" == "None" ]; then
    echo " No se encontró ningún job"
    exit 1
fi

echo "Monitoring build for App: $APP_ID, Branch: $BRANCH"
echo "Latest Job ID: $JOB_ID"
echo ""

CHECK_COUNT=0
while [ $CHECK_COUNT -lt $MAX_CHECKS ]; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    
    # Obtener estado del job
    STATUS=$(aws amplify get-job \
        --app-id $APP_ID \
        --branch-name $BRANCH \
        --job-id $JOB_ID \
        --region $REGION \
        --query 'job.summary.status' \
        --output text 2>/dev/null)
    
    if [ -z "$STATUS" ]; then
        echo " Error al obtener estado"
        exit 1
    fi
    
    echo "Build Status: $STATUS (check $CHECK_COUNT/$MAX_CHECKS)"
    
    case $STATUS in
        "SUCCEED")
            echo ""
            echo " Build completed successfully!"
            echo ""
            echo "Your app is ready at:"
            echo "   https://$BRANCH.$APP_ID.amplifyapp.com"
            exit 0
            ;;
        "FAILED")
            echo ""
            echo " Build failed with status: FAILED"
            echo ""
            echo "Step details:"
            aws amplify get-job \
                --app-id $APP_ID \
                --branch-name $BRANCH \
                --job-id $JOB_ID \
                --region $REGION \
                --query 'job.steps[*].[stepName,status]' \
                --output table
            echo ""
            echo "To see detailed logs, run:"
            echo "./script/get-build-logs.sh $APP_ID $BRANCH $JOB_ID"
            exit 1
            ;;
        "CANCELLED")
            echo ""
            echo "  Build was cancelled"
            exit 1
            ;;
        *)
            # Still running, wait before next check
            sleep 10
            ;;
    esac
done

echo ""
echo "⏱️  Timeout: Build is still running after $MAX_CHECKS checks"
echo "Check status manually:"
echo "https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID/$BRANCH/$JOB_ID"
exit 1
