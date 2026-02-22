# TopUpSwift Monthly Mailer Bot

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0-brightgreen)](https://nodejs.org)
[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-blue)](https://core.telegram.org/bots)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime--DB-orange)](https://firebase.google.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A powerful Telegram bot that automatically sends "Happy New Month" HTML emails to TopUpSwift users. Built with Node.js, featuring 12 unique monthly templates, automatic scheduling, Firebase storage, and comprehensive email list management.

**Live Demo**: [https://topupswift-monthly-mailer.onrender.com](https://topupswift-monthly-mailer.onrender.com)  
**GitHub Repository**: [github.com/karojunior/topupswift-monthly-mailer](https://github.com/karojunior/topupswift-monthly-mailer)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Demo Screenshots](#demo-screenshots)
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
- [Deployment to Render](#deployment-to-render)
- [Keeping Your Bot Alive](#keeping-your-bot-alive-with-cron-joborg)
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
- **Keep-Alive Endpoint**: Works with cron-job.org to prevent sleeping

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js |
| **Telegram Bot** | node-telegram-bot-api |
| **Email Service** | Nodemailer + Gmail SMTP |
| **Database** | Firebase Realtime Database |
| **Scheduling** | node-cron |
| **Hosting** | Render (Free Tier) |
| **Keep Alive** | cron-job.org |

## 📦 Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 16.x or higher installed
- ✅ A Telegram account
- ✅ A Gmail account (your-businessofficial@gmail.com)
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
3. Choose a name: `your-business Monthly Mailer`
4. Choose a username: `@your-business_monthly_bot` (or similar available name)
5. Copy the API token (looks like: `7652749249:AAidhfhdiugidciincsdweewiwcgwuw`)

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
7. Enter name: **"your-business Bot"**
8. Click **"Generate"**
9. Copy the 16-character password (looks like: `hsfn jekw jkde whif`)
10. **Remove spaces** when using: `hsfnjekwjkdewhif`

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Name it: **`your-business-mailer`**
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
3. Register app name: **"your-business-mailer"**
4. Copy the Firebase config object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyffxfxcgcgcj3H4e56rygfr456ryfhc6u7v8",
  authDomain: "your-business-mailer.firebaseapp.com",
  databaseURL: "https://your-business-mailer-default-rtdb.firebaseio.com",
  projectId: "your-business-mailer",
  storageBucket: "your-business-mailer.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789"
};
```

### 5. Environment Configuration

Create a `.env` file in your project root:

```env
# Telegram (from BotFather)
TELEGRAM_BOT_TOKEN=7234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw

# Your Telegram ID (from userinfobot)
ADMIN_TELEGRAM_ID=123456789

# Gmail (your-businessofficial@gmail.com)
GMAIL_USER=your-businessofficial@gmail.com
GMAIL_APP_PASSWORD=hsfnjekwjkdewhif

# Firebase (from your Firebase config)
FIREBASE_API_KEY=AIzaSyffxfxcgcgcj3H4e56rygfr456ryfhc6u7v8
FIREBASE_AUTH_DOMAIN=your-business-mailer.firebaseapp.com
FIREBASE_DATABASE_URL=https://your-business-mailer-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=your-business-mailer
FIREBASE_STORAGE_BUCKET=your-business-mailer.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789
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
🤖 your-business Mailer Bot is running...
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
your-business-monthly-mailer/
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

## 🚀 Deployment to Render

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
git remote add origin https://github.com/your-github-username/your-business-monthly-mailer.git
git push -u origin main
```

### Step 3: Deploy on Render

1. **Go to** [Render.com](https://render.com) and sign in (use GitHub account for easy access)
2. Click **"New +"** → **"Web Service"**
3. **Connect your GitHub repository** (you may need to authorize Render)
4. Select the `your-business-monthly-mailer` repository

5. **Configure the service:**

| Setting | Value |
|---------|-------|
| **Name** | `your-business-monthly-mailer` |
| **Environment** | Node |
| **Region** | Frankfurt (or anyoen you choose) |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

6. **Add Environment Variables** (click "Advanced" then "Add Environment Variable"):

Add ALL variables from your `.env` file:

| Key | Value |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | your_token |
| `ADMIN_TELEGRAM_ID` | your_id |
| `GMAIL_USER` | your-businessofficial@gmail.com |
| `GMAIL_APP_PASSWORD` | your_app_password |
| `FIREBASE_API_KEY` | your_firebase_api_key |
| `FIREBASE_AUTH_DOMAIN` | your_auth_domain |
| `FIREBASE_DATABASE_URL` | your_database_url |
| `FIREBASE_PROJECT_ID` | your_project_id |
| `FIREBASE_STORAGE_BUCKET` | your_storage_bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | your_sender_id |
| `FIREBASE_APP_ID` | your_app_id |

7. Click **"Create Web Service"**

8. **Wait 2-3 minutes** for deployment to complete

9. **Your bot is live!** Access it at: `https://your-business-monthly-mailer.onrender.com`

## ⏰ Keeping Your Bot Alive with cron-job.org

Render free tier sleeps after 15-30 minutes of inactivity. Use cron-job.org to ping your bot every 10 minutes:

### Step 1: Add a health check endpoint

Your `index.js` already has this (if not, add it):

```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('your-business Mailer Bot is alive! 🤖');
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
```

### Step 2: Set up cron-job.org

1. Go to [cron-job.org](https://cron-job.org)
2. **Sign up** for a free account
3. Click **"Create Cronjob"**

4. **Configure the cron job:**

| Field | Value |
|-------|-------|
| **Title** | `your-business Keep Alive` |
| **URL** | `https://your-business-monthly-mailer.onrender.com/health` |
| **Execution schedule** | `Every 10 minutes` |
| **Request method** | `GET` |
| **Save response** | Optional (can disable) |

5. Click **"Create"**

✅ Your bot will now stay awake 24/7!

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
  // ... add all 125+ emails
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
| **Cron not running** | Check timezone in scheduler.js (set to Africa/Lagos) |
| **Bot sleeps on Render** | cron-job.org should ping every 10 minutes |

### View Logs on Render

1. Go to your Render dashboard
2. Click on your web service
3. Go to **"Logs"** tab
4. See real-time output

### Check Firebase Data

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Realtime Database"**
4. View all your data in real-time

## ❓ FAQ

### Q: How many emails can I send?
**A:** Gmail limit is 500 emails per day. Your 125-email list is well within limits.

### Q: Will data persist on Render free tier?
**A:** Yes! Because we use Firebase, your data is safe even when Render restarts.

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
- Render: Free
- Firebase: Free (1GB storage)
- cron-job.org: Free
- Gmail: Free
- **Total: $0/month**

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🤝 Support

- **GitHub Issues**: [github.com/karojunior/topupswift-monthly-mailer/issues](https://github.com/karojunior/topupswift-monthly-mailer/issues)
- **Email**: karojunior50@gmail.com
- **Telegram**: [@kingkkaro](https://t.me/kingkkaro) 

## 🙏 Acknowledgments

- TopUpSwift customers for being awesome
- Firebase for free database hosting
- Render for free Node.js hosting
- cron-job.org for free keep-alive service

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
- [ ] Deployed to Render
- [ ] Added environment variables on Render
- [ ] Set up cron-job.org
- [ ] Added email list
- [ ] **Done! Ready for 1st of month!** 🎉

---

**Built with ❤️ by [@karojunior](https://github.com/karojunior) for TopUpSwift users**  
*Last updated: February 2026*