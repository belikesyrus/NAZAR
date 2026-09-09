from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from app.database import db
from app.models.project import Project
from app.models.user import User
import random, string

projects_bp = Blueprint('projects', __name__)

def generate_project_id():
    return 'PRJ-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@projects_bp.route('', methods=['GET'])
@jwt_required()
def get_projects():
    query = Project.query
    ptype = request.args.get('type')
    state = request.args.get('state')
    district = request.args.get('district')
    status = request.args.get('status')
    search = request.args.get('search', '')

    if ptype:
        query = query.filter_by(project_type=ptype)
    if state:
        query = query.filter_by(state=state)
    if district:
        query = query.filter_by(district=district)
    if status:
        query = query.filter_by(status=status)
    if search:
        query = query.filter(
            Project.name.ilike(f'%{search}%') |
            Project.organization_name.ilike(f'%{search}%') |
            Project.project_id.ilike(f'%{search}%')
        )

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    paginated = query.order_by(Project.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'projects': [p.to_dict() for p in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@projects_bp.route('', methods=['POST'])
@jwt_required()
def create_project():
    data = request.get_json()
    if not data.get('name'):
        return jsonify({'error': 'Project name is required'}), 400

    reg_date = None
    if data.get('registration_date'):
        try:
            reg_date = date.fromisoformat(data['registration_date'])
        except ValueError:
            pass

    project = Project(
        project_id=generate_project_id(),
        name=data['name'],
        organization_name=data.get('organization_name'),
        project_type=data.get('project_type', 'project'),
        scheme=data.get('scheme'),
        state=data.get('state'),
        district=data.get('district'),
        address=data.get('address'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        incharge_id=data.get('incharge_id'),
        contact_name=data.get('contact_name'),
        contact_phone=data.get('contact_phone'),
        contact_email=data.get('contact_email'),
        beneficiary_count=data.get('beneficiary_count', 0),
        staff_count=data.get('staff_count', 0),
        status=data.get('status', 'active'),
        registration_date=reg_date,
    )
    db.session.add(project)
    db.session.commit()
    return jsonify({'message': 'Project created', 'project': project.to_dict()}), 201


@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    return jsonify({'project': project.to_dict()}), 200


@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    project = Project.query.get_or_404(project_id)
    data = request.get_json()
    allowed = ['name', 'organization_name', 'scheme', 'state', 'district', 'address',
               'latitude', 'longitude', 'incharge_id', 'contact_name', 'contact_phone',
               'contact_email', 'beneficiary_count', 'staff_count', 'status', 'compliance_score']
    for field in allowed:
        if field in data:
            setattr(project, field, data[field])
    project.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Project updated', 'project': project.to_dict()}), 200


@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    project.status = 'inactive'
    db.session.commit()
    return jsonify({'message': 'Project deactivated'}), 200


@projects_bp.route('/stats', methods=['GET'])
@jwt_required()
def project_stats():
    total = Project.query.count()
    active = Project.query.filter_by(status='active').count()
    institutes = Project.query.filter_by(project_type='institute').count()
    ngos = Project.query.filter_by(project_type='ngo').count()
    return jsonify({
        'total': total, 'active': active,
        'institutes': institutes, 'ngos': ngos
    }), 200
