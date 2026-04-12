#!/bin/bash

# Monitor simple del build de Amplify
APP_ID="dwqmm5iclbz1m"
BRANCH="develop"
JOB_ID="4"

echo "Monitoreando Build de Yebaam Client..."
echo "   App ID: $APP_ID"
echo "   Branch: $BRANCH"
echo "   Job ID: #$JOB_ID"
echo ""

while true; do
    STATUS=$(aws amplify get-job \
        --app-id $APP_ID \
        --branch-name $BRANCH \
        --job-id $JOB_ID \
        --region us-east-1 \
        --query 'job.summary.status' \
        --output text)
    
    TIME=$(date '+%H:%M:%S')
    
    case $STATUS in
        "RUNNING"|"PROVISIONING"|"PENDING")
            echo "[$TIME] ⚙️  $STATUS..."
            ;;
        "SUCCEED")
            echo ""
            echo "[$TIME] BUILD EXITOSO!"
            echo ""
            echo "Tu app está lista en:"
            echo "   https://develop.dwqmm5iclbz1m.amplifyapp.com"
            echo ""
            echo "Ver en AWS Console:"
            echo "   https://console.aws.amazon.com/amplify/home?region=us-east-1#/dwqmm5iclbz1m"
            exit 0
            ;;
        "FAILED")
            echo ""
            echo "[$TIME] BUILD FALLÓ"
            echo ""
            echo "Ver logs en:"
            echo "   https://console.aws.amazon.com/amplify/home?region=us-east-1#/dwqmm5iclbz1m/YnJhbmNoZXMvZGV2ZWxvcA/1"
            exit 1
            ;;
    esac
    
    sleep 10
done
