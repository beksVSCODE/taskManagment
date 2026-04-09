# 🚀 Production Deployment Guide

**ProjectPulse** - Single-server deployment с Docker Compose и Nginx

---

## 📋 Prerequisites

### 1. Server Requirements

**Минимальные требования:**
- Ubuntu 20.04+ (или другой Linux дистрибутив)
- 2 CPU cores
- 4GB RAM
- 20GB disk space
- Публичный IP адрес
- Домен (опционально, для HTTPS)

**Рекомендуемые:**
- 4 CPU cores
- 8GB RAM
- 50GB SSD

### 2. Установленное ПО

```bash
# Проверить версии
docker --version      # Docker 24.0+
docker compose version # Docker Compose v2.20+
git --version         # Git 2.x
```

**Установка Docker и Docker Compose (Ubuntu):**

```bash
# Update package index
sudo apt update

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group (logout/login required)
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose version
```

---

## 🔐 Environment Preparation

### 1. Clone Repository

```bash
# On production server
cd /opt  # or your preferred location
sudo git clone https://github.com/your-username/full-project.git projectpulse
sudo chown -R $USER:$USER projectpulse
cd projectpulse
```

### 2. Create .env File

```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env
```

**Критические параметры (.env):**

```bash
# ────────────────────────────────────
# DATABASE
# ────────────────────────────────────
PGHOST=postgres  # Docker service name (don't change)
PGPORT=5432
PGDATABASE=dash_bord_prod
PGUSER=postgres
PGPASSWORD=your_secure_password_here  # CHANGE THIS!

# ────────────────────────────────────
# SECURITY
# ────────────────────────────────────
# Generate: openssl rand -base64 64
JWT_SECRET=your_jwt_secret_minimum_32_characters  # CHANGE THIS!
JWT_EXPIRATION=86400000

# ────────────────────────────────────
# JPA (CRITICAL!)
# ────────────────────────────────────
JPA_DDL_AUTO=validate  # Use 'validate' in production!

# ────────────────────────────────────
# CORS
# ────────────────────────────────────
# Production domain (or http://SERVER_IP for testing)
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# ────────────────────────────────────
# TELEGRAM (Optional)
# ────────────────────────────────────
TELEGRAM_BOT_ENABLED=true
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_FRONTEND_BASE_URL=https://yourdomain.com

# ────────────────────────────────────
# AI SERVICES (Optional)
# ────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key
VOICE_STT_PROVIDER=gemini
VOICE_PARSE_PROVIDER=gemini
```

### 3. Generate Secrets

```bash
# Generate JWT secret
openssl rand -base64 64

# Generate strong database password
openssl rand -base64 32
```

### 4. Verify .env File

```bash
# Check required variables are set
grep -E "^(PGPASSWORD|JWT_SECRET|CORS_ALLOWED_ORIGINS)=" .env

# Should show values (not empty)
```

---

## 🏗️ Database Migration (First Deployment)

**⚠️ ВАЖНО:** Spring Boot Actuator с `JPA_DDL_AUTO=validate` **не создаст** схему автоматически.

### Option A: Use Flyway/Liquibase (Recommended)

**TODO:** Добавить Flyway миграции в проект (см. Risks ниже)

### Option B: Temporary Schema Creation (for first deployment)

```bash
# 1. Temporarily change JPA_DDL_AUTO in .env
JPA_DDL_AUTO=update  # Only for first start!

# 2. Start services
docker compose -f docker-compose.prod.yml up -d

# 3. Wait for schema creation
docker compose -f docker-compose.prod.yml logs -f backend | grep "Started"

# 4. Stop services
docker compose -f docker-compose.prod.yml down

# 5. Change back to validate
JPA_DDL_AUTO=validate

# 6. Start production
docker compose -f docker-compose.prod.yml up -d
```

### Option C: Manual SQL Schema

```bash
# 1. Get schema SQL from development
# (run backend locally with JPA_DDL_AUTO=update, then export schema)

# 2. Connect to postgres container
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d dash_bord_prod

# 3. Execute schema SQL
\i /path/to/schema.sql
```

---

## 🚀 First Start

### 1. Build Images

```bash
# Build all services (this will take 5-10 minutes)
docker compose -f docker-compose.prod.yml build

# Check images created
docker images | grep projectpulse
```

### 2. Start Services

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Expected output:
# ✔ Network projectpulse_network        Created
# ✔ Volume "projectpulse_postgres_data" Created
# ✔ Volume "projectpulse_uploads_data"  Created
# ✔ Volume "projectpulse_nginx_logs"    Created
# ✔ Container projectpulse-postgres     Started
# ✔ Container projectpulse-backend      Started
# ✔ Container projectpulse-frontend     Started
# ✔ Container projectpulse-nginx        Started
```

### 3. Monitor Startup

```bash
# Watch logs (all services)
docker compose -f docker-compose.prod.yml logs -f

# Or specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Wait for "Started Application in X seconds"
```

### 4. Verify Health

```bash
# Check all containers running
docker compose -f docker-compose.prod.yml ps

# Expected output (all "healthy"):
# NAME                    STATUS
# projectpulse-postgres   Up (healthy)
# projectpulse-backend    Up (healthy)
# projectpulse-frontend   Up (healthy)
# projectpulse-nginx      Up (healthy)
```

### 5. Test Application

```bash
# Health check
curl http://localhost/actuator/health

# Expected: {"status":"UP"}

# Frontend
curl -I http://localhost/

# Expected: HTTP/1.1 200 OK

# Test login API
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Expected: 401 (user not found) or 200 (if user exists)
```

---

## 📊 Logs & Monitoring

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f postgres

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Since timestamp
docker compose -f docker-compose.prod.yml logs --since 2024-01-01T10:00:00

# Filter by text
docker compose -f docker-compose.prod.yml logs backend | grep ERROR
```

### Nginx Logs

```bash
# Access log
docker compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log

# Error log
docker compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/error.log

# Copy logs to host
docker cp projectpulse-nginx:/var/log/nginx/access.log ./nginx-access.log
```

### Database Logs

```bash
# PostgreSQL logs
docker compose -f docker-compose.prod.yml logs postgres

# Connect to database
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d dash_bord_prod

# Check tables
\dt

# Check user count
SELECT COUNT(*) FROM users;
```

---

## 🏥 Health Checks

### Automated Health Checks

Docker Compose автоматически проверяет здоровье контейнеров:

```bash
# Check health status
docker compose -f docker-compose.prod.yml ps

# Detailed health info
docker inspect projectpulse-backend | jq '.[0].State.Health'
```

### Manual Health Checks

```bash
# Backend actuator
curl http://localhost/actuator/health
curl http://localhost/actuator/health/liveness
curl http://localhost/actuator/health/readiness

# Frontend
curl http://localhost/

# Database
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# Nginx
curl -I http://localhost/
```

### Monitoring Metrics

```bash
# Backend metrics (Prometheus format)
curl http://localhost/actuator/metrics

# Specific metric
curl http://localhost/actuator/metrics/jvm.memory.used

# All available endpoints
curl http://localhost/actuator
```

---

## 🔄 Updates & Deployment

### Update Application Code

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild images
docker compose -f docker-compose.prod.yml build

# 3. Recreate containers
docker compose -f docker-compose.prod.yml up -d

# 4. Verify
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

### Update Environment Variables

```bash
# 1. Edit .env
nano .env

# 2. Restart services (no rebuild needed)
docker compose -f docker-compose.prod.yml restart

# Or restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Database Migration

```bash
# TODO: Add Flyway/Liquibase instructions
# For now, manual approach:

# 1. Backup database first! (see Backup section)

# 2. Run migration SQL
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d dash_bord_prod -f /path/to/migration.sql

# 3. Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

---

## 💾 Backup & Restore

### Backup Database

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump \
  -U postgres dash_bord_prod > ~/backups/db-$(date +%Y%m%d-%H%M%S).sql

# Backup with compression
docker compose -f docker-compose.prod.yml exec postgres pg_dump \
  -U postgres dash_bord_prod | gzip > ~/backups/db-$(date +%Y%m%d-%H%M%S).sql.gz

# Verify backup
ls -lh ~/backups/
```

### Automated Backups

```bash
# Create backup script
cat > /opt/projectpulse/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/projectpulse"
mkdir -p $BACKUP_DIR
cd /opt/projectpulse
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump \
  -U postgres dash_bord_prod | gzip > $BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db-*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/projectpulse/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
# 0 2 * * * /opt/projectpulse/backup.sh >> /var/log/projectpulse-backup.log 2>&1
```

### Restore Database

```bash
# 1. Stop backend
docker compose -f docker-compose.prod.yml stop backend

# 2. Restore from backup
cat ~/backups/db-20240408-020000.sql | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d dash_bord_prod

# Or from compressed
gunzip -c ~/backups/db-20240408-020000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d dash_bord_prod

# 3. Start backend
docker compose -f docker-compose.prod.yml start backend
```

### Backup Uploads Directory

```bash
# Backup uploads volume
docker run --rm \
  -v projectpulse_uploads_data:/data \
  -v ~/backups:/backup \
  alpine tar czf /backup/uploads-$(date +%Y%m%d).tar.gz /data

# Restore uploads
docker run --rm \
  -v projectpulse_uploads_data:/data \
  -v ~/backups:/backup \
  alpine tar xzf /backup/uploads-20240408.tar.gz -C /
```

---

## 🔥 Rollback Basics

### Rollback to Previous Version

```bash
# 1. Restore database backup
cat ~/backups/db-20240407-020000.sql | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d dash_bord_prod

# 2. Checkout previous commit
git log --oneline  # Find previous commit hash
git checkout <commit-hash>

# 3. Rebuild and restart
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 4. Verify
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

### Emergency Rollback

```bash
# Quick rollback without code changes (use previous images)

# 1. Stop services
docker compose -f docker-compose.prod.yml down

# 2. List previous images
docker images | grep projectpulse

# 3. Tag old image as latest
docker tag projectpulse-backend:old projectpulse-backend:latest

# 4. Start with old image
docker compose -f docker-compose.prod.yml up -d
```

---

## 🛑 Stop & Clean Up

### Stop Services

```bash
# Stop (containers remain)
docker compose -f docker-compose.prod.yml stop

# Stop and remove containers
docker compose -f docker-compose.prod.yml down

# Stop, remove containers, and volumes (DANGEROUS!)
docker compose -f docker-compose.prod.yml down -v
```

### Clean Up

```bash
# Remove old images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

---

## 🔒 HTTPS Configuration (Optional)

### Using Let's Encrypt with Certbot

```bash
# 1. Install Certbot
sudo apt install certbot

# 2. Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop nginx

# 3. Obtain certificate (standalone mode)
sudo certbot certonly --standalone \
  --preferred-challenges http \
  --email your-email@example.com \
  -d yourdomain.com \
  -d www.yourdomain.com

# 4. Copy certificates to nginx folder
sudo mkdir -p /opt/projectpulse/nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/projectpulse/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/projectpulse/nginx/ssl/
sudo chown $USER:$USER /opt/projectpulse/nginx/ssl/*

# 5. Update nginx.conf (uncomment HTTPS server block)
nano nginx/nginx.conf

# 6. Update docker-compose.prod.yml (uncomment SSL volume)
nano docker-compose.prod.yml

# 7. Start nginx
docker compose -f docker-compose.prod.yml up -d nginx

# 8. Test HTTPS
curl -I https://yourdomain.com
```

### Auto-renewal with Certbot

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab
sudo crontab -e
# Add line:
# 0 3 * * * certbot renew --quiet && docker compose -f /opt/projectpulse/docker-compose.prod.yml restart nginx
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs <service>

# Check health
docker compose -f docker-compose.prod.yml ps

# Restart service
docker compose -f docker-compose.prod.yml restart <service>

# Rebuild and restart
docker compose -f docker-compose.prod.yml build <service>
docker compose -f docker-compose.prod.yml up -d <service>
```

### Database Connection Errors

```bash
# Check postgres is running
docker compose -f docker-compose.prod.yml ps postgres

# Check postgres logs
docker compose -f docker-compose.prod.yml logs postgres

# Verify credentials
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d dash_bord_prod

# Test connection from backend
docker compose -f docker-compose.prod.yml exec backend \
  env | grep PG
```

### 502 Bad Gateway

```bash
# Backend not responding
docker compose -f docker-compose.prod.yml ps backend
docker compose -f docker-compose.prod.yml logs backend

# Check backend health
curl http://localhost:8080/actuator/health  # Won't work (internal)
docker compose -f docker-compose.prod.yml exec backend wget -O- localhost:8080/actuator/health

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

### Rate Limiting Issues

```bash
# Check nginx logs
docker compose -f docker-compose.prod.yml logs nginx | grep "limiting"

# Test rate limit
for i in {1..10}; do
  curl -w "%{http_code}\n" -o /dev/null -s \
    -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test","password":"test"}'
done

# Expected: first 5-8 succeed, then 429 (Too Many Requests)
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up
docker system prune -a --volumes  # CAREFUL!

# Or selective cleanup
docker image prune -a  # Remove unused images
docker volume prune    # Remove unused volumes
```

---

## 📚 Additional Resources

- **Spring Boot Documentation:** https://docs.spring.io/spring-boot/docs/current/reference/html/
- **Docker Compose Documentation:** https://docs.docker.com/compose/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/

---

## ⚠️ Known Risks & Limitations

### 1. Database Schema Migration
**Risk:** `JPA_DDL_AUTO=validate` не создаёт схему автоматически.
**Solution:** Добавить Flyway/Liquibase миграции (TODO).
**Workaround:** Временно использовать `update` для первого запуска.

### 2. No Automated Backups
**Risk:** Нет автоматических бэкапов по умолчанию.
**Solution:** Настроить cron job (см. раздел Backup).

### 3. Single Server
**Risk:** Single point of failure, нет horizontal scaling.
**Solution:** Для high availability использовать Kubernetes/Docker Swarm.

### 4. SSL Certificates
**Risk:** SSL сертификаты нужно настраивать вручную.
**Solution:** Использовать Let's Encrypt (см. раздел HTTPS).

### 5. Secrets in .env File
**Risk:** .env файл хранится на диске в plain text.
**Solution:** Использовать Docker secrets или vault (Hashicorp Vault, AWS Secrets Manager).

### 6. No CDN
**Risk:** Static assets раздаются напрямую с сервера.
**Solution:** Для production рекомендуется CloudFlare/CloudFront.

---

## ✅ Production Checklist

Before going live:

- [ ] Strong `JWT_SECRET` generated (64+ characters)
- [ ] Strong `PGPASSWORD` set (32+ characters)
- [ ] `JPA_DDL_AUTO=validate` in .env
- [ ] `CORS_ALLOWED_ORIGINS` set to production domain
- [ ] SSL certificates configured (HTTPS)
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] Automated backups configured
- [ ] Monitoring setup (logs, health checks)
- [ ] Domain DNS configured
- [ ] Test rollback procedure
- [ ] .env file permissions: `chmod 600 .env`
- [ ] Docker auto-start enabled: `sudo systemctl enable docker`

---

**Good luck with your deployment! 🚀**

For issues, check logs first: `docker compose -f docker-compose.prod.yml logs -f`
