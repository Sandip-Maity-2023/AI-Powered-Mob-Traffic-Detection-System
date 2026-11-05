import React, { useState } from 'react';
import { Shield, Lock, User, Key, X, CheckCircle, Sparkles, Building, Car, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, authModalNotice, closeAuthModal, login, register, demoLogin } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Traffic Police');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    if (tab === 'login') {
      await login(username.trim(), password);
    } else {
      await register(username.trim(), password, fullName || 'Tactical Operator', 'Field Officer', department);
    }
    setLoading(false);
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    await demoLogin();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 font-mono animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0d14] p-6 shadow-2xl text-left">
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="space-y-1 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="h-4 w-4" />
            <span>JSON Web Token Authorization</span>
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-tight">
            Command Center Access
          </h2>
          <p className="text-[11px] text-slate-400 font-sans">
            {authModalNotice || 'Authentication required to save video evidence or access secure dispatches.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-white/5 py-3 text-xs">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 py-1.5 rounded-lg font-bold uppercase transition-all ${
              tab === 'login'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 py-1.5 rounded-lg font-bold uppercase transition-all ${
              tab === 'register'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            Register Officer
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-3 text-xs">
          {tab === 'register' && (
            <>
              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Full Officer Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Officer Ahamed"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Agency Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-cyan-400 text-xs"
                >
                  <option value="Traffic Police">Traffic Police</option>
                  <option value="Emergency Response Teams">Emergency Response Teams</option>
                  <option value="Municipal Corporations">Municipal Corporations</option>
                  <option value="Smart City Authorities">Smart City Authorities</option>
                  <option value="Government Agencies">Government Agencies</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Username / Call-Sign</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ahamed"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-cyan-400 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Passcode / Key</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-cyan-400 text-xs"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <Key className="h-4 w-4" />
            <span>{loading ? 'Authenticating...' : tab === 'login' ? 'Authenticate (JWT)' : 'Create Credentials'}</span>
          </button>

          {/* 1-Click Demo Quick Sign-in */}
          <div className="pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="w-full py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold uppercase text-[11px] flex items-center justify-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>1-Click Sign-in: Officer Ahamed</span>
            </button>
          </div>
        </form>

        <p className="mt-4 text-[10px] text-slate-500 text-center font-sans">
          Signed JWT token is stored securely in local browser storage and attached to evidence write requests.
        </p>
      </div>
    </div>
  );
}

