const cron = require('node-cron');
const { sendMonthlyEmails } = require('./mailer');

function startScheduler() {
  // Schedule for 1st of every month at 00:00
  // Cron: minute hour day-of-month month day-of-week
  // 0 0 1 * * = At 00:00 on day-of-month 1
  cron.schedule('0 0 1 * *', async () => {
    console.log('📅 Scheduled email sending started:', new Date().toLocaleString());
    
    try {
      const result = await sendMonthlyEmails();
      console.log(`
✅ Scheduled email sending complete:
   Time: ${new Date().toLocaleString()}
   Successful: ${result.successful}
   Failed: ${result.failed}
      `);
    } catch (error) {
      console.error('❌ Scheduled email sending failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Africa/Lagos" // Nigeria timezone (adjust as needed)
  });

  console.log('⏰ Scheduler started - Will run on 1st of each month at 00:00');
}

module.exports = { startScheduler };