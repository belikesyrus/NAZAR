"""
Seed script: initializes DB and populates demo data.
Run: python seed.py
"""
import os, sys, random
from datetime import datetime, date, timedelta

os.environ.setdefault('FLASK_ENV', 'development')
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.database import db
from app.models.user import User
from app.models.project import Project
from app.models.inspection import Inspection, ChecklistResponse
from app.models.evidence import Evidence
from app.models.attendance import Attendance
from app.models.camera import Camera
from app.models.notification import Notification, Alert
from app.models.beneficiary import Beneficiary, Complaint, Meeting

app = create_app('development')

CHECKLIST_ITEMS = [
    ('project_functioning', 'Project is functioning normally'),
    ('staff_attendance', 'Staff attendance is satisfactory'),
    ('beneficiary_attendance', 'Beneficiary attendance is satisfactory'),
    ('infrastructure_condition', 'Infrastructure is in good condition'),
    ('records_maintained', 'Records are properly maintained'),
    ('scheme_guidelines_followed', 'Scheme guidelines are being followed'),
    ('services_delivered', 'Services are being delivered as planned'),
    ('cctv_operational', 'CCTV cameras are operational'),
    ('safety_requirements', 'Safety requirements are met'),
    ('documentation_available', 'Required documentation is available'),
]

with app.app_context():
    db.drop_all()
    db.create_all()
    print("Database tables created.")

    # ── Users ────────────────────────────────────────────────────────────────
    users_data = [
        {'name': 'Rajesh Kumar', 'email': 'admin@dosje.gov.in', 'password': 'Admin@123',
         'role': 'department_official', 'phone': '9811111111', 'state': 'Delhi', 'district': 'New Delhi',
         'designation': 'Joint Secretary', 'employee_id': 'EMP001'},
        {'name': 'Priya Sharma', 'email': 'officer@dosje.gov.in', 'password': 'Officer@123',
         'role': 'inspection_officer', 'phone': '9822222222', 'state': 'Maharashtra', 'district': 'Mumbai',
         'designation': 'Inspection Officer', 'employee_id': 'EMP002'},
        {'name': 'Amit Singh', 'email': 'officer2@dosje.gov.in', 'password': 'Officer@123',
         'role': 'inspection_officer', 'phone': '9833333333', 'state': 'Uttar Pradesh', 'district': 'Lucknow',
         'designation': 'Senior Inspector', 'employee_id': 'EMP003'},
        {'name': 'Sunita Devi', 'email': 'incharge@project.in', 'password': 'Incharge@123',
         'role': 'project_incharge', 'phone': '9844444444', 'state': 'Bihar', 'district': 'Patna',
         'designation': 'Project Director', 'employee_id': 'EMP004'},
        {'name': 'Ravi Verma', 'email': 'staff@ngo.org', 'password': 'Staff@123',
         'role': 'ngo_staff', 'phone': '9855555555', 'state': 'Rajasthan', 'district': 'Jaipur',
         'designation': 'Field Coordinator', 'employee_id': 'EMP005'},
        {'name': 'Meena Gupta', 'email': 'district@gov.in', 'password': 'District@123',
         'role': 'district_authority', 'phone': '9866666666', 'state': 'Madhya Pradesh', 'district': 'Bhopal',
         'designation': 'District Collector', 'employee_id': 'EMP006'},
        {'name': 'Anita Patel', 'email': 'beneficiary@example.com', 'password': 'Beneficiary@123',
         'role': 'beneficiary', 'phone': '9877777777', 'state': 'Gujarat', 'district': 'Ahmedabad'},
    ]

    created_users = {}
    for ud in users_data:
        u = User(
            name=ud['name'], email=ud['email'], role=ud['role'],
            phone=ud.get('phone'), state=ud.get('state'), district=ud.get('district'),
            designation=ud.get('designation'), employee_id=ud.get('employee_id'),
            is_active=True,
        )
        u.set_password(ud['password'])
        db.session.add(u)
        created_users[ud['role']] = u

    db.session.flush()
    print("Users created.")

    # ── Projects ─────────────────────────────────────────────────────────────
    projects_data = [
        {'name': 'Anganwadi Center – Patna East', 'org': 'Bihar Social Welfare Dept', 'type': 'institute',
         'scheme': 'ICDS', 'state': 'Bihar', 'district': 'Patna',
         'lat': 25.5941, 'lon': 85.1376, 'beneficiaries': 120, 'staff': 8, 'compliance': 78.5},
        {'name': 'Swadhar Greh Shelter – Mumbai', 'org': 'Maharashtra Women NGO', 'type': 'ngo',
         'scheme': 'Swadhar Greh', 'state': 'Maharashtra', 'district': 'Mumbai',
         'lat': 19.0760, 'lon': 72.8777, 'beneficiaries': 80, 'staff': 12, 'compliance': 62.0},
        {'name': 'Skill Development Center – Jaipur', 'org': 'Rajasthan Skill Institute', 'type': 'institute',
         'scheme': 'PMKVY', 'state': 'Rajasthan', 'district': 'Jaipur',
         'lat': 26.9124, 'lon': 75.7873, 'beneficiaries': 200, 'staff': 15, 'compliance': 91.0},
        {'name': 'Old Age Home – Bhopal', 'org': 'MP Senior Citizen Trust', 'type': 'ngo',
         'scheme': 'IGNOAPS', 'state': 'Madhya Pradesh', 'district': 'Bhopal',
         'lat': 23.2599, 'lon': 77.4126, 'beneficiaries': 60, 'staff': 10, 'compliance': 45.0},
        {'name': 'Creche Center – Ahmedabad', 'org': 'Gujarat Childcare Society', 'type': 'project',
         'scheme': 'National Creche Scheme', 'state': 'Gujarat', 'district': 'Ahmedabad',
         'lat': 23.0225, 'lon': 72.5714, 'beneficiaries': 95, 'staff': 6, 'compliance': 55.5},
        {'name': 'Women Helpline Center – Lucknow', 'org': 'UP Women Welfare Dept', 'type': 'institute',
         'scheme': 'OneStopCentre', 'state': 'Uttar Pradesh', 'district': 'Lucknow',
         'lat': 26.8467, 'lon': 80.9462, 'beneficiaries': 150, 'staff': 20, 'compliance': 84.0},
    ]

    created_projects = []
    incharge_user = created_users['project_incharge']
    for i, pd in enumerate(projects_data):
        p = Project(
            project_id=f'PRJ-2024-{str(i+1).zfill(4)}',
            name=pd['name'], organization_name=pd['org'],
            project_type=pd['type'], scheme=pd['scheme'],
            state=pd['state'], district=pd['district'],
            address=f'{pd["district"]}, {pd["state"]}',
            latitude=pd['lat'], longitude=pd['lon'],
            incharge_id=incharge_user.id,
            contact_name=incharge_user.name,
            contact_phone=incharge_user.phone,
            beneficiary_count=pd['beneficiaries'],
            staff_count=pd['staff'],
            status='active',
            compliance_score=pd['compliance'],
            registration_date=date(2023, random.randint(1, 12), random.randint(1, 28)),
            last_inspection_date=datetime.utcnow() - timedelta(days=random.randint(5, 100)),
        )
        db.session.add(p)
        created_projects.append(p)

    db.session.flush()
    print("Projects created.")

    # ── Cameras ──────────────────────────────────────────────────────────────
    for i, proj in enumerate(created_projects):
        for j in range(2):
            c = Camera(
                camera_id=f'CAM-{str(i+1).zfill(3)}-{j+1}',
                name=f'Camera {j+1} - {proj.name[:25]}',
                project_id=proj.id,
                location_description='Main entrance' if j == 0 else 'Hall',
                status='online' if random.random() > 0.2 else 'offline',
                camera_type=random.choice(['fixed', 'dome', 'ptz']),
                resolution='1080p',
                last_active=datetime.utcnow() - timedelta(minutes=random.randint(0, 60)),
                installation_date=date(2023, 6, 15),
            )
            db.session.add(c)

    db.session.flush()
    print("Cameras created.")

    # ── Beneficiaries ────────────────────────────────────────────────────────
    ben_names = ['Kavita Mishra', 'Pooja Yadav', 'Rekha Singh', 'Neha Tiwari', 'Sapna Kumari',
                 'Geeta Devi', 'Mamta Sharma', 'Lata Verma', 'Sunita Jha', 'Rita Patel']
    for proj in created_projects[:3]:
        for k, bname in enumerate(ben_names[:5]):
            b = Beneficiary(
                beneficiary_id=f'BEN-{proj.id}-{k+1}',
                name=bname,
                project_id=proj.id,
                age=random.randint(18, 65),
                gender='female',
                phone=f'98{random.randint(10000000, 99999999)}',
                service_status='active',
                enrollment_date=date(2023, random.randint(1, 12), random.randint(1, 28)),
            )
            db.session.add(b)

    db.session.flush()
    print("Beneficiaries created.")

    # ── Attendance records ───────────────────────────────────────────────────
    for proj in created_projects:
        for days_ago in range(30, 0, -1):
            for att_type in ('staff', 'beneficiary'):
                total = proj.staff_count if att_type == 'staff' else proj.beneficiary_count
                base_pct = random.uniform(55, 98)
                if days_ago <= 7 and random.random() < 0.1:
                    base_pct = random.uniform(20, 40)
                present = int(total * base_pct / 100)
                att = Attendance(
                    project_id=proj.id,
                    attendance_date=date.today() - timedelta(days=days_ago),
                    attendance_type=att_type,
                    total_count=total,
                    present_count=present,
                    absent_count=total - present,
                    attendance_percentage=round(present/total*100, 1) if total > 0 else 0,
                    recorded_by_id=incharge_user.id,
                )
                db.session.add(att)

    db.session.flush()
    print("Attendance records created.")

    # ── Inspections ──────────────────────────────────────────────────────────
    officer = created_users['inspection_officer']
    officer2 = created_users['inspection_officer']
    admin = created_users['department_official']

    statuses = ['approved', 'approved', 'submitted', 'in_progress', 'assigned', 'rejected']
    for i, proj in enumerate(created_projects):
        status = statuses[i % len(statuses)]
        ins = Inspection(
            inspection_number=f'INS-2024-{str(i+1).zfill(6)}',
            project_id=proj.id,
            assigned_officer_id=officer.id,
            created_by_id=admin.id,
            inspection_type=random.choice(['scheduled', 'surprise', 'random']),
            status=status,
            priority=random.choice(['medium', 'high', 'low']),
            scheduled_date=datetime.utcnow() - timedelta(days=random.randint(1, 60)),
            started_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)) if status != 'assigned' else None,
            submitted_at=datetime.utcnow() - timedelta(days=random.randint(1, 10)) if status in ('submitted','approved','rejected') else None,
            inspector_latitude=proj.latitude + random.uniform(-0.01, 0.01) if proj.latitude else None,
            inspector_longitude=proj.longitude + random.uniform(-0.01, 0.01) if proj.longitude else None,
            compliance_score=proj.compliance_score,
            observations='Facility was found operational. Staff present. Minor documentation issues noted.',
            recommendations='Improve record-keeping. Conduct beneficiary awareness session.',
            assignment_reason='Auto-assigned based on district proximity and workload.',
        )
        db.session.add(ins)
        db.session.flush()

        responses = ['yes', 'yes', 'yes', 'no', 'yes', 'yes', 'yes', 'not_applicable', 'yes', 'yes']
        for j, (key, label) in enumerate(CHECKLIST_ITEMS):
            cr = ChecklistResponse(
                inspection_id=ins.id,
                item_key=key, item_label=label,
                response=responses[j % len(responses)],
                remarks='Verified during visit.' if responses[j % len(responses)] == 'yes' else 'Issue identified.',
            )
            db.session.add(cr)

    db.session.flush()
    print("Inspections created.")

    # ── Alerts ───────────────────────────────────────────────────────────────
    alerts_data = [
        {'code': 'CCTV_OFFLINE', 'title': 'CCTV Camera Offline', 'severity': 'medium',
         'description': 'Camera CAM-004-1 at Old Age Home - Bhopal is offline since 6 hours.',
         'action': 'Check power and network connection at the facility.', 'proj': 3},
        {'code': 'ATTENDANCE_ANOMALY', 'title': 'Critically Low Attendance', 'severity': 'high',
         'description': 'Beneficiary attendance dropped to 22% at Old Age Home - Bhopal.',
         'action': 'Schedule surprise inspection immediately.', 'proj': 3},
        {'code': 'LOW_COMPLIANCE', 'title': 'Low Compliance Score', 'severity': 'high',
         'description': 'Old Age Home - Bhopal compliance score is 45% — below 50% threshold.',
         'action': 'Review last inspection report and initiate corrective action plan.', 'proj': 3},
        {'code': 'INSPECTION_OVERDUE', 'title': 'Inspection Overdue', 'severity': 'medium',
         'description': 'Creche Center - Ahmedabad has not been inspected in 90+ days.',
         'action': 'Assign inspection officer immediately.', 'proj': 4},
        {'code': 'UNUSUAL_REPORTING', 'title': 'Suspicious Attendance Pattern', 'severity': 'critical',
         'description': 'Attendance recorded as exactly 85% for 5 consecutive days at Swadhar Greh.',
         'action': 'Audit attendance records. Possible data fabrication.', 'proj': 1},
    ]

    for ad in alerts_data:
        proj_id = created_projects[ad['proj']].id if ad['proj'] < len(created_projects) else None
        a = Alert(
            alert_code=ad['code'], title=ad['title'],
            description=ad['description'], severity=ad['severity'],
            project_id=proj_id, status='open',
            recommended_action=ad['action'],
        )
        db.session.add(a)

    db.session.flush()
    print("Alerts created.")

    # ── Notifications ────────────────────────────────────────────────────────
    notifs = [
        (officer.id, 'New Inspection Assigned', 'You have been assigned inspection INS-2024-000003.', 'info'),
        (admin.id, 'Report Submitted', 'Inspection INS-2024-000001 has been submitted for review.', 'info'),
        (admin.id, 'Critical Alert', 'Suspicious attendance pattern detected at Swadhar Greh.', 'alert'),
        (incharge_user.id, 'Inspection Approved', 'Inspection INS-2024-000001 has been approved.', 'success'),
        (officer.id, 'Reminder', 'You have 2 pending inspections due this week.', 'warning'),
    ]
    for uid, title, msg, ntype in notifs:
        n = Notification(user_id=uid, title=title, message=msg, notification_type=ntype)
        db.session.add(n)

    # ── Complaints ───────────────────────────────────────────────────────────
    beneficiary_user = created_users['beneficiary']
    complaints_data = [
        ('Irregular Service Delivery', 'Services have not been provided for the last 2 weeks.', 'complaint', 'submitted'),
        ('Poor Infrastructure', 'The building has water leakage issues affecting services.', 'complaint', 'in_progress'),
        ('Positive Feedback', 'Staff is very helpful and services are delivered on time.', 'feedback', 'resolved'),
    ]
    for subj, desc, ctype, cstatus in complaints_data:
        c = Complaint(
            complaint_number=f'CMP-{random.randint(100000,999999)}',
            submitted_by_id=beneficiary_user.id,
            project_id=random.choice(created_projects).id,
            complaint_type=ctype,
            subject=subj, description=desc, status=cstatus, priority='medium',
        )
        db.session.add(c)

    db.session.commit()
    print("Notifications, complaints seeded.")
    print("\n✅ Database seeded successfully!")
    print("\nDemo Login Credentials:")
    print("  admin@dosje.gov.in     / Admin@123        (Department Official)")
    print("  officer@dosje.gov.in   / Officer@123      (Inspection Officer)")
    print("  incharge@project.in    / Incharge@123     (Project Incharge)")
    print("  staff@ngo.org          / Staff@123        (NGO Staff)")
    print("  district@gov.in        / District@123     (District Authority)")
    print("  beneficiary@example.com/ Beneficiary@123  (Beneficiary)")
