# Short Call Web — Management Board Proposal

**Version:** 1.0  
**Prepared for:** Board of Management  
**Prepared by:** Product & Operations Enablement Team  
**Date:** 2026-02-27

---

## 1) Executive Summary

Short Call Web is a lightweight operational platform to coordinate urgent, shift-based staffing calls across BC Place departments. It reduces coordination latency, increases transparency in staffing decisions, and introduces stronger governance over workforce allocation.

This proposal recommends moving from demo validation to a controlled production implementation with:

- secure authentication (SSO);
- MySQL-backed persistence and auditability;
- approval governance through the Schedule team;
- role-based controls for Employee, Manager, Schedule, and Admin.

---

## 2) Business Problem

Current short-call processes in high-variability operations can create:

- delayed staffing response;
- low visibility of candidate order and outcomes;
- inconsistent governance between departments;
- limited traceability for management review.

These gaps create avoidable overtime, missed coverage windows, and reduced confidence in fairness.

---

## 3) Proposed Solution

Short Call Web centralizes the full short-call workflow:

1. Manager/Admin submits a short-call request.
2. Schedule team approves/rejects request based on frequency and departmental balance.
3. Eligible employees apply.
4. Queue ranking is determined by application timestamp.
5. Status lifecycle is visible (`pending`, `confirmed`, `waitlisted`).

### Built-in Governance

- Department scope is explicit and fixed:
  - EVS, Security, Host, Conversion, Operations, Maintenance, Administration.
- Calls are not visible to employees until Schedule approval.
- All actions are role-gated.

---

## 4) Strategic Outcomes

### Operational outcomes

- Faster staffing response for event-driven demand spikes.
- Better fill rates for critical shifts.
- Reduced manual coordination overhead.

### Governance outcomes

- Transparent first-in queue logic.
- Controlled publishing and approval flow.
- Clear decision ownership for Schedule.

### Leadership outcomes

- Better reporting readiness for labour planning.
- Stronger confidence in equitable call handling.

---

## 5) Target Operating Model

| Role | Core responsibilities |
|---|---|
| Employee | View eligible calls, apply, track queue and status |
| Manager | Create short-call requests, monitor demand and candidates |
| Schedule | Approve/reject requests, control call frequency and balancing |
| Admin | Full governance oversight and cross-role administration |

---

## 6) Implementation Roadmap

### Phase 1 — Pilot (4–6 weeks)

- Single venue pilot with selected departments.
- Controlled user group and weekly governance review.
- KPI baselining and workflow tuning.

### Phase 2 — Production Foundation (6–8 weeks)

- MySQL persistence.
- SSO integration (Dayforce pathway).
- Audit trail and operational logs.

### Phase 3 — Scale & Optimization (8–12 weeks)

- Expanded department adoption.
- SLA dashboards and executive reporting.
- Policy automation for scheduling constraints.

---

## 7) KPI Framework

Recommended board-level KPI tracking:

- **Time to publish:** request creation → Schedule decision.
- **Time to fill:** publication → required seats filled.
- **Fill-rate:** seats filled / seats requested.
- **Queue fairness indicator:** order compliance by timestamp.
- **Exception rate:** rejected requests and causes.

---

## 8) Risk & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| User adoption variance | Medium | Role-based training and quick-reference playbooks |
| Policy inconsistency | High | Central governance via Schedule approval workflow |
| Data quality issues | Medium | Mandatory field validation and controlled taxonomy |
| Security/privacy concerns | High | SSO, RBAC, auditable persistence in production phase |

---

## 9) Investment Considerations

Expected investment categories:

- implementation (application hardening and integrations);
- change management and training;
- operational support and monitoring;
- security, compliance, and IAM alignment.

Detailed cost model can be submitted after pilot KPI baselining.

---

## 10) Board Decision Requested

Approval is requested for:

1. Pilot authorization with governance sponsorship.
2. Production-foundation budget envelope (DB + SSO + observability).
3. Executive KPI cadence in monthly operations review.

---

## Appendix A — Glossary

- **Short-call:** rapid staffing call for immediate/near-term shift demand.
- **Schedule gate:** mandatory approval step before publication.
- **Queue position:** rank derived from application timestamp.
- **Cross-department:** call open beyond the origin department.
