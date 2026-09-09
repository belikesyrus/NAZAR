from app.database import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='beneficiary')
    # Roles: department_official, inspection_officer, project_incharge, ngo_staff, district_authority, beneficiary
    phone = db.Column(db.String(20))
    state = db.Column(db.String(64))
    district = db.Column(db.String(64))
    designation = db.Column(db.String(128))
    employee_id = db.Column(db.String(64))
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assigned_inspections = db.relationship('Inspection', foreign_keys='Inspection.assigned_officer_id', backref='assigned_officer', lazy='dynamic')
    created_inspections = db.relationship('Inspection', foreign_keys='Inspection.created_by_id', backref='created_by', lazy='dynamic')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'phone': self.phone,
            'state': self.state,
            'district': self.district,
            'designation': self.designation,
            'employee_id': self.employee_id,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
