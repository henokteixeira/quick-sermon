// Quick Sermon — Usuários / Equipe

function UsersScreen() {
  const members = [
    { name: 'Marcos Costa',     email: 'marcos@igrejacentral.com',  role: 'Admin',    status: 'active',  last: 'Agora',       avatar: 'MC', color: QS.amber },
    { name: 'Ricardo Alves',    email: 'ricardo@igrejacentral.com', role: 'Editor',   status: 'active',  last: 'há 12 min',   avatar: 'RA', color: '#60a5fa' },
    { name: 'Luana Ferreira',   email: 'luana@igrejacentral.com',   role: 'Editor',   status: 'active',  last: 'há 2 horas',  avatar: 'LF', color: '#c4b5fd' },
    { name: 'Daniel Martins',   email: 'daniel@igrejacentral.com',  role: 'Revisor',  status: 'active',  last: 'ontem',       avatar: 'DM', color: QS.ok },
    { name: 'Beatriz Souza',    email: 'bia@igrejacentral.com',     role: 'Revisor',  status: 'invited', last: 'aguardando',  avatar: 'BS', color: '#f472b6' },
    { name: 'Paulo Henrique',   email: 'paulohr@gmail.com',         role: 'Visualização', status: 'suspended', last: 'há 14 dias', avatar: 'PH', color: QS.fgFaint },
  ];

  return (
    <AppShell active="users" title="Equipe" subtitle="Pessoas que colaboram na produção dos clips" headerRight={
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="secondary" size="md" icon={<Icon.link style={{ width: 14, height: 14 }} />}>Link de convite</Btn>
        <Btn variant="primary" icon={<Icon.plus style={{ width: 14, height: 14 }} />}>Convidar membro</Btn>
      </div>
    }>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>

        {/* Resumo em tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
          <TeamStat label="Membros" value="4" caption="ativos" />
          <TeamStat label="Convites" value="1" caption="pendente" accent />
          <TeamStat label="Plano" value="6" unit="/ 10" caption="assentos usados" />
          <TeamStat label="Clips revisados" value="128" caption="este mês" />
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <FilterChip active>Todos <span style={{ opacity: 0.5, marginLeft: 4 }}>6</span></FilterChip>
          <FilterChip>Admins <span style={{ opacity: 0.5, marginLeft: 4 }}>1</span></FilterChip>
          <FilterChip>Editores <span style={{ opacity: 0.5, marginLeft: 4 }}>2</span></FilterChip>
          <FilterChip>Revisores <span style={{ opacity: 0.5, marginLeft: 4 }}>2</span></FilterChip>
          <FilterChip>Pendentes <span style={{ opacity: 0.5, marginLeft: 4 }}>1</span></FilterChip>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: QS.rMd, background: QS.bgElev, border: `1px solid ${QS.line}`, color: QS.fgFaint, fontSize: 12, width: 200 }}>
            <Icon.search style={{ width: 12, height: 12 }} />
            <span>Buscar membro…</span>
          </div>
        </div>

        {/* Table */}
        <div style={{ border: `1px solid ${QS.line}`, borderRadius: QS.rLg, overflow: 'hidden', background: QS.bgElev }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 40px', padding: '10px 18px', borderBottom: `1px solid ${QS.line}`, background: QS.bgElev2, fontSize: 10.5, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            <div>Membro</div>
            <div>Função</div>
            <div>Status</div>
            <div>Última atividade</div>
            <div></div>
          </div>
          {members.map((m, i) => <MemberRow key={i} {...m} last_sep={i < members.length - 1} />)}
        </div>

        {/* Role legend */}
        <div style={{ marginTop: 18, padding: 16, background: QS.bgElev, border: `1px solid ${QS.line}`, borderRadius: QS.rLg, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          <RoleLegend title="Admin" desc="Gerencia equipe, canais, plano e todas as configurações." />
          <RoleLegend title="Editor" desc="Cria vídeos, edita clips e publica no YouTube." />
          <RoleLegend title="Revisor" desc="Revisa, aprova ou descarta clips antes da publicação." />
          <RoleLegend title="Visualização" desc="Acompanha métricas e pipeline sem editar nada." />
        </div>
      </div>
    </AppShell>
  );
}

function TeamStat({ label, value, unit, caption, accent }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: QS.rLg,
      background: accent ? `linear-gradient(135deg, ${QS.amberTint} 0%, transparent 100%)` : QS.bgElev,
      border: `1px solid ${accent ? 'rgba(245,158,11,.22)' : QS.line}`,
    }}>
      <div style={{ fontSize: 11, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <div style={{ fontFamily: QS.serif, fontSize: 26, color: QS.fg, letterSpacing: -0.5, lineHeight: 1 }}>{value}</div>
        {unit && <div style={{ fontSize: 13, color: QS.fgFaint }}>{unit}</div>}
      </div>
      <div style={{ fontSize: 11, color: QS.fgFaint, marginTop: 4 }}>{caption}</div>
    </div>
  );
}

function MemberRow({ name, email, role, status, last, avatar, color, last_sep }) {
  const roleColor = {
    'Admin': { bg: QS.amberTint, fg: QS.amberBright, bd: 'rgba(245,158,11,.28)' },
    'Editor': { bg: 'rgba(96,165,250,.12)', fg: '#93c5fd', bd: 'rgba(96,165,250,.28)' },
    'Revisor': { bg: 'rgba(52,211,153,.1)', fg: QS.ok, bd: 'rgba(52,211,153,.26)' },
    'Visualização': { bg: 'rgba(168,162,158,.1)', fg: QS.fgSubtle, bd: 'rgba(168,162,158,.24)' },
  }[role] || { bg: QS.bgElev2, fg: QS.fgSubtle, bd: QS.line };

  const statusLabel = { active: 'Ativo', invited: 'Convidado', suspended: 'Suspenso' }[status];
  const statusState = { active: 'ready', invited: 'review', suspended: 'discarded' }[status];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 40px', alignItems: 'center', padding: '14px 18px', borderBottom: last_sep ? `1px solid ${QS.line}` : 'none', background: 'transparent', transition: 'background .12s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: color, color: '#0c0a09',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
          opacity: status === 'suspended' ? 0.5 : 1,
          flexShrink: 0,
        }}>{avatar}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: QS.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ fontSize: 11, color: QS.fgFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
        </div>
      </div>
      <div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 999,
          background: roleColor.bg, border: `1px solid ${roleColor.bd}`,
          color: roleColor.fg, fontSize: 11, fontWeight: 500,
        }}>{role}</span>
      </div>
      <div>
        <StatusBadge state={statusState} label={statusLabel} />
      </div>
      <div style={{ fontSize: 12, color: QS.fgSubtle, fontFamily: QS.mono }}>{last}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: 28, height: 28, borderRadius: QS.rSm, display: 'flex', alignItems: 'center', justifyContent: 'center', color: QS.fgFaint, cursor: 'pointer' }}>
          <Icon.more style={{ width: 14, height: 14 }} />
        </div>
      </div>
    </div>
  );
}

function RoleLegend({ title, desc }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: QS.amberBright, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: QS.fgSubtle, lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

// FilterChip might already be defined in screens-videos; re-export safely
if (typeof FilterChip === 'undefined') {
  window.FilterChip = function FilterChip({ active, children }) {
    return (
      <button style={{
        height: 30, padding: '0 12px',
        borderRadius: 999,
        background: active ? QS.amberTint : 'transparent',
        border: `1px solid ${active ? 'rgba(245,158,11,.25)' : QS.line}`,
        color: active ? QS.amberBright : QS.fgSubtle,
        fontSize: 12, fontFamily: QS.sans, fontWeight: 500,
        cursor: 'pointer',
      }}>{children}</button>
    );
  };
}

Object.assign(window, { UsersScreen });
