# 🔐 PRODUCTION-SAFE КОНФИГУРАЦИЯ

## ✅ Выполненные изменения

### 1. Удалены все дефолтные секреты
**Файл:** `dash_bord/src/main/resources/application.properties`

**Изменения:**
- ❌ `jwt.secret=${JWT_SECRET:dtm_super_secret...}` → ✅ `jwt.secret=${JWT_SECRET}`
- ❌ `spring.datasource.password=${...beka2006}` → ✅ `spring.datasource.password=${...PGPASSWORD}`
- ❌ `telegram.bot.token=${...8739152722:AAF...}` → ✅ `telegram.bot.token=${TELEGRAM_BOT_TOKEN}`
- ❌ `gemini.api-key=${...AIzaSyDL05Jx...}` → ✅ `gemini.api-key=${GEMINI_API_KEY}`

### 2. Раздельные конфигурации
**Созданы файлы:**

#### `application-dev.properties` (локальная разработка)
- Безопасные дефолты для локалки
- Telegram отключен по умолчанию
- JPA DDL auto=update
- DB SSL отключен

#### `application-prod.properties` (production)
- Только переменные окружения (без дефолтов)
- JPA DDL auto=validate (защита от случайных миграций)
- DB SSL включен (require)
- Telegram включен

### 3. Fail-fast валидация
**Новый файл:** `EnvironmentValidationConfig.java`

При старте приложения проверяет:
- ✅ JWT_SECRET задан и длина ≥32 символов
- ✅ DB password задан
- ✅ TELEGRAM_BOT_TOKEN задан (если бот включен)
- ⚠️ GEMINI_API_KEY задан (если используется gemini)

**Если переменные не заданы → приложение НЕ стартует** с понятным сообщением.

### 4. Защита от утечки в логах
**Новые файлы:**
- `logback-spring.xml` - конфигурация логирования
- `MaskingPatternLayout.java` - маскировка секретов

**Маскируются:**
- Пароли в JSON/логах: `"password":"***MASKED***"`
- Токены: `"token":"***MASKED***"`
- API ключи: `api-key=***MASKED***`
- JWT Bearer токены: `Bearer ***MASKED***`

### 5. .env файлы
**Созданы:**

#### `.env.example` (шаблон для всех)
- Пустые значения
- Комментарии с инструкциями
- Все доступные переменные

#### `.env.dev` (готовый для локалки)
- Реальные значения для разработки
- Безопасно использовать локально
- НЕ коммитить в git!

### 6. .gitignore обновлён
**Добавлены исключения:**
```
.env
.env.local
.env.*.local
!.env.example
**/application-local.properties
```

---

## 🚀 Использование

### Локальная разработка (сейчас)

**Вариант 1: Использовать .env.dev**
```bash
# Скопировать готовый файл
cp .env.dev .env

# Запустить с профилем dev
export SPRING_PROFILES_ACTIVE=dev
cd dash_bord && ./mvnw spring-boot:run
```

**Вариант 2: Использовать существующие переменные**
```bash
# Ваши текущие переменные окружения продолжат работать
# Просто установите минимально необходимые:
export JWT_SECRET="dev_secret_minimum_32_chars_long"
export PGPASSWORD="beka2006"
export TELEGRAM_BOT_TOKEN="dummy"  # если бот отключен
```

### Production деплой

**1. Создать .env на сервере:**
```bash
# НЕ коммитить в git!
cp .env.example .env
nano .env
```

**2. Заполнить реальные значения:**
```bash
# Сгенерировать сильный JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Использовать реальные креды
PGPASSWORD=ваш_сложный_пароль
TELEGRAM_BOT_TOKEN=получите_новый_токен_у_@BotFather
GEMINI_API_KEY=получите_в_Google_AI_Studio
```

**3. Запустить с prod профилем:**
```bash
export SPRING_PROFILES_ACTIVE=prod
./mvnw spring-boot:run
```

---

## ⚠️ Важные замечания

### Старые секреты скомпрометированы
Все секреты из кода теперь публичны в Git истории:
- 🔴 `beka2006` - смените пароль БД
- 🔴 `8739152722:AAFM0Sls...` - ревокните токен бота (@BotFather → /revoke)
- 🔴 `AIzaSyDL05JxEKQ...` - ревокните API ключ (Google Cloud Console)
- 🔴 `dtm_super_secret_key...` - больше не используется

### Текущий запуск не сломается
Приложение продолжит работать если:
1. У вас установлены переменные окружения (PGPASSWORD и т.д.)
2. Или используете профиль `dev`

### Fail-fast можно временно отключить
Если валидация мешает (например, для тестов):
```bash
# Закомментировать @PostConstruct в EnvironmentValidationConfig.java
# ИЛИ
# Установить фиктивные значения
export JWT_SECRET="test_secret_minimum_32_characters"
export TELEGRAM_BOT_TOKEN="test"
```

---

## 📋 Чеклист перед production

- [ ] Сгенерирован новый JWT_SECRET (64+ символа)
- [ ] Изменён пароль PostgreSQL
- [ ] Получен новый Telegram bot token
- [ ] Получен новый Gemini API key
- [ ] Создан .env на сервере (не в git!)
- [ ] Установлен `SPRING_PROFILES_ACTIVE=prod`
- [ ] Проверено что `JPA_DDL_AUTO=validate`
- [ ] Добавлен production домен в CORS (SecurityConfig.java)
- [ ] Настроен HTTPS (nginx/Let's Encrypt)
- [ ] Проверены логи на отсутствие секретов

---

## 🔧 Команды для проверки

```bash
# Проверить что секретов нет в коде
git grep -E "beka2006|8739152722|AIzaSyDL05Jx"
# Должно быть пусто

# Проверить что .env игнорируется
git check-ignore .env
# Должно вывести: .env

# Проверить fail-fast валидацию
unset JWT_SECRET
cd dash_bord && ./mvnw spring-boot:run
# Должно упасть с ошибкой: "JWT_SECRET is not set"

# Проверить маскировку в логах
# В логах приложения не должно быть видно реальных паролей/токенов
```

---

## 📚 Дополнительные улучшения (опционально)

### Использовать Spring Cloud Config Server
Для централизованного управления конфигурацией в микросервисах.

### Использовать HashiCorp Vault
Для хранения секретов в защищённом хранилище.

### Использовать AWS Secrets Manager / Azure Key Vault
Для облачных деплоев.

### Ротация секретов
Настроить автоматическую ротацию JWT secret и API ключей.
