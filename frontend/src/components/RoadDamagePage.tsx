import React, { useState } from 'react';
import { ROAD_DAMAGE_DATA } from '../data';
import { RoadDamageItem } from '../types';
import { ShieldAlert, Upload, HelpCircle, CheckCircle2, AlertTriangle, Hammer, Search, Activity } from 'lucide-react';

export default function RoadDamagePage() {
  const [items, setItems] = useState<RoadDamageItem[]>(ROAD_DAMAGE_DATA);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'moderate' | 'pending'>('all');

  // simulated upload and scanning action
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startSimulatedScan(e.dataTransfer.files[0].name);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startSimulatedScan(e.target.files[0].name);
    }
  };

  const startSimulatedScan = (fileName: string) => {
    setScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // scan complete - create dynamic new defect item!
            const newDefect: RoadDamageItem = {
              id: `DMG-0${Math.floor(100 + Math.random() * 899)}`,
              type: fileName.toLowerCase().includes('crack') ? 'alligator_crack' : 'pothole',
              severity: Math.random() > 0.5 ? 'critical' : 'moderate',
              location: '410 Nexus Parkway Near Exit 10',
              detectedAt: 'Just now',
              confidence: parseFloat((92 + Math.random() * 7).toFixed(1)),
              status: 'pending'
            };
            setItems((prevItems) => [newDefect, ...prevItems]);
            setScanning(false);
            setUploadedImage(null);
          }, 600);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Dispatch dispatchers directly from list
  const markStatus = (id: string, newStatus: RoadDamageItem['status']) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
  };

  const filteredItems = items.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'critical') return item.severity === 'critical';
    if (filterType === 'moderate') return item.severity === 'moderate';
    if (filterType === 'pending') return item.status === 'pending';
    return true;
  });

  return (
    <div className="p-6 space-y-6 text-left" id="road-damage-workspace">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#22d3ee]">STRUCTURAL INTEGRITY TELEMETRY</span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-orange-400" />
            ROAD MAINTENANCE & DEFECT IDENTIFICATION
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Utilizing mobile-mounted LiDAR sensors and city buses to automatically detect structural degradation, prioritizing critical depth indices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono bg-white/5 p-2.5 rounded-xl border border-white/10 text-slate-400">
            PENDING REPAIR BACKLOG: <span className="text-orange-400 font-bold">{items.filter(i => i.status === 'pending').length} SECTORS</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* DRAG AND DROP UPLOAD CONTAINER */}
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between" id="upload-scan-card">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-[#22d3ee] animate-pulse" />
              UPLOAD DAMAGE SPECIMEN
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Drag street-level photographs, camera frames, or vehicle-LiDAR exports to test the AI model inference in real-time.
            </p>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl h-44 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-950/15'
                  : scanning
                  ? 'border-orange-500/30 bg-orange-950/15'
                  : 'border-white/15 bg-black/40 hover:border-white/30'
              }`}
            >
              <input
                type="file"
                id="damage-file-selector"
                className="hidden"
                accept="image/*"
                onChange={handleFileInput}
                disabled={scanning}
              />

              {scanning ? (
                <div className="w-full px-6 space-y-4 font-mono">
                  <Activity className="h-8 w-8 text-orange-400 mx-auto animate-pulse" />
                  <div>
                    <p className="text-xs text-orange-400 font-bold uppercase tracking-wide">MODEL INFERENCE COMPILING...</p>
                    <p className="text-[10px] text-slate-500 mt-1">Faster R-CNN Anchor Boxes scanning: {scanProgress}%</p>
                  </div>
                  <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-500" style={{ width: `${scanProgress}%` }} />
                  </div>
                </div>
              ) : (
                <label htmlFor="damage-file-selector" className="cursor-pointer space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  <p className="text-xs font-mono font-bold text-slate-400">DRAG IMAGE HERE OR <span className="text-[#22d3ee] hover:underline">BROWSE</span></p>
                  <p className="text-[9px] font-mono text-slate-500">Supports JPG, PNG (Under 8MB) • AI auto-categorization</p>
                </label>
              )}
            </div>
          </div>

          <div className="mt-4 bg-orange-950/10 p-3 rounded-xl border border-orange-500/10 text-[10px] font-mono text-orange-400/90 leading-relaxed">
            <span className="font-bold">Model Tip:</span> Uploading images with keywords like &quot;crack&quot; in the filename triggers the alligator crack model, while others will detect potholes.
          </div>
        </div>

        {/* ROAD DEFECT REGISTER HISTORY (2 cols) */}
        <div className="lg:col-span-2 rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 mb-4 gap-3">
              <div>
                <h2 className="text-sm font-mono font-bold text-slate-200">DEFECT LOGS</h2>
                <p className="text-[10px] font-mono text-slate-500">REAL-TIME ROAD SURFACE IRREGULARITIES</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 font-mono text-[10px]">
                {(['all', 'critical', 'moderate', 'pending'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-2.5 py-1 rounded-lg uppercase ${
                      filterType === t
                        ? 'bg-orange-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {filteredItems.length === 0 ? (
                <p className="text-xs font-mono text-slate-500 text-center py-8">
                  No defect indicators match the selected filter category.
                </p>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      {item.severity === 'critical' ? (
                        <div className="mt-1 h-3 h-3 w-3 shrink-0 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]" title="Critical Severity" />
                      ) : (
                        <div className="mt-1 h-3 h-3 w-3 shrink-0 rounded-full bg-amber-400" title="Moderate Severity" />
                      )}

                      <div className="font-mono text-xs text-left">
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-slate-200 uppercase">
                            {item.type.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] bg-white/10 text-slate-400 px-1 rounded">
                            {item.id}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[10px] mt-1">{item.location}</p>
                        <p className="text-[9px] text-slate-500 mt-1">
                          Scanned: {item.detectedAt} • AI Confidence: {item.confidence}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto font-mono text-[10px]">
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => markStatus(item.id, 'scheduled')}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-amber-500/20 bg-amber-950/20 text-amber-400 hover:bg-amber-950/40 transition-colors"
                          >
                            DISPATCH CREW
                          </button>
                          <button
                            onClick={() => markStatus(item.id, 'repaired')}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40 transition-colors"
                          >
                            MARK RESOLVED
                          </button>
                        </>
                      )}

                      {item.status === 'scheduled' && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded bg-amber-950/40 border border-amber-500/20 text-amber-400 font-bold uppercase text-[9px]">
                          CREW EN ROUTE
                        </span>
                      )}

                      {item.status === 'repaired' && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-bold uppercase text-[9px]">
                          ✓ REPAIRED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 text-[9px] font-mono text-slate-400 border-t border-white/5 pt-3 flex items-center justify-between">
            <span>SENSORS: AUTONOMOUS LIDAR MOUNTED VEHICLE ARRAYS</span>
            <span>SYSTEM READY</span>
          </div>
        </div>

      </div>
    </div>
  );
}
