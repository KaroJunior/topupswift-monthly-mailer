const january = require('./january');
const february = require('./february');
const march = require('./march');
const april = require('./april');
const may = require('./may');
const june = require('./june');
const july = require('./july');
const august = require('./august');
const september = require('./september');
const october = require('./october');
const november = require('./november');
const december = require('./december');

const templates = {
  0: january,  // January (0-indexed months)
  1: february,
  2: march,
  3: april,
  4: may,
  5: june,
  6: july,
  7: august,
  8: september,
  9: october,
  10: november,
  11: december
};

function getCurrentMonthTemplate() {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const template = templates[month];
  
  if (!template) {
    // Fallback to January if something goes wrong
    console.error('Template not found for month:', month);
    return templates[0];
  }
  
  return {
    month: now.toLocaleString('default', { month: 'long' }),
    subject: template.subject,
    html: template.html
  };
}

module.exports = {
  getCurrentMonthTemplate,
  templates
};