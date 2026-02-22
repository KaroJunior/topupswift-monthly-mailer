const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, push, remove } = require('firebase/database');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Email functions
async function loadEmails() {
  try {
    const emailsRef = ref(database, 'emails');
    const snapshot = await get(emailsRef);
    if (snapshot.exists()) {
      // Convert Firebase object to array
      const emailsObj = snapshot.val();
      return Object.values(emailsObj).map(item => item.email);
    }
    return [];
  } catch (error) {
    console.error('Error loading emails:', error);
    return [];
  }
}

async function saveEmails(emailsArray) {
  try {
    const emailsRef = ref(database, 'emails');
    // Convert array to Firebase object
    const emailsObj = {};
    emailsArray.forEach((email, index) => {
      emailsObj[index] = { email, addedAt: new Date().toISOString() };
    });
    await set(emailsRef, emailsObj);
    return true;
  } catch (error) {
    console.error('Error saving emails:', error);
    return false;
  }
}

async function addEmail(email) {
  try {
    const emailsRef = ref(database, 'emails');
    const newEmailRef = push(emailsRef);
    await set(newEmailRef, {
      email: email,
      addedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error adding email:', error);
    return false;
  }
}

async function removeEmail(emailToRemove) {
  try {
    const emailsRef = ref(database, 'emails');
    const snapshot = await get(emailsRef);
    if (snapshot.exists()) {
      const emailsObj = snapshot.val();
      // Find and remove the email
      for (const [key, value] of Object.entries(emailsObj)) {
        if (value.email === emailToRemove) {
          await remove(ref(database, `emails/${key}`));
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error removing email:', error);
    return false;
  }
}

// Unsubscribed functions
async function loadUnsubscribed() {
  try {
    const unsubRef = ref(database, 'unsubscribed');
    const snapshot = await get(unsubRef);
    if (snapshot.exists()) {
      const unsubObj = snapshot.val();
      return Object.values(unsubObj).map(item => item.email);
    }
    return [];
  } catch (error) {
    console.error('Error loading unsubscribed:', error);
    return [];
  }
}

async function addUnsubscribed(email) {
  try {
    const unsubRef = ref(database, 'unsubscribed');
    const newUnsubRef = push(unsubRef);
    await set(newUnsubRef, {
      email: email,
      unsubscribedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error adding unsubscribed:', error);
    return false;
  }
}

// Logs functions
async function saveLog(logEntry) {
  try {
    const logsRef = ref(database, 'logs');
    const newLogRef = push(logsRef);
    await set(newLogRef, {
      ...logEntry,
      savedAt: new Date().toISOString()
    });
    console.log('✅ Log saved to Firebase');
    return true;
  } catch (error) {
    console.error('Error saving log:', error);
    return false;
  }
}

async function loadLogs() {
  try {
    const logsRef = ref(database, 'logs');
    const snapshot = await get(logsRef);
    if (snapshot.exists()) {
      const logsObj = snapshot.val();
      // Convert object to array and sort by timestamp
      const logsArray = Object.values(logsObj);
      return logsArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return [];
  } catch (error) {
    console.error('Error loading logs:', error);
    return [];
  }
}

// Add multiple emails function
async function addMultipleEmails(emailsArray) {
  try {
    const currentEmails = await loadEmails();
    const unsubscribed = await loadUnsubscribed();
    
    const result = {
      added: [],
      skipped: []
    };
    
    for (const email of emailsArray) {
      // Check if already exists or unsubscribed
      if (currentEmails.includes(email) || unsubscribed.includes(email)) {
        result.skipped.push(email);
        continue;
      }
      
      // Check limit
      if (currentEmails.length + result.added.length >= 500) {
        result.skipped.push(email); // Mark remaining as skipped due to limit
        continue;
      }
      
      // Add to Firebase
      const emailsRef = ref(database, 'emails');
      const newEmailRef = push(emailsRef);
      await set(newEmailRef, {
        email: email,
        addedAt: new Date().toISOString()
      });
      
      result.added.push(email);
    }
    
    console.log(`✅ Added ${result.added.length} emails, skipped ${result.skipped.length}`);
    return result;
  } catch (error) {
    console.error('Error adding multiple emails:', error);
    throw error;
  }
}

// Export all functions
module.exports = {
  loadEmails,
  saveEmails,
  addEmail,
  addMultipleEmails,
  removeEmail,
  loadUnsubscribed,
  addUnsubscribed,
  saveLog,
  loadLogs
};