# DCC Periodic Review UAT Personas

These test personas represent the required deterministic user states for User Acceptance Testing. Do not use hardcoded user-ID rules; permissions must be derived from `departmentMemberships`, `isDcc`, and `ownerDepartmentId`.

## Persona 1: Owner Department General User
- **User ID**: UAT-GEN-01
- **Role**: General User
- **isDcc**: false
- **Owner Department memberships**: PD (Level 1)
- **Owned Reviews/Documents**: None explicitly assigned, but belongs to PD.
- **Expected Visible Records**: Any Periodic Review where `ownerDepartmentId` is PD.
- **Expected Allowed Actions**: View list, view details.
- **Expected Denied Actions**: Cannot submit Periodic Review outcomes, cannot see other departments.

## Persona 2: Document Owner
- **User ID**: UAT-OWN-01
- **Role**: Document Owner / Asst. Supervisor
- **isDcc**: false
- **Owner Department memberships**: PD (Level 3)
- **Owned Reviews/Documents**: PD-SOP-001 (assigned owner)
- **Expected Visible Records**: All PD reviews.
- **Expected Allowed Actions**: Submit outcomes (NO_CHANGE, REVISION_REQUIRED, OBSOLETE_REQUIRED) for PD-SOP-001.
- **Expected Denied Actions**: Cannot submit outcomes for reviews they do not own unless they meet backup rules.

## Persona 3: Owner Department Supervisor
- **User ID**: UAT-SUP-01
- **Role**: Supervisor
- **isDcc**: false
- **Owner Department memberships**: PD (Level 4)
- **Owned Reviews/Documents**: None explicitly assigned.
- **Expected Visible Records**: All PD reviews.
- **Expected Allowed Actions**: Can perform backup review submission for any PD record if the document owner is unavailable.
- **Expected Denied Actions**: Cannot submit reviews for WH or QA.

## Persona 4: Owner Department Asst. Department Manager
- **User ID**: UAT-MGR-01
- **Role**: Asst. Department Manager
- **isDcc**: false
- **Owner Department memberships**: PD (Level 5)
- **Owned Reviews/Documents**: None.
- **Expected Visible Records**: All PD reviews.
- **Expected Allowed Actions**: Can perform backup review submission for any PD record.
- **Expected Denied Actions**: Cannot submit reviews for WH or QA.

## Persona 5: Unauthorized Other Department User
- **User ID**: UAT-OTH-01
- **Role**: General User
- **isDcc**: false
- **Owner Department memberships**: IT (Level 3)
- **Owned Reviews/Documents**: None.
- **Expected Visible Records**: Only IT reviews (if any exist). Cannot see PD, WH, or QA reviews.
- **Expected Allowed Actions**: None for PD/WH reviews.
- **Expected Denied Actions**: Zero visibility into other departments' metrics or rows.

## Persona 6: Distribution-Department-Only User
- **User ID**: UAT-DIST-01
- **Role**: Document Consumer
- **isDcc**: false
- **Owner Department memberships**: WH (Level 4)
- **Owned Reviews/Documents**: None. (WH is listed as a distribution department for PD-SOP-001)
- **Expected Visible Records**: Only WH reviews.
- **Expected Allowed Actions**: None for PD-SOP-001.
- **Expected Denied Actions**: Being on the distribution list does not grant Periodic Review visibility or action rights.

## Persona 7: Multi-Department User
- **User ID**: UAT-MULTI-01
- **Role**: Cross-functional Manager
- **isDcc**: false
- **Owner Department memberships**: PD (Level 1), WH (Level 4)
- **Owned Reviews/Documents**: None.
- **Expected Visible Records**: Both PD and WH reviews.
- **Expected Allowed Actions**: Can perform backup review for WH (since Level 4), but CANNOT perform backup review for PD (since Level 1).
- **Expected Denied Actions**: Cannot perform backup review for PD. Cannot see IT records.

## Persona 8: QAQC Monitoring User
- **User ID**: UAT-QA-01
- **Role**: QA Staff
- **isDcc**: false
- **Owner Department memberships**: QA (Level 3)
- **Additional Perms**: `canMonitorAllDepartments: true` (or equivalent QAQC role mapping)
- **Expected Visible Records**: All departments globally (ภาพรวมทุกแผนก).
- **Expected Allowed Actions**: View all, filter by department, export CSV. Can submit outcomes for QA documents.
- **Expected Denied Actions**: Cannot submit outcomes for PD or WH documents despite having global visibility.

## Persona 9: DCC Admin
- **User ID**: UAT-DCC-01
- **Role**: DCC Controller
- **isDcc**: true
- **Owner Department memberships**: DCC (Level 4)
- **Expected Visible Records**: All departments globally (ภาพรวมทุกแผนก).
- **Expected Allowed Actions**: View all, filter by department, export CSV. Can submit outcomes for DCC documents.
- **Expected Denied Actions**: Cannot submit outcomes for PD or WH documents.
