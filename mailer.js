require('dotenv').config();
const nodemailer = require('nodemailer');
const { 
  loadEmails, 
  removeEmail, 
  addUnsubscribed,
  saveLog  // Only saveLog is needed, not loadLogs
} = require('./firebase');
const { getCurrentMonthTemplate } = require('./templates/index');
const { rateLimit } = require('./utils/rateLimit');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('✅ SMTP Server ready to send emails');
  }
});

// Update the handleUnsubscribe function with more logging
async function handleUnsubscribe(email) {
  console.log(`\n🚫 Handling unsubscribe for: ${email}`);
  
  try {
    // Clean email
    const cleanEmail = email.replace(/[<>]/g, '').trim().toLowerCase();
    console.log(`   Cleaned email: ${cleanEmail}`);
    
    // Remove from active list
    console.log(`   Attempting to remove from active list...`);
    const removeResult = await removeEmail(cleanEmail);
    console.log(`   Remove result: ${removeResult ? 'Success' : 'Not found or failed'}`);
    
    // Add to unsubscribed
    console.log(`   Adding to unsubscribed list...`);
    const addResult = await addUnsubscribed(cleanEmail);
    console.log(`   Add to unsubscribed result: ${addResult ? 'Success' : 'Failed'}`);
    
    console.log(`✅ Unsubscribe completed for: ${cleanEmail}`);
  
    // Send confirmation email
    try {
      const confirmOptions = {
        from: `"TopUpSwift" <${process.env.GMAIL_USER}>`,
        to: cleanEmail,
        subject: "You've been unsubscribed from TopUpSwift emails",
        html: `
          <html>
            <body style="font-family: Arial, sans-serif;">
              <h3>Unsubscribe Confirmed</h3>
              <p>You've been successfully removed from TopUpSwift's monthly email list.</p>
              <p>You will no longer receive "Happy New Month" emails from us.</p>
              <p>If this was a mistake or you'd like to resubscribe, please contact us at topupswiftofficial@gmail.com</p>
              <hr>
              <p>Thank you for your time with TopUpSwift.</p>
            </body>
          </html>
        `
      };
      
      await transporter.sendMail(confirmOptions);
      console.log(`   ✅ Sent unsubscribe confirmation email`);
    } catch (emailError) {
      console.error(`   ❌ Failed to send confirmation email:`, emailError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unsubscribe error:', error);
    return false;
  }
}

// Send monthly emails
async function sendMonthlyEmails() {
  const emails = await loadEmails();
  const template = getCurrentMonthTemplate();
  const results = {
    successful: 0,
    failed: 0,
    failedEmails: []
  };

  console.log(`📨 Starting to send ${emails.length} emails for ${template.month}`);

  for (const email of emails) {
    try {
      // Rate limiting - 1 second between emails
      await rateLimit();

      const mailOptions = {
        from: `"TopUpSwift" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: template.subject,
        html: template.html
      };

      await transporter.sendMail(mailOptions);
      results.successful++;
      console.log(`✅ Sent to: ${email}`);

    } catch (error) {
      results.failed++;
      results.failedEmails.push(email);
      console.error(`❌ Failed for ${email}:`, error.message);
    }
  }

  // Log the results - FIXED: Use saveLog directly, no need to load existing logs
  const logEntry = {
    timestamp: new Date().toISOString(),
    month: template.month,
    successful: results.successful,
    failed: results.failed,
    failedEmails: results.failedEmails
  };

  // Save directly to Firebase
  await saveLog(logEntry);

  console.log(`
📊 Email Campaign Complete:
   Month: ${template.month}
   Successful: ${results.successful}
   Failed: ${results.failed}
  `);

  return results;
}

module.exports = {
  sendMonthlyEmails,
  handleUnsubscribe
};