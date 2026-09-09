from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from app.database import db
from app.models.attendance import Attendance
from app.models.project import Project
from app.services.attendance_analysis import AttendanceAnalysisService

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('', methods=['GET'])
@jwt_required()
def get_attendance():
    project_id = request.args.get('project_id', type=int)
    att_type = request.args.get('type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Attendance.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    if att_type:
        query = query.filter_by(attendance_type=att_type)
    if start_date:
        try:
            query = query.filter(Attendance.attendance_date >= date.fromisoformat(start_date))
        except ValueError:
            pass
    if end_date:
        try:
            query = query.filter(Attendance.attendance_date <= date.fromisoformat(end_date))
        except ValueError:
            pass

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 30, type=int)
    paginated = query.order_by(Attendance.attendance_date.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'attendance': [a.to_dict() for a in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@attendance_bp.route('', methods=['POST'])
@jwt_required()
def add_attendance():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    required = ['project_id', 'attendance_date', 'attendance_type', 'total_count', 'present_count']
    for field in required:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    project = Project.query.get(data['project_id'])
    if not project:
        return jsonify({'error': 'Project not found'}), 404

    try:
        att_date = date.fromisoformat(data['attendance_date'])
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    existing = Attendance.query.filter_by(
        project_id=data['project_id'],
        attendance_date=att_date,
        attendance_type=data['attendance_type']
    ).first()
    if existing:
        return jsonify({'error': 'Attendance already recorded for this date and type'}), 409

    total = int(data['total_count'])
    present = int(data['present_count'])
    absent = total - present
    pct = round((present / total * 100), 1) if total > 0 else 0.0

    service = AttendanceAnalysisService()
    anomaly_result = service.check_anomaly(data['project_id'], att_date, pct, data['attendance_type'])

    attendance = Attendance(
        project_id=data['project_id'],
        attendance_date=att_date,
        attendance_type=data['attendance_type'],
        total_count=total,
        present_count=present,
        absent_count=absent,
        attendance_percentage=pct,
        recorded_by_id=user_id,
        notes=data.get('notes', ''),
        is_anomaly=anomaly_result['is_anomaly'],
        anomaly_reason=anomaly_result.get('reason'),
    )
    db.session.add(attendance)
    db.session.commit()

    return jsonify({'message': 'Attendance recorded', 'attendance': attendance.to_dict()}), 201


@attendance_bp.route('/analytics', methods=['GET'])
@jwt_required()
def attendance_analytics():
    project_id = request.args.get('project_id', type=int)
    days = request.args.get('days', 30, type=int)

    end = date.today()
    start = end - timedelta(days=days)
    query = Attendance.query.filter(Attendance.attendance_date.between(start, end))
    if project_id:
        query = query.filter_by(project_id=project_id)

    records = query.order_by(Attendance.attendance_date).all()
    staff_data = [r for r in records if r.attendance_type == 'staff']
    bene_data = [r for r in records if r.attendance_type == 'beneficiary']

    def summarize(data):
        if not data:
            return {'average': 0, 'min': 0, 'max': 0, 'trend': []}
        pcts = [r.attendance_percentage for r in data]
        return {
            'average': round(sum(pcts)/len(pcts), 1),
            'min': min(pcts),
            'max': max(pcts),
            'trend': [{'date': r.attendance_date.isoformat(), 'percentage': r.attendance_percentage, 'is_anomaly': r.is_anomaly} for r in data]
        }

    anomalies = [r.to_dict() for r in records if r.is_anomaly]

    return jsonify({
        'staff': summarize(staff_data),
        'beneficiary': summarize(bene_data),
        'anomalies': anomalies,
        'period_days': days
    }), 200
