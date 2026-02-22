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
const { sendMonthlyEmails } = require('./mailer');
const { startScheduler } = require('./scheduler');
const { startUnsubscribeChecker } = require('./utils/checkUnsubscribes');
const express = require('express');

const app = express();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID;

// Server for Render's health checks
app.get('/', (req, res) => res.send('Bot Alive 🤖'));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Port: ${PORT}`));

const isAdmin = (msg) => msg.from.id.toString() === ADMIN_ID;

// Commands
bot.onText(/\/start/, (msg) => {
  if (!isAdmin(msg)) return;
  const helpText = `🚀 *Mailer Bot*\n\n/add email\n/remove email\n/list\n/send (Manual)\n/stats`;
  bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
});

bot.onText(/\/add (.+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const input = match[1].trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  try {
    const emails = input.split(',').map(e => e.trim().toLowerCase()).filter(e => e.length > 0);
    const invalid = emails.filter(e => !emailRegex.test(e));
    
    if (invalid.length > 0) return bot.sendMessage(msg.chat.id, `❌ Invalid: ${invalid.join(', ')}`);
    
    const result = await addMultipleEmails(emails);
    bot.sendMessage(msg.chat.id, `✅ Added: ${result.added.length} | ⏭️ Skipped: ${result.skipped.length}`);
  } catch (error) {
    console.error('Add error:', error);
  }
});

bot.onText(/\/list/, async (msg) => {
  if (!isAdmin(msg)) return;
  const emails = await loadEmails();
  if (emails.length === 0) return bot.sendMessage(msg.chat.id, '📭 List empty.');
  bot.sendMessage(msg.chat.id, `📧 *List (${emails.length}/500)*\n\n${emails.join('\n')}`, { parse_mode: 'Markdown' });
});

bot.onText(/\/send/, async (msg) => {
  if (!isAdmin(msg)) return;
  bot.sendMessage(msg.chat.id, `📨 Sending campaign...`);
  const result = await sendMonthlyEmails();
  bot.sendMessage(msg.chat.id, `✅ Done! Sent: ${result.successful}, Failed: ${result.failed}`);
});

bot.onText(/\/stats/, async (msg) => {
  if (!isAdmin(msg)) return;
  const emails = await loadEmails();
  const logs = await loadLogs();
  bot.sendMessage(msg.chat.id, `📊 *Stats*\nActive: ${emails.length}\nCampaigns: ${logs.length}`, { parse_mode: 'Markdown' });
});

// Initialization
startScheduler();
startUnsubscribeChecker(60); // Check every hour instead of 5 mins to avoid ECONNRESET

console.log('🤖 Bot Started');
