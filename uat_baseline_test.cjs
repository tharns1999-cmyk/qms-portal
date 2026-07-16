const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to UAT tools...');
  await page.goto('http://localhost:5173/dcc/uat-tools');
  
  // Wait for the app to load
  await page.waitForSelector('text=UAT Control Panel', { state: 'visible', timeout: 10000 });
  
  console.log('App loaded without crash initially.');

  // Click Load Baseline
  console.log('Clicking Load Baseline...');
  await page.click('button:has-text("Load Baseline")');

  // Verify it didn't crash by checking that a success text or something is visible, or just that the app didn't throw an unhandled exception.
  await page.waitForSelector('text=UAT Control Panel', { state: 'visible', timeout: 5000 });
  console.log('App did not crash after clicking Load Baseline.');

  // Verify P-001 became active (Persona: P-001)
  const personaText = await page.locator('text=P-001:').textContent();
  console.log('Persona text:', personaText);
  if (personaText.includes('P-001')) {
    console.log('P-001 became active.');
  } else {
    console.log('Error: P-001 is NOT active.');
  }

  // Verify dataset version
  const datasetText = await page.locator('text=PERIODIC_REVIEW_UAT_V1').textContent();
  console.log('Dataset text:', datasetText);
  if (datasetText.includes('PERIODIC_REVIEW_UAT_V1')) {
    console.log('PERIODIC_REVIEW_UAT_V1 loaded.');
  } else {
    console.log('Error: PERIODIC_REVIEW_UAT_V1 NOT loaded.');
  }

  // Wait a bit to ensure state settles
  await page.waitForTimeout(1000);

  // Reload the page
  console.log('Reloading the page...');
  await page.reload();

  await page.waitForSelector('text=UAT Control Panel', { state: 'visible', timeout: 10000 });
  console.log('App did not crash after reload.');

  await browser.close();
})();
