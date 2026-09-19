# Quick Sermon

Plataforma que transforma a live de um culto no YouTube em clips da pregação revisados e publicados no canal da igreja.

## Language

### Origem

**Live**:
A transmissão original do culto no YouTube, identificada pela URL que o Editor submete.
_Avoid_: vídeo original, stream, transmissão

**Vídeo**:
O registro de uma Live dentro do sistema; agrupa as Detecções e os Clips feitos a partir dela.
_Avoid_: live (quando se fala do registro), sermon

**Pregação**:
O trecho do culto em que o pastor expõe a mensagem, normalmente entre 15 e 75 minutos; é o que os Clips recortam.
_Avoid_: sermão, mensagem, palavra

**Louvor**:
O trecho de adoração musical que antecede a Pregação e que a Detecção precisa distinguir dela.

### Detecção

**Detecção**:
O resultado de uma tentativa automática de localizar início e fim da Pregação numa Live, com Método e Confiança próprios; um Vídeo pode ter várias.
_Avoid_: análise, sugestão de IA, detection

**Método de Detecção**:
A fonte de sinal que uma Detecção usou: Capítulos, Legendas ou Cascata (combinação dos dois).

**Capítulos**:
Marcadores de tempo nomeados que o criador da Live colocou no YouTube.
_Avoid_: chapters

**Legendas**:
As legendas automáticas em português que o YouTube gera para a Live; a densidade delas indica fala contínua.
_Avoid_: captions, CC, transcrição

**Confiança**:
Número de 0 a 100 que a Detecção atribui ao trecho encontrado; abaixo de 80 o Editor é orientado a conferir à mão.
_Avoid_: score, precisão

**Detecção Pulada**:
Uma Detecção que não tentou localizar a Pregação porque a Live é curta, está ao vivo ou não tem Capítulos nem Legendas.
_Avoid_: skipped, falha, erro

**Trecho Sugerido**:
O intervalo de início e fim que uma Detecção concluída oferece ao Editor para criar um Clip.
_Avoid_: timestamps sugeridos, range

### Clip e Pipeline

**Clip**:
Um recorte da Pregação com início e fim definidos e ciclo de vida próprio, do Download à Publicação ou Descarte.
_Avoid_: vídeo, corte, segmento, clipe exportado

**Pipeline**:
A sequência de etapas automáticas que um Clip percorre: Download, Corte e Upload.
_Avoid_: processamento, fluxo

**Download**:
A etapa que baixa da Live apenas o intervalo do Clip, com margem de segurança.

**Corte**:
A etapa que apara o intervalo baixado exatamente nos tempos do Clip, sem recodificar.
_Avoid_: trim

**Upload**:
A etapa, disparada pelo Editor, que envia o Clip pronto ao Canal Conectado como Não Listado e o deixa Aguardando Revisão.
_Avoid_: publicar, enviar, subir

**Cookies do YouTube**:
O arquivo de sessão exportado do navegador que permite ao Download passar pela verificação anti-robô do YouTube; opcional até o YouTube exigir.
_Avoid_: cookies.txt, credenciais

### Revisão e publicação

**Revisão**:
A etapa em que o Editor prepara título, descrição e mensagem de WhatsApp de um Clip Aguardando Revisão.
_Avoid_: review, aprovação

**Rascunho**:
As edições de título, descrição e mensagem de WhatsApp de um Clip em Revisão, salvas automaticamente enquanto o Editor digita.
_Avoid_: draft

**Publicar**:
Tornar Público no YouTube um Clip Aguardando Revisão; ação exclusiva do Admin.
_Avoid_: upload, postar, lançar

**Descartar**:
Retirar do sistema e do YouTube um Clip ainda não publicado, mantendo o registro; ação exclusiva do Admin.
_Avoid_: excluir, deletar, cancelar

**Não Listado**:
Visibilidade do YouTube em que o Clip é acessível por link mas não aparece em buscas; estado de todo Upload.
_Avoid_: unlisted, privado

**Público**:
Visibilidade do YouTube após Publicar: acessível e pesquisável.
_Avoid_: public, publicado (para a visibilidade)

### Canal e acesso

**Canal Conectado**:
O canal do YouTube da igreja autorizado via OAuth a receber Uploads, Publicações e Descartes.
_Avoid_: conta, integração, conexão

**Cota**:
O limite diário de unidades da API do YouTube que Upload, Publicar e Descartar consomem.
_Avoid_: quota, limite de API

**Editor**:
Usuário que submete Lives, cria Clips, dispara Uploads e faz Revisão.
_Avoid_: usuário, membro, revisor

**Admin**:
Editor que também Publica, Descarta e gerencia usuários.
_Avoid_: administrador, owner, dono
