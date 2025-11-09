#!/bin/bash

set -e

# =================================================================
# voiceforge - Cloud Run デプロイスクリプト
# =================================================================

echo "🎬 voiceforge - Cloud Run Deployment"
echo "========================================="

# Change to voiceforge directory
cd "$(dirname "$0")/../voiceforge" || exit 1
echo "📁 Working directory: $(pwd)"

# Load environment variables from .env.local
if [ -f .env.local ]; then
    echo "📄 Loading environment variables from .env.local..."
    set -a
    source .env.local
    set +a
else
    echo "❌ Error: .env.local file not found"
    exit 1
fi

# Required variables validation
required_vars=(
    "PROJECT_ID"
    "REGION"
    "SERVICE_NAME"
    "REPOSITORY_NAME"
    "SERVICE_ACCOUNT_NAME"
    "GOOGLE_CLOUD_API_KEY"
)

echo "🔍 Validating required environment variables..."
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ All required environment variables are set"
echo "   GOOGLE_CLOUD_API_KEY: ${GOOGLE_CLOUD_API_KEY:0:20}..." # Show only first 20 chars for security

# Set Google Cloud configuration
echo "⚙️  Configuring Google Cloud..."
gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION

# Enable required APIs
echo "🔧 Enabling required Google Cloud APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    logging.googleapis.com \
    monitoring.googleapis.com

# Create Artifact Registry repository (if it doesn't exist)
echo "📦 Creating/checking Artifact Registry repository..."
if ! gcloud artifacts repositories describe $REPOSITORY_NAME --location=$REGION &>/dev/null; then
    gcloud artifacts repositories create $REPOSITORY_NAME \
        --repository-format=docker \
        --location=$REGION \
        --description="Docker repository for voiceforge"
    echo "✅ Artifact Registry repository created"
else
    echo "✅ Artifact Registry repository already exists"
fi

# Configure Docker authentication
echo "🔐 Configuring Docker authentication..."
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build image tag
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME/$SERVICE_NAME:$(date +%Y%m%d-%H%M%S)"
LATEST_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME/$SERVICE_NAME:latest"

# Build and push Docker image
echo "🏗️  Building Docker image..."
docker build \
    -f docker/Dockerfile.prod \
    -t $IMAGE_TAG -t $LATEST_TAG .

echo "📤 Pushing Docker image to Artifact Registry..."
docker push $IMAGE_TAG
docker push $LATEST_TAG

# Create or update service account (if it doesn't exist)
echo "👤 Creating/checking service account..."
if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" &>/dev/null; then
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --description="Service account for voiceforge Cloud Run service" \
        --display-name="voiceforge Cloud Run Service Account"

    # Grant necessary permissions
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/logging.logWriter"

    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/monitoring.metricWriter"

    echo "✅ Service account created with permissions"
else
    echo "✅ Service account already exists"
fi

# Grant current user permission to impersonate the service account
echo "🔑 Granting service account impersonation permission..."
CURRENT_USER=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1)
gcloud iam service-accounts add-iam-policy-binding \
    "$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --member="user:$CURRENT_USER" \
    --role="roles/iam.serviceAccountUser"

echo "✅ Service account impersonation permission granted"

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image=$IMAGE_TAG \
    --platform=managed \
    --region=$REGION \
    --service-account=$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com \
    --allow-unauthenticated \
    --memory=1Gi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=300 \
    --port=8080 \
    --set-env-vars="GOOGLE_CLOUD_API_KEY=$GOOGLE_CLOUD_API_KEY"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

echo ""
echo "🎉 Deployment completed successfully!"
echo "========================================="
echo "📄 Service URL: $SERVICE_URL"
echo ""
echo "✅ Deployment summary:"
echo "   Project ID: $PROJECT_ID"
echo "   Service Name: $SERVICE_NAME"
echo "   Region: $REGION"
echo "   Image: $IMAGE_TAG"
echo "   Service URL: $SERVICE_URL"
echo "   Environment Variables: GOOGLE_CLOUD_API_KEY (configured)"

if [ ! -z "$DOMAIN" ]; then
    echo "   Custom Domain: $DOMAIN (run domain-mapping.sh to configure)"
fi

echo ""
echo "🔗 Manage your service at:"
echo "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo ""
echo "🎬 voiceforge is now live!"
