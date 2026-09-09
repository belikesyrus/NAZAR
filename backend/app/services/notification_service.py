"""Notification Service — creates in-app notifications for users."""
from app.database import db
from app.models.notification import Notification
from app.models.user import User


class NotificationService:

    @staticmethod
    def notify_user(user_id: int, title: str, message: str,
                    notification_type: str = 'info',
                    related_entity: str = None,
                    related_id: int = None):
        n = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_entity=related_entity,
            related_id=related_id,
        )
        db.session.add(n)
        db.session.commit()
        return n

    @staticmethod
    def notify_role(role: str, title: str, message: str, notification_type: str = 'info'):
        users = User.query.filter_by(role=role, is_active=True).all()
        for user in users:
            n = Notification(
                user_id=user.id,
                title=title,
                message=message,
                notification_type=notification_type,
            )
            db.session.add(n)
        db.session.commit()

    @staticmethod
    def notify_inspection_assigned(officer_id: int, inspection_number: str, project_name: str):
        NotificationService.notify_user(
            user_id=officer_id,
            title='New Inspection Assigned',
            message=f'You have been assigned inspection {inspection_number} for project: {project_name}.',
            notification_type='info',
            related_entity='inspection',
        )

    @staticmethod
    def notify_report_reviewed(officer_id: int, inspection_number: str, status: str):
        ntype = 'success' if status == 'approved' else 'warning'
        NotificationService.notify_user(
            user_id=officer_id,
            title=f'Inspection Report {status.capitalize()}',
            message=f'Your report for {inspection_number} has been {status}.',
            notification_type=ntype,
        )
