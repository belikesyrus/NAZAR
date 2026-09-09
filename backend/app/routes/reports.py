from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.inspection import Inspection, ChecklistResponse
from app.models.evidence import Evidence
from app.models.attendance import Attendance

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('', methods=['GET'])
@jwt_required()
def get_reports():
    status = request.args.get('status')
    project_id = request.args.get('project_id', type=int)
    query = Inspection.query.filter(Inspection.status.in_(['submitted', 'under_review', 'approved', 'rejected']))
    if status:
        query = query.filter_by(status=status)
    if project_id:
        query = query.filter_by(project_id=project_id)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    paginated = query.order_by(Inspection.submitted_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'reports': [i.to_dict() for i in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@reports_bp.route('/<int:report_id>', methods=['GET'])
@jwt_required()
def get_report(report_id):
    inspection = Inspection.query.get_or_404(report_id)
    data = inspection.to_dict()
    data['checklist'] = [c.to_dict() for c in inspection.checklist_items]
    data['evidence'] = [e.to_dict() for e in inspection.evidence]

    if inspection.project_id:
        att = Attendance.query.filter_by(project_id=inspection.project_id).order_by(Attendance.attendance_date.desc()).limit(7).all()
        data['recent_attendance'] = [a.to_dict() for a in att]

    return jsonify({'report': data}), 200


@reports_bp.route('/<int:report_id>/approve', methods=['PUT'])
@jwt_required()
def approve_report(report_id):
    from app.database import db
    inspection = Inspection.query.get_or_404(report_id)
    data = request.get_json() or {}
    inspection.status = 'approved'
    inspection.reviewer_comments = data.get('comments', '')
    from datetime import datetime
    inspection.completed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Report approved', 'report': inspection.to_dict()}), 200


@reports_bp.route('/<int:report_id>/reject', methods=['PUT'])
@jwt_required()
def reject_report(report_id):
    from app.database import db
    inspection = Inspection.query.get_or_404(report_id)
    data = request.get_json() or {}
    inspection.status = 'rejected'
    inspection.reviewer_comments = data.get('comments', '')
    db.session.commit()
    return jsonify({'message': 'Report rejected', 'report': inspection.to_dict()}), 200
