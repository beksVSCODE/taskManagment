#!/bin/bash
# ============================================
# Quick Start Script for Production Deployment
# ============================================

set -e  # Exit on error

echo "🚀 ProjectPulse Production Deployment Quick Start"
echo "=================================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "Please create .env file:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    echo ""
    echo "Required variables:"
    echo "  - PGPASSWORD (database password)"
    echo "  - JWT_SECRET (minimum 32 characters)"
    echo "  - CORS_ALLOWED_ORIGINS (your production domain)"
    echo ""
    exit 1
fi

# Check required variables
echo "📋 Checking required environment variables..."
required_vars=("PGPASSWORD" "JWT_SECRET" "CORS_ALLOWED_ORIGINS")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=.\\+" .env 2>/dev/null; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required variables in .env:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please edit .env and set these variables."
    exit 1
fi

echo "✅ All required variables found"
echo ""

# Check Docker
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found! Please install Docker first."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose not found! Please install Docker Compose v2."
    exit 1
fi

docker --version
docker compose version
echo "✅ Docker OK"
echo ""

# Build images
echo "🔨 Building Docker images (this may take 5-10 minutes)..."
docker compose -f docker-compose.prod.yml build

echo "✅ Images built"
echo ""

# Start services
echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo "✅ Services started"
echo ""

# Wait for health checks
echo "⏳ Waiting for services to become healthy (this may take 1-2 minutes)..."
sleep 10

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    healthy_count=$(docker compose -f docker-compose.prod.yml ps --format json | jq -r '.Health' | grep -c "healthy" || true)
    
    if [ "$healthy_count" -eq 4 ]; then
        echo "✅ All services are healthy!"
        break
    fi
    
    echo "  Waiting... ($attempt/$max_attempts) - $healthy_count/4 services healthy"
    sleep 5
    ((attempt++))
done

if [ $attempt -eq $max_attempts ]; then
    echo "⚠️  Timeout waiting for services. Checking status..."
    docker compose -f docker-compose.prod.yml ps
    echo ""
    echo "Check logs with: docker compose -f docker-compose.prod.yml logs"
    exit 1
fi

echo ""

# Health check
echo "🏥 Running health checks..."

# Backend health
if curl -sf http://localhost/actuator/health > /dev/null; then
    echo "✅ Backend health: OK"
else
    echo "❌ Backend health: FAILED"
fi

# Frontend health
if curl -sf -I http://localhost/ > /dev/null; then
    echo "✅ Frontend health: OK"
else
    echo "❌ Frontend health: FAILED"
fi

echo ""

# Show status
echo "📊 Container Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "════════════════════════════════════════════════"
echo "✅ Deployment Complete!"
echo "════════════════════════════════════════════════"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost/"
echo "   Backend API: http://localhost/api/"
echo "   Health Check: http://localhost/actuator/health"
echo ""
echo "📝 Useful commands:"
echo "   View logs:       docker compose -f docker-compose.prod.yml logs -f"
echo "   Stop services:   docker compose -f docker-compose.prod.yml down"
echo "   Restart:         docker compose -f docker-compose.prod.yml restart"
echo "   Status:          docker compose -f docker-compose.prod.yml ps"
echo ""
echo "📚 Full documentation: DEPLOY.md"
echo ""
