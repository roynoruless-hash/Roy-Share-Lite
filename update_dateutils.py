import re

with open('src/lib/dateUtils.ts', 'r') as f:
    content = f.read()

old_status = """  const startVal = giveaway.startDate;
  const endVal = giveaway.endDate;

  const now = new Date();

  const parsedStart = startVal ? parseInKolkata(startVal) : null;
  const parsedEnd = endVal ? parseInKolkata(endVal) : null;"""

new_status = """  let startVal = giveaway.startDate;
  let endVal = giveaway.endDate;
  
  if (startVal && typeof startVal === 'string' && giveaway.startTime) {
    if (startVal.indexOf('T') === -1) {
       startVal = `${startVal}T${giveaway.startTime}`;
    }
  }
  if (endVal && typeof endVal === 'string' && giveaway.endTime) {
    if (endVal.indexOf('T') === -1) {
       endVal = `${endVal}T${giveaway.endTime}`;
    }
  }

  const now = new Date();

  const parsedStart = startVal ? parseInKolkata(startVal) : null;
  const parsedEnd = endVal ? parseInKolkata(endVal) : null;"""

content = content.replace(old_status, new_status)

with open('src/lib/dateUtils.ts', 'w') as f:
    f.write(content)
