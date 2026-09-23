---
status: accepted
date: 2026-09-23
---

# O app OAuth é publicado sem verificação; quem libera a publicação é a auditoria do YouTube

O Canal Conectado pede o escopo `youtube.force-ssl`, que o Google classifica como sensível. Decidimos publicar o app em produção **sem** passar pela verificação do Google, apoiados na exceção oficial de uso pessoal — menos de cem contas ao todo, todas conhecidas. E tratamos como pendência separada a auditoria de compliance do YouTube, que é o processo que de fato decide se um Clip enviado pela API pode ficar visível.

São dois processos distintos e é fácil confundi-los. O primeiro, a verificação OAuth, decide se aparece a tela de "app não verificado" no consentimento e se o app mostra nome e logo; nenhum escopo do YouTube é "restricted", então não há auditoria de segurança de terceiros nem custo envolvido. O segundo, a auditoria de compliance do YouTube, decide o destino dos vídeos: vídeo enviado por `videos.insert` de projeto criado depois de 28 de julho de 2020 e não auditado é **travado como privado, sem direito a recurso**. É esta segunda que pode derrubar o fluxo inteiro do Quick Sermon.

## Considered Options

Rejeitamos deixar o app em modo de teste: o Google expira o refresh token em sete dias nesse estado, o que exigiria reconectar o canal à mão toda semana, para sempre. Rejeitamos a verificação completa, que exige domínio verificado, homepage pública, política de privacidade e vídeo demonstrativo em inglês, porque só compensa se outras igrejas forem usar o sistema. Descartamos Service Account: a YouTube Data API não a aceita para canais comuns, apenas para content owners, e devolve `NoLinkedYouTubeAccount`. O modo Internal do Google Workspace resolveria o OAuth de forma mais limpa, mas não achamos documentação oficial confirmando que funciona quando o canal é uma Brand Account.

## Consequences

- Quem conecta o canal vê uma tela de "app não verificado" e precisa passar por "Avançado". Acontece uma vez, no consentimento.
- O projeto tem um teto vitalício de cem contas que podem autorizar o app. Não é resetável e é irrelevante para uma igreja.
- O ADR 0003 assume que o Upload chega ao YouTube como Não Listado e que Publicar apenas muda a visibilidade. **Se a auditoria do YouTube não estiver aprovada, essa premissa é falsa**: o vídeo cai travado como privado e a tela de Revisão, que depende do player embutido, não abre. Enquanto a auditoria não for respondida, o caminho manual é baixar o Clip pronto e subir pelo YouTube Studio.
