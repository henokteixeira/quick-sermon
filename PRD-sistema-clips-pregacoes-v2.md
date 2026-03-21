# PRD — Sistema de Clips de Pregações
## Versão 2.0 | Março 2026 | Status: Em Revisão

---

## Índice

1. [Visão do Produto](#1-visão-do-produto)      
2. [Objetivos e Métricas de Sucesso](#2-objetivos-e-métricas-de-sucesso)
3. [Personas](#3-personas)
4. [Escopo](#4-escopo)
5. [Arquitetura de Fluxo](#5-arquitetura-de-fluxo)
6. [Requisitos Funcionais](#6-requisitos-funcionais)
7. [Requisitos Não-Funcionais](#7-requisitos-não-funcionais)
8. [Fluxos de Erro e Edge Cases](#8-fluxos-de-erro-e-edge-cases)
9. [Riscos e Dependências](#9-riscos-e-dependências)
10. [Roadmap](#10-roadmap)
11. [Glossário](#11-glossário)

---

## 1. Visão do Produto

### 1.1 Problema

Editores de mídia em igrejas gastam **2–4 horas por vídeo** em tarefas manuais e repetitivas:

| Etapa Manual | Tempo Estimado |
|---|---|
| Assistir a live para localizar a pregação | 30–60 min |
| Anotar timestamps | 10–15 min |
| Download e corte no editor | 40–60 min |
| Criação de título, descrição, thumbnail | 20–30 min |
| Upload e publicação | 10–15 min |
| **Total** | **~2–4 horas** |

**Consequências diretas:**
- Publicação com atraso de 24–72h após o culto
- Burnout de voluntários
- Inconsistência na qualidade e formatação
- Custo com ferramentas pagas (~$50–100/mês)

### 1.2 Solução

Plataforma web que automatiza o pipeline completo: da URL da live até o vídeo publicado no YouTube, com intervenção humana mínima apenas na etapa de revisão e aprovação.

**Meta:** processar um culto completo em **menos de 20 minutos**, com **menos de 10 minutos de interação humana**.

### 1.3 Declaração de Valor

> *Para editores de mídia voluntários em igrejas, que hoje gastam horas em tarefas manuais e repetitivas, o Sistema de Clips é uma plataforma de automação que detecta, processa e publica pregações automaticamente — diferente de ferramentas genéricas de edição, nossa solução é construída especificamente para o fluxo de cultos, com revisão humana integrada antes da publicação.*

---

## 2. Objetivos e Métricas de Sucesso

### 2.1 Objetivos de Negócio

| # | Objetivo | Indicador | Meta |
|---|---|---|---|
| O1 | Reduzir tempo de produção | Tempo médio por vídeo | < 20 min |
| O2 | Aumentar volume de publicações | Vídeos/semana por editor | 8–10 (vs. 2–3 atual) |
| O3 | Manter custo operacional baixo | Custo mensal | < $50/mês |
| O4 | Reduzir tempo até publicação | Horas após o culto | < 12h |

### 2.2 Critérios de Go-Live

O produto só entra em produção se **todos** os critérios abaixo forem atendidos:

**Obrigatórios (bloqueantes):**
- [ ] Pipeline completo (submissão → publicação) funciona end-to-end sem falhas críticas
- [ ] Tempo de processamento de vídeo de 1h é < 20 minutos
- [ ] Precisão de detecção de timestamps ≥ 80% em conjunto de testes de 20 vídeos
- [ ] Upload para YouTube sem falha em 100% dos casos de teste

**Aceitáveis no lançamento:**
- Processamento sequencial (fila de 1 por vez)
- Thumbnails geradas manualmente pelo editor
- Analytics básico (somente contagem de vídeos processados)

**Inaceitáveis (zero tolerância):**
- Perda ou degradação de qualidade de vídeo/áudio
- Falha de segurança (exposição de tokens, dados de usuários)
- Bug que impeça o fluxo principal de funcionar

### 2.3 Métricas de Produto (pós-lançamento)

| Métrica | Baseline Atual | Meta 30 dias | Meta 90 dias |
|---|---|---|---|
| Tempo médio de produção | 2–4h | < 30 min | < 20 min |
| Taxa de detecção correta | N/A | ≥ 80% | ≥ 85% |
| Taxa de aprovação sem edição manual | N/A | ≥ 50% | ≥ 60% |
| NPS dos editores | N/A | ≥ 30 | ≥ 40 |

---

## 3. Personas

### 3.1 Persona Primária — Editor de Mídia Voluntário

**Carlos, 28 anos | Coordenador de Mídia**

- Trabalha full-time em TI durante a semana; volunterio aos finais de semana
- Conhecimento básico de edição de vídeo (não é especialista)
- Usa computador pessoal (sem servidor dedicado, mínimo 8GB RAM)

**Jobs to be done:**
1. Publicar a pregação rapidamente após o culto
2. Manter padrão de qualidade sem esforço manual
3. Ter controle para corrigir quando a IA erra

**Frustrações atuais:**
- Processo lento consome o domingo inteiro
- Ferramentas genéricas têm curva de aprendizado alta
- Quando erra um timestamp, tem que recomeçar tudo

### 3.2 Persona Secundária — Líder de Comunicação

**Pastora Ana, 42 anos | Líder de Comunicação**

- Sem habilidades técnicas de edição
- Foco em estratégia, alcance e precisão teológica

**Jobs to be done:**
1. Garantir que o conteúdo publicado está teologicamente correto
2. Aprovar títulos e descrições antes de publicar
3. Saber o status de cada vídeo sem perguntar ao Carlos

---

## 4. Escopo

### 4.1 Incluído na V1

| Funcionalidade | Prioridade |
|---|---|
| Detecção automática de timestamps da pregação | Must Have |
| Download otimizado do segmento via yt-dlp | Must Have |
| Corte automático de vídeo | Must Have |
| Upload para YouTube (não-listado por padrão) | Must Have |
| Geração de 5 opções de título (IA) | Must Have |
| Geração de descrição estruturada (IA) | Must Have |
| Geração de mensagem para WhatsApp (IA) | Must Have |
| Interface de revisão com preview do YouTube | Must Have |
| Publicação com um clique | Must Have |
| Autenticação e controle de acesso por roles | Must Have |
| Ajuste manual de timestamps (fallback) | Must Have |
| Dashboard com status em tempo real | Should Have |
| Detecção de versículos citados | Could Have |

### 4.2 Fora do Escopo (V1)

- Publicação em outras plataformas (Instagram, TikTok, Shorts)
- Geração e edição de legendas
- Geração automática de thumbnails
- Clips curtos / Reels
- Processamento paralelo (fila com mais de 1 simultâneo)
- Suporte a idiomas além do português
- Aplicativo mobile
- Multi-tenant (múltiplas igrejas)

### 4.3 Roadmap Futuro

| Versão | Funcionalidades |
|---|---|
| V2 | Legendas automáticas (Whisper), LLMs na nuvem (Gemini/ChatGPT) para geração de conteúdo, clips curtos para Reels/Shorts |
| V3 | Thumbnails com IA, publicação multiplataforma, analytics avançado |
| V4 | Multi-tenant, aplicativo mobile |

---

## 5. Arquitetura de Fluxo

### 5.1 Fluxo Principal (Happy Path)

```
[Editor cola URL da live]
        ↓
[Sistema valida URL e exibe preview]
        ↓
[IA detecta timestamps da pregação]
    ↓           ↓
[Confiança ≥ 80%]  [Confiança < 80%]
    ↓                    ↓
[Auto-confirma]    [Editor ajusta manualmente]
        ↓
[Editor clica "Processar"]
        ↓
[Pipeline automático executa]
  ├── Download do segmento (yt-dlp)
  ├── Corte do vídeo (FFmpeg)
  ├── Upload para YouTube (não-listado)
  └── Geração de conteúdo (LLM local)
        ↓
[Notificação: "Pronto para revisão"]
        ↓
[Editor acessa página de revisão]
  ├── Preview do vídeo no YouTube
  ├── Seleciona título (5 opções)
  ├── Revisa/edita descrição
  └── Copia mensagem WhatsApp
        ↓
[Editor clica "Publicar"]
        ↓
[Vídeo torna-se público no YouTube]
```

### 5.2 Casos de Uso

#### UC-01: Processamento de Culto Semanal
**Ator:** Editor | **Frequência:** 1–2x/semana

| Passo | Ação | Responsável |
|---|---|---|
| 1 | Cola URL da live após o culto | Editor |
| 2 | Valida URL e exibe preview | Sistema |
| 3 | Detecta timestamps automaticamente | Sistema (IA) |
| 4 | Valida ou ajusta timestamps | Editor |
| 5 | Clica "Processar" | Editor |
| 6 | Executa pipeline (~15 min) | Sistema |
| 7 | Notifica conclusão | Sistema |
| 8 | Acessa revisão, seleciona título | Editor |
| 9 | Clica "Publicar" | Editor |
| 10 | Vídeo fica público; copia link/WhatsApp | Editor |

**Tempo esperado de interação humana:** 8–12 min

#### UC-02: Processamento em Lote
**Ator:** Editor | **Frequência:** Mensal

1. Editor submete múltiplas URLs (até 10)
2. Sistema enfileira e processa sequencialmente
3. Notifica quando todos estão prontos
4. Editor revisa e publica em sequência
5. Pode agendar datas de publicação individuais

#### UC-03: Ajuste Manual de Timestamps
**Ator:** Editor | **Frequência:** ~10–15% dos vídeos

1. Sistema exibe alerta: *"Confiança baixa (X%) — revise os timestamps"*
2. Editor vê player com marcadores visuais arrastáveis
3. Ajusta início e fim da pregação
4. Confirma; sistema continua pipeline normalmente

---

## 6. Requisitos Funcionais

Cada requisito inclui: descrição, critérios de aceitação (AC) e comportamento esperado em caso de falha.

---

### RF-01 — Submissão de Vídeo

**Descrição:** O sistema deve aceitar a URL de uma live do YouTube e validá-la antes de iniciar qualquer processamento.

**Critérios de Aceitação:**
- AC-01.1: Dado que o editor insere uma URL válida do YouTube, o sistema exibe preview com título, duração e thumbnail em até 3 segundos.
- AC-01.2: Dado que o editor insere uma URL inválida (não-YouTube, vídeo removido, privado), o sistema exibe mensagem de erro específica e não avança.
- AC-01.3: Dado que o vídeo tem duração menor que 20 minutos, o sistema exibe aviso *"Vídeo muito curto para conter uma pregação — deseja continuar?"* e aguarda confirmação.
- AC-01.4: O campo de URL aceita os formatos: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/live/`.

**Falha:** Ver [EC-01](#ec-01--url-inválida-ou-inacessível).

---

### RF-02 — Detecção Automática de Timestamps

**Descrição:** O sistema deve identificar automaticamente o início e o fim da pregação dentro da live.

**Critérios de Aceitação:**
- AC-02.1: O sistema retorna timestamps de início e fim com precisão de ±2 minutos em ≥ 85% dos vídeos do conjunto de testes.
- AC-02.2: O sistema exibe um indicador de confiança (%) junto aos timestamps sugeridos.
- AC-02.3: Quando confiança < 80%, o sistema exibe alerta visual e habilita automaticamente o editor manual de timestamps.
- AC-02.4: O sistema considera o padrão de culto: louvor → pregação → encerramento. Vídeos fora desse padrão devem ir para revisão manual.
- AC-02.5: O tempo máximo para retornar os timestamps é 60 segundos após submissão da URL.

**Falha:** Ver [EC-02](#ec-02--detecção-com-baixa-confiança-ou-falha-total).

---

### RF-03 — Download Otimizado do Segmento

**Descrição:** O sistema deve baixar apenas o trecho da live correspondente à pregação, na melhor qualidade disponível.

**Critérios de Aceitação:**
- AC-03.1: O download inclui apenas o segmento entre os timestamps confirmados (± 30 segundos de margem em cada extremo).
- AC-03.2: A qualidade mínima é 1080p. Se indisponível, usa a maior disponível e registra log de aviso.
- AC-03.3: O progresso de download é exibido em tempo real (barra de progresso com % e velocidade estimada).
- AC-03.4: O arquivo baixado é armazenado temporariamente e removido automaticamente após upload bem-sucedido.
- AC-03.5: Downloads acima de 2GB geram alerta ao editor antes de iniciar.

**Falha:** Ver [EC-03](#ec-03--falha-no-download).

---

### RF-04 — Corte Automático de Vídeo

**Descrição:** O sistema deve cortar o vídeo baixado nos timestamps confirmados, sem perda de qualidade.

**Critérios de Aceitação:**
- AC-04.1: O vídeo de saída começa exatamente no timestamp de início (tolerância de ±1 segundo).
- AC-04.2: O vídeo de saída termina exatamente no timestamp de fim (tolerância de ±1 segundo).
- AC-04.3: A qualidade de vídeo e áudio do arquivo de saída é idêntica ao arquivo de entrada (sem reencoding desnecessário).
- AC-04.4: O corte é feito em menos de 2 minutos para vídeos de até 90 minutos.

**Falha:** Ver [EC-04](#ec-04--falha-no-corte-de-vídeo).

---

### RF-05 — Upload para YouTube

**Descrição:** O sistema deve fazer upload automático do vídeo processado para o canal do YouTube da igreja.

**Critérios de Aceitação:**
- AC-05.1: O vídeo é enviado como "não-listado" por padrão; nunca como público automaticamente.
- AC-05.2: O upload inclui: arquivo de vídeo, título provisório, descrição provisória.
- AC-05.3: O progresso de upload é exibido em tempo real.
- AC-05.4: Após upload bem-sucedido, o sistema retorna o link do vídeo no YouTube para uso na revisão.
- AC-05.5: O sistema respeita os limites de quota da YouTube Data API v3 (10.000 unidades/dia) e exibe aviso quando ≥ 80% da quota for consumida.
- AC-05.6: A autenticação com a API do YouTube usa OAuth 2.0; tokens são armazenados de forma segura (não em texto plano).

**Falha:** Ver [EC-05](#ec-05--falha-no-upload-para-o-youtube).

---

### RF-06 — Geração de Conteúdo com IA

**Descrição:** O sistema deve gerar automaticamente títulos, descrição e mensagem de WhatsApp para a pregação.

> **V1:** Processamento via LLM local (ex: Ollama). Sem custo por chamada, mas dependente dos recursos de hardware da máquina.
> **V2 (planejado):** Migração para LLMs na nuvem (Gemini, ChatGPT) para maior qualidade de geração.

**Critérios de Aceitação:**

**Títulos (RF-07a):**
- AC-07.1: O sistema gera exatamente 5 opções de título.
- AC-07.2: Cada título tem entre 50 e 60 caracteres.
- AC-07.3: Os títulos são variados: ao menos 1 com pergunta, 1 com versículo, 1 com palavra-chave de busca.
- AC-07.4: O editor seleciona 1 título; a seleção é refletida imediatamente no preview do YouTube.

**Descrição (RF-07b):**
- AC-07.5: A descrição segue template padronizado: resumo da pregação, pontos principais, versículos citados, hashtags, link do canal.
- AC-07.6: A descrição tem entre 300 e 500 palavras.
- AC-07.7: O editor pode editar a descrição em campo de texto livre antes de publicar.

**WhatsApp (RF-07c):**
- AC-07.8: A mensagem tem entre 100 e 150 palavras, em tom conversacional.
- AC-07.9: A mensagem inclui o link do vídeo no YouTube.
- AC-07.10: Botão "Copiar" copia a mensagem completa para a área de transferência com um clique.

**Falha:** Ver [EC-07](#ec-07--falha-na-geração-de-conteúdo).

---

### RF-07 — Interface de Revisão e Publicação

**Descrição:** O editor deve conseguir revisar todo o conteúdo gerado e publicar o vídeo em uma única tela.

**Critérios de Aceitação:**
- AC-08.1: A página de revisão exibe: player do YouTube embutido, seletor de título, editor de descrição, preview de legendas e mensagem de WhatsApp.
- AC-08.2: O botão "Publicar" só fica habilitado após o editor selecionar um título.
- AC-08.3: Ao clicar "Publicar", o sistema exibe confirmação *"Tem certeza? O vídeo será tornado público."* antes de executar.
- AC-08.4: Após publicação bem-sucedida, o sistema exibe link público e botão de cópia.
- AC-08.5: O editor pode salvar o estado da revisão e retomar depois sem perder alterações.

---

### RF-08 — Autenticação e Controle de Acesso

**Descrição:** O sistema deve ter autenticação segura e dois níveis de acesso.

**Critérios de Aceitação:**
- AC-09.1: Dois roles: `editor` (pode submeter, processar e revisar) e `admin` (idem + pode publicar e gerenciar usuários).
- AC-09.2: Sessão expira após 8 horas de inatividade.
- AC-09.3: Senhas armazenadas com hash bcrypt (custo ≥ 12).
- AC-09.4: Tentativas de login falhas são limitadas a 5 por 15 minutos (rate limiting).
- AC-09.5: Tokens OAuth do YouTube são armazenados criptografados (AES-256) no banco de dados.

---

### RF-09 — Dashboard e Rastreamento

**Descrição:** O sistema deve oferecer visibilidade do pipeline de produção.

**Critérios de Aceitação:**
- AC-10.1: O dashboard exibe lista de vídeos com: título, status atual, data de submissão, editor responsável.
- AC-10.2: Os status possíveis são: `aguardando`, `detectando`, `processando`, `aguardando revisão`, `publicado`, `erro`.
- AC-10.3: O status é atualizado em tempo real (sem necessidade de recarregar a página).
- AC-10.4: Vídeos com status `erro` exibem descrição do erro e ação recomendada.
- AC-10.5: O dashboard tem filtro por status e busca por título/pregador.

---

## 7. Requisitos Não-Funcionais

### RNF-01 — Performance

| Requisito | Meta |
|---|---|
| Tempo de detecção de timestamps | < 60 segundos |
| Tempo de processamento (vídeo de 1h) | < 15 minutos |
| Tempo de carregamento de páginas | < 3 segundos |
| Latência de atualização de status | < 5 segundos |
| Tempo de resposta da API interna | < 500ms (p95) |

### RNF-02 — Confiabilidade

- Uptime mínimo de 95% (V1)
- Processamento com falha deve reiniciar automaticamente até 2 vezes antes de marcar como `erro`
- Nenhuma perda de dados de vídeo já processado por falha do sistema
- Logs de todas as etapas do pipeline armazenados por 30 dias

### RNF-03 — Segurança

- Comunicação HTTPS em todos os endpoints
- Dados em repouso criptografados (AES-256)
- Tokens OAuth nunca expostos em logs ou respostas de API
- Conformidade com LGPD: dados pessoais mínimos coletados, política de retenção clara
- Logs de auditoria para ações de publicação (quem publicou, quando)

### RNF-04 — Usabilidade

- Um novo editor consegue processar seu primeiro vídeo sem treinamento em menos de 10 minutos
- Interface responsiva: funciona em desktop e tablet (mínimo 768px de largura)
- Mensagens de erro são escritas em linguagem clara, sem jargão técnico, sempre com ação recomendada

### RNF-05 — Custo Operacional

- Custo total de APIs e infraestrutura < $50/mês
- Processar vídeos com modelos de IA locais (Whisper, LLM local) para evitar custo por chamada
- Monitorar consumo de quota da YouTube API; alertar antes de atingir limite

---

## 8. Fluxos de Erro e Edge Cases

### EC-01 — URL Inválida ou Inacessível

**Gatilhos:**
- URL não é do YouTube
- Vídeo foi removido ou tornado privado
- Vídeo está em conta bloqueada geograficamente
- Live ainda está ao vivo (não finalizada)

**Comportamento esperado:**

| Caso | Mensagem ao Usuário | Ação do Sistema |
|---|---|---|
| URL não é YouTube | *"URL inválida. Cole um link do YouTube."* | Bloqueia submissão |
| Vídeo removido/privado | *"Vídeo inacessível. Verifique se o link está correto e se o vídeo é público ou não-listado."* | Bloqueia submissão |
| Live ainda ao vivo | *"Este vídeo ainda está transmitindo ao vivo. Aguarde o fim da live para processar."* | Bloqueia submissão |
| Bloqueio geográfico | *"Não foi possível acessar este vídeo. Pode estar bloqueado na sua região."* | Bloqueia submissão |

---

### EC-02 — Detecção com Baixa Confiança ou Falha Total

**Gatilhos:**
- Culto com formato atípico (somente pregação, sem louvor)
- Múltiplos pregadores no mesmo culto
- Áudio de baixa qualidade dificultando análise
- Falha no modelo de detecção

**Comportamento esperado:**

| Caso | Mensagem ao Usuário | Ação do Sistema |
|---|---|---|
| Confiança 60–79% | *"Confiança baixa. Revise os timestamps sugeridos antes de continuar."* | Abre editor manual automaticamente; exibe timestamps sugeridos como ponto de partida |
| Confiança < 60% | *"Não conseguimos detectar a pregação automaticamente. Defina os timestamps manualmente."* | Abre editor manual sem sugestão automática |
| Falha total do modelo | *"Erro na detecção automática. Defina os timestamps manualmente."* | Registra erro no log; oferece editor manual |
| Múltiplos segmentos detectados | *"Detectamos mais de um possível trecho de pregação. Selecione o correto."* | Exibe lista de segmentos candidatos para o editor escolher |

**Editor manual de timestamps:**
- Player de vídeo com marcadores arrastáveis
- Campo de entrada manual de tempo (HH:MM:SS)
- Botões "Ir para início" e "Ir para fim" para verificação rápida
- Preview do frame no marcador atual

---

### EC-03 — Falha no Download

**Gatilhos:**
- Conexão de internet interrompida
- YouTube bloqueia o yt-dlp
- Vídeo muito grande (> 10GB)
- Disco cheio no servidor
- Timeout (> 30 minutos)

**Comportamento esperado:**

| Caso | Mensagem ao Usuário | Ação do Sistema |
|---|---|---|
| Conexão interrompida | *"Download pausado por falha de conexão. Tentando reconectar..."* | Tenta retomar até 3x com backoff exponencial |
| Bloqueio do yt-dlp | *"Não foi possível baixar o vídeo. Tente novamente em alguns minutos."* | Registra erro; notifica admin para atualizar yt-dlp |
| Disco cheio | *"Espaço em disco insuficiente. Entre em contato com o administrador."* | Registra erro crítico; notifica admin por email |
| Timeout | *"O download demorou mais que o esperado e foi cancelado. Tente novamente."* | Limpa arquivos parciais; libera o job da fila |
| Vídeo > 10GB | *"Vídeo muito grande para processar. Considere usar timestamps mais precisos para reduzir o segmento."* | Bloqueia download; sugere revisão dos timestamps |

---

### EC-04 — Falha no Corte de Vídeo

**Gatilhos:**
- Arquivo de vídeo corrompido após download
- Timestamps fora dos limites do vídeo
- Erro no FFmpeg

**Comportamento esperado:**

| Caso | Mensagem ao Usuário | Ação do Sistema |
|---|---|---|
| Arquivo corrompido | *"Erro no arquivo de vídeo. Tentando baixar novamente..."* | Deleta arquivo; reinicia download automaticamente (1x) |
| Timestamps inválidos | *"Os timestamps estão fora da duração do vídeo. Revise-os."* | Volta para tela de edição de timestamps |
| Erro no FFmpeg | *"Erro técnico no processamento. Tente novamente."* | Registra stack trace; marca job como `erro` |

---

### EC-05 — Falha no Upload para o YouTube

**Gatilhos:**
- Token OAuth expirado ou revogado
- Quota da API esgotada (10.000 unidades/dia)
- Arquivo de vídeo inválido para o YouTube
- Erro de rede durante upload

**Comportamento esperado:**

| Caso | Mensagem ao Usuário | Ação do Sistema |
|---|---|---|
| Token expirado | *"Sua conexão com o YouTube expirou. Clique aqui para reconectar."* | Redireciona para fluxo OAuth; mantém vídeo processado aguardando |
| Quota esgotada | *"Limite diário do YouTube atingido. O upload será retomado automaticamente amanhã."* | Agenda upload para 00:01 do dia seguinte; notifica editor |
| Erro de rede | *"Falha no envio. Tentando novamente..."* | Retoma upload de onde parou (resumable upload) até 3 tentativas |
| Formato inválido | *"O YouTube rejeitou o vídeo. Entre em contato com o administrador."* | Registra detalhes do erro da API; notifica admin |

---

### EC-06 — Falha na Geração de Conteúdo

**Gatilhos:**
- Modelo de IA local sem recursos suficientes
- Transcrição vazia ou com muito ruído
- Timeout na geração

**Comportamento esperado:**

| Caso | Mensagem ao Usuário | Ação do Sistema |
|---|---|---|
| Falha no LLM | *"Não conseguimos gerar os títulos automaticamente. Você pode digitá-los manualmente."* | Exibe campos editáveis em branco; não bloqueia o fluxo |
| Transcrição insuficiente | *"Pouco conteúdo para gerar descrição automática."* | Gera conteúdo mínimo com base nos metadados disponíveis |
| Timeout | *"A geração de conteúdo demorou mais que o esperado."* | Cancela geração; oferece campos manuais |

> **Princípio de design para erros:** nenhum erro deve bloquear completamente o fluxo. Sempre deve existir um caminho manual para que o editor possa continuar.

---

### EC-07 — Edge Cases de Vídeo

| Situação | Comportamento |
|---|---|
| Live com menos de 20 min | Aviso antes de processar; editor pode confirmar |
| Live com mais de 5 horas | Aviso sobre tempo de processamento estimado antes de iniciar |
| Vídeo já processado (URL duplicada) | *"Este vídeo já foi processado. Ver resultado anterior?"* com link |
| Pregação com mais de 2 horas | Aviso ao editor; processamento normal |
| Culto sem pregação identificável | Segue fluxo de detecção com baixa confiança (EC-02) |

---

## 9. Riscos e Dependências

### 9.1 Riscos

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | yt-dlp bloqueado pelo YouTube | Média | Alto | Monitorar updates; ter script de fallback; documentar processo de atualização |
| R2 | Quota da YouTube API insuficiente | Baixa | Alto | Monitorar consumo; implementar scheduler para respeitar limites; solicitar aumento de quota se necessário |
| R3 | Precisão de detecção < 80% | Média | Médio | Editor manual sempre disponível; coletar correções para melhorar modelo |
| R4 | Hardware insuficiente para LLM local (V1) | Média | Alto | Definir requisitos mínimos de hardware antes do deploy; testar em máquina equivalente à do editor; ter fallback para campos manuais |
| R4b | Custo de APIs de LLM na nuvem acima do orçamento (V2) | Baixa | Médio | Monitorar consumo; definir limite de tokens por vídeo; avaliar Gemini vs ChatGPT por custo-benefício antes de migrar |
| R5 | Mudança nos ToS do YouTube | Baixa | Alto | Monitorar comunicados; manter advogado/consultor de ToS |
| R6 | Baixa adoção pelos editores | Média | Alto | Beta com Carlos antes do lançamento; onboarding guiado no primeiro uso |

### 9.2 Dependências Externas

| Dependência | Uso | Risco | Alternativa |
|---|---|---|---|
| YouTube Data API v3 | Upload, publicação | Mudança de quota/ToS | Upload manual como fallback de último recurso |
| yt-dlp | Download de vídeos | Bloqueio pelo YouTube | Atualização frequente; comunidade ativa |
| FFmpeg | Corte de vídeo | Estável, baixo risco | — |
| LLM local (ex: Ollama) | Geração de conteúdo — **V1** | Recursos de hardware | Fallback para campos manuais |
| LLMs na nuvem (Gemini, ChatGPT) | Geração de conteúdo — **V2** | Custo por chamada; dependência de API externa | Fallback para LLM local |
| Whisper (OpenAI, local) | Geração de legendas — **V2** | Recursos de hardware | Versão menor do modelo em hardware fraco |

---

## 10. Roadmap

### Fase 1 — MVP (Semanas 1–6)
**Objetivo:** Fluxo completo funcional, mesmo que parcialmente manual

- [ ] Infraestrutura base (auth, banco, deploy)
- [ ] Submissão de URL e validação
- [ ] Download via yt-dlp + corte com FFmpeg
- [ ] Upload para YouTube via API
- [ ] Interface de revisão e publicação
- [ ] Dashboard básico de status

**Critério de conclusão:** Editor consegue processar um vídeo do início ao fim sem assistência técnica.

---

### Fase 2 — Automação com IA (Semanas 7–10)
**Objetivo:** Eliminar intervenção manual no pipeline

- [ ] Detecção automática de timestamps
- [ ] Geração de conteúdo com LLM local
- [ ] Editor manual de timestamps (fallback)
- [ ] Notificações em tempo real

**Critério de conclusão:** 80%+ dos vídeos processados sem ajuste manual de timestamps.

---

### Fase 3 — Qualidade e Polimento (Semanas 11–15)
**Objetivo:** Sistema estável e pronto para uso contínuo

- [ ] Processamento em lote (fila)
- [ ] Relatório básico de uso
- [ ] Testes de carga e otimização
- [ ] Documentação de usuário

**Critério de conclusão:** NPS ≥ 30 após 4 semanas de uso real.

---

## 11. Glossário

| Termo | Definição |
|---|---|
| Pregação | Momento do culto onde o pastor expõe um tema bíblico, geralmente 30–60 minutos |
| Louvor | Momento de adoração musical no culto, geralmente antes da pregação |
| Live | Transmissão ao vivo no YouTube |
| Timestamp | Marcador de tempo em vídeo no formato HH:MM:SS |
| Clip | Vídeo curto extraído de um trecho maior |
| Versículo | Referência a texto bíblico (ex: João 3:16) |
| Pipeline | Sequência de etapas automatizadas de processamento |
| yt-dlp | Ferramenta open-source de download de vídeos do YouTube |
| Whisper | Modelo de reconhecimento de voz da OpenAI, usado localmente |
| OAuth | Protocolo de autorização usado para integrar com o YouTube |
| Quota | Limite de chamadas à YouTube Data API (10.000 unidades/dia por padrão) |
| Não-listado | Visibilidade de vídeo no YouTube: acessível por link, não aparece em buscas |
| LLM | Large Language Model — modelo de linguagem usado para gerar títulos e descrições; local na V1 (Ollama), nuvem na V2 (Gemini, ChatGPT) |

---

**PRD — Sistema de Clips de Pregações**
**Versão:** 2.0 | **Público:** Time de Desenvolvimento | **Status:** Em Revisão
