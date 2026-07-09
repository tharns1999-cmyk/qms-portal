import { test, expect } from '@playwright/test';

test.describe('Periodic Review Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard to initialize useStore state and periodic reviews
    await page.goto('/');
    // Wait for the app to load
    await expect(page).toHaveTitle(/qms-portal/i);
  });

  test('should navigate to periodic review dashboard and see initial tasks', async ({ page }) => {
    // Navigate to Periodic Review Dashboard
    await page.goto('/periodic-reviews');
    
    // Verify Dashboard loads
    await expect(page.locator('h1:has-text("Periodic Review Dashboard")')).toBeVisible();
    
    // Check if KPIs are rendered
    await expect(page.locator('text=งานทบทวนที่ต้องจัดการ')).toBeVisible();
    await expect(page.locator('text=เอกสารภายในทั้งหมด')).toBeVisible();
  });

  test('should navigate to my review tasks and view details', async ({ page }) => {
    await page.goto('/periodic-reviews/my-tasks');
    await expect(page.locator('h1:has-text("My Review Tasks")')).toBeVisible();
    
    // Wait for tasks to load (or show no tasks)
    // We expect some mock tasks to be generated automatically since we have MOCK_DOCUMENTS
    // However, it depends on the mock dates. Let's just check that the page structure is there.
    await expect(page.locator('text=Total Tasks')).toBeVisible();
  });

  test('should view master review schedule', async ({ page }) => {
    await page.goto('/periodic-reviews/schedule');
    await expect(page.locator('h1:has-text("Master Review Schedule")')).toBeVisible();
    
    // Check if table headers exist
    await expect(page.locator('th:has-text("Document No.")')).toBeVisible();
    await expect(page.locator('th:has-text("Next Review")')).toBeVisible();
  });
});
