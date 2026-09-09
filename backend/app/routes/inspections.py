from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.database import db
from app.models.inspection import Inspection, ChecklistResponse
from app.models.project import Project
from app.models.user import User
from app.services.inspection_assignment import InspectionAssignmentService
import random, string, math

inspections_bp = Blueprint('inspections', __name__)

CHECKLIST_ITEMS = [
    {'key': 'project_functioning', 'label': 'Project is functioning normally'},
    {'key': 'staff_attendance', 'label': 'Staff attendance is satisfactory'},
    {'key': 'beneficiary_attendance', 'label': 'Beneficiary attendance is satisfactory'},
    {'key': 'infrastructure_condition', 'label': 'Infrastructure is in good condition'},
    {'key': 'records_maintained', 'label': 'Records are properly maintained'},
    {'key': 'scheme_guidelines_followed', 'label': 'Scheme guidelines are being followed'},
    {'key': 'services_delivered', 'label': 'Services are being delivered as planned'},
    {'key': 'cctv_operational', 'label': 'CCTV cameras are operational'},
    {'key': 'safety_requirements', 'label': 'Safety requirements are met'},
    {'key': 'documentation_available', 'label': 'Required documentation is available'},
]

def generate_inspection_number():
    return 'INS-' + datetime.now().strftime('%Y%m') + '-' + ''.join(random.choices(string.digits, k=6))

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2*R*math.atan2(math.sqrt(a), math.sqrt(1-a))

@inspections_bp.route('', methods=['GET'])
@jwt_required()
def get_inspections():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    query = Inspection.query
    if user.role == 'inspection_officer':
        query = query.filter_by(assigned_officer_id=user_id)
    elif user.role == 'project_incharge':
        proj_ids = [p.id for p in Project.query.filter_by(incharge_id=user_id).all()]
        query = query.filter(Inspection.project_id.in_(proj_ids))

    status = request.args.get('status')
    itype = request.args.get('type')
    project_id = request.args.get('project_id')
    if status:
        query = query.filter_by(status=status)
    if itype:
        query = query.filter_by(inspection_type=itype)
    if project_id:
        query = query.filter_by(project_id=int(project_id))

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    paginated = query.order_by(Inspection.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'inspections': [i.to_dict() for i in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@inspections_bp.route('', methods=['POST'])
@jwt_required()
def create_inspection():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data.get('project_id'):
        return jsonify({'error': 'project_id is required'}), 400

    project = Project.query.get(data['project_id'])
    if not project:
        return jsonify({'error': 'Project not found'}), 404

    scheduled_date = None
    if data.get('scheduled_date'):
        try:
            scheduled_date = datetime.fromisoformat(data['scheduled_date'])
        except ValueError:
            pass

    inspection = Inspection(
        inspection_number=generate_inspection_number(),
        project_id=data['project_id'],
        created_by_id=user_id,
        assigned_officer_id=data.get('assigned_officer_id'),
        inspection_type=data.get('inspection_type', 'scheduled'),
        status='assigned' if data.get('assigned_officer_id') else 'pending',
        priority=data.get('priority', 'medium'),
        scheduled_date=scheduled_date,
        assignment_reason=data.get('assignment_reason'),
    )
    db.session.add(inspection)
    db.session.flush()

    for item in CHECKLIST_ITEMS:
        cr = ChecklistResponse(inspection_id=inspection.id, item_key=item['key'], item_label=item['label'])
        db.session.add(cr)

    db.session.commit()
    return jsonify({'message': 'Inspection created', 'inspection': inspection.to_dict()}), 201


@inspections_bp.route('/<int:inspection_id>', methods=['GET'])
@jwt_required()
def get_inspection(inspection_id):
    inspection = Inspection.query.get_or_404(inspection_id)
    data = inspection.to_dict()
    data['checklist'] = [c.to_dict() for c in inspection.checklist_items]
    data['evidence'] = [e.to_dict() for e in inspection.evidence]
    return jsonify({'inspection': data}), 200


@inspections_bp.route('/<int:inspection_id>', methods=['PUT'])
@jwt_required()
def update_inspection(inspection_id):
    inspection = Inspection.query.get_or_404(inspection_id)
    data = request.get_json()
    allowed = ['status', 'priority', 'observations', 'recommendations', 'assignment_reason',
               'inspector_latitude', 'inspector_longitude', 'reviewer_comments', 'overall_status']
    for field in allowed:
        if field in data:
            setattr(inspection, field, data[field])

    if data.get('status') == 'in_progress' and not inspection.started_at:
        inspection.started_at = datetime.utcnow()
    if data.get('status') == 'submitted' and not inspection.submitted_at:
        inspection.submitted_at = datetime.utcnow()

    if inspection.inspector_latitude and inspection.inspector_longitude and \
       inspection.project.latitude and inspection.project.longitude:
        inspection.distance_from_project = haversine(
            inspection.inspector_latitude, inspection.inspector_longitude,
            inspection.project.latitude, inspection.project.longitude
        )
        inspection.location_verified = inspection.distance_from_project <= 5.0

    db.session.commit()
    return jsonify({'message': 'Inspection updated', 'inspection': inspection.to_dict()}), 200


@inspections_bp.route('/<int:inspection_id>/assign', methods=['POST'])
@jwt_required()
def assign_inspection(inspection_id):
    inspection = Inspection.query.get_or_404(inspection_id)
    data = request.get_json()
    officer_id = data.get('officer_id')
    if not officer_id:
        return jsonify({'error': 'officer_id required'}), 400
    officer = User.query.get(officer_id)
    if not officer or officer.role != 'inspection_officer':
        return jsonify({'error': 'Invalid officer'}), 400
    inspection.assigned_officer_id = officer_id
    inspection.status = 'assigned'
    inspection.assignment_reason = data.get('reason', 'Manual assignment')
    db.session.commit()
    return jsonify({'message': 'Officer assigned', 'inspection': inspection.to_dict()}), 200


@inspections_bp.route('/<int:inspection_id>/submit', methods=['POST'])
@jwt_required()
def submit_inspection(inspection_id):
    user_id = int(get_jwt_identity())
    inspection = Inspection.query.get_or_404(inspection_id)
    data = request.get_json()

    if inspection.assigned_officer_id != user_id:
        return jsonify({'error': 'Not authorized to submit this inspection'}), 403

    inspection.observations = data.get('observations', '')
    inspection.recommendations = data.get('recommendations', '')
    inspection.inspector_latitude = data.get('latitude')
    inspection.inspector_longitude = data.get('longitude')
    inspection.status = 'submitted'
    inspection.submitted_at = datetime.utcnow()

    if inspection.inspector_latitude and inspection.inspector_longitude and \
       inspection.project.latitude and inspection.project.longitude:
        inspection.distance_from_project = haversine(
            inspection.inspector_latitude, inspection.inspector_longitude,
            inspection.project.latitude, inspection.project.longitude
        )
        inspection.location_verified = inspection.distance_from_project <= 5.0

    checklist_data = data.get('checklist', [])
    yes_count = 0
    applicable_count = 0
    for item_data in checklist_data:
        cr = ChecklistResponse.query.filter_by(
            inspection_id=inspection_id, item_key=item_data.get('item_key')
        ).first()
        if cr:
            cr.response = item_data.get('response', 'not_checked')
            cr.remarks = item_data.get('remarks', '')
            if cr.response != 'not_applicable':
                applicable_count += 1
                if cr.response == 'yes':
                    yes_count += 1

    if applicable_count > 0:
        inspection.compliance_score = round((yes_count / applicable_count) * 100, 1)
    else:
        inspection.compliance_score = 0.0

    inspection.project.compliance_score = inspection.compliance_score
    inspection.project.last_inspection_date = datetime.utcnow()

    db.session.commit()
    return jsonify({'message': 'Inspection submitted', 'inspection': inspection.to_dict()}), 200


@inspections_bp.route('/<int:inspection_id>/approve', methods=['POST'])
@jwt_required()
def approve_inspection(inspection_id):
    inspection = Inspection.query.get_or_404(inspection_id)
    data = request.get_json()
    inspection.status = 'approved'
    inspection.completed_at = datetime.utcnow()
    inspection.reviewer_comments = data.get('comments', '')
    inspection.overall_status = 'approved'
    db.session.commit()
    return jsonify({'message': 'Inspection approved', 'inspection': inspection.to_dict()}), 200


@inspections_bp.route('/<int:inspection_id>/reject', methods=['POST'])
@jwt_required()
def reject_inspection(inspection_id):
    inspection = Inspection.query.get_or_404(inspection_id)
    data = request.get_json()
    inspection.status = 'rejected'
    inspection.reviewer_comments = data.get('comments', '')
    inspection.overall_status = 'rejected'
    db.session.commit()
    return jsonify({'message': 'Inspection rejected', 'inspection': inspection.to_dict()}), 200


@inspections_bp.route('/assign/auto', methods=['POST'])
@jwt_required()
def auto_assign():
    data = request.get_json()
    project_id = data.get('project_id')
    if not project_id:
        return jsonify({'error': 'project_id required'}), 400
    service = InspectionAssignmentService()
    result = service.assign(project_id)
    if result.get('success'):
        return jsonify(result), 200
    return jsonify(result), 400


@inspections_bp.route('/checklist/template', methods=['GET'])
@jwt_required()
def get_checklist_template():
    return jsonify({'checklist': CHECKLIST_ITEMS}), 200
