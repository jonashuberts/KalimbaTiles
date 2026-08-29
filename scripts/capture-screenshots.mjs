import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

function findChromePath() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function capture() {
  const executablePath = findChromePath();
  if (!executablePath) {
    console.error('Could not locate Google Chrome or Chromium executable. Please install Google Chrome.');
    process.exit(1);
  }

  console.log(`Found browser at: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });

  const page = await browser.newPage();
  // Modern Mobile Landscape Viewport (iPhone Landscape: 844x390 @ 3x Retina)
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  const url = process.env.APP_URL || 'http://localhost:5173';
  console.log(`Navigating to ${url} in mobile landscape mode...`);
  await page.goto(url, { waitUntil: 'networkidle0' });

  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Play live song and capture at t = 9.7s
  console.log('Starting live song playback...');
  await page.evaluate(() => {
    const playBtn = document.querySelector('.playback-controls button');
    if (playBtn) playBtn.click();
  });

  console.log('Capturing playing mode screenshot at t = 9.7s...');
  await new Promise(r => setTimeout(r, 9700));

  const mainPath = path.join(screenshotsDir, 'main.png');
  await page.screenshot({ path: mainPath });
  console.log(`✓ Captured playing mode screenshot: ${mainPath}`);

  // Stop playback before entering tuning
  await page.evaluate(() => {
    const stopBtn = document.querySelector('.playback-controls button:nth-child(2)');
    if (stopBtn) stopBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // 2. Click the Tune button to enter Tuner mode
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tune = buttons.find(b => b.textContent && b.textContent.includes('Tune'));
    if (tune) tune.click();
  });

  await new Promise(r => setTimeout(r, 600));

  // Style keys for tuning mode demo showcase
  await page.evaluate(() => {
    const keyC4 = document.querySelector('.kalimba-key[data-note="C4"]');
    if (keyC4) {
      keyC4.className = 'kalimba-key tuning-focus tune-perfect';
      const indicator = document.createElement('div');
      indicator.className = 'tuning-indicator status-perfect';
      indicator.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><circle cx="12" cy="12" r="6" fill="white" stroke="none" /></svg>';
      keyC4.appendChild(indicator);
    }
    const keyD4 = document.querySelector('.kalimba-key[data-note="D4"]');
    if (keyD4) keyD4.className = 'kalimba-key memorized-perfect';
    const keyB4 = document.querySelector('.kalimba-key[data-note="B4"]');
    if (keyB4) keyB4.className = 'kalimba-key memorized-sharp';
    const keyA4 = document.querySelector('.kalimba-key[data-note="A4"]');
    if (keyA4) keyA4.className = 'kalimba-key memorized-flat';
  });

  await new Promise(r => setTimeout(r, 400));

  const tuningPath = path.join(screenshotsDir, 'tuning.png');
  await page.screenshot({ path: tuningPath });
  console.log(`✓ Captured tuning mode screenshot: ${tuningPath}`);

  await browser.close();
  console.log('✨ All screenshots generated successfully! Ready for README.');
}

capture().catch((err) => {
  console.error('Error generating screenshots:', err);
  process.exit(1);
});
