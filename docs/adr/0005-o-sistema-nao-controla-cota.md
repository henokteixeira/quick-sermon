---
status: accepted
date: 2026-09-23
---

# O sistema não controla Cota; quem recusa um Upload é o YouTube

O Quick Sermon mantinha um contador próprio de Cota e recusava o Upload quando a soma passava de 10.000 unidades no dia, cobrando 1600 por envio. Removemos o contador inteiro: nenhum limite interno recusa um Upload, e a única autoridade sobre limite é a resposta da própria API do YouTube.

Três razões, todas verificadas em 2026-09-20. Os números ficaram errados: em dezembro de 2025 o Google baixou o custo de `videos.insert` de ~1600 unidades para 1, e em junho de 2026 o método ganhou balde próprio, de 100 chamadas por dia, separado das 10.000 unidades dos demais endpoints. O contador não protegia nada: ele vivia na linha do Canal Conectado, então desconectar e reconectar o canal o zerava. E ele nunca correspondeu ao que o glossário prometia, porque só o Upload somava; Publicar e Descartar jamais tocaram no contador, apesar de custarem 50 unidades cada na API real.

## Consequences

- Um Upload que estoure o limite do Google falha na chamada à API, com o erro do YouTube, em vez de ser recusado antes de começar. O Editor perde a recusa antecipada e ganha uma falha honesta.
- O termo **Cota** sai do glossário. O código de erro `quota_exceeded` continua existindo no registro de falha de Upload, porque representa o erro que o YouTube devolve, não o contador que removemos.
- A menção a "1600 unidades de Cota do Upload" no ADR 0003 fica historicamente correta para a data em que foi escrita e numericamente obsoleta hoje. O argumento daquele ADR sobrevive sem ela: não reenviar o arquivo ao Publicar continua certo porque reenviar é lento e desnecessário.
- A cota real do Google é por projeto do Google Cloud, não por conta do YouTube; trocar de canal conectado não devolve cota nenhuma. Se um dia o limite de 100 uploads por dia apertar, o caminho é a extensão de cota via auditoria do YouTube, não um contador local.
