// Quick Sermon — Auth screens

function LoginScreen() {
  return (
    <AuthShell>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontFamily: QS.serif, fontSize: 28, color: QS.fg, margin: 0, letterSpacing: -0.5 }}>Bem-vindo de volta</h2>
        <p style={{ fontSize: 13, color: QS.fgSubtle, marginTop: 8 }}>Entre na sua conta para continuar</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AuthField label="Email" placeholder="seu@email.com" value="marcos@igrejacentral.com" />
        <AuthField label="Senha" placeholder="Sua senha" type="password" value="••••••••••" rightSlot={
          <Icon.eye style={{ width: 14, height: 14, color: QS.fgFaint }} />
        } />
        <div style={{ textAlign: 'right', marginTop: -4 }}>
          <span style={{ fontSize: 12, color: QS.amberBright, fontWeight: 500, cursor: 'pointer' }}>Esqueci minha senha</span>
        </div>
        <Btn variant="primary" size="lg" fullWidth style={{ marginTop: 8 }}>Entrar</Btn>
      </div>

      <div style={{ margin: '28px 0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: QS.line }} />
        <span style={{ fontSize: 11, color: QS.fgFaint, textTransform: 'uppercase', letterSpacing: 1.5 }}>ou</span>
        <div style={{ flex: 1, height: 1, background: QS.line }} />
      </div>

      <Btn variant="secondary" size="lg" fullWidth icon={<Icon.youtube style={{ width: 16, height: 16, color: '#ff0033' }} />}>
        Continuar com Google
      </Btn>

      <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${QS.line}`, textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: QS.fgFaint }}>Não tem conta? </span>
        <span style={{ fontSize: 12, color: QS.amberBright, fontWeight: 600, cursor: 'pointer' }}>Criar conta</span>
      </div>
    </AuthShell>
  );
}

function RegisterScreen() {
  return (
    <AuthShell>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 style={{ fontFamily: QS.serif, fontSize: 26, color: QS.fg, margin: 0, letterSpacing: -0.4 }}>Criar sua conta</h2>
        <p style={{ fontSize: 13, color: QS.fgSubtle, marginTop: 6 }}>Preencha os dados para começar</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthField label="Nome" placeholder="Seu nome completo" value="Marcos Costa" />
        <AuthField label="Email" placeholder="seu@email.com" value="marcos@igrejacentral.com" />
        <AuthField label="Senha" type="password" placeholder="Mín. 8 caracteres" value="••••••••" hint={<PasswordStrength />} />
        <AuthField label="Confirmar senha" type="password" placeholder="Repita a senha" value="••••••••" />
        <Btn variant="primary" size="lg" fullWidth style={{ marginTop: 6 }}>Criar conta</Btn>
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: QS.fgFaint, lineHeight: 1.5 }}>
          Ao criar conta, você aceita nossos <span style={{ color: QS.fgMuted, textDecoration: 'underline' }}>termos</span> e <span style={{ color: QS.fgMuted, textDecoration: 'underline' }}>política de privacidade</span>
        </span>
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${QS.line}`, textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: QS.fgFaint }}>Já tem conta? </span>
        <span style={{ fontSize: 12, color: QS.amberBright, fontWeight: 600, cursor: 'pointer' }}>Entrar</span>
      </div>
    </AuthShell>
  );
}

function AuthField({ label, placeholder, value, type, rightSlot, hint }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: QS.fgMuted, fontWeight: 500, marginBottom: 6 }}>{label}</label>
      <div style={{
        height: 44, display: 'flex', alignItems: 'center',
        padding: '0 14px',
        borderRadius: QS.rMd,
        background: QS.bgElev,
        border: `1px solid ${QS.line}`,
        transition: 'all .12s',
      }}>
        <input
          placeholder={placeholder}
          defaultValue={value}
          type={type === 'password' ? 'password' : 'text'}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: QS.fg, fontSize: 13, fontFamily: QS.sans,
          }}
        />
        {rightSlot}
      </div>
      {hint}
    </div>
  );
}

function PasswordStrength() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
      <div style={{ flex: 1, display: 'flex', gap: 3 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= 3 ? QS.amber : QS.line }} />
        ))}
      </div>
      <span style={{ fontSize: 10, color: QS.amberBright, fontWeight: 600 }}>Forte</span>
    </div>
  );
}

Object.assign(window, { LoginScreen, RegisterScreen });
