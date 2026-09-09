# Integration Guide

## Connecting Real CCTV Cameras

The system stores camera metadata and is ready for RTSP/HLS streams.

### Step 1 — Register the camera via API or UI
```json
POST /api/cameras
{
  "name": "Main Gate Camera",
  "project_id": 1,
  "camera_type": "fixed",
  "ip_address": "192.168.1.100",
  "stream_url": "rtsp://admin:password@192.168.1.100:554/stream1",
  "resolution": "1080p"
}
```

### Step 2 — Transcode RTSP → HLS (for browser playback)
Browsers cannot play RTSP directly. Use a media server:

```bash
# MediaMTX (recommended, free)
# Download: https://github.com/bluenviron/mediamtx
mediamtx

# Or use FFmpeg to transcode
ffmpeg -i rtsp://camera-ip/stream -f hls -hls_time 2 -hls_list_size 3 /var/www/stream/index.m3u8
```

### Step 3 — Use HLS.js in the frontend
In `frontend/src/pages/CCTVPage.jsx`, replace the mock feed with:

```jsx
import Hls from 'hls.js'

useEffect(() => {
  const video = document.getElementById(`video-${cam.id}`)
  if (Hls.isSupported() && cam.stream_hls_url) {
    const hls = new Hls()
    hls.loadSource(cam.stream_hls_url)
    hls.attachMedia(video)
  }
}, [cam])
```

```
npm install hls.js
```

---

## Connecting Real Video Conferencing (Jitsi)

### Self-hosted Jitsi
1. Deploy Jitsi Meet: https://jitsi.github.io/handbook/docs/devops-guide/
2. Update `.env`:
   ```
   JITSI_DOMAIN=your-jitsi-server.com
   ```
3. In `VideoConferencingPage.jsx`, replace the join URL with:
   ```jsx
   const domain = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si'
   // meeting.join_url = `https://${domain}/${room_name}`
   ```

### Jitsi IFrame API (embedded)
```jsx
const api = new window.JitsiMeetExternalAPI(domain, {
  roomName: meeting.room_name,
  parentNode: document.getElementById('jitsi-container'),
})
```

---

## Replacing Rule-Based AI with ML Model

### Anomaly Detection

File: `backend/app/services/anomaly_detection.py`

Replace the `_ml_detect()` stub:

```python
# Load your model at startup
import joblib
model = joblib.load('models/anomaly_model.pkl')

def _ml_detect(self, features: dict) -> dict:
    import numpy as np
    feature_vector = np.array([
        features['attendance_pct'],
        features['days_since_inspection'],
        features['compliance_score'],
        features['cctv_offline_count'],
    ]).reshape(1, -1)
    prediction = model.predict(feature_vector)[0]
    confidence = model.predict_proba(feature_vector).max()
    return {'anomaly': bool(prediction), 'confidence': float(confidence)}
```

### Inspection Assignment
File: `backend/app/services/inspection_assignment.py`

Override `score_officer()`:
```python
def score_officer(self, officer, project):
    features = self._extract_features(officer, project)
    ml_score = self.ml_model.predict([features])[0]
    reason = f"ML score: {ml_score:.2f}"
    return ml_score, reason
```

---

## Production Deployment

### Backend (Linux + Gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### Frontend Build
```bash
npm run build
# Outputs to dist/ — serve with Nginx
```

### Nginx config example
```nginx
server {
    listen 80;
    location / { root /var/www/smart-monitor/dist; try_files $uri /index.html; }
    location /api/ { proxy_pass http://localhost:5000; }
}
```

### Switch to PostgreSQL
```
DATABASE_URL=postgresql://user:password@localhost:5432/smart_monitoring
```

```bash
pip install psycopg2-binary
python seed.py  # Re-run to initialize PostgreSQL schema
```
