from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from app.database import db
from app.models.beneficiary import Beneficiary, Complaint, Meeting
from app.models.project import Project
import uuid, random, string

beneficiaries_bp = Blueprint('beneficiaries', __name__)

def gen_id(prefix):
    return prefix + '-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@beneficiaries_bp.route('', methods=['GET'])
@jwt_required()
def get_beneficiaries():
    project_id = request.args.get('project_id', type=int)
    search = request.args.get('search', '')
    query = Beneficiary.query.filter_by(is_active=True)
    if project_id:
        query = query.filter_by(project_id=project_id)
    if search:
        query = query.filter(Beneficiary.name.ilike(f'%{search}%'))
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    paginated = query.order_by(Beneficiary.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'beneficiaries': [b.to_dict() for b in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages
    }), 200


@beneficiaries_bp.route('', methods=['POST'])
@jwt_required()
def add_beneficiary():
    data = request.get_json()
    if not data.get('name') or not data.get('project_id'):
        return jsonify({'error': 'name and project_id are required'}), 400
    enroll_date = None
    if data.get('enrollment_date'):
        try:
            enroll_date = date.fromisoformat(data['enrollment_date'])
        except ValueError:
            pass
    b = Beneficiary(
        beneficiary_id=gen_id('BEN'),
        name=data['name'],
        project_id=data['project_id'],
        user_id=data.get('user_id'),
        age=data.get('age'),
        gender=data.get('gender'),
        phone=data.get('phone'),
        address=data.get('address'),
        service_status=data.get('service_status', 'active'),
        enrollment_date=enroll_date,
    )
    db.session.add(b)
    db.session.commit()
    return jsonify({'message': 'Beneficiary added', 'beneficiary': b.to_dict()}), 201


@beneficiaries_bp.route('/<int:ben_id>', methods=['GET'])
@jwt_required()
def get_beneficiary(ben_id):
    b = Beneficiary.query.get_or_404(ben_id)
    return jsonify({'beneficiary': b.to_dict()}), 200


# ── Complaints ──────────────────────────────────────────────────────────────

@beneficiaries_bp.route('/complaints', methods=['GET'])
@jwt_required()
def get_complaints():
    user_id = int(get_jwt_identity())
    from app.models.user import User
    user = User.query.get(user_id)
    query = Complaint.query
    if user.role in ('beneficiary', 'ngo_staff'):
        query = query.filter_by(submitted_by_id=user_id)
    status = request.args.get('status')
    ctype = request.args.get('type')
    if status:
        query = query.filter_by(status=status)
    if ctype:
        query = query.filter_by(complaint_type=ctype)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    paginated = query.order_by(Complaint.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'complaints': [c.to_dict() for c in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages
    }), 200


@beneficiaries_bp.route('/complaints', methods=['POST'])
@jwt_required()
def submit_complaint():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data.get('subject') or not data.get('description'):
        return jsonify({'error': 'subject and description are required'}), 400
    c = Complaint(
        complaint_number=gen_id('CMP'),
        submitted_by_id=user_id,
        beneficiary_id=data.get('beneficiary_id'),
        project_id=data.get('project_id'),
        complaint_type=data.get('complaint_type', 'complaint'),
        subject=data['subject'],
        description=data['description'],
        priority=data.get('priority', 'medium'),
    )
    db.session.add(c)
    db.session.commit()
    return jsonify({'message': 'Complaint submitted', 'complaint': c.to_dict()}), 201


@beneficiaries_bp.route('/complaints/<int:complaint_id>', methods=['PUT'])
@jwt_required()
def update_complaint(complaint_id):
    c = Complaint.query.get_or_404(complaint_id)
    data = request.get_json()
    allowed = ['status', 'department_response', 'priority']
    for field in allowed:
        if field in data:
            setattr(c, field, data[field])
    if data.get('status') == 'resolved':
        c.resolved_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Complaint updated', 'complaint': c.to_dict()}), 200


# ── Video Conferencing ───────────────────────────────────────────────────────

@beneficiaries_bp.route('/meetings', methods=['GET'])
@jwt_required()
def get_meetings():
    project_id = request.args.get('project_id', type=int)
    query = Meeting.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    meetings = query.order_by(Meeting.created_at.desc()).limit(50).all()
    return jsonify({'meetings': [m.to_dict() for m in meetings]}), 200


@beneficiaries_bp.route('/meetings', methods=['POST'])
@jwt_required()
def create_meeting():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data.get('project_id'):
        return jsonify({'error': 'project_id is required'}), 400
    room_name = 'dosje-' + uuid.uuid4().hex[:10]
    join_url = f'https://meet.jit.si/{room_name}'  # Replace with real provider
    m = Meeting(
        meeting_id=gen_id('MTG'),
        project_id=data['project_id'],
        created_by_id=user_id,
        title=data.get('title', 'Random VC Inspection'),
        meeting_type=data.get('meeting_type', 'random_vc'),
        status='scheduled',
        room_name=room_name,
        join_url=join_url,
        participants=data.get('participants', '[]'),
        scheduled_at=datetime.utcnow(),
    )
    db.session.add(m)
    db.session.commit()
    return jsonify({'message': 'Meeting created', 'meeting': m.to_dict()}), 201


@beneficiaries_bp.route('/meetings/<int:meeting_id>/start', methods=['POST'])
@jwt_required()
def start_meeting(meeting_id):
    m = Meeting.query.get_or_404(meeting_id)
    m.status = 'in_progress'
    m.started_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Meeting started', 'meeting': m.to_dict()}), 200


@beneficiaries_bp.route('/meetings/<int:meeting_id>/end', methods=['POST'])
@jwt_required()
def end_meeting(meeting_id):
    m = Meeting.query.get_or_404(meeting_id)
    m.status = 'completed'
    m.ended_at = datetime.utcnow()
    if m.started_at:
        m.duration_minutes = int((m.ended_at - m.started_at).total_seconds() / 60)
    db.session.commit()
    return jsonify({'message': 'Meeting ended', 'meeting': m.to_dict()}), 200
