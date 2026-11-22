import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, today, logMinutes, fmtHours, dateLabel } from './store';
import { Empty, Field, Progress, Stat, useAuth, useData } from './ui';

export function InternHome() {
  const { user, setUser } = useAuth();
  const [logs] = useData(() => api.listLogs({ userId: user.id }), []); //my logs
  const [news] = useData(() => (user.companyId ? api.listAnnouncements(user.companyId) : []), [user.companyId]); //company announce ments
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  if (!logs || !news) return null;
  const done = logs.reduce((s, l) => s + logMinutes(l), 0); // total minutes rendered
  const left = Math.max(0, user.requiredHours * 60 - done); // minutes remaining
  const link = async (e) => { e.preventDefault(); try { setUser(await api.linkCompany(user.id, code)); } catch (x) { setErr(x.message); } };
  return (
    <>
      <div className="row"><h1>Hi, {user.fullName?.split(' ')[0]}</h1><Link className="btn" to="/logs/new">+ Add log</Link></div>
      <div className="card"><h2>Progress</h2>
        <Progress value={done} max={user.requiredHours * 60} />
      </div>
      <div className="grid">
        <Stat label="Hours rendered" value={fmtHours(done)} />
        <Stat label="Remaining" value={fmtHours(left)} />
        <Stat label="Days logged" value={logs.length} />
      </div>
       {/* Shown only if the intern is NOT linked to a company yet */}
      {!user.companyId && ( 
        <form className="card" onSubmit={link}><h2>Link your company</h2>
          <Field label="Invite code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. ABC-1234" />
          {err && <p className="err">{err}</p>}<button>Link</button>
        </form>
      )}  {/* Latest 3 announcements from the company */}
      {news.length > 0 && <div className="card"><h2>Announcements</h2>
        {news.slice(0, 3).map((a) => <p key={a.id}><b>{a.title}</b><br /><small>{dateLabel(a.date)} · {a.message}</small></p>)}
      </div>}
      <h2>Recent logs</h2>
      {logs.length === 0 ? <Empty>No logs yet. Add your first one.</Empty> : logs.slice(0, 3).map((l) => <LogCard key={l.id} log={l} />)}
    </>
  );
}
// One log shown as a card.
function LogCard({ log, onDelete }) {
  return (
    <div className="card">
      <div className="row"><b>{dateLabel(log.date)}</b><span>{fmtHours(logMinutes(log))}</span></div>
      <p>{log.tasks || <span className="muted">No tasks listed</span>}</p>
      {onDelete && <div className="row"><Link to={`/logs/${log.date}`}>Edit</Link><button className="danger" onClick={() => window.confirm('Delete this log?') && onDelete(log.id)}>Delete</button></div>}
    </div>
  );
}
// MY LOGS page: list of all the intern's logs
export function InternLogs() {
  const { user } = useAuth();
  const [logs, reload] = useData(() => api.listLogs({ userId: user.id }), []);
  if (!logs) return null;
  return (
    <>
      <div className="row"><h1>My logs</h1><Link className="btn" to="/logs/new">+ Add log</Link></div>
      {logs.length === 0 ? <Empty>No logs yet.</Empty> : logs.map((l) => <LogCard key={l.id} log={l} onDelete={async (id) => { await api.deleteLog(id); reload(); }} />)}
    </>
  );
}
// LOG FORM 
export function LogForm() {
  const { user } = useAuth();
  const { date } = useParams();
  const nav = useNavigate();
  const [logs] = useData(() => api.listLogs({ userId: user.id }), []);
  if (!logs) return null;
  return <LogFields user={user} nav={nav} existing={logs.find((l) => l.date === date)} editing={!!date} />;
}
// THE ADD/EDIT LOG FORM ITSELF
function LogFields({ user, nav, existing, editing }) {
  const [f, setF] = useState(existing || { date: today(), amIn: '', amOut: '', pmIn: '', pmOut: '', tasks: '', narrative: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    await api.saveLog({ userId: user.id, date: f.date, amIn: f.amIn, amOut: f.amOut, pmIn: f.pmIn, pmOut: f.pmOut, tasks: f.tasks, narrative: f.narrative });
    nav('/logs');
  };
  return (
    <form onSubmit={submit}>
      <h1>{editing ? 'Edit log' : 'Add log'}</h1>
      <div className="card">
        <Field label="Date" type="date" value={f.date} onChange={set('date')} disabled={editing} required />
         {/* Morning and afternoon time in/out */}
        <div className="two"><Field label="Morning in" type="time" value={f.amIn} onChange={set('amIn')} /><Field label="Morning out" type="time" value={f.amOut} onChange={set('amOut')} /></div>
        <div className="two"><Field label="Afternoon in" type="time" value={f.pmIn} onChange={set('pmIn')} /><Field label="Afternoon out" type="time" value={f.pmOut} onChange={set('pmOut')} /></div>
        {/* Live total hours while typing the times */}
        <p className="muted">Total: <b>{fmtHours(logMinutes(f))}</b></p>
        <label className="field"><span>Tasks</span><textarea value={f.tasks} onChange={set('tasks')} /></label>
        <label className="field"><span>Narrative (optional)</span><textarea value={f.narrative} onChange={set('narrative')} /></label>
        <div className="row"><button type="button" className="ghost" onClick={() => nav(-1)}>Cancel</button><button>Save log</button></div>
      </div>
    </form>
  );
}
