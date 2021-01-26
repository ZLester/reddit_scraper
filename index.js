require("dotenv").config();
const puppeteer = require("puppeteer");
const REDDIT_URL = "https://www.reddit.com";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const log = async (msg, prom) => {
  console.log(`${msg}: Starting`);
  const result = await prom;
  console.log(`${msg}: Completed`);
  return result;
};

const crawl = async () => {
  const browser = await log(
    "Launch",
    puppeteer.launch({ headless: false, defaultViewport: false })
  );

  const context = browser.defaultBrowserContext();
  context.overridePermissions(REDDIT_URL, ["geolocation", "notifications"]);

  const page = await log("New Page", browser.newPage());

  await log(`Goto ${REDDIT_URL}`, page.goto(REDDIT_URL));

  const loginButton = await log(
    `Select loginButton`,
    page.$(
      "#SHORTCUT_FOCUSABLE_DIV > div:nth-child(2) > header > div > div._2u8LqkbMtzd0lpblMFbJq5 > div > div._1JBkpB_FOZMZ7IPr3FyNfH > a._3Wg53T10KuuPmyWOMWsY2F._3t7aUZU2b2KWwDQkfT2eHl._2tU8R9NTqhvBrhoNAXWWcP.HNozj_dKjQZ59ZsfEegz8._2nelDm85zKKmuD94NequP0"
    )
  );

  await log(`Click loginButton`, loginButton.click());

  await log(
    "WaitForSelector iframe",
    page.waitForSelector("iframe", { visible: true })
  );

  const iframeHandle = await log(
    `Select iframe`,
    page.$(
      `iframe[src="https://www.reddit.com/login/?experiment_d2x_2020ify_buttons=enabled&experiment_d2x_sso_login_link=enabled"]`
    )
  );
  const iframe = await log(
    "iframeHandle contentFrame",
    iframeHandle.contentFrame()
  );

  await log(
    "waiting for login field to be visible",
    iframe.waitForSelector("#loginUsername", { visible: true })
  );

  await log("Sleeping 2 seconds", sleep(2000));

  // Regular iframe.type or focus + page.keyboard.type won't work for some reason
  await log(
    "Typing username",
    iframe.$eval(
      "#loginUsername",
      (el, value) => {
        el.value = value;
      },
      process.env.REDDIT_USERNAME
    )
  );

  await log(
    "Typing password",
    iframe.$eval(
      "#loginPassword",
      (el, value) => {
        el.value = value;
      },
      process.env.REDDIT_PASSWORD
    )
  );

  const loginFormButton = await log(
    "Select loginFormButton",
    iframe.$(
      "body > div > main > div.OnboardingStep.Onboarding__step.mode-auth > div > div.Step__content > form > fieldset:nth-child(10) > button"
    )
  );

  await log(`Click loginFormButton`, loginFormButton.click());

  await log(
    "Waiting for login modal to be hidden",
    page.waitForFunction(
      () =>
        !document.querySelector(
          `iframe[src="https://www.reddit.com/login/?experiment_d2x_2020ify_buttons=enabled&experiment_d2x_sso_login_link=enabled"]`
        ),
      {
        polling: "mutation",
      }
    )
  );
  await log("Taking screenshot", page.screenshot({ path: "screenshot.png" }));
  await log("Shut down", browser.close());
};

crawl();
