// Quick Sermon — Clip review (the hero flow)
// Note: ClipEditorScreen lives in screens-editor.jsx (fully remodeled workspace)

function WaveformLarge({ selection = [0.13, 0.67] }) {
  const N = 180;
  const bars = Array.from({ length: N }, (_, i) => {
    const phase = i / N;
    const envelope = phase > 0.1 && phase < 0.8 ? 0.8 : 0.3;
    const n = (Math.sin(i * 0.3) * 0.2 + Math.sin(i * 0.9) * 0.25 + Math.cos(i * 0.15) * 0.3 + 0.55) * envelope;
    return Math.max(0.1, Math.min(1, n));
  });
  const start = selection[0] * 100;
  const end = selection[1] * 100;
  return (
    <div style={{ position: 'relative', height: 72, padding: '6px 0' }}>
      {/* Track background */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 6, background: QS.bgElev2 }} />

      {/* Bars */}
      <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', gap: 1, padding: '0 2px' }}>
        {bars.map((b, i) => {
          const t = (i / bars.length) * 100;
          const inSel = t >= start && t <= end;
          return <div key={i} style={{
            flex: 1,
            height: `${b * 100}%`,
            minHeight: 2,
            borderRadius: 1,
            background: inSel ? QS.amber : QS.fgGhost,
            opacity: inSel ? 0.95 : 0.5,
          }} />;
        })}
      </div>

      {/* Selection overlay */}
      <div style={{
        position: 'absolute', top: -2, bottom: -2,
        left: `${start}%`, width: `${end - start}%`,
        border: `1.5px solid ${QS.amber}`,
        borderRadius: 4,
        background: 'rgba(245,158,11,.05)',
        pointerEvents: 'none',
        boxShadow: `0 0 0 3px rgba(245,158,11,.08)`,
      }} />

      {/* Handles */}
      <SelectionHandle x={start} label="14:22" />
      <SelectionHandle x={end} label="23:04" right />

      {/* Playhead */}
      <div style={{ position: 'absolute', top: -6, bottom: -6, left: '22%', width: 2, background: QS.amberBright, borderRadius: 1, boxShadow: `0 0 8px ${QS.amberGlow}` }}>
        <div style={{ position: 'absolute', top: -6, left: -3, width: 8, height: 8, borderRadius: 4, background: QS.amberBright, boxShadow: `0 0 8px ${QS.amberBright}` }} />
      </div>
    </div>
  );
}

function SelectionHandle({ x, label, right }) {
  return (
    <div style={{ position: 'absolute', top: -8, bottom: -8, left: `calc(${x}% - 5px)`, width: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 3, background: QS.amber, borderRadius: 2 }} />
      <div style={{ position: 'absolute', top: -4, width: 10, height: 12, borderRadius: 3, background: QS.amber, border: `1.5px solid #0c0a09` }} />
      <div style={{ position: 'absolute', bottom: -4, width: 10, height: 12, borderRadius: 3, background: QS.amber, border: `1.5px solid #0c0a09` }} />
      <div style={{ position: 'absolute', top: -26, [right ? 'left' : 'right']: right ? 6 : 6, padding: '2px 6px', borderRadius: 4, background: QS.amber, color: '#0c0a09', fontSize: 10, fontFamily: QS.mono, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}

// ─── Clip Review (the hero flow) ─────────────────────────────
function ClipReviewScreen() {
  return (
    <AppShell active="videos" title="Revisão do Clip" headerRight={null}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: QS.fgFaint, marginBottom: 14 }}>
          <span style={{ color: QS.fgSubtle, cursor: 'pointer' }}>Vídeos</span>
          <Icon.chevR style={{ width: 10, height: 10 }} />
          <span style={{ color: QS.fgSubtle, cursor: 'pointer' }}>Culto de Domingo · 13 Abr</span>
          <Icon.chevR style={{ width: 10, height: 10 }} />
          <span>Revisão</span>
        </div>

        {/* Title + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: QS.serif, fontSize: 26, color: QS.fg, letterSpacing: -0.5, margin: 0 }}>Detalhes do clipe</h1>
            <p style={{ fontSize: 13, color: QS.fgSubtle, marginTop: 6 }}>Revise o conteúdo gerado e publique no YouTube.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: QS.fgFaint, display: 'flex', alignItems: 'center', gap: 5, marginRight: 4 }}>
              <Icon.check style={{ width: 11, height: 11, color: QS.ok }} /> Rascunho salvo agora
            </span>
            <DownloadMenu />
            <Btn size="sm" variant="danger" icon={<Icon.trash style={{ width: 12, height: 12 }} />}>Descartar</Btn>
            <Btn size="sm" variant="primary" icon={<Icon.upload style={{ width: 12, height: 12 }} />}>Publicar no YouTube</Btn>
          </div>
        </div>

        {/* Pipeline strip — compact status banner */}
        <div style={{ marginBottom: 14 }}>
          <PipelineStrip />
        </div>

        {/* Two column: preview + editor */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16 }}>
          {/* LEFT — Preview + meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Vertical preview (like a short) */}
            <div style={{ borderRadius: QS.rLg, overflow: 'hidden', border: `1px solid ${QS.line}`, background: '#000', aspectRatio: '16/9', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(135deg, #1a1a1a 0 6px, #0a0a0a 6px 12px)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 26, background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon.play style={{ width: 18, height: 18, color: QS.fg, marginLeft: 2 }} />
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, background: 'linear-gradient(to top, rgba(0,0,0,.7), transparent)' }}>
                <div style={{ height: 2, background: 'rgba(255,255,255,.2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '34%', background: QS.amber }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 9, color: 'rgba(255,255,255,.8)', fontFamily: QS.mono }}>
                  <span>2:58</span>
                  <span>8:42</span>
                </div>
              </div>
            </div>

            {/* Details card */}
            <Card pad={0}>
              <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${QS.line}` }}>
                <span style={{ fontSize: 11, color: QS.fgSubtle, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Detalhes</span>
              </div>
              <div>
                <DetailRow label="Status" value={<StatusBadge state="awaiting_review" label="Em revisão" />} />
                <DetailRow label="Visibilidade" value={<span style={{ fontSize: 12, color: QS.fg, display: 'flex', alignItems: 'center', gap: 5 }}><Icon.eye style={{ width: 12, height: 12 }} /> Público</span>} />
                <DetailRow label="Trecho" value={<span style={{ fontFamily: QS.mono, fontSize: 12, color: QS.fg }}>14:22 → 23:04</span>} />
                <DetailRow label="Duração" value={<span style={{ fontFamily: QS.mono, fontSize: 12, color: QS.fg }}>8min 42s</span>} last />
              </div>
            </Card>

            {/* Source */}
            <Card pad={14}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ThumbPlaceholder w={60} h={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: QS.fgFaint, marginBottom: 2 }}>Vídeo de origem</div>
                  <div style={{ fontSize: 12, color: QS.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Culto de Domingo · 13 Abr</div>
                </div>
              </div>
            </Card>

          </div>

          {/* RIGHT — AI-powered editors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Title */}
            <Card pad={0}>
              <SectionHeader icon={<Icon.sparkle style={{ width: 13, height: 13, color: '#c4b5fd' }} />} title="Título" hint="100 / 100" right={
                <Btn size="sm" variant="ghost" icon={<Icon.refresh style={{ width: 11, height: 11 }} />}>Regenerar</Btn>
              } />
              <div style={{ padding: '12px 16px 6px' }}>
                <div style={{ padding: 12, borderRadius: QS.rMd, background: 'rgba(167,139,250,.05)', border: `1px solid rgba(167,139,250,.2)`, marginBottom: 10 }}>
                  <div style={{ fontFamily: QS.serif, fontSize: 17, color: QS.fg, letterSpacing: -0.3, lineHeight: 1.25 }}>Quando a tempestade é o convite: descansando no meio da dor</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 10, color: QS.fgFaint }}>
                    <span style={{ fontFamily: QS.mono }}>58/100</span>
                    <span>·</span>
                    <span style={{ color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: 3 }}><Icon.sparkle style={{ width: 9, height: 9 }} /> Sugerido pela IA</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: QS.fgFaint, marginBottom: 8 }}>Outras opções:</div>
                <TitleOption text="O peso da graça que nos carrega na travessia" />
                <TitleOption text="Fé no sussurro: quando Deus fala no silêncio" />
              </div>
              <div style={{ padding: '10px 16px 14px', borderTop: `1px solid ${QS.lineSoft}` }}>
                <span style={{ fontSize: 11, color: QS.fgFaint, cursor: 'pointer' }}>Escrever manualmente →</span>
              </div>
            </Card>

            {/* Description */}
            <Card pad={0}>
              <SectionHeader icon={<Icon.sparkle style={{ width: 13, height: 13, color: '#c4b5fd' }} />} title="Descrição" hint="842 / 5000" right={
                <Btn size="sm" variant="ghost" icon={<Icon.refresh style={{ width: 11, height: 11 }} />}>Regenerar</Btn>
              } />
              <div style={{ padding: 16 }}>
                <div style={{ padding: 14, borderRadius: QS.rMd, background: QS.bgElev2, border: `1px solid ${QS.line}`, fontSize: 12, color: QS.fgMuted, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {`Nem toda tempestade é castigo. Algumas delas são convite — convite para encontrar um Deus que não tem pressa de tirar a dor, mas que se faz presente no meio dela.

Neste trecho da pregação de domingo, Pastor Ricardo mergulha em Mateus 14 e mostra como o medo dos discípulos se transforma em adoração quando reconhecem quem caminha na água.

📖 Mateus 14:22-33
⛪ Igreja Central · Pregação de 13/04/2026

✅ Inscreva-se no canal
🔔 Ative o sininho`}
                </div>
              </div>
            </Card>

            {/* WhatsApp */}
            <Card pad={0}>
              <SectionHeader icon={<Icon.wa style={{ width: 13, height: 13, color: '#4ade80' }} />} title="Mensagem de WhatsApp" hint={null} right={
                <div style={{ display: 'flex', gap: 4 }}>
                  <Btn size="sm" variant="ghost" icon={<Icon.refresh style={{ width: 11, height: 11 }} />}>Regenerar</Btn>
                  <Btn size="sm" variant="secondary" icon={<Icon.copy style={{ width: 11, height: 11 }} />}>Copiar</Btn>
                </div>
              } />
              <div style={{ padding: 16 }}>
                <div style={{ padding: 14, borderRadius: QS.rMd, background: 'rgba(74,222,128,.04)', border: `1px solid rgba(74,222,128,.15)`, fontSize: 12, color: QS.fgMuted, lineHeight: 1.55 }}>
                  <div style={{ whiteSpace: 'pre-line' }}>{`Irmãos, 🙏

Separei um trecho especial da pregação de domingo pra compartilhar com vocês — sobre encontrar Deus no meio da tempestade.

Vale muito a pena assistir e compartilhar com quem está passando por um momento difícil. 💛

▶️ youtu.be/Qs7kz2`}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SectionHeader({ icon, title, hint, right }) {
  return (
    <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${QS.line}`, display: 'flex', alignItems: 'center', gap: 10 }}>
      {icon}
      <span style={{ fontSize: 12, color: QS.fg, fontWeight: 600 }}>{title}</span>
      {hint && <span style={{ fontSize: 10, color: QS.fgFaint, fontFamily: QS.mono }}>{hint}</span>}
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}

function DetailRow({ label, value, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: last ? 'none' : `1px solid ${QS.lineSoft}` }}>
      <span style={{ fontSize: 11, color: QS.fgFaint }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TitleOption({ text }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: QS.rMd,
      border: `1px solid ${QS.line}`,
      marginBottom: 6,
      cursor: 'pointer',
      fontSize: 12, color: QS.fgMuted, lineHeight: 1.35,
      transition: 'all .12s',
    }}>
      {text}
    </div>
  );
}

Object.assign(window, { ClipReviewScreen, WaveformLarge });
