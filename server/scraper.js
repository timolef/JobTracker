const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function scrapeJobs(platform, keyword, location, limit = 15) {
    console.log(`[Scraper] Starting ${platform} search for "${keyword}" in "${location}" (Goal: ${limit} jobs)`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let jobs = [];
    let pageNum = 0;

    try {
        if (platform === 'Indeed') {
            const isFrance = location.toLowerCase().includes('france') || location.toLowerCase().includes('paris') || location.toLowerCase().includes('lyon');
            const domain = isFrance ? 'fr.indeed.com' : 'www.indeed.com';
            const baseUrl = `https://${domain}/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;

            while (jobs.length < limit) {
                const startParam = pageNum * 10;
                const url = pageNum === 0 ? baseUrl : `${baseUrl}&start=${startParam}`;
                console.log(`[Indeed] Navigating to Page ${pageNum}: ${url}`);
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

                // Try to close potential popups
                try {
                    const closeButtons = await page.$$('button[aria-label="close"], .icl-CloseButton, .popover-x-button-close');
                    for (const btn of closeButtons) await btn.click();

                    const cookieButton = await page.$('#onetrust-accept-btn-handler, #accept-recommended-btn-handler');
                    if (cookieButton) await cookieButton.click();
                } catch (e) { }

                // Check for Cloudflare/Auth wall
                const title = await page.title();
                const bodyLength = await page.evaluate(() => document.body.innerText.length);
                console.log(`[Indeed] Title: "${title}" | Body Length: ${bodyLength}`);

                // Wait for results
                try {
                    await page.waitForSelector('.job_seen_beacon, .resultConfig, #mosaic-provider-jobcards, .tapItem, [id^="job_"]', { timeout: 15000 });
                } catch (e) {
                    console.log('[Indeed] No job elements found after 15s.');
                    const bodyText = await page.evaluate(() => document.body.innerText);
                    if (bodyText.includes('hCaptcha') || bodyText.includes('security check')) {
                        console.log('[Indeed] BLOCKED by security check.');
                    }
                }

                const newJobs = await page.evaluate(() => {
                    // Try multiple possible selectors for Indeed
                    const items = document.querySelectorAll('.job_seen_beacon, .tapItem, [id^="job_"]');
                    return Array.from(items).map((item) => {
                        const titleEl = item.querySelector('h2 span') || item.querySelector('h2 a') || item.querySelector('.jobTitle');
                        const companyEl = item.querySelector('[data-testid="company-name"]') || item.querySelector('.companyName');
                        const locationEl = item.querySelector('[data-testid="text-location"]') || item.querySelector('.companyLocation');
                        const linkEl = item.querySelector('a[id^="job_"]') || item.closest('a') || item.querySelector('h2 a');

                        return {
                            id: null, // Will assign unique ID later
                            title: titleEl ? titleEl.textContent.trim() : 'Unknown',
                            company: companyEl ? companyEl.textContent.trim() : 'Unknown',
                            location: locationEl ? locationEl.textContent.trim() : 'Unknown',
                            type: 'Full-time',
                            link: linkEl ? (linkEl.href.startsWith('/') ? window.location.origin + linkEl.getAttribute('href') : linkEl.href) : '#',
                            platform: 'Indeed',
                            posted: 'Recently'
                        }
                    });
                });

                // Deduplicate by link
                const uniqueNewJobs = [];
                const seenLinks = new Set();

                newJobs.forEach(job => {
                    if (job.link && job.link !== '#' && !seenLinks.has(job.link)) {
                        seenLinks.add(job.link);
                        uniqueNewJobs.push(job);
                    }
                });

                console.log(`[Indeed] Found ${uniqueNewJobs.length} unique jobs on this page.`);

                if (uniqueNewJobs.length === 0) {
                    console.log('[Indeed] 0 unique jobs found on page. Taking diagnostic screenshot.');
                    const debugPath = require('path').join(__dirname, 'uploads', `debug_indeed_empty.png`);
                    await page.screenshot({ path: debugPath });
                    break;
                }

                // Add unique IDs
                uniqueNewJobs.forEach((job, index) => {
                    job.id = `indeed-${pageNum}-${index}-${Date.now()}`;
                    jobs.push(job);
                });

                console.log(`[Indeed] Total jobs collected: ${jobs.length}`);

                if (jobs.length >= limit) break;

                pageNum++;
                // Small delay to be nice
                await new Promise(r => setTimeout(r, 2000));
            }

        } else if (platform === 'Welcome to the Jungle') {
            // WTTJ Pagination logic
            // URL param &page=X
            const baseUrl = `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(keyword)}&groupBy=job&sortBy=mostRecent&aroundQuery=${encodeURIComponent(location)}`;

            while (jobs.length < limit) {
                const url = `${baseUrl}&page=${pageNum + 1}`;
                console.log(`Navigating to WTTJ Page ${pageNum + 1}`);
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

                try {
                    await page.waitForSelector('li article', { timeout: 10000 });
                } catch (e) {
                    console.log('WTTJ: No results on this page');
                    break;
                }

                const newJobs = await page.evaluate((pageIdx) => {
                    const items = document.querySelectorAll('li article');
                    return Array.from(items).map((item, id) => {
                        const titleEl = item.querySelector('h3') || item.querySelector('h4');
                        const companyEl = item.querySelector('span');
                        const linkEl = item.closest('a') || item.querySelector('a');
                        const metadataEls = item.querySelectorAll('div > span');

                        let loc = 'France';
                        let type = 'Full-time';
                        if (metadataEls.length > 0) loc = metadataEls[0]?.textContent;
                        if (metadataEls.length > 1) type = metadataEls[1]?.textContent;

                        return {
                            id: `wttj-${pageIdx}-${id}`,
                            title: titleEl ? titleEl.textContent.trim() : 'Unknown Position',
                            company: companyEl ? companyEl.textContent.trim() : 'Unknown Company',
                            location: loc,
                            type: type,
                            link: linkEl ? linkEl.href : '#',
                            platform: 'WTTJ',
                            posted: 'Recently'
                        };
                    });
                }, pageNum);

                if (newJobs.length === 0) break;
                jobs.push(...newJobs);

                if (jobs.length >= limit) break;
                pageNum++;
            }

        } else if (platform === 'LinkedIn') {
            // LinkedIn Pagination (simulated scroll or start param)
            // LinkedIn public search uses &start=25
            const baseUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;

            while (jobs.length < limit) {
                const url = pageNum === 0 ? baseUrl : `${baseUrl}&start=${pageNum * 25}`;
                console.log(`Navigating to LinkedIn Page ${pageNum + 1}`);
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

                try {
                    await page.waitForSelector('.jobs-search__results-list li', { timeout: 10000 });
                } catch (e) {
                    console.log(`LinkedIn: No results found at ${url}`);
                    break;
                }

                const newJobs = await page.evaluate((pageIdx) => {
                    const items = document.querySelectorAll('.jobs-search__results-list li');
                    return Array.from(items).map((item, id) => {
                        const titleEl = item.querySelector('h3.base-search-card__title');
                        const companyEl = item.querySelector('h4.base-search-card__subtitle');
                        const locationEl = item.querySelector('.job-search-card__location');
                        const linkEl = item.querySelector('a.base-card__full-link');
                        const timeEl = item.querySelector('time');

                        return {
                            id: `li-${pageIdx}-${id}`,
                            title: titleEl ? titleEl.textContent.trim() : 'Unknown Role',
                            company: companyEl ? companyEl.textContent.trim() : 'Unknown Company',
                            location: locationEl ? locationEl.textContent.trim() : 'Remote/Unknown',
                            type: 'Full-time',
                            link: linkEl ? linkEl.href : '#',
                            platform: 'LinkedIn',
                            posted: timeEl ? timeEl.textContent.trim() : 'Recently'
                        };
                    });
                }, pageNum);

                if (newJobs.length === 0) break;
                jobs.push(...newJobs);

                if (jobs.length >= limit) break;
                pageNum++;
            }
        } else {
            console.log(`Platform ${platform} not implemented yet`);
        }

    } catch (error) {
        console.error('Scraping Logic Error:', error);
        try {
            const debugPath = require('path').join(__dirname, 'uploads', `debug_${platform.replace(/\s+/g, '_')}.png`);
            await page.screenshot({ path: debugPath });
            console.log(`[Scraper] Debug screenshot saved to ${debugPath}`);
        } catch (screenshotError) {
            console.error('[Scraper] Failed to take debug screenshot:', screenshotError);
        }
    } finally {
        await browser.close();
    }

    // Trim to exact limit
    if (jobs.length === 0) {
        console.warn(`[Scraper] FINAL RESULT: 0 jobs found for ${platform}.`);
    } else {
        console.log(`[Scraper] FINAL RESULT: Found ${jobs.length} jobs.`);
    }
    return jobs.slice(0, limit);
}

module.exports = { scrapeJobs };
