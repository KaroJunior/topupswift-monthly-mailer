function getNigeriaTime() {
  // Force Nigeria/Lagos timezone
  const now = new Date();
  const nigeriaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
  
  return {
    date: nigeriaTime,
    month: nigeriaTime.getMonth(), // 0-11 (0 = January)
    monthName: nigeriaTime.toLocaleString('en-US', { month: 'long', timeZone: 'Africa/Lagos' }),
    year: nigeriaTime.getFullYear(),
    day: nigeriaTime.getDate(),
    hour: nigeriaTime.getHours(),
    minute: nigeriaTime.getMinutes(),
    isFirstDayOfMonth: nigeriaTime.getDate() === 1,
    isFirstHour: nigeriaTime.getHours() === 0
  };
}

module.exports = { getNigeriaTime };