import React, { useState } from 'react';

interface LoginPageProps {
  defaultName?: string;
  onLogin: (name: string) => void;
}

export default function LoginPage({ defaultName = 'Ahamed', onLogin }: LoginPageProps) {
  const [name, setName] = useState(defaultName);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onLogin(trimmed);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#050508]">
      <div className="bg-[#0b0b0f] border border-white/5 rounded-2xl p-8 w-[420px]">
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Sentracity Command Center</h2>
        <p className="text-sm text-slate-400 mb-6">Sign in to continue — enter your display name.</p>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs text-slate-400 uppercase font-mono">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border-none bg-white/5 py-3 px-4 text-sm text-slate-200 placeholder-slate-500 outline-none"
            placeholder="Ahamed"
          />

          <div className="flex items-center justify-between gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-cyan-500 text-black font-bold hover:opacity-90"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setName('Ahamed'); }}
              className="px-3 py-2 rounded-xl border border-white/6 text-slate-300 text-sm"
            >
              Use Ahamed
            </button>
          </div>
        </form>

        <p className="text-[11px] text-slate-500 mt-4">This login is local-only and won't change app features.</p>
      </div>
    </div>
  );
}

