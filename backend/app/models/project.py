from app.database import db
from datetime import datetime

class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(256), nullable=False)
    organization_name = db.Column(db.String(256))
    project_type = db.Column(db.String(50), default='project')
    # Types: project, institute, ngo
    scheme = db.Column(db.String(128))
    state = db.Column(db.String(64))
    district = db.Column(db.String(64))
    address = db.Column(db.Text)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    incharge_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    incharge = db.relationship('User', foreign_keys=[incharge_id], backref='managed_projects')
    contact_name = db.Column(db.String(128))
    contact_phone = db.Column(db.String(20))
    contact_email = db.Column(db.String(120))
    beneficiary_count = db.Column(db.Integer, default=0)
    staff_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(30), default='active')
    # Statuses: active, inactive, suspended, completed
    compliance_score = db.Column(db.Float, default=0.0)
    registration_date = db.Column(db.Date)
    last_inspection_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    inspections = db.relationship('Inspection', backref='project', lazy='dynamic')
    cameras = db.relationship('Camera', backref='project', lazy='dynamic')
    beneficiaries = db.relationship('Beneficiary', backref='project', lazy='dynamic')
    attendance_records = db.relationship('Attendance', backref='project', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'organization_name': self.organization_name,
            'project_type': self.project_type,
            'scheme': self.scheme,
            'state': self.state,
            'district': self.district,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'incharge_id': self.incharge_id,
            'incharge_name': self.incharge.name if self.incharge else None,
            'contact_name': self.contact_name,
            'contact_phone': self.contact_phone,
            'contact_email': self.contact_email,
            'beneficiary_count': self.beneficiary_count,
            'staff_count': self.staff_count,
            'status': self.status,
            'compliance_score': self.compliance_score,
            'registration_date': self.registration_date.isoformat() if self.registration_date else None,
            'last_inspection_date': self.last_inspection_date.isoformat() if self.last_inspection_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
