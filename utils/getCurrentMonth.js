function getCurrentMonth() {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  const now = new Date();
  return {
    index: now.getMonth(),
    name: months[now.getMonth()],
    year: now.getFullYear()
  };
}

module.exports = { getCurrentMonth };