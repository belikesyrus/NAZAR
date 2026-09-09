"""
Anomaly Detection Service
Rule-based implementation. Replace `_ml_detect()` stub with a real ML model.
Interface: detect_anomalies(data) -> list[dict]
"""
from datetime import datetime, timedelta, date
from app.database import db
from app.models.attendance import Attendance
from app.models.inspection import Inspection
from app.models.project import Project
from app.models.camera import Camera
from app.models.notification import Alert


class AnomalyDetectionService:

    # ── Public interface ─────────────────────────────────────────────────────

    def get_recent_anomalies(self, days: int = 30) -> dict:
        alerts = Alert.query.filter(
            Alert.created_at >= datetime.utcnow() - timedelta(days=days)
        ).order_by(Alert.created_at.desc()).all()

        return {
            'anomalies': [a.to_dict() for a in alerts],
            'total': len(alerts),
            'by_severity': self._count_by_severity(alerts),
            'by_code': self._count_by_code(alerts),
        }

    def run_full_scan(self):
        """Run all rule-based detectors and persist new alerts."""
        results = []
        results += self._check_attendance_anomalies()
        results += self._check_cctv_offline()
        results += self._check_overdue_inspections()
        results += self._check_low_compliance()
        for r in results:
            self._persist_alert(r)
        return results

    # ── Rule-based detectors ─────────────────────────────────────────────────

    def _check_attendance_anomalies(self) -> list:
        alerts = []
        cutoff = date.today() - timedelta(days=7)
        records = Attendance.query.filter(Attendance.attendance_date >= cutoff).all()
        by_project = {}
        for r in records:
            by_project.setdefault(r.project_id, []).append(r)

        for pid, recs in by_project.items():
            pcts = [r.attendance_percentage for r in recs]
            avg = sum(pcts) / len(pcts) if pcts else 0

            if avg < 40:
                alerts.append({
                    'alert_code': 'ATTENDANCE_ANOMALY',
                    'title': 'Critically Low Attendance',
                    'description': f'Average attendance {avg:.1f}% over last 7 days.',
                    'severity': 'high',
                    'project_id': pid,
                    'recommended_action': 'Schedule surprise inspection immediately.',
                })
            elif avg < 60:
                alerts.append({
                    'alert_code': 'ATTENDANCE_ANOMALY',
                    'title': 'Below Average Attendance',
                    'description': f'Average attendance {avg:.1f}% over last 7 days.',
                    'severity': 'medium',
                    'project_id': pid,
                    'recommended_action': 'Review attendance records and contact project incharge.',
                })

            # Detect repeated identical values (possible fake data)
            if len(set(pcts)) == 1 and len(pcts) >= 3:
                alerts.append({
                    'alert_code': 'UNUSUAL_REPORTING',
                    'title': 'Suspicious Identical Attendance Values',
                    'description': f'Attendance recorded as exactly {pcts[0]}% for {len(pcts)} consecutive days.',
                    'severity': 'high',
                    'project_id': pid,
                    'recommended_action': 'Audit attendance records; suspect data fabrication.',
                })

        return alerts

    def _check_cctv_offline(self) -> list:
        alerts = []
        offline = Camera.query.filter_by(status='offline', is_active=True).all()
        for cam in offline:
            alerts.append({
                'alert_code': 'CCTV_OFFLINE',
                'title': f'CCTV Camera Offline: {cam.name}',
                'description': f'Camera {cam.camera_id} at project {cam.project_id} is offline.',
                'severity': 'medium',
                'project_id': cam.project_id,
                'recommended_action': 'Check camera connectivity and power supply.',
            })
        return alerts

    def _check_overdue_inspections(self) -> list:
        alerts = []
        overdue_days = 90
        cutoff = datetime.utcnow() - timedelta(days=overdue_days)
        projects = Project.query.filter_by(status='active').all()
        for p in projects:
            if p.last_inspection_date is None or p.last_inspection_date < cutoff:
                last_str = p.last_inspection_date.strftime('%Y-%m-%d') if p.last_inspection_date else 'Never'
                alerts.append({
                    'alert_code': 'INSPECTION_OVERDUE',
                    'title': f'Inspection Overdue: {p.name}',
                    'description': f'No inspection in the last {overdue_days} days. Last: {last_str}',
                    'severity': 'high',
                    'project_id': p.id,
                    'recommended_action': 'Schedule inspection immediately.',
                })
        return alerts

    def _check_low_compliance(self) -> list:
        alerts = []
        low_projects = Project.query.filter(Project.compliance_score < 50, Project.compliance_score > 0).all()
        for p in low_projects:
            alerts.append({
                'alert_code': 'LOW_COMPLIANCE',
                'title': f'Low Compliance Score: {p.name}',
                'description': f'Compliance score is {p.compliance_score:.1f}% — below threshold of 50%.',
                'severity': 'high' if p.compliance_score < 30 else 'medium',
                'project_id': p.id,
                'recommended_action': 'Review last inspection report and schedule corrective action.',
            })
        return alerts

    # ── ML stub ──────────────────────────────────────────────────────────────

    def _ml_detect(self, features: dict) -> dict:
        """
        Stub for future ML model integration.
        Replace with: model.predict(features)
        """
        return {'anomaly': False, 'confidence': 0.0}

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _persist_alert(self, alert_data: dict):
        existing = Alert.query.filter_by(
            alert_code=alert_data['alert_code'],
            project_id=alert_data.get('project_id'),
            status='open'
        ).first()
        if existing:
            return
        alert = Alert(**alert_data)
        db.session.add(alert)
        db.session.commit()

    def _count_by_severity(self, alerts):
        counts = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
        for a in alerts:
            counts[a.severity] = counts.get(a.severity, 0) + 1
        return counts

    def _count_by_code(self, alerts):
        counts = {}
        for a in alerts:
            counts[a.alert_code] = counts.get(a.alert_code, 0) + 1
        return counts
