// Quick Sermon — Settings + Users/Channels

function SettingsScreen() {
  return (
    <AppShell active="settings" title="Configurações" subtitle="Gerencie sua conta, canais e preferências">
      <div style={{ maxWidth: 880, margin: '0 auto', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32 }}>
        {/* Side nav */}
        <nav style={{ position: 'sticky', top: 0, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SettingsNav label="Perfil" active icon={<Icon.user />} />
          <SettingsNav label="Canais conectados" badge="2" icon={<Icon.youtube style={{ color: '#ff0033' }} />} />
          <SettingsNav label="Preferências de IA" icon={<Icon.sparkle />} />
          <SettingsNav label="Notificações" icon={<Icon.bell />} />
          <SettingsNav label="Plano & faturamento" icon={<Icon.card />} />
          <SettingsNav label="Equipe" icon={<Icon.users />} />
          <div style={{ height: 12 }} />
          <SettingsNav label="Sair" icon={<Icon.logout />} danger />
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile */}
          <SettingsSection title="Perfil" subtitle="Como você aparece na plataforma">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `linear-gradient(135deg, ${QS.amber}, #b45309)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: QS.serif, fontSize: 24, color: '#0c0a09', fontWeight: 600,
                border: `2px solid ${QS.bgElev2}`,
                boxShadow: `0 4px 12px ${QS.amberGlow}`,
              }}>MC</div>
              <div>
                <Btn size="sm" variant="secondary">Alterar foto</Btn>
                <div style={{ fontSize: 11, color: QS.fgFaint, marginTop: 6 }}>PNG ou JPG · máx 2MB</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AuthField label="Nome" value="Marcos Costa" />
              <AuthField label="Email" value="marcos@igrejacentral.com" />
            </div>
          </SettingsSection>

          {/* Channels */}
          <SettingsSection title="Canais conectados" subtitle="Publique automaticamente nos seus canais do YouTube" action={<Btn size="sm" variant="secondary" icon={<Icon.plus style={{ width: 12, height: 12 }} />}>Conectar canal</Btn>}>
            <ChannelRow name="Igreja Central Oficial" handle="@igrejacentral" subs="24.8k" videos="184" active />
            <ChannelRow name="Pastor Ricardo · Devocional" handle="@prricardo" subs="8.4k" videos="62" />
          </SettingsSection>

          {/* AI prefs */}
          <SettingsSection title="Preferências de IA" subtitle="Como a IA gera títulos, descrições e mensagens">
            <PrefRow label="Tom de voz" value="Pastoral · acolhedor" />
            <PrefRow label="Idioma dos conteúdos" value="Português (BR)" />
            <PrefRow label="Incluir emojis" toggle defaultOn />
            <PrefRow label="Incluir versículo bíblico" toggle defaultOn />
            <PrefRow label="Call-to-action no final" toggle defaultOn last />
          </SettingsSection>

          {/* Danger */}
          <SettingsSection title="Zona de perigo" danger>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <div>
                <div style={{ fontSize: 13, color: QS.fg, fontWeight: 500, marginBottom: 2 }}>Excluir conta</div>
                <div style={{ fontSize: 11, color: QS.fgFaint }}>Remove permanentemente sua conta e todos os clips processados.</div>
              </div>
              <Btn size="sm" variant="danger">Excluir conta</Btn>
            </div>
          </SettingsSection>
        </div>
      </div>
    </AppShell>
  );
}

function SettingsNav({ label, active, icon, badge, danger }) {
  return (
    <div style={{
      padding: '9px 12px', borderRadius: QS.rMd,
      background: active ? 'rgba(245,158,11,.08)' : 'transparent',
      border: `1px solid ${active ? 'rgba(245,158,11,.2)' : 'transparent'}`,
      color: danger ? QS.danger : active ? QS.amberBright : QS.fgSubtle,
      fontSize: 12.5, fontWeight: active ? 600 : 500,
      display: 'flex', alignItems: 'center', gap: 10,
      cursor: 'pointer',
    }}>
      {React.cloneElement(icon, { style: { ...(icon.props.style || {}), width: 13, height: 13, color: icon.props.style?.color || 'currentColor' } })}
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ padding: '1px 6px', borderRadius: 4, background: QS.bgElev2, border: `1px solid ${QS.line}`, fontSize: 10, fontFamily: QS.mono, fontWeight: 600, color: QS.fgMuted }}>{badge}</span>}
    </div>
  );
}

function SettingsSection({ title, subtitle, children, action, danger }) {
  return (
    <Card pad={0} style={danger ? { borderColor: 'rgba(239,68,68,.2)' } : null}>
      <div style={{ padding: '16px 20px 14px', borderBottom: `1px solid ${QS.line}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: danger ? QS.danger : QS.fg, fontWeight: 600, fontFamily: QS.serif, letterSpacing: -0.2 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: QS.fgFaint, marginTop: 3 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </Card>
  );
}

function ChannelRow({ name, handle, subs, videos, active }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: 14,
      borderRadius: QS.rMd,
      background: QS.bgElev2,
      border: `1px solid ${QS.line}`,
      marginBottom: 8,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 20,
        background: `linear-gradient(135deg, #ff0033, #b91c1c)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon.youtube style={{ width: 18, height: 18, color: '#fff' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: QS.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontSize: 11, color: QS.fgFaint, display: 'flex', gap: 8, marginTop: 2 }}>
          <span>{handle}</span>
          <span>·</span>
          <span><span style={{ color: QS.fgMuted, fontFamily: QS.mono }}>{subs}</span> inscritos</span>
          <span>·</span>
          <span><span style={{ color: QS.fgMuted, fontFamily: QS.mono }}>{videos}</span> vídeos</span>
        </div>
      </div>
      {active && <StatusBadge state="published" label="Ativo" />}
      <Btn size="sm" variant="ghost">Gerenciar</Btn>
    </div>
  );
}

function PrefRow({ label, value, toggle, defaultOn, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: last ? 'none' : `1px solid ${QS.lineSoft}` }}>
      <span style={{ fontSize: 13, color: QS.fgMuted }}>{label}</span>
      {toggle ? (
        <div style={{
          width: 34, height: 20, borderRadius: 10,
          background: defaultOn ? QS.amber : QS.line,
          position: 'relative', cursor: 'pointer',
          boxShadow: defaultOn ? `0 0 8px ${QS.amberGlow}` : 'none',
          transition: 'all .15s',
        }}>
          <div style={{ position: 'absolute', top: 2, left: defaultOn ? 16 : 2, width: 16, height: 16, borderRadius: 8, background: defaultOn ? '#0c0a09' : QS.fgSubtle, transition: 'all .15s' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: QS.fg, fontWeight: 500, cursor: 'pointer' }}>
          {value}
          <Icon.chevD style={{ width: 11, height: 11, color: QS.fgFaint }} />
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SettingsScreen });
