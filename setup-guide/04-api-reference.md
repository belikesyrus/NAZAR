# API Reference

Base URL: `http://localhost:5000/api`

All endpoints except `/auth/login` and `/auth/register` require:
```
Authorization: Bearer <jwt_token>
```

## Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | /auth/login | {email, password} | Returns JWT token |
| POST | /auth/register | {name,email,password,role,...} | Create account |
| GET | /auth/profile | — | Get own profile |
| PUT | /auth/profile | {name, phone, ...} | Update profile |
| POST | /auth/logout | — | Logout |

## Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /projects | List (filter: type, state, district, status, search) |
| POST | /projects | Create project |
| GET | /projects/:id | Get project |
| PUT | /projects/:id | Update project |
| DELETE | /projects/:id | Deactivate project |
| GET | /projects/stats | Count stats |

## Inspections

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /inspections | List (filter: status, type, project_id) |
| POST | /inspections | Create inspection |
| GET | /inspections/:id | Get with checklist + evidence |
| PUT | /inspections/:id | Update |
| POST | /inspections/:id/assign | Assign officer |
| POST | /inspections/:id/submit | Submit report with checklist |
| POST | /inspections/:id/approve | Approve |
| POST | /inspections/:id/reject | Reject |
| POST | /inspections/assign/auto | Auto-assign (rule-based) |
| GET | /inspections/checklist/template | Default checklist items |

## Evidence

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /evidence/upload | Upload file (multipart/form-data) |
| GET | /evidence/:inspection_id | Get files for inspection |
| GET | /evidence/file/:filename | Serve file |
| DELETE | /evidence/:id | Delete file |

## Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /attendance | List (filter: project_id, type, date range) |
| POST | /attendance | Add record |
| GET | /attendance/analytics | Trend + anomaly analysis |

## Cameras

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /cameras | List |
| POST | /cameras | Register |
| PUT | /cameras/:id | Update |
| DELETE | /cameras/:id | Deactivate |
| GET | /cameras/:id/status | Status check |
| GET | /cameras/stats | Online/offline counts |

## Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /analytics/dashboard | All KPIs |
| GET | /analytics/compliance | Compliance distribution |
| GET | /analytics/anomalies | Recent anomalies |
| GET | /analytics/inspection-trends | Daily trend |
| GET | /analytics/performance | State-wise performance |

## Notifications & Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notifications | User notifications |
| PUT | /notifications/:id/read | Mark read |
| PUT | /notifications/read-all | Mark all read |
| GET | /notifications/alerts | All alerts (filter: severity, status) |
| PUT | /notifications/alerts/:id/read | Mark alert read |
| PUT | /notifications/alerts/:id/resolve | Resolve alert |
| GET | /notifications/alerts/stats | Count by severity |

## Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /reports | Submitted reports |
| GET | /reports/:id | Full report with checklist |
| PUT | /reports/:id/approve | Approve |
| PUT | /reports/:id/reject | Reject |

## Beneficiaries & Complaints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /beneficiaries | List |
| POST | /beneficiaries | Add |
| GET | /beneficiaries/:id | Get |
| GET | /beneficiaries/complaints | List complaints |
| POST | /beneficiaries/complaints | Submit |
| PUT | /beneficiaries/complaints/:id | Update status/response |
| GET | /beneficiaries/meetings | List VC meetings |
| POST | /beneficiaries/meetings | Create meeting |
| POST | /beneficiaries/meetings/:id/start | Start |
| POST | /beneficiaries/meetings/:id/end | End |

## Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users | List (admin only) |
| GET | /users/:id | Get user |
| PUT | /users/:id | Update role/status (admin) |
| GET | /users/officers | List inspection officers |
| GET | /users/stats | Count by role |
