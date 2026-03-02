const cron = require('node-cron');
const { sendMonthlyEmails } = require('./mailer');

function startScheduler() {
  // Calculate next run time in Nigeria time for logging
  const now = new Date();
  const nigeriaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
  
  console.log(`🕐 Current Nigeria time: ${nigeriaTime.toLocaleString()}`);
  
  // Schedule for 1st of every month at 00:00 Nigeria time
  // Using 5 minutes past midnight to be safe (avoid any timing issues)
  cron.schedule('5 0 1 * *', async () => {
    // Double-check the actual Nigeria time when running
    const runTime = new Date();
    const nigeriaRunTime = new Date(runTime.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
    
    console.log('📅 Scheduled email sending started at (Nigeria time):', nigeriaRunTime.toLocaleString());
    console.log('📅 Server time:', runTime.toLocaleString());
    
    // Verify it's actually March 1st in Nigeria before sending
    if (nigeriaRunTime.getDate() === 1) {
      try {
        const result = await sendMonthlyEmails();
        console.log(`
✅ Scheduled email sending complete:
   Nigeria time: ${nigeriaRunTime.toLocaleString()}
   Server time: ${runTime.toLocaleString()}
   Successful: ${result.successful}
   Failed: ${result.failed}
        `);
      } catch (error) {
        console.error('❌ Scheduled email sending failed:', error);
      }
    } else {
      console.log('⚠️ Cron triggered but not March 1st in Nigeria. Skipping.');
    }
  }, {
    scheduled: true,
    timezone: "Africa/Lagos"
  });

  // Also log the next 5 scheduled runs for debugging
  console.log('⏰ Scheduler started - Will run on 1st of each month at 00:05 Nigeria time');
  
  // Manual test command (uncomment to test)
  // testSchedulerTiming();
}

// Optional: Test function to verify timezone calculation
function testSchedulerTiming() {
  console.log('\n🔧 Testing timezone calculations:');
  
  const testDates = [
    '2026-02-28T23:00:00Z',
    '2026-02-28T23:30:00Z',
    '2026-03-01T00:00:00Z',
    '2026-03-01T01:00:00Z'
  ];
  
  testDates.forEach(dateStr => {
    const utcDate = new Date(dateStr);
    const nigeriaDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
    
    console.log(`
UTC: ${utcDate.toISOString()}
Nigeria: ${nigeriaDate.toLocaleString()} (Day: ${nigeriaDate.getDate()})
Month: ${nigeriaDate.getMonth() + 1} - ${nigeriaDate.getDate() === 1 ? '✅ Should send' : '❌ Should NOT send'}
    `);
  });
}

module.exports = { startScheduler };
