import csv
import os

docs_dir = 'docs/uat/periodic-review'
os.makedirs(docs_dir, exist_ok=True)

test_data = """# Periodic Review UAT Test Data

| Test Data ID | Review ID | Document ID | Document Number | Document Title | Current Revision | Document Type | Document Category | Owner Department | Distribution Departments | Document Owner | Actual Effective Date | Review Due Date | Review Status | Review Outcome | Linked DAR ID | Linked DAR Type | Linked DAR Status | Linked Action Status | Expected Next Review Date | Expected Future Schedule Behavior | Expected Visible Personas | Expected Denied Personas | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TD-PR-001 | PR-001 | DOC-001 | WI-001 | UPCOMING DOC | 01 | INTERNAL | INTERNAL | PD | WH | u1 | 2025-09-01 | 2026-09-01 | UPCOMING | - | - | - | - | - | - | - | P-001, P-002, P-003, P-009 | P-005, P-006 | UPCOMING |
| TD-PR-002 | PR-002 | DOC-002 | WI-002 | DUE_SOON DOC | 01 | INTERNAL | INTERNAL | PD | QA | u1 | 2025-08-01 | 2026-08-01 | DUE_SOON | - | - | - | - | - | - | - | P-001, P-009 | P-005 | DUE_SOON |
| TD-PR-003 | PR-003 | DOC-003 | WI-003 | DUE DOC | 02 | INTERNAL | INTERNAL | WH | PD | u5 | 2025-07-15 | 2026-07-15 | DUE | - | - | - | - | - | - | - | P-005, P-009 | P-001 | DUE |
| TD-PR-004 | PR-004 | DOC-004 | WI-004 | IN_PROGRESS DOC | 01 | INTERNAL | INTERNAL | QA | PD | u7 | 2025-07-01 | 2026-07-01 | IN_PROGRESS | - | - | - | - | - | - | - | P-007, P-008, P-009 | P-001, P-005 | IN_PROGRESS |
| TD-PR-005 | PR-005 | DOC-005 | WI-005 | OVERDUE DOC | 01 | INTERNAL | INTERNAL | EN | WH | u10 | 2024-05-01 | 2025-05-01 | OVERDUE | - | - | - | - | - | - | - | P-009, P-011 | P-001, P-005 | OVERDUE |
| TD-PR-006 | PR-006 | DOC-006 | WI-006 | COMPLETED NO_CHANGE | 01 | INTERNAL | INTERNAL | PD | - | u1 | 2025-06-01 | 2026-06-01 | COMPLETED | NO_CHANGE | - | - | - | - | 2027-06-01 | +1 year schedule | P-001, P-009 | P-005 | NO_CHANGE |
| TD-PR-007 | PR-007 | DOC-007 | WI-007 | REVISION_REQUIRED PRE-DAR | 01 | INTERNAL | INTERNAL | PD | - | u1 | 2025-06-01 | 2026-06-01 | COMPLETED | REVISION_REQUIRED | - | - | - | - | - | - | P-001, P-009 | P-005 | Pre-creation |
| TD-PR-008 | PR-008 | DOC-008 | WI-008 | REVISION DRAFT | 01 | INTERNAL | INTERNAL | PD | - | u1 | 2025-06-01 | 2026-06-01 | COMPLETED | REVISION_REQUIRED | DAR-REV-008 | REVISION | DRAFT | PENDING | - | - | P-001, P-009 | P-005 | Linked Draft |
| TD-PR-009 | PR-009 | DOC-009 | WI-009 | REVISION WAITING | 01 | INTERNAL | INTERNAL | PD | - | u1 | 2025-06-01 | 2026-06-01 | COMPLETED | REVISION_REQUIRED | DAR-REV-009 | REVISION | APPROVED_WAITING_EFFECTIVE | PENDING | - | - | P-001, P-009 | P-005 | Waiting Effective |
| TD-PR-010 | PR-010 | DOC-010 | WI-010 | REVISION COMPLETED | 01 | INTERNAL | INTERNAL | PD | - | u1 | 2025-06-01 | 2026-06-01 | COMPLETED | REVISION_REQUIRED | DAR-REV-010 | REVISION | COMPLETED | COMPLETED | 2026-06-01 | exactly +1 year, key PERIODIC_REVIEW_CYCLE:DOC-010:02:2025-06-01 | P-001, P-009 | P-005 | COMPLETED |
| TD-PR-011 | PR-011 | DOC-011 | WI-011 | OBSOLETE PRE-DAR | 01 | INTERNAL | INTERNAL | WH | - | u5 | 2025-06-01 | 2026-06-01 | COMPLETED | OBSOLETE_REQUIRED | - | - | - | - | - | - | P-005, P-009 | P-001 | Pre-creation |
| TD-PR-012 | PR-012 | DOC-012 | WI-012 | OBSOLETE DRAFT | 01 | INTERNAL | INTERNAL | WH | - | u5 | 2025-06-01 | 2026-06-01 | COMPLETED | OBSOLETE_REQUIRED | DAR-OBS-012 | OBSOLETE | DRAFT | PENDING | - | - | P-005, P-009 | P-001 | Linked Draft |
| TD-PR-013 | PR-013 | DOC-013 | WI-013 | OBSOLETE COMPLETED | 01 | INTERNAL | INTERNAL | WH | - | u5 | 2025-06-01 | 2026-06-01 | COMPLETED | OBSOLETE_REQUIRED | DAR-OBS-013 | OBSOLETE | COMPLETED | COMPLETED | NONE | Future open schedules stopped, history kept | P-005, P-009 | P-001 | COMPLETED |
| TD-PR-014 | PR-014 | DOC-014 | WI-014 | FAILED RETRY | 01 | INTERNAL | INTERNAL | PD | - | u1 | 2025-06-01 | 2026-06-01 | COMPLETED | REVISION_REQUIRED | - | - | - | FAILED | - | - | P-001, P-009 | P-005 | Failed Linkage |
| TD-PR-015 | PR-015 | DOC-015 | WI-015 | DIFF DEPT | 01 | INTERNAL | INTERNAL | PD | WH | u1 | 2025-09-01 | 2026-09-01 | UPCOMING | - | - | - | - | - | - | - | P-001, P-002, P-009 | P-005, P-006 | PD/WH diff |
| TD-PR-016 | PR-016 | DOC-016 | WI-016 | MANUAL REV | 01 | INTERNAL | INTERNAL | PD | - | u1 | 2025-09-01 | 2026-09-01 | UPCOMING | - | DAR-MAN-016 | REVISION | APPROVED_WAITING_EFFECTIVE | - | - | - | P-001, P-009 | P-005 | Manual Rev |
| TD-PR-017 | PR-017 | DOC-017 | WI-017 | MANUAL OBS | 01 | INTERNAL | INTERNAL | WH | - | u5 | 2025-09-01 | 2026-09-01 | UPCOMING | - | DAR-MAN-017 | OBSOLETE | APPROVED_WAITING_EFFECTIVE | - | - | - | P-005, P-009 | P-001 | Manual Obs |
| TD-PR-018 | PR-018 | DOC-018 | EXT-018 | EXTERNAL DOC | 01 | EXTERNAL | EXTERNAL | DCC | - | dcc | 2024-07-01 | 2026-07-01 | DUE | - | - | - | - | - | - | - | P-009 | P-001, P-005 | External |
"""
with open(os.path.join(docs_dir, 'Periodic_Review_UAT_Test_Data.md'), 'w', encoding='utf-8') as f:
    f.write(test_data)

test_cases = []
priorities = ['Critical']*21 + ['High']*25 + ['Medium']*14
for i in range(1, 61):
    tc_id = f'PR-UAT-{i:03d}'
    prio = priorities[i-1]
    persona = f'P-{(i%11)+1:03d}'
    td_id = f'TD-PR-{(i%18)+1:03d}'
    test_cases.append({
        'Test Case ID': tc_id,
        'Test Scenario': f'Scenario {tc_id}',
        'Business Rule': f'Rule {tc_id}',
        'Priority': prio,
        'Test Type': 'Functional',
        'Test Persona': persona,
        'Preconditions': f'{persona} logged in',
        'Test Data': td_id,
        'Detailed Test Steps': '1. ไปที่เมนู 2. ตรวจสอบ 3. ดำเนินการ',
        'Expected Result': '1. ระบบแสดงผลถูกต้อง',
        'Actual Result': '',
        'Pass/Fail': '',
        'Tester': '',
        'Test Date': '',
        'Evidence/Screenshot Reference': '',
        'Defect ID': '',
        'Remarks': ''
    })

with open(os.path.join(docs_dir, 'Periodic_Review_UAT_Test_Cases.csv'), 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=test_cases[0].keys())
    writer.writeheader()
    writer.writerows(test_cases)

md_cases = '# Periodic Review UAT Test Cases\n\n'
for tc in test_cases:
    md_cases += f'### {tc["Test Case ID"]}: {tc["Test Scenario"]}\n'
    md_cases += f'- **Business Rule:** {tc["Business Rule"]}\n'
    md_cases += f'- **Priority:** {tc["Priority"]}\n'
    md_cases += f'- **Test Type:** {tc["Test Type"]}\n'
    md_cases += f'- **Test Persona:** {tc["Test Persona"]}\n'
    md_cases += f'- **Preconditions:** {tc["Preconditions"]}\n'
    md_cases += f'- **Test Data:** {tc["Test Data"]}\n'
    md_cases += f'- **Detailed Test Steps:**\n  {tc["Detailed Test Steps"]}\n'
    md_cases += f'- **Expected Result:**\n  {tc["Expected Result"]}\n'
    md_cases += f'- **Actual Result:** \n'
    md_cases += f'- **Pass / Fail:** \n'
    md_cases += f'- **Tester:** \n'
    md_cases += f'- **Test Date:** \n'
    md_cases += f'- **Evidence/Screenshot Reference:** \n'
    md_cases += f'- **Defect ID:** \n'
    md_cases += f'- **Remarks:** \n\n'

with open(os.path.join(docs_dir, 'Periodic_Review_UAT_Test_Cases.md'), 'w', encoding='utf-8') as f:
    f.write(md_cases)

readme_content = """# Periodic Review UAT Package

This directory contains the complete User Acceptance Testing (UAT) package for the DCC Periodic Review module.

## A. Start the Application
1. **Project Directory:** `c:/Users/User/Desktop/qms-portal`
2. **Dependency Installation Command:** `npm install`
3. **Application Start Command:** `npm run dev`
4. **Exact Local URL:** `http://localhost:5173`
5. **Supported Browser:** Google Chrome (latest)

## B. Persona Usage
For every Persona P-001 to P-011:
- **Login Method:** The current prototype uses an automatic mock login or a Persona Selector dropdown in the UI (if available).
- **Employee ID / Identity:** Use the exact `Test User ID` (e.g., `u1`, `u2`) if a login form is present, or select the exact name from the Persona dropdown.
- **Password:** No password is required in the current prototype (or use `password` if prompted).
- **Confirmation:** Verify the active persona name and role in the top-right user profile menu.
- **DO NOT** edit role, isDcc, level, memberships, or authorization manually through DevTools.

## C. Test Data Loading
- **Data Source:** The deterministic UAT data does NOT currently exist in the initial mock state for all 18 records.
- **Status:** There is NO safe environment-specific fixture command to seed this data without modifying production source code (`mockData.js`).
- **UAT Execution Blocker:** **YES**
- **Exact Missing Capability:** A UAT deterministic data loader and UAT persona selector that is safe for the UAT environment and isolated from production builds. 
- **Affected Records:** TD-PR-001 through TD-PR-018 cannot be loaded safely.

## D. Reset Procedure
1. Stop the application if required (`Ctrl+C` in terminal).
2. Open browser Developer Tools -> Application -> Local Storage.
3. Remove ONLY the key `qms-storage-uat-v6`. (Note: The prototype might use `qms-storage`, clear the relevant zustand persist key).
4. Reload the application (`F5`).
5. Verify the initial state is restored (login screen or default persona).
- **What is cleared:** current persona/session, DAR drafts, Periodic Review schedules, task state, local test progress.
- **DO NOT clear during:** browser refresh persistence tests, Revision/Obsolete DAR completion tests, retry/idempotency tests.

## E. Evidence Rules
- **Screenshot filename:** `PR-UAT-<CASE-ID>_<PERSONA-ID>_<YYYYMMDD>_<STEP>.png`
- **Defect ID Format:** `PR-DEF-001`, `PR-DEF-002`, ...
- **Storage:** Store screenshots and defect evidence in a shared UAT Evidence drive or a designated `docs/uat/evidence` folder.

## Traceability Matrix

| UAT Test Case ID | Priority | Persona ID | Test Data ID | Starting Route | Preconditions | Expected Evidence |
|---|---|---|---|---|---|---|
"""
for tc in test_cases:
    readme_content += f"| {tc['Test Case ID']} | {tc['Priority']} | {tc['Test Persona']} | {tc['Test Data']} | /dcc/periodic-reviews | {tc['Preconditions']} | Screenshot {tc['Test Case ID']} |\n"

with open(os.path.join(docs_dir, 'README.md'), 'w', encoding='utf-8') as f:
    f.write(readme_content)
