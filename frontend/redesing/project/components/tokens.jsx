// Quick Sermon — Design Tokens
// Unified warm stone/amber dark theme derived from the landing page.

const QS = {
  // Backgrounds (stone-950 family)
  bg: '#0c0a09',          // stone-950 — primary canvas
  bgElev: '#171412',      // stone-900 w/ warm tint — cards, rails
  bgElev2: '#1c1917',     // stone-900 — popovers, inputs
  bgSubtle: '#201c19',    // hover on elev

  // Lines
  line: '#2a2522',        // stone-800 warm
  lineStrong: '#3a322d',  // hover borders
  lineSoft: 'rgba(255,255,255,.04)',

  // Text
  fg: '#fafaf9',          // stone-50 — headings
  fgMuted: '#d6d3d1',     // stone-300 — body
  fgSubtle: '#a8a29e',    // stone-400 — secondary
  fgFaint: '#78716c',     // stone-500 — meta
  fgGhost: '#57534e',     // stone-600 — placeholder

  // Brand — amber
  amber: '#f59e0b',       // amber-500 — primary
  amberBright: '#fbbf24', // amber-400 — hover
  amberDeep: '#d97706',   // amber-600 — pressed
  amberTint: 'rgba(245,158,11,.10)',
  amberTint2: 'rgba(245,158,11,.16)',
  amberGlow: 'rgba(245,158,11,.18)',

  // Semantic
  ok: '#34d399',          // emerald-400
  okTint: 'rgba(52,211,153,.12)',
  warn: '#fbbf24',
  danger: '#f87171',      // red-400
  dangerTint: 'rgba(248,113,113,.12)',
  info: '#60a5fa',

  // Fonts
  serif: '"DM Serif Display", Georgia, serif',
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',

  // Radii
  rSm: 6, rMd: 10, rLg: 14, rXl: 18,

  // Shadows
  shadow: '0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.2)',
  shadowGlow: '0 0 0 1px rgba(245,158,11,.3), 0 8px 32px rgba(245,158,11,.15)',
};

// Subtle ambient amber glow — matches landing
function AmberGlow({ size = 400, opacity = 0.08, top, left, right, bottom, color = 'amber' }) {
  const bg = color === 'amber' ? `rgba(245,158,11,${opacity})` :
             color === 'deep' ? `rgba(180,83,9,${opacity})` :
             `rgba(245,158,11,${opacity})`;
  return (
    <div style={{
      position: 'absolute', top, left, right, bottom,
      width: size, height: size,
      borderRadius: '50%',
      background: bg,
      filter: `blur(${Math.round(size / 3.5)}px)`,
      pointerEvents: 'none',
      zIndex: 0,
    }} />
  );
}

// Play-triangle logomark — consistent across all screens
function Logomark({ size = 32, style }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: QS.amber,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(245,158,11,.3)',
      ...style,
    }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="#0c0a09" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" fill="#0c0a09" />
      </svg>
    </div>
  );
}

// Status dot — operational / warning / down
function StatusDot({ state = 'ok', size = 8, pulse = false }) {
  const color = state === 'ok' ? QS.ok : state === 'warn' ? QS.warn : state === 'down' ? QS.danger : QS.fgFaint;
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
      {pulse && (
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.5, animation: 'qs-ping 1.8s cubic-bezier(0,0,.2,1) infinite' }} />
      )}
      <span style={{ position: 'relative', width: size, height: size, borderRadius: '50%', background: color }} />
    </span>
  );
}

// Status badge — unified pill style used across videos + clips + pipeline
function StatusBadge({ state = 'pending', label, pulse = false }) {
  // State → color mapping
  const map = {
    pending:   { fg: QS.fgSubtle, bg: 'rgba(168,162,158,.1)',  bd: 'rgba(168,162,158,.25)' },
    detecting: { fg: '#93c5fd',   bg: 'rgba(96,165,250,.12)',  bd: 'rgba(96,165,250,.28)' },
    processing:{ fg: QS.amberBright, bg: QS.amberTint,          bd: 'rgba(245,158,11,.3)' },
    downloading:{fg: QS.amberBright, bg: QS.amberTint,          bd: 'rgba(245,158,11,.3)' },
    trimming:  { fg: QS.amberBright, bg: QS.amberTint,          bd: 'rgba(245,158,11,.3)' },
    uploading: { fg: QS.amberBright, bg: QS.amberTint,          bd: 'rgba(245,158,11,.3)' },
    review:    { fg: '#c4b5fd',   bg: 'rgba(167,139,250,.12)', bd: 'rgba(167,139,250,.28)' },
    awaiting_review: { fg: '#c4b5fd', bg: 'rgba(167,139,250,.12)', bd: 'rgba(167,139,250,.28)' },
    ready:     { fg: QS.ok,       bg: QS.okTint,                bd: 'rgba(52,211,153,.28)' },
    published: { fg: QS.ok,       bg: QS.okTint,                bd: 'rgba(52,211,153,.28)' },
    completed: { fg: QS.ok,       bg: QS.okTint,                bd: 'rgba(52,211,153,.28)' },
    error:     { fg: QS.danger,   bg: QS.dangerTint,            bd: 'rgba(248,113,113,.28)' },
    discarded: { fg: QS.fgFaint,  bg: 'rgba(120,113,108,.15)',  bd: 'rgba(120,113,108,.3)' },
  };
  const c = map[state] || map.pending;
  const active = ['processing','downloading','trimming','uploading','detecting'].includes(state);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px 3px 8px',
      borderRadius: 999,
      background: c.bg,
      border: `1px solid ${c.bd}`,
      color: c.fg,
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: 0.1,
      fontFamily: QS.sans,
      whiteSpace: 'nowrap',
    }}>
      <StatusDot state={state === 'published' || state === 'ready' || state === 'completed' ? 'ok' : state === 'error' ? 'down' : 'warn'} size={6} pulse={pulse || active} />
      {label}
    </span>
  );
}

// Button primitive used everywhere
function Btn({ variant = 'primary', size = 'md', children, icon, iconRight, fullWidth, style, ...rest }) {
  const h = size === 'sm' ? 30 : size === 'lg' ? 44 : 36;
  const px = size === 'sm' ? 12 : size === 'lg' ? 22 : 16;
  const fs = size === 'sm' ? 12 : size === 'lg' ? 14 : 13;
  const variants = {
    primary: {
      background: QS.amber, color: '#0c0a09',
      boxShadow: '0 1px 2px rgba(0,0,0,.2), 0 0 0 1px rgba(245,158,11,.3), 0 4px 14px rgba(245,158,11,.25)',
    },
    secondary: {
      background: QS.bgElev2, color: QS.fgMuted,
      border: `1px solid ${QS.line}`,
    },
    ghost: {
      background: 'transparent', color: QS.fgSubtle,
    },
    danger: {
      background: 'rgba(248,113,113,.1)', color: QS.danger,
      border: `1px solid rgba(248,113,113,.25)`,
    },
    outline: {
      background: 'transparent', color: QS.fg,
      border: `1px solid ${QS.line}`,
    },
  };
  return (
    <button {...rest} style={{
      height: h, padding: `0 ${px}px`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 6,
      borderRadius: size === 'lg' ? QS.rLg : QS.rMd,
      border: 'none',
      fontFamily: QS.sans,
      fontSize: fs,
      fontWeight: 600,
      letterSpacing: 0.1,
      cursor: 'pointer',
      width: fullWidth ? '100%' : undefined,
      whiteSpace: 'nowrap',
      ...variants[variant],
      ...style,
    }}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

// Card — unified surface
function Card({ children, pad = 20, style, hover = false, ...rest }) {
  return (
    <div {...rest} style={{
      background: QS.bgElev,
      border: `1px solid ${QS.line}`,
      borderRadius: QS.rLg,
      padding: pad,
      position: 'relative',
      ...style,
    }}>{children}</div>
  );
}

// Inject global animations + font once
if (typeof document !== 'undefined' && !document.getElementById('qs-base')) {
  const s = document.createElement('style');
  s.id = 'qs-base';
  s.textContent = `
    @keyframes qs-ping { 75%,100% { transform: scale(2.2); opacity: 0; } }
    @keyframes qs-spin { to { transform: rotate(360deg); } }
    @keyframes qs-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes qs-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .qs-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .qs-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 3px; }
    .qs-scroll::-webkit-scrollbar-track { background: transparent; }
    .qs-root, .qs-root * { box-sizing: border-box; }
    .qs-root { font-family: Inter, -apple-system, sans-serif; font-feature-settings: 'cv11','ss01'; }
  `;
  document.head.appendChild(s);

  // Fonts
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
  document.head.appendChild(link);
}

// Icon set — feather-style, consistent stroke
const Icon = {
  play:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
  plus:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  grid:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  video:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  users:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  cog:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  search: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  bell:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  clock:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  eye:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  cal:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  chevR:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  chevL:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevD:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  arrL:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  arrR:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  scissors:(p)=> <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>,
  upload: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  download:(p)=> <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  check:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x:      (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="6"/></svg>,
  sparkle:(p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.09 6.26L20 12l-5.91 2.74L12 21l-2.09-6.26L4 12l5.91-2.74L12 3z"/><path d="M19 3v4M17 5h4"/></svg>,
  refresh:(p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>,
  edit:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  link:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  copy:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  youtube:(p) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5C0 8.4 0 12 0 12s0 3.6.5 5.5a3 3 0 0 0 2.1 2.1C4.5 20 12 20 12 20s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.5.5-5.5s0-3.6-.5-5.5zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>,
  wa:     (p) => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2 0 1.3.9 2.6 1.1 2.7.1.2 1.9 2.8 4.5 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.2zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.5.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>,
  bolt:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  filmstrip:(p)=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="1"/><line x1="7" y1="4" x2="7" y2="20"/><line x1="17" y1="4" x2="17" y2="20"/><line x1="2" y1="9" x2="7" y2="9"/><line x1="2" y1="15" x2="7" y2="15"/><line x1="17" y1="9" x2="22" y2="9"/><line x1="17" y1="15" x2="22" y2="15"/></svg>,
  mic:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  trend:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  pause:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  user:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  card:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  more:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  pipeline:(p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h13l4 4-4 4H3"/><path d="M3 14h9l4 4-4 4H3"/></svg>,
  warn:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  file:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  caption:(p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M7 11h3M7 15h2M14 11h3M14 15h3"/></svg>,
  zoomI:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  zoomO:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
};

Object.assign(window, { QS, AmberGlow, Logomark, StatusDot, StatusBadge, Btn, Card, Icon });
