import os, uuid
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.database import db
from app.models.evidence import Evidence
from app.models.inspection import Inspection

evidence_bp = Blueprint('evidence', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'mov'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16 MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@evidence_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_evidence():
    user_id = int(get_jwt_identity())
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': f'File type not allowed. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

    inspection_id = request.form.get('inspection_id')
    if not inspection_id:
        return jsonify({'error': 'inspection_id is required'}), 400

    inspection = Inspection.query.get(int(inspection_id))
    if not inspection:
        return jsonify({'error': 'Inspection not found'}), 404

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > MAX_FILE_SIZE:
        return jsonify({'error': 'File too large (max 16MB)'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, unique_name)
    file.save(file_path)

    evidence = Evidence(
        evidence_id='EVD-' + uuid.uuid4().hex[:8].upper(),
        inspection_id=int(inspection_id),
        uploaded_by_id=user_id,
        file_name=unique_name,
        original_name=secure_filename(file.filename),
        file_type=ext,
        file_size=size,
        file_path=file_path,
        description=request.form.get('description', ''),
        latitude=request.form.get('latitude', type=float),
        longitude=request.form.get('longitude', type=float),
    )
    db.session.add(evidence)
    db.session.commit()

    return jsonify({'message': 'Evidence uploaded', 'evidence': evidence.to_dict()}), 201


@evidence_bp.route('/<int:inspection_id>', methods=['GET'])
@jwt_required()
def get_evidence(inspection_id):
    evidence_list = Evidence.query.filter_by(inspection_id=inspection_id).all()
    return jsonify({'evidence': [e.to_dict() for e in evidence_list]}), 200


@evidence_bp.route('/file/<filename>', methods=['GET'])
@jwt_required()
def serve_file(filename):
    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    safe_name = secure_filename(filename)
    return send_from_directory(os.path.abspath(upload_folder), safe_name)


@evidence_bp.route('/<int:evidence_id>', methods=['DELETE'])
@jwt_required()
def delete_evidence(evidence_id):
    user_id = int(get_jwt_identity())
    ev = Evidence.query.get_or_404(evidence_id)
    if ev.uploaded_by_id != user_id:
        return jsonify({'error': 'Not authorized'}), 403
    if ev.file_path and os.path.exists(ev.file_path):
        os.remove(ev.file_path)
    db.session.delete(ev)
    db.session.commit()
    return jsonify({'message': 'Evidence deleted'}), 200
