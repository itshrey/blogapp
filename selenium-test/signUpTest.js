const { Builder, By, until } = require('selenium-webdriver');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async function signUpTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log("🔹 Opening Signup Page...");
    await driver.get('http://localhost:5173/sign-up');

    await delay(2000);

    console.log("🔹 Typing Username...");
    const usernameField = await driver.wait(until.elementLocated(By.id('username')), 10000);
    await usernameField.sendKeys('Johndoe12');
    await delay(1500);

    console.log("🔹 Typing Email...");
    const emailField = await driver.findElement(By.id('email'));
    await emailField.sendKeys('john1@example.com');
    await delay(1500);

    console.log("🔹 Typing Password...");
    const passwordField = await driver.findElement(By.id('password'));
    await passwordField.sendKeys('Test@123');
    await delay(2000); // Watch password strength bar animate

    console.log("🔹 Clicking Sign Up...");
    const submitBtn = await driver.findElement(By.css("button[type='submit']"));
    await submitBtn.click();

    await delay(5000); // Wait for possible redirection or alert

    const currentUrl = await driver.getCurrentUrl();
    if (currentUrl.includes('/sign-in')) {
      console.log("✅ Successfully redirected to Sign-In after Signup!");
    } else {
      console.log("⚠️ Not redirected to Sign-In. Check for errors.");
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await delay(2000); // Let the page stay open for a moment before quitting
    await driver.quit();
  }
})();
