---
status: accepted
date: 2026-04-18
---

# Upload como Não Listado com escopo youtube.force-ssl; Publicar só muda a visibilidade

Todo Upload sobe ao Canal Conectado como Não Listado; Publicar altera a visibilidade para Público e Descartar apaga o vídeo no YouTube. Isso exige o escopo OAuth `youtube.force-ssl` em vez do escopo de upload, porque alterar e apagar vídeos não cabem neste. Rejeitamos subir como Privado (bloqueia o player embutido que a Revisão usa), subir direto como Público (viola a regra de nunca publicar sem Revisão) e reenviar o arquivo ao Publicar (gasta de novo as 1600 unidades de Cota do Upload).

## Consequences

- O Upload é uma ação manual do Editor ("Enviar para revisão"), não uma etapa automática do Pipeline: permite baixar o arquivo local antes de gastar Cota.
- Um Canal Conectado com o escopo antigo precisa ser desconectado e reconectado; o erro de permissão insuficiente é mapeado para essa orientação.
- Um Clip Publicado é imutável no sistema; editar título ou descrição depois disso é trabalho futuro.
