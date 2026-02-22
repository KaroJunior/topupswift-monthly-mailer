require('dotenv').config();
const nodemailer = require('nodemailer');
const dns = require('dns');
const { 
  loadEmails, 
  removeEmail, 
  addUnsubscribed,
  saveLog
} = require('./firebase');
const { getCurrentMonthTemplate } = require('./templates/index');
const { rateLimit } = require('./utils/rateLimit');

// Force IPv4 to prevent connection timeouts on cloud hosts like Render
dns.setDefaultResultOrder('ipv4first');

// Simplified Transporter using the 'gmail' service helper
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  pool: true, // Uses a pooled connection for efficiency
  maxConnections: 3,
  connectionTimeout: 10000, 
});

// verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ SMTP Verification failed:', error.message);
  } else {
    console.log('✅ SMTP Server Ready');
  }
});

async function handleUnsubscribe(email) {
  try {
    const cleanEmail = email.replace(/[<>]/g, '').trim().toLowerCase();
    await removeEmail(cleanEmail);
    await addUnsubscribed(cleanEmail);
    
    const confirmOptions = {
      from: `"TopUpSwift" <${process.env.GMAIL_USER}>`,
      to: cleanEmail,
      subject: "Unsubscribe Confirmed",
      html: `<p>You've been successfully removed from TopUpSwift's monthly list.</p>`
    };
    
    await transporter.sendMail(confirmOptions);
    console.log(`🚫 Unsubscribed: ${cleanEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Unsubscribe error:', error.message);
    return false;
  }
}

async function sendMonthlyEmails() {
  const emails = await loadEmails();
  const template = getCurrentMonthTemplate();
  const results = { successful: 0, failed: 0, failedEmails: [] };

  console.log(`📨 Sending ${emails.length} emails for ${template.month}...`);

  for (const email of emails) {
    try {
      await rateLimit(); // Keep your rate limit logic

      await transporter.sendMail({
        from: `"TopUpSwift" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: template.subject,
        html: template.html
      });

      results.successful++;
    } catch (error) {
      results.failed++;
      results.failedEmails.push(email);
      console.error(`❌ Failed for ${email}:`, error.message);
    }
  }

  await saveLog({
    timestamp: new Date().toISOString(),
    month: template.month,
    successful: results.successful,
    failed: results.failed,
    failedEmails: results.failedEmails
  });

  console.log(`📊 Result: ${results.successful} Sent, ${results.failed} Failed.`);
  return results;
}

module.exports = { sendMonthlyEmails, handleUnsubscribe };
