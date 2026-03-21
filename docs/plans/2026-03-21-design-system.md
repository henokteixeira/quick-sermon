# Design System — Quick Sermon

## Direção Visual

**Vibe:** Warm & Earthy — acolhedor, não corporativo.
**Público:** Voluntários de mídia de igreja, não-técnicos.

## Palette de Cores

Baseada em Tailwind `stone` (warm gray) + `amber` como acento.

### Tokens CSS (HSL)

| Token | Light | Uso |
|---|---|---|
| `--background` | stone-50 (60 9% 97.8%) | Fundo geral |
| `--foreground` | stone-900 (24 10% 10%) | Texto principal |
| `--card` | white (0 0% 100%) | Cards, painéis |
| `--card-foreground` | stone-900 | Texto em cards |
| `--primary` | stone-800 (20 6% 20%) | Botões, ações |
| `--primary-foreground` | stone-50 | Texto em primary |
| `--secondary` | stone-100 (60 5% 96%) | Áreas secundárias |
| `--secondary-foreground` | stone-800 | Texto em secondary |
| `--accent` | amber-500 (38 92% 50%) | Destaques, ativo |
| `--accent-foreground` | stone-900 | Texto em accent |
| `--muted` | stone-100 | Fundos sutis |
| `--muted-foreground` | stone-500 (25 6% 45%) | Texto secundário |
| `--destructive` | red-500 (0 84% 60%) | Erros |
| `--border` | stone-200 (20 6% 90%) | Bordas |
| `--input` | stone-200 | Borda de inputs |
| `--ring` | amber-500 | Focus ring |
| `--sidebar` | stone-900 (24 10% 10%) | Sidebar fundo |
| `--sidebar-foreground` | stone-300 | Sidebar texto |
| `--sidebar-accent` | amber-500 | Sidebar item ativo |

### Dark Mode

Fora do escopo V1. Manter estrutura mas não ativar.

## Tipografia

| Uso | Font | Weight |
|---|---|---|
| Display / Brand | DM Serif Display | 400 |
| Body / UI | Inter | 400, 500, 600 |

DM Serif Display carregada no root layout via `next/font/google` como CSS variable `--font-serif`.

## Espaçamento

Escala padrão do Tailwind (4px base). Sem customização necessária.

## Border Radius

`--radius: 0.625rem` (10px) — levemente mais arredondado que o padrão (8px) pra suavizar.

## Escopo

- Atualizar CSS variables em globals.css
- Atualizar tailwind.config.ts com tokens
- Carregar DM Serif Display no root layout
- Componentes shadcn herdam automaticamente
