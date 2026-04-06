require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { 
  loadEmails, 
  addEmail,
  addMultipleEmails,
  removeEmail, 
  loadUnsubscribed, 
  loadLogs 
} = require('./firebase');
const { sendMonthlyEmails, sendTestEmail } = require('./mailer');
const { startScheduler } = require('./scheduler');
const { startUnsubscribeChecker } = require('./utils/checkUnsubscribes');
const express = require('express');
const app = express();

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID;

// Handle cleanup on shutdown
process.once('SIGINT', () => {
  bot.stopPolling();
  console.log('🤖 Bot stopped gracefully');
  process.exit(0);
});
process.once('SIGTERM', () => {
  bot.stopPolling();
  console.log('🤖 Bot stopped gracefully');
  process.exit(0);
});

// Keep Alive
app.get('/', (req, res) => {
  res.send('TopUpSwift Mailer Bot is alive! 🤖');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// Admin check middleware
const isAdmin = (msg) => msg.from.id.toString() === ADMIN_ID;

// Start command
bot.onText(/\/start/, (msg) => {
  if (!isAdmin(msg)) {
    return bot.sendMessage(msg.chat.id, '⛔ Unauthorized. This is a private bot.');
  }

  const helpText = `
🚀 *TopUpSwift Monthly Mailer Bot*

*Email Management:*
/add email@gmail.com - Add single email
/add email1, email2, email3 - Add multiple emails
/remove email@gmail.com - Remove email from list
/removeall - ⚠️ Delete ALL emails (asks confirmation)
/list - View all emails
/export - Get all emails as text

*Email Sending:*
/send - Manually send this month's email to ALL users
/testemail - Send test email ONLY to you (admin)
/stats - View statistics

*Unsubscribe Management:*
/testunsub email@gmail.com - Test unsubscribe
/forcecheck - Force check for unsubscribe replies

*Debug & Timezone:*
/time - Check Nigeria time vs Server time

*Important Notes:*
- 📧 Emails stored in Firebase (permanent)
- ⏰ Auto-sends on 1st of each month at 00:01 Nigeria time
- 🚫 Rate limited: 1 email per second
- 📊 500 email max limit
  `;
  
  bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
});

// Updated Add email command (SUPPORTS MULTIPLE)
bot.onText(/\/add (.+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  
  const input = match[1].trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  try {
    // Check if it's multiple emails (contains comma)
    if (input.includes(',')) {
      // Split by comma, trim each email, filter out empty
      const emails = input.split(',').map(e => e.trim().toLowerCase()).filter(e => e.length > 0);
      
      // Validate each email
      const invalidEmails = emails.filter(e => !emailRegex.test(e));
      if (invalidEmails.length > 0) {
        return bot.sendMessage(msg.chat.id, `❌ Invalid email format: ${invalidEmails.join(', ')}`);
      }
      
      // Check for duplicates within the input
      const uniqueEmails = [...new Set(emails)];
      if (uniqueEmails.length !== emails.length) {
        return bot.sendMessage(msg.chat.id, '❌ Duplicate emails found in your list. Please remove duplicates.');
      }
      
      // Add multiple emails
      const result = await addMultipleEmails(emails);
      
      let response = '';
      if (result.added.length > 0) {
        response += `✅ Added: ${result.added.length} emails\n`;
      }
      if (result.skipped.length > 0) {
        response += `⏭️ Skipped (already exist or unsubscribed): ${result.skipped.length} emails\n`;
      }
      
      const totalEmails = await loadEmails();
      response += `📊 Total emails now: ${totalEmails.length}/500`;
      
      bot.sendMessage(msg.chat.id, response);
    } else {
      // Single email
      const email = input.toLowerCase();
      
      if (!emailRegex.test(email)) {
        return bot.sendMessage(msg.chat.id, '❌ Invalid email format.');
      }
      
      const emails = await loadEmails();
      const unsubscribed = await loadUnsubscribed();
      
      if (unsubscribed.includes(email)) {
        return bot.sendMessage(msg.chat.id, '❌ This email has unsubscribed and cannot be re-added.');
      }
      
      if (emails.includes(email)) {
        return bot.sendMessage(msg.chat.id, '❌ Email already exists.');
      }
      
      if (emails.length >= 500) {
        return bot.sendMessage(msg.chat.id, '❌ Maximum limit of 500 emails reached.');
      }
      
      await addEmail(email);
      
      bot.sendMessage(msg.chat.id, `✅ Added: ${email}\nTotal emails: ${emails.length + 1}/500`);
    }
  } catch (error) {
    bot.sendMessage(msg.chat.id, '❌ Error adding email(s). Check logs.');
    console.error('Add error:', error);
  }
});

// Remove email command
bot.onText(/\/remove (.+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  
  const email = match[1].trim().toLowerCase();
  
  try {
    const success = await removeEmail(email);
    
    if (!success) {
      return bot.sendMessage(msg.chat.id, '❌ Email not found.');
    }
    
    const emails = await loadEmails();
    bot.sendMessage(msg.chat.id, `✅ Removed: ${email}\nRemaining emails: ${emails.length}/500`);
  } catch (error) {
    bot.sendMessage(msg.chat.id, '❌ Error removing email.');
    console.error('Remove error:', error);
  }
});

// Remove all emails command (changed from /deleteall to /removeall)
bot.onText(/\/removeall/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  // Ask for confirmation first (safety measure)
  bot.sendMessage(msg.chat.id, 
    '⚠️ *WARNING:* This will delete ALL emails from your list!\n\n' +
    'This action cannot be undone.\n\n' +
    'Type `/confirmremoveall` within 30 seconds to confirm.',
    { parse_mode: 'Markdown' }
  );
  
  // Store confirmation state
  const confirmHandler = async (confirmMsg) => {
    if (confirmMsg.text === '/confirmremoveall' && confirmMsg.from.id.toString() === ADMIN_ID) {
      try {
        const { deleteAllEmails } = require('./firebase');
        await deleteAllEmails();
        bot.sendMessage(msg.chat.id, '✅ All emails have been deleted from the list.');
      } catch (error) {
        bot.sendMessage(msg.chat.id, `❌ Error deleting emails: ${error.message}`);
      }
      // Remove listener after confirmation
      bot.removeListener('message', confirmHandler);
    }
  };
  
  bot.on('message', confirmHandler);
  
  // Remove listener after 30 seconds
  setTimeout(() => {
    bot.removeListener('message', confirmHandler);
  }, 30000);
});

// List emails command
bot.onText(/\/list/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  try {
    const emails = await loadEmails();
    
    if (emails.length === 0) {
      return bot.sendMessage(msg.chat.id, '📭 No emails in the list.');
    }
    
    // Send in chunks if too many (Telegram has 4096 char limit)
    const emailList = emails.map((e, i) => `${i + 1}. ${e}`).join('\n');
    
    if (emailList.length > 4000) {
      // Send in batches
      const chunks = [];
      let currentChunk = '';
      
      emails.forEach((email, i) => {
        const line = `${i + 1}. ${email}\n`;
        if (currentChunk.length + line.length > 4000) {
          chunks.push(currentChunk);
          currentChunk = line;
        } else {
          currentChunk += line;
        }
      });
      if (currentChunk) chunks.push(currentChunk);
      
      bot.sendMessage(msg.chat.id, `📧 *Email List (${emails.length}/500)*`, { parse_mode: 'Markdown' });
      for (const chunk of chunks) {
        await bot.sendMessage(msg.chat.id, chunk);
      }
    } else {
      bot.sendMessage(msg.chat.id, `📧 *Email List (${emails.length}/500)*\n\n${emailList}`, {
        parse_mode: 'Markdown'
      });
    }
  } catch (error) {
    bot.sendMessage(msg.chat.id, '❌ Error loading emails.');
    console.error('List error:', error);
  }
});

// Export emails command
bot.onText(/\/export/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  try {
    const emails = await loadEmails();
    
    if (emails.length === 0) {
      return bot.sendMessage(msg.chat.id, '📭 No emails to export.');
    }
    
    const exportText = emails.join(', ');
    
    // If too long, send as file
    if (exportText.length > 4000) {
      const fs = require('fs');
      const tempFile = `emails_export_${Date.now()}.txt`;
      fs.writeFileSync(tempFile, exportText);
      await bot.sendDocument(msg.chat.id, tempFile);
      fs.unlinkSync(tempFile); // Delete temp file
    } else {
      bot.sendMessage(msg.chat.id, `📋 *Exported Emails:*\n\n${exportText}`, {
        parse_mode: 'Markdown'
      });
    }
  } catch (error) {
    bot.sendMessage(msg.chat.id, '❌ Error exporting emails.');
    console.error('Export error:', error);
  }
});

// Manual send command
bot.onText(/\/send/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  try {
    const emails = await loadEmails();
    
    if (emails.length === 0) {
      return bot.sendMessage(msg.chat.id, '❌ No emails to send.');
    }
    
    bot.sendMessage(msg.chat.id, `📨 Starting to send ${emails.length} emails... This may take a while.`);
    
    const result = await sendMonthlyEmails();
    
    const statusMsg = `
✅ *Email Sending Complete*
📧 Sent: ${result.successful}
❌ Failed: ${result.failed}
📊 Total: ${emails.length}/500
📅 Last sent: ${new Date().toLocaleString()}
    `;
    
    bot.sendMessage(msg.chat.id, statusMsg, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(msg.chat.id, '❌ Error sending emails.');
    console.error('Send error:', error);
  }
});

// Stats command
bot.onText(/\/stats/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  try {
    const emails = await loadEmails();
    const logs = await loadLogs();
    const unsubscribed = await loadUnsubscribed();
    
    const lastSent = logs.length > 0 
      ? new Date(logs[logs.length - 1].timestamp).toLocaleString()
      : 'Never';
    
    const totalSuccessful = logs.reduce((acc, log) => acc + (log.successful || 0), 0);
    const totalFailed = logs.reduce((acc, log) => acc + (log.failed || 0), 0);
    
    const statsMsg = `
📊 *Bot Statistics*

📧 Active emails: ${emails.length}/500
🚫 Unsubscribed: ${unsubscribed.length}
📨 Total campaigns: ${logs.length}
📅 Last sent: ${lastSent}

✅ Successful sends: ${totalSuccessful}
❌ Failed sends: ${totalFailed}
    `;
    
    bot.sendMessage(msg.chat.id, statsMsg, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(msg.chat.id, '❌ Error loading stats.');
    console.error('Stats error:', error);
  }
});

// Test unsubscribe command
bot.onText(/\/testunsub (.+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  
  const email = match[1].trim();
  
  try {
    bot.sendMessage(msg.chat.id, `🔍 Testing unsubscribe for: ${email}`);
    
    const { handleUnsubscribe } = require('./mailer');
    const result = await handleUnsubscribe(email);
    
    if (result) {
      bot.sendMessage(msg.chat.id, `✅ Successfully unsubscribed ${email}`);
    } else {
      bot.sendMessage(msg.chat.id, `❌ Failed to unsubscribe ${email}`);
    }
  } catch (error) {
    bot.sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
  }
});

// Force check unsubscribe replies
bot.onText(/\/forcecheck/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  try {
    bot.sendMessage(msg.chat.id, '🔍 Force checking for unsubscribe replies...');
    
    const { checkUnsubscribeReplies } = require('./utils/checkUnsubscribes');
    const result = await checkUnsubscribeReplies();
    
    bot.sendMessage(msg.chat.id, `✅ Check complete. Processed: ${result.processed} unsubscribe requests`);
  } catch (error) {
    bot.sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
  }
});

// Test timezone command
bot.onText(/\/time/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  const { getNigeriaTime } = require('./utils/getNigeriaTime');
  const nigeria = getNigeriaTime();
  const serverNow = new Date();
  
  const response = `
🕐 *Timezone Debug Info*

*Nigeria Time:*
- Date: ${nigeria.date.toLocaleString()}
- Month: ${nigeria.monthName}
- Day of month: ${nigeria.day}
- Is 1st of month? ${nigeria.isFirstDayOfMonth ? '✅ YES' : '❌ NO'}

*Server Time:*
- Date: ${serverNow.toLocaleString()}
- Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}

*Current Template Would Be:*
- ${nigeria.monthName}
  `;
  
  bot.sendMessage(msg.chat.id, response, { parse_mode: 'Markdown' });
});

// Test email command (sends only to admin)
bot.onText(/\/testemail/, async (msg) => {
  if (!isAdmin(msg)) return;
  
  try {
    bot.sendMessage(msg.chat.id, '📨 Sending test email to your admin email...');
    
    const result = await sendTestEmail();
    
    if (result) {
      bot.sendMessage(msg.chat.id, '✅ Test email sent! Check your inbox.');
    } else {
      bot.sendMessage(msg.chat.id, '❌ Failed to send test email. Check logs.');
    }
  } catch (error) {
    bot.sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
  }
});

// Start the scheduler
startScheduler();

// Start checking for unsubscribe replies every 5 minutes
startUnsubscribeChecker(5);

console.log('🤖 TopUpSwift Mailer Bot is running...');