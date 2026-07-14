# DCC Periodic Review UAT Test Cases

## PR-UAT-001: Owner Department user sees only permitted review records
- **Test Scenario**: Standard Owner Department visibility.
- **Business Rule**: A Periodic Review record must be visible only to users belonging to the document's Owner Department (or QAQC/DCC).
- **Persona**: UAT-GEN-01 (PD)
- **Preconditions**: Seed PR-DATA-01 through PR-DATA-09.
- **Test Steps**:
  1. Login as UAT-GEN-01.
  2. Navigate to `การทบทวนเอกสาร` (Periodic Review Dashboard).
  3. Observe the Control Board and Review List.
- **Expected Result**:
  - Only PD records (PR-DATA-01, 02, 03, 05, 07, 08) are visible.
  - WH (PR-DATA-04), IT (PR-DATA-06), and QA (PR-DATA-09) records are completely hidden from rows, counts, and exports.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-002: Unrelated department cannot see rows, counts, or detail
- **Test Scenario**: Cross-department data isolation.
- **Business Rule**: Users from unrelated departments must not see any metadata, rows, or counts of other departments.
- **Persona**: UAT-OTH-01 (IT)
- **Preconditions**: Seed PR-DATA-01 through PR-DATA-09.
- **Test Steps**:
  1. Login as UAT-OTH-01.
  2. Navigate to Periodic Review Dashboard.
  3. Observe the UI.
- **Expected Result**:
  - User sees only IT records (PR-DATA-06).
  - Control board counts do not include PD or WH records.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-003: Distribution Department does not gain access
- **Test Scenario**: Distribution list vs Owner department isolation.
- **Business Rule**: Periodic Review visibility requires Owner Department membership. Distribution list membership does not grant access.
- **Persona**: UAT-DIST-01 (WH)
- **Preconditions**: Seed PR-DATA-01 (owned by PD, distributed to WH).
- **Test Steps**:
  1. Login as UAT-DIST-01.
  2. Navigate to Periodic Review Dashboard.
- **Expected Result**:
  - PR-DATA-01 (PD-MN-001) is not visible in the list or counts.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-004: Unauthorized direct URL shows Thai Access Denied
- **Test Scenario**: Direct URL authorization enforcement.
- **Business Rule**: Direct URL access to an unauthorized record must be blocked without leaking metadata.
- **Persona**: UAT-OTH-01 (IT)
- **Preconditions**: Known Schedule ID for a PD document (SCH-003).
- **Test Steps**:
  1. Login as UAT-OTH-01.
  2. Type the direct URL to `/dcc/periodic-reviews/SCH-003` in the browser.
- **Expected Result**:
  - The page displays "คุณไม่มีสิทธิ์เข้าถึงข้อมูลการทบทวนเอกสารนี้".
  - Document Title, Revision, and Due Date are NOT leaked on the screen.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-005: Document Owner submits NO_CHANGE successfully
- **Test Scenario**: Standard successful workflow for NO_CHANGE.
- **Business Rule**: Document owner can declare no changes needed.
- **Persona**: UAT-OWN-01 (PD)
- **Preconditions**: SCH-003 is DUE.
- **Test Steps**:
  1. Login as UAT-OWN-01.
  2. Open SCH-003.
  3. Select "ไม่มีการแก้ไข (No Change)".
  4. Submit.
- **Expected Result**:
  - Status changes to COMPLETED.
  - No DAR is created.
  - Success toast appears.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-006: Owner Department Supervisor performs backup review
- **Test Scenario**: Department Backup authority.
- **Business Rule**: Users with Level 4+ in the Owner Department can submit outcomes if the owner is unavailable.
- **Persona**: UAT-SUP-01 (PD Level 4)
- **Preconditions**: SCH-003 is owned by UAT-OWN-01.
- **Test Steps**:
  1. Login as UAT-SUP-01.
  2. Open SCH-003.
  3. Ensure the action buttons are enabled.
  4. Submit an outcome.
- **Expected Result**:
  - The system accepts the submission.
  - Action is logged under UAT-SUP-01's name.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-007: Insufficient department-specific position cannot submit
- **Test Scenario**: Strict authority enforcement.
- **Business Rule**: General users cannot submit on behalf of others.
- **Persona**: UAT-GEN-01 (PD Level 1)
- **Preconditions**: SCH-003 is owned by UAT-OWN-01.
- **Test Steps**:
  1. Login as UAT-GEN-01.
  2. Open SCH-003.
- **Expected Result**:
  - The user can view the details.
  - The action form (Outcome selection and Submit button) is hidden or disabled.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-008: Multi-department user receives correct visibility and action authority
- **Test Scenario**: Multi-department resolution.
- **Business Rule**: A user must have their position level evaluated per department.
- **Persona**: UAT-MULTI-01 (PD Level 1, WH Level 4)
- **Preconditions**: Seed PR-DATA-03 (PD) and PR-DATA-04 (WH).
- **Test Steps**:
  1. Login as UAT-MULTI-01.
  2. Open PR-DATA-03 (PD). Confirm action buttons are disabled (Level 1).
  3. Open PR-DATA-04 (WH). Confirm action buttons are enabled (Level 4 backup).
- **Expected Result**:
  - Visibility and authority precisely match the department membership levels.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-009: QAQC Monitoring defaults to all-department Control Board
- **Test Scenario**: QAQC Default View.
- **Business Rule**: QAQC / DCC monitoring users see the global view by default.
- **Persona**: UAT-QA-01 (QA)
- **Preconditions**: None.
- **Test Steps**:
  1. Login as UAT-QA-01.
  2. Navigate to Periodic Review.
- **Expected Result**:
  - The view defaults to "ภาพรวมทุกแผนก".
  - Control board aggregates across all departments.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-010: QAQC can filter and drill down by department
- **Test Scenario**: QAQC Filtering.
- **Business Rule**: Global monitors must be able to isolate specific departments.
- **Persona**: UAT-QA-01 (QA)
- **Preconditions**: Seed all test data.
- **Test Steps**:
  1. Login as UAT-QA-01.
  2. On the "ภาพรวมทุกแผนก" tab, use the Department filter dropdown.
  3. Select "PD".
- **Expected Result**:
  - Only PD records remain in the list.
  - Control board counts update to reflect only PD records.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-011: QAQC monitoring access cannot edit another department's review
- **Test Scenario**: Read-only global monitoring.
- **Business Rule**: Global visibility does not grant global write authority.
- **Persona**: UAT-QA-01 (QA)
- **Preconditions**: Seed PR-DATA-03 (PD).
- **Test Steps**:
  1. Login as UAT-QA-01.
  2. Open PR-DATA-03 (PD).
- **Expected Result**:
  - The user can view the details.
  - The action form (Outcome selection and Submit button) is hidden or disabled.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-012: DCC Admin can monitor all departments
- **Test Scenario**: DCC global monitoring.
- **Business Rule**: DCC Admin has equivalent global read-only monitoring rights as QAQC.
- **Persona**: UAT-DCC-01
- **Preconditions**: Seed all test data.
- **Test Steps**:
  1. Login as UAT-DCC-01.
  2. Navigate to Periodic Review.
- **Expected Result**:
  - Sees "ภาพรวมทุกแผนก" tab.
  - Can view all records, but cannot submit on behalf of PD or WH.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-013: DUE_SOON calculation uses the 30-day boundary
- **Test Scenario**: Due Soon validation.
- **Business Rule**: 1 to 30 days remaining = DUE_SOON.
- **Persona**: UAT-OWN-01
- **Preconditions**: PR-DATA-02 is exactly 30 days out.
- **Test Steps**:
  1. Login as UAT-OWN-01.
  2. Locate PR-DATA-02.
- **Expected Result**:
  - The status is indicated as "ใกล้ถึงกำหนด (Due Soon)" (yellow/warning styling).
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-014: Due today displays DUE
- **Test Scenario**: Due Today validation.
- **Business Rule**: 0 days remaining = DUE.
- **Persona**: UAT-OWN-01
- **Preconditions**: PR-DATA-03 is due today.
- **Test Steps**:
  1. Locate PR-DATA-03.
- **Expected Result**:
  - The status is indicated as "ถึงกำหนด (Due)" (orange/red styling).
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-015: Past due displays OVERDUE
- **Test Scenario**: Overdue validation.
- **Business Rule**: < 0 days remaining = OVERDUE.
- **Persona**: UAT-DIST-01 (Testing as WH owner for PR-DATA-04).
- **Preconditions**: PR-DATA-04 is past due.
- **Test Steps**:
  1. Login as UAT-DIST-01.
  2. Locate PR-DATA-04.
- **Expected Result**:
  - The status is indicated as "เลยกำหนด (Overdue)" (red styling).
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-016: REVISION_REQUIRED creates one Revision DAR draft only
- **Test Scenario**: DAR Linkage for Revision.
- **Business Rule**: Requires a DAR Draft creation of type REVISION.
- **Persona**: UAT-OWN-01
- **Preconditions**: PR-DATA-01 is UPCOMING.
- **Test Steps**:
  1. Login as UAT-OWN-01.
  2. Open PR-DATA-01.
  3. Select "ขอแก้ไข (Revision)".
  4. Submit.
  5. Go to DAR Drafts.
- **Expected Result**:
  - Schedule status is IN_PROGRESS.
  - Exactly one DAR draft is created for PD-MN-001.
  - DAR Type is "แก้ไขเอกสาร".
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-017: OBSOLETE_REQUIRED creates one Obsolete DAR draft only
- **Test Scenario**: DAR Linkage for Obsolete.
- **Business Rule**: Requires a DAR Draft creation of type OBSOLETE.
- **Persona**: UAT-OWN-01
- **Preconditions**: PR-DATA-02.
- **Test Steps**:
  1. Login as UAT-OWN-01.
  2. Open PR-DATA-02.
  3. Select "ขอยกเลิก (Obsolete)".
  4. Submit.
  5. Go to DAR Drafts.
- **Expected Result**:
  - Schedule status is IN_PROGRESS.
  - Exactly one DAR draft is created for PD-WI-002.
  - DAR Type is "ยกเลิกเอกสาร".
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-018: Selecting an outcome does not create DAR before submission
- **Test Scenario**: UI interaction isolation.
- **Business Rule**: Merely clicking a radio button must not trigger a backend DAR creation.
- **Persona**: UAT-OWN-01
- **Preconditions**: PR-DATA-03.
- **Test Steps**:
  1. Login as UAT-OWN-01.
  2. Open PR-DATA-03.
  3. Click "ขอแก้ไข (Revision)".
  4. Navigate away from the page without clicking Submit.
- **Expected Result**:
  - No DAR draft is created in the system.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-019: Repeated submission does not create duplicate DAR
- **Test Scenario**: Idempotency validation.
- **Business Rule**: Double-clicks or repeated submissions with the same idempotency key must not spawn duplicates.
- **Persona**: UAT-OWN-01
- **Preconditions**: PR-DATA-03.
- **Test Steps**:
  1. Login as UAT-OWN-01.
  2. Open PR-DATA-03.
  3. Select "ขอแก้ไข".
  4. Click Submit rapidly 3 times (or attempt to submit again if UI allows).
- **Expected Result**:
  - Only ONE DAR draft is created.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-020: DAR linkage failure displays retry action and does not duplicate DAR
- **Test Scenario**: Graceful degradation and retry.
- **Business Rule**: If DAR creation fails, the UI must allow retry without creating duplicate DARs.
- **Persona**: UAT-OWN-01
- **Preconditions**: Seed PR-DATA-08 (Failed linkage).
- **Test Steps**:
  1. Login as UAT-OWN-01.
  2. Open PR-DATA-08.
  3. Observe the "Retry DAR Creation" (or equivalent) button.
  4. Click Retry.
- **Expected Result**:
  - The DAR creation succeeds.
  - Status updates to IN_PROGRESS.
  - Only one DAR is generated.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-021: CSV export contains only currently filtered and permitted records
- **Test Scenario**: Export data leakage prevention.
- **Business Rule**: CSV must strictly match the on-screen filtered dataset.
- **Persona**: UAT-QA-01
- **Preconditions**: QA views "ภาพรวมทุกแผนก".
- **Test Steps**:
  1. Login as UAT-QA-01.
  2. Filter list to show only Status = ACTION_REQUIRED.
  3. Click Export CSV.
  4. Open the CSV file.
- **Expected Result**:
  - The CSV contains only ACTION_REQUIRED records.
  - No COMPLETED records are present.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-022: CSV preserves Thai characters
- **Test Scenario**: Localization support.
- **Business Rule**: Exported CSV must use UTF-8 with BOM to open correctly in Excel.
- **Persona**: UAT-GEN-01
- **Preconditions**: Records with Thai titles exist.
- **Test Steps**:
  1. Export CSV.
  2. Open in Microsoft Excel (default settings).
- **Expected Result**:
  - Thai characters (e.g., การทบทวน, ฝ่ายผลิต) render perfectly without mojibake.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-023: Desktop layout is usable
- **Test Scenario**: 1920x1080 standard desktop usability.
- **Business Rule**: The interface must not break on desktop monitors.
- **Persona**: UAT-GEN-01
- **Preconditions**: None.
- **Test Steps**:
  1. Open Dashboard and Detail page on Desktop.
- **Expected Result**:
  - Cards align horizontally.
  - Data table fits the screen width.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-024: Tablet layout is usable
- **Test Scenario**: iPad/Tablet landscape usability.
- **Business Rule**: The interface must adapt cleanly to tablet sizes (e.g., 1024x768).
- **Persona**: UAT-GEN-01
- **Preconditions**: None.
- **Test Steps**:
  1. Open Dashboard and Detail page on Tablet simulator.
- **Expected Result**:
  - Side navigation minimizes or becomes a drawer.
  - Table scrolling is functional.
- **Actual Result**: 
- **Pass / Fail**: 

## PR-UAT-025: Mobile layout is usable without horizontal overflow
- **Test Scenario**: iPhone/Mobile portrait usability.
- **Business Rule**: The interface must adapt cleanly to mobile sizes (e.g., 375x812).
- **Persona**: UAT-GEN-01
- **Preconditions**: None.
- **Test Steps**:
  1. Open Dashboard and Detail page on Mobile simulator.
- **Expected Result**:
  - Control board cards stack vertically (1 per row).
  - No broken horizontal scrolling.
  - Detail page action buttons span 100% width.
- **Actual Result**: 
- **Pass / Fail**: 
