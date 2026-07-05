# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-navigation.spec.js >> QMS Portal Navigation & UI >> should navigate through sidebar items
- Location: tests/ui-navigation.spec.js:16:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*library/i
Received string:  "http://localhost:5173/dashboard"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × unexpected value "http://localhost:5173/dashboard"

```

```yaml
- img "Logo"
- heading "QMS Portal" [level=1]
- button "Notifications"
- navigation:
  - link "Dashboard":
    - /url: /dashboard
  - link "สร้าง DAR":
    - /url: /dar/new
  - link "รายการ DAR":
    - /url: /dar/list
  - link "กล่องงาน (Task Inbox)":
    - /url: /tasks
  - link "คลังเอกสาร":
    - /url: /library
  - link "External Documents":
    - /url: /external-docs
- paragraph: ธนาวุฒิ สมควรกิจดำรง
- paragraph: Production Supervisor • PD
- combobox:
  - 'option "Switch: Admin QA (DCC) ()"'
  - 'option "Switch: ธนาวุฒิ สมควรกิจดำรง ()" [selected]'
  - 'option "Switch: กัลยาณี พลไกร ()"'
  - 'option "Switch: คุณเรย์ ()"'
  - 'option "Switch: บีม ()"'
  - 'option "Switch: รัตนพล ()"'
  - 'option "Switch: ชัยวัฒน์ ()"'
  - 'option "Switch: คุณกิต ()"'
  - 'option "Switch: คุณนัท ()"'
- main:
  - heading "ยินดีต้อนรับ, ธนาวุฒิ" [level=2]
  - text: "คุณกำลังดูข้อมูลในบทบาท: Production Supervisor | แผนก: PD"
  - button "ตรวจสอบคิวงาน (Task Inbox)"
  - button "ดูคลังเอกสารแผนก"
  - button "คำขอของฉัน (My Requests)"
  - button "งานที่ต้องจัดการ (Action Required)"
  - heading "Draft (ร่าง)" [level=3]
  - text: "0"
  - paragraph: In Progress (กำลังดำเนินการ)
  - paragraph: "0"
  - paragraph: Returned (ให้แก้ไข)
  - paragraph: "0"
  - paragraph: Waiting (รอประกาศ)
  - paragraph: "0"
  - paragraph: Cancelled (ถูกยกเลิก)
  - paragraph: "0"
  - heading "Recent Action Items" [level=3]
  - textbox "ค้นหา DAR No..."
  - combobox [disabled]:
    - option "ทุกประเภท" [selected]
  - button "ล้างตัวกรอง"
  - paragraph: ไม่พบรายการข้อมูลที่เกี่ยวข้อง
  - paragraph: ยังไม่มีข้อมูลที่ต้องแสดงผลในขณะนี้
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('QMS Portal Navigation & UI', () => {
  4  | 
  5  |   test('should load dashboard successfully', async ({ page }) => {
  6  |     await page.goto('/');
  7  |     
  8  |     // Expect the title to contain qms-portal
  9  |     await expect(page).toHaveTitle(/qms-portal/i);
  10 |     
  11 |     // Check if the dashboard welcome message is visible
  12 |     const dashboardHeader = page.locator('h2', { hasText: /ยินดีต้อนรับ/i }).first();
  13 |     await expect(dashboardHeader).toBeVisible();
  14 |   });
  15 | 
  16 |   test('should navigate through sidebar items', async ({ page }) => {
  17 |     await page.goto('/');
  18 | 
  19 |     // Navigate to Document Library
  20 |     await page.getByRole('link', { name: 'คลังเอกสาร' }).first().click();
> 21 |     await expect(page).toHaveURL(/.*library/i);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  22 | 
  23 |     // Navigate to My Tasks
  24 |     await page.getByRole('link', { name: 'กล่องงาน (Task Inbox)' }).first().click();
  25 |     await expect(page).toHaveURL(/.*tasks/i);
  26 | 
  27 |     // Navigate to External Docs
  28 |     await page.getByRole('link', { name: 'External Documents' }).first().click();
  29 |     await expect(page).toHaveURL(/.*external-docs/i);
  30 |   });
  31 | 
  32 |   test('should have a responsive layout on mobile', async ({ page }) => {
  33 |     // Set viewport to mobile size
  34 |     await page.setViewportSize({ width: 375, height: 667 });
  35 |     await page.goto('/');
  36 | 
  37 |     // On mobile, sidebar might be hidden behind a hamburger menu
  38 |     // We check if the main layout still renders without breaking
  39 |     const dashboardHeader = page.locator('h2', { hasText: /ยินดีต้อนรับ/i }).first();
  40 |     await expect(dashboardHeader).toBeVisible();
  41 |     
  42 |     // We can also test opening the mobile menu if there is a menu button
  43 |     const menuBtn = page.locator('button').filter({ has: page.locator('svg') }).first(); // heuristic for hamburger
  44 |     if (await menuBtn.isVisible()) {
  45 |       await menuBtn.click();
  46 |       await expect(page.locator('text=คลังเอกสาร').first()).toBeVisible();
  47 |     }
  48 |   });
  49 | 
  50 | });
  51 | 
```