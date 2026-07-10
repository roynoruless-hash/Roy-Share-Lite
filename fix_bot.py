
import re

with open("src/bot.ts", "r") as f:
    content = f.read()

# Match the processReferAndEarn function
pattern = r"async function processReferAndEarn\(botToken: string, chatId: number, user: any\) \{.*?await sendTelegramMessage\(botToken, chatId, message, \{ parse_mode: \"Markdown\", reply_markup: inlineKeyboard \}\);\n\}"
replacement = """async function processReferAndEarn(botToken: string, chatId: number, user: any) {
    const appUrl = getAppUrl();
    const webAppUrl = `${appUrl}/refer`;
    
    const message = `👥 *RoyShare Referral Center*

Welcome to the new RoyShare Referral System!

Click the button below to open your secure Referral Center in the Mini App, where you can find your invite link, track analytics, and manage your rewards.`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🚀 Open Referral Center", web_app: { url: webAppUrl } }]
        ]
    };
    await sendTelegramMessage(botToken, chatId, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
}"""

# Use re.DOTALL to match across lines
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("src/bot.ts", "w") as f:
    f.write(new_content)
