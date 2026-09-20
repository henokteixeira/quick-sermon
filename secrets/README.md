# Secrets

Arquivos sensiveis usados pelos servicos, **nao versionados** (ver `.gitignore`).

## `youtube-cookies.txt`

Cookies do YouTube no formato Netscape, usados pelo `yt-dlp` para contornar o
bloqueio anti-bot ("Sign in to confirm you're not a bot").

### Como exportar os cookies

1. Faca login no YouTube com uma conta Google qualquer (preferencialmente uma
   conta descartavel, nao a sua principal).
2. Instale a extensao **Get cookies.txt LOCALLY**
   ([Chrome](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
   ou similar para Firefox).
3. Acesse `https://www.youtube.com`, abra a extensao e exporte os cookies do
   dominio `youtube.com` no formato `Netscape HTTP Cookie File`.
4. Salve o arquivo como `secrets/youtube-cookies.txt` na raiz do projeto.
5. Reinicie os containers: `make down && make up`.

Os containers `backend` e `worker` montam este arquivo em
`/secrets/youtube-cookies.txt` e o `yt-dlp` ja o utiliza automaticamente quando
a env `YTDLP_COOKIES_FILE` aponta para ele.

> O mount e read-write porque o `yt-dlp` reescreve o arquivo apos cada
> requisicao para manter a sessao viva (rotacao automatica). Isso significa que
> o arquivo no host tambem vai sendo atualizado.

### Rotacao

O YouTube invalida cookies periodicamente. Se voltarem a aparecer erros de
"Sign in to confirm you're not a bot", repita o processo acima.
