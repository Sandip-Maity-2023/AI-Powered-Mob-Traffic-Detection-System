import { useState } from 'react';
import { HOTSPOTS_DATA } from '../data';
import { Map, Layers, RefreshCw, Eye, Sparkles, Filter, Info } from 'lucide-react';

export default function HeatmapPage() {
  const [activeLayer, setActiveLayer] = useState<'all' | 'traffic' | 'safety' | 'waste'>('all');
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>('H-1');
  const [opacity, setOpacity] = useState<number>(60);

  const selectedHotspot = HOTSPOTS_DATA.find(h => h.id === selectedHotspotId) || HOTSPOTS_DATA[0];

  const filteredHotspots = HOTSPOTS_DATA.filter((h) => {
    if (activeLayer === 'all') return true;
    if (activeLayer === 'traffic') return h.traffic > 50;
    if (activeLayer === 'safety') return h.safety > 50;
    if (activeLayer === 'waste') return h.type.includes('Waste');
    return true;
  });

  return (
    <div className="p-6 space-y-6 text-left" id="heatmap-visualization-workspace">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#22d3ee]">TACTICAL SPATIAL LAYER CONTROLLER</span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Map className="h-7 w-7 text-yellow-400" />
            AI-GENERATED SECTOR HEATMAPS
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Correlating public safety risk matrices, high congestion zones, vehicle gridlock, and smart trash bin overflow density parameters inside a unified GIS visual overlay.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* SECTION 1: LAYER TACTICAL CONTROLLER CARD */}
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between font-mono text-xs text-left">
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h2 className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-[#eab308]" />
                HEATMAP LAYER CONTROL
              </h2>
              <p className="text-[10px] text-slate-500 uppercase mt-0.5">Toggle active GIS dimensions</p>
            </div>

            {/* Filter buttons */}
            <div className="space-y-1.5">
              {(['all', 'traffic', 'safety', 'waste'] as const).map((layer) => (
                <button
                  key={layer}
                  onClick={() => setActiveLayer(layer)}
                  className={`w-full p-3 rounded-xl border text-left font-semibold transition-all flex items-center justify-between ${
                    activeLayer === layer
                      ? 'border-yellow-500/30 bg-yellow-950/20 text-yellow-300'
                      : 'border-white/5 bg-white/5 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <span className="uppercase text-[11px] tracking-wider">{layer} OVERLAYS</span>
                  <span className="text-[9px] bg-black/60 px-1.5 py-0.5 rounded border border-white/5 text-slate-500 font-normal">
                    {layer === 'all' ? HOTSPOTS_DATA.length : HOTSPOTS_DATA.filter(h => layer === 'traffic' ? h.traffic > 50 : layer === 'safety' ? h.safety > 50 : h.type.includes('Waste')).length} Nodes
                  </span>
                </button>
              ))}
            </div>

            {/* Sliders for opacity */}
            <div className="space-y-2 pt-4 border-t border-white/5 text-left">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>RADAR GLOW GLOW OPACITY:</span>
                <span className="text-yellow-400 font-bold">{opacity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(parseInt(e.target.value))}
                className="w-full accent-yellow-400"
              />
            </div>
          </div>

          <div className="mt-5 bg-yellow-950/10 p-3 rounded-xl border border-yellow-500/10 text-[10px] text-yellow-400/90 leading-relaxed">
            <span className="font-bold">Operational Info:</span> Hotspot data is updated every 3 minutes using crowd sentiment patterns, visual object speed matrices, and automated reports logs.
          </div>
        </div>

        {/* SECTION 2: MAP PLATFORM STAGE (2 cols) */}
        <div className="lg:col-span-2 rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between relative min-h-[400px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-mono font-bold text-slate-200">TACTICAL SPATIAL ENGINE</h2>
              <p className="text-[10px] font-mono text-slate-500">MAPPED HOTSPOTS • GIS COORDINATE COORDINATION</p>
            </div>
            <button
              onClick={() => setSelectedHotspotId(null)}
              className="text-[10px] font-mono text-slate-500 hover:text-yellow-400 transition-colors"
            >
              RESET FOCUS
            </button>
          </div>

          {/* Map canvas container */}
          <div className="my-2 relative flex-1 min-h-[280px] rounded-xl border border-white/5 bg-black/60 flex items-center justify-center overflow-hidden">
            <svg className="absolute inset-0 w-full h-full text-slate-900 pointer-events-none" viewBox="0 0 800 500">
              {/* Complex futuristic wireframe blueprints of sectors */}
              <rect x="50" y="50" width="700" height="400" rx="10" fill="none" stroke="#08101d" strokeWidth="1" />
              <line x1="400" y1="0" x2="400" y2="500" stroke="#06122c" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="0" y1="250" x2="800" y2="250" stroke="#06122c" strokeWidth="0.5" strokeDasharray="3,3" />

              {/* Grid outline circles */}
              <circle cx="400" cy="250" r="100" fill="none" stroke="#0f1f3a" strokeWidth="0.5" strokeDasharray="5,5" />
              <circle cx="400" cy="250" r="200" fill="none" stroke="#0f1f3a" strokeWidth="0.5" strokeDasharray="10,5" />
            </svg>

            {/* Glowing Hotspot Layers */}
            <div className="absolute inset-0 z-10">
              {filteredHotspots.map((spot) => {
                const isSelected = selectedHotspotId === spot.id;
                return (
                  <button
                    key={spot.id}
                    onClick={() => setSelectedHotspotId(spot.id)}
                    className="absolute cursor-pointer group transition-transform hover:scale-110 active:scale-95"
                    style={{
                      left: `${(spot.x / 800) * 100}%`,
                      top: `${(spot.y / 500) * 100}%`,
                    }}
                  >
                    {/* Ring glow */}
                    <div
                      className="absolute rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"
                      style={{
                        width: `${spot.r * 2}px`,
                        height: `${spot.r * 2}px`,
                        backgroundColor: spot.color,
                        opacity: opacity / 100,
                      }}
                    />
                    {/* Centered pulsing pixel dot */}
                    <div
                      className={`relative h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-2xl transition-all ${
                        isSelected
                          ? 'bg-yellow-400 ring-4 ring-yellow-400/40 scale-125'
                          : 'bg-red-500 border border-slate-250 ring-2 ring-red-500/20'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Micro HUD overlay coordinates */}
            <div className="absolute top-3 left-4 text-left font-mono text-[8px] text-slate-500 space-y-1 z-10 select-none">
              <p>GIS_MAP_LAYER: DECK_CONNECTED</p>
              <p>COORDINATE SYNC: SEC-01 TO SEC-09</p>
            </div>
            <div className="absolute bottom-3 right-4 text-right font-mono text-[8px] text-slate-500 space-y-1 z-10 select-none">
              <p>PROJECTION: MERCATOR AI EPSG:3857</p>
              <p>CALC: NOMINAL GRID</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: SPECIFIC HOTSPOT STATISTICS */}
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 flex flex-col justify-between font-mono text-xs text-left">
          <div>
            <div className="flex items-center gap-1 text-[#eab308] border-b border-white/5 pb-3 mb-4 font-bold">
              <Info className="h-4 w-4" />
              HOTSPOT DETAILED PANEL
            </div>

            {selectedHotspot ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-500">ZONE IDENTIFIER</p>
                  <p className="text-sm font-bold text-slate-200 mt-1 uppercase flex items-center gap-2">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-yellow-400 animate-ping inline-block" />
                    {selectedHotspot.type}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase">Traffic Index</p>
                    <p className="text-lg font-black text-yellow-400 mt-0.5">{selectedHotspot.traffic}%</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase">Safety Score</p>
                    <p className="text-lg font-black text-purple-400 mt-0.5">{selectedHotspot.safety}%</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-black">AI Recommendations</p>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Sector congestion exceeds optimal bandwidth. Reroute heavy service vehicles and sequence smart bin collection to evening sectors.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-10 font-sans">
                Select an active glowing hotspot target zone on the map stage to view diagnostic statistics and recommendation protocols.
              </p>
            )}
          </div>

          <div className="text-[9px] text-slate-500 leading-none mt-5 text-center">
            ACTIVE TARGET INFERENCE
          </div>
        </div>

      </div>
    </div>
  );
}
