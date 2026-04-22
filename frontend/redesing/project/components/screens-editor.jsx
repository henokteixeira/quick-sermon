// Quick Sermon — Clip editor workspace (v2, less dense, fits 1200×800)
// Top bar is 64px, so workspace height = 736px.
// Layout: 2 columns (transcript + stage) with timeline docked at bottom of stage.
// Inspector becomes a compact right rail (240px) with only essentials.

function ClipEditorScreen() {
  const [transcriptOpen, setTranscriptOpen] = React.useState(true);
  return (
    <AppShell active="videos" title="Editor de Clip" subtitle="Culto de Domingo · 13 Abr" padding={0}
      headerRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: QS.fgFaint, display: 'flex', alignItems: 'center', gap: 5, marginRight: 4 }}>
            <Icon.check style={{ width: 11, height: 11, color: QS.ok }} /> Salvo
          </span>
          <Btn size="sm" variant="ghost" icon={<Icon.arrL style={{ width: 12, height: 12 }} />}>Voltar</Btn>
          <Btn size="sm" variant="primary" icon={<Icon.scissors style={{ width: 12, height: 12 }} />}>Criar clip</Btn>
        </div>
      }>

      <div style={{ height: 736, display: 'grid', gridTemplateColumns: `${transcriptOpen ? '260px' : '44px'} 1fr 240px`, minHeight: 0, transition: 'grid-template-columns .18s ease' }}>
        <EditorTranscript open={transcriptOpen} onToggle={() => setTranscriptOpen(!transcriptOpen)} />
        <EditorCenter />
        <EditorSidebar />
      </div>
    </AppShell>
  );
}

// ── LEFT: transcript (collapsible) ─────────────────────────────
function EditorTranscript({ open, onToggle }) {
  const segments = [
    { t: '14:22', text: 'Quero que abram comigo em Mateus 14.', active: false },
    { t: '14:38', text: 'Jesus obrigou os discípulos a entrarem no barco…', active: false },
    { t: '15:04', text: 'E ele foi sozinho ao monte para orar.', active: true },
    { t: '15:22', text: 'Chegada a tarde, estava ali sozinho.', active: false },
    { t: '15:48', text: 'Açoitado pelas ondas — o vento era contrário.', active: false },
    { t: '16:10', text: 'Quantos já se sentiram assim? Açoitados…', active: false },
  ];

  // Collapsed rail
  if (!open) {
    return (
      <div style={{ borderRight: `1px solid ${QS.line}`, background: QS.bgElev, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
        <button onClick={onToggle} title="Expandir transcrição" style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'transparent', border: `1px solid ${QS.line}`,
          color: QS.fgSubtle,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', marginBottom: 12,
        }}>
          <Icon.chevR style={{ width: 12, height: 12 }} />
        </button>
        <div style={{
          writingMode: 'vertical-rl', transform: 'rotate(180deg)',
          fontSize: 10, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon.caption style={{ width: 12, height: 12, color: QS.amberBright }} />
          Transcrição
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderRight: `1px solid ${QS.line}`, background: QS.bgElev, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '14px 12px 14px 16px', borderBottom: `1px solid ${QS.line}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon.caption style={{ width: 13, height: 13, color: QS.amberBright }} />
        <span style={{ fontSize: 11, color: QS.fgSubtle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Transcrição</span>
        <div style={{ flex: 1 }} />
        <button onClick={onToggle} title="Recolher" style={{
          width: 22, height: 22, borderRadius: 5,
          background: 'transparent', border: `1px solid ${QS.line}`,
          color: QS.fgSubtle,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <Icon.chevL style={{ width: 11, height: 11 }} />
        </button>
      </div>
      <div className="qs-scroll" style={{ flex: 1, overflow: 'auto', padding: '10px 10px 14px' }}>
        {segments.map((s, i) => (
          <div key={i} style={{
            padding: '10px 12px', borderRadius: QS.rMd, cursor: 'pointer', marginBottom: 4,
            background: s.active ? 'rgba(245,158,11,.08)' : 'transparent',
            borderLeft: `2px solid ${s.active ? QS.amber : 'transparent'}`,
          }}>
            <span style={{ fontSize: 10, fontFamily: QS.mono, color: s.active ? QS.amberBright : QS.fgFaint, fontWeight: 600, marginRight: 8 }}>{s.t}</span>
            <span style={{ fontSize: 12, color: s.active ? QS.fg : QS.fgMuted, lineHeight: 1.5 }}>{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CENTER: player on top, timeline at bottom ─────────────────
function EditorCenter() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, background: QS.bg }}>
      {/* Player area */}
      <div style={{ flex: 1, minHeight: 0, padding: '18px 22px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ flex: 1, minHeight: 0, borderRadius: QS.rLg, overflow: 'hidden', border: `1px solid ${QS.line}`, background: '#000', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(135deg, #1a1a1a 0 6px, #0a0a0a 6px 12px)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 30, background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.pause style={{ width: 18, height: 18, color: QS.fg }} />
            </div>
          </div>
          <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 9px', borderRadius: 6, background: 'rgba(12,10,9,.75)', backdropFilter: 'blur(10px)', fontSize: 11, color: QS.fg, display: 'flex', alignItems: 'center', gap: 6, border: `1px solid rgba(245,158,11,.3)` }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: QS.amber }} />
            Seleção
          </div>
          <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 9px', borderRadius: 6, background: 'rgba(12,10,9,.75)', backdropFilter: 'blur(10px)', fontSize: 11, color: QS.fg, fontFamily: QS.mono }}>
            15:04 <span style={{ opacity: 0.5 }}>/ 1:48:22</span>
          </div>
        </div>

        {/* Transport */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TransportBtn icon={<Icon.arrL style={{ width: 13, height: 13 }} />} label="-10s" />
          <TransportBtn icon={<Icon.pause style={{ width: 13, height: 13 }} />} primary />
          <TransportBtn icon={<Icon.arrR style={{ width: 13, height: 13 }} />} label="+10s" />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: QS.fgFaint, fontFamily: QS.mono }}>1x</span>
        </div>
      </div>

      {/* Timeline (compact) */}
      <EditorTimeline />
    </div>
  );
}

function TransportBtn({ icon, label, primary }) {
  const isText = !!label;
  return (
    <button style={{
      height: 32, minWidth: isText ? 54 : 32, padding: isText ? '0 10px' : 0,
      borderRadius: QS.rMd,
      border: `1px solid ${primary ? QS.amber : QS.line}`,
      background: primary ? QS.amberTint : QS.bgElev,
      color: primary ? QS.amberBright : QS.fgMuted,
      fontSize: 11, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      cursor: 'pointer',
    }}>{icon}{label}</button>
  );
}

// ── RIGHT: compact sidebar (essentials only) ──────────────────
function EditorSidebar() {
  return (
    <div style={{ borderLeft: `1px solid ${QS.line}`, background: QS.bgElev, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="qs-scroll" style={{ flex: 1, overflow: 'auto', padding: '16px 16px 12px' }}>

        <SideSection title="Trecho">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <MiniField label="Início" value="14:22" />
            <MiniField label="Fim" value="23:04" />
          </div>
          <div style={{ padding: '9px 12px', borderRadius: QS.rMd, background: 'rgba(245,158,11,.06)', border: `1px solid rgba(245,158,11,.18)`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon.clock style={{ width: 12, height: 12, color: QS.amberBright }} />
            <span style={{ fontSize: 11, color: QS.fgMuted }}>Duração</span>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: QS.fg, fontFamily: QS.mono, fontWeight: 600 }}>8min 42s</span>
          </div>
        </SideSection>

        <SideSection title="Ajuste fino">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: QS.fgFaint, width: 32 }}>Início</span>
            <NudgeBtn>−1s</NudgeBtn><NudgeBtn>−0.1</NudgeBtn><NudgeBtn>+0.1</NudgeBtn><NudgeBtn>+1s</NudgeBtn>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: QS.fgFaint, width: 32 }}>Fim</span>
            <NudgeBtn>−1s</NudgeBtn><NudgeBtn>−0.1</NudgeBtn><NudgeBtn>+0.1</NudgeBtn><NudgeBtn>+1s</NudgeBtn>
          </div>
        </SideSection>

        <SideSection title="Exportação">
          <MiniField label="Qualidade" value="1080p · MP4" chev />
          <div style={{ height: 8 }} />
          <MiniField label="Legendas" value="PT-BR embutida" chev />
        </SideSection>

        <div style={{ padding: 12, borderRadius: QS.rMd, background: QS.bgElev2, border: `1px solid ${QS.line}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: QS.fgMuted, marginBottom: 5 }}>
            <span>Tamanho</span>
            <span style={{ color: QS.fg, fontFamily: QS.mono, fontWeight: 600 }}>~284 MB</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: QS.fgMuted }}>
            <span>Processo</span>
            <span style={{ color: QS.fg, fontFamily: QS.mono, fontWeight: 600 }}>~2 min</span>
          </div>
        </div>
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${QS.line}` }}>
        <Btn variant="primary" size="md" fullWidth icon={<Icon.scissors style={{ width: 13, height: 13 }} />}>Criar clip</Btn>
      </div>
    </div>
  );
}

function SideSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}
function MiniField({ label, value, chev }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: QS.fgFaint, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
      <div style={{ height: 30, padding: '0 10px', borderRadius: QS.rMd, background: QS.bgElev2, border: `1px solid ${QS.line}`, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: QS.fg, fontFamily: QS.mono, fontWeight: 500 }}>
        {value}
        {chev && (<><div style={{ flex: 1 }} /><Icon.chevD style={{ width: 10, height: 10, color: QS.fgFaint }} /></>)}
      </div>
    </div>
  );
}
function NudgeBtn({ children }) {
  return (
    <button style={{
      flex: 1, height: 24, padding: 0, borderRadius: 4,
      background: QS.bgElev2, border: `1px solid ${QS.line}`, color: QS.fgMuted,
      fontSize: 10, fontFamily: QS.mono, fontWeight: 600, cursor: 'pointer',
    }}>{children}</button>
  );
}

// ── BOTTOM: compact timeline ─────────────────────────────────
function EditorTimeline() {
  const chapters = [
    { start: 0.00, end: 0.10, label: 'Abertura',    kind: 'music' },
    { start: 0.10, end: 0.13, label: 'Louvor',      kind: 'music' },
    { start: 0.13, end: 0.67, label: 'Pregação',    kind: 'sermon' },
    { start: 0.67, end: 0.78, label: 'Oração',      kind: 'prayer' },
    { start: 0.78, end: 1.00, label: 'Avisos',      kind: 'talk' },
  ];
  return (
    <div style={{ background: QS.bgElev, padding: '10px 22px 12px', borderTop: `1px solid ${QS.line}` }}>
      {/* Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Icon.filmstrip style={{ width: 12, height: 12, color: QS.amberBright }} />
        <span style={{ fontSize: 10, color: QS.fgSubtle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Timeline</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: QS.fgFaint, fontFamily: QS.mono }}>1:48:22</span>
      </div>
      {/* Chapters */}
      <div style={{ display: 'flex', height: 16, marginBottom: 4, gap: 1 }}>
        {chapters.map((c, i) => {
          const color = c.kind === 'sermon' ? QS.amber : c.kind === 'music' ? '#a78bfa' : c.kind === 'prayer' ? '#4ade80' : QS.fgFaint;
          const isSermon = c.kind === 'sermon';
          return (
            <div key={i} style={{
              width: `${(c.end - c.start) * 100}%`, borderRadius: 3,
              background: isSermon ? QS.amberTint : `color-mix(in oklab, ${color} 16%, transparent)`,
              border: `1px solid ${isSermon ? 'rgba(245,158,11,.4)' : `color-mix(in oklab, ${color} 32%, transparent)`}`,
              display: 'flex', alignItems: 'center', padding: '0 6px',
              fontSize: 9, color: isSermon ? QS.amberBright : QS.fgMuted,
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
              overflow: 'hidden', whiteSpace: 'nowrap',
            }}>{c.label}</div>
          );
        })}
      </div>
      {/* Waveform */}
      <div style={{ height: 56 }}>
        <WaveformLarge selection={[0.13, 0.67]} />
      </div>
      {/* Ruler */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: QS.fgGhost, fontFamily: QS.mono }}>
        {['00:00','18:00','36:00','54:00','1:12:00','1:30:00','1:48:22'].map(t => <span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

Object.assign(window, { ClipEditorScreen });
