# Frontend Security - Production Readiness

## ✅ Выполненные улучшения

### 1. Управление JWT токенами

**Что добавлено:**
- Библиотека `src/lib/jwt.ts` с утилитами для работы с JWT
- Автоматическая проверка истечения токена перед каждым API запросом
- Проверка токена при загрузке приложения
- Буфер 60 секунд для превентивного выхода

**Как работает:**
```typescript
// Перед каждым запросом (кроме /auth/login, /auth/register)
if (isTokenExpired(token)) {
    // Очистка токена и принудительный выход
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');
    window.dispatchEvent(new Event('auth:logout'));
}
```

**Файлы:**
- [src/lib/jwt.ts](project-pulse/src/lib/jwt.ts) - утилиты JWT
- [src/services/apiClient.ts](project-pulse/src/services/apiClient.ts#L17-L39) - проверка перед запросом
- [src/contexts/AuthContext.tsx](project-pulse/src/contexts/AuthContext.tsx#L47-L53) - проверка при загрузке

---

### 2. Role-based Route Protection

**Что добавлено:**
- Компонент `RoleGuard` для защиты маршрутов по ролям
- Защита административных страниц
- Fallback компоненты для неавторизованных пользователей

**Защищённые маршруты:**
```typescript
// /users - только ADMIN
<Route path="/users" element={
  <RoleGuard allowedRoles={['ADMIN']}>
    <UsersManagement />
  </RoleGuard>
} />

// /departments - ADMIN и MANAGER
<Route path="/departments" element={
  <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
    <Departments />
  </RoleGuard>
} />
```

**Файлы:**
- [src/components/RoleGuard.tsx](project-pulse/src/components/RoleGuard.tsx) - компонент защиты
- [src/App.tsx](project-pulse/src/App.tsx#L92-L102) - применение на роутах

---

### 3. Централизованная обработка ошибок

**Что добавлено:**
- Global error handling в QueryClient
- Автоматический logout при 401 (уже был, усилен)
- Toast notifications для пользовательских ошибок

**Конфигурация:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: false,  // Предотвращает необработанные ошибки
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Файлы:**
- [src/App.tsx](project-pulse/src/App.tsx#L21-L31) - QueryClient config
- [src/services/apiClient.ts](project-pulse/src/services/apiClient.ts#L65-L77) - обработка 401

---

### 4. Переменные окружения

**Что проверено:**
- ✅ API URL уже настроен через `VITE_API_BASE_URL`
- ✅ Файл `.env` существует
- ✅ Добавлен `.env.example` для разработчиков

**Development:**
```bash
# .env
VITE_API_BASE_URL=/api  # Проксируется Vite через vite.config.ts
```

**Production:**
```bash
# .env.production
VITE_API_BASE_URL=https://api.yourcompany.com
```

**Файлы:**
- [.env.example](.env.example) - шаблон
- [project-pulse/src/config.ts](project-pulse/src/config.ts) - конфигурация

---

### 5. Тестирование

**Добавлены тесты:**
- ✅ JWT utilities (9 тестов) - декодирование, проверка истечения, извлечение данных
- ✅ RoleGuard (3 теста) - доступ по ролям, fallback, множественные роли
- ✅ Login flow (3 теста) - рендеринг формы, ошибки, loading состояние

**Запуск:**
```bash
cd project-pulse
npm test
```

**Результат:**
```
✓ src/test/jwt.test.ts (9 tests)
✓ src/test/RoleGuard.test.tsx (3 tests)
✓ src/test/Login.test.tsx (3 tests)
✓ src/test/example.test.ts (1 test)

Test Files  4 passed (4)
Tests  16 passed (16)
```

**Файлы:**
- [src/test/jwt.test.ts](project-pulse/src/test/jwt.test.ts)
- [src/test/RoleGuard.test.tsx](project-pulse/src/test/RoleGuard.test.tsx)
- [src/test/Login.test.tsx](project-pulse/src/test/Login.test.tsx)

---

## 📋 Текущая архитектура (без изменений)

**Что сохранено:**
- ✅ Bearer token в localStorage (не мигрировали на cookie)
- ✅ Существующий auth flow через AuthContext
- ✅ 401 handling через `window.dispatchEvent('auth:logout')`
- ✅ Protected routes через ProtectedRoute компонент
- ✅ Hooks usePermissions для проверки ролей

**Почему не меняли:**
- Текущая архитектура стабильна и работает
- Миграция на cookie требует backend изменений (рискованно)
- localStorage + Bearer token - валидный подход для SPA
- Все критичные места уже защищены

---

## ⚠️ Известные риски (требуют внимания в будущем)

### 1. XSS уязвимость

**Проблема:**
JWT токен в localStorage доступен для JavaScript → риск XSS атак

**Текущая защита:**
- React автоматически экранирует user input
- Все формы используют controlled components
- Нет dangerouslySetInnerHTML

**Рекомендации для production:**
1. Настроить Content Security Policy (CSP) headers:
```nginx
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';
```

2. Регулярно обновлять зависимости:
```bash
npm audit
npm audit fix
```

3. В будущем рассмотреть миграцию на httpOnly cookies

---

### 2. Отсутствие Refresh Tokens

**Проблема:**
После истечения JWT (24 часа) пользователь должен вводить пароль заново

**Текущее поведение:**
- JWT_EXPIRATION = 86400000 (24 часа)
- При истечении → auto-logout → redirect на /login
- Никаких фоновых ре-аутентификаций

**Рекомендации для будущего:**
1. Добавить refresh token endpoint в backend:
```java
POST /api/auth/refresh
{
  "refreshToken": "..."
}
```

2. Обновлять access token фоново:
```typescript
// Refresh token 5 минут до истечения access token
if (tokenExpiresIn < 5 * 60) {
    await refreshAccessToken();
}
```

---

### 3. Client-side Token Validation

**Проблема:**
Frontend проверяет только `exp` claim, не проверяет подпись JWT

**Почему это безопасно:**
- ✅ Backend всегда проверяет подпись (JwtAuthFilter)
- ✅ Frontend проверка только для UX (избегаем лишних запросов)
- ✅ Невалидный токен отклонится на backend с 401

**Не является уязвимостью:**
Frontend проверка - это оптимизация, не security мера. Реальная валидация происходит на backend.

---

## 🔐 Checklist для Production Deploy

### Environment
- [ ] Создан `.env.production` с правильным `VITE_API_BASE_URL`
- [ ] Проверено что токены не логируются в production
- [ ] Отключен React DevTools в production build (Vite делает автоматически)

### Backend Headers
- [ ] CORS настроен только для production domain
- [ ] Content-Security-Policy headers
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Strict-Transport-Security (HSTS)

### Testing
- [ ] Все тесты проходят: `npm test`
- [ ] Проверен production build: `npm run build`
- [ ] Протестирован logout на истечение токена
- [ ] Протестирован role-based access (ADMIN, MANAGER)

### Monitoring
- [ ] Настроен error tracking (Sentry, LogRocket)
- [ ] Мониторинг 401/403 ошибок
- [ ] Alerts на частые auth failures (может быть brute force)

---

## 🚀 Быстрый старт для разработчиков

### 1. Установка

```bash
cd project-pulse
cp .env.example .env
npm install
```

### 2. Настройка API URL

```bash
# .env
VITE_API_BASE_URL=/api  # Development (proxied by Vite)
```

### 3. Запуск тестов

```bash
npm test
```

### 4. Запуск dev server

```bash
npm run dev
```

Frontend будет доступен на http://localhost:8081

### 5. Production build

```bash
# Создать .env.production
echo "VITE_API_BASE_URL=https://api.yourcompany.com" > .env.production

# Собрать
npm run build

# Результат в dist/
```

---

## 📚 Полезные ссылки

**JWT Token Management:**
- [src/lib/jwt.ts](project-pulse/src/lib/jwt.ts) - утилиты
- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

**Role-Based Access Control:**
- [src/components/RoleGuard.tsx](project-pulse/src/components/RoleGuard.tsx)
- [src/hooks/usePermissions.ts](project-pulse/src/hooks/usePermissions.ts)

**API Client:**
- [src/services/apiClient.ts](project-pulse/src/services/apiClient.ts) - централизованный клиент

**Tests:**
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

---

## 📝 Changelog

### 2024-01-XX - Frontend Security Hardening

**Added:**
- JWT token expiration validation (60s buffer)
- RoleGuard component for route protection
- Unit tests (JWT, RoleGuard, Login flow)
- .env.example template
- Global error handling in QueryClient

**Enhanced:**
- apiClient.ts - token validation before requests
- AuthContext.tsx - token check on app load
- App.tsx - protected routes with role guards

**Preserved:**
- Bearer token + localStorage architecture
- Existing auth flow
- 401 handling mechanism
- ProtectedRoute component

**Test Coverage:**
- 16/16 tests passing
- JWT utilities: 9 tests
- RoleGuard: 3 tests
- Login flow: 3 tests
