from app.database import db
from datetime import datetime

class Camera(db.Model):
    __tablename__ = 'cameras'

    id = db.Column(db.Integer, primary_key=True)
    camera_id = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(128), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    location_description = db.Column(db.String(256))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    ip_address = db.Column(db.String(64))
    stream_url = db.Column(db.String(512))  # RTSP/HLS URL (stored server-side only)
    camera_type = db.Column(db.String(50), default='fixed')
    # Types: fixed, ptz, dome, bullet
    status = db.Column(db.String(20), default='online')
    # Statuses: online, offline, maintenance, unknown
    last_active = db.Column(db.DateTime)
    resolution = db.Column(db.String(20))
    manufacturer = db.Column(db.String(64))
    model_number = db.Column(db.String(64))
    installation_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_stream_url=False):
        data = {
            'id': self.id,
            'camera_id': self.camera_id,
            'name': self.name,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'location_description': self.location_description,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'ip_address': self.ip_address,
            'camera_type': self.camera_type,
            'status': self.status,
            'last_active': self.last_active.isoformat() if self.last_active else None,
            'resolution': self.resolution,
            'manufacturer': self.manufacturer,
            'model_number': self.model_number,
            'installation_date': self.installation_date.isoformat() if self.installation_date else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        # Only expose stream URL to authenticated backend calls
        if include_stream_url:
            data['stream_url'] = self.stream_url
        return data
