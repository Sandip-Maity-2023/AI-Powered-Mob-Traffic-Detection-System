import { AIModel, Incident, SmartBin, TrafficSection, RoadDamageItem } from './types';

export const AI_MODELS_DATA: AIModel[] = [
  {
    id: 'yolo8-traffic',
    name: 'YOLOv8x Spatial-Object Tracker',
    framework: 'PyTorch / YOLOv8',
    accuracy: 98.4,
    status: 'optimal',
    speedMs: 12,
    workload: 68,
    lastUpdate: '2 mins ago',
  },
  {
    id: 'rcnn-damage',
    name: 'Road Crack & Pothole Faster R-CNN',
    framework: 'TensorFlow 2.15',
    accuracy: 94.2,
    status: 'optimal',
    speedMs: 42,
    workload: 25,
    lastUpdate: '5 mins ago',
  },
  {
    id: 'crowd-density',
    name: 'CrowdFlow GCN Estimator',
    framework: 'PyTorch / GraphNet',
    accuracy: 96.1,
    status: 'optimal',
    speedMs: 28,
    workload: 45,
    lastUpdate: 'Just now',
  },
  {
    id: 'waste-segmenter',
    name: 'GarbageOverflow Mask R-CNN',
    framework: 'Keras / MobileNetV2',
    accuracy: 91.8,
    status: 'optimal',
    speedMs: 35,
    workload: 12,
    lastUpdate: '10 mins ago',
  },
  {
    id: 'thermal-anomaly',
    name: 'Thermal Fire & Heat Signature AI',
    framework: 'TensorRT / Custom',
    accuracy: 99.1,
    status: 'optimal',
    speedMs: 8,
    workload: 55,
    lastUpdate: 'Just now',
  }
];

export const INCIDENTS_DATA: Incident[] = [
  {
    id: 'INC-2941',
    type: 'Multi-Vehicle Collision',
    location: 'Sector 4, Nexus Parkway (Interstate-90)',
    severity: 'critical',
    timestamp: '2026-06-19T00:32:00Z',
    timeAgo: '13 mins ago',
    status: 'dispatched',
    camera: 'CAM-802 (A90-Exit 12)',
    detectorName: 'YOLOv8x Spatial-Object Tracker',
    details: 'Collided sedan and delivery truck block left 2 lanes. Dynamic lane rerouting triggered.',
    aiConfidence: 98.7,
  },
  {
    id: 'INC-2940',
    type: 'Pothole Edge Expansion Warning',
    location: 'Sector 1, Genesis Blvd near Plaza South',
    severity: 'normal',
    timestamp: '2026-06-19T00:15:00Z',
    timeAgo: '30 mins ago',
    status: 'active',
    camera: 'CAM-115 (Genesis Blvd)',
    detectorName: 'Road Crack & Pothole Faster R-CNN',
    details: 'Structural fatigue detected measuring 48cm depth. Auto-scheduled repair dispatch within 24 hours.',
    aiConfidence: 94.6,
  },
  {
    id: 'INC-2939',
    type: 'Abrupt Crowd Surge & Choke Point',
    location: 'Sector 8, Zenith Plaza Metro Station Exit',
    severity: 'warning',
    timestamp: '2026-06-19T00:08:00Z',
    timeAgo: '37 mins ago',
    status: 'dispatched',
    camera: 'CAM-090 (Plaza Subway West)',
    detectorName: 'CrowdFlow GCN Estimator',
    details: 'Foot traffic density exceeds safety threshold of 4.2 ppl/m². Dispatching transit crowd marshals.',
    aiConfidence: 96.3,
  },
  {
    id: 'INC-2938',
    type: 'Trash Overflow & Illegal Dumping Alert',
    location: 'Sector 3, Helix Alleyway Smart Hub 14',
    severity: 'warning',
    timestamp: '2026-06-18T23:41:00Z',
    timeAgo: '1 hour ago',
    status: 'resolved',
    camera: 'CAM-334 (Helix Alleyway)',
    detectorName: 'GarbageOverflow Mask R-CNN',
    details: 'Commercial container overflows. Autonomous robotic collector unit R-08 dispatched and cleared.',
    aiConfidence: 92.1,
  },
  {
    id: 'INC-2937',
    type: 'Gridlock Warning',
    location: 'Sector 5, Quantum Tunnel Entrance Eastbound',
    severity: 'warning',
    timestamp: '2026-06-18T23:20:00Z',
    timeAgo: '1.5 hours ago',
    status: 'resolved',
    camera: 'CAM-512 (Tunnel Ingress)',
    detectorName: 'YOLOv8x Spatial-Object Tracker',
    details: 'Stalled EV in mid-tunnel created massive slowdown. Flow returning to normal state.',
    aiConfidence: 99.4,
  }
];

export const SMART_BINS_DATA: SmartBin[] = [
  { id: 'BIN-101', location: 'Zenith Boulevard Side-A', fillLevel: 42, status: 'normal', lastCleared: 'Yesterday', routeSequence: 1 },
  { id: 'BIN-102', location: 'Helix Park East Promenade', fillLevel: 94, status: 'critical', lastCleared: '2 days ago', routeSequence: 2 },
  { id: 'BIN-103', location: 'Genesis Plaza Concourse', fillLevel: 78, status: 'warning', lastCleared: '8 hours ago', routeSequence: 3 },
  { id: 'BIN-104', location: 'Cyber Avenue Crossing 5', fillLevel: 15, status: 'normal', lastCleared: 'Just now', routeSequence: 4 },
  { id: 'BIN-105', location: 'Sector 9 Industrial Block', fillLevel: 88, status: 'critical', lastCleared: '3 days ago', routeSequence: 5 }
];

export const TRAFFIC_DATA: TrafficSection[] = [
  { id: 'ROAD-001', roadName: 'Nexus Parkway (I-90)', flowRate: 142, congestionIndex: 78, avgSpeed: 38, status: 'heavy', camerasCount: 16 },
  { id: 'ROAD-002', roadName: 'Genesis Boulevard', flowRate: 85, congestionIndex: 35, avgSpeed: 52, status: 'smooth', camerasCount: 12 },
  { id: 'ROAD-003', roadName: 'Quantum Transit Underpass', flowRate: 210, congestionIndex: 92, avgSpeed: 14, status: 'gridlock', camerasCount: 22 },
  { id: 'ROAD-004', roadName: 'Zenith Plaza Flyover', flowRate: 64, congestionIndex: 20, avgSpeed: 64, status: 'smooth', camerasCount: 8 },
  { id: 'ROAD-005', roadName: 'Helix Circular Beltway', flowRate: 110, congestionIndex: 55, avgSpeed: 45, status: 'moderate', camerasCount: 15 }
];

export const ROAD_DAMAGE_DATA: RoadDamageItem[] = [
  { id: 'DMG-0451', type: 'pothole', severity: 'critical', location: '422 Nexus Blvd Lane 3', detectedAt: '10 mins ago', confidence: 97.2, status: 'pending' },
  { id: 'DMG-0450', type: 'alligator_crack', severity: 'moderate', location: 'Helix Ave intersection', detectedAt: '1 hour ago', confidence: 91.4, status: 'scheduled' },
  { id: 'DMG-0449', type: 'longitudinal_crack', severity: 'minor', location: 'Sector 7 Industrial Road', detectedAt: '5 hours ago', confidence: 88.5, status: 'pending' },
  { id: 'DMG-0448', type: 'pothole', severity: 'moderate', location: 'Outside Quantum Subway Entrance', detectedAt: 'Yesterday', confidence: 94.6, status: 'repaired' },
  { id: 'DMG-0447', type: 'rutting', severity: 'minor', location: 'Cyber Way Southbound', detectedAt: 'Yesterday', confidence: 86.9, status: 'pending' }
];

export const SYSTEM_HEALTH_DATA = {
  cpuUsage: 44,
  gpuUsage: 78,
  networkPing: 4, // ms
  modelLoad: 88, // %
  storageStatus: '9.2 TB / 64 TB Array',
  uptime: '99.98%',
  apiSuccessRate: '99.998%',
  nodeConnectivity: '99.4% (13,104 nodes online)',
  dbStatus: 'Synchronous Mirroring Active',
};

// SVG visual map zones for the aesthetic map preview
export const HOTSPOTS_DATA = [
  { id: 'H-1', x: 230, y: 140, r: 40, traffic: 88, safety: 34, type: 'Traffic Overload', color: 'rgba(239, 68, 68, 0.4)' },
  { id: 'H-2', x: 440, y: 290, r: 55, traffic: 41, safety: 78, type: 'Crowd Surge Zone', color: 'rgba(168, 85, 247, 0.4)' },
  { id: 'H-3', x: 310, y: 480, r: 35, traffic: 92, safety: 12, type: 'Critical Potholes Grid', color: 'rgba(249, 115, 22, 0.4)' },
  { id: 'H-4', x: 590, y: 180, r: 25, traffic: 15, safety: 91, type: 'Waste Overfill Hub', color: 'rgba(6, 182, 212, 0.4)' },
];

export const HOURLY_TIMELINE_CHARTS = [
  { hour: '00:00', incidents: 3, flow: 120, avgSpeed: 62 },
  { hour: '04:00', incidents: 1, flow: 45, avgSpeed: 68 },
  { hour: '08:00', incidents: 12, flow: 290, avgSpeed: 31 },
  { hour: '12:00', incidents: 6, flow: 220, avgSpeed: 42 },
  { hour: '16:00', incidents: 15, flow: 320, avgSpeed: 24 },
  { hour: '20:00', incidents: 8, flow: 240, avgSpeed: 48 },
  { hour: '24:00', incidents: 4, flow: 140, avgSpeed: 59 },
];

export const CCTV_CAMERA_STREAMS = [
  { id: 'C-802', segment: 'Nexus Parkway', status: 'ACTIVE', type: 'DOME-4K', angle: 'Northeast Wide' },
  { id: 'C-115', segment: 'Genesis Blvd', status: 'ACTIVE', type: 'TRAFFIC-AI', angle: 'Pothole Zoom' },
  { id: 'C-090', segment: 'Plaza Metro Entrance', status: 'ACTIVE', type: 'INFRARED-AI', angle: 'South Corridor' },
  { id: 'C-334', segment: 'Helix Alleyway Hub', status: 'ACTIVE', type: 'STATIC-WDR', angle: 'Smart Bin Focal' },
];
