// Quick Sermon — Aba "Clipes" dentro da tela de detalhe do vídeo.
// Mostra todos os clipes já gerados daquele vídeo, com status, ações
// rápidas (revisar / republicar / descartar) e uma timeline visual
// de onde cada clipe foi cortado.

function VideoClipsTabScreen() {
  const clips = [
    { title: 'Quando a tempestade é o convite',  start: '12:04', end: '20:46', dur: '8:42', status: 'published', statusLabel: 'Publicado',  views: '14.2k', confidence: 94, channel: 'YouTube' },
    { title: 'Três perguntas que mudaram Pedro',  start: '34:12', end: '41:08', dur: '6:56', status: 'awaiting_review', statusLabel: 'Revisão', views: null, confidence: 88, channel: null },
    { title: 'O momento em que a multidão se aquietou', start: '52:30', end: '58:14', dur: '5:44', status: 'ready', statusLabel: 'Pronto', views: null, confidence: 91, channel: null },
    { title: 'Não basta ter fé. É preciso andar.',  start: '1:08:22', end: '1:14:02', dur: '5:40', status: 'processing', statusLabel: 'Processando 68%', views: null, confidence: 82, channel: null },
    { title: 'A oração que começou sem palavras',   start: '1:22:40', end: '1:28:18', dur: '5:38', status: 'discarded', statusLabel: 'Descartado', views: null, confidence: 71, channel: null },
  ];

  return (
    <AppShell active="videos" title="Culto de Domingo · 13 de Abril" subtitle="Igreja Central · 1h 48min · detectados 5 trechos" headerRight={
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="secondary" size="md" icon={<Icon.sparkle style={{ width: 14, height: 14 }} />}>Detectar novamente</Btn>
        <Btn variant="primary" icon={<Icon.scissors style={{ width: 14, height: 14 }} />}>Criar clip manual</Btn>
      </div>
    }>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>

        {/* Tabs (contexto: estamos na aba "Clipes") */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: `1px solid ${QS.line}` }}>
          <VTab label="Visão geral" />
          <VTab label="Clipes" count={5} active />
          <VTab label="Transcrição" />
          <VTab label="Timeline de IA" />
          <VTab label="Atividade" count={12} />
        </div>

        {/* Video mini-timeline com marcadores de onde os clipes estão */}
        <div style={{
          padding: 14, marginBottom: 18,
          background: QS.bgElev, border: `1px solid ${QS.line}`, borderRadius: QS.rLg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon.filmstrip style={{ width: 14, height: 14, color: QS.amberBright }} />
              <span style={{ fontSize: 11, color: QS.fgSubtle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Mapa de clipes</span>
            </div>
            <span style={{ fontSize: 11, color: QS.fgFaint, fontFamily: QS.mono }}>00:00 — 1:48:22</span>
          </div>
          <div style={{ position: 'relative', height: 44, background: QS.bgElev2, borderRadius: QS.rSm, overflow: 'hidden' }}>
            {/* Waveform placeholder */}
            <svg width="100%" height="44" viewBox="0 0 1000 44" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
              {Array.from({ length: 200 }).map((_, i) => {
                const x = (i + 0.5) * (1000 / 200);
                const h = 6 + Math.abs(Math.sin(i * 0.3) * Math.cos(i * 0.17)) * 30;
                return <rect key={i} x={x - 1.5} y={(44 - h) / 2} width="2" height={h} fill={QS.fgFaint} />;
              })}
            </svg>
            {/* Clip markers */}
            {[
              { start: 11, width: 8, state: 'published' },
              { start: 32, width: 6.5, state: 'ready' },
              { start: 48, width: 5.5, state: 'ready' },
              { start: 63, width: 5, state: 'processing' },
              { start: 76, width: 5, state: 'discarded' },
            ].map((m, i) => {
              const color = m.state === 'published' ? QS.ok : m.state === 'ready' ? QS.amber : m.state === 'processing' ? QS.amber : QS.fgFaint;
              const op = m.state === 'discarded' ? 0.3 : 0.85;
              return (
                <div key={i} style={{
                  position: 'absolute', top: 4, bottom: 4,
                  left: `${m.start}%`, width: `${m.width}%`,
                  background: color, opacity: op,
                  borderRadius: 3,
                  borderTop: `2px solid ${color}`,
                  boxShadow: m.state === 'processing' ? `0 0 12px ${QS.amberGlow}` : 'none',
                }} />
              );
            })}
            {/* Playhead */}
            <div style={{ position: 'absolute', top: -2, bottom: -2, left: '64%', width: 2, background: QS.amberBright }}>
              <div style={{ position: 'absolute', top: -4, left: -4, width: 10, height: 10, borderRadius: '50%', background: QS.amberBright, boxShadow: `0 0 10px ${QS.amber}` }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 10.5, color: QS.fgFaint }}>
            <LegendDot color={QS.ok} label="Publicado" />
            <LegendDot color={QS.amber} label="Pronto / em processo" />
            <LegendDot color={QS.fgFaint} label="Descartado" />
          </div>
        </div>

        {/* Resumo e filtros */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <FilterChip active>Todos <span style={{ opacity: 0.5, marginLeft: 4 }}>5</span></FilterChip>
          <FilterChip>Publicados <span style={{ opacity: 0.5, marginLeft: 4 }}>1</span></FilterChip>
          <FilterChip>Prontos <span style={{ opacity: 0.5, marginLeft: 4 }}>2</span></FilterChip>
          <FilterChip>Em processo <span style={{ opacity: 0.5, marginLeft: 4 }}>1</span></FilterChip>
          <FilterChip>Descartados <span style={{ opacity: 0.5, marginLeft: 4 }}>1</span></FilterChip>
          <div style={{ flex: 1 }} />
          <Btn variant="ghost" size="sm" icon={<Icon.download style={{ width: 12, height: 12 }} />}>Baixar tudo</Btn>
        </div>

        {/* Lista de clipes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {clips.map((c, i) => <ClipRow key={i} {...c} />)}
        </div>
      </div>
    </AppShell>
  );
}

function VTab({ label, count, active }) {
  return (
    <div style={{
      height: 38, padding: '0 14px',
      display: 'flex', alignItems: 'center', gap: 6,
      borderBottom: `2px solid ${active ? QS.amber : 'transparent'}`,
      color: active ? QS.fg : QS.fgSubtle,
      fontSize: 13, fontWeight: active ? 600 : 500,
      cursor: 'pointer',
      marginBottom: -1,
    }}>
      {label}
      {count != null && (
        <span style={{
          fontSize: 10, fontFamily: QS.mono, padding: '1px 6px',
          borderRadius: 999,
          background: active ? QS.amberTint : QS.bgElev2,
          color: active ? QS.amberBright : QS.fgFaint,
          fontWeight: 600,
        }}>{count}</span>
      )}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      {label}
    </span>
  );
}

function ClipRow({ title, start, end, dur, status, statusLabel, views, confidence, channel }) {
  const isActive = status === 'processing';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: 14,
      background: QS.bgElev,
      border: `1px solid ${isActive ? 'rgba(245,158,11,.25)' : QS.line}`,
      borderRadius: QS.rLg,
      boxShadow: isActive ? `0 0 0 1px ${QS.amberGlow}` : 'none',
      opacity: status === 'discarded' ? 0.55 : 1,
    }}>
      <ThumbPlaceholder w={140} h={80} label={dur} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <StatusBadge state={status} label={statusLabel} />
          <span style={{ fontSize: 10.5, color: QS.fgFaint, fontFamily: QS.mono }}>{start} → {end}</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: QS.fgFaint, fontFamily: QS.mono }}>
            <Icon.sparkle style={{ width: 10, height: 10, color: confidence >= 85 ? QS.amberBright : QS.fgFaint }} />
            {confidence}% confiança
          </div>
        </div>
        <div style={{ fontFamily: QS.serif, fontSize: 16, color: QS.fg, letterSpacing: -0.2, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, fontSize: 11, color: QS.fgFaint }}>
          {views && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon.eye style={{ width: 12, height: 12 }} /> {views} views
            </span>
          )}
          {channel && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon.youtube style={{ width: 12, height: 12, color: '#ff6b6b' }} /> {channel}
            </span>
          )}
          {status === 'processing' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: QS.amberBright, fontWeight: 500 }}>
              <span style={{ width: 60, height: 3, background: QS.bgElev2, borderRadius: 2, overflow: 'hidden', display: 'inline-block' }}>
                <span style={{ display: 'block', width: '68%', height: '100%', background: QS.amber }} />
              </span>
              ETA 2:14
            </span>
          )}
        </div>
      </div>

      {/* Ações contextuais */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {status === 'published' && (
          <>
            <Btn variant="ghost" size="sm" icon={<Icon.copy style={{ width: 12, height: 12 }} />}>Link</Btn>
            <Btn variant="secondary" size="sm" icon={<Icon.trend style={{ width: 12, height: 12 }} />}>Métricas</Btn>
          </>
        )}
        {status === 'awaiting_review' && (
          <Btn variant="primary" size="sm" icon={<Icon.sparkle style={{ width: 12, height: 12 }} />}>Revisar</Btn>
        )}
        {status === 'ready' && (
          <>
            <Btn variant="ghost" size="sm" icon={<Icon.edit style={{ width: 12, height: 12 }} />}>Editar</Btn>
            <Btn variant="primary" size="sm" icon={<Icon.upload style={{ width: 12, height: 12 }} />}>Publicar</Btn>
          </>
        )}
        {status === 'processing' && (
          <Btn variant="ghost" size="sm" disabled style={{ opacity: 0.6 }}>Aguarde…</Btn>
        )}
        {status === 'discarded' && (
          <Btn variant="ghost" size="sm" icon={<Icon.refresh style={{ width: 12, height: 12 }} />}>Restaurar</Btn>
        )}
        <div style={{ width: 28, height: 28, borderRadius: QS.rSm, display: 'flex', alignItems: 'center', justifyContent: 'center', color: QS.fgFaint, cursor: 'pointer' }}>
          <Icon.more style={{ width: 14, height: 14 }} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VideoClipsTabScreen });
