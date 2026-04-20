# Live Demo Scenario - Sprint 05

## Accounts
- Admin: admin.demo@municipalite.tn / password
- Agent 1: agent1.demo@municipalite.tn / password
- Agent 2: agent2.demo@municipalite.tn / password
- Citizen 1: citizen1.demo@municipalite.tn / password

## Scripted Flow (Defense)
1. Login as Citizen and open Submit Complaint.
2. Fill title, category, description, capture location, attach photo, submit.
3. Login as Administrator and open dashboard/map.
4. Show the new complaint in the table and on map.
5. Assign complaint to a municipal agent.
6. Login as Agent, open assigned tasks.
7. Move complaint to IN_PROGRESS, upload resolution evidence, mark as RESOLVED.
8. Login back as Citizen and open My Complaints.
9. Verify resolved complaint and submit rating feedback.

## Timing Target
- End-to-end walkthrough: 7-10 minutes.
- Questions buffer: 5-10 minutes.

## Rehearsal Command
Run from backend directory:

REHEARSALS=3 ./scripts/rehearse_demo.sh

Success criterion:
- All rehearsals print [PASS]
- Final line contains [DONE]
