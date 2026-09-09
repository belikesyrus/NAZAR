from app.database import db
from datetime import datetime

class Attendance(db.Model):
    __tablename__ = 'attendance'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    attendance_date = db.Column(db.Date, nullable=False)
    attendance_type = db.Column(db.String(20), default='staff')
    # Types: staff, beneficiary
    total_count = db.Column(db.Integer, default=0)
    present_count = db.Column(db.Integer, default=0)
    absent_count = db.Column(db.Integer, default=0)
    attendance_percentage = db.Column(db.Float, default=0.0)
    recorded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    notes = db.Column(db.Text)
    is_anomaly = db.Column(db.Boolean, default=False)
    anomaly_reason = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    recorded_by = db.relationship('User', foreign_keys=[recorded_by_id], backref='recorded_attendance')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'attendance_date': self.attendance_date.isoformat() if self.attendance_date else None,
            'attendance_type': self.attendance_type,
            'total_count': self.total_count,
            'present_count': self.present_count,
            'absent_count': self.absent_count,
            'attendance_percentage': self.attendance_percentage,
            'recorded_by_id': self.recorded_by_id,
            'recorded_by_name': self.recorded_by.name if self.recorded_by else None,
            'notes': self.notes,
            'is_anomaly': self.is_anomaly,
            'anomaly_reason': self.anomaly_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
