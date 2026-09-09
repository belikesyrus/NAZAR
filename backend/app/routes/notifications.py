from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.database import db
from app.models.notification import Notification, Alert

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    unread_only = request.args.get('unread', 'false').lower() == 'true'
    query = Notification.query.filter_by(user_id=user_id)
    if unread_only:
        query = query.filter_by(is_read=False)
    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count
    }), 200


@notifications_bp.route('/<int:notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notif_id):
    user_id = int(get_jwt_identity())
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    notif.is_read = True
    db.session.commit()
    return jsonify({'message': 'Marked as read'}), 200


@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'}), 200


# ── Alerts ──────────────────────────────────────────────────────────────────

@notifications_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    severity = request.args.get('severity')
    status = request.args.get('status')
    project_id = request.args.get('project_id', type=int)
    query = Alert.query
    if severity:
        query = query.filter_by(severity=severity)
    if status:
        query = query.filter_by(status=status)
    if project_id:
        query = query.filter_by(project_id=project_id)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    paginated = query.order_by(Alert.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    unread = Alert.query.filter_by(is_read=False).count()
    return jsonify({
        'alerts': [a.to_dict() for a in paginated.items],
        'total': paginated.total,
        'unread_count': unread,
        'pages': paginated.pages
    }), 200


@notifications_bp.route('/alerts/<int:alert_id>/read', methods=['PUT'])
@jwt_required()
def mark_alert_read(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    alert.is_read = True
    db.session.commit()
    return jsonify({'message': 'Alert marked as read'}), 200


@notifications_bp.route('/alerts/<int:alert_id>/resolve', methods=['PUT'])
@jwt_required()
def resolve_alert(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    alert.status = 'resolved'
    alert.resolved_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Alert resolved', 'alert': alert.to_dict()}), 200


@notifications_bp.route('/alerts/stats', methods=['GET'])
@jwt_required()
def alert_stats():
    total = Alert.query.count()
    open_alerts = Alert.query.filter_by(status='open').count()
    critical = Alert.query.filter_by(severity='critical', status='open').count()
    high = Alert.query.filter_by(severity='high', status='open').count()
    return jsonify({'total': total, 'open': open_alerts, 'critical': critical, 'high': high}), 200
