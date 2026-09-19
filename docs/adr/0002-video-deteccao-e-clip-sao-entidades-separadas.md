---
status: accepted
date: 2026-04-18
---

# Vídeo, Detecção e Clip são entidades separadas

O Vídeo é apenas o registro da Live; a Detecção tem tabela, estado e histórico próprios, várias por Vídeo; o Clip carrega o ciclo de vida completo, do Download à Publicação ou Descarte. O estado que o usuário vê num Vídeo é derivado das suas Detecções e dos seus Clips. Rejeitamos um estado único no Vídeo com um único recorte porque uma Live gera vários Clips, uma Detecção pode ser refeita sem afetar Clips existentes, e cada Clip falha, é reprocessado, publicado ou descartado por conta própria.

## Consequences

- O campo de estado do próprio Vídeo não é atualizado pelo sistema e é hoje um campo morto; removê-lo ou consolidá-lo como derivado é trabalho futuro.
- Reeditar um Clip não existe: quem quer outro intervalo cria outro Clip.
- Apagar um Vídeo apaga em cascata suas Detecções, seus Clips e os arquivos locais.
