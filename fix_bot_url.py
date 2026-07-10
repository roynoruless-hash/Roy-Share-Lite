
with open("src/bot.ts", "r") as f:
    content = f.read()

content = content.replace("const webAppUrl = `${appUrl}/refer`;", "const webAppUrl = `${appUrl}/referral`;")

with open("src/bot.ts", "w") as f:
    f.write(content)
