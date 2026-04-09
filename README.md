# 🎯 Project Pulse - Система управления проектами и задачами

Современная веб-платформа для управления командными задачами, проектами и сотрудниками с расширенной аналитикой и интеграцией с Telegram.

## 📋 Описание проекта

**Project Pulse** — это комплексная система управления проектами и задачами для команд любого размера. Система включает:

- 📊 Визуальную Kanban-доску для управления задачами
- 👥 Управление сотрудниками, отделами и проектами
- 📈 Расширенную аналитику и отчетность
- 🔔 Telegram-интеграцию для уведомлений
- 🎤 Голосовой ввод задач с AI-обработкой (Gemini/OpenAI)
- 📁 Прикрепление файлов к задачам и комментариям
- 💬 Систему комментариев с @упоминаниями
- 🔐 Ролевую модель доступа (ADMIN, MANAGER, PM, TEAM)

---

## 🛠️ Технологический стек

### Backend
- **Java 21** + **Spring Boot 3.2.5**
- **PostgreSQL** - основная БД
- **Spring Security** + **JWT** - аутентификация
- **Spring Data JPA** + **Hibernate** - ORM
- **Maven** - сборка проекта
- **Lombok** - уменьшение boilerplate кода

### Frontend
- **React 18** + **TypeScript**
- **Vite** - сборка и dev-сервер
- **TailwindCSS** - стилизация
- **shadcn/ui** - компоненты
- **React Router** - навигация
- **Recharts** - графики и аналитика

### Дополнительно
- **Docker** + **Docker Compose** - контейнеризация
- **Telegram Bot API** - уведомления
- **Gemini/OpenAI** - AI обработка голосовых задач
- **GitHub Actions** - CI/CD

---

## 📦 Структура проекта

```
full-project/
├── dash_bord/              # Backend (Spring Boot)
│   ├── src/main/java/      # Исходный код Java
│   ├── src/main/resources/ # Конфигурация и ресурсы
│   └── pom.xml             # Maven зависимости
├── project-pulse/          # Frontend (React + Vite)
│   ├── src/                # Исходный код React
│   ├── public/             # Статические ресурсы
│   └── package.json        # npm зависимости
├── nginx/                  # Конфигурация Nginx
├── .github/workflows/      # CI/CD пайплайны
├── docker-compose.prod.yml # Production конфигурация
└── README.md               # Этот файл
```

---

## 🚀 Быстрый старт

### Требования

- **Java 21+**
- **Node.js 18+** и **npm/bun**
- **PostgreSQL 14+**
- **Git**

### 1. Клонирование репозитория

```bash
git clone <URL_РЕПОЗИТОРИЯ>
cd full-project
```

### 2. Настройка окружения

Скопируйте пример конфигурации:

```bash
cp .env.example .env
```

Отредактируйте `.env` и установите необходимые переменные:

```env
# База данных
PGPASSWORD=your_secure_password

# JWT Secret (сгенерируйте: openssl rand -base64 64)
JWT_SECRET=your_super_secret_jwt_key_minimum_64_characters_long

# CORS (ваш домен)
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Telegram (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_ENABLED=true

# Gemini API (опционально, для голосовых задач)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Запуск базы данных

```bash
# Создайте БД PostgreSQL
createdb dash_bord_1

# Или через Docker
docker run -d \
  --name postgres-db \
  -e POSTGRES_DB=dash_bord_1 \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  postgres:16
```

### 4. Запуск Backend

```bash
cd dash_bord

# Установка зависимостей и запуск
./mvnw spring-boot:run

# Backend будет доступен на http://localhost:8080
```

### 5. Запуск Frontend

```bash
cd project-pulse

# Установка зависимостей
npm install
# или
bun install

# Запуск dev сервера
npm run dev
# или
bun run dev

# Frontend будет доступен на http://localhost:5173
```

---

## 🐳 Docker Deployment

### Development

```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка логов
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Production

```bash
# Сборка и запуск production версии
docker-compose -f docker-compose.prod.yml up -d

# Мониторинг
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🔑 Учетные записи по умолчанию

После первого запуска создаются тестовые пользователи:

| Email | Пароль | Роль |
|-------|--------|------|
| admin@test.com | admin123 | ADMIN |
| manager@test.com | manager123 | MANAGER |
| pm@test.com | pm123 | PM |
| user@test.com | user123 | TEAM |

⚠️ **ВАЖНО:** Измените пароли перед деплоем в production!

---

## 📱 Telegram интеграция

### Настройка бота

1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите токен бота
3. Установите webhook:

```bash
# Для локальной разработки (с ngrok/cloudflare tunnel)
python setup_telegram_webhook.py YOUR_BOT_TOKEN https://your-tunnel-url.com

# Для production
python setup_telegram_webhook.py YOUR_BOT_TOKEN https://yourdomain.com
```

4. Добавьте токен в `.env`:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_ENABLED=true
TELEGRAM_WEBHOOK_SECRET_TOKEN=<generated_by_script>
```

Подробности в [TELEGRAM_WEBHOOK_SECURITY.md](TELEGRAM_WEBHOOK_SECURITY.md)

---

## 🎤 Голосовой ввод задач

Система поддерживает создание задач голосом с автоматической обработкой через AI:

1. Включите Gemini API в `.env`:
```env
GEMINI_API_KEY=your_api_key
VOICE_PARSE_PROVIDER=gemini
```

2. Используйте кнопку микрофона в интерфейсе
3. AI автоматически извлечет:
   - Название задачи
   - Описание
   - Исполнителя
   - Срок выполнения
   - Приоритет

---

## 🧪 Тестирование

### Backend тесты

```bash
cd dash_bord

# Запуск всех тестов
./mvnw test

# Запуск с покрытием
./mvnw test jacoco:report

# Отчет: target/site/jacoco/index.html
```

### Frontend тесты

```bash
cd project-pulse

# Unit тесты
npm run test

# Coverage
npm run test:coverage
```

---

## 📊 API документация

После запуска backend API документация доступна:

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

### Основные endpoints

```
POST   /api/auth/login          - Авторизация
GET    /api/users               - Список пользователей
GET    /api/projects            - Список проектов
GET    /api/tasks               - Список задач
POST   /api/tasks               - Создание задачи
PATCH  /api/tasks/{id}          - Обновление задачи
POST   /api/tasks/{id}/comments - Добавить комментарий
GET    /api/analytics/dashboard - Аналитика
```

---

## 🔒 Безопасность

### Реализованные меры

- ✅ JWT аутентификация с коротким временем жизни
- ✅ Password hashing (BCrypt)
- ✅ Rate limiting на login endpoint (защита от brute force)
- ✅ CORS настройки
- ✅ SQL injection защита (Hibernate)
- ✅ XSS защита
- ✅ Секретные данные в environment переменных
- ✅ Telegram webhook с secret token
- ✅ HTTPS обязателен для production

### Перед деплоем

1. Сгенерируйте сильный JWT secret:
```bash
openssl rand -base64 64
```

2. Установите production переменные:
```env
JWT_SECRET=<generated_strong_secret>
PGPASSWORD=<strong_database_password>
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

3. Отключите debug режимы:
```env
JPA_DDL_AUTO=validate
SHOW_SQL=false
```

---

## 📈 Мониторинг

### Health checks

```bash
# Проверка здоровья приложения
curl http://localhost:8080/actuator/health

# Метрики
curl http://localhost:8080/actuator/metrics
```

### Логи

```bash
# Backend логи (Docker)
docker-compose logs -f backend

# Frontend логи (Docker)
docker-compose logs -f frontend

# Просмотр логов файлов
tail -f dash_bord/logs/spring-boot.log
```

---

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Закоммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Запушьте в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

## 📝 Документация

- [DEPLOY.md](DEPLOY.md) - Инструкции по деплою
- [TESTING.md](TESTING.md) - Гайд по тестированию
- [TELEGRAM_WEBHOOK_SECURITY.md](TELEGRAM_WEBHOOK_SECURITY.md) - Настройка Telegram
- [SECURITY_MIGRATION.md](SECURITY_MIGRATION.md) - Security обновления

---

## 📄 Лицензия

Этот проект разработан для образовательных целей.

---

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте [Issues](../../issues) - возможно ваша проблема уже решена
2. Создайте новый Issue с подробным описанием
3. Приложите логи и скриншоты

---

## 👨‍💻 Автор

Разработано с использованием современного стека технологий для демонстрации best practices в разработке enterprise приложений.

---

**Дата создания**: Апрель 2026  
**Версия**: 1.0.0
