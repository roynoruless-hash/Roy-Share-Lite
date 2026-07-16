import re

with open('src/pages/PublicUpiGiveawayPage.tsx', 'r') as f:
    content = f.read()

# Replace dateUtils import
content = content.replace(
    'import { parseInKolkata, formatFriendlyKolkata, getGiveawayTimingStatus } from "../lib/dateUtils";',
    'import { parseInKolkata, formatFriendlyKolkata, getGiveawayTimingStatus, getGiveawayTimeLeft } from "../lib/dateUtils";'
)

# Update state hook
content = content.replace(
    'const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });',
    'const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false, isCountingToStart: false });'
)

# Replace timer block
old_timer = """  // Countdown Clock Timer
  useEffect(() => {
    if (!giveaway?.endDate) return;
    const calculateTimeLeft = () => {
      const parsedEnd = parseInKolkata(giveaway.endDate);
      const difference = +parsedEnd - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      });
    };
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [giveaway]);"""

new_timer = """  // Countdown Clock Timer
  useEffect(() => {
    if (!giveaway) return;
    const calculateTimeLeft = () => {
      setTimeLeft(getGiveawayTimeLeft(giveaway));
    };
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [giveaway]);"""

content = content.replace(old_timer, new_timer)

with open('src/pages/PublicUpiGiveawayPage.tsx', 'w') as f:
    f.write(content)
