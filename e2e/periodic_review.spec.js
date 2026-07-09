import { test, expect } from '@playwright/test';

test.describe('Periodic Review Workflow E2E (Visual / Headed Mode)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Automatically accept any window.confirm or alerts
    page.on('dialog', dialog => dialog.accept());

    // Navigate to the dashboard to initialize useStore state and periodic reviews
    await page.goto('/');
    await expect(page).toHaveTitle(/qms-portal/i);
    // Ensure the default user is U002 (Production Supervisor)
    // The sidebar user switcher is hidden until hover
    await page.locator('nav').first().hover(); // Hover over sidebar to expand
    const userSelect = page.locator('select.input-ios').first();
    await userSelect.waitFor({ state: 'visible' });
    await userSelect.selectOption('U002');
  });

  test('Scenario 1: The "No Change" Flow (SOP-PD-001)', async ({ page }) => {
    test.setTimeout(45000); // Give enough time for headed visual observation

    // 1. Go to "My Review Tasks"
    await page.click('text=การทบทวนเอกสารตามรอบ');
    await page.click('text=งานของฉัน');
    
    // 2. Open the document that is Due Soon (SOP-PD-001)
    await expect(page.locator('text=SOP-PD-001')).toBeVisible();
    await page.click('text=SOP-PD-001');

    // 3. Bot answers Checklist with "No Change"
    await expect(page.locator('text=รายการตรวจสอบ (Checklist)')).toBeVisible();
    
    // Check all checkboxes (3 for internal docs)
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const cb of checkboxes) {
      await cb.check();
      await page.waitForTimeout(500); // Visual pause
    }

    // 4. Select Outcome and type Comment
    await page.selectOption('select', 'INTERNAL_NO_CHANGE');
    await page.waitForTimeout(500);
    await page.fill('textarea', 'ตรวจสอบแล้ว กระบวนการยังคงเดิม');
    await page.waitForTimeout(1000); // Visual pause to see the typed comment

    // 5. Submit and verify Completed status
    await page.click('button:has-text("บันทึกผลการทบทวน")');
    
    // Verify toast success to ensure state is committed
    await expect(page.locator('text=บันทึกผลการทบทวนเรียบร้อยแล้ว')).toBeVisible();
    
    // Verify redirect to My Tasks and task is gone or verify status in schedule
    await page.waitForURL(/\/periodic-reviews\/my-tasks/);
    
    await page.goto('/periodic-reviews/schedule');
    const row = page.locator('tr', { hasText: 'SOP-PD-001' }).first();
    await expect(row).toContainText('ยังไม่ถึงกำหนด');
  });

  test('Scenario 2: The "Revision Required" Flow (DAR Linkage) (WI-PD-015)', async ({ page }) => {
    test.setTimeout(45000);

    // 1. Go to "My Review Tasks"
    await page.goto('/periodic-reviews/my-tasks');
    
    // 2. Open the overdue document (WI-PD-015)
    await expect(page.locator('text=WI-PD-015')).toBeVisible();
    await page.click('text=WI-PD-015');

    // 3. Bot answers Checklist (maybe leave one unchecked or check all, it doesn't strictly matter for the outcome as long as user confirms the alert, but let's check all for safety)
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const cb of checkboxes) {
      await cb.check();
      await page.waitForTimeout(300);
    }

    // 4. Select Outcome: Revision Required
    await page.selectOption('select', 'INTERNAL_REVISION_REQUIRED');
    await page.waitForTimeout(500);
    await page.fill('textarea', 'พบว่าขั้นตอนการล้างเปลี่ยนแปลงไป ต้องแก้เอกสารใหม่');
    await page.waitForTimeout(1000);

    // 5. Submit and verify Redirect to DAR Revision Form
    await page.click('button:has-text("บันทึกผลการทบทวน")');
    await expect(page.locator('text=บันทึกผลการทบทวนเรียบร้อยแล้ว')).toBeVisible();
    
    // Verify toast success
    await expect(page.locator('text=บันทึกผลการทบทวนเรียบร้อยแล้ว')).toBeVisible();

    // 6. Verify we are on the Revision DAR page and the doc is pre-filled
    await expect(page).toHaveURL(/\/dar\/new\/revision/);
    await expect(page.locator('h2', { hasText: 'ยื่นคำขอแก้ไขเอกสาร (Revision DAR)' })).toBeVisible();
    
    // Verify pre-filled document by checking if the dropdown or search result shows WI-PD-015
    // In our UI, the selected document is rendered in a div or input
    await expect(page.locator('body')).toContainText('WI-PD-015');
    await page.waitForTimeout(2000); // Visual pause to see the prefilled form
  });

  test('Scenario 3: The DCC Dashboard View', async ({ page }) => {
    test.setTimeout(30000);

    // 1. Switch to DCC Admin (U001)
    await page.locator('nav').first().hover();
    const userSelect = page.locator('select.input-ios').first();
    await userSelect.waitFor({ state: 'visible' });
    await userSelect.selectOption('U001'); // Admin QA (DCC)
    await page.waitForTimeout(1000);

    // 2. Go to Review Dashboard
    await page.goto('/periodic-reviews');
    await expect(page.locator('h1:has-text("Periodic Review Dashboard")')).toBeVisible();

    // 3. Check KPI Cards
    // DCC should see the Escalated/Overdue WI-PD-015
    // and Due Soon SOP-PD-001 (if not run after scenario 1, but Playwright tests are isolated)
    
    // Ensure the Overdue card shows at least 1
    const overdueP = page.locator('p', { hasText: 'เกินกำหนด (Overdue)' }).first();
    // In isolated mode, there are 3 overdue tasks with the new mock data
    await expect(overdueP.locator('..').locator('h3')).toHaveText('3');
    
    const internalP = page.locator('p', { hasText: 'เอกสารภายในทั้งหมด' }).first();
    await expect(internalP.locator('..').locator('h3')).toHaveText('4'); // 4 Internal documents

    await page.waitForTimeout(2000); // Visual pause for the user to see the dashboard
  });

  test('Scenario 4: External Document - New Version Detected', async ({ page }) => {
    // 0. Switch to U001 (Owner of FSSC 22000)
    await page.locator('nav').first().hover();
    const userSelect = page.locator('select.input-ios').first();
    await userSelect.waitFor({ state: 'visible' });
    await userSelect.selectOption('U001');

    // 1. Go to My Tasks
    await page.goto('/periodic-reviews/my-tasks');
    // 2. Open the external document (FSSC 22000)
    await expect(page.locator('text=FSSC 22000 Version 6.0 Guidelines')).toBeVisible();
    await page.click('text=FSSC 22000 Version 6.0 Guidelines');
    
    // 3. Bot answers Checklist (c4 only, leave c5 unchecked)
    await page.locator('label', { hasText: 'เอกสารนี้ยังมีการใช้งานในแผนก/บริษัทอยู่' }).click();
    await page.waitForTimeout(500);
    
    // 4. Select Outcome
    await page.selectOption('select', 'EXTERNAL_NEW_VERSION');
    
    // 5. Fill Comment
    await page.fill('textarea', 'พบประกาศอัปเดตเป็น Version 6.1');
    
    // 6. Submit
    await page.click('button:has-text("บันทึกผลการทบทวน")');
    
    // Accept dialog will happen automatically due to beforeEach hook
    
    // 7. Verify toast success
    await expect(page.locator('text=บันทึกผลการทบทวนเรียบร้อยแล้ว')).toBeVisible();
    
    // 8. Verify redirect to /external-docs
    await page.waitForURL(/\/external-docs/);
    
    // 9. Verify schedule status in master schedule
    await page.goto('/periodic-reviews/schedule');
    const row = page.locator('tr', { hasText: 'FSSC 22000 Version 6.0 Guidelines' }).first();
    await expect(row).toContainText('อยู่ระหว่างดำเนินการ'); // ACTION_IN_PROGRESS
  });

});
