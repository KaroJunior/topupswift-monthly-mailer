const cron = require('node-cron');
const { sendMonthlyEmails } = require('./mailer');
const { getNigeriaTime } = require('./utils/getNigeriaTime');

function startScheduler() {
  // Log current Nigeria time
  const nigeria = getNigeriaTime();
  console.log(`🕐 Current Nigeria time: ${nigeria.date.toLocaleString()}`);
  console.log(`🕐 Current server time: ${new Date().toLocaleString()}`);
  console.log(`📅 Current month in Nigeria: ${nigeria.monthName}`);
  
  // Schedule for 1st of every month at 00:01 Nigeria time (1 minute past to be safe)
  cron.schedule('1 0 1 * *', async () => {
    // Double-check Nigeria time when running
    const runNigeria = getNigeriaTime();
    
    console.log('📅 Cron triggered at Nigeria time:', runNigeria.date.toLocaleString());
    console.log('📅 Cron triggered at server time:', new Date().toLocaleString());
    
    // Only proceed if it's actually the 1st in Nigeria
    if (runNigeria.isFirstDayOfMonth) {
      console.log(`✅ It's ${runNigeria.monthName} 1st. Sending emails...`);
      
      try {
        const result = await sendMonthlyEmails();
        console.log(`
✅ Scheduled email sending complete:
   Nigeria time: ${runNigeria.date.toLocaleString()}
   Month sent: ${runNigeria.monthName}
   Successful: ${result.successful}
   Failed: ${result.failed}
        `);
      } catch (error) {
        console.error('❌ Scheduled email sending failed:', error);
      }
    } else {
      console.log(`⚠️ Cron ran but it's not the 1st in Nigeria. It's ${runNigeria.monthName} ${runNigeria.day}. Skipping.`);
    }
  }, {
    scheduled: true,
    timezone: "Africa/Lagos"
  });

  console.log('⏰ Scheduler started - Will run at 00:01 Nigeria time on the 1st of each month');
}

module.exports = { startScheduler };