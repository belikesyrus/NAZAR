from app.database import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(256), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), default='info')
    # Types: info, warning, alert, success
    is_read = db.Column(db.Boolean, default=False)
    related_entity = db.Column(db.String(50))
    related_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'is_read': self.is_read,
            'related_entity': self.related_entity,
            'related_id': self.related_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Alert(db.Model):
    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True)
    alert_code = db.Column(db.String(64), nullable=False)
    title = db.Column(db.String(256), nullable=False)
    description = db.Column(db.Text)
    severity = db.Column(db.String(20), default='medium')
    # Severities: low, medium, high, critical
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    status = db.Column(db.String(20), default='open')
    # Statuses: open, acknowledged, resolved, closed
    recommended_action = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', foreign_keys=[project_id], backref='alerts')

    def to_dict(self):
        return {
            'id': self.id,
            'alert_code': self.alert_code,
            'title': self.title,
            'description': self.description,
            'severity': self.severity,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'status': self.status,
            'recommended_action': self.recommended_action,
            'is_read': self.is_read,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
