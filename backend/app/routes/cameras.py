from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from app.database import db
from app.models.camera import Camera
import random, string

cameras_bp = Blueprint('cameras', __name__)

def gen_camera_id():
    return 'CAM-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@cameras_bp.route('', methods=['GET'])
@jwt_required()
def get_cameras():
    project_id = request.args.get('project_id', type=int)
    status = request.args.get('status')
    query = Camera.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    if status:
        query = query.filter_by(status=status)
    cameras = query.filter_by(is_active=True).order_by(Camera.created_at.desc()).all()
    return jsonify({'cameras': [c.to_dict() for c in cameras], 'total': len(cameras)}), 200


@cameras_bp.route('', methods=['POST'])
@jwt_required()
def create_camera():
    data = request.get_json()
    if not data.get('name') or not data.get('project_id'):
        return jsonify({'error': 'name and project_id are required'}), 400

    inst_date = None
    if data.get('installation_date'):
        try:
            inst_date = date.fromisoformat(data['installation_date'])
        except ValueError:
            pass

    camera = Camera(
        camera_id=gen_camera_id(),
        name=data['name'],
        project_id=data['project_id'],
        location_description=data.get('location_description'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        ip_address=data.get('ip_address'),
        stream_url=data.get('stream_url'),
        camera_type=data.get('camera_type', 'fixed'),
        status=data.get('status', 'online'),
        resolution=data.get('resolution'),
        manufacturer=data.get('manufacturer'),
        model_number=data.get('model_number'),
        installation_date=inst_date,
        last_active=datetime.utcnow(),
    )
    db.session.add(camera)
    db.session.commit()
    return jsonify({'message': 'Camera registered', 'camera': camera.to_dict()}), 201


@cameras_bp.route('/<int:camera_id>', methods=['PUT'])
@jwt_required()
def update_camera(camera_id):
    camera = Camera.query.get_or_404(camera_id)
    data = request.get_json()
    allowed = ['name', 'location_description', 'latitude', 'longitude', 'camera_type',
               'status', 'resolution', 'manufacturer', 'model_number', 'stream_url']
    for field in allowed:
        if field in data:
            setattr(camera, field, data[field])
    if data.get('status') == 'online':
        camera.last_active = datetime.utcnow()
    camera.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Camera updated', 'camera': camera.to_dict()}), 200


@cameras_bp.route('/<int:camera_id>', methods=['DELETE'])
@jwt_required()
def delete_camera(camera_id):
    camera = Camera.query.get_or_404(camera_id)
    camera.is_active = False
    db.session.commit()
    return jsonify({'message': 'Camera deactivated'}), 200


@cameras_bp.route('/<int:camera_id>/status', methods=['GET'])
@jwt_required()
def camera_status(camera_id):
    camera = Camera.query.get_or_404(camera_id)
    return jsonify({
        'id': camera.id,
        'name': camera.name,
        'status': camera.status,
        'last_active': camera.last_active.isoformat() if camera.last_active else None,
        'mock_stream': True,
        'mock_stream_info': 'Real RTSP/HLS stream integration ready. Configure stream_url in backend.'
    }), 200


@cameras_bp.route('/stats', methods=['GET'])
@jwt_required()
def camera_stats():
    total = Camera.query.filter_by(is_active=True).count()
    online = Camera.query.filter_by(is_active=True, status='online').count()
    offline = Camera.query.filter_by(is_active=True, status='offline').count()
    return jsonify({'total': total, 'online': online, 'offline': offline, 'maintenance': total - online - offline}), 200
