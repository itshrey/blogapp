const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');
const chrome = require('selenium-webdriver/chrome');

// Utility Functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const baseUrl = 'http://localhost:5173';

// Test Configuration
const testConfig = {
  user: {
    username: 'Johndoe' + Math.floor(Math.random() * 10000),
    email: 'johndoe_' + Math.floor(Math.random() * 10000) + '@example.com',
    password: 'Test@123'
  },
  comment: "This is an automated test comment - great post!",
  searchTerm: "cricket"
};
const verified = {
  user: {
    email: 'user7@gmail.com',
    password: 'Sdd@2509'
  },
  comment: "This is an automated test comment - great post!",
  searchTerm: "cricket",
  testPost: {
    title: "Automated Test Post " + Math.floor(Math.random() * 10000),
    category: "technology", // Must match one of your select options
    content: "This is an automated test post content with more than 50 words to meet the minimum requirement for post submission in this application. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet If image upload isn't critical for your test, you can modify the test to skip it. This is an automated test post content with more than 50 words to meet the minimum requirement for post submission in this application. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet If image upload isn't critical for your test, you can modify the test to skip it. This is an automated test post content with more than 50 words to meet the minimum requirement for post submission in this application. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet If image upload isn't critical for your test, you can modify the test to skip it. This is an automated test post content with more than 50 words to meet the minimum requirement for post submission in this application. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet If image upload isn't critical for your test, you can modify the test to skip it. This is an automated test post content with more than 50 words to meet the minimum requirement for post submission in this application. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet If image upload isn't critical for your test, you can modify the test to skip it. This is an automated test post content with more than 50 words to meet the minimum requirement for post submission in this application. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet If image upload isn't critical for your test, you can modify the test to skip it.",
    imagePath: require('path').resolve(__dirname, 'modi.jpg') // Path to a test image
  }
};
const admin = {
    user: {
      email: 'itshrey2509@gmail.com',
      password: 'Sdd@2509'
    },
    comment: "This is an automated test comment - great post!",
    searchTerm: "cricket",
    testPost: {
      title: "Automated Test Post " + Math.floor(Math.random() * 10000),
      category: "technology", // Must match one of your select options
      content: "This is an automated test post content with more than 50 words to meet the minimum requirement for post submission in this application. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet If image upload isn't critical for your test, you can modify the test to skip it. This is an automated test post content with more than 50 words to meet the minimum requirement for post submission in this application. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet If image upload isn't critical for your test, you can modify the test to skip it. This is an automated test post content with more than 50 words to meet the minimum requirement for post submission in this application. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet If image upload isn't critical for your test, you can modify the test to skip it. This is an automated test post content with more than 50 words to meet the minimum requirement for post submission in this application. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet If image upload isn't critical for your test, you can modify the test to skip it. This is an automated test post content with more than 50 words to meet the minimum requirement for post submission in this application. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet If image upload isn't critical for your test, you can modify the test to skip it. This is an automated test post content with more than 50 words to meet the minimum requirement for post submission in this application. The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet If image upload isn't critical for your test, you can modify the test to skip it.",
      imagePath: require('path').resolve(__dirname, 'test-image.png') // Path to a test image
    }
  };



// Helper Functions
async function findFreshElement(driver, selectors, parentElement = null) {
  const context = parentElement || driver;
  let lastError;
  
  for (const selector of selectors) {
    try {
      const element = await context.findElement(selector);
      await driver.wait(until.elementIsVisible(element), 5000);
      await driver.wait(until.elementIsEnabled(element), 5000);
      return element;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error(`Element not found with selectors: ${selectors.map(s => s.toString())}`);
}

async function retryOperation(operation, maxRetries = 3, delayMs = 2000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`⚠️ Attempt ${i + 1} failed, retrying...`);
      await delay(delayMs);
    }
  }
  throw lastError;
}

async function takeScreenshot(driver, prefix) {
  try {
    const screenshot = await driver.takeScreenshot();
    const filename = `${prefix}-${Date.now()}.png`;
    require('fs').writeFileSync(filename, screenshot, 'base64');
    return filename;
  } catch (err) {
    console.error("Failed to take screenshot:", err);
    return null;
  }
}

// Test Actions
async function signUp(driver, user) {
  console.log("🔹 Starting signup process...");
  await driver.get(`${baseUrl}/sign-up`);
  await delay(2000);

  await driver.findElement(By.id('username')).sendKeys(user.username);
  await driver.findElement(By.id('email')).sendKeys(user.email);
  await driver.findElement(By.id('password')).sendKeys(user.password);
  await driver.findElement(By.css("button[type='submit']")).click();

  await driver.wait(until.urlContains('/sign-in'), 10000);
  console.log("✅ Signup successful");
}

async function signIn(driver, user) {
  console.log("🔹 Starting login process...");
  await driver.findElement(By.id('email')).sendKeys(user.email);
  await driver.findElement(By.id('password')).sendKeys(user.password);
  await driver.findElement(By.css("button[type='submit']")).click();

  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    return currentUrl.includes('/dashboard') || currentUrl === `${baseUrl}/`;
  }, 10000);
  
  console.log("✅ Login successful");
}

async function navigateToHome(driver) {
  console.log("🔹 Navigating to home...");
  const homeLink = await findFreshElement(driver, [
    By.xpath("//a[contains(text(), 'Home')]"),
    By.css('nav a[href="/"]')
  ]);
  await homeLink.click();
  await driver.wait(until.urlIs(`${baseUrl}/`), 5000);
  console.log("✅ Home navigation successful");
}

async function verifyHomePage(driver) {
  console.log("🔹 Verifying home page...");
  const heading = await driver.wait(until.elementLocated(By.tagName('h1')), 5000);
  const headingText = await heading.getText();
  assert(headingText.includes('Welcome to InspireHub'), 'Main heading not found');
  console.log("✅ Home page verified");
}

// Profile Page Test Functions
async function navigateToProfile(driver) {
    console.log("🔹 Navigating to profile page...");
    try {
      await driver.wait(until.urlContains('/dashboard'), 5000);
      await delay(3000); // Additional delay for page stabilization
      console.log("✅ Profile page loaded successfully");
    } catch (error) {
      console.error("❌ Failed to navigate to profile:", error.message);
      await takeScreenshot(driver, 'profile-navigation-error');
      throw error;
    }
  }
  
  async function testProfileUpdate(driver, newUsername) {
    console.log("🔹 Testing profile update functionality...");
    try {
      // Update username
      const usernameInput = await findFreshElement(driver, [By.id('username')]);
      await usernameInput.clear();
      await usernameInput.sendKeys(newUsername);
      
      // Submit the form
      const updateButton = await findFreshElement(driver, [
        By.xpath("//button[contains(., 'Update')]"),
        By.css('button[type="submit"]')
      ]);
      await safeClick(driver, updateButton);
      
      // Verify success message
      const successAlert = await driver.wait(
        until.elementLocated(By.xpath("//*[contains(text(), 'Profile updated')]")),
        5000
      );
      assert(await successAlert.isDisplayed(), 'Profile update success message not shown');
      console.log("✅ Profile update successful");
    } catch (error) {
      console.error("❌ Profile update failed:", error.message);
      await takeScreenshot(driver, 'profile-update-error');
      throw error;
    }
  }
  
  
  
  async function testAccountDeletionFlow(driver) {
    console.log("🔹 Testing account deletion flow...");
    try {
        // Take pre-test screenshot
        await takeScreenshot(driver, 'pre-deletion-flow');

        // 1. Click delete account link with multiple location strategies
        const deleteLink = await retryOperation(async () => {
            const link = await findFreshElement(driver, [
                By.xpath("//span[contains(., 'Delete Account')]"),
                By.css('[data-testid="delete-account"]'),
                By.xpath("//*[contains(text(), 'Delete Account')]"),
                By.css('span.text-red-500') // Assuming red color for delete link
            ], null, 10000);
            await safeClick(driver, link);
            return link;
        }, 3, 2000);

        console.log("✅ Delete account link clicked");

        // 2. Verify modal appears with multiple identification methods
        const modal = await retryOperation(async () => {
            const modalElement = await findFreshElement(driver, [
                By.css('.Modal'), // Generic modal class
                By.xpath("//*[contains(@class, 'Modal')]"),
                By.xpath("//*[contains(text(), 'Are you sure you want to delete this account?')]/ancestor::div[contains(@class, 'Modal')]"),
                By.css('[role="dialog"]') // Common dialog role
            ], null, 10000);

            if (!(await modalElement.isDisplayed())) {
                throw new Error("Modal not visible");
            }
            return modalElement;
        }, 3, 2000);

        console.log("✅ Delete confirmation modal appeared");
        await takeScreenshot(driver, 'delete-modal-shown');

        // 3. Click cancel button with multiple location strategies
        const cancelButton = await retryOperation(async () => {
            const button = await findFreshElement(driver, [
                By.xpath("//button[contains(., 'No, cancel')]"),
                By.css('[data-testid="cancel-delete"]'),
                By.xpath("//button[contains(@class, 'gray')]"), // Assuming gray is cancel button
                By.xpath("//button[contains(text(), 'No') or contains(text(), 'Cancel')]")
            ], modal, 10000); // Search within modal context

            await safeClick(driver, button);
            return button;
        }, 3, 2000);

        console.log("✅ Cancel button clicked");

        // 4. Verify modal is closed with multiple verification methods
        await driver.wait(async () => {
            try {
                // Method 1: Check modal is stale
                const isStale = await driver.executeScript(`
                    return arguments[0].isConnected === false;
                `, modal);
                if (isStale) return true;

                // Method 2: Check modal is not displayed
                const modals = await driver.findElements(By.css('.Modal'));
                if (modals.length === 0) return true;

                // Method 3: Check modal is hidden
                return !(await modals[0].isDisplayed());
            } catch (error) {
                // Element is stale (not found)
                return true;
            }
        }, 10000);

        console.log("✅ Account deletion flow tested (cancelled)");
        await takeScreenshot(driver, 'post-deletion-flow');
        return true;
    } catch (error) {
        console.error("❌ Account deletion flow test failed:", error.message);
        
        // Advanced debugging
        try {
            // Check current modal state
            const modals = await driver.findElements(By.css('.Modal, [role="dialog"]'));
            console.log(`Found ${modals.length} modals on page`);
            
            // Check for error messages
            const errorMessages = await driver.findElements(By.css('.error, .text-red-500'));
            if (errorMessages.length > 0) {
                const errorText = await errorMessages[0].getText();
                console.log("Error message:", errorText);
            }
        } catch (debugError) {
            console.log("Debug failed:", debugError.message);
        }

        await takeScreenshot(driver, 'account-deletion-error');
        throw error;
    }
}
  
  // Utility function for safe clicking (add this if not already present)
  async function safeClick(driver, element) {
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center', behavior: 'smooth'});", element);
    await delay(500);
    await driver.executeScript("arguments[0].click();", element);
  }



async function testPostInteractions(driver, user, comment) {
  console.log("🔹 Testing post interactions...");
  const postCards = await driver.wait(
    until.elementsLocated(By.xpath("//a[contains(@href, '/post/')]")),
    10000
  );

  if (postCards.length === 0) {
    console.log("⚠️ No posts found to interact with");
    return;
  }

  const firstPost = postCards[0];
  await firstPost.click();
  await driver.wait(until.urlContains('/post/'), 10000);

  // Test like functionality
  await retryOperation(() => testLikeButton(driver));
  await delay(1500);
  // Test comment functionality
  await retryOperation(() => testCommentSection(driver, user.username, comment));
  await delay(1500);
  // Test comment like functionality
  await retryOperation(() => testCommentLike(driver));
  await delay(1500);
  await driver.navigate().back();
  console.log("✅ Post interactions completed");
}

async function testCreatePostPage(driver, testPost) {
    console.log("🔹 Testing Create Post page functionality...");
    
    try {
      // Verify we're on the Create Post page
      await driver.wait(until.urlContains('/create-post'), 5000);
      const pageTitle = await findFreshElement(driver, [
        By.xpath('//h1[contains(text(), "Create a Post")]'),
        By.css('h1')
      ]);
      assert(await pageTitle.isDisplayed(), 'Create Post page title not found');
      console.log("✅ Create Post page loaded");
  
      // Fill in post title
      const titleInput = await findFreshElement(driver, [By.id('title')]);
      await titleInput.clear();
      await titleInput.sendKeys(testPost.title);
      await delay(1500);
      console.log("✅ Post title entered");
  
      // Select category
      const categorySelect = await findFreshElement(driver, [By.css('select')]);
      await categorySelect.click();
      const categoryOption = await findFreshElement(driver, [
        By.xpath(`//option[contains(text(), "${testPost.category}")]`),
        By.css(`option[value="${testPost.category}"]`)
      ]);
      await categoryOption.click();
      console.log(`✅ Category "${testPost.category}" selected`);
      await delay(1500);
  
      // Upload image if provided
      if (testPost.imagePath) {
        const fileInput = await findFreshElement(driver, [By.css('input[type="file"]')]);
        await fileInput.sendKeys(testPost.imagePath);
        console.log("✅ Image file selected");
  
        // Click upload button
        const uploadButton = await findFreshElement(driver, [
          By.xpath('//button[contains(., "Upload")]'),
          By.css('button[type="button"]')
        ]);
        await uploadButton.click();
  
        // Wait for upload to complete
        await driver.wait(async () => {
          try {
            const progressBar = await driver.findElements(By.css('.CircularProgressbar'));
            return progressBar.length === 0; // Wait until progress bar disappears
          } catch {
            return true;
          }
        }, 15000);
        console.log("✅ Image upload completed");
  
        // Verify image preview
        const imagePreview = await findFreshElement(driver, [By.css('img[src^="http"]')]);
        assert(await imagePreview.isDisplayed(), 'Image preview not displayed');
        console.log("✅ Image preview verified");
      }
      await delay(500);
      // Enter content using JavaScript (since ReactQuill is not a standard input)
      const content = testPost.content || "This is a test post content with more than 50 words to meet the minimum requirement for post submission in this application.";
      await driver.executeScript(`
        const quill = document.querySelector('.ql-editor');
        quill.innerHTML = '${content.replace(/'/g, "\\'")}';
        const event = new Event('input', { bubbles: true });
        quill.dispatchEvent(event);
      `);
      await delay(1500);
      console.log("✅ Post content entered");
  
      // Verify word count
      await delay(1500); // Wait for word count update
      const wordCountElement = await findFreshElement(driver, [
        By.xpath('//*[contains(text(), "words")]'),
        By.css('.text-gray-500') // Adjust based on your actual class
      ]);
      const wordCountText = await wordCountElement.getText();
      const wordCount = parseInt(wordCountText.match(/\d+/)[0]);
      assert(wordCount >= 50, 'Word count less than 50');
      console.log(`✅ Word count verified (${wordCount} words)`);
  
      // Submit the post
      const submitButton = await findFreshElement(driver, [
        By.xpath('//button[contains(., "Publish Post")]'),
        By.css('button[type="submit"]')
      ]);
      await submitButton.click();
      console.log("✅ Post submitted");
      
      // Wait for post to be created and redirected
      await driver.wait(until.urlContains('/post/'), 15000);
      console.log("✅ Post created successfully");
      return true;
    } catch (error) {
      console.error("❌ Create Post test failed:", error.message);
      await takeScreenshot(driver, 'create-post-failure');
      throw error;
    }
  }

async function testSearchFunctionality(driver, searchTerm) {
  console.log("🔍 Testing search functionality...");
  
  try {
    // First try direct navigation
    await driver.get(`${baseUrl}/search`);
    await delay(2000);
  } catch (error) {
    console.log("⚠️ Direct navigation to search failed, trying via button");
    
    // If direct navigation fails, try clicking the button with JavaScript
    const browseButton = await findFreshElement(driver, [
      By.xpath("//a[contains(., 'Browse Articles')]"),
      By.css('a[href*="/search"]')
    ]);
    
    // Scroll into view and click with JavaScript to avoid interception
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", browseButton);
    await delay(1000);
    await driver.executeScript("arguments[0].click();", browseButton);
  }

  await driver.wait(until.urlContains('/search'), 10000);
  await delay(2000); // Additional delay for page stabilization

  // Improved search input handling
  const searchInput = await retryOperation(async () => {
    const input = await findFreshElement(driver, [
      By.css('[data-testid="search-input"]'),
      By.id('searchTerm'),
      By.css('input[type="search"]'),
      By.css('input[placeholder*="Search"]')
    ]);
    
    // Clear using JavaScript to ensure clean state
    await driver.executeScript("arguments[0].value = '';", input);
    return input;
  });

  // Type slowly to mimic user behavior
  for (const char of searchTerm.split('')) {
    await searchInput.sendKeys(char);
    await delay(100);
  }

  // Find and click search button
  const searchButton = await retryOperation(async () => {
    const button = await findFreshElement(driver, [
      By.css('[data-testid="search-submit"]'),
      By.css('button[type="submit"]'),
      By.xpath('//button[contains(., "Search")]')
    ]);
    
    // Scroll into view and click with JavaScript
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", button);
    await driver.executeScript("arguments[0].click();", button);
    await delay(500);
    return button;
  });

  

  
}

async function testSignOut(driver) {
    console.log("🔹 Testing signout functionality...");
    
    try {
      // First ensure we're on a page where the header is visible
      await driver.get(`${baseUrl}/`);
      await delay(2000);
  
      // Take pre-signout screenshot for debugging
      await takeScreenshot(driver, 'pre-signout');
  
      // Find the user dropdown using multiple strategies
      const userDropdown = await retryOperation(async () => {
        const dropdown = await findFreshElement(driver, [
          By.css('[data-testid="user-dropdown"]'), // Primary selector from your component
          By.css('button[aria-haspopup="true"]'), // Flowbite dropdown button
          By.css('div[role="button"]'), // Flowbite div button
          By.xpath('/html/body/div[1]/div/div/nav/div/div/div[1]/button[1]/div/div/div/img') // Avatar wrapper
        ]);
        
        // Scroll into view and click with JavaScript
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center', behavior: 'smooth'});", dropdown);
        await delay(500);
        await driver.executeScript("arguments[0].click();", dropdown);
        await delay(1000); // Wait for dropdown animation
        return dropdown;
      }, 3, 1500);
  
      // Find the signout button in the dropdown
      const signoutButton = await retryOperation(async () => {
        const button = await findFreshElement(driver, [
          By.css('[data-testid="signout-button"]'), // Primary selector
          By.xpath('/html/body/div[1]/div/div/nav/div/div/div[1]/div[3]/ul/li/button'), // Text fallback
          By.css('button:last-child'), // Last button in dropdown
          By.css('div[role="menu"] > button:last-child') // Flowbite menu item
        ]);
        
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", button);
        await delay(500);
        await driver.executeScript("arguments[0].click();", button);
        return button;
      }, 3, 1500);
  
      // Wait for signout to complete with multiple verification methods
      await driver.wait(async () => {
        try {
          const currentUrl = await driver.getCurrentUrl();
          const onHomePage = currentUrl === `${baseUrl}/`;
          const onSignInPage = currentUrl.includes('/sign-in');
          
          // Check for sign in button appearance
          const signInButton = await driver.findElements(By.xpath('//a[contains(., "Sign In")]'));
          
          // Check user dropdown is gone
          const userDropdownExists = await driver.findElements(By.css('[data-testid="user-dropdown"]'))
            .then(elements => elements.length > 0);
          
          return (onHomePage || onSignInPage) && signInButton.length > 0 && !userDropdownExists;
        } catch (e) {
          return false;
        }
      }, 15000);
  
      console.log("✅ Signout successful - verified by URL and UI elements");
    } catch (error) {
      console.error("❌ Signout failed:", error.message);
      
      // Advanced debugging
      try {
        const currentHtml = await driver.findElement(By.tagName('body')).getAttribute('innerHTML');
        console.log("Current page snippet:", currentHtml.substring(0, 300));
        await takeScreenshot(driver, 'signout-failure-state');
      } catch (debugError) {
        console.log("Debug failed:", debugError.message);
      }
      
      throw error;
    }
  }
async function moveToDashboard(driver) {
    
    try {
      // First ensure we're on a page where the header is visible
      await driver.get(`${baseUrl}/`);
      await delay(2000);
  
      // Take pre-signout screenshot for debugging
      await takeScreenshot(driver, 'pre-signout');
  
      // Find the user dropdown using multiple strategies
      const userDropdown = await retryOperation(async () => {
        const dropdown = await findFreshElement(driver, [
          By.css('[data-testid="user-dropdown"]'), // Primary selector from your component
          By.css('button[aria-haspopup="true"]'), // Flowbite dropdown button
          By.css('div[role="button"]'), // Flowbite div button
          By.xpath('/html/body/div[1]/div/div/nav/div/div/div[1]/button[1]/div/div/div/img') // Avatar wrapper
        ]);
        
        // Scroll into view and click with JavaScript
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center', behavior: 'smooth'});", dropdown);
        await delay(500);
        await driver.executeScript("arguments[0].click();", dropdown);
        await delay(1000); // Wait for dropdown animation
        return dropdown;
      }, 3, 1500);
  
      // Find the signout button in the dropdown
      const signoutButton = await retryOperation(async () => {
        const button = await findFreshElement(driver, [
          By.css('[data-testid="dashboard-button"]'), // Primary selector
          By.xpath('/html/body/div[1]/div/div/nav/div/div/div[1]/div[3]/ul/a[1]/li/button'), // Text fallback
          By.css('button:last-child'), // Last button in dropdown
          By.css('div[role="menu"] > button:last-child') // Flowbite menu item
        ]);
        
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", button);
        await delay(500);
        await driver.executeScript("arguments[0].click();", button);
        return button;
      }, 3, 1500);

      ///html/body/div[1]/div/div/div/div[1]/nav/div/div/ul/a[1]/li/div
      const dashboardButton = await retryOperation(async () => {
        const button = await findFreshElement(driver, [
          By.css('[data-testid="dashboard-button"]'), // Primary selector
          By.xpath('/html/body/div[1]/div/div/div/div[1]/nav/div/div/ul/a[1]/li/div'), // Text fallback
          By.css('button:last-child'), // Last button in dropdown
          By.css('div[role="menu"] > button:last-child') // Flowbite menu item
        ]);
        
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", button);
        await delay(2000);
        await driver.executeScript("arguments[0].click();", button);
        return button;
      }, 3, 1500);
      const userButton = await retryOperation(async () => {
        const button = await findFreshElement(driver, [
          By.css('[data-testid="dashboard-button"]'), // Primary selector
          By.xpath('/html/body/div[1]/div/div/div/div[1]/nav/div/div/ul/a[4]/li/div/span'), // Text fallback
          By.css('button:last-child'), // Last button in dropdown
          By.css('div[role="menu"] > button:last-child') // Flowbite menu item
        ]);
        
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", button);
        await delay(1000);
        await driver.executeScript("arguments[0].click();", button);
        return button;
      }, 3, 1500);
      const commentButton = await retryOperation(async () => {
        const button = await findFreshElement(driver, [
          By.css('[data-testid="dashboard-button"]'), // Primary selector
          By.xpath('/html/body/div[1]/div/div/div/div[1]/nav/div/div/ul/a[5]/li/div/span'), // Text fallback
          By.css('button:last-child'), // Last button in dropdown
          By.css('div[role="menu"] > button:last-child') // Flowbite menu item
        ]);
        
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", button);
        await delay(2000);
        await driver.executeScript("arguments[0].click();", button);
        return button;
      }, 3, 1500);

      const postButton = await retryOperation(async () => {
        const button = await findFreshElement(driver, [
          By.css('[data-testid="dashboard-button"]'), // Primary selector
          By.xpath('/html/body/div[1]/div/div/div/div[1]/nav/div/div/ul/a[3]/li/div/span'), // Text fallback
          By.css('button:last-child'), // Last button in dropdown
          By.css('div[role="menu"] > button:last-child') // Flowbite menu item
        ]);
        
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", button);
        await delay(2000);
        await driver.executeScript("arguments[0].click();", button);
        return button;
      }, 3, 1500);
      console.log("✅ moved");
    } catch (error) {
      console.error("❌ Signout failed:", error.message);
      
      
      
      throw error;
    }
  }

  async function retryFindElement(driver, locators, maxRetries = 3, retryDelay = 1000) {
    const { until } = require('selenium-webdriver');
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      for (const locator of locators) {
        try {
          // Try to find element with a timeout
          const element = await driver.wait(until.elementLocated(locator), 5000);
          if (element) {
            // Check if element is visible and enabled
            const isDisplayed = await element.isDisplayed();
            const isEnabled = await element.isEnabled();
            
            if (isDisplayed && isEnabled) {
              return element;
            }
          }
        } catch (error) {
          // Continue to next locator strategy
          continue;
        }
      }
      
      if (attempt < maxRetries - 1) {
        // Wait before retrying
        await driver.sleep(retryDelay);
      }
    }
    
    return null;
  }

  async function waitForDeletionConfirmation(driver, timeout = 10000) {
    const { By, until } = require('selenium-webdriver');
    
    try {
      // Strategy 1: Look for success message
      try {
        await driver.wait(until.elementLocated(
          By.xpath("//*[contains(text(), 'success') or contains(text(), 'deleted') or contains(text(), 'Post deleted')]")
        ), timeout);
        return true;
      } catch {
        // No success message found, try other strategies
      }
      
      // Strategy 2: Check if modal disappeared
      try {
        await driver.wait(until.stalenessOf(
          await driver.findElement(By.css('.modal-content, [role="dialog"]'))
        ), timeout);
        return true;
      } catch {
        // Modal might not be stale, try other strategies
      }
      
      // Strategy 3: Wait a moment and check if we can click delete buttons
      // (this ensures the UI has updated after deletion)
      await driver.sleep(2000);
      const deleteButtons = await driver.findElements(By.css('button[data-testid="delete-post"]'));
      if (deleteButtons.length > 0) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.log("Error during deletion confirmation:", error.message);
      return false;
    }
  }

// Component-specific Test Functions
async function testLikeButton(driver) {
  const likeButton = await findFreshElement(driver, [
    By.css('[data-testid="like-button"]'),
    By.css('button[aria-label*="like"]')
  ]);
  await likeButton.click();
  await delay(2000);
}


async function testCommentSection(driver, username, commentText) {
  const commentSection = await driver.wait(
    until.elementLocated(By.css('[data-testid="comment-section"]')),
    10000
  );
  
  const textarea = await commentSection.findElement(
    By.css('[data-testid="comment-input"]')
  );
  await textarea.sendKeys(commentText);

  const submitButton = await commentSection.findElement(
    By.css('[data-testid="comment-submit"]')
  );
  await submitButton.click();
  await delay(2000);
}

async function testCommentLike(driver) {
  const likeButton = await findFreshElement(driver, [
    By.css('[data-testid="comment-like-button"]'),
    By.css('.comment button[aria-label*="like"]')
  ]);
  await likeButton.click();
  await delay(2000);
}


async function navigateToCreatePost(driver) {
  console.log("🔹 Navigating to Create Post page...");
  
  try {
    // Find the Create Post link in the navigation
    const createPostLink = await findFreshElement(driver, [ By.xpath("/html/body/div[1]/div/div/div/section[1]/div/a[2]/button/span"), By.css('a[href*="/search"]') ]);
    
    // Scroll into view and click with JavaScript to avoid interception
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", createPostLink);
    await delay(500);
    await driver.executeScript("arguments[0].click();", createPostLink);
    
    // Wait for Create Post page to load
    await driver.wait(until.urlContains('/create-post'), 5000);
    console.log("✅ Create Post page loaded successfully");
    
    // Verify we're on the Create Post page
    const pageTitle = await findFreshElement(driver, [
      By.css('h1'),
      By.xpath('//*[contains(text(), "Create Post")]')
    ]);
    assert(await pageTitle.isDisplayed(), 'Create Post page title not visible');
    console.log("✅ Create Post page verified");
    
    return true;
  } catch (error) {
    console.error("❌ Failed to navigate to Create Post:", error.message);
    await takeScreenshot(driver, 'create-post-error');
    throw error;
  }
}

async function deletePost(driver, options = {}) {
    const { 
      postId, 
      postTitle, 
      postIndex = 0, 
      baseUrl, 
      takeScreenshots = false 
    } = options;
    
    const { By, until } = require('selenium-webdriver');
    
    console.log("🔹 Starting post deletion process...");
    
    try {
      // Navigate to dashboard if baseUrl is provided
      if (baseUrl) {
        await driver.get(`${baseUrl}/dashboard?tab=posts`);
        await driver.wait(until.urlContains('/dashboard'), 5000);
        console.log("✅ Navigated to posts dashboard");
      }
      
      // Take screenshot if enabled
      if (takeScreenshots) {
        await takeScreenshot(driver, 'before-delete');
      }
      
      // Initialize the delete button selector strategy
      let deleteButtonLocator;
      
      // Strategy 1: Find by specific post ID
      if (postId) {
        deleteButtonLocator = By.xpath(`//tr[contains(@id, '${postId}') or .//a[contains(@href, '${postId}')]]//button[.//svg[contains(@class, 'trash') or @data-icon='trash']] | //tr[contains(@id, '${postId}') or .//a[contains(@href, '${postId}')]]//button[@data-testid="delete-post"]`);
      } 
      // Strategy 2: Find by post title
      else if (postTitle) {
        deleteButtonLocator = By.xpath(`//tr[.//a[contains(text(), "${postTitle}")]]//button[.//svg[contains(@class, 'trash') or @data-icon='trash']] | //tr[.//a[contains(text(), "${postTitle}")]]//button[@data-testid="delete-post"]`);
      } 
      // Strategy 3: Find by index
      else {
        deleteButtonLocator = By.xpath(`(//button[.//svg[contains(@class, 'trash') or @data-icon='trash']] | //button[@data-testid="delete-post"])[${postIndex + 1}]`);
      }
  
      // Find and click the delete button with retry mechanism
      const deleteButton = await retryFindElement(driver, [
        deleteButtonLocator,
        By.xpath("//button[.//svg[contains(@class, 'FaTrash')]]"),
        By.css('button[data-testid="delete-post"]'),
        By.xpath("//tr//button[.//svg[@data-icon='trash']]")
      ], 3, 2000);
      
      if (!deleteButton) {
        throw new Error("Could not find delete button");
      }
      
      // Highlight the button for visual confirmation
      await driver.executeScript(`
        arguments[0].style.border = '2px solid red';
        arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      `, deleteButton);
      
      // Wait a moment for the scrolling to complete
      await driver.sleep(500);
      
      // Take screenshot if enabled
      if (takeScreenshots) {
        await takeScreenshot(driver, 'delete-button-highlighted');
      }
      
      // Click the delete button
      await safeClick(driver, deleteButton);
      console.log("✅ Delete button clicked");
      
      // Wait for modal to appear
      const modal = await retryFindElement(driver, [
        By.xpath("//*[contains(text(), 'Are you sure you want to delete this post?')]/ancestor::div[contains(@class, 'modal') or @role='dialog']"),
        By.css('.modal-content, [role="dialog"]'),
        By.xpath("//div[contains(@class, 'fixed') and contains(@class, 'inset-0')]")
      ], 3, 2000);
      
      if (!modal) {
        throw new Error("Delete confirmation modal not appearing");
      }
      
      console.log("✅ Delete confirmation modal appeared");
      
      if (takeScreenshots) {
        await takeScreenshot(driver, 'delete-modal-shown');
      }
      
      // Find and click confirm button
      const confirmButton = await retryFindElement(driver, [
        By.xpath("//button[contains(text(), 'Yes, delete it')]"),
        By.css('button[data-testid="confirm-delete"]'),
        By.xpath("//button[contains(@class, 'failure') or contains(@class, 'red')]")
      ], 3, 2000);
      
      if (!confirmButton) {
        throw new Error("Could not find confirmation button");
      }
      
      // Click the confirm button
      await safeClick(driver, confirmButton);
      console.log("✅ Confirm deletion clicked");
      
      // Verify deletion completion 
      const success = await waitForDeletionConfirmation(driver);
      
      if (success) {
        console.log("✅ Post successfully deleted");
        if (takeScreenshots) {
          await takeScreenshot(driver, 'post-deletion-success');
        }
        return true;
      } else {
        throw new Error("Could not verify deletion success");
      }
    } catch (error) {
      console.error(`❌ Post deletion failed: ${error.message}`);
      
      if (takeScreenshots) {
        await takeScreenshot(driver, 'post-deletion-failure');
      }
      
      // Log current page state for debugging
      try {
        const pageSource = await driver.getPageSource();
        console.log("Current page URL:", await driver.getCurrentUrl());
        console.log("Page source fragment:", pageSource.substring(0, 500) + "...");
      } catch (debugError) {
        console.log("Debug information collection failed:", debugError.message);
      }
      
      throw error;
    }
  }
// Main Test Execution
(async function runTests() {
  const options = new chrome.Options();
  options.addArguments('--start-maximized');
  options.addArguments('--disable-notifications');
  options.addArguments('--disable-extensions');
  
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // Execute test flow
    await signUp(driver, testConfig.user);
    await signIn(driver, testConfig.user);
    await navigateToProfile(driver);
    await testProfileUpdate(driver, "newtestusername" + Math.floor(Math.random() * 10000));
    await testAccountDeletionFlow(driver);
    await navigateToHome(driver);
    await verifyHomePage(driver);
    await testPostInteractions(driver, testConfig.user, testConfig.comment);
    await testSearchFunctionality(driver, testConfig.searchTerm);
    await testSignOut(driver);
    await signIn(driver, verified.user);
    await verifyHomePage(driver);
    await navigateToCreatePost(driver);
    await testCreatePostPage(driver, verified.testPost);
    await testSignOut(driver);
    await signIn(driver, admin.user);
    await verifyHomePage(driver);
    await moveToDashboard(driver);
    await deletePost(driver);
    await testSignOut(driver);
    console.log("🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    const screenshot = await takeScreenshot(driver, 'test-failure');
    if (screenshot) console.log(`📸 Screenshot saved: ${screenshot}`);
    throw error;
  } finally {
    await delay(1000);
    await driver.quit();
  }
})();