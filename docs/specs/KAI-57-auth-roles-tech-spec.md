# Tech Spec — KAI-57: Autenticacao e Controle de Acesso (Roles)

## PRD: [KAI-57-auth-roles-prd.md](./KAI-57-auth-roles-prd.md)

---

## 1. Estado Atual

### O que ja existe (nao precisa criar)

| Componente | Arquivo | Status |
|---|---|---|
| JWT security (encode/decode/hash) | `backend/app/core/security.py` | Completo |
| User model (SQLAlchemy) | `backend/app/modules/users/models.py` | Completo |
| User schemas (Pydantic) | `backend/app/modules/users/schemas.py` | Completo |
| User repository | `backend/app/modules/users/repositories/user_repository.py` | Completo |
| User exceptions | `backend/app/modules/users/exceptions.py` | Completo |
| Auth schemas | `backend/app/modules/auth/schemas.py` | Completo |
| Auth exceptions | `backend/app/modules/auth/exceptions.py` | Completo |
| Auth dependencies (OAuth2, role check) | `backend/app/modules/auth/dependencies.py` | Parcial (TODO: fetch user from DB) |
| User dependencies | `backend/app/modules/users/dependencies.py` | Completo |
| Frontend API client (Axios + JWT) | `frontend/lib/api/client.ts` | Completo (TODO: refresh retry) |
| Frontend auth API functions | `frontend/lib/api/auth.ts` | Completo |
| Frontend auth store (Zustand) | `frontend/lib/stores/auth-store.ts` | Completo |
| Frontend auth types | `frontend/lib/types/auth.ts` | Completo |
| Auth/Dashboard layouts | `frontend/app/(auth)/layout.tsx`, `(dashboard)/layout.tsx` | Completo |
| Login/Register pages (shell) | `frontend/app/(auth)/login/page.tsx`, `register/page.tsx` | Placeholder |

### O que precisa ser implementado

| # | Componente | Arquivo |
|---|---|---|
| 1 | Alembic migration (users table) | `backend/alembic/versions/001_create_users_table.py` |
| 2 | Auth login service | `backend/app/modules/auth/services/login_service.py` |
| 3 | Auth register service | `backend/app/modules/auth/services/register_service.py` |
| 4 | Auth refresh service | `backend/app/modules/auth/services/refresh_service.py` |
| 5 | Auth routes (login, register, refresh) | `backend/app/modules/auth/routes.py` (rewrite) |
| 6 | Auth dependencies (fix get_current_user) | `backend/app/modules/auth/dependencies.py` (edit) |
| 7 | User get profile service | `backend/app/modules/users/services/get_profile_service.py` |
| 8 | User update profile service | `backend/app/modules/users/services/update_profile_service.py` |
| 9 | User list service | `backend/app/modules/users/services/list_users_service.py` |
| 10 | User routes (GET /me, PUT /me, GET /) | `backend/app/modules/users/routes.py` (rewrite) |
| 11 | Register routers in app | `backend/app/core/app.py` (edit) |
| 12 | Seed script (admin user) | `backend/app/scripts/seed.py` (edit or create) |
| 13 | LoginForm component | `frontend/components/features/auth/login-form.tsx` |
| 14 | RegisterForm component | `frontend/components/features/auth/register-form.tsx` |
| 15 | Login page (integrate form) | `frontend/app/(auth)/login/page.tsx` (rewrite) |
| 16 | Register page (integrate form) | `frontend/app/(auth)/register/page.tsx` (rewrite) |
| 17 | Auth guard (middleware) | `frontend/middleware.ts` |
| 18 | API client refresh token retry | `frontend/lib/api/client.ts` (edit) |
| 19 | shadcn components (input, label, card) | `frontend/components/ui/` (CLI generate) |

---

## 2. Backend — Detalhamento

### 2.1 Migration: Create Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'editor',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_users_email ON users (email);
```

Gerar via: `alembic revision --autogenerate -m "create_users_table"`

### 2.2 Auth Services

Cada service segue o padrao do projeto: uma classe com metodo `execute()`.

#### LoginService

```python
# backend/app/modules/auth/services/login_service.py
class LoginService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, email: str, password: str) -> TokenResponse:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentialsException()
        if not user.is_active:
            raise AccountDisabledException()
        access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
        refresh_token = create_refresh_token({"sub": str(user.id), "role": user.role.value})
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
```

#### RegisterService

```python
# backend/app/modules/auth/services/register_service.py
class RegisterService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, data: RegisterRequest) -> UserResponse:
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise DuplicateEmailException(data.email)
        user = User(
            email=data.email,
            name=data.name,
            password_hash=hash_password(data.password),
            role=UserRole.EDITOR,
        )
        created = await self.user_repo.create(user)
        return UserResponse.model_validate(created)
```

#### RefreshService

```python
# backend/app/modules/auth/services/refresh_service.py
class RefreshService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)  # raises on expired/invalid
        user_id = payload.get("sub")
        user = await self.user_repo.get_by_id(UUID(user_id))
        if not user or not user.is_active:
            raise UnauthorizedException("Invalid refresh token")
        access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
        new_refresh = create_refresh_token({"sub": str(user.id), "role": user.role.value})
        return TokenResponse(access_token=access_token, refresh_token=new_refresh)
```

### 2.3 Auth Routes

```
POST /api/auth/login     -> LoginService.execute()     -> TokenResponse
POST /api/auth/register  -> RegisterService.execute()   -> UserResponse
POST /api/auth/refresh   -> RefreshService.execute()     -> TokenResponse
```

### 2.4 Auth Dependencies (fix)

`get_current_user` precisa buscar o User real do banco:

```python
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    user = await user_repo.get_by_id(UUID(user_id))
    if not user or not user.is_active:
        raise UnauthorizedException()
    return user
```

`require_role` deve retornar o User tipado:

```python
def require_role(*roles: UserRole):
    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise ForbiddenException()
        return user
    return checker
```

### 2.5 User Services

#### GetProfileService
Trivial — recebe User do dependency, retorna UserResponse.

#### UpdateProfileService
Recebe User + UserUpdate (apenas `name` e `password` permitidos para o proprio usuario).

#### ListUsersService
Recebe offset/limit, delega ao repository.

### 2.6 User Routes

```
GET  /api/users/me   -> get_current_user dependency -> UserResponse
PUT  /api/users/me   -> UpdateProfileService.execute() -> UserResponse
GET  /api/users      -> require_role(ADMIN) -> ListUsersService.execute() -> list[UserResponse]
```

### 2.7 Register Routers

Editar `app/core/app.py` para incluir:
```python
from app.modules.auth.routes import router as auth_router
from app.modules.users.routes import router as users_router
app.include_router(auth_router)
app.include_router(users_router)
```

---

## 3. Frontend — Detalhamento

### 3.1 shadcn Components Necessarios

Instalar via CLI:
```bash
npx shadcn@latest add input label card alert
```

### 3.2 LoginForm Component

```
frontend/components/features/auth/login-form.tsx
```

- Usa React Hook Form + zod para validacao
- Campos: email (EmailStr), password (min 8 chars)
- Chama `login()` da API, depois `useAuthStore.setAuth()`
- Armazena tokens em localStorage (via Zustand persist)
- Redireciona para /dashboard via `router.push()`
- Estados: idle, loading (spinner no botao), error (mensagem inline)
- Link para /register

### 3.3 RegisterForm Component

```
frontend/components/features/auth/register-form.tsx
```

- Campos: name, email, password, confirmPassword
- Validacao: email format, password min 8, passwords match
- Chama `register()` da API
- Sucesso: redirect para /login com toast "Conta criada com sucesso"
- Erro: mensagem inline (email ja existe, etc)
- Link para /login

### 3.4 API Client — Refresh Token Retry

Editar interceptor de response em `client.ts`:
```typescript
// On 401, try refresh token before redirecting
const refreshToken = localStorage.getItem("refresh_token");
if (refreshToken && !originalRequest._retry) {
    originalRequest._retry = true;
    const { data } = await axios.post("/api/auth/refresh", { refresh_token: refreshToken });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
    return apiClient(originalRequest);
}
```

### 3.5 Auth Middleware (Route Protection)

```
frontend/middleware.ts
```

Next.js middleware que:
- Verifica se existe `access_token` no cookie/localStorage
- Se nao autenticado e rota e /(dashboard)/*: redirect para /login
- Se autenticado e rota e /(auth)/*: redirect para /dashboard

**Nota:** Como localStorage nao e acessivel no middleware do Next.js (server-side), usaremos uma abordagem client-side com um `AuthGuard` component no dashboard layout que verifica o store e redireciona.

### 3.6 AuthGuard Component

```
frontend/components/features/auth/auth-guard.tsx
```

```typescript
"use client";
export function AuthGuard({ children }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated]);
  if (!isAuthenticated) return null; // or loading spinner
  return children;
}
```

Integrar no `(dashboard)/layout.tsx`.

---

## 4. Schemas e Contratos de API

### Auth Endpoints

#### POST /api/auth/login
```json
// Request
{ "email": "carlos@igreja.com", "password": "minhasenha123" }

// Response 200
{ "access_token": "eyJ...", "refresh_token": "eyJ...", "token_type": "bearer" }

// Response 401
{ "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" }
```

#### POST /api/auth/register
```json
// Request
{ "email": "novo@igreja.com", "password": "minhasenha123", "name": "Novo Editor" }

// Response 201
{ "id": "uuid", "email": "novo@igreja.com", "name": "Novo Editor", "role": "editor", "is_active": true, "created_at": "..." }

// Response 409
{ "code": "CONFLICT", "message": "Email 'novo@igreja.com' is already registered" }
```

#### POST /api/auth/refresh
```json
// Request
{ "refresh_token": "eyJ..." }

// Response 200
{ "access_token": "eyJ...", "refresh_token": "eyJ...", "token_type": "bearer" }
```

### User Endpoints

#### GET /api/users/me
```json
// Response 200 (requires auth)
{ "id": "uuid", "email": "carlos@igreja.com", "name": "Carlos", "role": "editor", "is_active": true, "created_at": "..." }
```

#### PUT /api/users/me
```json
// Request (requires auth)
{ "name": "Carlos Silva" }

// Response 200
{ "id": "uuid", "email": "carlos@igreja.com", "name": "Carlos Silva", "role": "editor", "is_active": true, "created_at": "..." }
```

#### GET /api/users
```json
// Response 200 (requires admin role)
[
  { "id": "uuid", "email": "carlos@igreja.com", "name": "Carlos", "role": "editor", "is_active": true, "created_at": "..." }
]
```

---

## 5. Ordem de Implementacao

| Passo | O que | Depende de |
|---|---|---|
| 1 | Alembic migration (users table) | - |
| 2 | Auth services (login, register, refresh) | Migration |
| 3 | Fix auth dependencies (get_current_user from DB) | - |
| 4 | Auth routes | Services + Dependencies |
| 5 | User services (profile, list) | - |
| 6 | User routes | User services + Auth dependencies |
| 7 | Register routers in app.py | Routes |
| 8 | Seed script (create admin user) | Migration |
| 9 | shadcn components (input, label, card, alert) | - |
| 10 | LoginForm component | shadcn + API client |
| 11 | RegisterForm component | shadcn + API client |
| 12 | Update login/register pages | Form components |
| 13 | AuthGuard component | Auth store |
| 14 | Integrate AuthGuard in dashboard layout | AuthGuard |
| 15 | API client refresh retry | - |
| 16 | Backend tests | All backend done |

---

## 6. Testes

### Backend (pytest + httpx AsyncClient)

- `test_login_success` — login valido retorna tokens
- `test_login_invalid_credentials` — email/senha errados retorna 401
- `test_login_disabled_account` — conta inativa retorna 403
- `test_register_success` — registro cria usuario com role editor
- `test_register_duplicate_email` — email duplicado retorna 409
- `test_refresh_success` — refresh token valido retorna novos tokens
- `test_refresh_expired` — refresh token expirado retorna 401
- `test_get_me` — usuario autenticado recebe seu perfil
- `test_get_me_unauthorized` — sem token retorna 401
- `test_update_me` — atualiza nome com sucesso
- `test_list_users_admin` — admin ve lista de usuarios
- `test_list_users_editor_forbidden` — editor recebe 403

### Frontend (vitest ou jest — se configurado)

- LoginForm renderiza campos e botao
- LoginForm submete e redireciona no sucesso
- LoginForm exibe erro em credenciais invalidas
- RegisterForm valida confirmacao de senha
- AuthGuard redireciona se nao autenticado
