from app.database import db
from datetime import datetime
import json

class Inspection(db.Model):
    __tablename__ = 'inspections'

    id = db.Column(db.Integer, primary_key=True)
    inspection_number = db.Column(db.String(64), unique=True, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    assigned_officer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    inspection_type = db.Column(db.String(30), default='scheduled')
    # Types: scheduled, surprise, random
    status = db.Column(db.String(30), default='assigned')
    # Statuses: assigned, accepted, in_progress, submitted, under_review, approved, rejected
    priority = db.Column(db.String(20), default='medium')
    # Priorities: low, medium, high, critical
    scheduled_date = db.Column(db.DateTime)
    started_at = db.Column(db.DateTime)
    submitted_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)

    # Inspector location at submission
    inspector_latitude = db.Column(db.Float)
    inspector_longitude = db.Column(db.Float)
    location_verified = db.Column(db.Boolean, default=False)
    distance_from_project = db.Column(db.Float)  # in km

    # Report
    observations = db.Column(db.Text)
    recommendations = db.Column(db.Text)
    compliance_score = db.Column(db.Float)
    overall_status = db.Column(db.String(30))
    reviewer_comments = db.Column(db.Text)
    assignment_reason = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    checklist_items = db.relationship('ChecklistResponse', backref='inspection', lazy='dynamic', cascade='all, delete-orphan')
    evidence = db.relationship('Evidence', backref='inspection', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'inspection_number': self.inspection_number,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'project_district': self.project.district if self.project else None,
            'project_state': self.project.state if self.project else None,
            'project_latitude': self.project.latitude if self.project else None,
            'project_longitude': self.project.longitude if self.project else None,
            'assigned_officer_id': self.assigned_officer_id,
            'assigned_officer_name': self.assigned_officer.name if self.assigned_officer else None,
            'created_by_id': self.created_by_id,
            'created_by_name': self.created_by.name if self.created_by else None,
            'inspection_type': self.inspection_type,
            'status': self.status,
            'priority': self.priority,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'inspector_latitude': self.inspector_latitude,
            'inspector_longitude': self.inspector_longitude,
            'location_verified': self.location_verified,
            'distance_from_project': self.distance_from_project,
            'observations': self.observations,
            'recommendations': self.recommendations,
            'compliance_score': self.compliance_score,
            'overall_status': self.overall_status,
            'reviewer_comments': self.reviewer_comments,
            'assignment_reason': self.assignment_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ChecklistResponse(db.Model):
    __tablename__ = 'checklist_responses'

    id = db.Column(db.Integer, primary_key=True)
    inspection_id = db.Column(db.Integer, db.ForeignKey('inspections.id'), nullable=False)
    item_key = db.Column(db.String(64), nullable=False)
    item_label = db.Column(db.String(256))
    response = db.Column(db.String(20), default='not_checked')
    # Responses: yes, no, not_applicable, not_checked
    remarks = db.Column(db.Text)
    score = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id,
            'inspection_id': self.inspection_id,
            'item_key': self.item_key,
            'item_label': self.item_label,
            'response': self.response,
            'remarks': self.remarks,
            'score': self.score,
        }
