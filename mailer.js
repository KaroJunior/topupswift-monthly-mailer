require('dotenv').config();
const nodemailer = require('nodemailer');
const { 
  loadEmails, 
  removeEmail, 
  addUnsubscribed,
  saveLog
} = require('./firebase');
const { getCurrentMonthTemplate } = require('./templates/index');
const { rateLimit } = require('./utils/rateLimit');

// We are using the 'service' property which tells Nodemailer 
// exactly how to handle Gmail without manual host/port guesswork.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  // Increase timeouts significantly for cloud environments
  connectionTimeout: 40000, 
  greetingTimeout: 40000,
  socketTimeout: 40000
});

// Silent verification on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Mailer: Not ready. Check App Password.');
  } else {
    console.log('✅ Mailer: Ready');
  }
});

async function handleUnsubscribe(email) {
  try {
    const cleanEmail = email.replace(/[<>]/g, '').trim().toLowerCase();
    await removeEmail(cleanEmail);
    await addUnsubscribed(cleanEmail);
    
    await transporter.sendMail({
      from: `"TopUpSwift" <${process.env.GMAIL_USER}>`,
      to: cleanEmail,
      subject: "Unsubscribe Confirmed",
      html: `<p>You have been removed from the list.</p>`
    });
    return true;
  } catch (err) {
    return false;
  }
}

async function sendMonthlyEmails() {
  const emails = await loadEmails();
  const template = getCurrentMonthTemplate();
  const results = { successful: 0, failed: 0, failedEmails: [] };

  console.log(`📨 Sending to ${emails.length} contacts...`);

  for (const email of emails) {
    try {
      await rateLimit(); 
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
      console.error(`❌ ${email}: ${error.message}`);
    }
  }

  await saveLog({
    timestamp: new Date().toISOString(),
    month: template.month,
    successful: results.successful,
    failed: results.failed,
    failedEmails: results.failedEmails
  });

  return results;
}

module.exports = { sendMonthlyEmails, handleUnsubscribe };
