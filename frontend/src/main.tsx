import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function RootApp() {
  if (!publishableKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508] text-slate-300 px-6">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[#0b0b0f] p-8 text-center shadow-2xl">
          <h1 className="text-xl font-black uppercase tracking-wider text-white">Clerk setup required</h1>
          <p className="mt-3 text-sm text-slate-400">
            Set <span className="font-mono text-cyan-400">VITE_CLERK_PUBLISHABLE_KEY</span> to enable authentication.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <App />
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
);
