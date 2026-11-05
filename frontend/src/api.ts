import { 
  Incident, 
  EmergencyUnit, 
  CameraNode, 
  AlertLogItem, 
  ModelPredictionResult 
} from './types';
import { INCIDENTS_DATA } from './data';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('sentracity_jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const apiClient = {
  async getSystemHealth() {
    try {
      const res = await fetch(`${API_BASE}/system/health`);
      if (!res.ok) throw new Error('Backend health check error');
      return await res.json();
    } catch {
      return {
        status: 'STANDALONE_FALLBACK',
        service: 'SentraCity Command Client',
        databases: {
          relational_db: { type: 'SQLite (WAL Active)', status: 'healthy', durability_mode: 'WAL' },
          nosql_db: { engine: 'Resilient DocumentStore', status: 'healthy', mode: 'resilient_json_store' }
        },
        ai_engine: {
          model_type: 'GradientBoostingClassifier (7 classes)',
          status: 'READY',
          features_dimension: 18
        }
      };
    }
  },

  async getIncidents(): Promise<Incident[]> {
    try {
      const res = await fetch(`${API_BASE}/incidents`);
      if (!res.ok) throw new Error('Failed to fetch incidents');
      const data = await res.json();
      return data.map((d: any) => ({
        id: d.id,
        type: d.type,
        location: d.location,
        latitude: d.latitude,
        longitude: d.longitude,
        severity: d.severity,
        timestamp: d.timestamp,
        timeAgo: d.time_ago || 'Recent',
        status: d.status,
        camera: d.camera_id || 'CAM-AUTO',
        camera_id: d.camera_id,
        detectorName: d.detector_name,
        details: d.details || '',
        aiConfidence: d.ai_confidence || 95.0,
        predicted_class: d.predicted_class,
        class_name: d.class_name,
        video_evidence_url: d.video_evidence_url
      }));
    } catch {
      return INCIDENTS_DATA;
    }
  },

  async createIncident(incident: Partial<Incident>): Promise<Incident> {
    const payload = {
      type: incident.type || 'Anomaly Detection',
      location: incident.location || 'Sector 1 Downtown',
      latitude: incident.latitude || 12.9716,
      longitude: incident.longitude || 77.5946,
      severity: incident.severity || 'warning',
      camera_id: incident.camera || 'CAM-01',
      detector_name: incident.detectorName || 'Operator Intervention',
      details: incident.details || '',
      ai_confidence: incident.aiConfidence || 95.0,
      predicted_class: incident.predicted_class || 0,
      class_name: incident.class_name || 'Anomaly',
      video_evidence_url: incident.video_evidence_url
    };

    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create incident');
      const d = await res.json();
      return {
        id: d.id,
        type: d.type,
        location: d.location,
        latitude: d.latitude,
        longitude: d.longitude,
        severity: d.severity,
        timestamp: d.timestamp,
        timeAgo: 'Just now',
        status: d.status,
        camera: d.camera_id || 'CAM-01',
        detectorName: d.detector_name,
        details: d.details,
        aiConfidence: d.ai_confidence
      };
    } catch {
      return {
        id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        ...payload,
        timestamp: new Date().toISOString(),
        timeAgo: 'Just now',
        status: 'active',
        camera: payload.camera_id,
        detectorName: payload.detector_name,
        aiConfidence: payload.ai_confidence
      } as Incident;
    }
  },

  async updateIncidentStatus(id: string, status: 'active' | 'dispatched' | 'resolved') {
    try {
      const res = await fetch(`${API_BASE}/incidents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch {
      return { id, status };
    }
  },

  async predictWithUploadedModel(features: Record<string, number>): Promise<ModelPredictionResult> {
    const res = await fetch(`${API_BASE}/predict/model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features)
    });
    if (!res.ok) throw new Error('Prediction API failed');
    return await res.json();
  },

  async getModelScenarios() {
    try {
      const res = await fetch(`${API_BASE}/predict/quick-scenarios`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async detectFrame(imageBase64: string, cameraId: string = 'CAM-WEB-01') {
    const res = await fetch(`${API_BASE}/vision/detect-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: imageBase64,
        camera_id: cameraId,
        run_ml_classification: true
      })
    });
    if (!res.ok) throw new Error('Frame detection failed');
    return await res.json();
  },

  async uploadVideo(formData: FormData) {
    const candidateUrls = [
      `${API_BASE}/vision/upload-video`,
      'http://127.0.0.1:8000/api/vision/upload-video',
      'http://localhost:8000/api/vision/upload-video'
    ];

    let lastError: any = null;
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          return await res.json();
        } else {
          const errData = await res.json().catch(() => null);
          const detail = errData?.detail || `Server error (${res.status})`;
          throw new Error(detail);
        }
      } catch (err: any) {
        lastError = err;
        // If server responded with a 4xx/5xx error message, don't try other URLs, throw the real error!
        if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('Load failed')) {
          throw err;
        }
      }
    }
    throw lastError || new Error('Cannot connect to backend server on port 8000.');
  },

  async getTrackingLocations(): Promise<{
    center: { lat: number; lng: number };
    cameras: CameraNode[];
    emergency_units: EmergencyUnit[];
    incidents: any[];
  }> {
    try {
      const res = await fetch(`${API_BASE}/tracking/locations`);
      if (!res.ok) throw new Error('Tracking locations API failed');
      return await res.json();
    } catch {
      // Fallback sample GPS locations
      return {
        center: { lat: 12.9716, lng: 77.5946 },
        cameras: [
          { id: 'CAM-802', name: 'Nexus Parkway Overpass', location: 'Sector 4', sector: 'Sector 4', latitude: 12.9780, longitude: 77.5990, status: 'active', ai_model: 'YOLOv8 + OpenCV', fps: 30.0 },
          { id: 'CAM-115', name: 'Genesis Blvd South', location: 'Sector 1', sector: 'Sector 1', latitude: 12.9725, longitude: 77.5912, status: 'active', ai_model: 'Road Damage AI', fps: 28.5 },
          { id: 'CAM-090', name: 'Zenith Plaza Metro', location: 'Sector 8', sector: 'Sector 8', latitude: 12.9650, longitude: 77.6045, status: 'warning', ai_model: 'CrowdFlow GCN', fps: 30.0 }
        ],
        emergency_units: [
          { id: 'POLICE-102', name: 'Traffic Police Interceptor #102', department: 'Traffic Police', unit_type: 'Patrol Car', latitude: 12.9750, longitude: 77.5970, heading: 45, speed_kmh: 42, status: 'patrolling', last_ping: new Date().toISOString() },
          { id: 'AMB-09', name: 'Rapid Trauma Ambulance #09', department: 'Emergency Response Teams', unit_type: 'Rapid Ambulance', latitude: 12.9680, longitude: 77.5930, heading: 270, speed_kmh: 35, status: 'patrolling', last_ping: new Date().toISOString() },
          { id: 'MUNI-22', name: 'Sanitation Logistics Fleet #22', department: 'Municipal Corporations', unit_type: 'Sanitation Fleet', latitude: 12.9710, longitude: 77.5870, heading: 90, speed_kmh: 24, status: 'patrolling', last_ping: new Date().toISOString() }
        ],
        incidents: [
          { id: 'INC-2941', type: 'Multi-Vehicle Collision', location: 'Nexus Parkway', lat: 12.9780, lng: 77.5990, severity: 'critical', status: 'dispatched', time_ago: '14m ago' },
          { id: 'INC-2939', type: 'Abrupt Crowd Surge', location: 'Zenith Plaza', lat: 12.9650, lng: 77.6045, severity: 'warning', status: 'dispatched', time_ago: '45m ago' }
        ]
      };
    }
  },

  async dispatchUnit(unitId: string, incidentId: string) {
    const res = await fetch(`${API_BASE}/tracking/dispatch-unit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit_id: unitId, incident_id: incidentId })
    });
    return await res.json();
  },

  async getAlerts(): Promise<AlertLogItem[]> {
    try {
      const res = await fetch(`${API_BASE}/alerts`);
      if (!res.ok) throw new Error('Alerts API failed');
      return await res.json();
    } catch {
      return [
        {
          id: 'ALT-8801',
          incident_id: 'INC-2941',
          title: 'CRITICAL: Nexus Parkway Multi-Vehicle Collision',
          message: 'High-velocity impact on Interstate-90. Dispatched Traffic Police Interceptor #102 and Ambulance #09.',
          severity: 'critical',
          target_departments: ['Traffic Police', 'Emergency Response Teams'],
          channels: ['AUDIO_ALARM', 'SMS', 'RADIO', 'PUSH'],
          status: 'delivered',
          dispatched_at: new Date().toISOString()
        }
      ];
    }
  },

  async broadcastAlert(data: {
    title: string;
    message: string;
    severity: string;
    target_departments: string[];
    channels: string[];
    incident_id?: string;
    trigger_siren?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/alerts/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async triggerSiren(incidentId?: string) {
    const res = await fetch(`${API_BASE}/alerts/trigger-siren${incidentId ? `?incident_id=${incidentId}` : ''}`, {
      method: 'POST'
    });
    return await res.json();
  },

  async silenceSiren() {
    const res = await fetch(`${API_BASE}/alerts/silence-siren`, { method: 'POST' });
    return await res.json();
  },

  async getSirenStatus() {
    try {
      const res = await fetch(`${API_BASE}/alerts/siren-status`);
      return await res.json();
    } catch {
      return { is_sounding: false };
    }
  },

  async saveVideoEvidence(data: {
    title: string;
    video_url: string;
    violence_probability: number;
    severity: string;
    class_name: string;
    notes?: string;
    camera_id?: string;
  }) {
    const res = await fetch(`${API_BASE}/vision/save-video-evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Authentication required to save video evidence');
    }
    return await res.json();
  },

  async getSavedEvidences() {
    const res = await fetch(`${API_BASE}/vision/saved-evidences`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to retrieve saved evidences');
    return await res.json();
  }
};

