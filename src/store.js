import { supabase } from './supabase';

const unwrap = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

const toUser = (r) => r && {
  id: r.id, role: r.role, email: r.email, fullName: r.full_name, school: r.school, course: r.course,
  yearLevel: r.year_level, requiredHours: r.required_hours, companyId: r.company_id,
  companyName: r.company_name, ownerName: r.owner_name, address: r.address,
  inviteCode: r.invite_code, accent: r.accent,
};
const COLUMNS = { fullName: 'full_name', school: 'school', course: 'course', yearLevel: 'year_level', requiredHours: 'required_hours', companyName: 'company_name', ownerName: 'owner_name', address: 'address', accent: 'accent' };
const toLog = (r) => ({
  id: r.id, userId: r.user_id, date: r.date, amIn: r.am_in || '', amOut: r.am_out || '',
  pmIn: r.pm_in || '', pmOut: r.pm_out || '', tasks: r.tasks || '', narrative: r.narrative || '',
  internName: r.profiles?.full_name || '',
});

export const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
export const mins = (a, b) => {
  if (!a || !b) return 0;
  const [h1, m1] = a.split(':').map(Number), [h2, m2] = b.split(':').map(Number);
  return Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1));
};
export const logMinutes = (l) => mins(l.amIn, l.amOut) + mins(l.pmIn, l.pmOut);
export const fmtHours = (m) => `${Math.floor(m / 60)}h ${m % 60}m`;
export const dateLabel = (d) => new Date(d + 'T00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

export const api = {
  async signUp({ role, email, password, ...f }) {
    const meta = role === 'company'
      ? { role, company_name: f.companyName, owner_name: f.ownerName, address: f.address }
      : { role, full_name: f.fullName, school: f.school, course: f.course, year_level: f.yearLevel, required_hours: String(f.requiredHours || 0), code: f.code || '' };
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: meta } });
    if (error) throw new Error(error.message);
    return data.session ? api.getUser(data.user.id) : null; // null = email confirmation needed
  },
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message);
    return api.getUser(data.user.id);
  },
  async signOut() { await supabase.auth.signOut(); },
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session ? api.getUser(data.session.user.id) : null;
  },
  async getUser(id) { return toUser(unwrap(await supabase.from('profiles').select('*').eq('id', id).maybeSingle())); },
  async updateProfile(id, patch) {
    const row = Object.fromEntries(Object.entries(patch).filter(([k]) => COLUMNS[k]).map(([k, v]) => [COLUMNS[k], v]));
    return toUser(unwrap(await supabase.from('profiles').update(row).eq('id', id).select().single()));
  },
  async linkCompany(internId, code) {
    unwrap(await supabase.rpc('link_company', { code }));
    return api.getUser(internId);
  },
  async listInterns(companyId) {
    return unwrap(await supabase.from('profiles').select('*').eq('role', 'intern').eq('company_id', companyId).order('full_name')).map(toUser);
  },
  // Row Level Security limits results: interns see their own logs, companies see their interns' logs.
  async listLogs({ userId } = {}) {
    let q = supabase.from('logs').select('*, profiles(full_name)').order('date', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    return unwrap(await q).map(toLog);
  },
  async saveLog(l) {
    unwrap(await supabase.from('logs').upsert({
      user_id: l.userId, date: l.date, am_in: l.amIn || null, am_out: l.amOut || null,
      pm_in: l.pmIn || null, pm_out: l.pmOut || null, tasks: l.tasks.trim(), narrative: l.narrative.trim(),
    }, { onConflict: 'user_id,date' }));
  },
  async deleteLog(id) { unwrap(await supabase.from('logs').delete().eq('id', id)); },
  async listAnnouncements(companyId) {
    const rows = unwrap(await supabase.from('announcements').select('*').eq('company_id', companyId).order('created_at', { ascending: false }));
    return rows.map((a) => ({ id: a.id, companyId: a.company_id, title: a.title, message: a.message, date: a.created_at.slice(0, 10) }));
  },
  async addAnnouncement({ companyId, title, message }) {
    unwrap(await supabase.from('announcements').insert({ company_id: companyId, title, message }));
  },
};
