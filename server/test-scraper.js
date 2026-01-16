const { scrapeJobs } = require('./scraper');

async function test() {
    console.log('--- STARTING SCRAPER TEST (Indeed) ---');
    try {
        const jobs = await scrapeJobs('Indeed', 'Vue', '', 5);
        console.log('--- TEST RESULTS ---');
        console.log(`Found ${jobs.length} jobs`);
        console.log(JSON.stringify(jobs, null, 2));
    } catch (err) {
        console.error('--- TEST FAILED ---');
        console.error(err);
    }
}

test();
