# 🧪 Testing Guide

## Overview

Minimal release-blocking test baseline для безопасного deployment.

---

## Backend Tests (Spring Boot)

### Location
```
dash_bord/src/test/java/com/example/demo/
```

### Test Suites

**1. Auth Tests** - `controllers/AuthControllerIntegrationTest.java`
- ✅ Login happy path (valid credentials → JWT token)
- ✅ Login with invalid password → 401
- ✅ Login with non-existent user → 401
- ✅ Registration with valid data
- ✅ Registration with duplicate email → 400

**2. Task Tests** - `controllers/TaskControllerIntegrationTest.java`
- ✅ Create task (ADMIN role)
- ✅ Get all tasks (authenticated)
- ✅ TEAM user cannot access admin endpoint → 403
- ✅ ADMIN user can access admin endpoint → 200
- ✅ Unauthenticated access → 401

**3. Security Tests** - `security/SecurityIntegrationTest.java`
- ✅ Protected endpoint without token → 401
- ✅ Protected endpoint with invalid token → 401
- ✅ Public endpoints accessible without token
- ✅ CORS headers present

**4. Rate Limiting** - `security/LoginRateLimitTest.java`
- ✅ Rate limit enforcement for login endpoint
- ✅ Rate limit filter unit tests

**5. Telegram Service** - `services/TelegramNotificationServiceTest.java`
- ✅ Send notification when task assigned
- ✅ Skip notification when no Telegram linked
- ✅ Send notification on status change
- ✅ Handle Telegram API errors gracefully
- ✅ Send deadline reminders

### Running Tests

```bash
# All tests
cd dash_bord
./mvnw test

# Specific test class
./mvnw test -Dtest=AuthControllerIntegrationTest

# Specific test method
./mvnw test -Dtest=AuthControllerIntegrationTest#shouldReturnJwtToken_whenLoginWithValidCredentials

# With coverage (requires jacoco plugin)
./mvnw test jacoco:report
```

### Environment Variables for Tests

Tests use default test configuration. If needed, override:

```bash
export JWT_SECRET=test_secret_minimum_32_characters_long
export CORS_ALLOWED_ORIGINS=http://localhost:3000
export TELEGRAM_BOT_ENABLED=false
```

---

## Frontend Tests (React/Vitest)

### Location
```
project-pulse/src/test/
```

### Test Suites

**1. Login Flow** - `Login.test.tsx`
- ✅ Render login form
- ✅ Show error on invalid credentials
- ✅ Disable inputs while loading

**2. Role Guards** - `RoleGuard.test.tsx`
- ✅ Render children for allowed role
- ✅ Show fallback for disallowed role
- ✅ Support multiple roles

**3. JWT Utilities** - `jwt.test.ts`
- ✅ Decode JWT token
- ✅ Check token expiration
- ✅ Extract email and role from token

**4. Create Task Modal** - `CreateTaskModal.test.tsx`
- ✅ Render modal when open
- ✅ Show validation errors on empty form
- ✅ Require title field
- ✅ Have all expected form fields
- ✅ Close modal on cancel

### Running Tests

```bash
# All tests
cd project-pulse
npm test

# Watch mode
npm run test:watch

# Coverage (if configured)
npm test -- --coverage
```

---

## CI/CD Workflows (GitHub Actions)

### Location
```
.github/workflows/
```

### Workflows

**1. Backend CI** - `backend.yml`
- Triggers: Push/PR to main/develop with backend changes
- Steps:
  1. Setup JDK 21
  2. Set test env variables
  3. Run tests (`./mvnw test`)
  4. Build JAR (`./mvnw package`)
  5. Upload test reports

**2. Frontend CI** - `frontend.yml`
- Triggers: Push/PR to main/develop with frontend changes
- Steps:
  1. Setup Node.js 20
  2. Install dependencies (`npm ci`)
  3. Run tests (`npm test`)
  4. Build application (`npm run build`)
  5. Upload build artifacts

**3. Full Pipeline** - `ci.yml`
- Triggers: Push/PR to main
- Steps:
  1. Run backend tests & build (parallel)
  2. Run frontend tests & build (parallel)
  3. Integration check (verify artifacts)

### Manual Workflow Run

```bash
# Trigger via GitHub UI:
# Actions → Select workflow → Run workflow

# Or via GitHub CLI:
gh workflow run backend.yml
gh workflow run frontend.yml
gh workflow run ci.yml
```

---

## Pre-Deployment Checklist

Run these commands locally before deploying:

```bash
# 1. Backend tests
cd dash_bord
./mvnw clean test
./mvnw package -DskipTests

# 2. Frontend tests
cd ../project-pulse
npm test
npm run build

# 3. Check for errors
echo "✅ All tests passed!"
```

---

## Test Coverage Summary

### ✅ What's Covered (Release-Blocking)

**Backend:**
- ✅ Auth flow (login, registration, JWT generation)
- ✅ 401/403 error responses
- ✅ Role-based access control (ADMIN vs TEAM)
- ✅ Task creation workflow
- ✅ Telegram notification service (mocked)
- ✅ Rate limiting
- ✅ CORS configuration

**Frontend:**
- ✅ Login form (error/success paths)
- ✅ Protected routes (role guards)
- ✅ JWT token validation
- ✅ Key form validation (CreateTaskModal)

**Infrastructure:**
- ✅ Automated CI/CD pipeline
- ✅ Build verification
- ✅ Test automation

### ⚠️ What's NOT Covered (Known Gaps)

**Backend (High Priority):**
- ⚠️ File upload/download endpoints
- ⚠️ Database migrations (Flyway/Liquibase)
- ⚠️ Subtask CRUD operations
- ⚠️ Comment/Attachment endpoints
- ⚠️ Department management
- ⚠️ Analytics endpoints
- ⚠️ Voice task service
- ⚠️ Email notifications (if implemented)

**Backend (Medium Priority):**
- ⚠️ Complex query filters
- ⚠️ Pagination edge cases
- ⚠️ Concurrent task updates
- ⚠️ Transaction rollback scenarios
- ⚠️ Audit logging

**Frontend (High Priority):**
- ⚠️ Task list page (filtering, sorting)
- ⚠️ Task detail page (edit, comments)
- ⚠️ Project dashboard
- ⚠️ User management UI
- ⚠️ Department management UI
- ⚠️ Analytics charts/graphs
- ⚠️ File upload UI

**Frontend (Medium Priority):**
- ⚠️ Real-time updates (polling)
- ⚠️ Notification center
- ⚠️ Voice task modal
- ⚠️ Mobile responsiveness
- ⚠️ Accessibility (ARIA)

**Integration (Critical):**
- ⚠️ End-to-end (E2E) tests
- ⚠️ Performance testing
- ⚠️ Load testing
- ⚠️ Security scanning (OWASP)

**Infrastructure:**
- ⚠️ Docker build tests
- ⚠️ Database backup/restore tests
- ⚠️ SSL/HTTPS configuration tests
- ⚠️ Monitoring/alerting tests

---

## Recommendations for Future

### Immediate Next Steps (Post-MVP)
1. Add E2E tests with Playwright/Cypress
2. Add integration tests for file upload
3. Add tests for analytics endpoints
4. Increase frontend component test coverage

### Medium-Term
1. Setup code coverage reporting (Codecov, Coveralls)
2. Add performance benchmarks
3. Add security scanning (Snyk, Dependabot)
4. Add visual regression tests

### Long-Term
1. Contract testing (Pact) for API
2. Chaos engineering tests
3. Load testing with k6/JMeter
4. Accessibility audits

---

## Debugging Failed Tests

### Backend Test Failures

```bash
# View detailed logs
./mvnw test -X

# Run single test with verbose output
./mvnw test -Dtest=AuthControllerIntegrationTest -X

# Check surefire reports
cat target/surefire-reports/*.txt
```

### Frontend Test Failures

```bash
# Verbose mode
npm test -- --reporter=verbose

# Debug specific test
npm test -- CreateTaskModal.test.tsx

# UI mode (interactive)
npm test -- --ui
```

### CI/CD Failures

1. Check workflow logs in GitHub Actions
2. Download test reports artifact
3. Reproduce locally with same env vars
4. Check for environment-specific issues

---

## Contributing Tests

When adding new features, include:

1. **Backend:**
   - Integration test for new endpoint
   - Unit test for service logic
   - Security test if auth-related

2. **Frontend:**
   - Component test for new UI
   - Integration test for new page
   - Role guard test if protected

3. **Documentation:**
   - Update this TESTING.md
   - Add test examples to README

---

**Last Updated:** 2024-04-08

**Test Count:**
- Backend: ~25 tests
- Frontend: ~20 tests
- Total: ~45 release-blocking tests
