# PRD — KAI-57: Autenticacao e Controle de Acesso (Roles)

## Milestone: Fase 1 — MVP | Prioridade: Urgente

---

## 1. Contexto

O sistema precisa de autenticacao segura e controle de acesso por roles antes de qualquer outra funcionalidade ser exposta. Sem auth, o pipeline de processamento de videos fica aberto e vulneravel. Esta task implementa o RF-08 do PRD principal.

## 2. Objetivo

Implementar autenticacao completa (login, registro, refresh token) e controle de acesso baseado em roles (`editor` e `admin`), permitindo que apenas usuarios autorizados acessem o sistema e que acoes criticas (publicar, gerenciar usuarios) sejam restritas a admins.

## 3. Escopo

### Incluido

| Funcionalidade | Descricao |
|---|---|
| Login com email/senha | Autenticacao via JWT (access + refresh token) |
| Registro de usuarios | Criacao de conta com role padrao `editor` |
| Refresh token | Renovacao de sessao sem re-login |
| Roles: editor e admin | Editor: submeter, processar, revisar. Admin: idem + publicar + gerenciar usuarios |
| Protecao de rotas (backend) | Middleware que valida JWT e verifica role |
| Protecao de rotas (frontend) | Redirect para /login se nao autenticado |
| Pagina de login | Formulario com email/senha, validacao, feedback de erro |
| Pagina de registro | Formulario com nome/email/senha, validacao |
| Endpoint GET /me | Retorna perfil do usuario autenticado |
| Endpoint PUT /me | Atualiza perfil proprio |
| Endpoint GET /users (admin) | Lista todos os usuarios |
| Rate limiting no login | Max 5 tentativas por 15 min |
| Sessao com expiracao | Access token: 8h, refresh token: 7 dias |

### Fora do Escopo (V1)

- OAuth social (Google, GitHub)
- Recuperacao de senha / email de reset
- 2FA / MFA
- Gerenciamento de usuarios pelo admin (criar/editar/desativar) — sera task separada
- Audit log de acoes — sera task separada

## 4. Personas Impactadas

- **Editor (Carlos)**: Precisa fazer login para acessar o sistema e processar videos
- **Admin (Pastora Ana)**: Precisa de acesso elevado para publicar videos e ver lista de usuarios

## 5. User Stories

### US-01: Login
**Como** editor, **quero** fazer login com email e senha **para** acessar o sistema de forma segura.

**Criterios de Aceitacao:**
- AC-01.1: Campo de email com validacao de formato
- AC-01.2: Campo de senha com minimo 8 caracteres
- AC-01.3: Mensagem de erro generica em caso de credenciais invalidas ("Email ou senha incorretos")
- AC-01.4: Apos login bem-sucedido, redireciona para /dashboard
- AC-01.5: Token armazenado de forma segura no client (localStorage com Zustand persist)
- AC-01.6: Rate limiting: 5 tentativas falhas por IP em 15 minutos

### US-02: Registro
**Como** admin, **quero** que novos editores possam se registrar **para** que tenham acesso ao sistema.

**Criterios de Aceitacao:**
- AC-02.1: Campos: nome, email, senha, confirmacao de senha
- AC-02.2: Validacao de email unico (erro claro se ja existe)
- AC-02.3: Senha minima de 8 caracteres
- AC-02.4: Role padrao: `editor`
- AC-02.5: Apos registro, redireciona para /login com mensagem de sucesso

### US-03: Sessao Persistente
**Como** editor, **quero** que minha sessao persista por 8 horas **para** nao precisar fazer login repetidamente.

**Criterios de Aceitacao:**
- AC-03.1: Access token expira em 8 horas (480 min)
- AC-03.2: Refresh token expira em 7 dias
- AC-03.3: Client renova automaticamente o access token antes de expirar
- AC-03.4: Se refresh token expirar, redireciona para /login

### US-04: Protecao de Rotas
**Como** sistema, **quero** proteger todas as rotas do dashboard **para** que usuarios nao autenticados sejam redirecionados.

**Criterios de Aceitacao:**
- AC-04.1: Qualquer rota sob /(dashboard) redireciona para /login se nao autenticado
- AC-04.2: Rotas de admin retornam 403 se usuario e `editor`
- AC-04.3: API retorna 401 para requests sem token valido

### US-05: Perfil do Usuario
**Como** editor, **quero** ver e editar meu perfil **para** manter meus dados atualizados.

**Criterios de Aceitacao:**
- AC-05.1: GET /api/users/me retorna dados do usuario autenticado
- AC-05.2: PUT /api/users/me permite atualizar nome e senha
- AC-05.3: Nao permite alterar email ou role

### US-06: Listagem de Usuarios (Admin)
**Como** admin, **quero** ver a lista de usuarios **para** saber quem tem acesso ao sistema.

**Criterios de Aceitacao:**
- AC-06.1: GET /api/users retorna lista paginada
- AC-06.2: Apenas admins podem acessar (403 para editors)
- AC-06.3: Lista exibe: nome, email, role, status (ativo/inativo), data de criacao

## 6. Requisitos Nao-Funcionais

| Requisito | Meta |
|---|---|
| Senha hash | bcrypt com custo >= 12 |
| Token storage | JWT HS256, secret via env var |
| Rate limiting | 5 tentativas / 15 min no login |
| Tempo de resposta | < 500ms (p95) para auth endpoints |
| Seguranca | Tokens nunca em logs; HTTPS em producao |

## 7. Metricas de Sucesso

| Metrica | Meta |
|---|---|
| Login funcional end-to-end | 100% dos casos de teste |
| Tempo de login (UX) | < 2s do clique ao redirect |
| Protecao de rotas | 0 rotas acessiveis sem auth |

## 8. Dependencias

- PostgreSQL rodando (Docker Compose)
- Alembic configurado para migrations
- Frontend com shadcn/ui components instalados
