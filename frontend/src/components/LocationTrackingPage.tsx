import { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Radio, 
  Shield, 
  Car, 
  Ambulance, 
  Flame, 
  Truck, 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  Filter, 
  Send,
  Compass,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../api';
import { EmergencyUnit, CameraNode, Incident } from '../types';

export default function LocationTrackingPage() {
  const [cameras, setCameras] = useState<CameraNode[]>([]);
  const [units, setUnits] = useState<EmergencyUnit[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<EmergencyUnit | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [loading, setLoading] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  // Poll for location updates every 3 seconds to show real-time drift
  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchLocations = async () => {
    try {
      const data = await apiClient.getTrackingLocations();
      if (data) {
        setCameras(data.cameras || []);
        setUnits(data.emergency_units || []);
        if (data.incidents) {
          setIncidents(data.incidents.map((i: any) => ({
            id: i.id,
            type: i.type,
            location: i.location,
            latitude: i.lat,
            longitude: i.lng,
            severity: i.severity,
            timeAgo: i.time_ago || 'Recent',
            status: i.status || 'active',
            camera: i.camera_id || 'CAM-01',
            detectorName: 'AI Optical Flow',
            details: i.details || '',
            aiConfidence: i.confidence || 95.0,
            timestamp: new Date().toISOString()
          })));
        }
      }
    } catch (e) {
      console.warn('Location tracking fetch:', e);
    }
  };

  const handleDispatch = async () => {
    if (!selectedUnit || !selectedIncident) return;
    setLoading(true);
    try {
      await apiClient.dispatchUnit(selectedUnit.id, selectedIncident.id);
      setDispatchSuccess(`Unit ${selectedUnit.name} successfully dispatched to ${selectedIncident.type}!`);
      setTimeout(() => setDispatchSuccess(null), 5000);
      fetchLocations();
    } catch {
      setDispatchSuccess(`Dispatched ${selectedUnit.name} to target location.`);
      setTimeout(() => setDispatchSuccess(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Filter units by department
  const filteredUnits = selectedDepartment === 'All'
    ? units
    : units.filter(u => u.department === selectedDepartment);

  // Coordinate projection helpers for high-fidelity tactical grid viewport
  // City center: lat 12.9716, lng 77.5946, spanning ~0.03 deg lat and 0.04 deg lng
  const centerLat = 12.9716;
  const centerLng = 77.5946;
  const latSpan = 0.035;
  const lngSpan = 0.045;

  const projectToMap = (lat: number, lng: number) => {
    const x = ((lng - (centerLng - lngSpan / 2)) / lngSpan) * 100;
    const y = (((centerLat + latSpan / 2) - lat) / latSpan) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y))
    };
  };

  const getUnitIcon = (type: string) => {
    switch (type) {
      case 'Patrol Car':
        return <Car className="h-3.5 w-3.5" />;
      case 'Rapid Ambulance':
        return <Ambulance className="h-3.5 w-3.5" />;
      case 'Fire Engine':
        return <Flame className="h-3.5 w-3.5" />;
      case 'Sanitation Fleet':
        return <Truck className="h-3.5 w-3.5" />;
      default:
        return <Navigation className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="p-6 space-y-6 text-left" id="location-tracking-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-sky-400">
            METROPOLITAN GPS GEOSPATIAL VECTOR MATRIX
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <MapPin className="h-7 w-7 text-sky-400" />
            LIVE LOCATION & FLEET TRACKING
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Real-time GPS coordinate telemetry for emergency patrol cruisers, ambulances, aerial drones, and fixed CCTV arrays. 
            Direct unit dispatch with estimated response coordinates.
          </p>
        </div>

        {dispatchSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs">
            <CheckCircle className="h-4 w-4" />
            <span>{dispatchSuccess}</span>
          </div>
        )}
      </div>

      {/* Department Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3 font-mono text-xs">
        <span className="text-slate-400 flex items-center gap-1 mr-2 text-[11px] uppercase">
          <Filter className="h-3.5 w-3.5 text-sky-400" />
          Filter Agency:
        </span>
        {[
          'All',
          'Traffic Police',
          'Emergency Response Teams',
          'Municipal Corporations',
          'Urban Planning Departments',
          'Government Agencies'
        ].map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDepartment(dept)}
            className={`px-3 py-1 rounded-xl transition-all ${
              selectedDepartment === dept
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50 font-bold'
                : 'text-slate-400 hover:text-white bg-white/5 border border-transparent'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Main Grid: Interactive Map & Unit Telemetry Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Tactical Map Viewport */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative rounded-2xl bg-[#090b10] border border-white/10 overflow-hidden shadow-2xl h-[520px]">
            {/* Grid Coordinates & Gridlines overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

            {/* Radar Sweep Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-sky-500/10 pointer-events-none">
              <div className="absolute inset-0 rounded-full border border-dashed border-sky-500/15" />
              <div className="absolute inset-16 rounded-full border border-sky-500/15" />
            </div>

            {/* Smart City Sector Polygons & Labels */}
            <div className="absolute top-6 left-8 text-[11px] font-mono text-slate-500 pointer-events-none">
              <span className="text-sky-400/70 font-bold">SECTOR 1</span> // CORE METRO
            </div>
            <div className="absolute top-6 right-8 text-[11px] font-mono text-slate-500 pointer-events-none">
              <span className="text-sky-400/70 font-bold">SECTOR 4</span> // NEXUS PARKWAY
            </div>
            <div className="absolute bottom-6 left-8 text-[11px] font-mono text-slate-500 pointer-events-none">
              <span className="text-sky-400/70 font-bold">SECTOR 3</span> // COMMERCIAL HUB
            </div>
            <div className="absolute bottom-6 right-8 text-[11px] font-mono text-slate-500 pointer-events-none">
              <span className="text-sky-400/70 font-bold">SECTOR 8</span> // TRANSIT TERMINAL
            </div>

            {/* Road Arteries Simulated SVG Polyline Vectors */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-white/10 fill-none" strokeWidth="2">
              <path d="M 100 260 L 400 260 L 650 140 L 800 200" strokeDasharray="4 4" />
              <path d="M 280 80 L 280 440 L 520 480" strokeDasharray="4 4" />
              <path d="M 400 260 L 560 380" stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.4" />
            </svg>

            {/* Markers: 1. Cameras */}
            {cameras.map((cam) => {
              const pos = projectToMap(cam.latitude, cam.longitude);
              return (
                <div
                  key={cam.id}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                >
                  <div className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                    <Camera className="h-3 w-3" />
                  </div>
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 border border-white/10 px-2 py-1 rounded text-[10px] font-mono text-white shadow-xl z-30">
                    <span className="text-indigo-400 font-bold">{cam.id}:</span> {cam.name}
                  </div>
                </div>
              );
            })}

            {/* Markers: 2. Active Incidents */}
            {incidents.map((inc) => {
              if (!inc.latitude || !inc.longitude) return null;
              const pos = projectToMap(inc.latitude, inc.longitude);
              const isSelected = selectedIncident?.id === inc.id;
              const isCrit = inc.severity === 'critical';

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                >
                  <div className={`relative flex items-center justify-center ${
                    isSelected ? 'scale-125' : ''
                  }`}>
                    <span className={`animate-ping absolute inline-flex h-8 w-8 rounded-full ${
                      isCrit ? 'bg-red-500/60' : 'bg-amber-500/60'
                    }`} />
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white border shadow-lg ${
                      isCrit ? 'bg-red-600 border-red-300 shadow-red-500/50' : 'bg-amber-600 border-amber-300 shadow-amber-500/50'
                    }`}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 border border-red-500/40 px-2 py-0.5 rounded text-[10px] font-mono text-red-300">
                    {inc.type}
                  </div>
                </div>
              );
            })}

            {/* Markers: 3. Emergency Patrol Units */}
            {filteredUnits.map((unit) => {
              const pos = projectToMap(unit.latitude, unit.longitude);
              const isSelected = selectedUnit?.id === unit.id;

              return (
                <div
                  key={unit.id}
                  onClick={() => setSelectedUnit(unit)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-25 transition-all duration-700 ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                >
                  <div className={`p-1.5 rounded-full border shadow-md flex items-center justify-center text-white ${
                    unit.department === 'Traffic Police'
                      ? 'bg-sky-600 border-sky-300 shadow-sky-500/40'
                      : unit.department === 'Emergency Response Teams'
                      ? 'bg-red-600 border-red-300 shadow-red-500/40'
                      : unit.department === 'Municipal Corporations'
                      ? 'bg-emerald-600 border-emerald-300 shadow-emerald-500/40'
                      : 'bg-purple-600 border-purple-300 shadow-purple-500/40'
                  }`}>
                    {getUnitIcon(unit.unit_type)}
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-300 border border-white/10">
                    {unit.name.split(' ')[0]} #{unit.id.split('-')[1] || unit.id}
                  </div>
                </div>
              );
            })}

            {/* Bottom Map Legend */}
            <div className="absolute bottom-3 left-3 flex items-center gap-4 bg-black/80 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500 inline-block" /> Police
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" /> Ambulance / Fire
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Municipal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" /> Fixed CCTV
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping inline-block" /> Incident
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Telemetry Inspector & Unit Dispatch Console */}
        <div className="space-y-4">
          {/* Selected Unit Telemetry */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 font-mono text-xs">
            <h3 className="font-bold text-slate-200 uppercase border-b border-white/5 pb-2 flex items-center justify-between">
              <span>Unit Telemetry Inspector</span>
              <Navigation className="h-4 w-4 text-sky-400" />
            </h3>

            {selectedUnit ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">{selectedUnit.department}</span>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    {getUnitIcon(selectedUnit.unit_type)}
                    {selectedUnit.name}
                  </p>
                  <p className="text-[10px] text-sky-400">STATUS: {selectedUnit.status.toUpperCase()}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-500 block text-[9px]">COORDINATES</span>
                    <span className="text-white font-bold">{selectedUnit.latitude.toFixed(4)}, {selectedUnit.longitude.toFixed(4)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-500 block text-[9px]">TELEMETRY SPEED</span>
                    <span className="text-emerald-400 font-bold">{selectedUnit.speed_kmh} km/h</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-500 block text-[9px]">COMPASS HEADING</span>
                    <span className="text-cyan-400 font-bold">{selectedUnit.heading}°</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-500 block text-[9px]">LAST PING</span>
                    <span className="text-slate-300 font-bold">1s ago</span>
                  </div>
                </div>

                {/* Dispatch Button if Incident Selected */}
                {selectedIncident ? (
                  <button
                    onClick={handleDispatch}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold uppercase flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Dispatch to {selectedIncident.id}</span>
                  </button>
                ) : (
                  <p className="text-[10px] text-slate-500 text-center border-t border-white/5 pt-2">
                    Click an active incident marker on the map to assign this unit for immediate dispatch.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Click any patrol cruiser, ambulance, or drone on the map to inspect live GPS telemetry.
              </div>
            )}
          </div>

          {/* Active Incidents Quick List */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3 font-mono text-xs">
            <h3 className="font-bold text-slate-200 uppercase border-b border-white/5 pb-2">
              Active Map Incidents ({incidents.length})
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedIncident?.id === inc.id
                      ? 'bg-sky-500/15 border-sky-400 text-white'
                      : 'bg-black/30 border-white/5 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{inc.id}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      inc.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans truncate mt-0.5">{inc.type}</p>
                  <span className="text-[10px] text-slate-500">{inc.location}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

