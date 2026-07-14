# DCC Periodic Review UAT Execution Checklist

## Before UAT
- [ ] Correct code baseline is deployed to the UAT environment (Version/Commit verified).
- [ ] Automated tests (Unit, Integration, E2E) passed on the deployment branch.
- [ ] Test users (UAT Personas 1-9) are provisioned and ready.
- [ ] Test data (PR-DATA-01 through 09) is seeded in the UAT database/store.
- [ ] Testers have access to required browsers/devices (Desktop, Tablet, Mobile).
- [ ] Known limitations are documented and communicated to the testing team.

## During UAT
- [ ] Tester records actual result for every executed test step.
- [ ] Screenshots or video evidence attached for every failed step or unexpected behavior.
- [ ] Defects are immediately logged and linked to the corresponding UAT test cases.
- [ ] Strict enforcement: NO production data is used during this cycle.
- [ ] Test data is reset between scenarios where required (e.g., DAR linkage retries).

## After UAT
- [ ] All failed cases have been retested after fixes are deployed.
- [ ] Regression tests rerun to ensure no unrelated DCC workflows were broken.
- [ ] Open defects reviewed and triaged (Medium defects must have an approved workaround or fix plan).
- [ ] UAT summary document prepared and circulated.
- [ ] Formal business approval recorded (Sign-offs obtained from QAQC, DCC, and Business Stakeholders).
