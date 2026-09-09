from app.database import db
from datetime import datetime

class Beneficiary(db.Model):
    __tablename__ = 'beneficiaries'

    id = db.Column(db.Integer, primary_key=True)
    beneficiary_id = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(128), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(10))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    service_status = db.Column(db.String(30), default='active')
    # Statuses: active, inactive, completed, dropped
    enrollment_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id], backref='beneficiary_profile')
    complaints = db.relationship('Complaint', backref='beneficiary', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'beneficiary_id': self.beneficiary_id,
            'name': self.name,
            'user_id': self.user_id,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'age': self.age,
            'gender': self.gender,
            'phone': self.phone,
            'address': self.address,
            'service_status': self.service_status,
            'enrollment_date': self.enrollment_date.isoformat() if self.enrollment_date else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Complaint(db.Model):
    __tablename__ = 'complaints'

    id = db.Column(db.Integer, primary_key=True)
    complaint_number = db.Column(db.String(64), unique=True, nullable=False)
    beneficiary_id = db.Column(db.Integer, db.ForeignKey('beneficiaries.id'))
    submitted_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    complaint_type = db.Column(db.String(30), default='complaint')
    # Types: complaint, feedback, suggestion
    subject = db.Column(db.String(256), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default='submitted')
    # Statuses: submitted, under_review, in_progress, resolved, closed
    priority = db.Column(db.String(20), default='medium')
    department_response = db.Column(db.Text)
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    submitted_by = db.relationship('User', foreign_keys=[submitted_by_id], backref='submitted_complaints')
    project = db.relationship('Project', foreign_keys=[project_id], backref='complaints')

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_number': self.complaint_number,
            'beneficiary_id': self.beneficiary_id,
            'submitted_by_id': self.submitted_by_id,
            'submitted_by_name': self.submitted_by.name if self.submitted_by else None,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'complaint_type': self.complaint_type,
            'subject': self.subject,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'department_response': self.department_response,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Meeting(db.Model):
    __tablename__ = 'meetings'

    id = db.Column(db.Integer, primary_key=True)
    meeting_id = db.Column(db.String(64), unique=True, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(256))
    meeting_type = db.Column(db.String(30), default='random_vc')
    status = db.Column(db.String(20), default='scheduled')
    # Statuses: scheduled, in_progress, completed, cancelled
    room_name = db.Column(db.String(128))
    join_url = db.Column(db.String(512))
    participants = db.Column(db.Text)  # JSON array
    scheduled_at = db.Column(db.DateTime)
    started_at = db.Column(db.DateTime)
    ended_at = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', foreign_keys=[project_id], backref='meetings')
    created_by = db.relationship('User', foreign_keys=[created_by_id], backref='created_meetings')

    def to_dict(self):
        return {
            'id': self.id,
            'meeting_id': self.meeting_id,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'created_by_id': self.created_by_id,
            'created_by_name': self.created_by.name if self.created_by else None,
            'title': self.title,
            'meeting_type': self.meeting_type,
            'status': self.status,
            'room_name': self.room_name,
            'join_url': self.join_url,
            'participants': self.participants,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'duration_minutes': self.duration_minutes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
