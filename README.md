# TopUpSwift Monthly Mailer Bot

A powerful Telegram bot that automatically sends "Happy New Month" HTML emails to TopUpSwift users. Built with Node.js, featuring 12 unique monthly templates, automatic scheduling, Firebase storage, and comprehensive email list management.

**Live Demo**: [https://topupswift-monthly-mailer.pxxl.click](https://topupswift-monthly-mailer.pxxl.click)  
**GitHub Repository**: [github.com/karojunior/topupswift-monthly-mailer](https://github.com/karojunior/topupswift-monthly-mailer)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup Guide](#detailed-setup-guide)
  - [1. Telegram Bot Setup](#1-telegram-bot-setup)
  - [2. Get Your Telegram User ID](#2-get-your-telegram-user-id)
  - [3. Gmail App Password Setup](#3-gmail-app-password-setup)
  - [4. Firebase Setup](#4-firebase-setup)
  - [5. Environment Configuration](#5-environment-configuration)
- [Local Testing](#local-testing)
- [Bot Commands](#bot-commands)
- [Project Structure](#project-structure)
- [Deployment to pxxl.app](#deployment-to-pxxl.app
- [Adding Your Email List](#adding-your-email-list)
- [Monthly Email Schedule](#monthly-email-schedule)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [License](#license)

## ✨ Features

- **Automated Monthly Emails**: Sends on 1st of each month at 00:00 (WAT - Nigeria time)
- **12 Unique Templates**: Emotionally tailored HTML emails for each month
- **Firebase Storage**: Permanent data storage (no data loss on restart)
- **Manual Send Option**: Trigger campaigns anytime via `/send` command
- **Rate Limiting**: 1 email/second to avoid Gmail restrictions
- **Email List Management**: Add/remove emails via Telegram commands
- **Campaign Statistics**: Track sends, failures, and history
- **Admin-Only Access**: Secure bot accessible only by you
- **Bulk Email Addition**: Add multiple emails at once with commas
- **Always Awake**: Hosted on pxxl.app with no sleeping timers
- **No Cron Job Needed**: pxxl.app keeps your bot running 24/7

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js |
| **Telegram Bot** | node-telegram-bot-api |
| **Email Service** | Nodemailer + Gmail SMTP |
| **Database** | Firebase Realtime Database |
| **Scheduling** | node-cron |
| **Hosting** | pxxl.app (Nigerian hosting platform) |

## 🇳🇬 Built for Nigerian Developers

This bot is proudly hosted on **pxxl.app**, a Nigerian hosting platform created by Robinson Honour. No sleeping timers, no credit card required - perfect for African developers!

## 📦 Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 16.x or higher installed
- ✅ A Telegram account
- ✅ A Gmail account (e.g your-business-email@gmail.com)
- ✅ A Google account for Firebase
- ✅ Git installed
- ✅ Basic familiarity with terminal/command line

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/karojunior/topupswift-monthly-mailer.git
cd topupswift-monthly-mailer

# Install dependencies
npm install

# Create .env file with your credentials (see setup guide)
npm start
```

## 🔧 Detailed Setup Guide

### 1. Telegram Bot Setup

1. **Open Telegram** and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Choose a name: `e.g TopUpSwift Monthly Mailer`
4. Choose a username: ` e.g @topupswift_monthly_bot` 
5. Copy the API token (looks like: `7234567890:AAHdqTcvCdfghjkWJxfSeofSAs0K5PALDsaw`)

**Set up bot commands** (send these to BotFather):
```
start - Show help and instructions
add - Add email to list
remove - Remove email from list
list - View all emails
export - Get all emails as text
send - Manually send this month's email
stats - View statistics
```

### 2. Get Your Telegram User ID

1. Search for [@userinfobot](https://t.me/userinfobot) on Telegram
2. Start the bot and send `/start`
3. Copy your ID number (e.g., `123456789`)

### 3. Gmail App Password Setup

⚠️ **IMPORTANT**: You CANNOT use your regular Gmail password. You must create an App Password.

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. **Enable 2-Step Verification** (if not already enabled)
3. Search for **"App passwords"** in the search bar
4. Click on "App passwords"
5. Select **"Mail"** as the app
6. Select **"Other"** as the device
7. Enter name: **e.g "Your Business Bot"**
8. Click **"Generate"**
9. Copy the 16-character password (looks like: `hdsk fnjd bfjk sdff`)
10. **Remove spaces** when using: `hdskfnjdbfjksdff`

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Name it
4. Disable Google Analytics (optional)
5. Click **"Create project"**

#### Set up Realtime Database:

1. In left sidebar, click **"Realtime Database"**
2. Click **"Create Database"**
3. Choose **"Start in test mode"** (for development)
4. Select a region close to you (e.g., `us-central1`)
5. Click **"Enable"**

#### Get Firebase Config:

1. Click **"Project Overview"** (top left)
2. Click **"</>"** (Add app) - Web icon
3. Register app name
4. Copy the Firebase config object:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOAMIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 5. Environment Configuration

Create a `.env` file in your project root:

```env
# Telegram (from BotFather)
TELEGRAM_BOT_TOKEN=7234345890:AAHdqTDFGHcvCH1vGWFeofSAs0K5PALDsaw

# Your Telegram ID (from userinfobot)
ADMIN_TELEGRAM_ID=YOUR_TELEGRAM_ID

# Gmail
GMAIL_USER=YOUR_EMAIL
GMAIL_APP_PASSWORD=YOUR_PASSWORD

# Firebase (from your Firebase config)
FIREBASE_API_KEY=YOUR_API_KEY....
```

## 🧪 Local Testing

Test your bot locally before deploying:

```bash
# Install dependencies
npm install

# Start the bot
npm start
```

**Test these commands in Telegram:**
- `/start` - Shows help menu
- `/add test@example.com` - Add a test email
- `/list` - Verify email was added
- `/send` - Send test email (check your inbox)
- `/stats` - View statistics

Expected output:
```
🤖 TopUpSwift Mailer Bot is running...
✅ SMTP Server ready to send emails
⏰ Scheduler started - Will run on 1st of each month at 00:00
```

## 🤖 Bot Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Show help menu | `/start` |
| `/add email@gmail.com` | Add single email | `/add john@example.com` |
| `/add email1, email2, email3` | Add multiple emails | `/add john@a.com, jane@b.com` |
| `/remove email@gmail.com` | Remove email | `/remove john@example.com` |
| `/list` | Display all emails | `/list` |
| `/export` | Export emails as text | `/export` |
| `/send` | Manually trigger email | `/send` |
| `/stats` | Show statistics | `/stats` |

## 📁 Project Structure

```
main folder/
├── index.js                 # Telegram bot entry point
├── mailer.js                # Nodemailer logic
├── scheduler.js             # Cron job scheduler
├── firebase.js              # Firebase database functions
├── .env                     # Environment variables (not in git)
├── .gitignore               # Git ignore file
├── package.json             # Dependencies
├── README.md                # This file
├── templates/               # Email templates
│   ├── index.js            # Template exporter
│   ├── january.js
│   ├── february.js
│   └── ... (all 12 months)
└── utils/                   # Helper functions
    ├── rateLimit.js         # 1 second delay between emails
    └── getCurrentMonth.js   # Month detection utility
```

## 🚀 Deployment to pxxl.app

### Why pxxl.app?

- 🇳🇬 **Nigerian hosting platform** - Built by Robinson Honour for African developers
- 💰 **Completely free** - No credit card required
- ⚡ **No sleeping timers** - Your bot stays awake 24/7
- 🔗 **Free subdomain** - `your-app.pxxl.app`
- 🚀 **Easy deployment** - Direct GitHub integration

### Step 1: Prepare for GitHub

Create a `.gitignore` file:

```
node_modules/
.env
.DS_Store
npm-debug.log
*.log
```

### Step 2: Push to GitHub

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Add your GitHub remote
git remote add origin https://github.com/karojunior/topupswift-monthly-mailer.git
git push -u origin main
```

### Step 3: Deploy on pxxl.app

1. Go to **[pxxl.app](https://pxxl.app)** and sign up with GitHub
2. Click **"New Project"**
3. Select your repository: `karojunior/topupswift-monthly-mailer`
4. **Add Environment Variables** (copy all from your `.env` file):

| Key | Value |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | your_token |
| `ADMIN_TELEGRAM_ID` | your_id |
| `GMAIL_USER` | your-business-email@gmail.com |
| `GMAIL_APP_PASSWORD` | your_app_password |
| `FIREBASE_API_KEY` | your_firebase_api_key |
| `FIREBASE_AUTH_DOMAIN` | your_auth_domain |
| `FIREBASE_DATABASE_URL` | your_database_url |
| `FIREBASE_PROJECT_ID` | your_project_id |
| `FIREBASE_STORAGE_BUCKET` | your_storage_bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | your_sender_id |
| `FIREBASE_APP_ID` | your_app_id |

5. Click **"Deploy"**

6. **Your bot is live!** Access it at: `https://topupswift-monthly-mailer.pxxl.click`

**Note**: Unlike Render, **no cron job is needed**! pxxl.app keeps your bot awake 24/7 automatically.

## 📧 Adding Your Email List

### Option 1: Add via Telegram (Recommended for small lists)

```bash
/add email1@gmail.com, email2@gmail.com, email3@gmail.com
```

### Option 2: Bulk Add via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Realtime Database"**
4. Click on the `emails` node (or create it)
5. Add emails in this format:

```json
{
  "emails": {
    "-Nabcdefghijklmnop": {
      "email": "customer1@gmail.com",
      "addedAt": "2026-02-22T10:30:00.000Z"
    },
    "-Nbcdefghijklmnopq": {
      "email": "customer2@gmail.com",
      "addedAt": "2026-02-22T10:30:00.000Z"
    }
  }
}
```

### Option 3: Using a Migration Script

Create a file `scripts/import-emails.js`:

```javascript
const { addMultipleEmails } = require('../firebase');

// Your email list (paste here)
const emails = [
  "customer1@gmail.com",
  "customer2@gmail.com",
  "customer3@gmail.com",
  // ... add all your emails
];

addMultipleEmails(emails).then(result => {
  console.log(`✅ Added: ${result.added.length}`);
  console.log(`⏭️ Skipped: ${result.skipped.length}`);
});
```

Run it:
```bash
node scripts/import-emails.js
```

## 📅 Monthly Email Schedule

The bot automatically sends emails on:

- **Date**: 1st of every month
- **Time**: 00:00 (midnight) Nigeria time (WAT)
- **Rate**: 1 email per second
- **Limit**: 500 emails max per day (Gmail limit)

**To manually trigger a campaign:** `/send`

## 🔍 Troubleshooting

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| **Bot not responding** | Check TELEGRAM_BOT_TOKEN in environment variables |
| **"Unauthorized" error** | Verify ADMIN_TELEGRAM_ID is correct |
| **Emails not sending** | Verify Gmail App Password (remove spaces) |
| **Firebase connection error** | Check FIREBASE_DATABASE_URL is correct |
| **"Invalid login" from Gmail** | Regenerate App Password in Google Account |
| **Data not persisting** | Firebase is working - check your database console |
| **SMTP connection timeout** | IPv4 fix is applied in mailer.js |

### Check Firebase Data

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Realtime Database"**
4. View all your data in real-time

## ❓ FAQ

### Q: How many emails can I send?
**A:** Gmail limit is 500 emails per day. Your list is well within limits.

### Q: Will data persist on pxxl.app?
**A:** Yes! We use Firebase for storage, so your data is safe even if the app restarts.

### Q: How do I handle unsubscribes?
**A:** When users reply "UNSUBSCRIBE", you'll see it in your Gmail. Simply run:
```
/remove their-email@gmail.com
```

### Q: Can I customize email templates?
**A:** Yes! Edit the files in the `/templates/` folder. Each month has its own file.

### Q: What if I need to send more than 500 emails?
**A:** You'd need to upgrade Gmail or use a professional email service.

### Q: Is the bot secure?
**A:** Yes! Only your Telegram ID can access the bot commands.

### Q: How much does this cost?
**A:** 
- pxxl.click: Free (no credit card required)
- Firebase: Free (1GB storage)
- Gmail: Free
- **Total: $0/month**

### Q: Why pxxl.app instead of Render?
**A:** pxxl.app is a Nigerian hosting platform that:
- 🇳🇬 Supports local developers
- 💰 No credit card required
- ⚡ No sleeping timers
- 🚀 Built by Robinson Honour specifically for African developers

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🤝 Support

- **GitHub Issues**: [github.com/karojunior/topupswift-monthly-mailer/issues](https://github.com/karojunior/topupswift-monthly-mailer/issues)
- **Email**: karojunior50@gmail.com
- **Telegram**: [@karojunior](https://t.me/kingkkaro)

## 🙏 Acknowledgments

- TopUpSwift customers for being awesome
- Firebase for free database hosting
- **Robinson Honour** for creating pxxl.app - supporting Nigerian developers! 🇳🇬
- pxxl.app for reliable, always-awake hosting

---

## 🚀 Quick Deployment Checklist

- [ ] Created Telegram bot with BotFather
- [ ] Got Telegram user ID
- [ ] Generated Gmail App Password
- [ ] Created Firebase project
- [ ] Set up Realtime Database
- [ ] Copied Firebase config
- [ ] Created `.env` file with all credentials
- [ ] Tested locally with `/send`
- [ ] Pushed to GitHub
- [ ] Deployed to pxxl.app
- [ ] Added environment variables on pxxl.app
- [ ] Added email list
- [ ] **Done! Ready for 1st of month!** 🎉

---

**Built with ❤️ by [@karojunior](https://github.com/karojunior) for TopUpSwift users**  
**Hosted on pxxl.app - Nigerian hosting for African developers** 🇳🇬  
*Last updated: February 2026*  
⭐ **Don't forget to star this repository!** ⭐