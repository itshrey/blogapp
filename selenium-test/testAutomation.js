const { Builder, By, until } = require('selenium-webdriver');

(async function signInTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log("🔹 Opening Sign-In Page...");
    await driver.get('http://localhost:5173/sign-in');
    await driver.sleep(2000); // Wait to visually see the page

    // Enter email
    console.log("🔹 Entering Email...");
    const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
    await driver.sleep(1000);
    await emailInput.sendKeys('itshrey2509@gmail.com');

    // Enter password
    console.log("🔹 Entering Password...");
    const passwordInput = await driver.findElement(By.id('password'));
    await driver.sleep(1000);
    await passwordInput.sendKeys('Sdd@2509');

    // Click Sign In button
    console.log("🔹 Clicking Sign In...");
    await driver.sleep(1000);
    await driver.findElement(By.css("button[type='submit']")).click();

    // Wait for redirect and visually observe
    console.log("🔄 Waiting for redirection to home...");
    await driver.wait(until.urlIs('http://localhost:5173/'), 10000);
    await driver.sleep(3000); // Observe final page

    console.log("✅ Login successful! Redirected to homepage.");

    // Optional: Check profile tab
    const currentUrl = await driver.getCurrentUrl();
    if (currentUrl.includes('tab=profile')) {
      console.log("🎯 Redirected to profile tab as expected for unverified user.");
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await driver.sleep(4000); // Let the user observe final state
    await driver.quit();
  }
})();
