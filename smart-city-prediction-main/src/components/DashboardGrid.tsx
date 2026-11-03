import { useState, useEffect } from 'react';
import {
  Cpu,
  Video,
  ShieldAlert,
  Users,
  Trash2,
  TrendingUp,
  Gauge,
  Activity,
  HardDrive,
  CheckCircle,
  Clock,
  ArrowRight,
  MapPin,
  Sparkles,
  Zap,
  Flame,
  Wrench,
  Wifi,
  ChevronRight,
  Shield,
  Lightbulb,
} from 'lucide-react';
import { ActiveTab, AIModel, Incident, SmartBin } from '../types';
import { motion } from 'motion/react';
import {
  AI_MODELS_DATA,
  INCIDENTS_DATA,
  SMART_BINS_DATA,
  TRAFFIC_DATA,
  ROAD_DAMAGE_DATA,
  SYSTEM_HEALTH_DATA,
  HOTSPOTS_DATA,
  HOURLY_TIMELINE_CHARTS,
  CCTV_CAMERA_STREAMS
} from '../data';

interface DashboardGridProps {
  onNavToTab: (tab: ActiveTab) => void;
  simulatedTicks: number;
}

export default function DashboardGrid({ onNavToTab, simulatedTicks }: DashboardGridProps) {
  // Local reactive states to allow premium inline actions within the Bento Grid
  const [incidents, setIncidents] = useState<Incident[]>(INCIDENTS_DATA);
  const [bins, setBins] = useState<SmartBin[]>(SMART_BINS_DATA);
  const [models, setModels] = useState<AIModel[]>(AI_MODELS_DATA);
  const [activeCameraId, setActiveCameraId] = useState('C-802');
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Update telemetry values slightly when simulatedTicks increment (triggered by the Topbar "INJECT SIM" button)
  useEffect(() => {
    if (simulatedTicks > 0) {
      // Modify bin fill levels slightly
      setBins(prev => prev.map(bin => {
        const change = Math.round((Math.random() - 0.4) * 8);
        const nextLevel = Math.min(100, Math.max(0, bin.fillLevel + change));
        return {
          ...bin,
          fillLevel: nextLevel,
          status: nextLevel > 90 ? 'critical' : nextLevel > 75 ? 'warning' : 'normal',
        };
      }));

      // Randomly change a model workload or speed
      setModels(prev => prev.map(m => ({
        ...m,
        workload: Math.min(100, Math.max(10, m.workload + Math.round((Math.random() - 0.5) * 12))),
        speedMs: Math.max(4, m.speedMs + Math.round((Math.random() - 0.5) * 4))
      })));

      // Trigger a visual confirmation notification toast or play noise (represented in UI console)
    }
  }, [simulatedTicks]);

  // Action: Interactively toggle a model on/off
  const toggleModelStatus = (id: string) => {
    setModels(prev => prev.map(m => {
      if (m.id === id) {
        const statusTransitionMap: Record<AIModel['status'], AIModel['status']> = {
          'optimal': 'degraded',
          'degraded': 'offline',
          'offline': 'optimal'
        };
        return {
          ...m,
          status: statusTransitionMap[m.status]
        };
      }
      return m;
    }));
  };

  // Action: Cycle live CCTV stream camera
  const selectedCameraInfo = CCTV_CAMERA_STREAMS.find(cam => cam.id === activeCameraId.replace('CAM-', '')) || CCTV_CAMERA_STREAMS[0];

  // Action: Dispatch emergency dispatchers directly inside bento
  const dispatchIncident = (id: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return { ...inc, status: inc.status === 'active' ? 'dispatched' : 'resolved', timeAgo: 'Dispatched now' };
      }
      return inc;
    }));
  };

  // Live dynamic counter values
  const criticalCount = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;
  const activeSensors = 12431 + (simulatedTicks * 12);
  const totalCameraFeeds = 1482;
  const avgSafetyScore = 98.2 - (criticalCount * 0.4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6" id="bento-container-grid">

      {/* CARD 1: LARGE HERO CARD - COMMAND SUMMARY (Spans 2 cols, 2 rows) */}
      <div className="relative md:col-span-2 lg:col-span-2 row-span-1 min-h-[340px] rounded-[24px] overflow-hidden border border-cyan-500/30 bg-white/5 p-6 flex flex-col justify-between shadow-[0_0_30px_rgba(6,182,212,0.06)] hover:border-cyan-500/50 transition-all group" id="bento-hero-city-overview">
        {/* Futury neon backdrop grids */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(6,182,212,0.15),transparent_45%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.4)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Tactical Apex Supervisor</p>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white uppercase sm:text-3xl">
              SMART CITY OVERVIEW
            </h1>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              Real-time cybernetic orchestration, coordinating AI visual models, garbage overflows, structural cracks, and crowd density indexes.
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Zap className="h-6 w-6 animate-pulse" />
          </div>
        </div>

        {/* Animated Cybernetic City Grid wireframe */}
        <div className="my-4 h-24 relative overflow-hidden rounded-xl border border-white/5 bg-black/60 flex items-center justify-center">
          <div className="absolute bottom-[-10px] w-full h-20 opacity-30 flex justify-around items-end">
            <div className="w-12 bg-cyan-500/20 h-16 rounded-t-sm border-t border-cyan-400/60 animate-pulse" />
            <div className="w-16 bg-blue-500/20 h-12 rounded-t-sm border-t border-blue-400/60" />
            <div className="w-8 bg-purple-500/20 h-20 rounded-t-sm border-t border-purple-400/60 animate-bounce" />
            <div className="w-14 bg-cyan-500/20 h-8 rounded-t-sm border-t border-cyan-400/60" />
            <div className="w-10 bg-slate-500/20 h-14 rounded-t-sm border-t border-slate-400/60" />
            <div className="w-16 bg-blue-500/20 h-16 rounded-t-sm border-t border-blue-400/60 animate-pulse" />
          </div>

          <div className="absolute top-2 left-3 flex items-center gap-2">
            <Wifi className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span className="text-[9px] font-mono text-cyan-400/80 uppercase">AI-GIS WIREFRAME CONNECTED</span>
          </div>

          {/* Pulse target rings */}
          <div className="absolute top-1/2 left-1/3 h-6 w-6 rounded-full border border-cyan-400/60 animate-ping pointer-events-none" />
          <div className="absolute top-1/3 left-2/3 h-8 w-8 rounded-full border border-orange-400/40 animate-ping pointer-events-none" />

          <svg className="w-full h-full text-slate-800/40 opacity-70" viewBox="0 0 400 100">
            <path d="M 0,80 L 100,50 L 180,85 L 260,30 L 320,65 L 400,20" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M 0,90 L 120,40 L 220,70 L 300,50 L 400,80" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
          </svg>
        </div>

        {/* Real-Time Stats Row */}
        <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-900/60">
          <div>
            <p className="text-lg font-black font-mono text-cyan-400">{totalCameraFeeds}</p>
            <p className="text-[9px] font-mono text-slate-500 uppercase">Cameras</p>
          </div>
          <div>
            <p className="text-lg font-black font-mono text-pink-400">{activeSensors}</p>
            <p className="text-[9px] font-mono text-slate-500 uppercase">Active Nodes</p>
          </div>
          <div>
            <p className="text-lg font-black font-mono text-purple-400">{models.length}</p>
            <p className="text-[9px] font-mono text-slate-500 uppercase">AI Models</p>
          </div>
          <div>
            <p className={`text-lg font-black font-mono ${criticalCount > 0 ? 'text-red-500' : 'text-emerald-400'}`}>{criticalCount}</p>
            <p className="text-[9px] font-mono text-slate-500 uppercase">Threats Today</p>
          </div>
        </div>
      </div>

      {/* CARD 2: TRAFFIC MONITORING SENSORS */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between hover:border-cyan-505/20 transition-all cursor-pointer group" id="bento-traffic-card" onClick={() => onNavToTab('traffic')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-950/60 text-sky-400 border border-sky-500/20">
              <Activity className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200">TRAFFIC MONITORING</h2>
          </div>
          <span className="text-[10px] font-mono text-sky-400 font-bold bg-sky-950/40 px-2 py-0.5 rounded-full uppercase">I-90 DENSE</span>
        </div>

        <div className="my-4 space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-black font-mono text-sky-400">2,840 <span className="text-xs font-normal text-slate-500">v/hr</span></p>
              <p className="text-[9px] font-mono text-slate-400">Total Vehicle Rate (Peak)</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black font-mono text-red-400">78%</p>
              <p className="text-[9px] font-mono text-slate-400">Congestion Rate</p>
            </div>
          </div>

          {/* Quick interactive Traffic Visual Flow Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>NEXUS PKWY FLOW</span>
              <span className="text-sky-400">78 VEH/MIN</span>
            </div>
            <div className="h-2 rounded-full bg-slate-900 overflow-hidden relative">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-orange-500 to-red-500 w-[78%] animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-900">
          <span>AI PREDICTIVE DISPATCH</span>
          <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            OPEN HUD <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* CARD 3: ROAD DAMAGE DETECTION */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between hover:border-cyan-505/20 transition-all cursor-pointer group" id="bento-damage-card" onClick={() => onNavToTab('damage')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-950/60 text-orange-400 border border-orange-500/20">
              <Wrench className="h-4 w-4 animate-bounce" />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200">ROAD DAMAGE AI</h2>
          </div>
          <span className="text-[10px] font-mono text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded-full font-bold uppercase">14 ACTIVE</span>
        </div>

        <div className="my-4 space-y-2">
          {/* Active damage indicators list */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-900 flex flex-col justify-center">
              <span className="text-xl font-bold font-mono text-orange-500">8</span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Potholes Detected</span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-900 flex flex-col justify-center">
              <span className="text-xl font-bold font-mono text-yellow-500">6</span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Cracks Flagged</span>
            </div>
          </div>

          <div className="flex justify-between items-center bg-orange-950/10 p-1.5 rounded-lg border border-orange-500/10 text-[9px] font-mono text-orange-400/90 leading-none">
            <span>AI SCAN CONFIDENCE SCORE: 94.6%</span>
            <div className="flex h-1.5 w-1.5 rounded-full bg-orange-400" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-900">
          <span>UPLOAD SCAN FILE</span>
          <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            SCAN NOW <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* CARD 4: CROWD MONITORING & OUT-FLOW INDEX */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between hover:border-cyan-505/20 transition-all cursor-pointer group" id="bento-crowd-card" onClick={() => onNavToTab('crowd')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/60 text-purple-400 border border-purple-500/20">
              <Users className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200">CROWD ANALYTICS</h2>
          </div>
          <span className="text-[10px] font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded-full font-bold uppercase">METRO WARNING</span>
        </div>

        <div className="my-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-2xl font-black font-mono text-purple-400">4.8 <span className="text-[10px] font-mono text-slate-500">ppl/m²</span></p>
              <p className="text-[9px] font-mono text-slate-400">Peak Sector Density</p>
            </div>
            <div className="rounded-xl bg-purple-950/30 p-2 border border-purple-500/20 text-center">
              <p className="text-xs font-mono text-purple-400 uppercase font-black uppercase">HIGH RISK</p>
              <p className="text-[8px] font-mono text-slate-400">Crowd Velocity</p>
            </div>
          </div>

          <div className="p-2 border border-slate-900 rounded-xl bg-slate-900/20 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <p className="text-[10px] text-slate-400 font-sans leading-none">Metro station exit flow constricted.</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-900">
          <span>SPATIAL RISK LAYER</span>
          <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            VIEW CAMERAS <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* CARD 5: WASTE MANAGEMENT OVERVIEW */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between hover:border-cyan-505/20 transition-all cursor-pointer group" id="bento-waste-card" onClick={() => onNavToTab('waste')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
              <Trash2 className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200">WASTE RECOVERY AI</h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full font-bold uppercase">ROUTE ACTIVE</span>
        </div>

        <div className="my-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-sans">Avg Smart Bin Level:</span>
            <span className="text-sm font-mono font-bold text-emerald-400">63.4% Full</span>
          </div>

          {/* Fill levels visual stacks */}
          <div className="flex gap-1.5 h-6 items-end mt-1 px-1">
            {bins.map((bin) => (
              <div key={bin.id} className="flex-1 flex flex-col justify-end items-center gap-1 group/bin">
                <div className="w-full relative rounded bg-slate-900 h-8 overflow-hidden flex items-end">
                  <div
                    className={`w-full transition-all duration-300 ${
                      bin.fillLevel > 90 ? 'bg-red-500' : bin.fillLevel > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ height: `${bin.fillLevel}%` }}
                  />
                </div>
                <span className="text-[8px] font-mono text-slate-500">{bin.id.split('-')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-900">
          <span>OPTIMIZED ROBOT ROUTE</span>
          <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            DISPATCH LIST <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* CARD 6: SAFETY SECTOR INCIDENTS */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between hover:border-cyan-505/20 transition-all cursor-pointer group" id="bento-safety-card" onClick={() => onNavToTab('incidents')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-950/60 text-red-400 border border-red-500/20">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200">PUBLIC SAFETY</h2>
          </div>
          <span className="text-[10px] font-mono text-red-500 bg-red-950/40 px-2 py-0.5 rounded-full font-bold uppercase">2 EMERGENCIES</span>
        </div>

        <div className="my-4 space-y-2">
          {/* Quick status checkboxes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-200 bg-red-950/20 p-2 rounded-lg border border-red-500/15">
              <span className="flex items-center gap-1 text-red-400 font-bold uppercase">
                <Flame className="h-3 w-3" /> FIRE DETECTED
              </span>
              <span>SECTOR 3 DEPOT</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-200 bg-orange-950/20 p-2 rounded-lg border border-orange-500/15">
              <span className="flex items-center gap-1 text-orange-400 font-bold uppercase">
                <Shield className="h-3 w-3" /> CRASH INCIDENT
              </span>
              <span>I-90 SEC-4</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-900">
          <span>SEVERITY HUD METRICS</span>
          <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            SAFETY LOGS <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* CARD 7: AI DETECTION MODELS REGISTRY */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 hover:border-cyan-505/20 transition-all group lg:col-span-2" id="bento-models-card">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/60 text-purple-400 border border-purple-500/20">
              <Cpu className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200">AI DETECTION MODELS</h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500">ACTIVE REGISTRY</span>
        </div>

        <div className="my-4 divide-y divide-white/5 text-left max-h-[170px] overflow-y-auto custom-scrollbar pr-1">
          {models.map((model) => (
            <div key={model.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
              <div>
                <p className="font-semibold text-slate-300">{model.name}</p>
                <p className="text-[9px] text-slate-500">{model.framework} • Spd: {model.speedMs}ms</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-bold text-cyan-400">{model.accuracy}%</p>
                  <p className="text-[8px] text-slate-500 uppercase">accuracy</p>
                </div>

                <button
                  onClick={() => toggleModelStatus(model.id)}
                  title="Toggle status node"
                  className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors ${
                    model.status === 'optimal'
                      ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
                      : model.status === 'degraded'
                      ? 'bg-amber-950/30 border-amber-500/20 text-amber-400'
                      : 'bg-red-950/30 border-red-500/20 text-red-400'
                  }`}
                >
                  {model.status.toUpperCase()}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[9px] font-mono text-purple-400 bg-purple-950/10 p-2 rounded-xl border border-purple-500/10 flex items-center gap-1 justify-center align-middle">
          <Sparkles className="h-3 w-3 text-purple-400" />
          <span>MODELS SYNCED WITH CLOUD RETRAINING PIPELINE DEPLOYED ON GOOGLE CLOUD</span>
        </div>
      </div>

      {/* CARD 8: ANOMALY DETECTION ENGINE & GRAPH */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 hover:border-cyan-505/20 transition-all flex flex-col justify-between group" id="bento-anomaly-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-950/60 text-pink-400 border border-pink-500/20">
              <Gauge className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200">ANOMALY ENGINE</h2>
          </div>
          <span className="text-[10px] font-mono text-pink-400 bg-pink-950/40 px-2.5 py-0.5 rounded-full font-bold">RISK: 34/100</span>
        </div>

        <div className="my-4">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1.5">
            <span>SUSPICIOUS PATTERN INDEX</span>
            <span className="text-pink-400 font-bold">LOW WARNING</span>
          </div>

          {/* Custom SVG Neon Sparkline Map */}
          <div className="h-16 rounded-xl border border-white/5 bg-black/60 relative overflow-hidden flex items-end">
            <svg className="w-full h-full text-pink-500" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="pinkGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(244, 114, 182, 0.4)" />
                  <stop offset="100%" stopColor="rgba(244, 114, 182, 0.0)" />
                </linearGradient>
              </defs>
              <path
                d="M0,28 L10,25 Q15,10 20,20 T35,15 T50,22 T65,8 T80,18 L90,14 L100,20 L100,30 L0,30 Z"
                fill="url(#pinkGlow)"
              />
              <path
                d="M0,28 L10,25 Q15,10 20,20 T35,15 T50,22 T65,8 T80,18 L90,14 L100,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="animate-pulse"
              />
            </svg>
            <div className="absolute top-1.5 right-2 text-[8px] font-mono text-slate-500">
              PREDICTIVE ANALYSIS
            </div>
          </div>
        </div>

        <div className="text-[9px] font-mono text-slate-500 text-center">
          SUSPICIOUS AUDIO FREQ: <span className="text-pink-400">NOMINAL</span>
        </div>
      </div>

      {/* CARD 9: HEATMAP PREVIEW LAYER */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 hover:border-cyan-505/20 transition-all cursor-pointer flex flex-col justify-between group" id="bento-heatmap-card" onClick={() => onNavToTab('heatmaps')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-950/60 text-yellow-400 border border-yellow-500/20">
              <MapPin className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200">TACTICAL HOTSPOTS</h2>
          </div>
          <span className="text-[10px] font-mono text-yellow-400">4 ZONES LOCK</span>
        </div>

        <div className="my-3 relative rounded-xl border border-white/5 bg-black/60 h-28 overflow-hidden flex items-center justify-center">
          {/* Mock responsive glowing coordinate layout resembling a GIS display */}
          <div className="absolute inset-0 bg-sky-950/10 pointer-events-none" />
          <svg className="w-full h-full text-slate-900" viewBox="0 0 160 100">
            <line x1="0" y1="50" x2="160" y2="50" stroke="#101b2a" strokeWidth="0.5" />
            <line x1="80" y1="0" x2="80" y2="100" stroke="#101b2a" strokeWidth="0.5" />
            {/* Cyber Grid Lines */}
            <circle cx="80" cy="50" r="30" fill="none" stroke="#1e293b/40" strokeWidth="0.5" strokeDasharray="2,2" />

            {/* Pulsing Hotspot Zones */}
            <circle cx="45" cy="35" r="12" fill="rgba(239, 68, 68, 0.4)" className="animate-ping" style={{ transformOrigin: '45px 35px' }} />
            <circle cx="45" cy="35" r="5" fill="#ef4444" />

            <circle cx="115" cy="70" r="18" fill="rgba(168, 85, 247, 0.35)" className="animate-pulse" />
            <circle cx="115" cy="70" r="4" fill="#a855f7" />
          </svg>

          <div className="absolute bottom-2 left-2 flex flex-col">
            <span className="text-[9px] font-mono text-slate-400">HOTSPOT ALPHA</span>
            <span className="text-[8px] font-mono text-red-400">DANGER LEVEL HIGH</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-900">
          <span>COORDINATE REGIONS</span>
          <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            MAP HUD <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* CARD 10: REAL-TIME ALERTS SECTOR TIMELINE */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 hover:border-cyan-505/20 transition-all md:col-span-2 lg:col-span-2 flex flex-col justify-between" id="bento-alerts-timeline">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-950/60 text-red-400 border border-red-500/20">
              <Clock className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200">REAL-TIME SECTOR ALERTS</h2>
          </div>
          <button
            onClick={() => onNavToTab('alerts')}
            className="text-[10px] font-mono text-cyan-400 hover:underline"
          >
            MANAGE DISPATCHERS
          </button>
        </div>

        <div className="my-3 space-y-2.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1 text-left">
          {incidents.slice(0, 3).map((inc) => (
            <div
              key={inc.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono transition-all ${
                inc.status === 'dispatched'
                  ? 'border-emerald-500/20 bg-emerald-950/10 text-emerald-300'
                  : inc.status === 'resolved'
                  ? 'border-white/5 bg-white/5 text-slate-500'
                  : 'border-red-500/20 bg-red-950/10 text-red-300'
              }`}
            >
              <div className="flex items-start gap-2 max-w-[70%]">
                <span className={`inline-block mt-1 w-2.5 h-2.5 rounded-full ${
                  inc.severity === 'critical' ? 'bg-red-500 animate-pulse' : inc.severity === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{inc.type}</span>
                    <span className="text-[9px] uppercase px-1 rounded bg-slate-900 font-mono text-slate-400 border border-slate-800">
                      {inc.id}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{inc.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] text-slate-400 italic">{inc.timeAgo}</span>
                {inc.status !== 'resolved' && (
                  <button
                    onClick={() => dispatchIncident(inc.id)}
                    className={`px-2 py-1 text-[9px] font-bold rounded border transition-colors ${
                      inc.status === 'active'
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-400 hover:bg-amber-950/40'
                        : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40'
                    }`}
                  >
                    {inc.status === 'active' ? 'CO-DISPATCH' : 'RESOLVE'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-900">
          <span>CONNECTED INGEST CHANNELS: FM-RADIO, SMS, PUSH API</span>
          <span className="text-cyan-500">LIVE SYNCED</span>
        </div>
      </div>

      {/* CARD 11: SYSTEM HARDWARE HEALTH & TELEMETRY */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 hover:border-cyan-505/20 transition-all flex flex-col justify-between group" id="bento-system-health">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-cyan-400 border border-cyan-500/10">
              <HardDrive className="h-4 w-4 animate-spin-slow" />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200">SYSTEM DECK</h2>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-500/10 font-bold uppercase">SECURE</span>
        </div>

        <div className="my-3 space-y-2.5 font-mono text-xs">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>NVIDIA TensorRT GPU WORKLOAD</span>
              <span className="text-cyan-400">{SYSTEM_HEALTH_DATA.gpuUsage}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
              <div className="h-full rounded-full bg-cyan-400 w-[78%] animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>HOST SERVER CPU</span>
              <span className="text-purple-400">{SYSTEM_HEALTH_DATA.cpuUsage}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
              <div className="h-full rounded-full bg-purple-400 w-[44%]" />
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 border-t border-slate-900/60 pt-2.5 leading-none">
            <span>UPTIME: {SYSTEM_HEALTH_DATA.uptime}</span>
            <span>PING: {SYSTEM_HEALTH_DATA.networkPing}ms</span>
          </div>
        </div>

        <div className="text-[9px] font-mono text-slate-500 text-center leading-none">
          MODEL COMPILATION: <span className="text-cyan-400">OPTIMAL</span>
        </div>
      </div>

      {/* CARD 12: ANALYTICS SAFETY TREND LINE CHART */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 hover:border-cyan-505/20 transition-all flex flex-col justify-between" id="bento-analytics-trends">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/65 text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-200">ANALYTICS CHART</h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">COGNITION SCORE</span>
        </div>

        <div className="my-2 text-left">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-2xl font-black font-mono text-cyan-400">{avgSafetyScore.toFixed(1)}/100</span>
            <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
              ▲ 2.4% vs T-24hr
            </span>
          </div>

          {/* Simple modular HTML elements representation of hourly data timeline bar chart */}
          <div className="flex items-end justify-between h-14 bg-slate-900/10 p-1.5 rounded-xl border border-slate-900/60 font-mono text-[9px]">
            {HOURLY_TIMELINE_CHARTS.map((item, index) => (
              <div
                key={item.hour}
                className="flex-1 flex flex-col items-center gap-1 cursor-crosshair group/chart"
                onMouseEnter={() => setHoveredHour(index)}
                onMouseLeave={() => setHoveredHour(null)}
              >
                <div className="w-2 relative bg-slate-850 hover:bg-slate-800 transition-colors h-10 flex items-end rounded-t-sm">
                  <div
                    className="w-full bg-cyan-400/80 rounded-t-sm"
                    style={{ height: `${(item.incidents / 16) * 100}%` }}
                  />
                </div>
                {hoveredHour === index && (
                  <div className="absolute top-1 right-2 bg-slate-950 px-2 py-1 rounded border border-cyan-500/30 text-[9px] text-cyan-200 text-center font-mono shadow-xl z-10 pointer-events-none">
                    Hour: {item.hour} <br />
                    Incidents: {item.incidents} <br />
                    Flow: {item.flow}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-[9px] font-mono text-slate-500 text-center">
          INTELLIGENT SECTOR HEALTH LOGGING
        </div>
      </div>

    </div>
  );
}
