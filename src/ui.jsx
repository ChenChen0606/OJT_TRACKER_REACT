import { createContext, useContext, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api, logMinutes, fmtHours, dateLabel } from './store';

export const Auth = createContext(null);
export const useAuth = () => useContext(Auth);

export function useData(fn, deps = []) {
  const [data, setData] = useState(null);
  const [n, setN] = useState(0);
  useEffect(() => { let ok = true; Promise.resolve(fn()).then((r) => ok && setData(r)); return () => { ok = false; }; }, [...deps, n]);
  return [data, () => setN((x) => x + 1)];
}

export const Field = ({ label, ...p }) => <label className="field"><span>{label}</span><input {...p} /></label>;
export const Stat = ({ label, value }) => <div className="card"><small>{label}</small><b className="big">{value}</b></div>;
export const Empty = ({ children }) => <p className="empty">{children}</p>;
export const Progress = ({ value, max }) => {
  const p = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return <div><div className="bar"><i style={{ width: p + '%' }} /></div><small>{p}% complete</small></div>;
};

export function Layout({ children }) {
  const { user } = useAuth();
  const links = user.role === 'company'
    ? [['/', 'Home'], ['/interns', 'Interns'], ['/logs', 'Logs'], ['/updates', 'Updates'], ['/settings', 'Settings']]
    : [['/', 'Home'], ['/logs', 'Logs'], ['/report', 'Report'], ['/settings', 'Settings']];
  return (
    <div className="shell">
      <nav>
        <strong className="brand">OJT Tracker</strong>
        {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
      </nav>
      <main>{children}</main>
    </div>
  );
}

export function Report({ userId }) {
  const [u] = useData(() => api.getUser(userId), [userId]);
  const [logs] = useData(() => api.listLogs({ userId }), [userId]);
  if (!u || !logs) return null;
  const rows = [...logs].reverse();
  const total = logs.reduce((s, l) => s + logMinutes(l), 0);
  return (
    <>
      <div className="row noprint"><h1>Daily Time Record</h1><button onClick={() => window.print()}>Print / Save PDF</button></div>
      <div className="card">
        <h2>{u.fullName}</h2>
        <p className="muted">{u.school} · {u.course}</p>
        <p>Total: <b>{fmtHours(total)}</b> of {u.requiredHours}h required</p>
      </div>
      {rows.length === 0 ? <Empty>No log entries yet.</Empty> : (
        <div className="card">
          <table>
            <thead><tr><th>Date</th><th>AM</th><th>PM</th><th>Hours</th></tr></thead>
            <tbody>{rows.map((l) => (
              <tr key={l.id}>
                <td>{dateLabel(l.date)}</td>
                <td>{l.amIn && l.amOut ? `${l.amIn}–${l.amOut}` : '—'}</td>
                <td>{l.pmIn && l.pmOut ? `${l.pmIn}–${l.pmOut}` : '—'}</td>
                <td>{fmtHours(logMinutes(l))}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {rows.some((l) => l.narrative) && (
        <div className="card"><h2>Daily Narratives</h2>
          {rows.filter((l) => l.narrative).map((l) => <p key={l.id}><b>{dateLabel(l.date)}:</b> {l.narrative}</p>)}
        </div>
      )}
    </>
  );
}

const COLORS = ['#7B2CBF', '#2563EB', '#059669', '#DC2626', '#EA580C'];
export const applyAccent = (c) => document.documentElement.style.setProperty('--accent', c);

export function Settings() {
  const { user, setUser, logout } = useAuth();
  const [f, setF] = useState(user);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const fields = user.role === 'company'
    ? [['companyName', 'Company name'], ['ownerName', 'Owner name'], ['address', 'Address']]
    : [['fullName', 'Full name'], ['school', 'School'], ['course', 'Course'], ['yearLevel', 'Year level'], ['requiredHours', 'Required hours']];
  const submit = async (e) => {
    e.preventDefault();
    const patch = Object.fromEntries(fields.map(([k]) => [k, k === 'requiredHours' ? Number(f[k]) || 0 : f[k]]));
    setUser(await api.updateProfile(user.id, patch)); setMsg('Saved');
  };
  const pick = async (c) => setUser(await api.updateProfile(user.id, { accent: c }));
  return (
    <>
      <h1>Settings</h1>
      <form className="card" onSubmit={submit}>
        {fields.map(([k, label]) => <Field key={k} label={label} value={f[k] ?? ''} onChange={set(k)} type={k === 'requiredHours' ? 'number' : 'text'} />)}
        <button>Save changes</button> <small>{msg}</small>
      </form>
      <div className="card"><h2>Theme color</h2>
        <div className="swatches">{COLORS.map((c) => <button key={c} type="button" aria-label={c} style={{ background: c }} onClick={() => pick(c)} />)}</div>
      </div>
      <button className="danger" onClick={logout}>Log out</button>
    </>
  );
}
