#!/bin/bash

# Script para obtener logs detallados de un build de Amplify

APP_ID="${1:-db3pppftvsafp}"
BRANCH="${2:-develop}"
JOB_ID="${3}"
REGION="us-east-1"

if [ -z "$JOB_ID" ]; then
    echo "Obteniendo el último Job ID..."
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
fi

echo "App: $APP_ID"
echo "Branch: $BRANCH"
echo "Job ID: $JOB_ID"
echo ""

# Obtener información del job
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RESUMEN DEL JOB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws amplify get-job \
    --app-id $APP_ID \
    --branch-name $BRANCH \
    --job-id $JOB_ID \
    --region $REGION \
    --query 'job.summary' \
    --output table

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASOS DEL BUILD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws amplify get-job \
    --app-id $APP_ID \
    --branch-name $BRANCH \
    --job-id $JOB_ID \
    --region $REGION \
    --query 'job.steps[*].[stepName,status,startTime,endTime]' \
    --output table

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " OBTENIENDO URL DE LOGS DE BUILD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOG_URL=$(aws amplify get-job \
    --app-id $APP_ID \
    --branch-name $BRANCH \
    --job-id $JOB_ID \
    --region $REGION \
    --query 'job.steps[?stepName==`BUILD`].logUrl' \
    --output text)

if [ -n "$LOG_URL" ]; then
    echo " Descargando logs..."
    echo ""
    curl -s "$LOG_URL" | tail -150
else
    echo " No se pudo obtener la URL de logs"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 COMANDOS ÚTILES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Ver logs completos en AWS Console:"
echo "https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID/$BRANCH/$JOB_ID"
echo ""
echo "Reintentar build:"
echo "aws amplify start-job --app-id $APP_ID --branch-name $BRANCH --job-type RELEASE --region $REGION"
echo ""
