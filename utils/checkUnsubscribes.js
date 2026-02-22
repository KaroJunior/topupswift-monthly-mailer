const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { handleUnsubscribe } = require('../mailer');
require('dotenv').config();

const imapConfig = {
  user: process.env.GMAIL_USER,
  password: process.env.GMAIL_APP_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  authTimeout: 30000,
  debug: console.log // This will show IMAP debug info
};

function checkUnsubscribeReplies() {
  return new Promise((resolve, reject) => {
    console.log('📨 Connecting to Gmail IMAP...');
    const imap = new Imap(imapConfig);
    
    imap.once('ready', () => {
      console.log('✅ IMAP connected successfully');
      
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('❌ Error opening inbox:', err);
          imap.end();
          return reject(err);
        }

        console.log(`📬 Inbox opened. Total messages: ${box.messages.total}`);

        // Search for ALL unread emails (not just last 24 hours for testing)
        imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            console.error('❌ Search error:', err);
            imap.end();
            return reject(err);
          }

          if (!results || results.length === 0) {
            console.log('📭 No unread emails found');
            imap.end();
            return resolve({ processed: 0, checked: 0 });
          }

          console.log(`📨 Found ${results.length} unread emails`);

          const fetch = imap.fetch(results, { 
            bodies: ['HEADER.FIELDS (FROM SUBJECT)', 'TEXT'], 
            markSeen: true,
            struct: true 
          });
          
          let processed = 0;
          let checked = 0;

          fetch.on('message', (msg, seqno) => {
            console.log(`\n📧 Processing email #${seqno}`);
            
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                checked++;
                
                if (err) {
                  console.error('❌ Error parsing email:', err);
                  return;
                }

                try {
                  // Log email details for debugging
                  console.log('   From:', parsed.from?.text || 'Unknown');
                  console.log('   Subject:', parsed.subject || 'No subject');
                  
                  // Extract email from "From" field
                  const from = parsed.from?.text || '';
                  const emailMatch = from.match(/<(.+?)>/);
                  const senderEmail = emailMatch ? emailMatch[1] : from;
                  
                  console.log('   Sender email:', senderEmail);

                  // Check content for unsubscribe keywords
                  const subject = parsed.subject || '';
                  const text = parsed.text || '';
                  const html = parsed.html || '';

                  const unsubscribeKeywords = [
                    'unsubscribe', 'UNSUBSCRIBE', 'Unsubscribe', 
                    'remove', 'REMOVE', 'opt-out', 'stop'
                  ];
                  
                  const contentToCheck = subject + ' ' + text + ' ' + (html || '');
                  
                  // Log what we're checking
                  console.log('   Checking content for keywords...');
                  
                  const wantsToUnsubscribe = unsubscribeKeywords.some(keyword => {
                    const found = contentToCheck.includes(keyword);
                    if (found) console.log(`   ✅ Found keyword: "${keyword}"`);
                    return found;
                  });

                  if (wantsToUnsubscribe && senderEmail) {
                    console.log(`   🚫 Unsubscribe request detected from: ${senderEmail}`);
                    const result = await handleUnsubscribe(senderEmail);
                    if (result) {
                      processed++;
                      console.log(`   ✅ Successfully unsubscribed: ${senderEmail}`);
                    } else {
                      console.log(`   ❌ Failed to unsubscribe: ${senderEmail}`);
                    }
                  } else {
                    console.log('   ❌ No unsubscribe keywords found');
                  }
                } catch (error) {
                  console.error('❌ Error processing email:', error);
                }
              });
            });
          });

          fetch.once('error', (err) => {
            console.error('❌ Fetch error:', err);
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            console.log(`\n✅ Check complete: Checked ${checked} emails, processed ${processed} unsubscribe requests`);
            imap.end();
            resolve({ processed, checked });
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('❌ IMAP connection error:', err);
      reject(err);
    });

    imap.once('end', () => {
      console.log('🔌 IMAP connection closed');
    });

    imap.connect();
  });
}

// Function to start periodic unsubscribe checking
function startUnsubscribeChecker(intervalMinutes = 2) {
  console.log(`🔍 Starting unsubscribe checker (every ${intervalMinutes} minutes)`);
  
  // Check immediately on start
  checkUnsubscribeReplies()
    .then(result => console.log(`Initial check: ${result.processed} unsubscribes processed`))
    .catch(err => console.error('Initial unsubscribe check failed:', err));
  
  // Then check every X minutes
  setInterval(() => {
    console.log(`\n🔍 Running scheduled unsubscribe check...`);
    checkUnsubscribeReplies()
      .then(result => console.log(`Scheduled check: ${result.processed} unsubscribes processed`))
      .catch(err => console.error('Scheduled unsubscribe check failed:', err));
  }, intervalMinutes * 60 * 1000);
}

module.exports = { checkUnsubscribeReplies, startUnsubscribeChecker };