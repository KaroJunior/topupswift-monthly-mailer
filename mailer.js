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

// Force IPv4 for all DNS lookups
dns.setDefaultResultOrder('ipv4first');

// Create transporter with multiple fallback options
const createTransporter = (config) => {
  return nodemailer.createTransport(config);
};

// Primary transporter configuration (IPv4 forced)
const transporterConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  requireTLS: true,
  connectionTimeout: 30000,
  socketTimeout: 30000,
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4, hints: dns.ADDRCONFIG }, (err, address, family) => {
      if (err) {
        console.error('DNS lookup failed, falling back to default:', err);
        dns.lookup(hostname, options, callback);
      } else {
        callback(null, address, family);
      }
    });
  }
};

let transporter = createTransporter(transporterConfig);

// Test connection with retry logic
async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await transporter.verify();
      console.log('✅ SMTP Server ready to send emails');
      return true;
    } catch (error) {
      console.log(`SMTP connection attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        console.log('Trying alternative SMTP configuration...');
        try {
          transporter = createTransporter({
            service: 'gmail',
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD
            },
            connectionTimeout: 30000,
            socketTimeout: 30000
          });
          
          await transporter.verify();
          console.log('✅ Alternative SMTP configuration working!');
          return true;
        } catch (altError) {
          console.error('❌ All SMTP configurations failed:', altError.message);
          return false;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

testConnection();

async function handleUnsubscribe(email) {
  console.log(`\n🚫 Handling unsubscribe for: ${email}`);
  
  try {
    const cleanEmail = email.replace(/[<>]/g, '').trim().toLowerCase();
    console.log(`   Cleaned email: ${cleanEmail}`);
    
    console.log(`   Attempting to remove from active list...`);
    const removeResult = await removeEmail(cleanEmail);
    console.log(`   Remove result: ${removeResult ? 'Success' : 'Not found or failed'}`);
    
    console.log(`   Adding to unsubscribed list...`);
    const addResult = await addUnsubscribed(cleanEmail);
    console.log(`   Add to unsubscribed result: ${addResult ? 'Success' : 'Failed'}`);
    
    console.log(`✅ Unsubscribe completed for: ${cleanEmail}`);
  
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

  const logEntry = {
    timestamp: new Date().toISOString(),
    month: template.month,
    successful: results.successful,
    failed: results.failed,
    failedEmails: results.failedEmails
  };

  await saveLog(logEntry);

  console.log(`
📊 Email Campaign Complete:
   Month: ${template.month}
   Successful: ${results.successful}
   Failed: ${results.failed}
  `);

  return results;
}

// Test email function - sends to ADMIN_EMAIL from .env
async function sendTestEmail() {
  // FIXED: Use ADMIN_EMAIL from .env directly
  const adminEmail = process.env.ADMIN_EMAIL;
  const template = getCurrentMonthTemplate();
  
  console.log(`📨 Sending test email to admin: ${adminEmail}`);
  console.log(`📅 Test email would be for month: ${template.month}`);
  
  if (!adminEmail) {
    console.error('❌ ADMIN_EMAIL not set in .env file!');
    return false;
  }
  
  try {
    const mailOptions = {
      from: `"TopUpSwift" <${process.env.GMAIL_USER}>`,
      to: adminEmail,  // Now using ADMIN_EMAIL directly
      subject: `[TEST] ${template.subject}`,
      html: `
        <div style="border: 3px solid #ff6b6b; padding: 15px; background-color: #fff5f5;">
          <p style="color: #ff0000; font-weight: bold;">⚠️ THIS IS A TEST EMAIL ⚠️</p>
          <p>This is a test of the monthly email template for <strong>${template.month}</strong>.</p>
          <p>If you received this, your email system is working correctly!</p>
          <hr style="border: 1px solid #ddd; margin: 15px 0;">
          ${template.html}
          <hr style="border: 1px solid #ddd; margin: 15px 0;">
          <p style="font-size: 12px; color: #999;">This test email was sent to the admin only. No users were notified.</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Test email sent to admin: ${adminEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Test email failed:', error);
    return false;
  }
}

module.exports = {
  sendMonthlyEmails,
  handleUnsubscribe,
  sendTestEmail  
};