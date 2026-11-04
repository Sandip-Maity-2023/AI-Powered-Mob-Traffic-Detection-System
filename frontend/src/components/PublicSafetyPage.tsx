import React, { useState, useEffect } from 'react';
import { INCIDENTS_DATA } from '../data';
import { Incident } from '../types';
import { Megaphone, ShieldAlert, Sparkles, AlertTriangle, MapPin, Check, Plus, Send, Zap, Flame, HeartPulse, Hammer } from 'lucide-react';

export default function PublicSafetyPage() {
  const [incidents, setIncidents] = useState<Incident[]>(INCIDENTS_DATA);
  const [newType, setNewType] = useState('Traffic Congestion');
  const [newLocation, setNewLocation] = useState('Sector 7, High Street');
  const [newDetails, setNewDetails] = useState('');
  const [activeSeverity, setActiveSeverity] = useState<'critical' | 'warning' | 'normal'>('warning');

  // Trigger Dispatch
  const handleToggleDispatchStatus = (id: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        const nextStatus = inc.status === 'active' ? 'dispatched' : inc.status === 'dispatched' ? 'resolved' : 'active';
        return {
          ...inc,
          status: nextStatus as Incident['status'],
          timeAgo: nextStatus === 'dispatched' ? 'Dispatched 1m ago' : nextStatus === 'resolved' ? 'Resolved now' : 'Triggered 10m ago'
        };
      }
      return inc;
    }));
  };

  // Add Incident Simulation
  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim()) return;

    const newInc: Incident = {
      id: `INC-0${Math.floor(100 + Math.random() * 899)}`,
      type: newType,
      location: newLocation,
      severity: activeSeverity,
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      status: 'active',
      camera: 'AUTO-SECTOR-SENSORS',
      detectorName: 'Manual Operator Intervention',
      details: newDetails || 'Operator flagged anomaly via emergency telephone terminal override.',
      aiConfidence: 99.8
    };

    setIncidents(prev => [newInc, ...prev]);
    setNewLocation('');
    setNewDetails('');
  };

  return (
    <div className="p-6 space-y-6 text-left" id="public-safety-workspace">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#ef4444]">CRITICAL DISPATCH COMMAND DECK</span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-red-500 animate-pulse" />
            SAFETY & EMERGENCY RESPONSE
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Orchestrating automated transit dispatch networks. Emergency responders, drones, and utility crews are routed in real-time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* INCIDENT TIMELINE CONTROLS */}
        <div className="lg:col-span-2 rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h2 className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5 text-red-500 animate-bounce" />
                ACTIVE INCIDENT THREAT TIMELINE
              </h2>
              <span className="text-[10px] font-mono text-slate-500">OPERATIONAL DECK FEED</span>
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`p-4 rounded-xl border transition-all ${
                    inc.status === 'resolved'
                      ? 'border-white/5 bg-white/5 opacity-70'
                      : inc.status === 'dispatched'
                      ? 'border-cyan-500/20 bg-cyan-950/10'
                      : 'border-red-500/30 bg-red-950/10 shadow-[0_0_15px_rgba(239,68,68,0.04)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-start gap-2.5 text-left">
                      {inc.severity === 'critical' ? (
                        <span className="h-3 w-3 mt-1 shrink-0 bg-red-500 rounded-full animate-ping" />
                      ) : inc.severity === 'warning' ? (
                        <span className="h-3 w-3 mt-1 shrink-0 bg-amber-400 rounded-full" />
                      ) : (
                        <span className="h-3 w-3 mt-1 shrink-0 bg-sky-400 rounded-full" />
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">{inc.type}</span>
                          <span className="text-[9px] font-bold bg-white/5 text-slate-400 px-1 py-0.5 rounded border border-white/10">
                            {inc.id}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-300 flex items-center gap-1 text-xs">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          {inc.location}
                        </p>
                        <p className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">{inc.details}</p>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0 gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono italic">{inc.timeAgo}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        inc.severity === 'critical' ? 'bg-red-500/15 border border-red-500/20 text-red-400' : 'bg-amber-400/10 border border-amber-400/20 text-amber-300'
                      }`}>
                        {inc.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500 font-bold uppercase truncate">
                      Detector: {inc.detectorName} (Confidence: {inc.aiConfidence}%)
                    </span>

                    <button
                      onClick={() => handleToggleDispatchStatus(inc.id)}
                      className={`px-3 py-1.5 rounded-lg border font-bold hover:scale-[1.02] active:scale-[0.98] transition-all uppercase text-[9px] tracking-wider ${
                        inc.status === 'active'
                          ? 'bg-rose-950/20 border-rose-500/30 text-rose-400 hover:bg-rose-950/40'
                          : inc.status === 'dispatched'
                          ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/40'
                          : 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed'
                      }`}
                      disabled={inc.status === 'resolved'}
                    >
                      {inc.status === 'active' ? 'INITIALIZE DISPATCH' : inc.status === 'dispatched' ? 'RESOLVE SECTOR' : 'SOLVED'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OPERATOR MANUAL ESCALATION PANEL */}
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between">
          <form onSubmit={handleAddIncident} className="space-y-4 font-mono text-xs">
            <div className="border-b border-white/5 pb-3">
              <h2 className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-[#22d3ee]" />
                MANUAL FIELD INTRUSION
              </h2>
              <p className="text-[10px] text-slate-500 uppercase mt-0.5">OVERRIDE ROUTINE CHANNELS</p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-slate-400 text-[10px] font-bold uppercase">Incident Classification</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full bg-black/40 border border-white/5 py-2 px-3 rounded-xl text-slate-300 text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
              >
                <option value="Multi-Vehicle Collision">Multi-Vehicle Collision</option>
                <option value="Civilian Disturbance Alert">Civilian Disturbance Alert</option>
                <option value="Trash Bin Fire Outbreak">Trash Bin Fire Outbreak</option>
                <option value="Structural Integrity Failure">Structural Integrity Failure</option>
                <option value="Transit Pathway Obstruction">Transit Pathway Obstruction</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-slate-400 text-[10px] font-bold uppercase">Telemetry Location Coordinate</label>
              <input
                type="text"
                placeholder="Sector & Street descriptor..."
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full bg-black/40 border border-white/5 py-2 px-3 rounded-xl text-slate-300 text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-slate-400 text-[10px] font-bold uppercase">Threat Alarm Level</label>
              <div className="grid grid-cols-3 gap-1">
                {(['normal', 'warning', 'critical'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setActiveSeverity(sev)}
                    className={`py-1.5 rounded-lg border uppercase text-[9px] font-bold transition-all ${
                      activeSeverity === sev
                        ? sev === 'critical'
                          ? 'border-red-500/30 bg-red-950/20 text-red-400'
                          : sev === 'warning'
                          ? 'border-amber-500/30 bg-amber-950/20 text-amber-400'
                          : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400'
                        : 'border-white/5 bg-white/5 text-slate-500'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-slate-400 text-[10px] font-bold uppercase">Operational Directives Details</label>
              <textarea
                placeholder="Direct dispatch units with special instructions..."
                rows={3}
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                className="w-full bg-black/40 border border-white/5 py-2 px-3 rounded-xl text-slate-300 text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-slate-950 font-black tracking-widest rounded-xl text-xs flex justify-center items-center gap-2 uppercase shadow-[0_4px_15px_rgba(220,38,38,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Send className="h-3.5 w-3.5" /> ESCALATE & AUDIT DISPATCH
            </button>
          </form>

          {/* Quick automation guidelines card */}
          <div className="bg-red-950/10 p-3.5 rounded-xl border border-red-500/10 text-[10px] font-mono text-red-400/95 leading-relaxed text-left mt-5">
            <span className="font-black">AUTO-DISPATCH PROTOCOL:</span> Escalating a critical threat instantly rings sector sirens, forces tunnel lane closures, and schedules autonomous aerial drone reconnaissance units over the target coordinate area.
          </div>
        </div>

      </div>
    </div>
  );
}
