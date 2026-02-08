const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// Helper: Random delay
function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Scrape job details from an Indeed job URL
 * @param {string} url - Indeed job URL (e.g., https://fr.indeed.com/viewjob?jk=abc123)
 * @returns {Promise<Object>} Job details
 */
async function scrapeJobDetails(url) {
    console.log(`[Job Scraper] Extracting details from: ${url}`);

    // Validate URL
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
    }

    // Check if it's an Indeed URL
    const isIndeedUrl = url.includes('indeed.com') || url.includes('indeed.fr');
    if (!isIndeedUrl) {
        throw new Error('Only Indeed URLs are supported at the moment');
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-web-security'
        ]
    });

    const page = await browser.newPage();

    // Enhanced anti-detection
    await page.evaluateOnNewDocument(() => {
        // Override the navigator.webdriver property
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });

        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
        });

        // Mock languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['fr-FR', 'fr', 'en-US', 'en'],
        });

        // Chrome runtime
        window.chrome = {
            runtime: {},
        };

        // Permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
    });

    await page.setViewport({ width: 1920, height: 1080 });

    // Rotate user agents
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    ];
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUA);

    // Set realistic headers
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
    });

    try {
        // Navigate to job page
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for page to settle
        await randomDelay(3000, 5000);

        // Close cookie banner if present
        try {
            const cookieButton = await page.$('#onetrust-accept-btn-handler, #accept-recommended-btn-handler');
            if (cookieButton) await cookieButton.click();
            await randomDelay(500, 1000);
        } catch (e) { }

        // Extract job details with multiple selector fallbacks
        const jobDetails = await page.evaluate(() => {
            // Helper to try multiple selectors
            function trySelectors(selectors) {
                for (const selector of selectors) {
                    const el = document.querySelector(selector);
                    if (el && el.textContent.trim()) {
                        return el.textContent.trim();
                    }
                }
                return null;
            }

            // Helper to get all text from multiple elements
            function getAllText(selectors) {
                for (const selector of selectors) {
                    const el = document.querySelector(selector);
                    if (el) {
                        return el.innerText || el.textContent.trim();
                    }
                }
                return null;
            }

            const titleSelectors = [
                'h1.jobsearch-JobInfoHeader-title',
                'h1[class*="jobsearch"]',
                'h1.icl-u-xs-mb--xs',
                'h2.jobTitle',
                'h1'
            ];

            const companySelectors = [
                '[data-testid="inlineHeader-companyName"]',
                '[data-company-name="true"]',
                '.icl-u-lg-mr--sm.icl-u-xs-mr--xs',
                'div[data-testid="inlineHeader-companyName"]',
                'a[data-tn-element="companyName"]',
                '.companyName'
            ];

            const locationSelectors = [
                '[data-testid="inlineHeader-companyLocation"]',
                'div[data-testid="job-location"]',
                '.icl-u-xs-mt--xs.icl-u-textColor--secondary',
                '.jobsearch-JobInfoHeader-subtitle div',
                '.companyLocation'
            ];

            const descriptionSelectors = [
                '#jobDescriptionText',
                'div[id="jobDescriptionText"]',
                '.jobsearch-jobDescriptionText',
                'div.jobsearch-JobComponent-description'
            ];

            const salarySelectors = [
                '#salaryInfoAndJobType span',
                'div[id="salaryInfoAndJobType"]',
                '.icl-u-xs-mr--xs.attribute_snippet',
                'span.salary',
                '.jobsearch-JobMetadataHeader-item'
            ];

            const jobTypeSelectors = [
                '#salaryInfoAndJobType div',
                '.jobsearch-JobMetadataHeader-item',
                'div.metadata'
            ];

            return {
                title: trySelectors(titleSelectors),
                company: trySelectors(companySelectors),
                location: trySelectors(locationSelectors),
                description: getAllText(descriptionSelectors),
                salary: trySelectors(salarySelectors),
                jobType: trySelectors(jobTypeSelectors),
                url: window.location.href
            };
        });

        console.log('[Job Scraper] Extracted:', {
            title: jobDetails.title,
            company: jobDetails.company,
            location: jobDetails.location,
            hasDescription: !!jobDetails.description,
            salary: jobDetails.salary
        });

        // Validate that we got at least the essential fields
        if (!jobDetails.title || !jobDetails.company) {
            // Take screenshot for debugging
            const debugPath = require('path').join(__dirname, 'uploads', `job_scrape_fail_${Date.now()}.png`);
            await page.screenshot({ path: debugPath, fullPage: true });
            console.log(`[Job Scraper] Screenshot saved: ${debugPath}`);

            throw new Error('Failed to extract essential job details (title or company missing)');
        }

        await browser.close();

        // Clean up and format the data
        return {
            title: jobDetails.title,
            company: jobDetails.company,
            location: jobDetails.location || 'Not specified',
            description: jobDetails.description || '',
            salary: jobDetails.salary || null,
            type: jobDetails.jobType || 'Full-time',
            link: url,
            platform: 'Indeed'
        };

    } catch (error) {
        await browser.close();
        console.error('[Job Scraper] Error:', error.message);
        throw error;
    }
}

module.exports = { scrapeJobDetails };
