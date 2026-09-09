from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import date, timedelta
from sqlalchemy import func
from app.database import db
from app.models.project import Project
from app.models.inspection import Inspection
from app.models.attendance import Attendance
from app.models.notification import Alert
from app.models.camera import Camera
from app.services.anomaly_detection import AnomalyDetectionService

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_analytics():
    total_projects = Project.query.count()
    active_projects = Project.query.filter_by(status='active').count()
    total_inspections = Inspection.query.count()
    pending = Inspection.query.filter(Inspection.status.in_(['assigned', 'accepted', 'in_progress'])).count()
    completed = Inspection.query.filter(Inspection.status.in_(['approved', 'submitted'])).count()
    high_risk = Project.query.filter(Project.compliance_score < 50).count()
    open_alerts = Alert.query.filter_by(status='open').count()
    cameras_online = Camera.query.filter_by(status='online', is_active=True).count()
    cameras_total = Camera.query.filter_by(is_active=True).count()

    end = date.today()
    start = end - timedelta(days=30)
    att_anomalies = Attendance.query.filter(
        Attendance.is_anomaly == True,
        Attendance.attendance_date.between(start, end)
    ).count()

    avg_compliance = db.session.query(func.avg(Project.compliance_score)).scalar() or 0

    recent_inspections = Inspection.query.order_by(Inspection.created_at.desc()).limit(5).all()
    recent_alerts = Alert.query.order_by(Alert.created_at.desc()).limit(5).all()

    return jsonify({
        'stats': {
            'total_projects': total_projects,
            'active_projects': active_projects,
            'total_inspections': total_inspections,
            'pending_inspections': pending,
            'completed_inspections': completed,
            'high_risk_projects': high_risk,
            'open_alerts': open_alerts,
            'cameras_online': cameras_online,
            'cameras_total': cameras_total,
            'attendance_anomalies': att_anomalies,
            'avg_compliance': round(float(avg_compliance), 1),
        },
        'recent_inspections': [i.to_dict() for i in recent_inspections],
        'recent_alerts': [a.to_dict() for a in recent_alerts],
    }), 200


@analytics_bp.route('/compliance', methods=['GET'])
@jwt_required()
def compliance_analytics():
    projects = Project.query.filter_by(status='active').all()
    score_buckets = {'0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0}
    for p in projects:
        s = p.compliance_score or 0
        if s <= 25:
            score_buckets['0-25'] += 1
        elif s <= 50:
            score_buckets['26-50'] += 1
        elif s <= 75:
            score_buckets['51-75'] += 1
        else:
            score_buckets['76-100'] += 1

    by_state = db.session.query(
        Project.state, func.avg(Project.compliance_score)
    ).group_by(Project.state).all()

    return jsonify({
        'score_distribution': score_buckets,
        'by_state': [{'state': s or 'Unknown', 'avg_score': round(float(v or 0), 1)} for s, v in by_state],
        'projects': [{'id': p.id, 'name': p.name, 'score': p.compliance_score, 'state': p.state} for p in projects]
    }), 200


@analytics_bp.route('/anomalies', methods=['GET'])
@jwt_required()
def anomaly_analytics():
    service = AnomalyDetectionService()
    result = service.get_recent_anomalies(days=30)
    return jsonify(result), 200


@analytics_bp.route('/inspection-trends', methods=['GET'])
@jwt_required()
def inspection_trends():
    days = request.args.get('days', 30, type=int)
    end = date.today()
    start = end - timedelta(days=days)

    results = db.session.query(
        func.date(Inspection.created_at).label('day'),
        func.count(Inspection.id).label('count')
    ).filter(
        func.date(Inspection.created_at).between(start, end)
    ).group_by(func.date(Inspection.created_at)).all()

    by_status = db.session.query(
        Inspection.status, func.count(Inspection.id)
    ).group_by(Inspection.status).all()

    by_type = db.session.query(
        Inspection.inspection_type, func.count(Inspection.id)
    ).group_by(Inspection.inspection_type).all()

    return jsonify({
        'daily_trend': [{'date': str(r.day), 'count': r.count} for r in results],
        'by_status': [{'status': s, 'count': c} for s, c in by_status],
        'by_type': [{'type': t, 'count': c} for t, c in by_type],
    }), 200


@analytics_bp.route('/performance', methods=['GET'])
@jwt_required()
def performance_analytics():
    states = db.session.query(
        Project.state,
        func.count(Project.id).label('projects'),
        func.avg(Project.compliance_score).label('avg_compliance')
    ).group_by(Project.state).all()

    return jsonify({
        'by_state': [{
            'state': s or 'Unknown',
            'projects': int(p),
            'avg_compliance': round(float(c or 0), 1)
        } for s, p, c in states]
    }), 200
