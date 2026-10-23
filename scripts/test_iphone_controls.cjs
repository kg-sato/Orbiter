/* Chromium layout/interaction regression; actual iOS touch and VoiceOver are separate checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright-core');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.ORBITER_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true});
  try {
    fs.mkdirSync('build/iphone-controls', {recursive: true});
    for (const [width, height] of [[320,568], [390,844], [430,932], [844,390]]) {
      const context = await browser.newContext({viewport: {width, height}, reducedMotion: 'reduce'});
      const page = await context.newPage();
      await page.goto(pathToFileURL(path.resolve('Scheduler/Application.html')).href);
      await page.waitForFunction(() => window.OrbiterUI);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
      for (const id of ['jump-open', 'quick-capture', 'add', 'mobile-more']) {
        const button = page.locator('#' + id);
        const box = await button.boundingBox();
        assert(box && box.width >= 44 && box.height >= 44, `${id} hit target at ${width}`);
        assert(await button.evaluate(e => {const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}), `${id} is occluded at ${width}`);
      }
      const icon = page.locator('#quick-capture .capture-icon');
      assert(await icon.isVisible(), `Capture icon missing at ${width}`);
      assert(await icon.evaluate(e => e.getBoundingClientRect().width >= 20), `Capture icon clipped at ${width}`);
      await page.locator('#quick-capture').click();
      await page.locator('#capture-editor').waitFor({state: 'visible'});
      assert.equal(await page.locator('#capture-title').evaluate(e => e === document.activeElement), true);
      await page.keyboard.press('Escape');
      await page.locator('#mobile-more').click();
      await page.locator('#mobile-menu').waitFor({state: 'visible'});
      await page.keyboard.press('Escape');
      if (width <= 600) {
        for (const name of ['tasks', 'atlas', 'rhythm', 'desk']) {
          const nav = page.locator(`.mobile-nav button[data-page="${name}"]`);
          await nav.click();
          assert.equal(await nav.getAttribute('aria-pressed'), 'true');
        }
      }
      await page.screenshot({path: `build/iphone-controls/${width}x${height}.png`});
      await context.close();
    }
    console.log('PASS: four phone/landscape sizes, visible Capture icon, 44px toolbar targets, center hit tests, dialogs and mobile navigation. Chromium only.');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode = 1;});
