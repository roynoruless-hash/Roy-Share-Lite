import re

with open('src/lib/dateUtils.ts', 'r') as f:
    content = f.read()

new_func = """

export function getGiveawayTimeLeft(giveaway: any) {
  let startVal = giveaway?.startDate;
  let endVal = giveaway?.endDate;
  
  if (startVal && typeof startVal === "string" && giveaway.startTime) {
    if (startVal.indexOf("T") === -1) {
      startVal = `${startVal}T${giveaway.startTime}`;
    }
  }
  if (endVal && typeof endVal === "string" && giveaway.endTime) {
    if (endVal.indexOf("T") === -1) {
      endVal = `${endVal}T${giveaway.endTime}`;
    }
  }

  const now = new Date();
  const parsedStart = startVal ? parseInKolkata(startVal) : null;
  const parsedEnd = endVal ? parseInKolkata(endVal) : null;

  let targetDate = parsedEnd;
  let isCountingToStart = false;

  if (parsedStart && now < parsedStart) {
    targetDate = parsedStart;
    isCountingToStart = true;
  }

  if (!targetDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isCountingToStart: false };
  }

  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isCountingToStart };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false,
    isCountingToStart
  };
}
"""

if "getGiveawayTimeLeft" not in content:
    content += new_func

with open('src/lib/dateUtils.ts', 'w') as f:
    f.write(content)
