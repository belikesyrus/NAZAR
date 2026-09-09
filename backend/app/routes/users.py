from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import db
from app.models.user import User

users_bp = Blueprint('users', __name__)

@users_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    role = request.args.get('role')
    search = request.args.get('search', '')
    is_active = request.args.get('is_active')
    query = User.query
    if role:
        query = query.filter_by(role=role)
    if is_active is not None:
        query = query.filter_by(is_active=(is_active.lower() == 'true'))
    if search:
        query = query.filter(
            User.name.ilike(f'%{search}%') | User.email.ilike(f'%{search}%')
        )
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    paginated = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'users': [u.to_dict() for u in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages
    }), 200


@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({'user': user.to_dict()}), 200


@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if current_user.role not in ('department_official', 'district_authority'):
        return jsonify({'error': 'Insufficient permissions'}), 403
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    allowed = ['name', 'role', 'phone', 'state', 'district', 'designation', 'employee_id', 'is_active']
    for field in allowed:
        if field in data:
            setattr(user, field, data[field])
    db.session.commit()
    return jsonify({'message': 'User updated', 'user': user.to_dict()}), 200


@users_bp.route('/officers', methods=['GET'])
@jwt_required()
def get_officers():
    officers = User.query.filter_by(role='inspection_officer', is_active=True).all()
    return jsonify({'officers': [u.to_dict() for u in officers]}), 200


@users_bp.route('/stats', methods=['GET'])
@jwt_required()
def user_stats():
    from sqlalchemy import func
    stats = db.session.query(User.role, func.count(User.id)).group_by(User.role).all()
    return jsonify({'stats': [{'role': r, 'count': c} for r, c in stats]}), 200
