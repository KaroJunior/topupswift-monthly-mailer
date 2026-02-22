require('dotenv').config();
const nodemailer = require('nodemailer');
const dns = require('dns'); // IMPORTANT: Add this at the top
const { 
  loadEmails, 
  removeEmail, 
  addUnsubscribed,
  saveLog
} = require('./firebase');
const { getCurrentMonthTemplate } = require('./templates/index');
const { rateLimit } = require('./utils/rateLimit');

// Force IPv4 for all DNS lookups - THIS IS THE KEY FIX
dns.setDefaultResultOrder('ipv4first');

// Create transporter with multiple fallback options
const createTransporter = (config) => {
  return nodemailer.createTransport(config);
};

// Primary transporter configuration (IPv4 forced)
const transporterConfig = {
  host: 'smtp.gmail.com',
  port: 587, // Changed from 465 to 587 (more reliable on Render)
  secure: false, // false for 587
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
  // Custom DNS lookup to force IPv4
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4, hints: dns.ADDRCONFIG }, (err, address, family) => {
      if (err) {
        console.error('DNS lookup failed, falling back to default:', err);
        // Fallback to default lookup
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
        // Last attempt failed, try alternative configuration
        console.log('Trying alternative SMTP configuration...');
        try {
          // Fallback to service-based configuration
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
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Run connection test (don't await - let it run in background)
testConnection();

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

  // Log the results
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