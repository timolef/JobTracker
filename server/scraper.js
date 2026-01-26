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
            const isFrance = location.toLowerCase().includes('france') || location.toLowerCase().includes('paris') || location.toLowerCase().includes('lyon') || location.toLowerCase().includes('lille');
            const domain = isFrance ? 'fr.indeed.com' : 'www.indeed.com';
            const pathName = isFrance ? 'emplois' : 'jobs';
            const baseUrl = `https://${domain}/${pathName}?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}&from=searchOnHP`;

            // Selector tracking for diagnostics
            const selectorStats = {
                jobCard: {},
                title: {},
                company: {},
                location: {},
                link: {}
            };

            while (jobs.length < limit) {
                const startParam = pageNum * 10;
                const url = pageNum === 0 ? baseUrl : `${baseUrl}&start=${startParam}`;
                console.log(`[Indeed] Navigating to Page ${pageNum}: ${url}`);

                try {
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
                } catch (gotoError) {
                    console.log(`[Indeed] Navigation error: ${gotoError.message}. Retrying with domcontentloaded.`);
                    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                }

                await new Promise(r => setTimeout(r, 4000));

                // Close popups
                try {
                    const popupSelectors = [
                        'button[aria-label="close"]',
                        '.icl-CloseButton',
                        '#close-popup',
                        '.popover-x-button-close'
                    ];
                    for (const sel of popupSelectors) {
                        const btn = await page.$(sel);
                        if (btn) {
                            const isVisible = await btn.evaluate(el => {
                                const rect = el.getBoundingClientRect();
                                return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
                            });
                            if (isVisible) await btn.click();
                        }
                    }

                    const cookieButton = await page.$('#onetrust-accept-btn-handler, #accept-recommended-btn-handler');
                    if (cookieButton) await cookieButton.click();
                } catch (e) { }

                const title = await page.title();
                console.log(`[Indeed] Page Title: "${title}"`);

                // Wait for results with multiple fallback selectors
                const jobCardSelectors = [
                    '.job_seen_beacon',
                    '.tapItem',
                    '[id^="job_"]',
                    '.resultContent',
                    '#mosaic-provider-jobcards li',
                    '.slider_container .slider_item',
                    'div[data-jk]'
                ];

                let foundSelector = null;
                for (const selector of jobCardSelectors) {
                    try {
                        await page.waitForSelector(selector, { timeout: 5000 });
                        foundSelector = selector;
                        console.log(`[Indeed] ✓ Found jobs using selector: "${selector}"`);
                        break;
                    } catch (e) {
                        // Try next selector
                    }
                }

                if (!foundSelector) {
                    console.log('[Indeed] ⚠ No job elements found with any selector.');
                    const bodyText = await page.evaluate(() => document.body.innerText);
                    if (bodyText.includes('hCaptcha') || bodyText.includes('security check')) {
                        console.log('[Indeed] 🚫 BLOCKED by security check.');
                    }

                    // Save diagnostic info
                    const debugPath = require('path').join(__dirname, 'uploads', `indeed_fail_${Date.now()}.png`);
                    await page.screenshot({ path: debugPath, fullPage: true });

                    const htmlPath = require('path').join(__dirname, 'uploads', `indeed_fail_${Date.now()}.html`);
                    const html = await page.content();
                    require('fs').writeFileSync(htmlPath, html);

                    console.log(`[Indeed] 📸 Debug files saved: ${debugPath} and ${htmlPath}`);
                    break;
                }

                // Extract jobs with fallback selectors
                const newJobs = await page.evaluate((jobCardSelectors) => {
                    // Helper function to try multiple selectors
                    function trySelectors(element, selectors) {
                        for (const selector of selectors) {
                            const found = element.querySelector(selector);
                            if (found && found.textContent.trim()) {
                                return { element: found, selector };
                            }
                        }
                        return { element: null, selector: null };
                    }

                    // Find all job cards using any of the selectors
                    let items = [];
                    for (const selector of jobCardSelectors) {
                        const found = document.querySelectorAll(selector);
                        if (found.length > 0) {
                            items = Array.from(found);
                            break;
                        }
                    }

                    const titleSelectors = [
                        'h2 span[title]',
                        'h2 span',
                        'h2 a',
                        '.jobTitle span',
                        '.jobTitle',
                        '[id^="jobTitle"]',
                        'h2.jobTitle',
                        '.job-title',
                        'a[data-jk] h2'
                    ];

                    const companySelectors = [
                        '[data-testid="company-name"]',
                        '.companyName',
                        '.company_location .companyName',
                        'span.companyName',
                        '[data-testid="company-name"] span',
                        '.company',
                        'div[data-testid="company-name"]'
                    ];

                    const locationSelectors = [
                        '[data-testid="text-location"]',
                        '.companyLocation',
                        '.location',
                        'div[data-testid="text-location"]',
                        '.company_location .companyLocation',
                        'span.location'
                    ];

                    const linkSelectors = [
                        'a[id^="job_"]',
                        'h2 a',
                        'a[data-jk]',
                        '.jcs-JobTitle',
                        'a.tapItem',
                        'a.resultContent'
                    ];

                    return items.map((item) => {
                        const titleResult = trySelectors(item, titleSelectors);
                        const companyResult = trySelectors(item, companySelectors);
                        const locationResult = trySelectors(item, locationSelectors);

                        let linkEl = null;
                        let linkSelector = null;
                        for (const selector of linkSelectors) {
                            linkEl = item.querySelector(selector);
                            if (linkEl && linkEl.href) {
                                linkSelector = selector;
                                break;
                            }
                        }
                        if (!linkEl) {
                            linkEl = item.closest('a') || item.querySelector('a');
                            linkSelector = 'fallback-closest-a';
                        }

                        const title = titleResult.element ? titleResult.element.textContent.trim().replace(/^new\s+/i, '') : null;
                        const company = companyResult.element ? companyResult.element.textContent.trim() : null;
                        const location = locationResult.element ? locationResult.element.textContent.trim() : null;
                        const link = linkEl ? (linkEl.href.startsWith('/') ? window.location.origin + linkEl.getAttribute('href') : linkEl.href) : null;

                        // Return with selector info for diagnostics
                        return {
                            id: null,
                            title: title || 'Unknown',
                            company: company || 'Unknown',
                            location: location || 'Unknown',
                            type: 'Full-time',
                            link: link || '#',
                            platform: 'Indeed',
                            posted: 'Recently',
                            _selectorUsed: {
                                title: titleResult.selector,
                                company: companyResult.selector,
                                location: locationResult.selector,
                                link: linkSelector
                            }
                        };
                    });
                }, jobCardSelectors);

                // Track which selectors worked
                newJobs.forEach(job => {
                    if (job._selectorUsed) {
                        Object.keys(job._selectorUsed).forEach(field => {
                            const selector = job._selectorUsed[field];
                            if (selector) {
                                selectorStats[field][selector] = (selectorStats[field][selector] || 0) + 1;
                            }
                        });
                    }
                });

                // Filter and deduplicate
                const uniqueNewJobs = [];
                const currentLinks = new Set(jobs.map(j => j.link));

                newJobs.forEach(job => {
                    // Validate job has minimum required fields
                    const isValid = job.title !== 'Unknown' &&
                        job.company !== 'Unknown' &&
                        job.link &&
                        job.link !== '#' &&
                        !job.link.includes('pagead') && // Filter ads
                        !currentLinks.has(job.link);

                    if (isValid) {
                        delete job._selectorUsed; // Remove diagnostic data
                        currentLinks.add(job.link);
                        uniqueNewJobs.push(job);
                    }
                });

                console.log(`[Indeed] Found ${uniqueNewJobs.length} valid unique jobs on page ${pageNum}.`);

                // Log selector statistics
                console.log('[Indeed] Selector usage:', JSON.stringify(selectorStats, null, 2));

                if (uniqueNewJobs.length === 0) {
                    console.log('[Indeed] No valid jobs found, stopping pagination.');
                    break;
                }

                // Add unique IDs
                uniqueNewJobs.forEach((job, index) => {
                    job.id = `indeed-${pageNum}-${index}-${Date.now()}`;
                    jobs.push(job);
                });

                console.log(`[Indeed] Total jobs collected so far: ${jobs.length}`);

                if (jobs.length >= limit) break;

                pageNum++;
                await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
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
                        const linkEl = item.closest('a') || item.querySelector('a') || item.parentElement.closest('a');
                        const metadataEls = item.querySelectorAll('div > span');

                        let loc = 'France';
                        let type = 'Full-time';
                        if (metadataEls.length > 0) loc = metadataEls[0]?.textContent;
                        if (metadataEls.length > 1) type = metadataEls[1]?.textContent;

                        return {
                            id: null, // assigned below
                            title: titleEl ? titleEl.textContent.trim() : 'Unknown Position',
                            company: companyEl ? companyEl.textContent.trim() : 'Unknown Company',
                            location: loc,
                            type: type,
                            link: linkEl ? (linkEl.href.startsWith('/') ? 'https://www.welcometothejungle.com' + linkEl.getAttribute('href') : linkEl.href) : '#',
                            platform: 'WTTJ',
                            posted: 'Recently'
                        };
                    });
                }, pageNum);

                if (newJobs.length === 0) {
                    console.log('[WTTJ] No more jobs found on this page.');
                    break;
                }

                // Deduplicate by link
                const uniqueNewJobs = [];
                const currentLinks = new Set(jobs.map(j => j.link));

                newJobs.forEach((job, idx) => {
                    if (job.link && job.link !== '#' && !currentLinks.has(job.link)) {
                        job.id = `wttj-${pageNum}-${idx}-${Date.now()}`;
                        uniqueNewJobs.push(job);
                        currentLinks.add(job.link);
                    }
                });

                console.log(`[WTTJ] Found ${uniqueNewJobs.length} new unique jobs on page ${pageNum + 1}`);
                jobs.push(...uniqueNewJobs);

                if (jobs.length >= limit) break;
                pageNum++;
                await new Promise(r => setTimeout(r, 1500));
            }

        } else if (platform === 'LinkedIn') {
            // LinkedIn Pagination (simulated scroll or start param)
            // LinkedIn public search uses &start=25
            const baseUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;

            while (jobs.length < limit) {
                const url = pageNum === 0 ? baseUrl : `${baseUrl}&start=${pageNum * 25}`;
                console.log(`[LinkedIn] Navigating to Page ${pageNum + 1}: ${url}`);
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

                try {
                    await page.waitForSelector('.jobs-search__results-list li', { timeout: 10000 });
                } catch (e) {
                    console.log(`[LinkedIn] No results found at ${url}`);
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
                            id: `li-${pageIdx}-${id}-${Date.now()}`,
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

                if (newJobs.length === 0) {
                    console.log('[LinkedIn] No more results found.');
                    break;
                }
                jobs.push(...newJobs);

                if (jobs.length >= limit) break;
                pageNum++;
            }
        } else if (platform === 'HelloWork') {
            const baseUrl = `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;

            while (jobs.length < limit) {
                const url = pageNum === 0 ? baseUrl : `${baseUrl}&p=${pageNum + 1}`;
                console.log(`[HelloWork] Navigating to Page ${pageNum + 1}: ${url}`);

                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

                try {
                    await page.waitForSelector('ul.tw-grid li h3', { timeout: 10000 });
                } catch (e) {
                    console.log('[HelloWork] No results found on this page.');
                    break;
                }

                const newJobs = await page.evaluate((pageIdx) => {
                    // HelloWork list items
                    const methods = document.querySelectorAll('ul.tw-grid li');
                    return Array.from(methods).map((item, id) => {
                        // Skip if not a job card (e.g. ads)
                        const titleEl = item.querySelector('h3 p.tw-typo-l') || item.querySelector('h3');
                        if (!titleEl) return null;

                        const companyEl = item.querySelector('p.tw-typo-s');
                        const locationEl = item.querySelector('.tw-readonly') || item.querySelector('span[class*="location"]');
                        const linkEl = item.querySelector('a.tw-forwarder') || item.querySelector('a[href*="/emploi/"]');

                        return {
                            id: `hw-${pageIdx}-${id}-${Date.now()}`,
                            title: titleEl ? titleEl.textContent.trim() : 'Unknown Role',
                            company: companyEl ? companyEl.textContent.trim() : 'Unknown Company',
                            location: locationEl ? locationEl.textContent.trim() : 'France',
                            type: 'Full-time',
                            link: linkEl ? linkEl.href : '#',
                            platform: 'HelloWork',
                            posted: 'Recently'
                        };
                    }).filter(Boolean);
                }, pageNum);

                if (newJobs.length === 0) break;

                // Deduplicate
                const currentLinks = new Set(jobs.map(j => j.link));
                newJobs.forEach(job => {
                    if (job.link && job.link !== '#' && !currentLinks.has(job.link)) {
                        jobs.push(job);
                        currentLinks.add(job.link);
                    }
                });

                if (jobs.length >= limit) break;
                pageNum++;
                await new Promise(r => setTimeout(r, 1000));
            }

        } else if (platform === 'Apec') {
            // Apec Search
            // https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=Developpeur&lieux=75
            const baseUrl = `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${encodeURIComponent(keyword)}&lieux=${encodeURIComponent(location)}`;

            console.log(`[Apec] Navigating to: ${baseUrl}`);
            await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60000 });

            try {
                // Apec loads via API, wait for custom component
                await page.waitForSelector('apec-recherche-resultat', { timeout: 15000 });

                // Allow time for list to populate fully
                await new Promise(r => setTimeout(r, 2000));

                // Scroll to load more if needed (Apec uses infinite scroll or load more button, but for first batch it's fine)
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await new Promise(r => setTimeout(r, 1000));

                const scrapedJobs = await page.evaluate(() => {
                    const cards = document.querySelectorAll('apec-recherche-resultat');
                    return Array.from(cards).map((card, id) => {
                        // The card is usually wrapped in an anchor or has an anchor inside
                        const linkContainer = card.closest('a') || card.querySelector('a');
                        const titleEl = card.querySelector('h2');
                        const companyEl = card.querySelector('p'); // The first paragraph is usually the company text
                        const details = card.querySelectorAll('li'); // Salary, Contract, Location, Date

                        let location = 'France';
                        if (details.length >= 3) {
                            location = details[2].textContent.trim();
                        }

                        return {
                            id: `apec-${id}-${Date.now()}`,
                            title: titleEl ? titleEl.textContent.trim() : 'Unknown Role',
                            company: companyEl ? companyEl.textContent.trim() : 'Unknown Company',
                            location: location,
                            type: details.length >= 2 ? details[1].textContent.trim() : 'Full-time',
                            link: linkContainer ? linkContainer.href : '#',
                            platform: 'Apec',
                            posted: details.length >= 4 ? details[3].textContent.trim() : 'Recently'
                        };
                    });
                });

                jobs.push(...scrapedJobs);

            } catch (e) {
                console.log('[Apec] Error scraping or no results:', e.message);
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
