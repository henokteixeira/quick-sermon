// Quick Sermon — Onboarding / primeiro uso
// Fluxo de 4 telas que aparecem após criar conta: bem-vindo, conectar canal,
// preferências da IA e primeira detecção.

function OnboardingShell({ step, total = 4, children, title, subtitle, primaryLabel, secondaryLabel }) {
  return (
    <div className="qs-root" style={{ width: 520, height: 720, background: QS.bg, color: QS.fgMuted, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <AmberGlow size={360} opacity={0.1} top={-80} right={-40} />
      <AmberGlow size={280} opacity={0.06} bottom={-40} left={-40} color="deep" />

      {/* Header com progresso */}
      <div style={{ padding: '24px 36px 0', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
        <Logomark size={26} />
        <span style={{ fontSize: 10.5, color: QS.fgSubtle, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Quick Sermon</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: QS.fgFaint, fontFamily: QS.mono }}>{step} / {total}</span>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '14px 36px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ height: 3, background: QS.bgElev2, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(step / total) * 100}%`, background: QS.amber, borderRadius: 2, transition: 'width .4s', boxShadow: `0 0 12px ${QS.amberGlow}` }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '28px 36px 0', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <h2 style={{ fontFamily: QS.serif, fontSize: 26, color: QS.fg, margin: 0, letterSpacing: -0.5, lineHeight: 1.15 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: QS.fgSubtle, marginTop: 8, lineHeight: 1.55 }}>{subtitle}</p>}
        <div style={{ marginTop: 22, flex: 1, minHeight: 0, overflow: 'auto' }} className="qs-scroll">{children}</div>
      </div>

      {/* Footer actions */}
      <div style={{ padding: '18px 36px 24px', display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${QS.line}`, background: 'rgba(12,10,9,.5)', position: 'relative', zIndex: 1 }}>
        {secondaryLabel && <Btn variant="ghost" size="md">{secondaryLabel}</Btn>}
        <div style={{ flex: 1 }} />
        <Btn variant="primary" size="md" iconRight={<Icon.arrR style={{ width: 13, height: 13 }} />}>{primaryLabel}</Btn>
      </div>
    </div>
  );
}

// Step 1 — Boas-vindas
function OnboardingWelcomeScreen() {
  return (
    <OnboardingShell step={1} title="Bem-vindo, Marcos." subtitle="Em menos de 3 minutos a Quick Sermon vai estar cortando clips do seu próximo culto. Vamos começar conectando sua conta." primaryLabel="Começar" secondaryLabel="Pular tour">
      {/* Hero visual */}
      <div style={{ position: 'relative', padding: 24, background: QS.bgElev, border: `1px solid ${QS.line}`, borderRadius: QS.rLg, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,0,51,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.youtube style={{ width: 16, height: 16, color: '#ff0033' }} />
          </div>
          <div style={{ width: 36, height: 2, background: `linear-gradient(to right, ${QS.amber}, transparent)` }} />
          <div style={{ width: 30, height: 30, borderRadius: 8, background: QS.amberTint2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.sparkle style={{ width: 15, height: 15, color: QS.amberBright }} />
          </div>
          <div style={{ width: 36, height: 2, background: `linear-gradient(to right, ${QS.amber}, transparent)` }} />
          <div style={{ width: 30, height: 30, borderRadius: 8, background: QS.okTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.scissors style={{ width: 15, height: 15, color: QS.ok }} />
          </div>
        </div>
        <div style={{ fontSize: 12, color: QS.fgMuted, lineHeight: 1.6 }}>
          Conecta seu canal do YouTube, a IA escuta a pregação inteira e propõe <span style={{ color: QS.amberBright, fontWeight: 600 }}>os 3 a 5 momentos mais fortes</span> — prontos para publicar ou compartilhar no WhatsApp.
        </div>
      </div>

      <OnboardFeature icon={<Icon.bolt />} title="Economia de horas" body="O que levava uma tarde inteira de edição agora sai em 8 minutos." />
      <OnboardFeature icon={<Icon.users />} title="Colabore com sua equipe" body="Convide revisores e editores para aprovar clips antes da publicação." />
      <OnboardFeature icon={<Icon.trend />} title="Aprende com o tempo" body="A IA melhora a detecção conforme você aprova e descarta trechos." />
    </OnboardingShell>
  );
}

function OnboardFeature({ icon, title, body }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 4px' }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: QS.amberTint, border: `1px solid rgba(245,158,11,.18)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: QS.amberBright,
      }}>
        {React.cloneElement(icon, { style: { width: 14, height: 14 } })}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: QS.fg, fontWeight: 600, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: QS.fgSubtle, lineHeight: 1.45 }}>{body}</div>
      </div>
    </div>
  );
}

// Step 2 — Conectar canal do YouTube
function OnboardingConnectScreen() {
  return (
    <OnboardingShell step={2} title="Conecte seu canal" subtitle="Autorize o YouTube para que a Quick Sermon possa baixar seus cultos e publicar os clips aprovados." primaryLabel="Conectar YouTube" secondaryLabel="Voltar">
      {/* Big connect card */}
      <div style={{
        padding: 22,
        background: QS.bgElev,
        border: `1px solid ${QS.line}`,
        borderRadius: QS.rLg,
        marginBottom: 16,
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'rgba(255,0,51,.1)',
          border: '1px solid rgba(255,0,51,.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
        }}>
          <Icon.youtube style={{ width: 28, height: 28, color: '#ff0033' }} />
        </div>
        <div style={{ fontSize: 14, color: QS.fg, fontWeight: 600, marginBottom: 4 }}>YouTube</div>
        <div style={{ fontSize: 11.5, color: QS.fgSubtle, lineHeight: 1.5 }}>Acesso de leitura aos seus vídeos e upload dos clips aprovados.</div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${QS.line}`, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
          <PermRow label="Ler vídeos do canal" ok />
          <PermRow label="Enviar clips processados" ok />
          <PermRow label="Publicar comentários em seu nome" />
        </div>
      </div>

      {/* Skip option */}
      <div style={{ padding: 14, background: QS.bgElev2, border: `1px dashed ${QS.line}`, borderRadius: QS.rMd, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon.upload style={{ width: 14, height: 14, color: QS.fgFaint, flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 11.5, color: QS.fgSubtle, lineHeight: 1.4 }}>
          Prefere começar sem conectar? <span style={{ color: QS.amberBright, fontWeight: 600, cursor: 'pointer' }}>Fazer upload manual de um vídeo.</span>
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: QS.fgFaint, lineHeight: 1.5, textAlign: 'center' }}>
        🔒 Você pode revogar o acesso a qualquer momento em Configurações.
      </div>
    </OnboardingShell>
  );
}

function PermRow({ label, ok }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 16, height: 16, borderRadius: 4,
        background: ok ? 'rgba(52,211,153,.18)' : 'transparent',
        border: `1px solid ${ok ? 'rgba(52,211,153,.4)' : QS.lineStrong}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {ok && <Icon.check style={{ width: 10, height: 10, color: QS.ok }} />}
      </div>
      <span style={{ fontSize: 12, color: ok ? QS.fgMuted : QS.fgFaint }}>{label}</span>
      {!ok && <span style={{ fontSize: 10, color: QS.fgFaint, marginLeft: 'auto' }}>opcional</span>}
    </div>
  );
}

// Step 3 — Preferências da IA
function OnboardingAIScreen() {
  const [tone, setTone] = React.useState('pastoral');
  return (
    <OnboardingShell step={3} title="Ajuste o tom da IA" subtitle="Isso define como títulos, descrições e mensagens serão geradas. Você pode mudar depois." primaryLabel="Continuar" secondaryLabel="Voltar">

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 10 }}>Tom de voz</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToneOption id="pastoral"   label="Pastoral · acolhedor" body="“Venha descansar no convite que Deus fez pra você hoje.”" active={tone === 'pastoral'} onClick={() => setTone('pastoral')} />
          <ToneOption id="didatico"   label="Didático · direto"    body="“3 passos práticos pra enfrentar a ansiedade, segundo a Bíblia.”" active={tone === 'didatico'} onClick={() => setTone('didatico')} />
          <ToneOption id="energico"   label="Enérgico · juvenil"   body="“Esse trecho da pregação vai sacudir sua semana. Dá play!”" active={tone === 'energico'} onClick={() => setTone('energico')} />
          <ToneOption id="reflexivo"  label="Reflexivo · contemplativo" body="“Uma pausa. Um versículo. Uma pergunta pra levar o dia.”" active={tone === 'reflexivo'} onClick={() => setTone('reflexivo')} />
        </div>
      </div>

      <div style={{ padding: 14, background: QS.bgElev, border: `1px solid ${QS.line}`, borderRadius: QS.rMd }}>
        <div style={{ fontSize: 11, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 12 }}>Preferências rápidas</div>
        <ToggleRow label="Incluir versículo bíblico" on />
        <ToggleRow label="Usar emojis nas descrições" on />
        <ToggleRow label="Call-to-action no final" on last />
      </div>
    </OnboardingShell>
  );
}

function ToneOption({ label, body, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: 12,
      borderRadius: QS.rMd,
      background: active ? QS.amberTint : QS.bgElev,
      border: `1px solid ${active ? 'rgba(245,158,11,.35)' : QS.line}`,
      boxShadow: active ? `0 0 0 2px ${QS.amberGlow}` : 'none',
      cursor: 'pointer',
      transition: 'all .14s',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: active ? QS.amber : 'transparent',
        border: `1.5px solid ${active ? QS.amber : QS.lineStrong}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0c0a09' }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, color: active ? QS.fg : QS.fgMuted, fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: active ? QS.fgMuted : QS.fgFaint, fontStyle: 'italic', lineHeight: 1.4 }}>{body}</div>
      </div>
    </div>
  );
}

function ToggleRow({ label, on, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: last ? 'none' : `1px solid ${QS.lineSoft}` }}>
      <span style={{ fontSize: 12.5, color: QS.fgMuted }}>{label}</span>
      <div style={{
        width: 32, height: 18, borderRadius: 9,
        background: on ? QS.amber : QS.bgElev2,
        border: `1px solid ${on ? 'transparent' : QS.line}`,
        position: 'relative', cursor: 'pointer',
      }}>
        <div style={{ position: 'absolute', top: 1, left: on ? 15 : 1, width: 14, height: 14, borderRadius: '50%', background: on ? '#0c0a09' : QS.fgSubtle, transition: 'left .15s' }} />
      </div>
    </div>
  );
}

// Step 4 — Primeiro vídeo / sucesso
function OnboardingFirstDetectionScreen() {
  return (
    <OnboardingShell step={4} title="Tudo pronto!" subtitle="Seu canal está conectado e a IA já começou a analisar seu vídeo mais recente." primaryLabel="Ir para o dashboard" secondaryLabel="Voltar">

      {/* Success state */}
      <div style={{
        padding: 20,
        background: `linear-gradient(135deg, ${QS.amberTint} 0%, transparent 100%)`,
        border: '1px solid rgba(245,158,11,.25)',
        borderRadius: QS.rLg,
        marginBottom: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: QS.amberTint2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245,158,11,.3)' }}>
              <Icon.sparkle style={{ width: 18, height: 18, color: QS.amberBright }} />
            </div>
            <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${QS.amber}`, opacity: 0.4, animation: 'qs-ping 1.8s ease-in-out infinite' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: QS.fg, fontWeight: 600 }}>Detectando trechos…</div>
            <div style={{ fontSize: 11, color: QS.fgSubtle, marginTop: 2 }}>Culto de Domingo · 13 de Abril · 1h 48min</div>
          </div>
          <StatusBadge state="detecting" label="64%" pulse />
        </div>

        {/* Mini progress */}
        <div style={{ height: 4, background: QS.bgElev2, borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ height: '100%', width: '64%', background: QS.amber, borderRadius: 2, boxShadow: `0 0 8px ${QS.amberGlow}` }} />
        </div>
        <div style={{ fontSize: 11, color: QS.fgFaint, fontFamily: QS.mono }}>ETA ≈ 3 min · te avisamos no email quando terminar</div>
      </div>

      {/* Próximos passos */}
      <div style={{ fontSize: 11, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 10 }}>Enquanto isso, você pode</div>
      <NextStep icon={<Icon.users />} title="Convidar sua equipe" body="Adicione revisores pra dividir o trabalho de aprovação." />
      <NextStep icon={<Icon.upload />} title="Subir outro vídeo" body="Se não usa YouTube ou quer processar um arquivo específico." />
      <NextStep icon={<Icon.youtube />} title="Conectar um 2º canal" body="Gerencie vários canais (ex.: oficial + devocional do pastor)." />
    </OnboardingShell>
  );
}

function NextStep({ icon, title, body }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: QS.rMd, background: QS.bgElev, border: `1px solid ${QS.line}`, marginBottom: 8, cursor: 'pointer' }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: QS.bgElev2, border: `1px solid ${QS.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: QS.fgSubtle,
      }}>
        {React.cloneElement(icon, { style: { width: 14, height: 14 } })}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, color: QS.fg, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 11, color: QS.fgSubtle, marginTop: 2, lineHeight: 1.4 }}>{body}</div>
      </div>
      <Icon.chevR style={{ width: 14, height: 14, color: QS.fgFaint, alignSelf: 'center' }} />
    </div>
  );
}

Object.assign(window, { OnboardingWelcomeScreen, OnboardingConnectScreen, OnboardingAIScreen, OnboardingFirstDetectionScreen });
