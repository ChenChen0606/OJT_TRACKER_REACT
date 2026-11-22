import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, today, logMinutes, fmtHours, dateLabel } from './store';
import { Empty, Field, Progress, Report, Stat, useAuth, useData } from './ui';

const LogRow = ({ l }) => (
  <div className="card"><div className="row"><b>{l.internName}</b><span>{fmtHours(logMinutes(l))}</span></div>
    <small>{dateLabel(l.date)}</small><p>{l.tasks}</p></div>
);

export function CompanyHome() {
  const { user } = useAuth();
  const [interns] = useData(() => api.listInterns(user.id), []);
  const [logs] = useData(() => api.listLogs({ companyId: user.id }), []);
  const [copied, setCopied] = useState(false);
  if (!interns || !logs) return null;
  const total = logs.reduce((s, l) => s + logMinutes(l), 0);
  const copy = () => { navigator.clipboard?.writeText(user.inviteCode); setCopied(true); };
  return (
    <>
      <h1>{user.companyName}</h1>
      <div className="grid">
        <Stat label="Interns" value={interns.length} />
        <Stat label="Logs today" value={logs.filter((l) => l.date === today()).length} />
        <Stat label="Total hours" value={fmtHours(total)} />
      </div>
      <div className="card row"><div><small>Invite code for interns</small><b className="big">{user.inviteCode}</b></div><button className="ghost" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button></div>
      <h2>Recent logs</h2>
      {logs.length === 0 ? <Empty>No logs yet.</Empty> : logs.slice(0, 5).map((l) => <LogRow key={l.id} l={l} />)}
    </>
  );
}

export function Interns() {
  const { user } = useAuth();
  const [interns] = useData(() => api.listInterns(user.id), []);
  const [logs] = useData(() => api.listLogs({ companyId: user.id }), []);
  if (!interns || !logs) return null;
  return (
    <>
      <h1>Interns</h1>
      {interns.length === 0 ? <Empty>No interns yet. Share your invite code.</Empty> : interns.map((i) => {
        const done = logs.filter((l) => l.userId === i.id).reduce((s, l) => s + logMinutes(l), 0);
        return (
          <Link key={i.id} to={`/interns/${i.id}`} className="card block">
            <b>{i.fullName}</b><br /><small>{i.school} · {i.course}</small>
            <Progress value={done} max={i.requiredHours * 60} />
          </Link>
        );
      })}
    </>
  );
}

export function InternDetail() {
  const { id } = useParams();
  return <><Link className="noprint" to="/interns">← Interns</Link><Report userId={id} /></>;
}

export function CompanyLogs() {
  const { user } = useAuth();
  const [logs] = useData(() => api.listLogs({ companyId: user.id }), []);
  const [who, setWho] = useState('');
  if (!logs) return null;
  const names = [...new Set(logs.map((l) => l.internName))];
  const shown = logs.filter((l) => !who || l.internName === who);
  return (
    <>
      <h1>All logs</h1>
      <select value={who} onChange={(e) => setWho(e.target.value)} style={{ marginBottom: 12 }}>
        <option value="">All interns</option>{names.map((n) => <option key={n}>{n}</option>)}
      </select>
      {shown.length === 0 ? <Empty>No logs found.</Empty> : shown.map((l) => <LogRow key={l.id} l={l} />)}
    </>
  );
}

export function Updates() {
  const { user } = useAuth();
  const [list, reload] = useData(() => api.listAnnouncements(user.id), []);
  const [f, setF] = useState({ title: '', message: '' });
  if (!list) return null;
  const send = async (e) => { e.preventDefault(); await api.addAnnouncement({ companyId: user.id, ...f }); setF({ title: '', message: '' }); reload(); };
  return (
    <>
      <h1>Announcements</h1>
      <form className="card" onSubmit={send}>
        <Field label="Title" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder='e.g. "No work tomorrow"' />
        <label className="field"><span>Message</span><textarea required value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></label>
        <button>Send to all interns</button>
      </form>
      {list.length === 0 ? <Empty>Nothing sent yet.</Empty> : list.map((a) => <div className="card" key={a.id}><b>{a.title}</b><br /><small>{dateLabel(a.date)}</small><p>{a.message}</p></div>)}
    </>
  );
}
