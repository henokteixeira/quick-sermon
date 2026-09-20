// Quick Sermon — Esqueci minha senha (3 passos)

function ForgotStep({ n, label, state }) {
  // state: done | active | idle
  const isDone = state === 'done';
  const isActive = state === 'active';
  const bg = isActive ? QS.amber : isDone ? 'rgba(52,211,153,.15)' : 'transparent';
  const bd = isActive ? 'transparent' : isDone ? 'rgba(52,211,153,.4)' : QS.line;
  const fg = isActive ? '#0c0a09' : isDone ? QS.ok : QS.fgFaint;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: bg, border: `1px solid ${bd}`,
        color: fg, fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: QS.mono,
      }}>
        {isDone ? <Icon.check style={{ width: 11, height: 11 }} /> : n}
      </div>
      <span style={{ fontSize: 11, color: isActive ? QS.fg : isDone ? QS.fgMuted : QS.fgFaint, fontWeight: isActive ? 600 : 500, letterSpacing: 0.2 }}>{label}</span>
    </div>
  );
}

function ForgotStepper({ step = 1 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, padding: '0 4px' }}>
      <ForgotStep n={1} label="Email" state={step > 1 ? 'done' : step === 1 ? 'active' : 'idle'} />
      <div style={{ flex: 1, height: 1, background: step > 1 ? QS.ok : QS.line, opacity: step > 1 ? 0.4 : 1 }} />
      <ForgotStep n={2} label="Código" state={step > 2 ? 'done' : step === 2 ? 'active' : 'idle'} />
      <div style={{ flex: 1, height: 1, background: step > 2 ? QS.ok : QS.line, opacity: step > 2 ? 0.4 : 1 }} />
      <ForgotStep n={3} label="Nova senha" state={step === 3 ? 'active' : step > 3 ? 'done' : 'idle'} />
    </div>
  );
}

// Step 1 — pede email
function ForgotStep1Screen() {
  return (
    <AuthShell>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, cursor: 'pointer' }}>
        <Icon.arrL style={{ width: 14, height: 14, color: QS.fgSubtle }} />
        <span style={{ fontSize: 12, color: QS.fgSubtle, fontWeight: 500 }}>Voltar ao login</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: QS.serif, fontSize: 26, color: QS.fg, margin: 0, letterSpacing: -0.4 }}>Esqueceu a senha?</h2>
        <p style={{ fontSize: 13, color: QS.fgSubtle, marginTop: 6, lineHeight: 1.55 }}>Informe seu email e enviaremos um código de 6 dígitos para redefinir.</p>
      </div>

      <ForgotStepper step={1} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthField label="Email cadastrado" placeholder="seu@email.com" value="marcos@igrejacentral.com" />
        <Btn variant="primary" size="lg" fullWidth style={{ marginTop: 4 }} iconRight={<Icon.arrR style={{ width: 14, height: 14 }} />}>Enviar código</Btn>
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: QS.fgFaint }}>Precisa de ajuda? </span>
        <span style={{ fontSize: 11, color: QS.amberBright, fontWeight: 600, cursor: 'pointer' }}>Falar com suporte</span>
      </div>
    </AuthShell>
  );
}

// Step 2 — código OTP
function ForgotStep2Screen() {
  const digits = ['4','8','2','9','',''];
  return (
    <AuthShell>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, cursor: 'pointer' }}>
        <Icon.arrL style={{ width: 14, height: 14, color: QS.fgSubtle }} />
        <span style={{ fontSize: 12, color: QS.fgSubtle, fontWeight: 500 }}>Alterar email</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: QS.serif, fontSize: 26, color: QS.fg, margin: 0, letterSpacing: -0.4 }}>Digite o código</h2>
        <p style={{ fontSize: 13, color: QS.fgSubtle, marginTop: 6, lineHeight: 1.55 }}>
          Enviamos para <span style={{ color: QS.fgMuted, fontWeight: 500 }}>m••••os@igrejacentral.com</span>
        </p>
      </div>

      <ForgotStepper step={2} />

      {/* OTP boxes */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 6 }}>
        {digits.map((d, i) => (
          <div key={i} style={{
            width: 48, height: 56,
            borderRadius: QS.rMd,
            background: QS.bgElev,
            border: `1px solid ${d ? 'rgba(245,158,11,.35)' : i === 4 ? QS.amber : QS.line}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: QS.serif, fontSize: 26, color: d ? QS.fg : QS.fgFaint,
            boxShadow: i === 4 ? `0 0 0 3px ${QS.amberGlow}` : 'none',
            position: 'relative',
          }}>
            {d}
            {i === 4 && !d && (
              <div style={{ position: 'absolute', width: 1.5, height: 24, background: QS.amber, animation: 'qs-ping 1s ease-in-out infinite alternate' }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: QS.fgFaint }}>
        Não recebeu? <span style={{ color: QS.amberBright, fontWeight: 600, cursor: 'pointer' }}>Reenviar em 00:42</span>
      </div>

      <Btn variant="primary" size="lg" fullWidth style={{ marginTop: 24 }} iconRight={<Icon.arrR style={{ width: 14, height: 14 }} />}>Verificar código</Btn>
    </AuthShell>
  );
}

// Step 3 — nova senha
function ForgotStep3Screen() {
  return (
    <AuthShell>
      <div style={{ marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: QS.rLg,
          background: 'rgba(52,211,153,.12)',
          border: '1px solid rgba(52,211,153,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}>
          <Icon.check style={{ width: 18, height: 18, color: QS.ok }} />
        </div>
        <h2 style={{ fontFamily: QS.serif, fontSize: 26, color: QS.fg, margin: 0, letterSpacing: -0.4 }}>Crie uma nova senha</h2>
        <p style={{ fontSize: 13, color: QS.fgSubtle, marginTop: 6, lineHeight: 1.55 }}>Código verificado. Agora escolha uma senha forte que você vá lembrar.</p>
      </div>

      <ForgotStepper step={3} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthField label="Nova senha" type="password" placeholder="Mín. 8 caracteres" value="••••••••••" hint={<PasswordStrength />} />
        <AuthField label="Confirmar nova senha" type="password" placeholder="Repita a senha" value="••••••••••" />
      </div>

      {/* Checklist de requisitos */}
      <div style={{ marginTop: 14, padding: 12, background: QS.bgElev, border: `1px solid ${QS.line}`, borderRadius: QS.rMd }}>
        <ReqRow ok>Ao menos 8 caracteres</ReqRow>
        <ReqRow ok>Uma letra maiúscula</ReqRow>
        <ReqRow ok>Um número</ReqRow>
        <ReqRow>Um caractere especial (!@#$%)</ReqRow>
      </div>

      <Btn variant="primary" size="lg" fullWidth style={{ marginTop: 18 }}>Redefinir senha</Btn>
    </AuthShell>
  );
}

function ReqRow({ ok, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        background: ok ? 'rgba(52,211,153,.18)' : 'transparent',
        border: `1px solid ${ok ? 'rgba(52,211,153,.4)' : QS.lineStrong}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {ok && <Icon.check style={{ width: 9, height: 9, color: QS.ok }} />}
      </div>
      <span style={{ fontSize: 11.5, color: ok ? QS.fgMuted : QS.fgFaint, fontWeight: ok ? 500 : 400 }}>{children}</span>
    </div>
  );
}

Object.assign(window, { ForgotStep1Screen, ForgotStep2Screen, ForgotStep3Screen });
