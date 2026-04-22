// Quick Sermon — Videos list + Videos detail

function VideosListScreen() {
  const videos = [
    { title: 'Culto de Domingo · 13 de Abril', channel: 'Igreja Central', duration: '1:48:22', date: '13 abr', status: 'processing', statusLabel: 'Processando', progress: 64, clips: 2 },
    { title: 'Culto de Quarta · 09 de Abril', channel: 'Igreja Central', duration: '1:22:10', date: '09 abr', status: 'awaiting_review', statusLabel: 'Revisão', clips: 3 },
    { title: 'Culto de Domingo · 06 de Abril', channel: 'Igreja Central', duration: '2:04:18', date: '06 abr', status: 'published', statusLabel: 'Publicado', clips: 4 },
    { title: 'Conferência de Líderes · Sessão 2', channel: 'Igreja Central', duration: '1:12:44', date: '02 abr', status: 'published', statusLabel: 'Publicado', clips: 2 },
    { title: 'Culto de Quarta · 26 de Março', channel: 'Igreja Central', duration: '1:18:03', date: '26 mar', status: 'detecting', statusLabel: 'Detectando', clips: 0 },
    { title: 'Culto de Domingo · 23 de Março', channel: 'Igreja Central', duration: '1:52:31', date: '23 mar', status: 'error', statusLabel: 'Erro', clips: 0 },
  ];

  return (
    <AppShell active="videos" title="Vídeos" subtitle="Gerencie e acompanhe seus vídeos de pregação" headerRight={
      <Btn variant="primary" icon={<Icon.plus style={{ width: 14, height: 14 }} />}>Novo vídeo</Btn>
    }>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <FilterChip active>Todos <span style={{ opacity: 0.5, marginLeft: 4 }}>24</span></FilterChip>
          <FilterChip>Processando <span style={{ opacity: 0.5, marginLeft: 4 }}>2</span></FilterChip>
          <FilterChip>Revisão <span style={{ opacity: 0.5, marginLeft: 4 }}>3</span></FilterChip>
          <FilterChip>Publicados <span style={{ opacity: 0.5, marginLeft: 4 }}>18</span></FilterChip>
          <FilterChip>Erros <span style={{ opacity: 0.5, marginLeft: 4 }}>1</span></FilterChip>
          <div style={{ flex: 1 }} />
          <button style={{ height: 32, padding: '0 12px', borderRadius: QS.rMd, background: 'transparent', border: `1px solid ${QS.line}`, color: QS.fgSubtle, fontSize: 12, fontFamily: QS.sans, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            Data <Icon.chevD style={{ width: 11, height: 11 }} />
          </button>
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {videos.map((v, i) => <VideoRow key={i} {...v} hover={i === 0} />)}
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 16 }}>
          <span style={{ fontSize: 12, color: QS.fgFaint }}>Mostrando <span style={{ color: QS.fgMuted, fontFamily: QS.mono }}>1–6</span> de <span style={{ color: QS.fgMuted, fontFamily: QS.mono }}>24</span></span>
          <div style={{ display: 'flex', gap: 4 }}>
            <Btn size="sm" variant="ghost" icon={<Icon.chevL style={{ width: 12, height: 12 }} />}>Anterior</Btn>
            <Btn size="sm" variant="secondary" iconRight={<Icon.chevR style={{ width: 12, height: 12 }} />}>Próximo</Btn>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function FilterChip({ children, active }) {
  return (
    <div style={{
      height: 32, padding: '0 12px',
      display: 'inline-flex', alignItems: 'center',
      borderRadius: 999,
      background: active ? QS.amberTint : 'transparent',
      border: `1px solid ${active ? 'rgba(245,158,11,.3)' : QS.line}`,
      color: active ? QS.amberBright : QS.fgSubtle,
      fontSize: 12, fontWeight: 500,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{children}</div>
  );
}

function VideoRow({ title, channel, duration, date, status, statusLabel, progress, clips, hover }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: 12,
      borderRadius: QS.rLg,
      background: hover ? 'rgba(245,158,11,.03)' : QS.bgElev,
      border: `1px solid ${hover ? 'rgba(245,158,11,.2)' : QS.line}`,
      cursor: 'pointer',
      transition: 'all .15s',
      position: 'relative', overflow: 'hidden',
    }}>
      <ThumbPlaceholder w={140} h={80} label={duration} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: QS.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 11, color: QS.fgFaint, marginBottom: 8 }}>{channel} · {date}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusBadge state={status} label={statusLabel} pulse={status === 'processing' || status === 'detecting'} />
          {clips > 0 && (
            <span style={{ fontSize: 11, color: QS.fgFaint, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon.scissors style={{ width: 11, height: 11 }} /> {clips} {clips === 1 ? 'clip' : 'clips'}
            </span>
          )}
        </div>
      </div>

      {status === 'processing' && progress != null && (
        <div style={{ width: 140, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1 }}>Corte</span>
            <span style={{ fontSize: 10, color: QS.amberBright, fontFamily: QS.mono, fontWeight: 600 }}>{progress}%</span>
          </div>
          <div style={{ height: 3, background: QS.line, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: QS.amber, boxShadow: `0 0 6px ${QS.amberGlow}` }} />
          </div>
        </div>
      )}

      <Icon.chevR style={{ width: 16, height: 16, color: QS.fgGhost, flexShrink: 0 }} />
    </div>
  );
}

// ─── Video detail ─────────────────────────────────────────
function VideoDetailScreen() {
  return (
    <AppShell active="videos" title="Detalhes do Vídeo" headerRight={null}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        {/* Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: QS.fgSubtle, marginBottom: 20, cursor: 'pointer' }}>
          <Icon.arrL style={{ width: 14, height: 14 }} /> Voltar para vídeos
        </div>

        {/* Title + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: QS.serif, fontSize: 28, color: QS.fg, letterSpacing: -0.5, margin: 0, lineHeight: 1.15 }}>
              Culto de Domingo · 13 de Abril
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <StatusBadge state="awaiting_review" label="3 clips em revisão" />
              <span style={{ fontSize: 11, color: QS.fgFaint }}>Submetido em 13 abr, 14:22</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <DownloadMenu open />
            <Btn size="sm" variant="ghost" icon={<Icon.edit style={{ width: 12, height: 12 }} />}>Renomear</Btn>
            <Btn size="sm" variant="ghost" icon={<Icon.trash style={{ width: 12, height: 12, color: QS.danger }} />}>Excluir</Btn>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${QS.line}`, marginBottom: 22, gap: 4 }}>
          <Tab active>Detalhes</Tab>
          <Tab badge="3">Clipes</Tab>
          <div style={{ flex: 1 }} />
          <div style={{ paddingBottom: 8 }}>
            <Btn size="sm" variant="primary" icon={<Icon.scissors style={{ width: 12, height: 12 }} />}>Criar clip</Btn>
          </div>
        </div>

        {/* Video + detection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Player */}
          <div style={{ borderRadius: QS.rLg, overflow: 'hidden', border: `1px solid ${QS.line}`, background: '#000', aspectRatio: '16/9', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(135deg, #1a1a1a 0 6px, #0a0a0a 6px 12px)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.play style={{ width: 22, height: 22, color: QS.fg, marginLeft: 2 }} />
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, background: 'linear-gradient(to top, rgba(0,0,0,.7), transparent)' }}>
              <div style={{ height: 3, background: 'rgba(255,255,255,.2)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '24%', background: QS.amber }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,.8)', fontFamily: QS.mono }}>
                <span>26:04</span>
                <span>1:48:22</span>
              </div>
            </div>
          </div>

          {/* Detection */}
          <Card pad={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Icon.sparkle style={{ width: 14, height: 14, color: QS.amberBright }} />
              <span style={{ fontSize: 11, color: QS.fgSubtle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Pregação detectada</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: QS.okTint, color: QS.ok, fontWeight: 600 }}>94% confiança</span>
            </div>
            <div style={{ fontSize: 12, color: QS.fgMuted, lineHeight: 1.5, marginBottom: 14 }}>
              Detectamos uma pregação de <span style={{ color: QS.fg, fontFamily: QS.mono, fontWeight: 600 }}>14:22</span> até <span style={{ color: QS.fg, fontFamily: QS.mono, fontWeight: 600 }}>1:12:08</span>.
            </div>
            <div style={{ padding: 10, borderRadius: QS.rMd, background: QS.bgElev2, border: `1px solid ${QS.line}`, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: QS.fgFaint }}>Trecho sugerido</span>
                <span style={{ fontSize: 10, color: QS.fgFaint, fontFamily: QS.mono }}>57m 46s</span>
              </div>
              <WaveformMini selection={[0.13, 0.67]} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn size="sm" variant="primary" fullWidth>Usar pregação sugerida</Btn>
              <Btn size="sm" variant="secondary" icon={<Icon.edit style={{ width: 11, height: 11 }} />}>Editar</Btn>
            </div>
          </Card>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <InfoTile icon={<Icon.clock />} label="Duração" value="1:48:22" />
          <InfoTile icon={<Icon.users />} label="Canal" value="Igreja Central" />
          <InfoTile icon={<Icon.eye />} label="Visualizações" value="2.4k" />
          <InfoTile icon={<Icon.cal />} label="Publicado em" value="13 abr 2026" />
        </div>
      </div>
    </AppShell>
  );
}

function Tab({ active, children, badge }) {
  return (
    <div style={{
      padding: '10px 14px 12px', position: 'relative',
      fontSize: 13, color: active ? QS.amberBright : QS.fgSubtle,
      fontWeight: active ? 600 : 500,
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {children}
      {badge && (
        <span style={{ padding: '1px 6px', borderRadius: 4, background: active ? QS.amberTint : QS.bgElev2, fontSize: 10, fontFamily: QS.mono, fontWeight: 600 }}>{badge}</span>
      )}
      {active && <div style={{ position: 'absolute', left: 10, right: 10, bottom: -1, height: 2, background: QS.amber, borderRadius: 2 }} />}
    </div>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <div style={{ padding: 14, borderRadius: QS.rLg, background: QS.bgElev, border: `1px solid ${QS.line}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: QS.amberBright }}>
        {React.cloneElement(icon, { style: { width: 13, height: 13 } })}
        <span style={{ fontSize: 10, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 14, color: QS.fg, fontWeight: 600, fontFamily: label === 'Duração' || label === 'Visualizações' ? QS.mono : QS.sans }}>{value}</div>
    </div>
  );
}

// Small waveform placeholder with selection
function WaveformMini({ selection = [0.1, 0.7], height = 32 }) {
  // deterministic pseudo-waveform
  const bars = Array.from({ length: 64 }, (_, i) => {
    const n = Math.sin(i * 0.5) * 0.3 + Math.sin(i * 1.7) * 0.25 + Math.cos(i * 0.3) * 0.35 + 0.5;
    return Math.max(0.15, Math.min(1, n));
  });
  return (
    <div style={{ height, display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
      {bars.map((b, i) => {
        const t = i / bars.length;
        const inSel = t >= selection[0] && t <= selection[1];
        return <div key={i} style={{
          flex: 1, height: `${b * 100}%`, minHeight: 2,
          borderRadius: 1,
          background: inSel ? QS.amber : QS.fgGhost,
          opacity: inSel ? 1 : 0.5,
        }} />;
      })}
    </div>
  );
}

Object.assign(window, { VideosListScreen, VideoDetailScreen, WaveformMini });
