require("dotenv").config();
const puppeteer = require("puppeteer");
const REDDIT_URL = "https://www.reddit.com";

// TODO: Use real logger
const log = (...msgs) => console.log(...msgs);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const crawl = async () => {
  log("Starting up");
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
  });
  const context = browser.defaultBrowserContext();

  // Turn off Chrome "Show notifications" and "Allow location" popup
  context.overridePermissions(REDDIT_URL, ["geolocation", "notifications"]);

  log("Opening New Page");
  const page = await browser.newPage();

  log(`Going to ${REDDIT_URL}`);
  await page.goto(REDDIT_URL);

  log("Getting Login Button");
  const loginButton = await page.$(
    "#SHORTCUT_FOCUSABLE_DIV > div:nth-child(2) > header > div > div._2u8LqkbMtzd0lpblMFbJq5 > div > div._1JBkpB_FOZMZ7IPr3FyNfH > a._3Wg53T10KuuPmyWOMWsY2F._3t7aUZU2b2KWwDQkfT2eHl._2tU8R9NTqhvBrhoNAXWWcP.HNozj_dKjQZ59ZsfEegz8._2nelDm85zKKmuD94NequP0"
  );

  log("Clicking Login Button");
  await loginButton.click();

  log("Waiting for login iframe to be visible");
  await page.waitForSelector("iframe", { visible: true });

  log("Getting iframe handle");
  const iframeHandle = await page.$(
    `iframe[src="https://www.reddit.com/login/?experiment_d2x_2020ify_buttons=enabled&experiment_d2x_sso_login_link=enabled"]`
  );

  log("Getting iframe content");
  const iframe = await iframeHandle.contentFrame();

  log("Waiting for username field to be visible");
  await iframe.waitForSelector("#loginUsername", { visible: true });

  log("Sleeping 2 seconds");
  await sleep(2000);

  log("Typing username");
  // Regular iframe.type or focus + page.keyboard.type won't work for some reason
  await iframe.$eval(
    "#loginUsername",
    (el, value) => {
      el.value = value;
    },
    process.env.REDDIT_USERNAME
  );

  log("Typing password");
  await iframe.$eval(
    "#loginPassword",
    (el, value) => {
      el.value = value;
    },
    process.env.REDDIT_PASSWORD
  );

  log("Selecting Login Form Button");
  const loginFormButton = await iframe.$(
    "body > div > main > div.OnboardingStep.Onboarding__step.mode-auth > div > div.Step__content > form > fieldset:nth-child(10) > button"
  );

  log("Clicking Login Form Button");
  await loginFormButton.click();

  log("Waiting for iframe to be hidden");
  await page.waitForFunction(
    () =>
      !document.querySelector(
        `iframe[src="https://www.reddit.com/login/?experiment_d2x_2020ify_buttons=enabled&experiment_d2x_sso_login_link=enabled"]`
      ),
    {
      polling: "mutation",
    }
  );

  log("Sleeping 2 seconds");
  await sleep(2000);

  log("Taking screenshot");
  await page.screenshot({ path: "screenshot.png" });

  log("Shutting down");
  await browser.close();
};

crawl();
