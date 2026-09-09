from app.database import db
from datetime import datetime

class Evidence(db.Model):
    __tablename__ = 'evidence'

    id = db.Column(db.Integer, primary_key=True)
    evidence_id = db.Column(db.String(64), unique=True, nullable=False)
    inspection_id = db.Column(db.Integer, db.ForeignKey('inspections.id'), nullable=False)
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_name = db.Column(db.String(256), nullable=False)
    original_name = db.Column(db.String(256))
    file_type = db.Column(db.String(50))
    file_size = db.Column(db.Integer)  # in bytes
    file_path = db.Column(db.String(512))
    description = db.Column(db.Text)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    upload_time = db.Column(db.DateTime, default=datetime.utcnow)

    uploader = db.relationship('User', foreign_keys=[uploaded_by_id], backref='uploaded_evidence')

    def to_dict(self):
        return {
            'id': self.id,
            'evidence_id': self.evidence_id,
            'inspection_id': self.inspection_id,
            'uploaded_by_id': self.uploaded_by_id,
            'uploaded_by_name': self.uploader.name if self.uploader else None,
            'file_name': self.file_name,
            'original_name': self.original_name,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'description': self.description,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'upload_time': self.upload_time.isoformat() if self.upload_time else None,
            'file_url': f'/api/evidence/file/{self.file_name}',
        }
