export type ActiveTab =
  | 'dashboard'
  | 'traffic'
  | 'damage'
  | 'crowd'
  | 'waste'
  | 'cctv'
  | 'incidents'
  | 'tracking'
  | 'heatmaps'
  | 'alerts'
  | 'ai-engine'
  | 'reports'
  | 'settings';

export interface Incident {
  id: string;
  type: string;
  location: string;
  latitude?: number;
  longitude?: number;
  severity: 'critical' | 'warning' | 'normal';
  timestamp: string;
  timeAgo: string;
  status: 'active' | 'dispatched' | 'resolved';
  camera: string;
  camera_id?: string;
  detectorName: string;
  details: string;
  aiConfidence: number;
  predicted_class?: number;
  class_name?: string;
  video_evidence_url?: string;
}

export interface EmergencyUnit {
  id: string;
  name: string;
  department:
    | 'Traffic Police'
    | 'Municipal Corporations'
    | 'Emergency Response Teams'
    | 'Urban Planning Departments'
    | 'Government Agencies';
  unit_type: 'Patrol Car' | 'Rapid Ambulance' | 'Fire Engine' | 'Surveillance Drone' | 'Sanitation Fleet';
  latitude: number;
  longitude: number;
  heading: number;
  speed_kmh: number;
  status: 'patrolling' | 'dispatched' | 'on_scene' | 'idle';
  assigned_incident_id?: string | null;
  last_ping: string;
}

export interface CameraNode {
  id: string;
  name: string;
  location: string;
  sector: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'warning' | 'offline';
  stream_url?: string;
  ai_model: string;
  fps: number;
}

export interface AlertLogItem {
  id: string;
  incident_id?: string | null;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'normal';
  target_departments: string[];
  channels: string[];
  status: 'sent' | 'delivered' | 'acknowledged';
  dispatched_at: string;
  acknowledged_by?: string | null;
}

export interface AIModel {
  id: string;
  name: string;
  framework: string;
  accuracy: number;
  status: 'optimal' | 'degraded' | 'offline';
  speedMs: number;
  workload: number;
  lastUpdate: string;
}

export interface SmartBin {
  id: string;
  location: string;
  fillLevel: number; // 0 to 100
  status: 'normal' | 'warning' | 'critical';
  lastCleared: string;
  routeSequence: number;
}

export interface TrafficSection {
  id: string;
  roadName: string;
  flowRate: number; // vehicles / min
  congestionIndex: number; // 0 to 100
  avgSpeed: number; // km/h
  status: 'smooth' | 'moderate' | 'heavy' | 'gridlock';
  camerasCount: number;
}

export interface RoadDamageItem {
  id: string;
  type: 'pothole' | 'alligator_crack' | 'longitudinal_crack' | 'rutting';
  severity: 'critical' | 'moderate' | 'minor';
  location: string;
  detectedAt: string;
  confidence: number;
  image?: string;
  status: 'pending' | 'scheduled' | 'repaired';
}

export interface BoundingBoxItem {
  label: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ModelPredictionResult {
  predicted_class: number;
  class_name: string;
  is_violence: boolean;
  confidence: number;
  severity: 'critical' | 'warning' | 'normal';
  probabilities: Record<string, number>;
  explanation: string;
  features_used: string[];
  recommended_departments: string[];
}
