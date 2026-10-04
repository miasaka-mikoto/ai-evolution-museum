import React, { FormEvent, useState } from 'react';

interface Props { onDemoLogin: () => void; onDismiss: () => void; }

export function LoginOverlay({ onDemoLogin, onDismiss }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (email.trim() && password.trim()) { onDemoLogin(); return; }
    setMessage('Use any non-empty email and password for Demo Login.');
  };
  return <div className="aem-login-layer" role="dialog" aria-modal="true" aria-labelledby="aem-login-title">
    <div className="aem-login-card">
      <div className="aem-login-mark" aria-hidden="true"><span /> <span /> <span /></div>
      <p className="aem-kicker">AEM / RESEARCH INTERFACE</p>
      <h1 id="aem-login-title">AI Evolution<br /><em>Museum</em></h1>
      <p className="aem-login-cn">人工智能演化博物馆 · AEM</p>
      <p className="aem-login-copy">A live archive of machines that search, learn, remember and act.</p>
      <form onSubmit={submit}>
        <label>Email<input type="email" autoFocus autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="researcher@example.com" /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></label>
        {message && <p className="aem-form-message" role="status">{message}</p>}
        <button className="aem-sign-in" type="submit">Sign in <span>↗</span></button>
      </form>
      <div className="aem-login-actions"><button type="button" onClick={onDemoLogin}>Demo login</button><button type="button" onClick={() => setMessage('Account creation is local-only in this build.')}>Create account</button><button type="button" onClick={() => setMessage('Password recovery is local-only in this build.')}>Forgot password?</button></div>
      <button type="button" className="aem-enter-link" onClick={onDismiss}>Explore without signing in →</button>
      <small>Offline-first demonstration · no external model API</small>
    </div>
  </div>;
}
