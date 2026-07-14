# DCC Periodic Review UAT Test Data

These deterministic records must be seeded in the store/database prior to UAT execution. The relative dates are calculated from `mockDateOffset: 0` (current real day).

## PR-DATA-01: Upcoming Review
- **Schedule ID**: SCH-001
- **Document Number**: PD-MN-001
- **Document Title**: Production Manual
- **Revision**: 01
- **ownerDepartmentId**: PD
- **Distribution Departments**: WH, QA
- **Document Owner**: UAT-OWN-01
- **Last Effective Date**: (Current Date - 300 days)
- **Review Due Date**: (Current Date + 65 days)
- **Status**: ACTION_REQUIRED
- **Outcome**: null
- **Linked DAR**: null
- **Expected Visibility**: PD Users, QAQC Monitors, DCC Admins.
- **Expected Due State**: UPCOMING

## PR-DATA-02: Due Soon Review (Boundary Test)
- **Schedule ID**: SCH-002
- **Document Number**: PD-WI-002
- **Document Title**: Assembly Work Instruction
- **Revision**: 02
- **ownerDepartmentId**: PD
- **Distribution Departments**: QA
- **Document Owner**: UAT-OWN-01
- **Last Effective Date**: (Current Date - 335 days)
- **Review Due Date**: (Current Date + 30 days)
- **Status**: ACTION_REQUIRED
- **Outcome**: null
- **Linked DAR**: null
- **Expected Visibility**: PD Users, QAQC Monitors, DCC Admins.
- **Expected Due State**: DUE_SOON

## PR-DATA-03: Due Today Review
- **Schedule ID**: SCH-003
- **Document Number**: PD-SOP-003
- **Document Title**: Machine Operation
- **Revision**: 00
- **ownerDepartmentId**: PD
- **Distribution Departments**: None
- **Document Owner**: UAT-OWN-01
- **Last Effective Date**: (Current Date - 365 days)
- **Review Due Date**: (Current Date)
- **Status**: ACTION_REQUIRED
- **Outcome**: null
- **Linked DAR**: null
- **Expected Visibility**: PD Users, QAQC Monitors, DCC Admins.
- **Expected Due State**: DUE

## PR-DATA-04: Overdue Review
- **Schedule ID**: SCH-004
- **Document Number**: WH-WI-001
- **Document Title**: Forklift Operation
- **Revision**: 01
- **ownerDepartmentId**: WH
- **Distribution Departments**: PD
- **Document Owner**: UAT-DIST-01
- **Last Effective Date**: (Current Date - 400 days)
- **Review Due Date**: (Current Date - 35 days)
- **Status**: ACTION_REQUIRED
- **Outcome**: null
- **Linked DAR**: null
- **Expected Visibility**: WH Users, QAQC Monitors, DCC Admins (NOT PD Users despite distribution).
- **Expected Due State**: OVERDUE

## PR-DATA-05: Completed - NO_CHANGE
- **Schedule ID**: SCH-005
- **Document Number**: PD-SOP-004
- **Document Title**: Cleaning Procedure
- **Revision**: 02
- **ownerDepartmentId**: PD
- **Distribution Departments**: QA
- **Document Owner**: UAT-OWN-01
- **Last Effective Date**: (Current Date - 370 days)
- **Review Due Date**: (Current Date - 5 days)
- **Status**: COMPLETED
- **Outcome**: NO_CHANGE
- **Linked DAR**: null
- **Expected Visibility**: PD, QAQC, DCC.

## PR-DATA-06: In Progress - Linked Revision DAR
- **Schedule ID**: SCH-006
- **Document Number**: IT-SOP-001
- **Document Title**: Network Security
- **Revision**: 03
- **ownerDepartmentId**: IT
- **Distribution Departments**: All
- **Document Owner**: UAT-OTH-01
- **Last Effective Date**: (Current Date - 380 days)
- **Review Due Date**: (Current Date - 15 days)
- **Status**: IN_PROGRESS
- **Outcome**: REVISION_REQUIRED
- **Linked DAR**: DAR-UAT-REV1 (Draft status)
- **Expected Visibility**: IT, QAQC, DCC.

## PR-DATA-07: In Progress - Linked Obsolete DAR
- **Schedule ID**: SCH-007
- **Document Number**: PD-FM-001
- **Document Title**: Old Inspection Form
- **Revision**: 05
- **ownerDepartmentId**: PD
- **Distribution Departments**: QA
- **Document Owner**: UAT-OWN-01
- **Last Effective Date**: (Current Date - 365 days)
- **Review Due Date**: (Current Date)
- **Status**: IN_PROGRESS
- **Outcome**: OBSOLETE_REQUIRED
- **Linked DAR**: DAR-UAT-OBS1 (Draft status)
- **Expected Visibility**: PD, QAQC, DCC.

## PR-DATA-08: Failed Linkage - Retry Available
- **Schedule ID**: SCH-008
- **Document Number**: PD-SOP-005
- **Document Title**: Material Handling
- **Revision**: 00
- **ownerDepartmentId**: PD
- **Distribution Departments**: WH
- **Document Owner**: UAT-OWN-01
- **Last Effective Date**: (Current Date - 365 days)
- **Review Due Date**: (Current Date)
- **Status**: IN_PROGRESS
- **Outcome**: REVISION_REQUIRED
- **linkageStatus**: FAILED
- **Linked DAR**: null
- **Expected Visibility**: PD, QAQC, DCC. Retry button should be visible to owner.

## PR-DATA-09: External Document Review
- **Schedule ID**: SCH-009
- **Document Number**: EXT-ISO-9001
- **Document Title**: ISO 9001:2015 Standard
- **Revision**: 2015
- **ownerDepartmentId**: QA
- **Distribution Departments**: All
- **Document Owner**: UAT-QA-01
- **Last Effective Date**: (Current Date - 365 days)
- **Review Due Date**: (Current Date)
- **Status**: ACTION_REQUIRED
- **Outcome**: null
- **Linked DAR**: null
- **Expected Visibility**: QA, QAQC, DCC.
