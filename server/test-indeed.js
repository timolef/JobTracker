/**
 * Test script for Indeed scraping
 * Usage: node server/test-indeed.js
 */

const { scrapeJobDetails } = require('./job-scraper');
const { scrapeJobs } = require('./scraper');

async function testJobDetails() {
    console.log('\n=== Testing Job Details Scraper ===\n');

    // Test URL - replace with a real Indeed job URL
    const testUrl = 'https://fr.indeed.com/viewjob?jk=test123';

    try {
        const result = await scrapeJobDetails(testUrl);
        console.log('\n✅ Success! Job Details:');
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

async function testJobSearch() {
    console.log('\n=== Testing Job Search Scraper ===\n');

    try {
        const jobs = await scrapeJobs('Indeed', 'développeur', 'Paris', 5);
        console.log(`\n✅ Success! Found ${jobs.length} jobs:`);
        jobs.forEach((job, index) => {
            console.log(`\n${index + 1}. ${job.title}`);
            console.log(`   Company: ${job.company}`);
            console.log(`   Location: ${job.location}`);
            console.log(`   Link: ${job.link}`);
        });
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

async function main() {
    console.log('🔍 Indeed Scraper Test Suite');
    console.log('============================\n');

    const args = process.argv.slice(2);
    const testType = args[0] || 'search';

    if (testType === 'details') {
        await testJobDetails();
    } else if (testType === 'search') {
        await testJobSearch();
    } else if (testType === 'both') {
        await testJobSearch();
        await testJobDetails();
    } else {
        console.log('Usage:');
        console.log('  node server/test-indeed.js search   - Test job search');
        console.log('  node server/test-indeed.js details  - Test job details');
        console.log('  node server/test-indeed.js both     - Test both');
    }

    console.log('\n✨ Test completed\n');
    process.exit(0);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
