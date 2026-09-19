---
status: accepted
date: 2026-04-20
---

# Detecção da Pregação sem IA no MVP

A Detecção usa apenas sinais determinísticos do YouTube: Capítulos casados por palavras-chave e, na falta deles, densidade de Legendas com tolerância de intervalo de 5 segundos e, se o bloco resultante for implausível, de 10 segundos. Nenhuma fase chama Whisper, detecção de voz ou LLM. Sete iterações com Whisper amostrado, silero-vad e LLM (Ollama e gpt-4o-mini) chegaram a no máximo 4 acertos em 10 no dataset de referência, contra 9 exigidos, com minutos de latência e custo por vídeo; preferimos entregar um MVP honesto, em que a Confiança sem IA não passa de 82 e o Editor confere o Trecho Sugerido à mão. O refinamento com IA vive em QS-75.

## Considered Options

- Cascata de cinco fases (Capítulos, Legendas, detecção de voz, Whisper amostrado, LLM): descartada pelo resultado acima.
- LLM sobre blocos agregados de Legendas: descartado por copiar a sugestão da densidade ou cortar em agradecimentos no meio da Pregação.
- Detecção de voz em CPU: descartada por levar de 12 a 15 minutos em áudio de duas horas com pouco ganho.
- Refino de fronteiras com janela de 6 minutos: ajudava alguns vídeos e quebrava outros.

## Consequences

- Os campos de fase de voz e de LLM do registro de Detecção permanecem vazios até QS-75.
- A chave da OpenAI permanece nas configurações como opcional e reservada.
- Uma Detecção Pulada não tem retry automático: o resultado é determinístico.
- O alerta de Confiança baixa aparece na maioria dos vídeos sem Capítulos; isso é esperado.
