// Quick Sermon — App Shell (sidebar, topbar, frame)
// Collapsible icon-rail sidebar that expands on hover.

function AppShell({ active = 'dashboard', expanded = false, user = { name: 'Marcos Costa', role: 'admin', initial: 'M' }, children, width = 1200, height = 800, title, subtitle, headerRight, padding = 32, showAmbient = true }) {
  const nav = [
    { key: 'dashboard', label: 'Dashboard', Icon: Icon.grid },
    { key: 'videos',    label: 'Vídeos',    Icon: Icon.video },
    { key: 'pipeline',  label: 'Pipeline',  Icon: Icon.pipeline },
    { key: 'users',     label: 'Usuários',  Icon: Icon.users },
    { key: 'settings',  label: 'Config.',   Icon: Icon.cog },
  ];

  const railW = expanded ? 220 : 64;

  return (
    <div className="qs-root" style={{ width, height, background: QS.bg, color: QS.fgMuted, display: 'flex', overflow: 'hidden', position: 'relative' }}>
      {/* Sidebar */}
      <aside style={{
        width: railW, flexShrink: 0,
        background: '#0a0807',
        borderRight: `1px solid ${QS.line}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width .22s cubic-bezier(.2,.7,.3,1)',
        position: 'relative', zIndex: 3,
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 22px', display: 'flex', alignItems: 'center', gap: 10, height: 64 }}>
          <Logomark size={30} />
          {expanded && (
            <span style={{ fontFamily: QS.serif, fontSize: 18, color: QS.fg, letterSpacing: -0.3, whiteSpace: 'nowrap' }}>Quick Sermon</span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map(item => {
            const isActive = item.key === active;
            return (
              <div key={item.key} title={!expanded ? item.label : ''} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                height: 40, padding: '0 12px',
                borderRadius: QS.rMd,
                background: isActive ? QS.amberTint : 'transparent',
                color: isActive ? QS.amberBright : QS.fgSubtle,
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                cursor: 'pointer', position: 'relative',
                transition: 'all .12s',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}>
                {isActive && <div style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 2, borderRadius: 2, background: QS.amber }} />}
                <item.Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                {expanded && <span>{item.label}</span>}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: 10, borderTop: `1px solid ${QS.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: QS.rMd }}>
            <div style={{ width: 30, height: 30, borderRadius: 15, background: QS.amber, color: '#0c0a09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{user.initial}</div>
            {expanded && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: QS.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                  <div style={{ fontSize: 10, color: QS.fgFaint, textTransform: 'capitalize' }}>{user.role}</div>
                </div>
                <Icon.logout style={{ width: 14, height: 14, color: QS.fgFaint }} />
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, overflow: 'auto', position: 'relative' }} className="qs-scroll">
        {showAmbient && <AmberGlow size={480} opacity={0.05} top={-80} right={-80} />}

        {/* Top bar */}
        <div style={{
          height: 64, padding: '0 32px',
          borderBottom: `1px solid ${QS.line}`,
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'rgba(12,10,9,.6)', backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 2,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <div style={{ fontFamily: QS.serif, fontSize: 20, color: QS.fg, letterSpacing: -0.3, lineHeight: 1.1 }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 12, color: QS.fgFaint, marginTop: 2 }}>{subtitle}</div>}
          </div>
          {headerRight}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            height: 34, padding: '0 12px',
            borderRadius: QS.rMd,
            border: `1px solid ${QS.line}`,
            background: QS.bgElev,
            color: QS.fgFaint, fontSize: 12,
            width: 220,
          }}>
            <Icon.search style={{ width: 14, height: 14 }} />
            <span>Buscar vídeos, clips…</span>
            <span style={{ marginLeft: 'auto', padding: '2px 5px', borderRadius: 4, background: QS.bgElev2, fontSize: 10, fontFamily: QS.mono, border: `1px solid ${QS.line}` }}>⌘K</span>
          </div>
          <div style={{ position: 'relative' }}>
            <Icon.bell style={{ width: 18, height: 18, color: QS.fgSubtle }} />
            <div style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: QS.amber, border: `2px solid ${QS.bg}` }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding, position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}

// Auth shell — full dark, ambient glows, logo header
function AuthShell({ children, width = 520, height = 720, subtitle }) {
  return (
    <div className="qs-root" style={{ width, height, background: QS.bg, color: QS.fgMuted, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <AmberGlow size={380} opacity={0.12} top={-80} left={-60} />
      <AmberGlow size={300} opacity={0.08} bottom={-40} right={-40} color="deep" />

      {/* Header */}
      <div style={{ padding: '28px 40px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <Logomark size={30} />
        <span style={{ fontSize: 11, color: QS.fgSubtle, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Quick Sermon</span>
      </div>

      {/* Form area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 40px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Metric tile used across dashboard
function MetricTile({ label, value, unit, trend, sparkline, accent = false }) {
  return (
    <div style={{
      padding: 18,
      borderRadius: QS.rLg,
      background: accent ? `linear-gradient(135deg, ${QS.amberTint} 0%, transparent 100%)` : QS.bgElev,
      border: `1px solid ${accent ? 'rgba(245,158,11,.22)' : QS.line}`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{label}</div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: trend > 0 ? QS.ok : QS.danger, fontFamily: QS.mono, fontWeight: 600 }}>
            <Icon.trend style={{ width: 11, height: 11 }} />
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <div style={{ fontFamily: QS.serif, fontSize: 32, color: QS.fg, letterSpacing: -0.8, lineHeight: 1 }}>{value}</div>
        {unit && <div style={{ fontSize: 13, color: QS.fgFaint, fontWeight: 500 }}>{unit}</div>}
      </div>
      {sparkline && (
        <svg width="100%" height="28" viewBox="0 0 100 28" preserveAspectRatio="none" style={{ marginTop: 10, display: 'block' }}>
          <path d={sparkline} fill="none" stroke={QS.amber} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          <path d={sparkline + ' L 100 28 L 0 28 Z'} fill={QS.amber} opacity="0.08" />
        </svg>
      )}
    </div>
  );
}

// Thumbnail placeholder — striped, like landing's design language
function ThumbPlaceholder({ w = 180, h = 100, label, overlay }) {
  return (
    <div style={{
      width: w, height: h,
      borderRadius: QS.rMd,
      background: `repeating-linear-gradient(135deg, ${QS.bgElev2} 0 6px, ${QS.bgSubtle} 6px 12px)`,
      border: `1px solid ${QS.line}`,
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon.play style={{ width: 12, height: 12, color: QS.fg, marginLeft: 1 }} />
      </div>
      {label && (
        <div style={{ position: 'absolute', bottom: 6, right: 6, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,.75)', fontSize: 10, color: QS.fg, fontFamily: QS.mono, fontWeight: 600 }}>{label}</div>
      )}
      {overlay}
    </div>
  );
}

Object.assign(window, { AppShell, AuthShell, MetricTile, ThumbPlaceholder });
