import React, { useState } from 'react';
import { TRAFFIC_DATA, CCTV_CAMERA_STREAMS } from '../data';
import { TrafficSection } from '../types';
import { Car, Route, ShieldAlert, Cpu, Activity, Play, Eye, EyeOff, Radio, RefreshCw, Volume2 } from 'lucide-react';

export default function TrafficPage() {
  const [selectedRoadId, setSelectedRoadId] = useState<string>('ROAD-001');
  const [activeCamId, setActiveCamId] = useState<string>('C-802');
  const [currentZoom, setCurrentZoom] = useState<number>(3);
  const [simulatedLoadSpeed, setSimulatedLoadSpeed] = useState<number>(55);
  const [streamMuted, setStreamMuted] = useState(true);

  const selectedRoad = TRAFFIC_DATA.find((r) => r.id === selectedRoadId) || TRAFFIC_DATA[0];
  const activeCamera = CCTV_CAMERA_STREAMS.find((cam) => cam.id === activeCamId.replace('C-', '')) || CCTV_CAMERA_STREAMS[0];

  const handleSimulateSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimulatedLoadSpeed(parseInt(e.target.value));
  };

  return (
    <div className="p-6 space-y-6 text-left" id="traffic-monitoring-workspace">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#22d3ee]">VEHICULAR COGNITIVE MATRIX</span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Car className="h-7 w-7 text-sky-400" />
            TRAFFIC MONITORING HUB
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Coordinating sector choke points and calculating fluid dynamics using spatial node grids to throttle dynamic traffic light cycles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono border border-white/10 bg-white/5 p-2.5 rounded-xl">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400">OPTIMAL LANE EXPANSION: ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SECTION 1: MAP COORDINATE SYSTEM PREVIEW */}
        <div className="lg:col-span-2 rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between relative min-h-[400px]">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => setCurrentZoom(Math.max(1, currentZoom - 1))}
              className="h-8 w-8 rounded-lg bg-black/50 border border-white/5 text-slate-300 hover:text-white hover:border-cyan-500 text-xs font-bold transition-all"
            >
              -
            </button>
            <button
              onClick={() => setCurrentZoom(Math.min(5, currentZoom + 1))}
              className="h-8 w-8 rounded-lg bg-black/50 border border-white/5 text-slate-300 hover:text-white hover:border-cyan-500 text-xs font-bold transition-all"
            >
              +
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h2 className="text-sm font-mono font-bold text-slate-200">INTERACTIVE SECTOR GIS GRID</h2>
              <p className="text-[10px] font-mono text-slate-500">ZOOM LVL: {currentZoom}x00m • REAL-TIME ROAD MAPPINGS</p>
            </div>
            <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2 py-1 rounded">FEED: ACCEL-AI-GPS</span>
          </div>

          {/* Interactive Live Route Outline Map (Custom HTML Canvas Aesthetic Map) */}
          <div className="my-4 relative h-64 rounded-xl border border-dashed border-white/10 bg-black/60 overflow-hidden flex items-center justify-center">
            {/* Ambient vector grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" style={{ transform: `scale(${1 + currentZoom * 0.1})` }} />

            <svg className="w-full h-full text-slate-900" viewBox="0 0 320 180">
              {/* Roads Vector Drawing */}
              <path d="M 10,90 Q 80,40 160,90 T 310,90" fill="none" stroke="#222" strokeWidth="6" strokeLinecap="round" />
              <path d="M 10,90 Q 80,40 160,90 T 310,90" fill="none" stroke={selectedRoadId === 'ROAD-001' ? '#38bdf8' : '#475569'} strokeWidth="2" strokeDasharray="5,3" strokeLinecap="round" />

              <path d="M 80,10 L 80,170" fill="none" stroke="#222" strokeWidth="4" strokeLinecap="round" />
              <path d="M 80,10 L 80,170" fill="none" stroke={selectedRoadId === 'ROAD-002' ? '#38bdf8' : '#334155'} strokeWidth="1.5" strokeDasharray="3,3" />

              <path d="M 160,10 L 160,170" fill="none" stroke="#222" strokeWidth="6" strokeLinecap="round" />
              <path d="M 160,10 L 160,170" fill="none" stroke={selectedRoadId === 'ROAD-003' ? '#ef4444' : '#475569'} strokeWidth="2" className="animate-pulse" />

              {/* Transit Nodes */}
              <circle cx="80" cy="90" r="6" fill="#0284c7" />
              <circle cx="160" cy="90" r="8" fill="#bc1a1a" className="animate-pulse" />
              <circle cx="240" cy="90" r="5" fill="#3cd17f" />

              {/* Vehicle indicators */}
              <circle cx="120" cy="74" r="3" fill="#eab308" />
              <circle cx="130" cy="78" r="3" fill="#38bdf8" />
              <circle cx="180" cy="90" r="3" fill="#c084fc" />
            </svg>

            <div className="absolute bottom-3 left-3 bg-[#0a0a0e]/95 border border-white/5 p-2 rounded-lg text-[9px] font-mono space-y-1">
              <p className="font-bold text-slate-300">ACTIVE SEGMENT DETAILS</p>
              <p className="text-slate-400">ROAD: <span className="text-cyan-400 font-bold">{selectedRoad.roadName}</span></p>
              <p className="text-slate-400">FLOW SPEED: <span className="text-sky-400 font-bold">{selectedRoad.avgSpeed} KM/H</span></p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {TRAFFIC_DATA.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoadId(r.id)}
                className={`px-3 py-2 shrink-0 rounded-xl border text-xs font-mono font-semibold transition-all ${
                  selectedRoadId === r.id
                    ? 'border-sky-500/40 bg-sky-950/20 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.1)]'
                    : 'border-white/5 bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.roadName.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 2: TELEMETRY DETAILS & LIVE STREAM PREVIEW */}
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                LIVE CCTV STREAM: CAM-{activeCamera.id}
              </h2>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>

            {/* Simulated TV camera static container */}
            <div className="relative aspect-video rounded-xl border border-white/5 bg-black/60 overflow-hidden group flex flex-col justify-center">
              {/* Overlay CCTV scanning text */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/90 font-mono text-[8px] text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 z-10">
                <span className="h-1.5 w-1.5 bg-red-600 rounded-full animate-ping" />
                <span>CAM-{activeCamera.id} STABLE FEED ({activeCamera.type})</span>
              </div>

              <div className="absolute bottom-2 right-2 text-[8px] font-mono text-slate-500 bg-black/40 px-1 py-0.5 rounded z-10">
                ZOOM: 1.4x • {activeCamera.angle}
              </div>

              {/* Vector representation of vehicles in CCTV stream */}
              <div className="p-3 w-full h-full flex flex-col items-center justify-center bg-transparent relative opacity-90">
                <div className="absolute inset-0 border border-white/5 pointer-events-none" />
                {/* Simulated frame coordinates */}
                <div className="absolute left-1/4 top-1/4 w-12 h-12 border border-dashed border-red-500/40 rounded flex flex-col items-center justify-center">
                  <span className="text-[7px] font-mono text-red-500 leading-none">VEHICLE</span>
                </div>
                <div className="absolute right-1/3 top-1/3 w-16 h-10 border border-green-500/40 rounded flex flex-col items-center justify-center">
                  <span className="text-[7px] font-mono text-green-500 leading-none">SPEED: ok</span>
                </div>

                <div className="text-center font-mono space-y-1">
                  <Car className="mx-auto h-8 w-8 text-cyan-500/40 animate-pulse" />
                  <p className="text-[10px] text-slate-400">Sector flow scanning is operational</p>
                  <p className="text-[8px] text-slate-500">Auto-Refreshes: 12ms (TPU Accelerated)</p>
                </div>
              </div>
            </div>

            {/* Camera Selectors Grid */}
            <div className="mt-3.5 grid grid-cols-2 gap-2 text-left font-mono">
              {CCTV_CAMERA_STREAMS.map((cam) => (
                <button
                  key={cam.id}
                  onClick={() => setActiveCamId(`C-${cam.id}`)}
                  className={`p-2 rounded-xl border text-[10px] leading-tight transition-all ${
                    activeCamId === `C-${cam.id}`
                      ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300'
                      : 'border-white/5 bg-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <p className="font-semibold">{cam.segment}</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">cam-{cam.id} • {cam.type}</p>
                </button>
              ))}
            </div>

            {/* Speed Simulation sliders */}
            <div className="mt-5 space-y-2 border-t border-white/5 pt-4 text-left">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">FLOW CONGESTION SIMULATOR:</span>
                <span className="text-cyan-400 font-bold">{simulatedLoadSpeed} VEH/M</span>
              </div>
              <input
                type="range"
                min="10"
                max="180"
                value={simulatedLoadSpeed}
                onChange={handleSimulateSpeedChange}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>10 (DESERTED)</span>
                <span>180 (GRIDLOCK)</span>
                </div>
            </div>
          </div>

          <div className="mt-5 bg-white/5 p-3 rounded-xl border border-white/10 text-xs font-mono">
            <p className="font-bold text-sky-400 uppercase">Interactive Diagnostics</p>
            <p className="text-slate-400 mt-1">
              Currently scanning segment <span className="text-white font-bold">{selectedRoad.roadName}</span>. Flow index registers <span className="text-white font-bold">{selectedRoad.congestionIndex}%</span> overall drag coefficient, advising light cycles at <span className="text-cyan-400">42-second intervals</span>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
