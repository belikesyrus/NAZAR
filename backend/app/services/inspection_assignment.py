"""
Inspection Assignment Service
Rule-based automated assignment with randomization.
Replace the core logic with an ML model by overriding `score_officer()`.
"""
import random
from datetime import datetime, timedelta
from app.database import db
from app.models.user import User
from app.models.project import Project
from app.models.inspection import Inspection


class InspectionAssignmentService:

    def assign(self, project_id: int) -> dict:
        project = Project.query.get(project_id)
        if not project:
            return {'success': False, 'error': 'Project not found'}

        officers = User.query.filter_by(role='inspection_officer', is_active=True).all()
        if not officers:
            return {'success': False, 'error': 'No active inspection officers available'}

        scored = []
        for officer in officers:
            score, reason = self.score_officer(officer, project)
            scored.append({'officer': officer, 'score': score, 'reason': reason})

        # Filter out conflict of interest (same officer inspected this project in last 30 days)
        cutoff = datetime.utcnow() - timedelta(days=30)
        eligible = []
        for entry in scored:
            recent = Inspection.query.filter(
                Inspection.assigned_officer_id == entry['officer'].id,
                Inspection.project_id == project_id,
                Inspection.created_at >= cutoff
            ).first()
            if not recent:
                eligible.append(entry)

        if not eligible:
            eligible = scored  # Fallback if all officers inspected recently

        # Weighted random selection (higher score = higher chance)
        total = sum(max(e['score'], 0.1) for e in eligible)
        pick = random.uniform(0, total)
        cumulative = 0
        selected = eligible[0]
        for entry in eligible:
            cumulative += max(entry['score'], 0.1)
            if cumulative >= pick:
                selected = entry
                break

        return {
            'success': True,
            'officer_id': selected['officer'].id,
            'officer_name': selected['officer'].name,
            'score': selected['score'],
            'reason': selected['reason'],
        }

    def score_officer(self, officer: User, project: Project) -> tuple:
        score = 100.0
        reasons = []

        # Workload factor: fewer active assignments = higher score
        active_count = Inspection.query.filter(
            Inspection.assigned_officer_id == officer.id,
            Inspection.status.in_(['assigned', 'accepted', 'in_progress'])
        ).count()
        workload_penalty = active_count * 15
        score -= workload_penalty
        if active_count > 0:
            reasons.append(f'Active workload: {active_count} inspections')

        # District match: same district = higher score
        if officer.district and project.district and officer.district == project.district:
            score += 20
            reasons.append('Same district (+20)')
        elif officer.state and project.state and officer.state == project.state:
            score += 10
            reasons.append('Same state (+10)')

        # Experience: count total completed inspections
        completed = Inspection.query.filter(
            Inspection.assigned_officer_id == officer.id,
            Inspection.status == 'approved'
        ).count()
        score += min(completed * 2, 20)
        if completed > 0:
            reasons.append(f'Experience: {completed} completed inspections (+{min(completed*2,20)})')

        # Diversity: penalize if officer inspected this project before (beyond 30-day window)
        prev = Inspection.query.filter_by(
            assigned_officer_id=officer.id, project_id=project.id
        ).count()
        if prev > 0:
            score -= min(prev * 5, 25)
            reasons.append(f'Previous {prev} inspections at this project (−{min(prev*5,25)})')

        reason_str = '; '.join(reasons) if reasons else 'Default assignment'
        return round(score, 2), reason_str
