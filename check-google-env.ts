console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "PRESENT (" + process.env.GOOGLE_CLIENT_ID.substring(0, 8) + "...)" : "MISSING");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "PRESENT" : "MISSING");
console.log("GOOGLE_REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI || "MISSING");
console.log("APP_URL:", process.env.APP_URL || "MISSING");
