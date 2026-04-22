// Quick Sermon — Dashboard home

function DashboardScreen() {
  const sermonSpark = 'M 0 22 L 12 20 L 25 18 L 38 14 L 50 16 L 62 10 L 75 8 L 88 6 L 100 4';
  const viewsSpark = 'M 0 20 L 14 18 L 28 16 L 42 18 L 56 12 L 70 10 L 84 6 L 100 8';
  const durSpark   = 'M 0 16 L 14 18 L 28 14 L 42 10 L 56 12 L 70 8 L 84 10 L 100 6';

  return (
    <AppShell active="dashboard" title="Dashboard" subtitle="Visão geral · Abril 2026" headerRight={
      <Btn variant="primary" icon={<Icon.plus style={{ width: 14, height: 14 }} />}>Novo vídeo</Btn>
    }>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Hero row: greeting + metrics */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: QS.serif, fontSize: 32, color: QS.fg, letterSpacing: -0.7, margin: 0 }}>
            Boa tarde, Marcos <span style={{ color: QS.amberBright }}>·</span>
          </h1>
          <p style={{ fontSize: 13, color: QS.fgSubtle, marginTop: 6 }}>Você tem <span style={{ color: QS.amberBright, fontWeight: 600 }}>3 clips aguardando revisão</span> e 1 vídeo processando.</p>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          <MetricTile label="Clips publicados" value="47" unit="este mês" trend={18} sparkline={sermonSpark} accent />
          <MetricTile label="Visualizações totais" value="24.8" unit="mil" trend={32} sparkline={viewsSpark} />
          <MetricTile label="Duração processada" value="128" unit="horas" trend={9} sparkline={durSpark} />
        </div>

        {/* Two-col: Featured + Pipeline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 20 }}>
          <FeaturedClip />
          <PipelineCard />
        </div>

        {/* Bottom: Activity + Quota */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
          <ActivityCard />
          <QuotaCard />
        </div>
      </div>
    </AppShell>
  );
}

function FeaturedClip() {
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${QS.line}` }}>
        <Icon.trend style={{ width: 14, height: 14, color: QS.amberBright }} />
        <span style={{ fontSize: 11, color: QS.fgSubtle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Destaque do mês</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: QS.fgFaint }}>+2.4k views esta semana</span>
      </div>
      <div style={{ display: 'flex', gap: 16, padding: 20 }}>
        <ThumbPlaceholder w={220} h={124} label="8:42" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: QS.serif, fontSize: 20, color: QS.fg, margin: 0, letterSpacing: -0.3, lineHeight: 1.15 }}>
            Quando a tempestade é o convite
          </h3>
          <p style={{ fontSize: 12, color: QS.fgSubtle, margin: '6px 0 14px', lineHeight: 1.5 }}>
            Trecho da pregação de domingo · Pastor Ricardo Alves
          </p>
          <div style={{ display: 'flex', gap: 18, fontSize: 11, color: QS.fgFaint, marginBottom: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon.eye style={{ width: 12, height: 12 }} /> 14.2k views</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon.clock style={{ width: 12, height: 12 }} /> 8min 42s</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon.cal style={{ width: 12, height: 12 }} /> 06 abr</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" variant="outline" icon={<Icon.youtube style={{ width: 12, height: 12, color: '#ff0033' }} />}>Ver no YouTube</Btn>
            <Btn size="sm" variant="ghost" icon={<Icon.copy style={{ width: 12, height: 12 }} />}>Copiar link</Btn>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PipelineCard() {
  const stages = [
    { name: 'Download', progress: 100, state: 'completed', speed: null },
    { name: 'Corte',    progress: 64,  state: 'processing', speed: '2.4 MB/s' },
    { name: 'Upload',   progress: 0,   state: 'pending', speed: null },
  ];
  return (
    <Card pad={0}>
      <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${QS.line}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <StatusDot state="warn" pulse />
        <span style={{ fontSize: 11, color: QS.fgSubtle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Processando agora</span>
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 13, color: QS.fg, fontWeight: 500, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Culto de Domingo · 13 de Abril</div>
        <div style={{ fontSize: 11, color: QS.fgFaint, marginBottom: 14 }}>Clip 14:22 → 23:04 · 1080p</div>
        {stages.map((s, i) => (
          <div key={s.name} style={{ marginBottom: i === stages.length - 1 ? 0 : 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: s.state === 'pending' ? QS.fgFaint : QS.fgMuted, fontWeight: 500 }}>{s.name}</span>
              <span style={{ fontSize: 10, color: QS.fgFaint, fontFamily: QS.mono }}>
                {s.state === 'completed' ? '✓' : s.state === 'pending' ? '—' : `${s.progress}%${s.speed ? ' · ' + s.speed : ''}`}
              </span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: QS.line, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${s.progress}%`,
                background: s.state === 'completed' ? QS.ok : QS.amber,
                borderRadius: 2,
                boxShadow: s.state === 'processing' ? `0 0 8px ${QS.amberGlow}` : 'none',
                transition: 'width .3s',
              }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActivityCard() {
  const items = [
    { icon: <Icon.check style={{ width: 12, height: 12 }} />, color: QS.ok, title: 'Clip publicado no YouTube', sub: 'Quando a tempestade é o convite', time: 'há 12 min' },
    { icon: <Icon.sparkle style={{ width: 12, height: 12 }} />, color: '#c4b5fd', title: 'Títulos gerados pela IA', sub: '3 opções para Culto · 13 Abr', time: 'há 1h' },
    { icon: <Icon.scissors style={{ width: 12, height: 12 }} />, color: QS.amberBright, title: 'Novo clip em revisão', sub: 'Clip 14:22 → 23:04', time: 'há 2h' },
    { icon: <Icon.video style={{ width: 12, height: 12 }} />, color: QS.fgSubtle, title: 'Vídeo submetido', sub: 'Culto de Quarta · 09 Abr', time: 'ontem' },
    { icon: <Icon.check style={{ width: 12, height: 12 }} />, color: QS.ok, title: 'Clip publicado no YouTube', sub: 'O peso da graça que nos carrega', time: 'ontem' },
  ];
  return (
    <Card pad={0}>
      <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${QS.line}` }}>
        <span style={{ fontSize: 11, color: QS.fgSubtle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Atividade recente</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: QS.amberBright, fontWeight: 500, cursor: 'pointer' }}>Ver tudo</span>
      </div>
      <div style={{ padding: '6px 0' }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: i === items.length - 1 ? 'none' : `1px solid ${QS.lineSoft}` }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: QS.bgElev2, border: `1px solid ${QS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: it.color, flexShrink: 0 }}>
              {it.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: QS.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
              <div style={{ fontSize: 11, color: QS.fgFaint, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.sub}</div>
            </div>
            <span style={{ fontSize: 10, color: QS.fgGhost, fontFamily: QS.mono, flexShrink: 0 }}>{it.time}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function QuotaCard() {
  const used = 6420, limit = 10000, pct = (used / limit) * 100;
  const r = 52, c = 2 * Math.PI * r;
  return (
    <Card pad={0}>
      <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${QS.line}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon.youtube style={{ width: 14, height: 14, color: '#ff0033' }} />
        <span style={{ fontSize: 11, color: QS.fgSubtle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Quota diária · YouTube</span>
      </div>
      <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r={r} fill="none" stroke={QS.line} strokeWidth="8" />
            <circle cx="60" cy="60" r={r} fill="none" stroke={QS.amber} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
              style={{ filter: `drop-shadow(0 0 6px ${QS.amberGlow})` }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: QS.serif, fontSize: 26, color: QS.fg, lineHeight: 1, letterSpacing: -0.5 }}>{Math.round(pct)}<span style={{ fontSize: 14, color: QS.fgFaint }}>%</span></div>
            <div style={{ fontSize: 9, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>usado</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: QS.mono, fontSize: 11, color: QS.fgSubtle, marginBottom: 3 }}>{used.toLocaleString()} / {limit.toLocaleString()} un.</div>
          <div style={{ fontSize: 11, color: QS.fgFaint, lineHeight: 1.5, marginBottom: 12 }}>Estimamos ~3 uploads restantes hoje antes do limite.</div>
          <Btn size="sm" variant="secondary">Ver histórico</Btn>
        </div>
      </div>
    </Card>
  );
}

Object.assign(window, { DashboardScreen });
