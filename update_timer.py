import re

with open('src/pages/PublicLuckyDrawPage.tsx', 'r') as f:
    content = f.read()

old_timer = """  useEffect(() => {
    if (!giveaway?.endDate) return;
    const timer = setInterval(() => {
      const parsedEnd = parseInKolkata(giveaway.endDate);
      if (giveaway.endTime) {
        const [hh, mm] = giveaway.endTime.split(":");
        parsedEnd.setHours(Number(hh), Number(mm), 0);
      }
      const now = new Date();
      const diff = parsedEnd.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        clearInterval(timer);
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
          isExpired: false
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [giveaway]);"""

new_timer = """  useEffect(() => {
    if (!giveaway?.endDate) return;
    const calculateTimeLeft = () => {
      let endVal = giveaway.endDate;
      if (endVal && typeof endVal === 'string' && giveaway.endTime && endVal.indexOf('T') === -1) {
        endVal = `${endVal}T${giveaway.endTime}`;
      }
      const parsedEnd = parseInKolkata(endVal);
      const diff = parsedEnd.getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
          isExpired: false
        });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [giveaway]);"""

content = content.replace(old_timer, new_timer)

with open('src/pages/PublicLuckyDrawPage.tsx', 'w') as f:
    f.write(content)
