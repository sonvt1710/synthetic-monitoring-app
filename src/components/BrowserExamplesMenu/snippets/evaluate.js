import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';
import { browser } from 'k6/browser';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://test.k6.io/', { waitUntil: 'load' });

    // calling evaluate without arguments
    let result = await page.evaluate(() => {
      return Promise.resolve(5 * 42);
    });
    await check(result, {
      'result should be 210': (result) => result == 210,
    });

    // calling evaluate with arguments
    result = await page.evaluate(
      ([x, y]) => {
        return Promise.resolve(x * y);
      },
      [5, 5]
    );
    await check(result, {
      'result should be 25': (result) => result == 25,
    });
  } catch (e) {
    console.log('Error during execution:', e);
    throw e;
  } finally {
    await page.close();
  }
}
