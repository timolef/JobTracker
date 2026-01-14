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

    let jobs = [];
    let pageNum = 0;

    try {
        if (platform === 'Indeed') {
            const baseUrl = `https://fr.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;

            while (jobs.length < limit) {
                const startParam = pageNum * 10;
                const url = pageNum === 0 ? baseUrl : `${baseUrl}&start=${startParam}`;
                console.log(`[Indeed] Navigating to Page ${pageNum} (start=${startParam}). Current jobs: ${jobs.length}/${limit}`);

                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

                // Check for Cloudflare/Auth wall
                const title = await page.title();
                console.log(`[Indeed] Page Title: ${title}`);

                // Wait for results
                try {
                    // Check if there are no results or if we are blocked
                    const noResults = await page.$('.jobsearch-NoResult-Pane');
                    if (noResults) {
                        console.log('[Indeed] "No Result" pane detected. Stopping.');
                        break;
                    }
                    await page.waitForSelector('.job_seen_beacon', { timeout: 10000 });
                } catch (e) {
                    console.log('[Indeed] Wait for .job_seen_beacon failed. Checking for captcha/login...');
                    // Check for common error texts
                    const bodyText = await page.evaluate(() => document.body.innerText);
                    if (bodyText.includes('hCaptcha') || bodyText.includes('security check')) {
                        console.log('[Indeed] BLOCKED by security check.');
                    }
                    break;
                }

                const newJobs = await page.evaluate(() => {
                    const items = document.querySelectorAll('.job_seen_beacon');
                    return Array.from(items).map((item, id) => {
                        // ... (selectors)
                        const titleEl = item.querySelector('h2 span');
                        const companyEl = item.querySelector('[data-testid="company-name"]');
                        const locationEl = item.querySelector('[data-testid="text-location"]');
                        const linkEl = item.closest('a') || item.querySelector('h2 a');

                        return {
                            id: null, // Will assign unique ID later
                            title: titleEl ? titleEl.textContent.trim() : 'Unknown',
                            company: companyEl ? companyEl.textContent.trim() : 'Unknown',
                            location: locationEl ? locationEl.textContent.trim() : 'Unknown',
                            type: 'Full-time',
                            link: linkEl ? (linkEl.href.startsWith('/') ? 'https://fr.indeed.com' + linkEl.getAttribute('href') : linkEl.href) : '#',
                            platform: 'Indeed',
                            posted: 'Recently'
                        }
                    });
                });

                console.log(`[Indeed] Found ${newJobs.length} jobs on this page.`);

                if (newJobs.length === 0) {
                    console.log('[Indeed] 0 jobs found on page. Stopping.');
                    break;
                }

                // Add unique IDs to new jobs to avoid collisions
                newJobs.forEach((job, index) => {
                    job.id = `indeed-${pageNum}-${index}`;
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
                    console.log('LinkedIn: Wait failed');
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
    } finally {
        await browser.close();
    }

    // Trim to exact limit
    return jobs.slice(0, limit);
}

module.exports = { scrapeJobs };
