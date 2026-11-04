import { useState } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { ActiveTab } from './types';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardGrid from './components/DashboardGrid';
import TrafficPage from './components/TrafficPage';
import RoadDamagePage from './components/RoadDamagePage';
import PublicSafetyPage from './components/PublicSafetyPage';
import HeatmapPage from './components/HeatmapPage';
import AlertsCenter from './components/AlertsCenter';
import TacticalVisionPage from './components/TacticalVisionPage';
import LocationTrackingPage from './components/LocationTrackingPage';
import AIEnginePage from './components/AIEnginePage';
import { apiClient } from './api';
import {
  Users,
  Trash2,
  Video,
  FileSpreadsheet,
  Sliders,
  Shield,
  Activity,
  User,
  HelpCircle,
  Clock,
  CheckCircle,
  Database,
  RefreshCw,
  Cpu,
  Tv
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [simulatedTicks, setSimulatedTicks] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Trigger telemetry fluctuation Simulation
  const handleTriggerSimulate = () => {
    setSimulatedTicks(prev => prev + 1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Render the appropriate sub-page based on active navigation node
  const renderViewContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardGrid onNavToTab={setActiveTab} simulatedTicks={simulatedTicks} />;
      case 'traffic':
        return <TrafficPage />;
      case 'damage':
        return <RoadDamagePage />;
      case 'incidents':
        return <PublicSafetyPage />;
      case 'heatmaps':
        return <HeatmapPage />;
      case 'alerts':
        return <AlertsCenter />;

      // Supplementary high-fidelity render views direct in App.tsx
      case 'crowd':
        return (
          <div className="p-6 text-left space-y-6" id="crowd-monitoring-subpage">
            <div className="border-b border-white/5 pb-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#22d3ee]">PEDESTRIAN DENSITY INDEX</span>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                <Users className="h-7 w-7 text-purple-400" />
                CROWD SURGE MONITORING
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
                Predicting potential human choke points near metro terminals and commercial squares to dynamically schedule extra train departures.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                <h3 className="font-bold text-slate-200 uppercase border-b border-white/5 pb-2">Active Crowd Index</h3>
                <div className="space-y-3">
                  <p className="text-2xl font-bold font-mono text-purple-400">0.96 <span className="text-xs font-normal text-slate-500">ppl/m²</span></p>
                  <p className="text-slate-400 font-sans text-xs">Genesis Subway Entrance average index level. Safety limits stand at <span className="text-red-400">4.5 ppl/m²</span>.</p>
                </div>
              </div>
              <div className="md:col-span-2 bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-200 uppercase border-b border-white/5 pb-2">Live AI Detection Snapshot</h3>
                  <div className="h-40 rounded-xl bg-black/40 flex items-center justify-center border border-dashed border-white/10 my-4">
                    <div className="text-center space-y-1">
                      <Tv className="h-8 w-8 text-purple-400 animate-pulse mx-auto" />
                      <p className="text-slate-400 text-xs font-sans">Scanning camera nodes for grouping anomalies...</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 text-[10px] justify-between text-slate-500">
                  <span>MODEL STATUS: OPTIMAL</span>
                  <span>AUTONOMOUS OVERLAYS INJECTED</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'waste':
        return (
          <div className="p-6 text-left space-y-6" id="waste-monitoring-subpage">
            <div className="border-b border-white/5 pb-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#22d3ee]">INTELLIGENT URBAN SANITATION</span>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                <Trash2 className="h-7 w-7 text-emerald-400" />
                SMART BIN & LOGISTICS CONSOLE
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
                Real-time tracking of city smart bin capacities, deploying electric robotic retrieval trucks using the shortest travel coordinate arcs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                <h3 className="font-bold text-slate-200 uppercase border-b border-white/5 pb-2">Dynamic Vehicle Scheduler</h3>
                <p className="text-slate-400 font-sans">
                  The AI routing network computed optimization loops, discovering a <span className="text-emerald-400 font-bold">14.2% carbon reduction path</span>, saving 13 total fleet segment hours.
                </p>
                <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[84%]" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>OPTIMIZATION LEVEL: 84%</span>
                  <span>TIME SAVED: 13.8 hrs</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-200 uppercase border-b border-white/5 pb-2">Smart Sanitation Nodes</h3>
                  <p className="text-slate-400 mt-2 font-sans">Smart bins utilize solar-powered ultrasonic sensor nodes to measure rubbish velocity, dispatching collection cycles before overflow breaches.</p>
                </div>
                <span className="text-[10px] text-slate-500 border-t border-white/5 pt-3 text-center uppercase">13,000 bins mapped</span>
              </div>
            </div>
          </div>
        );

      case 'cctv':
        return <TacticalVisionPage />;

      case 'tracking':
        return <LocationTrackingPage />;

      case 'ai-engine':
        return <AIEnginePage />;

      case 'reports':
        return (
          <div className="p-6 text-left space-y-6" id="reports-subpage">
            <div className="border-b border-white/5 pb-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#22d3ee]">EXPORTABLE COMMAND SHEETS</span>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                <FileSpreadsheet className="h-7 w-7 text-teal-400" />
                AUDIT LOGS & REPORTS DECK
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
                Generate secure administrative spreadsheets mapping incident response intervals, road repair parameters and system dispatch timelines.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl font-mono text-xs text-left max-w-xl mx-auto space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h3 className="font-semibold text-slate-200 uppercase">Select Report Format</h3>
                <p className="text-[10px] text-slate-500 uppercase mt-0.5">Complies with SmartCity v4.2 legal specifications</p>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-xl border border-white/5 bg-black/40 flex items-center justify-between">
                  <span className="text-slate-300 uppercase">[XLSX] Weekly Incident Log Metrics</span>
                  <button className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/45 text-cyan-300 font-bold rounded-lg text-[10px]">DOWNLOAD</button>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-black/40 flex items-center justify-between">
                  <span className="text-slate-300 uppercase">[PDF] Dynamic Air Quality Sensor Logs</span>
                  <button className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/45 text-cyan-300 font-bold rounded-lg text-[10px]">DOWNLOAD</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="p-6 text-left space-y-6" id="settings-subpage">
            <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#22d3ee]">MULTI-DATABASE ARCHITECTURE & DURABILITY</span>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                  <Database className="h-7 w-7 text-cyan-400" />
                  DATABASE INTEGRITY & SYSTEM CONFIG
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
                  Dual-tier data persistence maintaining ACID transactional consistency and long-term durability: Relational engine (SQLite WAL / MySQL) for mission records, and NoSQL document store for high-volume telemetry.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs max-w-5xl mx-auto">
              {/* Relational Database Card */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="font-bold text-slate-200 uppercase flex items-center gap-2">
                    <Database className="h-4 w-4 text-cyan-400" />
                    Relational Storage (SQLAlchemy ORM)
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">HEALTHY</span>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  Primary transactional persistence for Incidents, Cameras, Emergency Patrol Units, and Dispatches.
                </p>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between p-2.5 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-slate-400">Engine Type:</span>
                    <span className="text-cyan-300 font-bold">SQLite 3 / MySQL Compatible</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-slate-400">Durability Mode:</span>
                    <span className="text-emerald-400 font-bold">PRAGMA journal_mode = WAL</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-slate-400">Integrity Constraints:</span>
                    <span className="text-cyan-300 font-bold">Foreign Keys Enabled (CASCADE)</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-slate-400">Transactional Safety:</span>
                    <span className="text-emerald-400 font-bold">ACID Compliant (Auto-Rollback)</span>
                  </div>
                </div>
              </div>

              {/* NoSQL Document Store Card */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="font-bold text-slate-200 uppercase flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-purple-400" />
                    NoSQL Document Store (MongoDB Layer)
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">ONLINE</span>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  High-throughput document store for computer vision frame logs, motion optical flow streams, and alert broadcasts.
                </p>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between p-2.5 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-slate-400">Store Adapter:</span>
                    <span className="text-purple-300 font-bold">MongoDB / Resilient DocumentStore</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-slate-400">Write Durability:</span>
                    <span className="text-emerald-400 font-bold">Synchronous Atomic Persistence</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-slate-400">Target Schema:</span>
                    <span className="text-purple-300 font-bold">Telemetry Frames & Alert Payloads</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-slate-400">Availability Guarantee:</span>
                    <span className="text-emerald-400 font-bold">Zero-Downtime Local Fallback</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <DashboardGrid onNavToTab={setActiveTab} simulatedTicks={simulatedTicks} />;
    }
  };

  return (
    <>
      <SignedOut>
        <div className="flex h-screen w-screen items-center justify-center bg-[#050508] px-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0f] p-8 shadow-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400">Secure access</p>
            <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">Sentracity Command Center</h1>
            <p className="mt-3 text-sm text-slate-400">
              Sign in or create an account to access the live smart-city dashboard.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <SignInButton mode="modal">
                <button className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-black transition hover:opacity-90">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                  Create account
                </button>
              </SignUpButton>
            </div>
            <p className="mt-4 text-[11px] text-slate-500">Clerk will handle your authentication flow once the publishable key is configured.</p>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className={`flex h-screen w-screen overflow-hidden ${theme === 'light' ? 'bg-[#f1f5f9] text-slate-700 light-theme' : 'bg-[#050508] text-slate-300'} antialiased font-sans select-none`} id="sentracity-command-center-root">
          {/* Background neon ambient glows */}
          <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[150px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none" />

          {/* 1. SIDEBAR DECK */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />

          {/* MAIN OPERATIONAL WORKSPACE (TOPBAR + VIEWPORT) */}
          <div className="flex flex-1 flex-col overflow-hidden relative">
            {/* 2. TOP STATUS BAR */}
            <Topbar
              onSearch={handleSearch}
              systemAlertsCount={2}
              triggerSystemSimulate={handleTriggerSimulate}
              theme={theme}
              toggleTheme={toggleTheme}
            />

            {/* 3. SCROLLABLE ACTIVE LAYER VIEWPORT */}
            <main className="flex-1 overflow-y-auto bg-transparent relative custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="h-full w-full"
                >
                  {renderViewContent()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
