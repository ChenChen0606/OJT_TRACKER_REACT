import { useState } from 'react';
import { api } from './store';
import { Field, useAuth } from './ui';

export function AuthPage() {
  const { setUser } = useAuth();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('intern');
  const [f, setF] = useState({});
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (mode === 'login') return setUser(await api.signIn(f.email || '', f.password || ''));
      if ((f.password || '').length < 6) return setErr('Password must be at least 6 characters');
      const u = await api.signUp({ role, ...f, requiredHours: Number(f.requiredHours) || 0 });
      if (!u) { setMode('login'); setNotice('Account created. Check your email to confirm it, then log in.'); return; }
      setUser(u);
    } catch (x) { setErr(x.message); }
  };

  return (
    <div className="auth">
      <h1>OJT Tracker</h1>
      <p className="muted">Log your internship hours and tasks.</p>
      <form className="card" onSubmit={submit}>
        {mode === 'register' && (
          <div className="tabs">
            {['intern', 'company'].map((r) => <button type="button" key={r} className={role === r ? '' : 'ghost'} onClick={() => setRole(r)}>{r === 'intern' ? 'Intern' : 'Company'}</button>)}
          </div>
        )}
        {mode === 'register' && role === 'intern' && <>
          <Field label="Full name" required onChange={set('fullName')} />
          <Field label="School" required onChange={set('school')} />
          <div className="two"><Field label="Course" required onChange={set('course')} /><Field label="Year level" onChange={set('yearLevel')} /></div>
          <Field label="Required hours" type="number" onChange={set('requiredHours')} />
          <Field label="Company invite code (optional)" onChange={set('code')} />
        </>}
        {mode === 'register' && role === 'company' && <>
          <Field label="Company name" required onChange={set('companyName')} />
          <Field label="Owner name" required onChange={set('ownerName')} />
          <Field label="Address" onChange={set('address')} />
        </>}
        <Field label="Email" type="email" required onChange={set('email')} />
        <Field label="Password" type="password" required onChange={set('password')} />
        {notice && <p className="muted">{notice}</p>}
        {err && <p className="err">{err}</p>}
        <button style={{ width: '100%' }}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
      </form>
      <p style={{ textAlign: 'center' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
          {mode === 'login' ? 'No account? Sign up' : 'Have an account? Log in'}
        </a>
      </p>
    </div>
  );
}
