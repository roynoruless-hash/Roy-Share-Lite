import re

with open('src/pages/PublicLuckyDrawPage.tsx', 'r') as f:
    content = f.read()

# Replace local parseInKolkata with imported one
content = content.replace('function parseInKolkata(dateStr: string) {\n  return new Date(dateStr + "T00:00:00+05:30");\n}', '')

# Add imports
import_str = 'import { useTelegramUser } from "../hooks/useTelegramUser";'
new_import = 'import { useTelegramUser } from "../hooks/useTelegramUser";\nimport { parseInKolkata, formatFriendlyKolkata, getGiveawayTimingStatus } from "../lib/dateUtils";'
content = content.replace(import_str, new_import)

with open('src/pages/PublicLuckyDrawPage.tsx', 'w') as f:
    f.write(content)
