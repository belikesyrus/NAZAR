"""
Attendance Analysis Service
Rule-based anomaly detection for attendance records.
"""
from datetime import date, timedelta
from app.database import db
from app.models.attendance import Attendance


class AttendanceAnalysisService:

    THRESHOLDS = {
        'critical_low': 30.0,
        'low': 50.0,
        'drop_delta': 25.0,  # sudden drop of 25+ percentage points
        'identical_days': 3,
    }

    def check_anomaly(self, project_id: int, att_date: date, percentage: float, att_type: str) -> dict:
        is_anomaly = False
        reason = None

        if percentage < self.THRESHOLDS['critical_low']:
            is_anomaly = True
            reason = f'Critical: Attendance {percentage:.1f}% below {self.THRESHOLDS["critical_low"]}%'
            return {'is_anomaly': is_anomaly, 'reason': reason}

        if percentage < self.THRESHOLDS['low']:
            is_anomaly = True
            reason = f'Low attendance: {percentage:.1f}% below threshold {self.THRESHOLDS["low"]}%'
            return {'is_anomaly': is_anomaly, 'reason': reason}

        # Sudden drop compared to previous day
        prev = Attendance.query.filter(
            Attendance.project_id == project_id,
            Attendance.attendance_type == att_type,
            Attendance.attendance_date < att_date
        ).order_by(Attendance.attendance_date.desc()).first()

        if prev:
            delta = prev.attendance_percentage - percentage
            if delta >= self.THRESHOLDS['drop_delta']:
                is_anomaly = True
                reason = f'Sudden drop: {prev.attendance_percentage:.1f}% → {percentage:.1f}% (Δ{delta:.1f}%)'
                return {'is_anomaly': is_anomaly, 'reason': reason}

        # Check for suspiciously identical values over recent days
        recent = Attendance.query.filter(
            Attendance.project_id == project_id,
            Attendance.attendance_type == att_type,
            Attendance.attendance_date < att_date
        ).order_by(Attendance.attendance_date.desc()).limit(self.THRESHOLDS['identical_days'] - 1).all()

        if len(recent) >= self.THRESHOLDS['identical_days'] - 1:
            all_same = all(r.attendance_percentage == percentage for r in recent)
            if all_same:
                is_anomaly = True
                reason = f'Repeated identical value {percentage:.1f}% for {self.THRESHOLDS["identical_days"]} days'
                return {'is_anomaly': is_anomaly, 'reason': reason}

        return {'is_anomaly': False, 'reason': None}

    def get_summary(self, project_id: int, days: int = 30) -> dict:
        end = date.today()
        start = end - timedelta(days=days)
        records = Attendance.query.filter(
            Attendance.project_id == project_id,
            Attendance.attendance_date.between(start, end)
        ).order_by(Attendance.attendance_date).all()

        if not records:
            return {'average': 0, 'trend': 'insufficient_data', 'anomaly_count': 0}

        pcts = [r.attendance_percentage for r in records]
        avg = sum(pcts) / len(pcts)
        anomaly_count = sum(1 for r in records if r.is_anomaly)

        if len(pcts) >= 7:
            first_half = sum(pcts[:len(pcts)//2]) / (len(pcts)//2)
            second_half = sum(pcts[len(pcts)//2:]) / len(pcts[len(pcts)//2:])
            trend = 'improving' if second_half > first_half + 5 else 'declining' if first_half > second_half + 5 else 'stable'
        else:
            trend = 'insufficient_data'

        return {
            'average': round(avg, 1),
            'min': min(pcts),
            'max': max(pcts),
            'trend': trend,
            'anomaly_count': anomaly_count,
            'total_records': len(records),
        }
