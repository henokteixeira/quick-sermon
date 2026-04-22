// Quick Sermon — Pipeline screen + Download menu component

function PipelineScreen() {
  const jobs = [
    {
      id: 'j-1042', title: 'Culto de Domingo · 13 de Abril', stage: 'trim', progress: 64,
      eta: '1min 48s', speed: '2.4 MB/s', retries: 0, startedAt: '14:22',
      stages: ['download','trim','upload'], state: 'trimming',
    },
    {
      id: 'j-1041', title: 'Culto de Quarta · 09 de Abril · Clip 2', stage: 'upload', progress: 38,
      eta: '3min 12s', speed: '1.8 MB/s', retries: 1, startedAt: '14:02',
      stages: ['download','trim','upload'], state: 'uploading',
    },
    {
      id: 'j-1040', title: 'Conferência · Sessão 2 · Clip 3', stage: 'queued', progress: 0,
      eta: 'aguardando', speed: null, retries: 0, startedAt: null,
      stages: ['download','trim','upload'], state: 'pending',
    },
  ];

  const recent = [
    { id: 'j-1039', title: 'Culto de Domingo · 06 Abr · Clip 4', state: 'completed', duration: '4min 22s', finishedAt: 'há 18 min' },
    { id: 'j-1038', title: 'Culto de Domingo · 06 Abr · Clip 3', state: 'completed', duration: '5min 08s', finishedAt: 'há 24 min' },
    { id: 'j-1037', title: 'Culto de Quarta · 09 Abr · Clip 1', state: 'error', duration: '—', finishedAt: 'há 1h',    err: 'Quota do YouTube excedida' },
    { id: 'j-1036', title: 'Culto de Domingo · 06 Abr · Clip 2', state: 'completed', duration: '3min 58s', finishedAt: 'há 2h' },
    { id: 'j-1035', title: 'Culto de Domingo · 06 Abr · Clip 1', state: 'completed', duration: '6min 12s', finishedAt: 'há 2h' },
  ];

  return (
    <AppShell active="pipeline" title="Pipeline" subtitle="Processamento de vídeos e clipes em tempo real"
      headerRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: QS.fgFaint }}>
            <StatusDot state="ok" pulse />
            <span>Worker <span style={{ color: QS.ok, fontWeight: 600 }}>online</span></span>
          </div>
          <Btn size="sm" variant="secondary" icon={<Icon.refresh style={{ width: 12, height: 12 }} />}>Atualizar</Btn>
        </div>
      }>

      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        {/* Summary tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
          <PipelineStat label="Em processamento" value="2" accent icon={<Icon.bolt style={{ width: 13, height: 13 }} />} />
          <PipelineStat label="Na fila" value="1" icon={<Icon.clock style={{ width: 13, height: 13 }} />} />
          <PipelineStat label="Concluídos hoje" value="14" ok icon={<Icon.check style={{ width: 13, height: 13 }} />} />
          <PipelineStat label="Com erro" value="1" danger icon={<Icon.warn style={{ width: 13, height: 13 }} />} />
        </div>

        {/* Active jobs */}
        <SectionLabel title="Jobs ativos" count={jobs.length} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 30 }}>
          {jobs.map(j => <PipelineJobCard key={j.id} job={j} expanded={j.id === 'j-1042'} />)}
        </div>

        {/* Recent */}
        <SectionLabel title="Histórico recente" action="Ver tudo" />
        <Card pad={0}>
          <div>
            {recent.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i === recent.length - 1 ? 'none' : `1px solid ${QS.lineSoft}` }}>
                <StatusDot state={r.state === 'error' ? 'down' : 'ok'} size={7} />
                <span style={{ fontSize: 10, fontFamily: QS.mono, color: QS.fgFaint, width: 58 }}>{r.id}</span>
                <span style={{ flex: 1, fontSize: 12.5, color: QS.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                {r.err && <span style={{ fontSize: 11, color: QS.danger }}>{r.err}</span>}
                <span style={{ fontSize: 11, color: QS.fgFaint, fontFamily: QS.mono, width: 70, textAlign: 'right' }}>{r.duration}</span>
                <span style={{ fontSize: 11, color: QS.fgGhost, width: 80, textAlign: 'right' }}>{r.finishedAt}</span>
                <StatusBadge state={r.state} label={r.state === 'error' ? 'Falha' : 'Ok'} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function PipelineStat({ label, value, icon, accent, ok, danger }) {
  const c = accent ? QS.amberBright : ok ? QS.ok : danger ? QS.danger : QS.fgMuted;
  return (
    <div style={{
      padding: 16, borderRadius: QS.rLg,
      background: accent ? 'rgba(245,158,11,.06)' : QS.bgElev,
      border: `1px solid ${accent ? 'rgba(245,158,11,.22)' : QS.line}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c, marginBottom: 10 }}>
        {icon}
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontFamily: QS.serif, fontSize: 30, color: QS.fg, letterSpacing: -0.8, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function SectionLabel({ title, count, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: QS.fgSubtle, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600 }}>{title}</span>
      {count != null && <span style={{ padding: '1px 6px', borderRadius: 4, background: QS.bgElev2, border: `1px solid ${QS.line}`, fontSize: 10, fontFamily: QS.mono, fontWeight: 600, color: QS.fgMuted }}>{count}</span>}
      <div style={{ flex: 1 }} />
      {action && <span style={{ fontSize: 11, color: QS.amberBright, fontWeight: 500, cursor: 'pointer' }}>{action} →</span>}
    </div>
  );
}

function PipelineJobCard({ job, expanded }) {
  return (
    <Card pad={0} style={expanded ? { borderColor: 'rgba(245,158,11,.25)', background: 'rgba(245,158,11,.02)' } : null}>
      {/* Top row */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 10, fontFamily: QS.mono, color: QS.fgFaint, width: 58 }}>{job.id}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: QS.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
          <div style={{ fontSize: 11, color: QS.fgFaint, marginTop: 3, display: 'flex', gap: 10 }}>
            {job.startedAt && <span>Iniciado às {job.startedAt}</span>}
            {job.retries > 0 && <span style={{ color: QS.amberBright }}>· {job.retries} tentativa{job.retries > 1 ? 's' : ''}</span>}
          </div>
        </div>
        <StatusBadge state={job.state} label={job.state === 'pending' ? 'Na fila' : job.state === 'trimming' ? 'Cortando' : 'Enviando'} pulse={job.state !== 'pending'} />
        {job.eta !== 'aguardando' && (
          <div style={{ textAlign: 'right', width: 80 }}>
            <div style={{ fontSize: 10, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1 }}>ETA</div>
            <div style={{ fontSize: 12, color: QS.fg, fontFamily: QS.mono, fontWeight: 600 }}>{job.eta}</div>
          </div>
        )}
        <Btn size="sm" variant="ghost" icon={<Icon.more style={{ width: 14, height: 14 }} />} />
      </div>

      {/* Stages */}
      <div style={{ padding: '0 18px 14px', borderTop: expanded ? 'none' : `1px solid ${QS.lineSoft}`, paddingTop: expanded ? 0 : 14 }}>
        <PipelineStages stages={job.stages} currentStage={job.stage} progress={job.progress} />
      </div>

      {/* Expanded — live log */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${QS.lineSoft}`, padding: 18, background: 'rgba(0,0,0,.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icon.bolt style={{ width: 12, height: 12, color: QS.amberBright }} />
            <span style={{ fontSize: 10, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Log ao vivo</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: QS.fgGhost, fontFamily: QS.mono }}>{job.speed}</span>
          </div>
          <div style={{ padding: 12, borderRadius: QS.rMd, background: '#050403', border: `1px solid ${QS.line}`, fontFamily: QS.mono, fontSize: 10.5, color: QS.fgSubtle, lineHeight: 1.7, maxHeight: 120, overflow: 'auto' }} className="qs-scroll">
            <LogLine t="14:22:06" level="info">Job iniciado · vídeo id=vid_9821</LogLine>
            <LogLine t="14:22:11" level="ok">  Download completo · 2.14 GB · hash ok</LogLine>
            <LogLine t="14:22:12" level="info">Iniciando corte · 14:22 → 23:04 · h264 1080p</LogLine>
            <LogLine t="14:23:04" level="info">  frame 48/864 · 2.4 MB/s</LogLine>
            <LogLine t="14:23:47" level="info">  frame 312/864 · 2.4 MB/s</LogLine>
            <LogLine t="14:24:22" level="warn">  buffer cheio · aguardando I/O <span style={{ color: QS.fgFaint }}>(120ms)</span></LogLine>
            <LogLine t="14:24:38" level="info">  frame 540/864 · 2.5 MB/s</LogLine>
            <LogLine t="14:24:55" cursor level="info">  frame 554/864</LogLine>
          </div>
        </div>
      )}
    </Card>
  );
}

function LogLine({ t, level, children, cursor }) {
  const c = level === 'ok' ? QS.ok : level === 'warn' ? QS.amberBright : level === 'err' ? QS.danger : QS.fgSubtle;
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <span style={{ color: QS.fgGhost, flexShrink: 0 }}>{t}</span>
      <span style={{ color: c, flex: 1 }}>
        {children}
        {cursor && <span style={{ display: 'inline-block', width: 6, height: 11, background: QS.amber, marginLeft: 4, verticalAlign: 'middle', animation: 'qs-ping 1s step-end infinite' }} />}
      </span>
    </div>
  );
}

function PipelineStages({ stages, currentStage, progress }) {
  const labels = { download: 'Download', trim: 'Corte', upload: 'Upload' };
  const icons = { download: Icon.download, trim: Icon.scissors, upload: Icon.upload };
  const order = ['download','trim','upload'];
  const curIdx = order.indexOf(currentStage);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {order.map((s, i) => {
        const Icn = icons[s];
        const done = i < curIdx || currentStage === 'queued' && false;
        const active = s === currentStage;
        const color = done ? QS.ok : active ? QS.amberBright : QS.fgGhost;
        const bg = done ? QS.okTint : active ? QS.amberTint : 'transparent';
        return (
          <React.Fragment key={s}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 11,
                  background: bg, border: `1px solid ${done ? 'rgba(52,211,153,.3)' : active ? 'rgba(245,158,11,.3)' : QS.line}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color,
                }}>
                  {done ? <Icon.check style={{ width: 11, height: 11 }} /> : <Icn style={{ width: 11, height: 11 }} />}
                </div>
                <span style={{ fontSize: 11, color, fontWeight: active || done ? 600 : 500 }}>{labels[s]}</span>
                {active && <span style={{ fontSize: 10, color: QS.amberBright, fontFamily: QS.mono, fontWeight: 600, marginLeft: 'auto' }}>{progress}%</span>}
                {done && <span style={{ fontSize: 10, color: QS.ok, fontFamily: QS.mono, fontWeight: 600, marginLeft: 'auto' }}>✓</span>}
              </div>
              <div style={{ height: 3, borderRadius: 2, background: QS.line, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: done ? '100%' : active ? `${progress}%` : '0%',
                  background: done ? QS.ok : active ? QS.amber : 'transparent',
                  boxShadow: active ? `0 0 8px ${QS.amberGlow}` : 'none',
                  transition: 'width .3s',
                }} />
              </div>
            </div>
            {i < order.length - 1 && <div style={{ width: 14, height: 1, background: QS.line, margin: '18px 6px 0' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pipeline SUMMARY — compact widget for video detail (inline)
// ─────────────────────────────────────────────────────────────
function PipelineSummary() {
  return (
    <div style={{
      padding: 16,
      borderRadius: QS.rLg,
      background: QS.bgElev,
      border: `1px solid ${QS.line}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Icon.pipeline style={{ width: 14, height: 14, color: QS.amberBright }} />
        <span style={{ fontSize: 11, color: QS.fgSubtle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Pipeline</span>
        <StatusBadge state="trimming" label="Processando" pulse />
        <span style={{ fontSize: 11, color: QS.fgFaint, fontFamily: QS.mono }}>·</span>
        <span style={{ fontSize: 11, color: QS.fgFaint }}>ETA <span style={{ color: QS.fg, fontFamily: QS.mono, fontWeight: 600 }}>1min 48s</span></span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: QS.amberBright, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          Ver pipeline completo <Icon.chevR style={{ width: 11, height: 11 }} />
        </span>
      </div>

      <PipelineStages stages={['download','trim','upload']} currentStage="trim" progress={64} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Download menu — used in video detail + clip review
// ─────────────────────────────────────────────────────────────
function DownloadMenu({ open = false }) {
  const [isOpen, setOpen] = React.useState(open);
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(!isOpen)}>
        <Btn size="sm" variant="secondary" icon={<Icon.download style={{ width: 12, height: 12 }} />} iconRight={<Icon.chevD style={{ width: 11, height: 11 }} />}>Baixar</Btn>
      </div>
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          minWidth: 280, padding: 6,
          borderRadius: QS.rLg,
          background: QS.bgElev,
          border: `1px solid ${QS.line}`,
          boxShadow: `0 12px 40px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.02)`,
          zIndex: 10,
        }}>
          <div style={{ padding: '6px 10px 8px' }}>
            <span style={{ fontSize: 10, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Downloads disponíveis</span>
          </div>
          <DownloadOption icon={<Icon.video />} label="Vídeo original" meta="MP4 · 1080p · 2.14 GB" primary />
          <DownloadOption icon={<Icon.scissors />} label="Clipe exportado" meta="MP4 · 1080p · 284 MB" />
          <DownloadOption icon={<Icon.mic />} label="Apenas áudio" meta="MP3 · 320 kbps · 21 MB" />
          <div style={{ height: 1, background: QS.lineSoft, margin: '4px 8px' }} />
          <DownloadOption icon={<Icon.caption />} label="Legendas" meta="SRT · PT-BR" />
          <DownloadOption icon={<Icon.file />} label="Transcrição" meta="TXT · com timestamps" />
        </div>
      )}
    </div>
  );
}

function DownloadOption({ icon, label, meta, primary }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '9px 10px',
      borderRadius: QS.rMd,
      cursor: 'pointer',
      background: primary ? 'rgba(245,158,11,.06)' : 'transparent',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: primary ? QS.amberTint : QS.bgElev2,
        border: `1px solid ${primary ? 'rgba(245,158,11,.25)' : QS.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: primary ? QS.amberBright : QS.fgSubtle,
        flexShrink: 0,
      }}>
        {React.cloneElement(icon, { style: { width: 13, height: 13 } })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: QS.fg, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 10.5, color: QS.fgFaint, fontFamily: QS.mono, marginTop: 1 }}>{meta}</div>
      </div>
      <Icon.download style={{ width: 12, height: 12, color: QS.fgFaint }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pipeline STRIP — ultra compact, one-line banner above the clip review
// ─────────────────────────────────────────────────────────────
function PipelineStrip() {
  return (
    <div style={{
      padding: '10px 14px',
      borderRadius: QS.rLg,
      background: QS.bgElev,
      border: `1px solid ${QS.line}`,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Icon.pipeline style={{ width: 13, height: 13, color: QS.amberBright }} />
        <span style={{ fontSize: 11, color: QS.fgSubtle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Pipeline</span>
      </div>

      <StatusBadge state="trimming" label="Cortando" pulse />

      {/* Inline micro-stages */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        <MicroStage Icn={Icon.download} label="Download" state="done" />
        <MicroSep />
        <MicroStage Icn={Icon.scissors} label="Corte" state="active" progress={64} />
        <MicroSep />
        <MicroStage Icn={Icon.upload} label="Upload" state="pending" />
      </div>

      <span style={{ fontSize: 11, color: QS.fgFaint, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon.clock style={{ width: 11, height: 11 }} />
        ETA <span style={{ color: QS.fg, fontFamily: QS.mono, fontWeight: 600 }}>1min 48s</span>
      </span>

      <span style={{ fontSize: 11, color: QS.amberBright, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        Ver completo <Icon.chevR style={{ width: 11, height: 11 }} />
      </span>
    </div>
  );
}

function MicroStage({ Icn, label, state, progress }) {
  const done = state === 'done';
  const active = state === 'active';
  const color = done ? QS.ok : active ? QS.amberBright : QS.fgGhost;
  const bg = done ? QS.okTint : active ? QS.amberTint : 'transparent';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: bg,
      border: `1px solid ${done ? 'rgba(52,211,153,.22)' : active ? 'rgba(245,158,11,.25)' : QS.line}`,
    }}>
      <div style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {done ? <Icon.check style={{ width: 11, height: 11 }} /> : <Icn style={{ width: 11, height: 11 }} />}
      </div>
      <span style={{ fontSize: 11, color, fontWeight: active || done ? 600 : 500 }}>{label}</span>
      {active && progress != null && (
        <span style={{ fontSize: 10, color, fontFamily: QS.mono, fontWeight: 700 }}>{progress}%</span>
      )}
    </div>
  );
}
function MiniSep() { return null; }
function MicroSep() {
  return <div style={{ flexShrink: 0, width: 12, height: 1, background: QS.line }} />;
}

Object.assign(window, { PipelineScreen, DownloadMenu, PipelineSummary, PipelineStrip });
