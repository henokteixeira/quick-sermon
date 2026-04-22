// Quick Sermon — Notificações (drawer + lista completa)

function NotificationsScreen() {
  // Variante A: drawer flutuante sobreposto ao dashboard (preview estático)
  return (
    <div style={{ position: 'relative', width: 1200, height: 800, overflow: 'hidden' }}>
      {/* Dashboard atrás, escurecido */}
      <div style={{ position: 'absolute', inset: 0, filter: 'brightness(.45) saturate(.6)', pointerEvents: 'none' }}>
        <DashboardScreen />
      </div>
      {/* Scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,10,9,.55)', backdropFilter: 'blur(2px)' }} />
      {/* Drawer */}
      <div style={{
        position: 'absolute', top: 12, right: 12, bottom: 12,
        width: 400,
        background: QS.bgElev,
        border: `1px solid ${QS.lineStrong}`,
        borderRadius: QS.rLg,
        boxShadow: '0 20px 60px rgba(0,0,0,.5), 0 0 0 1px rgba(245,158,11,.08)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <NotifHeader />
        <NotifTabs />
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }} className="qs-scroll">
          <NotifGroup label="Hoje">
            <NotifItem type="clip_ready" title="Clip pronto para revisão" body="“Quando a tempestade é o convite” · 8min 42s" time="há 4 min" unread />
            <NotifItem type="publish" title="Publicado no YouTube" body="3 clips do culto de domingo foram ao ar" time="há 28 min" unread />
            <NotifItem type="detection" title="IA detectou 4 trechos" body="Culto de Quarta · 09 de Abril" time="há 1 hora" unread />
          </NotifGroup>
          <NotifGroup label="Ontem">
            <NotifItem type="error" title="Falha no upload" body="Cota do YouTube atingiu 92% · retry em 2h" time="18:42" />
            <NotifItem type="member" title="Luana aceitou seu convite" body="Agora pode editar e revisar clips" time="14:10" />
            <NotifItem type="processing" title="Processamento concluído" body="Conferência de Líderes · 1h 12min" time="09:05" />
          </NotifGroup>
          <NotifGroup label="Esta semana">
            <NotifItem type="quota" title="Cota semanal em 72%" body="Upload diário recomendado: 3 clips" time="2ª-feira" />
            <NotifItem type="member" title="Ricardo revisou 5 clips" body="Todos aprovados para publicação" time="2ª-feira" />
          </NotifGroup>
        </div>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${QS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: QS.bgElev2 }}>
          <span style={{ fontSize: 11, color: QS.fgFaint }}>8 notificações · 3 não lidas</span>
          <span style={{ fontSize: 12, color: QS.amberBright, fontWeight: 600, cursor: 'pointer' }}>Ver tudo →</span>
        </div>
      </div>
    </div>
  );
}

function NotifHeader() {
  return (
    <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${QS.line}` }}>
      <div style={{ position: 'relative' }}>
        <Icon.bell style={{ width: 18, height: 18, color: QS.amberBright }} />
        <div style={{ position: 'absolute', top: -3, right: -3, minWidth: 14, height: 14, padding: '0 3px', borderRadius: 7, background: QS.amber, color: '#0c0a09', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${QS.bgElev}` }}>3</div>
      </div>
      <h3 style={{ fontFamily: QS.serif, fontSize: 18, color: QS.fg, margin: 0, letterSpacing: -0.3, flex: 1 }}>Notificações</h3>
      <span style={{ fontSize: 11, color: QS.fgSubtle, cursor: 'pointer', fontWeight: 500 }}>Marcar todas</span>
      <div style={{ width: 1, height: 14, background: QS.line }} />
      <Icon.cog style={{ width: 14, height: 14, color: QS.fgFaint, cursor: 'pointer' }} />
      <Icon.x style={{ width: 16, height: 16, color: QS.fgFaint, cursor: 'pointer' }} />
    </div>
  );
}

function NotifTabs() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 16px', borderBottom: `1px solid ${QS.line}` }}>
      {[
        { label: 'Todas', count: 8, active: true },
        { label: 'Clips', count: 3 },
        { label: 'Sistema', count: 2 },
        { label: 'Equipe', count: 3 },
      ].map((t, i) => (
        <button key={i} style={{
          height: 28, padding: '0 11px',
          borderRadius: QS.rSm,
          background: t.active ? QS.amberTint : 'transparent',
          border: `1px solid ${t.active ? 'rgba(245,158,11,.25)' : 'transparent'}`,
          color: t.active ? QS.amberBright : QS.fgSubtle,
          fontSize: 11.5, fontWeight: 500,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          {t.label}
          <span style={{ opacity: 0.6, fontFamily: QS.mono, fontSize: 10 }}>{t.count}</span>
        </button>
      ))}
    </div>
  );
}

function NotifGroup({ label, children }) {
  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ padding: '4px 20px 8px', fontSize: 10, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1.3, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

function NotifItem({ type, title, body, time, unread }) {
  const config = {
    clip_ready:  { icon: Icon.sparkle,  color: QS.amberBright,  bg: QS.amberTint },
    publish:     { icon: Icon.youtube,  color: '#ff6b6b',        bg: 'rgba(248,113,113,.1)' },
    detection:   { icon: Icon.bolt,     color: '#c4b5fd',        bg: 'rgba(167,139,250,.12)' },
    error:       { icon: Icon.warn,     color: QS.danger,        bg: QS.dangerTint },
    member:      { icon: Icon.users,    color: QS.ok,            bg: QS.okTint },
    processing:  { icon: Icon.refresh,  color: '#93c5fd',        bg: 'rgba(96,165,250,.12)' },
    quota:       { icon: Icon.trend,    color: QS.amberBright,  bg: QS.amberTint },
  }[type] || { icon: Icon.bell, color: QS.fgSubtle, bg: QS.bgElev2 };

  const IconC = config.icon;
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 20px',
      borderLeft: `2px solid ${unread ? QS.amber : 'transparent'}`,
      background: unread ? 'rgba(245,158,11,.03)' : 'transparent',
      position: 'relative', cursor: 'pointer',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: QS.rMd,
        background: config.bg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconC style={{ width: 14, height: 14, color: config.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 13, color: unread ? QS.fg : QS.fgMuted, fontWeight: unread ? 600 : 500, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ fontSize: 10.5, color: QS.fgFaint, fontFamily: QS.mono, flexShrink: 0 }}>{time}</div>
        </div>
        <div style={{ fontSize: 11.5, color: QS.fgSubtle, marginTop: 2, lineHeight: 1.4 }}>{body}</div>
      </div>
      {unread && <div style={{ position: 'absolute', top: 18, right: 16, width: 6, height: 6, borderRadius: '50%', background: QS.amber }} />}
    </div>
  );
}

// Tela full-page de notificações (para quando o usuário clica "ver tudo")
function NotificationsFullScreen() {
  return (
    <AppShell active="dashboard" title="Notificações" subtitle="Todas as atualizações da sua conta" headerRight={
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="ghost" size="md" icon={<Icon.check style={{ width: 14, height: 14 }} />}>Marcar todas como lidas</Btn>
        <Btn variant="secondary" size="md" icon={<Icon.cog style={{ width: 14, height: 14 }} />}>Preferências</Btn>
      </div>
    }>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <FilterChip active>Todas <span style={{ opacity: 0.5, marginLeft: 4 }}>28</span></FilterChip>
          <FilterChip>Não lidas <span style={{ opacity: 0.5, marginLeft: 4 }}>3</span></FilterChip>
          <FilterChip>Clips <span style={{ opacity: 0.5, marginLeft: 4 }}>14</span></FilterChip>
          <FilterChip>Sistema <span style={{ opacity: 0.5, marginLeft: 4 }}>6</span></FilterChip>
          <FilterChip>Equipe <span style={{ opacity: 0.5, marginLeft: 4 }}>8</span></FilterChip>
        </div>

        <Card pad={0}>
          <NotifGroup label="Hoje · 3 não lidas">
            <NotifItem type="clip_ready" title="Clip pronto para revisão" body="“Quando a tempestade é o convite” · 8min 42s · IA gerou título, descrição e mensagem de WhatsApp" time="14:24" unread />
            <NotifItem type="publish" title="3 clips publicados no YouTube" body="Culto de Domingo · 06 abr — todos foram ao ar com sucesso" time="14:02" unread />
            <NotifItem type="detection" title="IA detectou 4 trechos candidatos" body="Culto de Quarta · 09 abr · confiança média 87%" time="13:15" unread />
          </NotifGroup>
          <div style={{ height: 1, background: QS.line }} />
          <NotifGroup label="Ontem">
            <NotifItem type="error" title="Falha no upload para YouTube" body="Cota diária atingiu 92%. Retry automático às 23:00." time="18:42" />
            <NotifItem type="member" title="Luana Ferreira aceitou seu convite" body="Agora pode editar e revisar clips · Função: Editor" time="14:10" />
            <NotifItem type="processing" title="Processamento concluído" body="Conferência de Líderes — Sessão 2 · 1h 12min processada" time="09:05" />
            <NotifItem type="quota" title="Uso semanal em 72%" body="Você processou 18h de vídeo esta semana de um total de 25h" time="08:30" />
          </NotifGroup>
          <div style={{ height: 1, background: QS.line }} />
          <NotifGroup label="Esta semana">
            <NotifItem type="member" title="Ricardo revisou e aprovou 5 clips" body="Culto de Quarta · 02 abr — todos encaminhados para publicação" time="2ª-feira · 16:20" />
            <NotifItem type="detection" title="Nova versão do modelo de IA disponível" body="Detecção 18% mais precisa · clique para atualizar" time="2ª-feira · 10:00" />
          </NotifGroup>
        </Card>
      </div>
    </AppShell>
  );
}

Object.assign(window, { NotificationsScreen, NotificationsFullScreen });
