import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { api } from './store';
import { Auth, Layout, Report, Settings, applyAccent } from './ui';
import { AuthPage } from './auth';
import { InternHome, InternLogs, LogForm } from './intern';
import { CompanyHome, CompanyLogs, InternDetail, Interns, Updates } from './company';

export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => { api.getSession().then(setUser).catch(() => setUser(null)); }, []);
  useEffect(() => { applyAccent(user?.accent || '#7B2CBF'); }, [user?.accent]);
  if (user === undefined) return null;
  const logout = async () => {
    await api.signOut();
    window.location.hash = '#/';
    setUser(null);
  };
  return (
    <Auth.Provider value={{ user, setUser, logout }}>
      {!user ? <AuthPage /> : (
        <HashRouter>
          <Layout>
            {user.role === 'company' ? (
              <Routes>
                <Route path="/" element={<CompanyHome />} />
                <Route path="/interns" element={<Interns />} />
                <Route path="/interns/:id" element={<InternDetail />} />
                <Route path="/logs" element={<CompanyLogs />} />
                <Route path="/updates" element={<Updates />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            ) : (
              <Routes>
                <Route path="/" element={<InternHome />} />
                <Route path="/logs" element={<InternLogs />} />
                <Route path="/logs/new" element={<LogForm />} />
                <Route path="/logs/:date" element={<LogForm />} />
                <Route path="/report" element={<Report userId={user.id} />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            )}
          </Layout>
        </HashRouter>
      )}
    </Auth.Provider>
  );
}
