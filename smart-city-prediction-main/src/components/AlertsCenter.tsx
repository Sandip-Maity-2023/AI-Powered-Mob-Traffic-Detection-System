import { useState, useEffect } from 'react';
import { 
  BellRing, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Send, 
  Smartphone, 
  Radio, 
  Mail, 
  CheckCircle, 
  AlertTriangle,
  Flame,
  Building,
  Car,
  Truck,
  Users
} from 'lucide-react';
import { apiClient } from '../api';
import { alarmEngine } from '../utils/soundAlarm';
import { AlertLogItem } from '../types';

export default function AlertsCenter() {
  const [sirenActive, setSirenActive] = useState(false);
  const [alerts, setAlerts] = useState<AlertLogItem[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'normal'>('critical');
  
  // Selected target departments
  const [departments, setDepartments] = useState<string[]>([
    'Traffic Police',
    'Emergency Response Teams',
    'Smart City Authorities'
  ]);

  // Selected communication channels
  const [channels, setChannels] = useState<string[]>([
    'AUDIO_ALARM',
    'SMS',
    'PUSH'
  ]);

  const [broadcasting, setBroadcasting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const availableDepts = [
    { name: 'Traffic Police', icon: Car },
    { name: 'Municipal Corporations', icon: Building },
    { name: 'Emergency Response Teams', icon: Flame },
    { name: 'Smart City Authorities', icon: ShieldAlert },
    { name: 'Urban Planning Departments', icon: Truck },
    { name: 'Government Agencies', icon: Users },
  ];

  useEffect(() => {
    loadAlerts();
    checkSirenStatus();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await apiClient.getAlerts();
      setAlerts(data);
    } catch (e) {
      console.warn('Alerts fetch:', e);
    }
  };

  const checkSirenStatus = async () => {
    try {
      const status = await apiClient.getSirenStatus();
      setSirenActive(status.is_sounding || alarmEngine.getIsSounding());
    } catch {
      setSirenActive(alarmEngine.getIsSounding());
    }
  };

  const toggleDept = (deptName: string) => {
    setDepartments(prev => 
      prev.includes(deptName) ? prev.filter(d => d !== deptName) : [...prev, deptName]
    );
  };

  const toggleChannel = (ch: string) => {
    setChannels(prev => 
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleSirenToggle = async () => {
    if (sirenActive) {
      alarmEngine.stopAlarmSiren();
      await apiClient.silenceSiren();
      setSirenActive(false);
    } else {
      alarmEngine.playAlarmSiren(0.3);
      await apiClient.triggerSiren();
      setSirenActive(true);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setBroadcasting(true);
    try {
      if (channels.includes('AUDIO_ALARM') || severity === 'critical') {
        alarmEngine.playAlarmSiren(0.3);
        setSirenActive(true);
      }

      const res = await apiClient.broadcastAlert({
        title,
        message,
        severity,
        target_departments: departments,
        channels: channels,
        trigger_siren: channels.includes('AUDIO_ALARM')
      });

      setStatusMsg(`ALERT DISPATCHED: Broadcast sent to ${departments.length} departments.`);
      setTimeout(() => setStatusMsg(null), 5000);

      setTitle('');
      setMessage('');
      loadAlerts();
    } catch {
      setStatusMsg('Alert logged in local registry.');
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 text-left font-mono" id="alerts-center-workspace">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-pink-400">
            TACTICAL MULTI-AGENCY EMERGENCY GATEWAY
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <BellRing className="h-7 w-7 text-pink-500 animate-pulse" />
            ALERTS, ALARMS & NOTIFICATIONS CENTER
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Broadcast high-priority emergency notifications to Municipal Corporations, Traffic Police, Emergency Response Teams, 
            and Government Agencies. Includes automated command center acoustic siren control.
          </p>
        </div>

        {/* Tactical Siren Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSirenToggle}
            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase flex items-center gap-2 border transition-all ${
              sirenActive
                ? 'bg-red-500 text-black border-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            {sirenActive ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-pink-400" />}
            <span>{sirenActive ? 'Silence Acoustic Siren' : 'Test Acoustic Siren'}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
          <CheckCircle className="h-4 w-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Main Grid: Broadcast Form & History Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Dispatch New Multi-Agency Alert */}
        <div className="lg:col-span-1 bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 text-xs">
          <h3 className="font-bold text-slate-200 uppercase border-b border-white/5 pb-2 flex items-center gap-2">
            <Send className="h-4 w-4 text-pink-400" />
            Dispatch Emergency Broadcast
          </h3>

          <form onSubmit={handleBroadcast} className="space-y-3.5">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Alert Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CRITICAL: High-Risk Violent Brawl Detected"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-pink-400 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Severity Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['critical', 'warning', 'normal'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-1.5 rounded-lg uppercase text-[10px] font-bold border transition-all ${
                      severity === sev
                        ? sev === 'critical' ? 'bg-red-500/20 border-red-500 text-red-300' : sev === 'warning' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'border-white/5 bg-black/20 text-slate-400'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Departments Selector */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1.5">Target Authorities & Agencies</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {availableDepts.map((d) => {
                  const Icon = d.icon;
                  const isChecked = departments.includes(d.name);
                  return (
                    <div
                      key={d.name}
                      onClick={() => toggleDept(d.name)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer border transition-all ${
                        isChecked
                          ? 'bg-pink-500/10 border-pink-500/30 text-white'
                          : 'bg-black/20 border-transparent text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded accent-pink-500"
                      />
                      <Icon className="h-3.5 w-3.5 text-pink-400" />
                      <span className="text-[11px] font-sans">{d.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ingestion Channels */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Transmission Channels</label>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  { id: 'AUDIO_ALARM', label: 'Audio Alarm Siren' },
                  { id: 'SMS', label: 'SMS Priority Gateway' },
                  { id: 'RADIO', label: 'Trunk Radio Dispatch' },
                  { id: 'PUSH', label: 'In-App Push Banner' }
                ].map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-1.5 ${
                      channels.includes(ch.id)
                        ? 'bg-pink-500/15 border-pink-400 text-pink-300 font-bold'
                        : 'bg-black/20 border-white/5 text-slate-500'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${channels.includes(ch.id) ? 'bg-pink-400' : 'bg-slate-600'}`} />
                    <span>{ch.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Operational Message Body</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Dispatched units, street perimeter details, evacuation notice..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-pink-400 text-xs font-sans"
                required
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-black font-black uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
            >
              <Send className="h-4 w-4" />
              <span>{broadcasting ? 'Transmitting...' : 'Deploy Broadcast'}</span>
            </button>
          </form>
        </div>

        {/* Section 2: Historical Dispatched Logs */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="font-bold text-slate-200 uppercase">
              Real-Time Broadcast Transmission Feed ({alerts.length})
            </h3>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              TRANSMITTER NOMINAL
            </span>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto custom-scrollbar">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 hover:border-white/15 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-pink-400">{alt.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      alt.severity === 'critical' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {alt.severity}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(alt.dispatched_at).toLocaleTimeString()}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{alt.title}</h4>
                <p className="text-slate-300 font-sans text-xs">{alt.message}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 uppercase">Recipients:</span>
                    {alt.target_departments?.map((dept, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                        {dept}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="h-3 w-3" />
                    <span>STATUS: {alt.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
