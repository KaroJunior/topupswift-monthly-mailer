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
  // debug: console.log // COMMENT THIS OUT - it was too verbose
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

        // Search for ALL unread emails
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
            markSeen: true
          });
          
          let processed = 0;
          let checked = 0;

          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                checked++;
                
                if (err) {
                  console.error('❌ Error parsing email:', err);
                  return;
                }

                try {
                  const from = parsed.from?.text || '';
                  const emailMatch = from.match(/<(.+?)>/);
                  const senderEmail = emailMatch ? emailMatch[1] : from;
                  
                  // Skip if no valid email
                  if (!senderEmail || !senderEmail.includes('@')) return;

                  const subject = parsed.subject || '';
                  const text = parsed.text || '';

                  const unsubscribeKeywords = [
                    'unsubscribe', 'UNSUBSCRIBE', 'Unsubscribe', 
                    'remove', 'REMOVE', 'opt-out', 'stop'
                  ];
                  
                  const contentToCheck = subject + ' ' + text;
                  
                  const wantsToUnsubscribe = unsubscribeKeywords.some(keyword => 
                    contentToCheck.includes(keyword)
                  );

                  if (wantsToUnsubscribe) {
                    console.log(`📧 Unsubscribe request from: ${senderEmail}`);
                    const result = await handleUnsubscribe(senderEmail);
                    if (result) {
                      processed++;
                      console.log(`✅ Successfully unsubscribed: ${senderEmail}`);
                    }
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
            console.log(`✅ Checked ${checked} emails, processed ${processed} unsubscribe requests`);
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

    imap.connect();
  });
}

// Function to start periodic unsubscribe checking
function startUnsubscribeChecker(intervalMinutes = 5) {
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