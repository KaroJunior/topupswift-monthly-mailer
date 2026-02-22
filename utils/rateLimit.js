// Simple rate limiter - 1 second delay between emails
async function rateLimit() {
  return new Promise(resolve => setTimeout(resolve, 1000));
}

module.exports = { rateLimit };