import { test } from '@playwright/test';

test('capture uat tools error', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(error.message + '\n' + error.stack);
  });
  
  await page.goto('http://localhost:5173/dcc/uat-tools');
  await page.waitForTimeout(2000);
  
  console.log('--- CAPTURED ERRORS ---');
  errors.forEach(e => console.log(e));
  console.log('-----------------------');
});
