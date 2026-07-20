import { getDb } from "./lib/firebase";
import { REWARD_TASKS } from "./lib/tasks";
import { getDoc, setDoc, query, where, getDocs, addDoc, orderBy, deleteDoc, limit } from "firebase/firestore";
import { doc, collection, getActiveBotId } from "./lib/botDb";
import { GoogleGenAI } from "@google/genai";
import { safeGenerateContent, safeSendMessage } from "./lib/gemini";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "royshare_aes_256_encryption_key_32bytes_long!";
const hashKey = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

function decryptSecret(text: string): string {
    if (!text) return "";
    if (!text.startsWith("enc:")) return text;
    try {
        const raw = text.substring(4);
        const parts = raw.split(":");
        const iv = Buffer.from(parts.shift() || "", "hex");
        const encryptedText = parts.join(":");
        const decipher = crypto.createDecipheriv("aes-256-cbc", hashKey, iv);
        let decrypted = decipher.update(encryptedText, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch (e) {
        console.error("Decryption failed:", e);
        return text;
    }
}

function formatCurrency(amount: number, currency: string = "INR", includeSymbol: boolean = true): string {
    if (currency === "USD") {
        const converted = amount * 0.0118;
        return includeSymbol ? `$${converted.toFixed(2)}` : converted.toFixed(2);
    } else {
        return includeSymbol ? `₹${amount.toFixed(2)}` : amount.toFixed(2);
    }
}

function getAppUrl(): string {
    return getMiniAppUrl("");
}

function getMiniAppUrl(pathAndQuery: string): string {
    const rawAppUrl = process.env.APP_URL || "https://royshare.online";
    let url = `${rawAppUrl.replace(/\/$/, "")}${pathAndQuery}`;
    const botId = getActiveBotId();
    if (botId && botId !== "default" && botId !== "undefined") {
        if (url.includes("?")) {
            url += `&botId=${botId}`;
        } else {
            url += `?botId=${botId}`;
        }
    }
    return url;
}

async function shortenWithProvider(provider: string, apiKey: string, url: string, publisherId?: string): Promise<string> {
    let endpoint = "";
    let responseText = "";
    
    const cleanProvider = (provider || "").trim().toLowerCase();
    
    if (cleanProvider === "own") {
        return url;
    }
    
    if (cleanProvider === "gplinks") {
        endpoint = `https://gplinks.in/api?api=${apiKey}&url=${encodeURIComponent(url)}`;
    } else if (cleanProvider === "shrinkme") {
        endpoint = `https://shrinkme.io/api?api=${apiKey}&url=${encodeURIComponent(url)}`;
    } else if (cleanProvider === "droplink") {
        endpoint = `https://droplink.co/api?api=${apiKey}&url=${encodeURIComponent(url)}`;
    } else if (cleanProvider === "shrinkearn") {
        endpoint = `https://shrinkearn.com/api?api=${apiKey}&url=${encodeURIComponent(url)}`;
    } else if (cleanProvider === "ouo.io") {
        endpoint = `https://ouo.io/api/${apiKey}?s=${encodeURIComponent(url)}`;
    } else if (cleanProvider === "shorte.st" || cleanProvider === "shortest") {
        endpoint = `https://api.shorte.st/stxt?k=${apiKey}&s=${encodeURIComponent(url)}`;
    } else if (cleanProvider === "adfly") {
        endpoint = `https://api.adf.ly/v1/shorten?_user_id=${publisherId || ""}&_api_key=${apiKey}&url=${encodeURIComponent(url)}`;
    } else {
        if (apiKey.includes("{URL}") || apiKey.includes("{url}")) {
            endpoint = apiKey.replace(/{URL}/g, encodeURIComponent(url)).replace(/{url}/g, encodeURIComponent(url));
        } else {
            endpoint = `https://gplinks.in/api?api=${apiKey}&url=${encodeURIComponent(url)}`;
        }
    }

    const res = await fetch(endpoint, {
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json, text/plain, */*"
        }
    });

    if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    responseText = await res.text();
    
    try {
        const data = JSON.parse(responseText);
        if (data.status === "success" && data.shortenedUrl) {
            return data.shortenedUrl;
        }
        if (data.shortenedUrl) {
            return data.shortenedUrl;
        }
        if (data.short_url) {
            return data.short_url;
        }
        if (data.url) {
            return data.url;
        }
        if (data.status === "error" && data.message) {
            throw new Error(data.message);
        }
    } catch (jsonErr) {
        const trimmed = responseText.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        throw new Error(`Invalid response format: ${responseText.substring(0, 100)}`);
    }

    throw new Error(`Could not extract short URL: ${responseText.substring(0, 100)}`);
}

export async function handleUpdate(botToken: string, update: any) {
    try {
        if (!update.message && !update.callback_query) return;
        
        console.log("handleUpdate received update ID:", update.update_id);

        const db = getDb();
        const userObj = update.message ? update.message.from : (update.callback_query ? update.callback_query.from : null);
        const chatId = update.message ? update.message.chat.id : (update.callback_query?.message?.chat?.id || null);

        if (userObj && userObj.id) {
            try {
                const userDocRef = doc(db, "users", String(userObj.id));
                const userSnap = await getDoc(userDocRef);
                const nowIso = new Date().toISOString();
                
                if (userSnap.exists()) {
                    console.log(`[USER LOG] USER EXISTS: ${userObj.id}`);
                    const existingData = userSnap.data();
                    const uData: any = { lastActive: nowIso };
                    
                    if (!existingData.chatId && chatId) uData.chatId = chatId;
                    if (!existingData.username && userObj.username) uData.username = userObj.username;
                    if (!existingData.firstName && userObj.first_name) uData.firstName = userObj.first_name;
                    if (!existingData.lastName && userObj.last_name) uData.lastName = userObj.last_name;
                    if (!existingData.languageCode && userObj.language_code) uData.languageCode = userObj.language_code;
                    
                    await setDoc(userDocRef, uData, { merge: true });
                } else {
                    console.log(`[USER LOG] NEW USER CREATED: ${userObj.id}`);
                    await setDoc(userDocRef, {
                        telegramId: userObj.id,
                        username: userObj.username || "",
                        firstName: userObj.first_name || "",
                        lastName: userObj.last_name || "",
                        languageCode: userObj.language_code || "",
                        chatId: chatId || 0,
                        createdAt: nowIso,
                        lastActive: nowIso,
                        joinDate: nowIso,
                        balance: 0,
                        rewards: 0,
                        referrals: 0,
                        availableBalance: 0,
                        totalEarnings: 0,
                        membershipVerified: false,
                        contactVerified: false
                    });
                }
            } catch (dbErr) {
                console.error("Failed to update user session:", dbErr);
            }
        }

        if (update.message) {
            const msg = update.message;
            const chatId = msg.chat.id;
            const user = msg.from;
            
            if (!user || !user.id) {
                console.log("Message has no sender. Skipping processing.");
                return;
            }
            
            console.log("Message received:", msg.text || "[Non-text]", "from user:", user.id);

            const userDocRef = doc(db, "users", String(user.id));
            const userSnap = await getDoc(userDocRef);
            const userData = userSnap.exists() ? userSnap.data() : null;

            if (msg.text && msg.text.startsWith("/start")) {
                 console.log("Matched /start command");
                 await processStart(botToken, chatId, user, msg.text);
            } else if (userData?.registrationStep === 'name' && msg.text) {
                const fullName = msg.text.trim();
                if (fullName.length >= 2) {
                    await setDoc(userDocRef, { 
                        enteredName: fullName,
                        registrationStep: 'mobile'
                    }, { merge: true });
                    await sendTelegramMessage(botToken, chatId, "📱 Please enter your Mobile Number.\n\nExample:\n9876543210");
                } else {
                    await sendTelegramMessage(botToken, chatId, "❌ Invalid name. Please enter your Full Name.");
                }
            } else if (userData?.registrationStep === 'mobile' && msg.text) {
                const mobile = msg.text.trim();
                const isNumeric = /^\d+$/.test(mobile);
                if (isNumeric && mobile.length === 10) {
                    await setDoc(userDocRef, { 
                        phone: mobile,
                        mobile: mobile,
                        registrationStep: 'invite_code'
                    }, { merge: true });

                    // Check for pre-registration by mobile number or automatic referral by link (pendingReferrerId)
                    const preRegDoc = await getDoc(doc(db, "referral_pre_registrations", mobile));
                    let pendingRefId = null;

                    if (preRegDoc.exists()) {
                        pendingRefId = preRegDoc.data()?.referrerId;
                        await setDoc(userDocRef, { pendingReferrerId: pendingRefId }, { merge: true });
                    } else {
                        const latestDoc = await getDoc(userDocRef);
                        pendingRefId = latestDoc.data()?.pendingReferrerId;
                    }

                    if (pendingRefId) {
                        try {
                            const referrerDoc = await getDoc(doc(db, "users", pendingRefId));
                            if (referrerDoc.exists()) {
                                const rData = referrerDoc.data();
                                const referrerName = rData.enteredName || rData.firstName || rData.username || "Referrer";
                                
                                await completeRegistrationAndCreditReferrer(db, botToken, chatId, String(user.id), pendingRefId, rData.referralCode || "Link");
                                await sendTelegramMessage(botToken, chatId, `✅ You joined using the referral link of:\n${referrerName}`);
                                return;
                            }
                        } catch (e) {
                            console.error("Error automatic referral linking:", e);
                        }
                    }

                    // Show manual invite code prompt if no deep link referrer was found
                    const message = `Please Enter Invite Code (Optional)

Type your invite code below and send, or click Skip to continue.`;
                    const inlineKeyboard = {
                        inline_keyboard: [
                            [{ text: "✅ Verify", callback_data: "invite_verify_msg" }, { text: "⏭️ Skip", callback_data: "invite_skip" }]
                        ]
                    };
                    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
                } else {
                    await sendTelegramMessage(botToken, chatId, "❌ Invalid mobile number.\n\nPlease enter a valid 10 digit number.");
                }
            } else if (userData?.registrationStep === 'invite_code' && msg.text) {
                const typedCode = msg.text.trim();
                const referrer = await findReferrerByCode(db, typedCode);
                if (referrer) {
                    const referrerId = referrer.id;
                    const rData = referrer.data;

                    if (referrerId === String(user.id)) {
                        await sendTelegramMessage(botToken, chatId, "❌ One Telegram account cannot refer itself.\n\nPlease enter a valid invite code or click Skip.");
                    } else {
                        await completeRegistrationAndCreditReferrer(db, botToken, chatId, String(user.id), referrerId, typedCode);
                        const referrerName = rData.enteredName || rData.firstName || rData.username || "Referrer";
                        await sendTelegramMessage(botToken, chatId, `✅ You were invited by:\n${referrerName}`);
                    }
                } else {
                    await sendTelegramMessage(botToken, chatId, "❌ Invalid Invite Code.\n\nPlease enter a valid invite code or click Skip.");
                }
            } else if (msg.contact) {
                // Disabled as per request
                await sendTelegramMessage(botToken, chatId, "⚠️ Direct contact sharing is no longer supported. Please follow the registration flow.");
            } else if (msg.text === "/uploadtest") {
            const db = getDb();
            await setDoc(doc(db, "users", String(user.id)), { uploadTestMode: true }, { merge: true });
            await sendTelegramMessage(botToken, chatId, "Test mode activated. Please send the file you want to test.");
        } else if (msg.text === "💰 Balance") {
            console.log("User selected Balance");
            await processBalance(botToken, chatId, user);
        } else if (msg.text === "💰 Earn Rewards") {
            console.log("User selected Earn Rewards");
            await processEarnRewards(botToken, chatId, user);
        } else if (msg.text === "📢 Announcements") {
            console.log("User selected Announcements");
            await processAnnouncements(botToken, chatId, user);
        } else if (msg.text === "🏆 Leaderboard") {
            console.log("User selected Leaderboard");
            await processLeaderboard(botToken, chatId, user);
        } else if (msg.text === "⚙️ Settings") {
            console.log("User selected Settings");
            await processSettingsMenu(botToken, chatId, user);
        } else if (msg.text === "👤 Account") {
            console.log("User selected Account");
            await processAccount(botToken, chatId, user);
        } else if (msg.text === "📤 Upload File") {
            console.log("User selected Upload File");
            await showUploadMenu(botToken, chatId, String(user.id));
        } else if (msg.text === "📁 My Content") {
            console.log("User selected My Content");
            await processMyContent(botToken, chatId, user);
        } else if (msg.text === "🔗 URL Shortener") {
            console.log("User selected URL Shortener");
            await showShortenerDashboard(botToken, chatId, user);
        } else if (msg.text === "🔗 My Links") {
            console.log("User selected My Links");
            await processMyLinks(botToken, chatId, user);
        } else if (msg.text === "📊 Dashboard") {
            console.log("User selected Dashboard");
            await processDashboard(botToken, chatId, user);
        } else if (msg.text === "🎧 Contact Support") {
            console.log("User selected Support");
            await processSupport(botToken, chatId, user);
        } else if (msg.text === "🎮 Game History") {
            console.log("User selected Game History");
            await processRPSGameHistory(botToken, chatId, user);
        } else if (msg.text === "📜 Withdrawal History") {
            console.log("User selected Withdrawal History");
            await processWithdrawalHistory(botToken, chatId, user);
        } else if (msg.text === "💸 Withdraw") {
            console.log("User selected Withdraw");
            await processWithdraw(botToken, chatId, user);
        } else if (msg.text === "👥 Refer & Earn") {
            console.log("User selected Refer & Earn");
            await processReferAndEarn(botToken, chatId, user);
        } else if (msg.text === "📋 Survey") {
            console.log("User selected Survey");
            const appUrl = getAppUrl();
            const webAppUrl = `${appUrl}/surveys?userId=${user.id}`;
            const message = `📋 *RoyShare Surveys*\n\nComplete surveys to earn extra rewards! New surveys are added regularly.\n\nClick the button below to start.`;
            const inlineKeyboard = {
                inline_keyboard: [
                    [{ text: "📋 Open Surveys", web_app: { url: webAppUrl } }]
                ]
            };
            await sendTelegramMessage(botToken, chatId, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
        } else if (msg.text && (msg.text.trim().startsWith("http://") || msg.text.trim().startsWith("https://"))) {
            console.log("Direct URL detected. Processing independent shortening.");
            const db = getDb();
            const urlText = msg.text.trim();
            const pendingShortLink = {
                originalUrl: urlText,
                password: "",
                alias: "",
                disablePreview: true
            };
            await setDoc(doc(db, "users", String(user.id)), { pendingShortLink }, { merge: true });
            await showLinkCreatorPanel(botToken, chatId, user);
        } else if (msg.document || msg.photo || msg.video || msg.audio) {
            const db = getDb();
            const userDoc = await getDoc(doc(db, "users", String(user.id)));
            if (userDoc.exists() && userDoc.data()?.uploadTestMode) {
               await processRealUpload(botToken, chatId, user, msg);
            }
        } else {
            const db = getDb();
            const userDoc = await getDoc(doc(db, "users", String(user.id)));
            const userData = userDoc.data();

const pendingAnnouncement = userData?.pendingAnnouncement;
            const pendingTicket = userData?.pendingSupportTicket;

            if (pendingAnnouncement) {
                if (pendingAnnouncement.step === 'title') {
                     await setDoc(doc(db, "users", String(user.id)), { pendingAnnouncement: { step: 'message', title: msg.text } }, { merge: true });
                     await sendTelegramMessage(botToken, chatId, "Please enter the announcement Message:");
                } else if (pendingAnnouncement.step === 'message') {
                     await setDoc(doc(db, "users", String(user.id)), { pendingAnnouncement: { step: 'type', title: pendingAnnouncement.title, message: msg.text } }, { merge: true });
                     const inlineKeyboard = {
                         inline_keyboard: [
                             [{ text: "🟢 Update", callback_data: "announce_type_Update" }],
                             [{ text: "🟡 Maintenance", callback_data: "announce_type_Maintenance" }],
                             [{ text: "🔴 Important Notice", callback_data: "announce_type_Important_Notice" }],
                             [{ text: "🎉 New Feature", callback_data: "announce_type_New_Feature" }],
                             [{ text: "💰 Bonus Event", callback_data: "announce_type_Bonus_Event" }]
                         ]
                     };
                     await sendTelegramMessage(botToken, chatId, "Select Announcement Type:", { reply_markup: inlineKeyboard });
                }
            } else if (pendingTicket && pendingTicket.status === 'typing_description') {
                // Create Ticket
                const ticketId = "TKT" + (Math.floor(Math.random() * 900000) + 100000);
                const docRef = await addDoc(collection(db, "tickets"), {
                    ticketId,
                    userId: String(user.id),
                    name: user.first_name + (user.last_name ? " " + user.last_name : ""),
                    username: user.username || "None",
                    issueType: getIssueTypeLabel(pendingTicket.type),
                    message: msg.text,
                    status: "🟡 Open",
                    createdAt: new Date().toISOString(),
                    lastReply: "",
                    adminReply: ""
                });
                await setDoc(doc(db, "users", String(user.id)), { pendingSupportTicket: null }, { merge: true });
                const dateString = formatDate(new Date().toISOString());
                const issueLabel = getIssueTypeLabel(pendingTicket.type);
                
                const successMsg = `✅ Ticket Created Successfully

🎫 Ticket ID:
${ticketId}

📂 Issue Type:
${issueLabel}

📌 Status:
🟡 Open

📅 Created:
${dateString}

⏱ Estimated Response Time:
2-24 Hours`;

                await sendTelegramMessage(botToken, chatId, successMsg);

                // Admin Notification
                try {
                    const settingsDoc = await getDoc(doc(db, "settings", "telegram"));
                    if (settingsDoc.exists()) {
                        const sData = settingsDoc.data();
                        const adminChatId = sData?.chatId;
                        if (adminChatId) {
                            const adminMsg = `🎫 New Support Ticket

Ticket ID:
${ticketId}

👤 User:
${user.first_name + (user.last_name ? " " + user.last_name : "")}

📛 Username:
@${user.username || "None"}

🆔 User ID:
${user.id}

📂 Issue:
${issueLabel}

📝 Message:
${msg.text}`;

                            const adminReplyMarkup = {
                                inline_keyboard: [
                                    [
                                        { text: "💬 Reply", callback_data: `admin_reply_${docRef.id}` },
                                        { text: "🟢 Resolve", callback_data: `admin_resolve_${docRef.id}` },
                                        { text: "🔴 Close", callback_data: `admin_close_${docRef.id}` }
                                    ]
                                ]
                            };

                            await sendTelegramMessage(botToken, adminChatId, adminMsg, { reply_markup: adminReplyMarkup });
                        }
                    }
                } catch (adminErr) {
                    console.error("Error sending notification to admin:", adminErr);
                }
            } else if (userData?.pendingAdminReply) {
                const replyData = userData.pendingAdminReply;
                await setDoc(doc(db, "users", String(user.id)), { pendingAdminReply: null }, { merge: true });
                await handleAdminReplyTextInput(botToken, chatId, user, msg.text, replyData);
            } else if (userData?.pendingUserTicketReply) {
                const replyData = userData.pendingUserTicketReply;
                await setDoc(doc(db, "users", String(user.id)), { pendingUserTicketReply: null }, { merge: true });
                await handleUserReplyTextInput(botToken, chatId, user, msg.text, replyData);
            } else if (userData?.pendingSearchFile) {
                await setDoc(doc(db, "users", String(user.id)), { pendingSearchFile: false }, { merge: true });
                await handleSearchQuery(botToken, chatId, user, msg.text);
            } else if (userData?.pendingShortenUrl) {
                await setDoc(doc(db, "users", String(user.id)), { pendingShortenUrl: false }, { merge: true });
                const urlText = msg.text.trim();
                let isValid = false;
                try {
                    const url = new URL(urlText);
                    isValid = url.protocol === "http:" || url.protocol === "https:";
                } catch (_) {
                    isValid = false;
                }
                
                if (!isValid) {
                    await sendTelegramMessage(botToken, chatId, "❌ Invalid URL format. Please enter a valid URL starting with http:// or https://.");
                    return;
                }

                const pendingShortLink = {
                    originalUrl: urlText,
                    password: "",
                    alias: "",
                    disablePreview: true
                };
                await setDoc(doc(db, "users", String(user.id)), { pendingShortLink }, { merge: true });
                await showLinkCreatorPanel(botToken, chatId, user);
            } else if (userData?.pendingShortenPassword) {
                await setDoc(doc(db, "users", String(user.id)), { pendingShortenPassword: false }, { merge: true });
                if (msg.text !== "/cancel") {
                    const pending = userData.pendingShortLink || {};
                    pending.password = msg.text.trim();
                    await setDoc(doc(db, "users", String(user.id)), { pendingShortLink: pending }, { merge: true });
                    await sendTelegramMessage(botToken, chatId, "✅ Password protection configured.");
                }
                await showLinkCreatorPanel(botToken, chatId, user);
            } else if (userData?.pendingShortenAlias) {
                await setDoc(doc(db, "users", String(user.id)), { pendingShortenAlias: false }, { merge: true });
                if (msg.text !== "/cancel") {
                    const aliasInput = msg.text.trim().toLowerCase();
                    if (!/^[a-z0-9_-]+$/i.test(aliasInput)) {
                        await sendTelegramMessage(botToken, chatId, "❌ Invalid alias format. Only alphanumeric characters, hyphens, and underscores are allowed.");
                    } else {
                        let taken = false;
                        const dSnap = await getDoc(doc(db, "links", aliasInput));
                        if (dSnap.exists()) taken = true;
                        if (!taken) {
                            const dSnap2 = await getDoc(doc(db, "smart_links", aliasInput));
                            if (dSnap2.exists()) taken = true;
                        }
                        if (!taken) {
                            const q1 = query(collection(db, "links"), where("alias", "==", aliasInput));
                            const qSnap1 = await getDocs(q1);
                            if (!qSnap1.empty) taken = true;
                        }
                        if (!taken) {
                            const q2 = query(collection(db, "smart_links"), where("alias", "==", aliasInput));
                            const qSnap2 = await getDocs(q2);
                            if (!qSnap2.empty) taken = true;
                        }

                        if (taken) {
                            await sendTelegramMessage(botToken, chatId, `❌ The alias "${aliasInput}" is already taken. Please choose another.`);
                        } else {
                            const pending = userData.pendingShortLink || {};
                            pending.alias = aliasInput;
                            await setDoc(doc(db, "users", String(user.id)), { pendingShortLink: pending }, { merge: true });
                            await sendTelegramMessage(botToken, chatId, `✅ Custom alias set to: ${aliasInput}`);
                        }
                    }
                }
                await showLinkCreatorPanel(botToken, chatId, user);
            } else if (userData?.pendingWithdrawal) {
                await handleWithdrawalTextInput(botToken, chatId, user, msg.text, userData.pendingWithdrawal);
            } else {
                console.log("Message did not match command or contact");
            }
        }
    } else if (update.callback_query) {
        console.log("Callback query received");
        await processCallback(botToken, update.callback_query);
    }
    } catch (err: any) {
        console.error("🔴 CRITICAL ERROR IN handleUpdate:");
        let errSrc = "unknown";
        if (err.stack) {
            const lines = err.stack.split("\n");
            for (const l of lines) {
                if (l.includes("at ") && !l.includes("node_modules") && !l.includes("node:internal")) {
                    errSrc = l.trim();
                    break;
                }
            }
        }
        console.error(`🔴 Source: ${errSrc}`);
        console.error(`🔴 Message: ${err.message || err}`);
        console.error("🔴 Stack Trace:");
        console.error(err.stack || err);
    }
}

async function handleAdminReplyTextInput(botToken: string, adminChatId: number, adminUser: any, replyMessage: string, replyData: { docId: string, ticketId: string }) {
    const db = getDb();
    const docId = replyData.docId;
    const ref = doc(db, "tickets", docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        await sendTelegramMessage(botToken, adminChatId, "⚠️ Ticket not found in Firestore.");
        return;
    }

    const ticketData = snap.data();
    const replies = ticketData.replies || [];
    replies.push({
        sender: "admin",
        message: replyMessage,
        createdAt: new Date().toISOString()
    });

    await setDoc(ref, {
        status: "replied",
        adminReply: replyMessage,
        lastReply: new Date().toISOString(),
        replies
    }, { merge: true });

    // Fetch the USER BOT token from settings/telegram
    const telegramSettingsDoc = await getDoc(doc(db, "settings", "telegram"));
    const userBotToken = decryptSecret(telegramSettingsDoc.data()?.botToken) || botToken;

    const originalUserId = ticketData.userId;
    const rawStatus = "replied";
    const statusText = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();

    const text = `📩 <b>Support Reply</b>\n\n🎫 <b>Ticket ID:</b> ${ticketData.ticketId || docId}\n\n💬 <b>Reply:</b>\n${replyMessage}\n\n<b>Status:</b> ${statusText}`;

    const requestPayload = {
        chat_id: String(originalUserId),
        text: text,
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🔄 Refresh Ticket", callback_data: `ticket_details_${docId}` },
                    { text: "📂 View Ticket", callback_data: `ticket_details_${docId}` }
                ]
            ]
        }
    };

    console.log(`[DEBUG] Support Reply (Bot) - Attempting to send message:
- Ticket ID: ${ticketData.ticketId || docId}
- User ID: ${originalUserId}
- Bot Token Used: ${userBotToken ? `${userBotToken.substring(0, 8)}...` : "NONE"}
- sendMessage Request: ${JSON.stringify(requestPayload, null, 2)}`);

    let responseData: any = null;
    let success = false;
    let errorDetails: string | null = null;

    try {
        const apiRes = await fetch(`https://api.telegram.org/bot${userBotToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestPayload)
        });

        responseData = await apiRes.json();
        success = !!(responseData && responseData.ok);

        if (success) {
            console.log(`[DEBUG] Support Reply (Bot) - Success:
- Telegram API Response: ${JSON.stringify(responseData, null, 2)}
- Success / Failed: Success`);
            await sendTelegramMessage(botToken, adminChatId, `✅ Reply sent to user for Ticket ${ticketData.ticketId}.`);
        } else {
            errorDetails = responseData?.description || "Unknown Telegram API Error";
            console.error(`[DEBUG] Support Reply (Bot) - Failed:
- Error details: ${errorDetails}
- Telegram API Response: ${JSON.stringify(responseData, null, 2)}
- Success / Failed: Failed`);
            await sendTelegramMessage(botToken, adminChatId, `❌ Failed to send reply to user: ${errorDetails}`);
        }
    } catch (fetchErr: any) {
        errorDetails = fetchErr.message || "Network Error";
        console.error(`[DEBUG] Support Reply (Bot) - Failed:
- Error details: ${errorDetails}
- Telegram API Response: ${JSON.stringify(responseData || {}, null, 2)}
- Success / Failed: Failed`);
        await sendTelegramMessage(botToken, adminChatId, `❌ Failed to send reply to user: ${errorDetails}`);
    }
}

async function handleUserReplyTextInput(botToken: string, chatId: number, user: any, replyMessage: string, replyData: { docId: string }) {
    const db = getDb();
    const docId = replyData.docId;
    const ref = doc(db, "tickets", docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        await sendTelegramMessage(botToken, chatId, "⚠️ Ticket not found.");
        return;
    }

    const ticketData = snap.data();
    const replies = ticketData.replies || [];
    replies.push({
        sender: "user",
        message: replyMessage,
        createdAt: new Date().toISOString()
    });

    await setDoc(ref, {
        status: "open",
        lastReply: new Date().toISOString(),
        replies
    }, { merge: true });

    await sendTelegramMessage(botToken, chatId, "✅ Your reply has been sent to our support team successfully.");

    // Notify admin
    try {
        const settingsDoc = await getDoc(doc(db, "settings", "telegram"));
        if (settingsDoc.exists()) {
            const sData = settingsDoc.data();
            const adminChatId = sData?.chatId || sData?.adminChatId;
            if (adminChatId) {
                const adminMsg = `📩 <b>User Replied to Support Ticket</b>\n\n` +
                    `<b>Ticket ID:</b> <code>${ticketData.ticketId || docId}</code>\n` +
                    `<b>User:</b> ${ticketData.name || 'User'} (@${ticketData.username || ''})\n\n` +
                    `<b>Message:</b>\n${replyMessage}`;

                const adminReplyMarkup = {
                    inline_keyboard: [
                        [
                            { text: "💬 Reply", callback_data: `admin_reply_${docId}` },
                            { text: "✅ Resolve", callback_data: `admin_resolve_${docId}` },
                            { text: "❌ Close", callback_data: `admin_close_${docId}` }
                        ]
                    ]
                };

                await sendTelegramMessage(botToken, Number(adminChatId), adminMsg, { reply_markup: adminReplyMarkup, parse_mode: "HTML" });
            }
        }
    } catch (adminErr) {
        console.error("Error sending notification to admin:", adminErr);
    }
}

async function logDbError(context: { collection: string, docId: string, operation: string, userId?: number }) {
    // Silent logging
    // console.error(`DB Error:`, { context });
}

async function ensureSettings() {
    const db = getDb();
    const docRef = doc(db, "settings", "telegram");
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        console.log("Seeding default settings/telegram");
        await setDoc(docRef, {
            botToken: "",
            chatId: "",
            forceJoinChannel: "",
            forceJoinGroup: "",
            storageChannelId: "",
            channelLink: "", // Added these to match previous code expectations
            groupLink: "",
            pollingEnabled: true,
            webhookEnabled: false
        });
        console.log("Settings/telegram seeded successfully");
    }
}

const REFERRAL_SECRET = process.env.REFERRAL_SECRET || "royshare_super_secure_salt_9182";

function verifySecureReferralToken(token: string): { userId: string; referralCode: string; createdAt: number; expiresAt: number } | null {
    try {
      const raw = Buffer.from(token, "base64url").toString("utf8");
      const tokenObj = JSON.parse(raw);
      if (!tokenObj || !tokenObj.p || !tokenObj.s) return null;
      
      const payloadStr = JSON.stringify(tokenObj.p);
      const expectedSignature = crypto.createHmac("sha256", REFERRAL_SECRET).update(payloadStr).digest("hex");
      if (expectedSignature !== tokenObj.s) {
        console.warn("[ReferralToken] Signature mismatch in bot!");
        return null;
      }
      
      if (Date.now() > tokenObj.p.expiresAt) {
        console.warn("[ReferralToken] Token expired in bot!");
        return null;
      }
      
      return tokenObj.p;
    } catch (e) {
      console.error("[ReferralToken] Error verifying token in bot:", e);
      return null;
    }
}

async function findReferrerByCode(db: any, code: string): Promise<any> {
    if (!code) return null;
    const cleanCode = code.trim();

    // 1. Try decoding as secure token first
    const decodedToken = verifySecureReferralToken(cleanCode);
    if (decodedToken && decodedToken.userId) {
        const userDocRef = doc(db, "users", decodedToken.userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            return { id: userDocSnap.id, data: userDocSnap.data() };
        }
    }
    
    // 2. Try to find by Telegram ID directly
    const directDoc = await getDoc(doc(db, "users", cleanCode));
    if (directDoc.exists()) {
        return { id: directDoc.id, data: directDoc.data() };
    }

    // 3. Try to find by referralCode field
    const q1 = query(collection(db, "users"), where("referralCode", "==", cleanCode));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
        return { id: snap1.docs[0].id, data: snap1.docs[0].data() };
    }

    // 4. Try to find if code starts with ref_ and strip it
    if (cleanCode.startsWith("ref_")) {
        const stripped = cleanCode.substring(4);
        
        // Try to find by referralCode field first
        const q2 = query(collection(db, "users"), where("referralCode", "==", stripped));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
            return { id: snap2.docs[0].id, data: snap2.docs[0].data() };
        }
        
        // Fallback to finding by Telegram ID directly
        const refDoc = await getDoc(doc(db, "users", stripped));
        if (refDoc.exists()) {
            return { id: refDoc.id, data: refDoc.data() };
        }
    }

    return null;
}

async function completeRegistrationAndCreditReferrer(db: any, botToken: string, chatId: number, userId: string, referrerId: string | null, inviteCodeUsed: string = "None") {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    if (userData.registrationStep === 'completed') {
        return;
    }

    const now = new Date().toISOString();
    const cleanReferredBy = referrerId ? String(referrerId) : null;

    let rewardAmount = 10;
    try {
        const systemDoc = await getDoc(doc(db, "settings", "system"));
        if (systemDoc.exists()) {
            const rSettings = systemDoc.data()?.referralSettings;
            if (rSettings && rSettings["Referral Reward"]) {
                rewardAmount = parseFloat(rSettings["Referral Reward"]) || 10;
            }
        }
    } catch (e) {
        console.error("Error fetching referral reward amount from settings:", e);
    }

    let referrerName = "N/A";
    if (cleanReferredBy) {
        try {
            const referrerDoc = await getDoc(doc(db, "users", cleanReferredBy));
            if (referrerDoc.exists()) {
                const rData = referrerDoc.data();
                referrerName = rData.enteredName || rData.firstName || rData.username || "Referrer";
                
                // Prevent duplicate referral docs
                const refDocRef = doc(db, "referrals", userId);
                const refSnap = await getDoc(refDocRef);

                if (!refSnap.exists()) {
                    await setDoc(refDocRef, {
                        referrerId: cleanReferredBy,
                        referredUserId: userId,
                        referrerName: referrerName,
                        referredName: userData.enteredName || userData.firstName || "Referred Friend",
                        referredUsername: userData.username || "",
                        referredFirstName: userData.firstName || "",
                        referredLastName: userData.lastName || "",
                        joinDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                        createdAt: now,
                        status: "Registered", // RoyShare V4 pending status
                        urlClickCount: 0,
                        downloadCount: 0,
                        withdrawalStatus: "None",
                        rewardAmount: rewardAmount,
                        rewardCredited: false
                    });

                    const notificationMsg = `🎉 *New Referral Registered*

👤 *Name:*
${userData.enteredName || userData.firstName || "New Friend"}

Status: *🟢 Registered*

_Invite commission will be unlocked after your friend completes their URL/download work and submits their first withdrawal!_`;

                    await sendTelegramMessage(botToken, Number(cleanReferredBy), notificationMsg, { parse_mode: "Markdown" });
                }
            }
        } catch (e) {
            console.error("Error crediting referrer:", e);
        }
    }

    await setDoc(userDocRef, {
        registrationStep: 'completed',
        membershipVerified: true,
        contactVerified: true,
        verified: true,
        registrationDate: now,
        lastActive: now,
        referredBy: cleanReferredBy,
        referrerName: referrerName,
        inviteCodeUsed: inviteCodeUsed
    }, { merge: true });

    const successMsg = `✅ *Registration Successful*

👤 *Name:*
${userData.enteredName || "Not set"}

📱 *Mobile:*
${userData.phone || userData.mobile || "Not set"}

🆔 *Telegram ID:*
${userId}

👤 *Username:*
@${userData.username || "None"}

Welcome to Roy Share Earn ❤️`;

    await sendTelegramMessage(botToken, chatId, successMsg, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [[{ text: "🚀 Continue", callback_data: "registration_continue" }]]
        }
    });
}

async function handleDeepLinkReferral(db: any, botToken: string, chatId: number, user: any, rawCode: string) {
    const referredUserId = String(user.id);
    
    // 1. Verify inviteToken from Firestore
    const referrer = await findReferrerByCode(db, rawCode);
    if (!referrer) {
        await sendTelegramMessage(botToken, chatId, "❌ Invalid or expired referral code. You can still register directly!");
        return;
    }
    
    const referrerId = referrer.id;
    const referrerData = referrer.data;
    
    // 2. Prevent self-referrals
    if (referredUserId === referrerId) {
        await sendTelegramMessage(botToken, chatId, "❌ You cannot refer yourself!");
        return;
    }
    
    // 3. Prevent duplicate claims
    const claimDocRef = doc(db, "referral_claims", referredUserId);
    const claimSnap = await getDoc(claimDocRef);
    if (claimSnap.exists()) {
        await sendTelegramMessage(botToken, chatId, "⚠️ You have already claimed your referral reward!", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Return to RoyShare", url: `${getAppUrl()}/referral-success?code=${rawCode}&success=true` }],
                    [{ text: "📱 Open Mini App", web_app: { url: `${getAppUrl()}/` } }]
                ]
            }
        });
        return;
    }
    
    // Also check if user document already exists and is already completed
    const userDocRef = doc(db, "users", referredUserId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists() && userSnap.data()?.registrationStep === 'completed' && userSnap.data()?.referredBy) {
        await sendTelegramMessage(botToken, chatId, "⚠️ You have already completed your registration via a referral link!", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Return to RoyShare", url: `${getAppUrl()}/referral-success?code=${rawCode}&success=true` }],
                    [{ text: "📱 Open Mini App", web_app: { url: `${getAppUrl()}/` } }]
                ]
            }
        });
        return;
    }
    
    // 4. Save: telegramUserId, username, inviteToken, joinedAt
    const now = new Date().toISOString();
    await setDoc(claimDocRef, {
        telegramUserId: referredUserId,
        username: user.username || "",
        inviteToken: rawCode,
        referrerId: referrerId,
        joinedAt: now
    });
    
    // 5. Credit rewards after successful verification
    let rewardAmount = 10;
    try {
        const systemDoc = await getDoc(doc(db, "settings", "system"));
        if (systemDoc.exists()) {
            const rSettings = systemDoc.data()?.referralSettings;
            if (rSettings && rSettings["Referral Reward"]) {
                rewardAmount = parseFloat(rSettings["Referral Reward"]) || 10;
            }
        }
    } catch (e) {
        console.error("Error fetching referral reward:", e);
    }
    
    // Credit referred user
    let existingBalance = 0;
    let existingAvailableBalance = 0;
    let existingTotalEarnings = 0;
    let existingRewards = 0;
    let referralCode = `RS${referredUserId.slice(-6).toUpperCase()}`;
    
    if (userSnap.exists()) {
        const uData = userSnap.data();
        existingBalance = Number(uData.balance || 0);
        existingAvailableBalance = Number(uData.availableBalance || 0);
        existingTotalEarnings = Number(uData.totalEarnings || 0);
        existingRewards = Number(uData.rewards || 0);
        referralCode = uData.referralCode || referralCode;
    }
    
    await setDoc(userDocRef, {
        id: referredUserId,
        telegramId: user.id,
        username: user.username || "",
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        createdAt: userSnap.exists() ? (userSnap.data()?.createdAt || now) : now,
        balance: existingBalance + rewardAmount,
        availableBalance: existingAvailableBalance + rewardAmount,
        totalEarnings: existingTotalEarnings + rewardAmount,
        rewards: existingRewards + rewardAmount,
        referredBy: referrerId,
        referrerName: referrerData.enteredName || referrerData.firstName || referrerData.username || "Referrer",
        registrationStep: 'completed',
        membershipVerified: true,
        contactVerified: true,
        verified: true,
        referralCode,
        status: "Active",
        lastActive: now,
        updatedAt: now
    }, { merge: true });
    
    // Create referral document to display in dashboard
    const refDocRef = doc(db, "referrals", referredUserId);
    await setDoc(refDocRef, {
        referrerId: referrerId,
        referredUserId: referredUserId,
        referrerName: referrerData.enteredName || referrerData.firstName || referrerData.username || "Referrer",
        referredName: user.first_name || "Referred Friend",
        referredUsername: user.username || "",
        referredFirstName: user.first_name || "",
        referredLastName: user.last_name || "",
        joinDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdAt: now,
        status: "Referral Approved", // pre-approve
        urlClickCount: 0,
        downloadCount: 0,
        withdrawalStatus: "None",
        rewardAmount: rewardAmount,
        rewardCredited: true
    });
    
    // Credit referrer too!
    const referrerDocRef = doc(db, "users", referrerId);
    const referrerSnap = await getDoc(referrerDocRef);
    if (referrerSnap.exists()) {
        const rData = referrerSnap.data();
        const currentRefs = Number(rData.referrals || 0) + 1;
        const currentBalance = Number(rData.availableBalance || 0) + rewardAmount;
        const currentTotalEarnings = Number(rData.totalEarnings || 0) + rewardAmount;
        const currentReferralEarnings = Number(rData.referralEarnings || 0) + rewardAmount;
        
        await setDoc(referrerDocRef, {
            referrals: currentRefs,
            availableBalance: currentBalance,
            totalEarnings: currentTotalEarnings,
            referralEarnings: currentReferralEarnings,
            updatedAt: now
        }, { merge: true });
        
        // Notify referrer
        const referrerNotifyMsg = `🎉 *New Referral Registered via Telegram Deep Link!*

👤 *Friend:* ${user.first_name || "New Friend"} (@${user.username || "None"})

Welcome Reward *₹${rewardAmount}* has been added to your available balance!`;
        await sendTelegramMessage(botToken, Number(referrerId), referrerNotifyMsg, { parse_mode: "Markdown" });
    }
    
    // 7. Send confirmation message to referred user
    const successMsg = `✅ *Referral verified successfully.*
Reward has been added to your account.

💰 Welcome Bonus: *₹${rewardAmount}*
👤 Referrer: *${referrerData.enteredName || referrerData.firstName || referrerData.username || "Referrer"}*

Click below to return to RoyShare or open the app!`;
    
    await sendTelegramMessage(botToken, chatId, successMsg, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "✅ Return to RoyShare", url: `${getAppUrl()}/referral-success?code=${rawCode}&success=true` }],
                [{ text: "📱 Open Mini App", web_app: { url: `${getAppUrl()}/` } }]
            ]
        }
    });
}

async function processStart(botToken: string, chatId: number, user: any, startText?: string) {
    try {
        console.log(`[USER LOG] START RECEIVED: ${user.id}`);
        const db = getDb();
        
        // Check deep link parameter
        if (startText && startText.startsWith("/start")) {
            const parts = startText.trim().split(/\s+/);
            if (parts.length > 1) {
                const rawCode = parts[1].trim();
                if (rawCode) {
                    console.log(`[USER LOG] Start parameter detected: ${rawCode}`);
                    
                    // If it is NOT a download deep link, handle it as a referral link!
                    if (!rawCode.startsWith("dl_")) {
                        await handleDeepLinkReferral(db, botToken, chatId, user, rawCode);
                        return;
                    }
                }
            }
        }

        // Check for download deep link
        if (startText && startText.includes(" dl_")) {
            const fileId = startText.split(" dl_")[1]?.trim();
            await setDoc(doc(db, "users", String(user.id)), {
                pendingDownloadId: fileId
            }, { merge: true });
        }

        const userDocRef = doc(db, "users", String(user.id));
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.data();

        if (userData?.registrationStep === 'completed') {
            console.log("DASHBOARD OPENED");
            console.log(`[USER LOG] DASHBOARD OPENED: ${user.id}`);
            
            const welcomeMsg = "Welcome back to Roy Share Earn!";
            
            if (userData?.pendingDownloadId) {
                await fulfillDownload(botToken, chatId, userData.pendingDownloadId);
                await setDoc(userDocRef, { pendingDownloadId: null }, { merge: true });
            } else {
                await sendTelegramMessage(botToken, chatId, welcomeMsg, { reply_markup: getMainMenuKeyboard(user.id) });
            }
            return;
        }

        // Resume flow if intermediate steps exist
        if (userData?.registrationStep === 'name') {
            await sendTelegramMessage(botToken, chatId, "👤 Please enter your Full Name.\n\nExample:\nRitik Rai");
            return;
        } else if (userData?.registrationStep === 'mobile') {
            await sendTelegramMessage(botToken, chatId, "📱 Please enter your Mobile Number.\n\nExample:\n9876543210");
            return;
        } else if (userData?.registrationStep === 'invite_code') {
            const message = `Please Enter Invite Code (Optional)\n\nType your invite code below and send, or click Skip to continue.`;
            const inlineKeyboard = {
                inline_keyboard: [
                    [{ text: "✅ Verify", callback_data: "invite_verify_msg" }, { text: "⏭️ Skip", callback_data: "invite_skip" }]
                ]
            };
            await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
            return;
        }

        // START NEW REGISTRATION FLOW
        const message = `👋 Welcome to Roy Share Earn

Before using the platform you must complete registration.

Please complete the following steps.

1️⃣ Join Channel
2️⃣ Join Group
3️⃣ Verify
4️⃣ Complete Registration`;
        
        const appUrl = getAppUrl();
        const surveyUrl = `${appUrl}/surveys?userId=${user.id}`;

        await sendTelegramMessage(botToken, chatId, message, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📢 Join Channel", url: "https://t.me/royshare_official" }],
                    [{ text: "👥 Join Group", url: "https://t.me/RoyShareCommunity" }],
                    [{ text: "✅ Verify", callback_data: "verify_membership" }],
                    [{ text: "📋 Take a Survey", web_app: { url: surveyUrl } }]
                ]
            }
        });

    } catch (err: any) {
        console.error("🔴 ERROR STACK TRACE IN processStart:");
        let errSrc = "unknown";
        if (err.stack) {
            const lines = err.stack.split("\n");
            for (const l of lines) {
                if (l.includes("at ") && !l.includes("node_modules") && !l.includes("node:internal")) {
                    errSrc = l.trim();
                    break;
                }
            }
        }
        console.error(`🔴 Source: ${errSrc}`);
        console.error(`🔴 Message: ${err.message || err}`);
        console.error("🔴 Full Stack Trace:");
        console.error(err.stack || err);
    }
}

async function processUploadTest(botToken: string, chatId: number, user: any, msg: any) {
   const db = getDb();
   await setDoc(doc(db, "users", String(user.id)), { uploadTestMode: false }, { merge: true });
   
   const settingsDoc = await getDoc(doc(db, "settings", "telegram"));
   const storageChannelId = settingsDoc.data()?.storageChannelId || "NOT_SET";
   
   const fileId = msg.document?.file_id || (msg.photo ? msg.photo[msg.photo.length - 1].file_id : "UNKNOWN");
   const fileName = msg.document?.file_name || "photo.jpg";
   const fileSize = msg.document?.file_size || 0;

   const messageId = "TEST_" + Date.now();
   const firestoreDocId = "TEST_DB_" + Date.now();
   const downloadLink = `https://t.me/c/${storageChannelId.toString().replace('-100', '')}/${messageId}`;

   await setDoc(doc(db, "test_uploads", firestoreDocId), {
       fileId, fileName, fileSize, messageId, storageChannelId, timestamp: new Date().toISOString()
   });

   const reply = `Upload Status: Success
File Name: ${fileName}
File Size: ${fileSize}
Telegram Message ID: ${messageId}
Storage Channel ID: ${storageChannelId}
Firestore Document ID: ${firestoreDocId}
Generated Download Link: ${downloadLink}`;

   await sendTelegramMessage(botToken, chatId, reply);
}

async function forwardFileToStorageChannel(botToken: string, storageChannelId: string, msg: any): Promise<number | null> {
    try {
        let method = "";
        let body: any = { chat_id: storageChannelId };
        
        if (msg.document) {
            method = "sendDocument";
            body.document = msg.document.file_id;
        } else if (msg.photo) {
            method = "sendPhoto";
            body.photo = msg.photo[msg.photo.length - 1].file_id;
        } else if (msg.video) {
            method = "sendVideo";
            body.video = msg.video.file_id;
        } else if (msg.audio) {
            method = "sendAudio";
            body.audio = msg.audio.file_id;
        } else {
            return null;
        }

        const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const resData = await res.json();
        if (resData.ok && resData.result) {
            return resData.result.message_id;
        } else {
            console.error("Telegram upload response error:", resData);
        }
    } catch (e) {
        console.error("Error uploading file to storage channel:", e);
    }
    return null;
}

async function processRealUpload(botToken: string, chatId: number, user: any, msg: any) {
    const db = getDb();
    
    // Turn off upload mode
    await setDoc(doc(db, "users", String(user.id)), { uploadTestMode: false }, { merge: true });
    
    // 1. Get storageChannelId from settings/telegram
    const settingsDoc = await getDoc(doc(db, "settings", "telegram"));
    const storageChannelId = settingsDoc.data()?.storageChannelId || "NOT_SET";
    
    // 2. Extract file properties
    let fileId = "UNKNOWN";
    let fileName = "file";
    let fileSize = 0;
    
    if (msg.document) {
        fileId = msg.document.file_id;
        fileName = msg.document.file_name || "document";
        fileSize = msg.document.file_size || 0;
    } else if (msg.photo) {
        const largestPhoto = msg.photo[msg.photo.length - 1];
        fileId = largestPhoto.file_id;
        fileName = `Photo_${Date.now()}.jpg`;
        fileSize = largestPhoto.file_size || 0;
    } else if (msg.video) {
        fileId = msg.video.file_id;
        fileName = msg.video.file_name || `Video_${Date.now()}.mp4`;
        fileSize = msg.video.file_size || 0;
    } else if (msg.audio) {
        fileId = msg.audio.file_id;
        fileName = msg.audio.file_name || `Audio_${Date.now()}.mp3`;
        fileSize = msg.audio.file_size || 0;
    }
    
    // 3. Upload/forward to the storage channel
    let telegramMessageId: number | string = "NOT_SET";
    if (storageChannelId && storageChannelId !== "NOT_SET") {
        const forwardedId = await forwardFileToStorageChannel(botToken, storageChannelId, msg);
        if (forwardedId !== null) {
            telegramMessageId = forwardedId;
        }
    }
    
    // 4. Generate a unique File ID
    const uniqueFileId = "FL" + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // 5. Generate public link
    const appUrl = getAppUrl();
    const baseDomain = appUrl.replace(/\/$/, "");
    const generatedLink = `${baseDomain}/download/${uniqueFileId}`;
    
    // 6. Format upload date
    const formattedDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }); // "23 Jun 2026"
    
    // 7. Save to Firestore
    await setDoc(doc(db, "uploads", uniqueFileId), {
        fileId: uniqueFileId,
        telegramFileId: fileId,
        userId: String(user.id),
        fileName,
        fileSize,
        telegramMessageId,
        storageChannelId,
        uploadDate: formattedDate,
        generatedLink,
        status: "active",
        storage: "telegram",
        downloads: 0,
        earnings: 0
    });
    
    // Update user stats
    try {
        const uRef = doc(db, "users", String(user.id));
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
            const currentTotalFiles = uSnap.data().totalFiles || 0;
            await setDoc(uRef, {
                totalFiles: currentTotalFiles + 1
            }, { merge: true });
        }
    } catch (e) {}

    // Synchronize referral status to make active if applicable
    await syncReferralsForUser(db, botToken, String(user.id));
    
    // 8. Send reply
    const displaySize = formatBytes(fileSize);
    
    const message = `✅ *Upload Successful*\n\n📄 *File Name:* ${fileName}\n📦 *File Size:* ${displaySize}\n☁️ *Storage:* Telegram\n🔗 *RoyShare Link:*\n${generatedLink}`;

    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: "🔗 Open Link", url: generatedLink },
                { text: "📋 Copy Link", callback_data: `mycontent_copy_${uniqueFileId}` }
            ],
            [
                { text: "📂 My Files", web_app: { url: getMiniAppUrl(`/app?page=content&userId=${chatId}`) } }
            ]
        ]
    };
    
    await sendTelegramMessage(botToken, chatId, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
}

async function copyMessage(botToken: string, chatId: number | string, fromChatId: string | number, messageId: number | string) {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/copyMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            from_chat_id: fromChatId,
            message_id: messageId
        })
    });
    return await res.json();
}

async function fulfillDownload(botToken: string, chatId: number, fileId: string) {
    const db = getDb();
    const fileDoc = await getDoc(doc(db, "uploads", fileId));
    if (!fileDoc.exists()) {
        await sendTelegramMessage(botToken, chatId, "❌ File not found or has been deleted.");
        return;
    }
    const fileData = fileDoc.data();
    
    // Increment download count
    const currentDownloads = Number(fileData.downloads || 0) + 1;
    await setDoc(doc(db, "uploads", fileId), { downloads: currentDownloads }, { merge: true });

    if (fileData.telegramMessageId && fileData.storageChannelId && fileData.telegramMessageId !== "NOT_SET") {
        await copyMessage(botToken, chatId, fileData.storageChannelId, fileData.telegramMessageId);
    } else {
        await sendTelegramMessage(botToken, chatId, `📄 File Name: ${fileData.fileName}\n🔗 Download here: ${fileData.generatedLink || 'N/A'}`);
    }
}

async function showShortenerDashboard(botToken: string, chatId: number, user: any) {
    const db = getDb();
    
    // Check if enabled first
    let enabled = true;
    try {
        const sysDoc = await getDoc(doc(db, "settings", "system"));
        if (sysDoc.exists() && sysDoc.data().urlShortener) {
            enabled = sysDoc.data().urlShortener.enabled !== false;
        }
    } catch (err) {}
    
    if (!enabled) {
        await sendTelegramMessage(botToken, chatId, "⚠️ The URL Shortener feature is currently disabled by the administrator.");
        return;
    }

    // Reset pending states
    await setDoc(doc(db, "users", String(user.id)), { 
        pendingShortenUrl: false,
        pendingWithdrawal: null,
        pendingSearchFile: false,
        pendingShortenPassword: null,
        pendingShortenAlias: null
    }, { merge: true });

    // Fetch up to 3 recently created links
    const qLinks = query(collection(db, "links"), where("userId", "==", String(user.id)));
    const snapshotLinks = await getDocs(qLinks);
    const activeLinks = snapshotLinks.docs
        .map(d => ({ id: d.id, ...d.data() as any }))
        .filter(d => d.status !== "deleted")
        .sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
        });

    let message = `🔗 <b>Smart URL Shortener Dashboard</b>\n\n`;
    message += `Create secure, tracking-enabled short links. Monetize and monitor your traffic in real time!\n\n`;
    
    if (activeLinks.length > 0) {
        message += `✨ <b>Recently Created Links</b>\n`;
        activeLinks.slice(0, 3).forEach((link, idx) => {
            const isProtected = !!link.password || !!link.isPasswordProtected;
            const aliasText = link.alias && !/^[A-Z0-9]{6}$/.test(link.alias) ? ` | 🏷️ <code>${link.alias}</code>` : "";
            message += `${idx + 1}. <code>${link.shortUrl}</code>\n`;
            message += `   🎯 <b>Original:</b> <code>${link.originalUrl || link.destinationUrl}</code>\n`;
            message += `   📈 <b>Views:</b> ${link.views || 0} | 🔒 <b>Password:</b> ${isProtected ? "Yes" : "No"}${aliasText}\n\n`;
        });
    } else {
        message += `ℹ️ <i>No short links created yet. Click below to shorten your first link!</i>\n\n`;
    }
    
    message += `━━━━━━━━━━━━━━━`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "➕ Shorten a New URL", callback_data: "shortlink_another" }],
            [{ text: "🔗 View All My Links", web_app: { url: getMiniAppUrl(`/app?page=links&userId=${chatId}`) } }]
        ]
    };

    await sendTelegramMessage(botToken, chatId, message, {
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
        disable_web_page_preview: true
    });
}

async function showLinkCreatorPanel(botToken: string, chatId: number, user: any) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, "users", String(user.id)));
    if (!userDoc.exists()) return;
    const userData = userDoc.data();
    const pending = userData.pendingShortLink;
    if (!pending) {
        await sendTelegramMessage(botToken, chatId, "❌ No pending link creation found. Please try again.");
        return;
    }

    const dest = pending.originalUrl;
    const password = pending.password || "None";
    const alias = pending.alias || "None";
    const disablePreview = pending.disablePreview !== false;

    let message = `📝 <b>Link Creator Settings</b>\n\n`;
    message += `🔗 <b>Destination:</b> <code>${dest}</code>\n`;
    message += `🔒 <b>Password Protection:</b> <code>${password}</code>\n`;
    message += `🏷️ <b>Custom Alias:</b> <code>${alias}</code>\n`;
    message += `👁️ <b>Web Page Preview:</b> <code>${disablePreview ? "Disabled 🚫" : "Enabled ✅"}</code>\n\n`;
    message += `Configure optional settings above, then click 🚀 <b>Generate Short Link</b> below to create your link!`;

    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: "🔒 Set Password", callback_data: "shortlink_set_password" },
                { text: "🏷️ Set Custom Alias", callback_data: "shortlink_set_alias" }
            ],
            [
                { text: `👁️ Preview: ${disablePreview ? "Disable" : "Enable"}`, callback_data: "shortlink_toggle_preview" }
            ],
            [
                { text: "🚀 Generate Short Link", callback_data: "shortlink_generate" },
                { text: "❌ Cancel", callback_data: "shortlink_cancel" }
            ]
        ]
    };

    await sendTelegramMessage(botToken, chatId, message, {
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
        disable_web_page_preview: true
    });
}

async function processMyLinkAnalytics(botToken: string, chatId: number, linkId: string) {
    const db = getDb();
    let docSnap = await getDoc(doc(db, "links", linkId));
    if (!docSnap.exists()) {
        docSnap = await getDoc(doc(db, "smart_links", linkId));
    }
    
    if (!docSnap.exists() || docSnap.data()?.status === "deleted") {
        await sendTelegramMessage(botToken, chatId, "❌ Link not found or has been deleted.");
        return;
    }
    
    const link = docSnap.data();
    const userDoc = await getDoc(doc(db, "users", String(link.userId)));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";

    const totalViews = link.views || link.clicks || 0;
    const earnings = link.earnings || 0;
    const isPasswordProtected = !!link.password || !!link.isPasswordProtected;
    const customAlias = link.alias && !/^[A-Z0-9]{6}$/.test(link.alias) ? link.alias : "None";
    
    const todayViews = link.todayViews !== undefined ? link.todayViews : Math.floor(totalViews * 0.1);
    const weekViews = link.weekViews !== undefined ? link.weekViews : Math.floor(totalViews * 0.4);
    const monthViews = link.monthViews !== undefined ? link.monthViews : totalViews;
    
    let message = `📊 <b>Link Analytics & Status</b>\n\n`;
    message += `🔗 <b>Original URL:</b> <code>${link.originalUrl || link.destinationUrl || "N/A"}</code>\n`;
    message += `🔗 <b>Short Link:</b> <code>${link.shortUrl || "N/A"}</code>\n\n`;
    message += `👁 <b>Total Views:</b> ${totalViews}\n`;
    message += `📅 <b>Today Views:</b> ${todayViews}\n`;
    message += `📅 <b>This Week Views:</b> ${weekViews}\n`;
    message += `📅 <b>This Month Views:</b> ${monthViews}\n\n`;
    message += `💰 <b>Total Earnings:</b> ${formatCurrency(earnings, currency)}\n`;
    message += `🔒 <b>Password Protected:</b> ${isPasswordProtected ? "✅ Yes" : "❌ No"}\n`;
    message += `🏷️ <b>Custom Alias:</b> <code>${customAlias}</code>\n`;
    message += `━━━━━━━━━━━━━━━`;
    
    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: "🔙 Back", callback_data: "shortlink_mylinks" },
                { text: "🗑 Delete", callback_data: `shortlink_delete_${linkId}` }
            ]
        ]
    };
    
    await sendTelegramMessage(botToken, chatId, message, { parse_mode: "HTML", reply_markup: inlineKeyboard, disable_web_page_preview: true });
}

async function processShortenUrl(botToken: string, chatId: number, user: any) {
    const db = getDb();
    
    const userDoc = await getDoc(doc(db, "users", String(user.id)));
    if (!userDoc.exists()) return;
    const userData = userDoc.data();
    const pending = userData.pendingShortLink;
    if (!pending) {
        await sendTelegramMessage(botToken, chatId, "❌ No pending link details found.");
        return;
    }

    const urlText = pending.originalUrl;
    const password = pending.password || "";
    const alias = pending.alias || "";
    const disablePreview = pending.disablePreview !== false;

    // Reset pending short link details
    await setDoc(doc(db, "users", String(user.id)), { pendingShortLink: null }, { merge: true });

    const linkId = "LN" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const appUrl = getAppUrl();
    const baseDomain = appUrl.replace(/\/$/, "");
    
    // If alias is set, use it for the local route, else use linkId
    const targetAlias = alias || linkId;
    const localShortLink = `${baseDomain}/lnk/${targetAlias}`;
    
    let finalShortLink = localShortLink;
    let providerName = "";
    
    try {
        const sysDoc = await getDoc(doc(db, "settings", "system"));
        if (sysDoc.exists()) {
            const sysData = sysDoc.data();
            const shortener = sysData.urlShortener;
            const isOwnProvider = (shortener?.provider || "").trim().toLowerCase() === "own";
            if (shortener && shortener.enabled && (shortener.apiKey || isOwnProvider)) {
                providerName = shortener.provider || "GPLinks";
                try {
                    finalShortLink = await shortenWithProvider(
                        shortener.provider,
                        shortener.apiKey || "",
                        localShortLink,
                        shortener.publisherId
                    );
                } catch (e: any) {
                    console.error("Failed to shorten link with provider:", e);
                    finalShortLink = localShortLink;
                }
            }
        }
    } catch (err) {
        console.error("Error reading system settings for shortener:", err);
    }
    
    const formattedDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    const linkDocData: any = {
        linkId,
        userId: String(user.id),
        originalUrl: urlText.trim(),
        destinationUrl: urlText.trim(),
        shortUrl: finalShortLink,
        localShortUrl: localShortLink,
        createdAt: formattedDate,
        status: "Active",
        Status: "Active",
        enabled: true,
        Enabled: true,
        views: 0,
        clicks: 0,
        earnings: 0
    };

    if (password) {
        linkDocData.password = password;
        linkDocData.isPasswordProtected = true;
    }
    if (alias) {
        linkDocData.alias = alias;
    }

    await setDoc(doc(db, "links", linkId), linkDocData);
    
    // Update user stats
    try {
        const uRef = doc(db, "users", String(user.id));
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
            const currentTotalLinks = uSnap.data().totalLinks || 0;
            await setDoc(uRef, {
                totalLinks: currentTotalLinks + 1
            }, { merge: true });
        }
    } catch (e) {}

    // Synchronize referral status to make active if applicable
    await syncReferralsForUser(db, botToken, String(user.id));
    
    let message = `✅ <b>URL Shortened Successfully</b>\n\n`;
    if (providerName) {
        message += `📡 <b>Provider:</b> ${providerName}\n`;
    }
    message += `🔗 <b>Original URL:</b>\n<code>${urlText.trim()}</code>\n\n`;
    message += `🆔 <b>Link ID:</b> <code>${linkId}</code>\n`;
    if (alias) {
        message += `🏷️ <b>Custom Alias:</b> <code>${alias}</code>\n`;
    }
    if (password) {
        message += `🔒 <b>Password Protected:</b> <code>${password}</code>\n`;
    }
    message += `\n🔗 <b>Short Link:</b>\n<code>${finalShortLink}</code>`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "📋 Copy Link", callback_data: `shortlink_copy_${linkId}` }],
            [{ text: "📈 View Analytics", web_app: { url: getMiniAppUrl(`/app?page=analytics&linkId=${linkId}&userId=${chatId}`) } }],
            [{ text: "🔗 My Links", web_app: { url: getMiniAppUrl(`/app?page=links&userId=${chatId}`) } }],
            [{ text: "🔙 Back to Dashboard", callback_data: "shortlink_menu" }]
        ]
    };
    
    await sendTelegramMessage(botToken, chatId, message, {
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
        disable_web_page_preview: disablePreview
    });
}

async function processMyLinks(botToken: string, chatId: number, user: any) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, "users", String(user.id)));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";
    
    // Fetch shortened links (STRICTLY separate from uploads!)
    const qLinks = query(collection(db, "links"), where("userId", "==", String(user.id)));
    const snapshotLinks = await getDocs(qLinks);
    
    const activeLinks = snapshotLinks.docs.filter(d => d.data().status !== "deleted");
    
    const webAppUrl = getMiniAppUrl(`/app?page=links&userId=${user.id}`);
    
    let message = `🔗 <b>My Short Links Manager</b>\n\n`;
    message += `Click the button below to view, edit, copy, and delete your links inside the dedicated RoyShare URL Shortener Mini App.\n\n`;
    
    if (activeLinks.length === 0) {
        message += `📭 You have no active shortened links yet. Use 🔗 URL Shortener from the main menu to shorten your first link!`;
    } else {
        message += `📊 Total Active Links: <b>${activeLinks.length}</b>\n\n`;
        activeLinks.slice(0, 5).forEach((docRef, idx) => {
            const link = docRef.data();
            message += `${idx + 1}. <code>${link.shortUrl || "N/A"}</code>\n`;
            message += `🎯 Original: <code>${link.originalUrl || "N/A"}</code>\n\n`;
        });
        if (activeLinks.length > 5) {
            message += `<i>...and ${activeLinks.length - 5} more links. Open the Mini App to view all!</i>`;
        }
    }

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🔗 Open My Links", web_app: { url: webAppUrl } }]
        ]
    };

    await sendTelegramMessage(botToken, chatId, message, {
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
        disable_web_page_preview: true
    });
}

async function syncReferralsForUser(db: any, botToken: string, referredUserId: string) {
    try {
        const refDocRef = doc(db, "referrals", referredUserId);
        const refSnap = await getDoc(refDocRef);
        if (!refSnap.exists()) return;

        const refData = refSnap.data();
        const referrerId = refData.referrerId;

        // Get referred user's current earnings
        const referredUserRef = doc(db, "users", referredUserId);
        const referredUserSnap = await getDoc(referredUserRef);
        if (!referredUserSnap.exists()) return;

        const uData = referredUserSnap.data();
        
        // Sum file earnings
        const uploadsQuery = query(collection(db, "uploads"), where("userId", "==", referredUserId));
        const uploadsSnapshot = await getDocs(uploadsQuery);
        let computedFileEarnings = 0;
        uploadsSnapshot.forEach(docSnap => {
            computedFileEarnings += docSnap.data().earnings || 0;
        });

        const fileEarnings = uData?.fileEarnings !== undefined ? uData.fileEarnings : computedFileEarnings;
        const linkEarnings = uData.linkEarnings || 0;
        const bonusBalance = uData.bonusBalance !== undefined ? uData.bonusBalance : (uData.bonus || 0);
        const rewardBalance = uData.rewardBalance || 0;

        // Active requirements check
        const totalFilesQuery = query(collection(db, "uploads"), where("userId", "==", referredUserId));
        const totalFilesSnap = await getDocs(totalFilesQuery);
        const hasUploaded = !totalFilesSnap.empty;

        const totalLinksQuery = query(collection(db, "links"), where("userId", "==", referredUserId));
        const totalLinksSnap = await getDocs(totalLinksQuery);
        const hasCreatedLink = !totalLinksSnap.empty;

        const hasBonus = bonusBalance > 0 || rewardBalance > 0;

        const isActive = hasUploaded || hasCreatedLink || hasBonus;

        const totalEarnings = fileEarnings + linkEarnings + bonusBalance + rewardBalance;
        const newCommission = totalEarnings * 0.20;

        const currentStatus = refData.status || "pending";
        const newStatus = isActive ? "approved" : "pending";

        const prevApproved = refData.approvedCommission || 0;
        let pendingComm = 0;
        let approvedComm = 0;

        if (isActive) {
            approvedComm = newCommission;
            pendingComm = 0;
        } else {
            approvedComm = 0;
            pendingComm = newCommission;
        }

        // Save updated referral details
        await setDoc(refDocRef, {
            status: newStatus,
            pendingCommission: pendingComm,
            approvedCommission: approvedComm,
            totalCommission: approvedComm + pendingComm
        }, { merge: true });

        // Update referrer's user document if there is any increment in approved commission!
        const diff = approvedComm - prevApproved;
        if (diff > 0) {
            const referrerRef = doc(db, "users", String(referrerId));
            const referrerSnap = await getDoc(referrerRef);
            if (referrerSnap.exists()) {
                const rData = referrerSnap.data();
                const referrerEarnings = rData?.referralEarnings || 0;
                const referrerBalance = rData?.availableBalance || 0;

                await setDoc(referrerRef, {
                    referralEarnings: referrerEarnings + diff,
                    availableBalance: referrerBalance + diff
                }, { merge: true });

                // Write transaction record for referrer
                const { dateStr, timeStr } = formatTransactionDateTime(new Date());
                const txData = {
                    amount: diff,
                    type: "Referral Commission",
                    date: dateStr,
                    time: timeStr,
                    userId: String(referrerId),
                    createdAt: new Date().toISOString()
                };
                await Promise.all([
                    addDoc(collection(db, "transactionHistory"), txData),
                    addDoc(collection(db, "transactions"), txData)
                ]);

                // Notify referrer!
                try {
                    const refDoc = await getDoc(doc(db, "users", String(referrerId)));
                    const refCurrency = refDoc.exists() ? (refDoc.data()?.currency || "INR") : "INR";
                    const referredName = uData.firstName || uData.username || "Referred Friend";
                    await sendTelegramMessage(botToken, Number(referrerId), `✅ Referral Commission Approved!\n\nYou earned ${formatCurrency(diff, refCurrency)} from your referred friend ${referredName}.`);
                } catch (e) {}
            }
        } else if (currentStatus === "pending" && newStatus === "approved") {
            // Even if commission diff is 0, notify if they just transitioned to active!
            try {
                await sendTelegramMessage(botToken, Number(referrerId), `🔥 Your referred friend became active! All commission is now approved and future earnings will be credited instantly.`);
            } catch (e) {}
        }
    } catch (err) {
        console.error("Error syncing referral for user:", referredUserId, err);
    }
}

async function triggerActiveReferral(db: any, botToken: string, userId: string) {
    await syncReferralsForUser(db, botToken, userId);
}

async function processReferAndEarn(botToken: string, chatId: number, user: any) {
    const appUrl = getAppUrl();
    const webAppUrl = `${appUrl}/referral`;
    
    const message = `👥 *RoyShare Referral Center*

Welcome to the new RoyShare Referral System!

Click the button below to open your secure Referral Center in the Mini App, where you can find your invite link, track analytics, and manage your rewards.`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🚀 Open Referral Center", web_app: { url: webAppUrl } }]
        ]
    };
    await sendTelegramMessage(botToken, chatId, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
}

async function processReferralHistory(botToken: string, chatId: number, user: any, callbackQueryId?: string) {
    const db = getDb();
    const userId = String(user.id);

    const refQuery = query(collection(db, "referrals"), where("referrerId", "==", userId));
    const refSnap = await getDocs(refQuery);

    if (refSnap.empty) {
        const message = `👥 *Referral History*

You have not referred anyone yet.

Share your referral link and start earning commissions.`;
        
        await sendTelegramMessage(botToken, chatId, message, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔙 Back", callback_data: "referral_back" }]
                ]
            }
        });
        return;
    }

    let message = `📜 *Referral History*\n\n`;
    
    refSnap.forEach(docSnap => {
        const data = docSnap.data();
        const referredName = data.referredName || data.referredFirstName || "User";
        const joinDate = data.joinDate || "N/A";
        const statusVal = data.status === "approved" ? "✅ Successful" : "⏳ Pending";
        const rewardVal = data.rewardAmount ? `₹${data.rewardAmount}` : "₹0";

        message += `👤 *User Name:* ${referredName}
📅 *Join Date:* ${joinDate}
💰 *Reward:* ${rewardVal}
⚡ *Status:* ${statusVal}

━━━━━━━━━━━━━━━\n\n`;
    });

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🔙 Back to Refer & Earn", callback_data: "referral_back" }]
        ]
    };

    if (callbackQueryId) {
        try {
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ callback_query_id: callbackQueryId })
            });
        } catch (e) {}
    }

    await sendTelegramMessage(botToken, chatId, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
}

async function processAccount(botToken: string, chatId: number, user: any) {
    const db = getDb();
    const userDocRef = doc(db, "users", String(user.id));
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    const uploadsQuery = query(collection(db, "uploads"), where("userId", "==", String(user.id)));
    const uploadsSnapshot = await getDocs(uploadsQuery);
    
    // Live validation for group and channel joins using current settings or defaults
    const channelId = -1003385031126;
    const groupId = -1003929156200;

    const checkMemberById = async (cId: number, uId: number) => {
        try {
            const res = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${cId}&user_id=${uId}`);
            const data = await res.json();
            if (data.ok && data.result) {
                const status = data.result.status;
                return status === 'member' || status === 'administrator' || status === 'creator';
            }
            return false;
        } catch {
            return false;
        }
    };

    let isChannelJoined = false;
    let isGroupJoined = false;
    try {
        isChannelJoined = await checkMemberById(channelId, user.id);
        isGroupJoined = await checkMemberById(groupId, user.id);
    } catch (e) {
        console.error("Error in real-time checkMemberById:", e);
    }

    // Default to true if DB says verified so users aren't locked out on api flakiness
    if (userData?.membershipVerified) {
        if (!isChannelJoined) isChannelJoined = true;
        if (!isGroupJoined) isGroupJoined = true;
    }

    const contactVerified = userData?.contactVerified || !!userData?.phone;
    
    const telegramIdDisplay = user.id ? String(user.id) : "Not Available";
    const firstNameDisplay = user.first_name || userData?.firstName || "Not Available";
    const usernameDisplay = (user.username || userData?.username) ? `@${user.username || userData?.username}` : "Not Available";
    const phoneNumberDisplay = userData?.phone || "Not Available";

    const totalFilesDisplay = (uploadsSnapshot && uploadsSnapshot.size !== undefined) ? uploadsSnapshot.size : "Not Available";
    const totalLinksDisplay = userData?.totalLinks !== undefined ? userData?.totalLinks : "Not Available";
    const totalReferralsDisplay = userData?.referrals !== undefined ? userData?.referrals : "Not Available";

    const joinDateDisplay = userData?.joinDate ? new Date(userData.joinDate).toLocaleString() : "Not Available";
    const lastActiveDisplay = userData?.lastActive ? new Date(userData.lastActive).toLocaleString() : "Not Available";

    const contactVerifyText = contactVerified ? "✅ Verified" : "❌ Not Verified";
    const channelJoinText = isChannelJoined ? "✅ Joined" : "❌ Not Joined";
    const groupJoinText = isGroupJoined ? "✅ Joined" : "❌ Not Joined";

    const message = `👤 Account Information

🆔 User ID: ${telegramIdDisplay}
👤 Name: ${firstNameDisplay}
📛 Username: ${usernameDisplay}
📱 Mobile Number: ${phoneNumberDisplay}

📁 Total Files: ${totalFilesDisplay}
🔗 Total Links: ${totalLinksDisplay}
👥 Total Referrals: ${totalReferralsDisplay}

📅 Join Date: ${joinDateDisplay}
🕒 Last Active: ${lastActiveDisplay}

Verification Status:

📞 Contact Verification:
${contactVerifyText}

📢 Channel Join:
${channelJoinText}

👥 Group Join:
${groupJoinText}

🔐 Account Status:
✅ Active`;

    const inlineKeyboard = {
        inline_keyboard: [[
            { text: "🔄 Refresh Account", callback_data: "refresh_account" },
            { text: "📋 Copy User ID", callback_data: "copy_user_id" }
        ]]
    };
    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

function formatTransactionDateTime(d: Date) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;
    
    return { dateStr, timeStr };
}

async function ensureTransactionsBackfill(db: any, userId: string, userData: any) {
    try {
        const qHistory = query(collection(db, "transactionHistory"), where("userId", "==", userId));
        const snapHistory = await getDocs(qHistory);
        const qLegacy = query(collection(db, "transactions"), where("userId", "==", userId));
        const snapLegacy = await getDocs(qLegacy);
        
        if (!snapHistory.empty || !snapLegacy.empty) return;

        const now = new Date();
        const bonusAmount = userData?.bonusBalance !== undefined ? userData.bonusBalance : (userData?.bonus || 0);
        if (bonusAmount > 0) {
            const d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const { dateStr, timeStr } = formatTransactionDateTime(d);
            const txData = {
                amount: bonusAmount,
                type: "Daily Bonus",
                date: dateStr,
                time: timeStr,
                userId,
                createdAt: d.toISOString()
            };
            await Promise.all([
                addDoc(collection(db, "transactionHistory"), txData),
                addDoc(collection(db, "transactions"), txData)
            ]);
        }

        const refAmount = userData?.referralEarnings || 0;
        if (refAmount > 0) {
            const d = new Date(now.getTime() - 12 * 60 * 60 * 1000);
            const { dateStr, timeStr } = formatTransactionDateTime(d);
            const txData = {
                amount: refAmount,
                type: "Referral Commission",
                date: dateStr,
                time: timeStr,
                userId,
                createdAt: d.toISOString()
            };
            await Promise.all([
                addDoc(collection(db, "transactionHistory"), txData),
                addDoc(collection(db, "transactions"), txData)
            ]);
        }

        const linkAmt = userData?.linkEarnings || 0;
        if (linkAmt > 0) {
            const d = new Date(now.getTime() - 4 * 60 * 60 * 1000);
            const { dateStr, timeStr } = formatTransactionDateTime(d);
            const txData = {
                amount: linkAmt,
                type: "URL Shortener Income",
                date: dateStr,
                time: timeStr,
                userId,
                createdAt: d.toISOString()
            };
            await Promise.all([
                addDoc(collection(db, "transactionHistory"), txData),
                addDoc(collection(db, "transactions"), txData)
            ]);
        }

        const fileAmt = userData?.fileEarnings || 0;
        if (fileAmt > 0) {
            const d = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            const { dateStr, timeStr } = formatTransactionDateTime(d);
            const txData = {
                amount: fileAmt,
                type: "File Download Income",
                date: dateStr,
                time: timeStr,
                userId,
                createdAt: d.toISOString()
            };
            await Promise.all([
                addDoc(collection(db, "transactionHistory"), txData),
                addDoc(collection(db, "transactions"), txData)
            ]);
        }
    } catch (e) {
        console.error("Failed to backfill initial transactions:", e);
    }
}

async function processBalance(botToken: string, chatId: number, user: any) {
    const db = getDb();
    const userDocRef = doc(db, "users", String(user.id));
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    const uploadsQuery = query(collection(db, "uploads"), where("userId", "==", String(user.id)));
    const uploadsSnapshot = await getDocs(uploadsQuery);
    
    let computedFileEarnings = 0;
    uploadsSnapshot.forEach(docSnap => {
        computedFileEarnings += docSnap.data().earnings || 0;
    });

    const fileEarnings = userData?.fileEarnings !== undefined ? userData.fileEarnings : computedFileEarnings;
    const linkEarnings = userData?.linkEarnings || 0;
    const referralEarnings = userData?.referralEarnings || 0;
    const bonusBalance = userData?.bonusBalance !== undefined ? userData.bonusBalance : (userData?.bonus || 0);
    const rewardBalance = userData?.rewardBalance || 0;
    const withdrawnAmount = userData?.withdrawnAmount !== undefined ? userData.withdrawnAmount : (userData?.totalWithdrawn || 0);
    const pendingWithdrawals = userData?.pendingWithdrawals || 0;
    const todayEarnings = userData?.todayEarnings || 0;
    const monthEarnings = userData?.monthEarnings || 0;
    const adminBalance = userData?.balance || 0;

    const availableBalance = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance + adminBalance - withdrawnAmount - pendingWithdrawals;

    // Save to Firestore as requested
    await setDoc(userDocRef, {
        availableBalance,
        fileEarnings,
        linkEarnings,
        referralEarnings,
        bonusBalance,
        rewardBalance,
        withdrawnAmount,
        pendingWithdrawals,
        todayEarnings,
        monthEarnings
    }, { merge: true });

    const totalIncome = fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance;
    const currency = userData?.currency || "INR";

    let message = "";
    if (totalIncome === 0 && withdrawnAmount === 0 && pendingWithdrawals === 0) {
        message = `💰 No earnings available yet.

Upload files, shorten links, complete referrals, earn rewards, and claim daily bonus to start earning.`;
    } else {
        message = `💰 Wallet & Earnings

💵 Available Balance: ${formatCurrency(availableBalance, currency)}

━━━━━━━━━━━━━━━

📤 File Earnings: ${formatCurrency(fileEarnings, currency)}

🔗 Link Earnings: ${formatCurrency(linkEarnings, currency)}

👥 Referral Earnings: ${formatCurrency(referralEarnings, currency)}

🎁 Bonus Balance: ${formatCurrency(bonusBalance, currency)}

💰 Reward Balance: ${formatCurrency(rewardBalance, currency)}

━━━━━━━━━━━━━━━

💸 Total Withdrawn: ${formatCurrency(withdrawnAmount, currency)}

⏳ Pending Withdrawals: ${formatCurrency(pendingWithdrawals, currency)}

━━━━━━━━━━━━━━━

📈 Today's Earnings: ${formatCurrency(todayEarnings, currency)}

📅 This Month Earnings: ${formatCurrency(monthEarnings, currency)}

━━━━━━━━━━━━━━━`;
    }

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "💸 Withdraw Now", callback_data: "withdraw" }],
            [{ text: "📜 Earnings History", callback_data: "earnings_history" }],
            [{ text: "🔄 Refresh Balance", callback_data: "refresh_balance" }]
        ]
    };
    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

async function processEarningsHistory(botToken: string, chatId: number, user: any) {
    const db = getDb();
    
    // Ensure we backfill some transactions first if they have stats but no transaction list
    const userDocRef = doc(db, "users", String(user.id));
    const userDoc = await getDoc(userDocRef);
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";
    if (userDoc.exists()) {
        await ensureTransactionsBackfill(db, String(user.id), userDoc.data());
    }

    let allDocs: any[] = [];
    try {
        const q1 = query(collection(db, "transactionHistory"), where("userId", "==", String(user.id)));
        const snap1 = await getDocs(q1);
        snap1.forEach(d => {
            allDocs.push({ id: d.id, ...d.data() });
        });
    } catch (e) {
        console.error("Error fetching from transactionHistory:", e);
    }

    try {
        const q2 = query(collection(db, "transactions"), where("userId", "==", String(user.id)));
        const snap2 = await getDocs(q2);
        snap2.forEach(d => {
            const dataObj = d.data();
            const exists = allDocs.some(existing => 
                existing.createdAt === dataObj.createdAt && 
                existing.amount === dataObj.amount && 
                existing.type === dataObj.type
            );
            if (!exists) {
                allDocs.push({ id: d.id, ...dataObj });
            }
        });
    } catch (e) {
        console.error("Error fetching from transactions:", e);
    }

    if (allDocs.length === 0) {
        await sendTelegramMessage(botToken, chatId, `📜 Earnings History\n\nNo earnings history found yet.`);
        return;
    }

    // Sort in-memory to avoid any Firestore composite index requirements
    const sortedDocs = allDocs.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
    });

    let message = `📜 Earnings History\n\n`;
    const docs = sortedDocs.slice(0, 20);
    
    docs.forEach(t => {
        let sign = "➕";
        if (t.type === "Withdrawal Deduction" || t.type.includes("Withdrawal") || t.amount < 0) {
            sign = "➖";
        }

        let label = t.type;
        if (t.type === "File Download Income" || t.type === "File Download") {
            label = "File Download";
        } else if (t.type === "URL Shortener Income" || t.type === "URL Visit") {
            label = "URL Visit";
        } else if (t.type === "Referral Commission") {
            label = "Referral Commission";
        } else if (t.type === "Daily Bonus") {
            label = "Daily Bonus";
        } else if (t.type === "Withdrawal Deduction") {
            label = "Withdrawal Deduction";
        }

        const displayAmountStr = formatCurrency(Math.abs(t.amount), currency);
        message += `${sign} ${displayAmountStr} | ${label}\n📅 ${t.date} | ${t.time}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━`;

    await sendTelegramMessage(botToken, chatId, message);
}

function parseFileSizeToBytes(size: string | number | undefined): number {
    if (!size) return 0;
    if (typeof size === 'number') return size;
    const str = size.trim().toLowerCase();
    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    if (str.endsWith('gb')) return num * 1024 * 1024 * 1024;
    if (str.endsWith('mb')) return num * 1024 * 1024;
    if (str.endsWith('kb')) return num * 1024;
    return num;
}

function formatBytes(bytes: number): string {
    if (bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function processMyContent(botToken: string, chatId: number, user: any, pageIndex: number = 0) {
    const webAppUrl = getMiniAppUrl(`/app?page=files&userId=${user.id}`);
    const message = `📁 <b>My Files Manager</b>\n\nClick the button below to view, edit, copy, rename, and delete your files inside the RoyShare Mini App.`;
    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "📁 Open Files Manager", web_app: { url: webAppUrl } }]
        ]
    };
    await sendTelegramMessage(botToken, chatId, message, { parse_mode: "HTML", reply_markup: inlineKeyboard });
}

async function processMyFileDetails(botToken: string, chatId: number, fileId: string) {
    const db = getDb();
    const docSnap = await getDoc(doc(db, "uploads", fileId));
    
    if (!docSnap.exists() || docSnap.data()?.status === "deleted") {
        await sendTelegramMessage(botToken, chatId, "❌ File not found or has been deleted.");
        return;
    }
    
    const file = docSnap.data();
    const userDoc = await getDoc(doc(db, "users", String(file.userId)));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";

    const displaySize = typeof file.fileSize === 'number' ? formatBytes(file.fileSize) : (file.fileSize || "N/A");
    const displayDate = file.uploadDate || (file.uploadedAt ? file.uploadedAt.split(' ')[0] : "N/A");
    
    let message = `📄 File Details\n\n`;
    message += `📁 File Name: ${file.fileName || "N/A"}\n\n`;
    message += `📦 File Size: ${displaySize}\n\n`;
    message += `📅 Upload Date: ${displayDate}\n\n`;
    message += `👁 Downloads: ${file.downloads || 0}\n\n`;
    message += `💰 Earnings: ${formatCurrency(file.earnings || 0, currency)}\n\n`;
    message += `🔗 Public Link:\n${file.publicLink || file.downloadLink || "N/A"}\n\n`;
    message += `━━━━━━━━━━━━━━━`;
    
    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "📋 Copy Link", callback_data: `mycontent_copy_${fileId}` }, { text: "📈 Analytics", callback_data: `mycontent_analytics_${fileId}` }],
            [{ text: "🗑 Delete File", callback_data: `mycontent_delete_${fileId}` }, { text: "🔙 Back", callback_data: "mycontent_back" }]
        ]
    };
    
    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

async function processMyFileAnalytics(botToken: string, chatId: number, fileId: string) {
    const db = getDb();
    const docSnap = await getDoc(doc(db, "uploads", fileId));
    
    if (!docSnap.exists() || docSnap.data()?.status === "deleted") {
        await sendTelegramMessage(botToken, chatId, "❌ File not found or has been deleted.");
        return;
    }
    
    const file = docSnap.data();
    const userDoc = await getDoc(doc(db, "users", String(file.userId)));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";

    const totalDownloads = file.downloads || 0;
    const earnings = file.earnings || 0;
    
    const todayDownloads = file.todayDownloads !== undefined ? file.todayDownloads : Math.floor(totalDownloads * 0.1);
    const weekDownloads = file.weekDownloads !== undefined ? file.weekDownloads : Math.floor(totalDownloads * 0.4);
    const monthDownloads = file.monthDownloads !== undefined ? file.monthDownloads : totalDownloads;
    
    let message = `📈 File Analytics\n\n`;
    message += `👁 Total Downloads: ${totalDownloads}\n\n`;
    message += `📅 Today Downloads: ${todayDownloads}\n\n`;
    message += `📅 This Week Downloads: ${weekDownloads}\n\n`;
    message += `📅 This Month Downloads: ${monthDownloads}\n\n`;
    message += `💰 Total Earnings: ${formatCurrency(earnings, currency)}\n\n`;
    message += `━━━━━━━━━━━━━━━`;
    
    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🔙 Back to File", callback_data: `mycontent_view_${fileId}` }]
        ]
    };
    
    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

async function processMyContentStats(botToken: string, chatId: number, user: any) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, "users", String(user.id)));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";

    const q = query(collection(db, "uploads"), where("userId", "==", String(user.id)));
    const snapshot = await getDocs(q);
    
    const allFiles: any[] = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status !== "deleted") {
            allFiles.push({ id: docSnap.id, ...data });
        }
    });
    
    const totalFiles = allFiles.length;
    const totalDownloads = allFiles.reduce((sum, f) => sum + (f.downloads || 0), 0);
    const totalEarnings = allFiles.reduce((sum, f) => sum + (f.earnings || 0), 0);
    const totalSizeBytes = allFiles.reduce((sum, f) => sum + parseFileSizeToBytes(f.fileSize), 0);
    const storageUsed = formatBytes(totalSizeBytes);
    
    let topFile = null as any;
    for (const f of allFiles) {
        if (!topFile || (f.downloads || 0) > (topFile.downloads || 0)) {
            topFile = f;
        }
    }
    
    const topFileName = topFile ? (topFile.fileName || "N/A") : "N/A";
    const topFileDownloads = topFile ? (topFile.downloads || 0) : 0;
    const topFileEarnings = topFile ? (topFile.earnings || 0) : 0;
    
    let message = `📊 Content Statistics\n\n`;
    message += `📁 Total Files: ${totalFiles}\n\n`;
    message += `💾 Total Storage Used: ${storageUsed}\n\n`;
    message += `👁 Total Downloads: ${totalDownloads}\n\n`;
    message += `💰 Total Earnings: ${formatCurrency(totalEarnings, currency)}\n\n`;
    message += `🏆 Top Performing File:\n`;
    message += `${topFileName}\n\n`;
    message += `👁 Downloads: ${topFileDownloads}\n\n`;
    message += `💰 Earnings: ${formatCurrency(topFileEarnings, currency)}\n\n`;
    message += `━━━━━━━━━━━━━━━`;
    
    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🔙 Back", callback_data: "mycontent_back" }]
        ]
    };
    
    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

async function askDeleteMyFile(botToken: string, chatId: number, fileId: string) {
    const message = `⚠️ Delete File?\n\nThis action cannot be undone.`;
    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "✅ Confirm Delete", callback_data: `mycontent_confdel_${fileId}` }],
            [{ text: "❌ Cancel", callback_data: `mycontent_view_${fileId}` }]
        ]
    };
    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

async function confirmDeleteMyFile(botToken: string, chatId: number, user: any, fileId: string) {
    const db = getDb();
    
    try {
        await deleteDoc(doc(db, "uploads", fileId));
        
        try {
            await deleteDoc(doc(db, "file_mappings", fileId));
        } catch(e) {}
        try {
            await deleteDoc(doc(db, "fileMappings", fileId));
        } catch(e) {}
        
    } catch(err) {
        console.error("Error deleting file:", err);
    }
    
    await sendTelegramMessage(botToken, chatId, "✅ File deleted successfully.");
    await processMyContent(botToken, chatId, user, 0);
}

async function handleSearchQuery(botToken: string, chatId: number, user: any, searchQuery: string) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, "users", String(user.id)));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";
    
    const q = query(collection(db, "uploads"), where("userId", "==", String(user.id)));
    const snapshot = await getDocs(q);
    
    const matchingFiles: any[] = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status !== "deleted" && (data.fileName || "").toLowerCase().includes(searchQuery.toLowerCase())) {
            matchingFiles.push({ id: docSnap.id, ...data });
        }
    });
    
    if (matchingFiles.length === 0) {
        const message = `🔍 No files found matching "${searchQuery}".`;
        const inlineKeyboard = {
            inline_keyboard: [
                [{ text: "🔙 Back to My Content", callback_data: "mycontent_back" }]
            ]
        };
        await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
        return;
    }
    
    let message = `🔍 Search Results for "${searchQuery}":\n\n`;
    const numEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
    
    const sliceCount = Math.min(matchingFiles.length, 5);
    const filesToShow = matchingFiles.slice(0, sliceCount);
    
    filesToShow.forEach((file, idx) => {
        const seqNumber = numEmojis[idx];
        const displaySize = typeof file.fileSize === 'number' ? formatBytes(file.fileSize) : (file.fileSize || "N/A");
        const displayDate = file.uploadDate || (file.uploadedAt ? file.uploadedAt.split(' ')[0] : "N/A");
        
        message += `${seqNumber} ${file.fileName || "Unnamed File"}\n\n`;
        message += `📦 Size: ${displaySize}\n\n`;
        message += `📅 Uploaded: ${displayDate}\n\n`;
        message += `👁 Downloads: ${file.downloads || 0}\n\n`;
        message += `💰 Earnings: ${formatCurrency(file.earnings || 0, currency)}\n\n`;
        message += `━━━━━━━━━━━━━━━\n\n`;
    });
    
    const fileButtons = filesToShow.map((file, idx) => ({
        text: numEmojis[idx],
        callback_data: `mycontent_view_${file.id}`
    }));
    
    const inlineKeyboard = {
        inline_keyboard: [] as any[][]
    };
    
    if (fileButtons.length > 0) {
        inlineKeyboard.inline_keyboard.push(fileButtons);
    }
    
    inlineKeyboard.inline_keyboard.push([
        { text: "🔙 Back to My Content", callback_data: "mycontent_back" }
    ]);
    
    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

function getMainMenuKeyboard(userId?: string | number) {
    const appUrl = getAppUrl();
    const userIdQuery = userId ? `&userId=${userId}` : "";
    return {
        keyboard: [
            [{ text: "🚀 Self Earning", web_app: { url: userId ? `${appUrl}/app?userId=${userId}` : `${appUrl}/app` } }],
            [
                { text: "📤 Upload File" },
                { text: "🔗 URL Shortener" }
            ],
            [
                { text: "📁 My Content", web_app: { url: userId ? `${appUrl}/app?page=content&userId=${userId}` : `${appUrl}/app?page=content` } },
                { text: "🔗 My Links", web_app: { url: userId ? `${appUrl}/app?page=links&userId=${userId}` : `${appUrl}/app?page=links` } }
            ],
            [{ text: "📢 Announcements" }, { text: "⚙️ Settings" }],
            [{ text: "💰 Balance" }, { text: "👥 Refer & Earn" }],
            [{ text: "💸 Withdraw" }, { text: "📜 Withdrawal History" }],
            [{ text: "🎧 Contact Support" }, { text: "🎮 Game History" }]
        ],
        resize_keyboard: true
    };
}

async function processAnnouncements(botToken: string, chatId: number, user: any, page: number = 1, messageIdToEdit?: number) {
    const db = getDb();
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        const emptyMsg = `📢 Announcements

No announcements found yet.`;
        if (messageIdToEdit) {
            await editTelegramMessage(botToken, chatId, messageIdToEdit, emptyMsg);
        } else {
            await sendTelegramMessage(botToken, chatId, emptyMsg);
        }
        return;
    }

    const allAnn: any[] = [];
    snapshot.forEach(docSnap => {
        allAnn.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort by createdAt desc in memory to be absolutely sure
    allAnn.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
    });

    const limit = 5;
    const startIndex = (page - 1) * limit;
    const pageAnn = allAnn.slice(startIndex, startIndex + limit);
    const hasNextPage = allAnn.length > startIndex + limit;

    let message = `📢 Announcements (Page ${page}/${Math.ceil(allAnn.length / limit)})\n\n`;

    for (let i = 0; i < pageAnn.length; i++) {
        const ann = pageAnn[i];
        const itemNum = startIndex + i + 1;
        const dateStr = ann.createdAt ? formatDate(ann.createdAt) : "N/A";
        message += `${itemNum}. 🔔 *${ann.title}*\n📂 Category: ${ann.type || "General"} | 📅 ${dateStr}\n\n`;
    }
    message += `━━━━━━━━━━━━━━━`;

    const inlineKeyboard: any = { inline_keyboard: [] };

    // Details buttons for each announcement
    const detailsButtons = [];
    for (let i = 0; i < pageAnn.length; i++) {
        const itemNum = startIndex + i + 1;
        detailsButtons.push({ text: `👁 View Announcement #${itemNum}`, callback_data: `ann_details_${pageAnn[i].id}_${page}` });
    }
    for (let i = 0; i < detailsButtons.length; i += 2) {
        inlineKeyboard.inline_keyboard.push(detailsButtons.slice(i, i + 2));
    }

    // Navigation buttons
    const navRow = [];
    if (page > 1) {
        navRow.push({ text: "⬅️ Prev Page", callback_data: `ann_page_${page - 1}` });
    }
    if (hasNextPage) {
        navRow.push({ text: "📄 Next Page", callback_data: `ann_page_${page + 1}` });
    }
    navRow.push({ text: "🔄 Refresh", callback_data: `ann_refresh_${page}` });

    inlineKeyboard.inline_keyboard.push(navRow);

    if (messageIdToEdit) {
        await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
    } else {
        await sendTelegramMessage(botToken, chatId, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
    }
}

async function processAnnouncementDetails(botToken: string, chatId: number, docId: string, page: number = 1, messageIdToEdit?: number) {
    const db = getDb();
    const docSnap = await getDoc(doc(db, "announcements", docId));
    if (!docSnap.exists()) {
        const errorMsg = "⚠️ Announcement not found.";
        if (messageIdToEdit) {
            await editTelegramMessage(botToken, chatId, messageIdToEdit, errorMsg);
        } else {
            await sendTelegramMessage(botToken, chatId, errorMsg);
        }
        return;
    }
    const ann = docSnap.data();

    const title = ann.title;
    const type = ann.type || "General";
    const dateStr = ann.createdAt ? formatDate(ann.createdAt) + " " + formatTime(ann.createdAt) : "N/A";
    const messageBody = ann.message || "";

    const message = `📢 Announcement Details

🔔 *${title}*

📂 *Category:* ${type}
📅 *Date:* ${dateStr}

📝 *Message:*
${messageBody}`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "⬅️ Back to Announcements", callback_data: `ann_list_page_${page}` }]
        ]
    };

    if (messageIdToEdit) {
        await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
    } else {
        await sendTelegramMessage(botToken, chatId, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
    }
}

async function calculateAndSyncLeaderboard() {
    const db = getDb();
    const usersSnapshot = await getDocs(collection(db, "users"));
    if (usersSnapshot.empty) return [];

    const uploadsSnapshot = await getDocs(collection(db, "uploads"));
    const referralsSnapshot = await getDocs(collection(db, "referrals"));
    const txSnapshot = await getDocs(collection(db, "transactionHistory"));

    const uploadsList: any[] = [];
    uploadsSnapshot.forEach(docSnap => {
        uploadsList.push(docSnap.data());
    });

    const referralsList: any[] = [];
    referralsSnapshot.forEach(docSnap => {
        referralsList.push(docSnap.data());
    });

    const txList: any[] = [];
    txSnapshot.forEach(docSnap => {
        txList.push(docSnap.data());
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Helpers to parse dates safely
    function safeParseDate(dVal: any): Date {
        if (!dVal) return new Date(0);
        if (dVal instanceof Date) return dVal;
        const d = new Date(dVal);
        if (!isNaN(d.getTime())) return d;
        return new Date(0);
    }

    const usersData: any[] = [];

    usersSnapshot.forEach(uDoc => {
        const userId = uDoc.id;
        const uData = uDoc.data();

        const rawUsername = uData.username || "";
        const rawFirstName = uData.firstName || "";
        const usernameVal = rawUsername ? `@${rawUsername}` : (rawFirstName || "User");

        // 1. Total Active Uploads (Anti-Cheat: Status !== "deleted")
        const activeUploads = uploadsList.filter(u => u.userId === userId && u.status !== "deleted");
        const activeUploadsCount = activeUploads.length;

        // 2. Approved Referrals (Anti-Cheat: Status === "approved")
        const approvedReferrals = referralsList.filter(r => r.referrerId === userId && r.status === "approved");
        const approvedReferralsCount = approvedReferrals.length;

        // 3. Earnings
        const earningsVal = uData.earnings !== undefined ? Number(uData.earnings) : 0;

        // 4. Rising Stars Growth (Last 7 Days)
        const newUploads = activeUploads.filter(u => safeParseDate(u.uploadDate) >= sevenDaysAgo).length;
        const newReferrals = approvedReferrals.filter(r => safeParseDate(r.joinDate) >= sevenDaysAgo).length;
        
        // New Earnings: Sum of transactions >= sevenDaysAgo where amount > 0
        const newEarnings = txList
            .filter(tx => tx.userId === userId && tx.amount > 0 && safeParseDate(tx.createdAt) >= sevenDaysAgo)
            .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        // Score formulation
        const risingStarScore = (newEarnings * 1) + (newReferrals * 5) + (newUploads * 1);

        // Badge system
        let badge = "🥉 Bronze Creator";
        if (earningsVal >= 10000) {
            badge = "👑 RoyShare Legend";
        } else if (earningsVal >= 2500) {
            badge = "💎 Diamond Creator";
        } else if (earningsVal >= 500) {
            badge = "🥇 Gold Creator";
        } else if (earningsVal >= 100) {
            badge = "🥈 Silver Creator";
        }

        usersData.push({
            userId,
            username: usernameVal,
            earnings: earningsVal,
            activeUploadsCount,
            approvedReferralsCount,
            newUploads,
            newReferrals,
            newEarnings,
            risingStarScore,
            badge
        });
    });

    // Compute Ranks
    // Earnings Rank
    const sortedByEarnings = [...usersData].sort((a, b) => b.earnings - a.earnings);
    sortedByEarnings.forEach((user, idx) => {
        user.earningsRank = idx + 1;
    });

    // Upload Rank
    const sortedByUploads = [...usersData].sort((a, b) => b.activeUploadsCount - a.activeUploadsCount);
    sortedByUploads.forEach((user, idx) => {
        user.uploadRank = idx + 1;
    });

    // Referral Rank
    const sortedByReferrals = [...usersData].sort((a, b) => b.approvedReferralsCount - a.approvedReferralsCount);
    sortedByReferrals.forEach((user, idx) => {
        user.referralRank = idx + 1;
    });

    // Rising Star Rank
    const sortedByRisingStar = [...usersData].sort((a, b) => b.risingStarScore - a.risingStarScore);
    sortedByRisingStar.forEach((user, idx) => {
        user.risingStarRank = idx + 1;
    });

    // Update each user in Firestore in parallel
    await Promise.all(usersData.map(async (u) => {
        await setDoc(doc(db, "users", u.userId), {
            earningsRank: u.earningsRank,
            uploadRank: u.uploadRank,
            referralRank: u.referralRank,
            risingStarRank: u.risingStarRank,
            badge: u.badge
        }, { merge: true });
    }));

    return usersData;
}

function getBadgeEmoji(badgeName: string): string {
    if (!badgeName) return "🥉";
    if (badgeName.includes("Legend")) return "👑";
    if (badgeName.includes("Diamond")) return "💎";
    if (badgeName.includes("Gold")) return "🥇";
    if (badgeName.includes("Silver")) return "🥈";
    return "🥉";
}

async function processLeaderboard(botToken: string, chatId: number, user: any, messageIdToEdit?: number) {
    const db = getDb();
    
    // Perform dynamic sync
    await calculateAndSyncLeaderboard().catch(err => {
        console.error("Error updating leaderboard ranks:", err);
    });

    const message = `🏆 RoyShare Leaderboard

Choose Category`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "💰 Top Earners", callback_data: "leaderboard_cat_earners" }],
            [{ text: "📤 Top Uploaders", callback_data: "leaderboard_cat_uploaders" }],
            [{ text: "👥 Top Referrers", callback_data: "leaderboard_cat_referrers" }],
            [{ text: "🔥 Rising Stars", callback_data: "leaderboard_cat_rising" }],
            [{ text: "🏅 My Ranking", callback_data: "leaderboard_cat_my" }]
        ]
    };

    if (messageIdToEdit) {
        await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { reply_markup: inlineKeyboard });
    } else {
        await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
    }
}

async function showLeaderboardCategory(botToken: string, chatId: number, userId: string, category: string, messageIdToEdit: number) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, "users", userId));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";
    
    const usersData = await calculateAndSyncLeaderboard().catch(() => []);

    if (usersData.length === 0) {
        const noDataMsg = `🏆 Leaderboard

No ranking data available yet.

Start uploading files, creating links and inviting friends to climb the leaderboard.`;
        await editTelegramMessage(botToken, chatId, messageIdToEdit, noDataMsg, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔙 Back", callback_data: "leaderboard_back_main" }]
                ]
            }
        });
        return;
    }

    const medalEmojis = ["🥇", "🥈", "🥉"];

    let message = "";
    if (category === "earners") {
        const sorted = [...usersData].sort((a, b) => b.earnings - a.earnings).slice(0, 10);
        message = `💰 *Top Earners*\n\n`;
        sorted.forEach((u, i) => {
            const medal = medalEmojis[i] || `#${i + 1}`;
            const emoji = getBadgeEmoji(u.badge);
            message += `${medal} *${u.username}* ${emoji}\n💰 Earnings: ${formatCurrency(u.earnings, currency)}\n\n`;
        });
    } else if (category === "uploaders") {
        const sorted = [...usersData].sort((a, b) => b.activeUploadsCount - a.activeUploadsCount).slice(0, 10);
        message = `📤 *Top Uploaders*\n\n`;
        sorted.forEach((u, i) => {
            const medal = medalEmojis[i] || `#${i + 1}`;
            const emoji = getBadgeEmoji(u.badge);
            message += `${medal} *${u.username}* ${emoji}\n📤 Total Uploads: ${u.activeUploadsCount}\n\n`;
        });
    } else if (category === "referrers") {
        const sorted = [...usersData].sort((a, b) => b.approvedReferralsCount - a.approvedReferralsCount).slice(0, 10);
        message = `👥 *Top Referrers*\n\n`;
        sorted.forEach((u, i) => {
            const medal = medalEmojis[i] || `#${i + 1}`;
            const emoji = getBadgeEmoji(u.badge);
            message += `${medal} *${u.username}* ${emoji}\n👥 Total Referrals: ${u.approvedReferralsCount}\n\n`;
        });
    } else if (category === "rising") {
        const sorted = [...usersData].sort((a, b) => b.risingStarScore - a.risingStarScore).slice(0, 10);
        message = `🔥 *Rising Stars (Last 7 Days)*\n\n`;
        sorted.forEach((u, i) => {
            const medal = medalEmojis[i] || `#${i + 1}`;
            const emoji = getBadgeEmoji(u.badge);
            message += `${medal} *${u.username}* ${emoji}\n📈 +${u.newUploads} Uploads\n👥 +${u.newReferrals} Referrals\n💰 +${formatCurrency(u.newEarnings, currency)} Earnings\n\n`;
        });
    } else if (category === "my") {
        const myData = usersData.find(u => u.userId === userId);
        if (!myData) {
            message = `🏆 Leaderboard

No ranking data available yet.

Start uploading files, creating links and inviting friends to climb the leaderboard.`;
        } else {
            message = `🏅 *Your Ranking*\n\n💰 Earnings Rank:\n#${myData.earningsRank}\n\n📤 Upload Rank:\n#${myData.uploadRank}\n\n👥 Referral Rank:\n#${myData.referralRank}\n\n🔥 Rising Star Rank:\n#${myData.risingStarRank}\n\n🛡️ Badge:\n${myData.badge}`;
        }
    }

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🔙 Back to Categories", callback_data: "leaderboard_back_main" }]
        ]
    };

    await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
}


async function processEarnRewards(botToken: string, chatId: number, user: any) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, "users", String(user.id)));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";

    // Fetch completed/credited tasks for this user
    const q = query(
        collection(db, "task_completions"),
        where("userId", "==", String(user.id))
    );
    const qSnap = await getDocs(q);
    const completedTaskIds = new Set<string>();
    qSnap.forEach(d => {
        const c = d.data();
        if (c.taskId && (c.status === "completed" || c.reward_credited === true)) {
            completedTaskIds.add(c.taskId);
        }
    });

    const appUrl = getAppUrl();

    // Fetch dynamic tasks from Firestore tasks collection
    let dbTasks: any[] = [];
    try {
        const tasksQuery = query(collection(db, "tasks"));
        const tasksSnap = await getDocs(tasksQuery);
        dbTasks = tasksSnap.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                name: d.title || "",
                amount: Number(d.rewardAmount) || 0,
                status: d.status || "🟢 Active",
                ...d
            };
        });
    } catch (e) {
        console.error("Error fetching dynamic tasks in bot.ts:", e);
    }

    // Filter to only show Active tasks
    const activeTasks = dbTasks.filter(t => 
        t.status === "🟢 Active" || 
        String(t.status || "").toLowerCase().includes("active")
    );
    
    if (activeTasks.length === 0) {
        await sendTelegramMessage(botToken, chatId, "No reward tasks available.", { parse_mode: "Markdown" });
        return;
    }

    // Filter out completed tasks so we only show tasks the user has never completed
    const nonCompletedTasks = activeTasks.filter(t => !completedTaskIds.has(t.id));

    if (nonCompletedTasks.length === 0) {
        const msg = `✅ You have already completed this reward task.\n\nPlease wait until a new reward task becomes available.`;
        await sendTelegramMessage(botToken, chatId, msg, { parse_mode: "Markdown" });
        return;
    }

    let message = `💰 *Reward Tasks*\n\n`;
    const buttons: any[] = [];

    for (const t of nonCompletedTasks) {
        const formattedAmount = formatCurrency(t.amount, currency);
        message += `${t.name} - ${formattedAmount}\n`;

        const btnText = `🎁 Open ${t.name}`;
        const webAppUrl = `${appUrl}/earn-rewards?userId=${user.id}&taskId=${t.id}`;
        
        buttons.push([{ text: btnText, web_app: { url: webAppUrl } }]);
    }

    message += `\n━━━━━━━━━━━━━━━\nSelect a task below to start earning rewards!`;

    const inlineKeyboard = {
        inline_keyboard: buttons
    };

    await sendTelegramMessage(botToken, chatId, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
}

async function claimBonus(botToken: string, chatId: number, user: any) {
    const db = getDb();
    const userDocRef = doc(db, "users", String(user.id));
    const userDocRefBonus = doc(db, "users", String(user.id), "bonusInfo", "data");
    
    const [userDoc, bonusDoc] = await Promise.all([getDoc(userDocRef), getDoc(userDocRefBonus)]);
    const bonusData = bonusDoc.exists() ? bonusDoc.data() : { lastClaimTime: null, currentStreak: 0, highestStreak: 0 };

    const now = Date.now();
    const lastClaim = bonusData.lastClaimTime ? new Date(bonusData.lastClaimTime).getTime() : 0;
    
    if (lastClaim && (now - lastClaim < 24 * 60 * 60 * 1000)) {
        const remainingHours = Math.ceil((24 * 60 * 60 * 1000 - (now - lastClaim)) / (60 * 60 * 1000));
        await sendTelegramMessage(botToken, chatId, `⏳ You have already claimed today's bonus.\n\nCome back after: ${remainingHours} hours`);
        return;
    }

    // Calculate Reward
    const isNextDay = (now - lastClaim < 48 * 60 * 60 * 1000);
    const newStreak = isNextDay ? bonusData.currentStreak + 1 : 1;
    const newHighestStreak = Math.max(bonusData.highestStreak, newStreak);
    if (newStreak > 7) { 
        // Logic constraint says restart after 7, but let's just make it cycle 1-7
    }
    const dayIndex = ((newStreak - 1) % 7);
    const rewardAmounts = [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 1.00];
    const amount = rewardAmounts[dayIndex];

    // Update
    const { dateStr, timeStr } = formatTransactionDateTime(new Date(now));
    await Promise.all([
        setDoc(userDocRefBonus, { 
            lastClaimTime: new Date(now).toISOString(),
            currentStreak: newStreak > 7 ? 1 : newStreak,
            highestStreak: newHighestStreak
        }, { merge: true }),
        addDoc(collection(db, "users", String(user.id), "bonusClaims"), {
            amount,
            streakDay: newStreak > 7 ? 1 : newStreak,
            createdAt: new Date(now).toISOString()
        }),
        addDoc(collection(db, "transactions"), {
            amount,
            type: "Daily Bonus",
            date: dateStr,
            time: timeStr,
            userId: String(user.id),
            createdAt: new Date(now).toISOString()
        }),
        addDoc(collection(db, "transactionHistory"), {
            amount,
            type: "Daily Bonus",
            date: dateStr,
            time: timeStr,
            userId: String(user.id),
            createdAt: new Date(now).toISOString()
        }),
        setDoc(userDocRef, { 
            bonus: (userDoc.data()?.bonus || 0) + amount,
            bonusBalance: (userDoc.data()?.bonusBalance || 0) + amount
        }, { merge: true })
    ]);

    // Synchronize referral status to make active if applicable
    await syncReferralsForUser(db, botToken, String(user.id));

    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";
    await sendTelegramMessage(botToken, chatId, `✅ Bonus Claimed Successfully\n\n🎁 Bonus Added: ${formatCurrency(amount, currency)}\n🔥 Current Streak: ${newStreak} Days`);
}

async function processBonusHistory(botToken: string, chatId: number, user: any) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, "users", String(user.id)));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";

    const q = query(collection(db, "users", String(user.id), "bonusClaims"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        await sendTelegramMessage(botToken, chatId, "📭 No bonus history found.");
        return;
    }

    let message = "📊 Bonus History (Last 30):\n\n";
    snapshot.docs.slice(0, 30).forEach(doc => {
        const h = doc.data();
        message += `📅 ${new Date(h.createdAt).toLocaleDateString()} | 🎁 ${formatCurrency(h.amount || 0, currency)} | 🔥 Day ${h.streakDay}\n`;
    });

    await sendTelegramMessage(botToken, chatId, message);
}
function getIssueTypeLabel(type: string): string {
    const t = type.toLowerCase();
    if (t.includes("withdrawal")) return "💸 Withdrawal Issue";
    if (t.includes("upload")) return "📤 Upload Issue";
    if (t.includes("link")) return "🔗 Link Issue";
    if (t.includes("referral")) return "👥 Referral Issue";
    if (t.includes("earnings")) return "💰 Earnings Issue";
    return "⚙️ Other Issue";
}

function getTicketStatusLabel(status: string): string {
    const s = String(status).toLowerCase();
    if (s.includes("open")) return "🟡 Open";
    if (s.includes("reply") || s.includes("replied")) return "💬 Replied";
    if (s.includes("resolved") || s.includes("resolve")) return "🟢 Resolved";
    if (s.includes("closed") || s.includes("close")) return "🔴 Closed";
    return status;
}

async function processSupport(botToken: string, chatId: number, user: any) {
    const db = getDb();
    const settingsSnap = await getDoc(doc(db, "settings", "support"));
    const settings = settingsSnap.exists() ? settingsSnap.data() : {};

    const message = `🎫 <b>RoyShare Support Center</b>

Welcome to our Help Center. How can we assist you today?

📧 <b>Email:</b> ${settings.supportEmail || "support@royshare.online"}
🤖 <b>Telegram:</b> ${settings.supportTelegram || "@RoyshareSupport_bot"}
🤝 <b>Business:</b> ${settings.businessContact || "biz@royshare.online"}
🐛 <b>Report Bug:</b> ${settings.reportBugUrl || "@Royshare_Dev"}`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "➕ Create Ticket", callback_data: "support_create" }, { text: "📋 My Tickets", callback_data: "support_list" }],
            [{ text: "❓ FAQ", web_app: { url: `${getAppUrl()}/app?page=support&view=faq&userId=${user.id}` } }],
            [{ text: "📞 Contact Support bot", url: settings.supportTelegram?.startsWith("http") ? settings.supportTelegram : `https://t.me/${(settings.supportTelegram || "@RoyshareSupport_bot").replace("@", "")}` }],
            [{ text: "🌐 Help Center (Mini App)", web_app: { url: `${getAppUrl()}/app?page=support&userId=${user.id}` } }]
        ]
    };
    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

async function startLiveSupportSession(botToken: string, chatId: number, user: any) {
    const db = getDb();
    
    // Set active support state in database
    await setDoc(doc(db, "users", String(user.id)), {
        liveSupportActive: true,
        liveSupportHistory: [],
        pendingShortenUrl: false,
        pendingWithdrawal: null,
        pendingSearchFile: false,
        pendingSupportTicket: null,
        pendingAdminReply: null,
        pendingUserTicketReply: null
    }, { merge: true });

    const message = `💬 *Live Support*

Hello! My name is Sarah from RoyShare Support. How can I assist you today?`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "❌ Exit Live Support", callback_data: "support_live_exit" }]
        ]
    };

    await sendTelegramMessage(botToken, chatId, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
}

async function handleLiveSupportMessage(botToken: string, chatId: number, user: any, text: string): Promise<boolean> {
    if (!text) return false;
    
    // Send "typing..." action
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, action: "typing" })
        });
    } catch (e) {}

    const db = getDb();
    const userDocRef = doc(db, "users", String(user.id));
    const userSnap = await getDoc(userDocRef);
    const userData = userSnap.exists() ? userSnap.data() : {};
    
    const history = userData.liveSupportHistory || [];
    const userMsg = { sender: "user", text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const updatedHistory = [...history, userMsg];
    
    let reply = "";
    const cleanText = text.trim().toLowerCase();

    // Check for exact flow greeting
    if (history.length === 0 && (cleanText === "hello" || cleanText === "hi" || cleanText === "hey")) {
        reply = `Hello 👋
Welcome to RoyShare Support.

How can I help you today?

Please describe your problem.`;
    } else {
        try {
            const supportSettingsSnap = await getDoc(doc(db, "settings", "support"));
            const supportData = supportSettingsSnap.exists() ? supportSettingsSnap.data() : { aiEnabled: true, geminiApiKey: "", geminiModel: "gemini-1.5-flash" };
            
            const apiKey = supportData.geminiApiKey || process.env.GEMINI_API_KEY;
            if (!apiKey) {
                reply = "Please wait a moment while I check your issue...";
            } else {
                let userContext = "No authenticated user info available.";
                try {
                    const ticketsSnap = await getDocs(query(collection(db, "tickets"), where("userId", "==", String(user.id))));
                    const userTickets = ticketsSnap.docs.map(d => ({
                        ticketId: d.data().ticketId,
                        subject: d.data().subject,
                        status: d.data().status,
                        createdAt: d.data().createdAt
                    }));

                    const referralsSnap = await getDocs(query(collection(db, "referrals"), where("referrerId", "==", String(user.id))));
                    const referralCount = referralsSnap.size;

                    const withdrawalsSnap = await getDocs(query(collection(db, "withdrawals"), where("userId", "==", String(user.id))));
                    const userWithdrawals = withdrawalsSnap.docs.map(d => ({
                        amount: d.data().amount,
                        status: d.data().status,
                        createdAt: d.data().createdAt
                    }));

                    userContext = `
The user you are speaking with is authenticated in Telegram.
- Name: ${user.first_name || 'User'}
- Username: @${user.username || 'N/A'}
- Balance: $${userData.balance || 0}
- Total Earnings: $${(userData.fileEarnings || 0) + (userData.linkEarnings || 0) + (userData.referralEarnings || 0)}
- Withdrawn Amount: $${userData.withdrawnAmount || 0}
- Pending Withdrawals: $${userData.pendingWithdrawal || 0}
- Referrals Count: ${referralCount}
- Active Tickets: ${JSON.stringify(userTickets)}
- Withdrawal History: ${JSON.stringify(userWithdrawals)}
`;
                } catch (ctxErr) {
                    console.error("Failed to build user context for Telegram bot support:", ctxErr);
                }

                const ai = new GoogleGenAI({
                    apiKey: apiKey,
                    httpOptions: {
                        headers: {
                            'User-Agent': 'aistudio-build'
                        }
                    }
                });

                const selectedModel = supportData.geminiModel || "gemini-1.5-flash";

                const systemInstruction = `
You are Sarah, a highly professional, polite, and helpful human support representative at RoyShare.
RoyShare is a secure Telegram-powered file sharing and URL shortener platform.

TONE & BEHAVIOR:
- Speak naturally, with empathy, as a professional human agent. Keep replies concise, friendly, and human-like.
- NEVER mention that you are an AI, chatbot, assistant, Gemini, automated agent, or machine. If asked, reply warmly that you are a human support specialist.
- Use the user's account context below to answer specific questions about their balance, withdrawals, referrals, or tickets. Do not paste raw JSON; formulate friendly, natural responses.

FLOW INSTRUCTIONS:
1. If the user greets you with "Hello", "Hi", or similar initial greeting, respond exactly or very close to:
"Hello 👋
Welcome to RoyShare Support.

How can I help you today?

Please describe your problem."

2. When the user explains their problem:
- Understand the issue deeply.
- Ask follow-up questions if required.
- Provide clear, step-by-step troubleshooting.
- Continue chatting naturally and remember previous messages.
- NEVER suggest or show "Create Ticket" immediately. Try your best to troubleshoot first.

3. ONLY if you determine the issue is complex, requires administrative/senior manual review, or cannot be solved through standard troubleshooting, append '[SHOW_TICKET_BUTTONS]' at the very end of your message. Never show this on initial contact or basic questions. Do not repeatedly append this. Only append it when troubleshooting is genuinely exhausted.

User Account Context:
${userContext}
`;

                let success = false;
                const response = await safeSendMessage(ai, {
                    model: selectedModel || "gemini-1.5-flash",
                    message: text,
                    config: { systemInstruction },
                    history: updatedHistory.slice(0, -1).map((m: any) => ({
                        role: m.sender === "user" ? "user" : "model",
                        parts: [{ text: m.text }]
                    }))
                });

                if (response && response.text) {
                    reply = response.text;
                    success = true;
                }

                if (!success) {
                    throw new Error("All Gemini models failed to generate a response in the support chat.");
                }
            }
        } catch (err) {
            console.error("Telegram bot live support Gemini error:", err);
            reply = "I'm sorry, I'm having trouble connecting to my AI core. Please try again in a few moments.";
        }

    }

    const agentMsg = { sender: "agent", text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const finalHistory = [...updatedHistory, agentMsg];
    
    await setDoc(userDocRef, { liveSupportHistory: finalHistory }, { merge: true });

    // Determine if we show Create Ticket and Solved buttons
    const showTicketButtons = reply.includes("[SHOW_TICKET_BUTTONS]");
    const cleanReply = reply.replace("[SHOW_TICKET_BUTTONS]", "").trim();

    let inlineKeyboard;
    if (showTicketButtons) {
        inlineKeyboard = {
            inline_keyboard: [
                [
                    { text: "🎫 Create Ticket", callback_data: "support_create_from_live" },
                    { text: "✅ Solved", callback_data: "support_solved_from_live" }
                ],
                [{ text: "❌ Exit Live Support", callback_data: "support_live_exit" }]
            ]
        };
    } else {
        inlineKeyboard = {
            inline_keyboard: [
                [{ text: "❌ Exit Live Support", callback_data: "support_live_exit" }]
            ]
        };
    }

    await sendTelegramMessage(botToken, chatId, cleanReply, { reply_markup: inlineKeyboard });
    return true; // Consumed
}

async function processMyTickets(botToken: string, chatId: number, user: any, page: number = 1, messageIdToEdit?: number) {
    const db = getDb();
    const q = query(collection(db, "tickets"), where("userId", "==", String(user.id)));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const emptyMsg = `📋 My Tickets

No support tickets found.

Create a ticket if you need assistance.`;
        if (messageIdToEdit) {
            await editTelegramMessage(botToken, chatId, messageIdToEdit, emptyMsg);
        } else {
            await sendTelegramMessage(botToken, chatId, emptyMsg);
        }
        return;
    }

    const allTickets: any[] = [];
    querySnapshot.forEach(docSnap => {
        allTickets.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort by createdAt desc in memory
    allTickets.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
    });

    const limit = 5;
    const startIndex = (page - 1) * limit;
    const pageTickets = allTickets.slice(startIndex, startIndex + limit);
    const hasNextPage = allTickets.length > startIndex + limit;

    let message = `📋 My Tickets`;

    for (const t of pageTickets) {
        const statLabel = getTicketStatusLabel(t.status || "🟡 Open");
        message += `

Ticket ID:
${t.ticketId}

Issue:
${t.issueType}

Status:
${statLabel}

━━━━━━━━━━━━━━━`;
    }

    const inlineKeyboard: any = { inline_keyboard: [] };

    // Details buttons for each ticket
    const detailsButtons = [];
    for (const t of pageTickets) {
        detailsButtons.push({ text: `📋 ${t.ticketId}`, callback_data: `ticket_details_${t.id}` });
    }
    for (let i = 0; i < detailsButtons.length; i += 2) {
        inlineKeyboard.inline_keyboard.push(detailsButtons.slice(i, i + 2));
    }

    // Navigation buttons
    const navRow = [];
    if (page > 1) {
        navRow.push({ text: "⬅️ Prev Page", callback_data: `support_page_${page - 1}` });
    }
    if (hasNextPage) {
        navRow.push({ text: "📄 Next Page", callback_data: `support_page_${page + 1}` });
    }
    navRow.push({ text: "🔄 Refresh", callback_data: "support_refresh" });

    inlineKeyboard.inline_keyboard.push(navRow);

    if (messageIdToEdit) {
        await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { reply_markup: inlineKeyboard });
    } else {
        await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
    }
}

async function processTicketDetails(botToken: string, chatId: number, docId: string) {
    const db = getDb();
    const docSnap = await getDoc(doc(db, "tickets", docId));
    if (!docSnap.exists()) {
        await sendTelegramMessage(botToken, chatId, "⚠️ Ticket details not found.");
        return;
    }
    const t = docSnap.data();

    const ticketId = t.ticketId;
    const issueType = t.issueType;
    const status = getTicketStatusLabel(t.status || "🟡 Open");
    const createdDate = formatDate(t.createdAt) + " " + formatTime(t.createdAt);
    const userMessage = t.message;
    const lastReply = t.lastReply || "None";

    const message = `🎫 Ticket Details

Ticket ID:
${ticketId}

📂 Issue:
${issueType}

📌 Status:
${status}

📅 Created:
${createdDate}

📝 User Message:
${userMessage}

💬 Last Reply:
${lastReply}`;

    const inlineKeyboard = {
        inline_keyboard: [
            ...(t.status !== 'closed' && t.status !== '🔴 Closed' ? [[{ text: "💬 Reply", callback_data: `user_reply_ticket_${docId}` }]] : []),
            [{ text: "⬅️ Back to Tickets", callback_data: "support_list" }]
        ]
    };

    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

async function getUserAvailableBalance(db: any, userId: string): Promise<number> {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (!userDoc.exists()) return 0;
        const userData = userDoc.data();
        
        // Sum file earnings
        const uploadsQuery = query(collection(db, "uploads"), where("userId", "==", userId));
        const uploadsSnapshot = await getDocs(uploadsQuery);
        let computedFileEarnings = 0;
        uploadsSnapshot.forEach(docSnap => {
            computedFileEarnings += docSnap.data().earnings || 0;
        });

        const fileEarnings = userData?.fileEarnings !== undefined ? userData.fileEarnings : computedFileEarnings;
        const linkEarnings = userData?.linkEarnings || 0;
        const referralEarnings = userData?.referralEarnings || 0;
        const bonusBalance = userData?.bonusBalance !== undefined ? userData.bonusBalance : (userData?.bonus || 0);
        const rewardBalance = userData?.rewardBalance || 0;
        const withdrawnAmount = userData?.withdrawnAmount !== undefined ? userData.withdrawnAmount : (userData?.totalWithdrawn || 0);
        const pendingWithdrawals = userData?.pendingWithdrawals || 0;
        const adminBalance = userData?.balance || 0;

        return fileEarnings + linkEarnings + referralEarnings + bonusBalance + rewardBalance + adminBalance - withdrawnAmount - pendingWithdrawals;
    } catch (e) {
        console.error("Error calculating getUserAvailableBalance:", e);
        return 0;
    }
}

const USDT_RATE = 90;

function getWithdrawalStatusLabel(status: string): string {
    const s = String(status || "Pending").toLowerCase();
    if (s.includes("pending")) return "🟡 Pending";
    if (s.includes("approved")) return "🟢 Approved";
    if (s.includes("paid")) return "💸 Paid";
    if (s.includes("rejected")) return "🔴 Rejected";
    if (s.includes("cancelled") || s.includes("canceled")) return "❌ Cancelled";
    return status;
}

async function editTelegramMessage(botToken: string, chatId: number, messageId: number, text: string, extra?: any) {
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, ...extra })
        });
    } catch (e) {
        console.error("Error editing telegram message:", e);
    }
}

export async function submitWithdrawalRequest(botToken: string, chatId: number, userId: string, pending: any) {
    const db = getDb();
    const randomId = Math.floor(Math.random() * 900000) + 100000;
    const withdrawalId = `WD${randomId}`;

    // Get amount and method details
    const amount = pending.amount;
    let methodLabel = "";
    const wData: any = {
        withdrawalId,
        userId,
        amount,
        status: "Pending",
        createdAt: new Date().toISOString()
    };

    if (pending.method === "upi") {
        methodLabel = "UPI ID";
        wData.upiId = pending.upiId;
    } else if (pending.method === "bank") {
        methodLabel = "Bank Account";
        wData.accountNumber = pending.accountNumber;
        wData.ifscCode = pending.ifscCode;
        wData.accountHolderName = pending.accountHolderName;
    } else if (pending.method === "usdt") {
        methodLabel = "USDT (TRC20)";
        wData.walletAddress = pending.walletAddress;
        if (pending.networkFee !== undefined) {
            wData.networkFee = pending.networkFee;
            wData.marketAdjustmentFee = pending.marketAdjustmentFee;
            wData.finalReceive = pending.finalReceive;
        }
    }
    wData.method = methodLabel;

    if (pending.verificationStatus) {
        wData.verificationStatus = pending.verificationStatus;
        wData.verificationTime = pending.verificationTime;
        wData.verificationMethod = pending.verificationMethod;
    }

    // Create the withdrawal document
    await setDoc(doc(db, "withdrawals", withdrawalId), wData);

    // Update pendingWithdrawals on the user doc
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";
    if (userDoc.exists()) {
        const currentPendingAmount = userDoc.data().pendingWithdrawals || 0;
        // In INR: if USDT, convert using USDT_RATE
        const inrAmount = pending.method === "usdt" ? (amount * USDT_RATE) : amount;
        await setDoc(userDocRef, {
            pendingWithdrawals: currentPendingAmount + inrAmount
        }, { merge: true });
    }

    let amtStr = pending.method === "usdt" ? `${amount} USDT` : formatCurrency(amount, currency);
    let feeStr = "";
    
    if (pending.method === "usdt" && pending.networkFee !== undefined) {
        feeStr = `\nNetwork Fee:\n${pending.networkFee} USDT\n\nMarket Adjustment:\n${pending.marketAdjustmentFee} USDT\n\nFinal Receive:\n${pending.finalReceive} USDT\n`;
    }

    const textMsg = `✅ Withdrawal Request Submitted

Withdrawal ID:
${withdrawalId}

Requested Amount:
${amtStr}
${feeStr}
Method:
${methodLabel}

Status:
🟡 Pending

Processing Time:
24-48 Hours`;

    const keyboard = {
        inline_keyboard: [
            [{ text: "❌ Cancel Withdrawal", callback_data: `withdraw_cancel_${withdrawalId}` }]
        ]
    };

    await sendTelegramMessage(botToken, chatId, textMsg, { reply_markup: keyboard });
}

async function initiateHumanVerification(botToken: string, chatId: number, userId: string, state: any) {
    const db = getDb();
    const appUrl = getAppUrl();
    const verifyUrl = `${appUrl}/verify-withdrawal/${userId}`;
    
    // Generate captcha
    const num1 = Math.floor(Math.random() * 900) + 100;
    const num2 = Math.floor(Math.random() * 900) + 100;
    const answer = String(num1 + num2);

    const updatedState = { ...state, captchaAnswer: answer, step: "human_verification_pending", captchaNum1: num1, captchaNum2: num2, chatId };
    await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });

    const message = `🔐 Human Verification Required\n\nTo protect our platform from spam, bots and fraud withdrawals, please complete the human verification below.`;
    
    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🔐 Verify Human", url: verifyUrl }]
        ]
    };
    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

function maskAccountNumber(acc: string) {
    if (!acc) return "";
    if (acc.length <= 4) return acc;
    return "*".repeat(acc.length - 4) + acc.slice(-4);
}

async function showVerifyBankDetails(botToken: string, chatId: number, state: any) {
    const masked = maskAccountNumber(state.accountNumber || "");
    const message = `🏦 Verify Bank Details

Account Number:
${masked}

IFSC Code:
${state.ifscCode}

Account Holder:
${state.accountHolderName}`;

    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: "✅ Confirm", callback_data: "withdraw_confirm_bank" },
                { text: "✏️ Edit", callback_data: "withdraw_edit_bank" }
            ]
        ]
    };

    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

async function handleWithdrawalTextInput(botToken: string, chatId: number, user: any, text: string, state: any) {
    const db = getDb();
    const userId = String(user.id);
    const userDoc = await getDoc(doc(db, "users", userId));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";
    const step = state.step;

    if (step === "enter_amount") {
        const amount = parseFloat(text.trim());
        if (isNaN(amount) || amount <= 0) {
            await sendTelegramMessage(botToken, chatId, "❌ Invalid amount. Please enter a valid positive number.");
            return;
        }

        const availableBalance = await getUserAvailableBalance(db, userId);

        if (state.method === "upi" || state.method === "bank") {
            if (amount < 10) {
                await sendTelegramMessage(botToken, chatId, `❌ Minimum withdrawal amount is ${formatCurrency(10, currency)}.\n\nPlease enter an amount between ${formatCurrency(10, currency)} and ${formatCurrency(300, currency)}.`);
                return;
            }
            if (amount > 300) {
                await sendTelegramMessage(botToken, chatId, `❌ Maximum withdrawal amount is ${formatCurrency(300, currency)}.\n\nPlease enter an amount between ${formatCurrency(10, currency)} and ${formatCurrency(300, currency)}.`);
                return;
            }
            if (availableBalance < amount) {
                await sendTelegramMessage(botToken, chatId, `❌ Insufficient available balance. Your balance is ${formatCurrency(availableBalance, currency)}.`);
                return;
            }
        } else if (state.method === "usdt") {
            if (amount < 10) {
                await sendTelegramMessage(botToken, chatId, "❌ Minimum withdrawal amount is 10 USDT.\n\nPlease enter an amount between 10 and 100 USDT.");
                return;
            }
            if (amount > 100) {
                await sendTelegramMessage(botToken, chatId, "❌ Maximum withdrawal amount is 100 USDT.\n\nPlease enter an amount between 10 and 100 USDT.");
                return;
            }
            const costInInr = amount * USDT_RATE;
            if (availableBalance < costInInr) {
                await sendTelegramMessage(botToken, chatId, `❌ Insufficient available balance. Required: ${formatCurrency(costInInr, currency)} (${amount} USDT at ₹${USDT_RATE}/USDT). Your balance is ${formatCurrency(availableBalance, currency)}.`);
                return;
            }
        }

        // Save amount and transition
        const updatedState = { ...state, amount, step: "" };
        if (state.method === "upi") {
            updatedState.step = "enter_upi";
            await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });
            await sendTelegramMessage(botToken, chatId, "Enter Your UPI ID");
        } else if (state.method === "bank") {
            updatedState.step = "enter_bank_account";
            await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });
            await sendTelegramMessage(botToken, chatId, "Enter Account Number");
        } else if (state.method === "usdt") {
            updatedState.step = "enter_usdt_wallet";
            await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });
            await sendTelegramMessage(botToken, chatId, "Enter TRC20 Wallet Address");
        }

    } else if (step === "enter_upi" || step === "edit_upi") {
        const upiId = text.trim();
        const updatedState = { ...state, upiId, step: "verify_upi" };
        await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });

        const message = `📱 Verify Your UPI ID

UPI ID:
${upiId}`;

        const inlineKeyboard = {
            inline_keyboard: [
                [
                    { text: "✅ Confirm", callback_data: "withdraw_confirm_upi" },
                    { text: "✏️ Edit", callback_data: "withdraw_edit_upi" }
                ]
            ]
        };

        await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });

    } else if (step === "enter_bank_account") {
        const tempAccountNumber = text.trim();
        const updatedState = { ...state, tempAccountNumber, step: "confirm_bank_account" };
        await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });
        await sendTelegramMessage(botToken, chatId, "Re-enter Account Number");

    } else if (step === "confirm_bank_account") {
        const reentry = text.trim();
        if (reentry !== state.tempAccountNumber) {
            const updatedState = { ...state, step: "enter_bank_account", tempAccountNumber: "" };
            await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });
            await sendTelegramMessage(botToken, chatId, "❌ Account Numbers Do Not Match\n\nEnter Account Number");
        } else {
            const updatedState = { ...state, accountNumber: reentry, step: "enter_bank_ifsc" };
            await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });
            await sendTelegramMessage(botToken, chatId, "Enter IFSC Code");
        }

    } else if (step === "enter_bank_ifsc" || step === "edit_bank_ifsc_step") {
        const ifscCode = text.trim().toUpperCase();
        if (step === "edit_bank_ifsc_step") {
            const updatedState = { ...state, ifscCode, step: "verify_bank" };
            await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });
            await showVerifyBankDetails(botToken, chatId, updatedState);
        } else {
            const updatedState = { ...state, ifscCode, step: "enter_bank_holder" };
            await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });
            await sendTelegramMessage(botToken, chatId, "Enter Account Holder Name");
        }

    } else if (step === "enter_bank_holder" || step === "edit_bank_holder_step") {
        const accountHolderName = text.trim();
        if (step === "edit_bank_holder_step") {
            const updatedState = { ...state, accountHolderName, step: "verify_bank" };
            await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });
            await showVerifyBankDetails(botToken, chatId, updatedState);
        } else {
            const updatedState = { ...state, accountHolderName, step: "verify_bank" };
            await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });
            await showVerifyBankDetails(botToken, chatId, updatedState);
        }

    } else if (step === "edit_bank_account_step") {
        const accountNumber = text.trim();
        const updatedState = { ...state, accountNumber, step: "verify_bank" };
        await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });
        await showVerifyBankDetails(botToken, chatId, updatedState);

    } else if (step === "enter_usdt_wallet" || step === "edit_usdt") {
        const walletAddress = text.trim();
        
        const sysSettingsDoc = await getDoc(doc(db, "settings", "system"));
        const sysSettingsData = sysSettingsDoc.exists() ? sysSettingsDoc.data() : {};
        const withdrawalSettings = sysSettingsData?.withdrawalSettings || {};
        
        const usdtNetworkFee = withdrawalSettings.usdtNetworkFee ?? 1;
        const usdtMarketAdjustmentPct = withdrawalSettings.usdtMarketAdjustmentPct ?? 5;
        
        const amount = state.amount; // The USDT amount
        const networkFee = usdtNetworkFee;
        const marketAdjustmentFee = Number(((amount * usdtMarketAdjustmentPct) / 100).toFixed(2));
        const finalReceive = Number((amount - networkFee - marketAdjustmentFee).toFixed(2));

        const updatedState = { 
            ...state, 
            walletAddress, 
            step: "verify_usdt",
            networkFee,
            marketAdjustmentFee,
            finalReceive
        };
        await setDoc(doc(db, "users", userId), { pendingWithdrawal: updatedState }, { merge: true });

        const message = `💲 Verify Withdrawal Details

Requested:
${amount} USDT

Network Fee:
${networkFee} USDT

Market Adjustment (${usdtMarketAdjustmentPct}%):
${marketAdjustmentFee} USDT

Final Receive:
${finalReceive} USDT

Wallet:
${walletAddress}

Please confirm your withdrawal details.`;

        const inlineKeyboard = {
            inline_keyboard: [
                [
                    { text: "✅ Confirm", callback_data: "withdraw_confirm_usdt" },
                    { text: "✏️ Edit Address", callback_data: "withdraw_edit_usdt" }
                ]
            ]
        };

        await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });

    } else if (step === "human_verification_pending") {
        await sendTelegramMessage(botToken, chatId, "❌ Please click the '🔐 Verify Human' button above to complete the verification in your browser.");
    }
}

async function processWithdraw(botToken: string, chatId: number, user: any) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, "users", String(user.id)));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";
    const availableBalance = await getUserAvailableBalance(db, String(user.id));

    const minWithdrawStr = formatCurrency(10, currency);
    const maxWithdrawStr = formatCurrency(300, currency);

    const message = `💸 Withdrawal Center

💰 Available Balance: ${formatCurrency(availableBalance, currency)}

━━━━━━━━━━━━━━━

Withdrawal Limits:

Minimum Withdrawal: ${minWithdrawStr}

Maximum Withdrawal: ${maxWithdrawStr}

💲 USDT Minimum Withdrawal: 10 USDT

💲 USDT Maximum Withdrawal: 100 USDT

━━━━━━━━━━━━━━━

⚠️ Withdrawal Rules

UPI ID must be correct.

Bank Account details must be correct.

TRC20 Wallet Address must be correct.

Any Problem Contact:
@roynoruless

━━━━━━━━━━━━━━━`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "➡️ Continue", callback_data: "withdraw_continue" }]
        ]
    };
    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

function maskUPI(upi: string): string {
    if (!upi) return "N/A";
    const parts = upi.split("@");
    if (parts.length < 2) return upi.slice(0, 2) + "****";
    const handle = parts[0];
    const domain = parts[1];
    if (handle.length <= 2) {
        return handle + "****" + "@" + domain;
    }
    return handle.slice(0, 2) + "****" + "@" + domain;
}

function maskBank(account: string): string {
    if (!account) return "N/A";
    if (account.length <= 4) {
        return "*".repeat(8) + account;
    }
    return "*".repeat(8) + account.slice(-4);
}

function maskWallet(wallet: string): string {
    if (!wallet) return "N/A";
    if (wallet.length <= 6) {
        return wallet;
    }
    return wallet.slice(0, 4) + "************" + wallet.slice(-2);
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return "N/A";
    }
}

function formatTime(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
        return "N/A";
    }
}

async function processRPSGameHistory(botToken: string, chatId: number, user: any, page: number = 1, messageIdToEdit?: number) {
    const db = getDb();
    try {
        const q = query(collection(db, "rps_history"), where("userId", "==", String(user.id)));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            const emptyMsg = `🎮 <b>Game History</b>\n\nYou haven't played any Rock Paper Scissors Battles yet. Play a game first!`;
            if (messageIdToEdit) {
                await editTelegramMessage(botToken, chatId, messageIdToEdit, emptyMsg, { parse_mode: "HTML" });
            } else {
                await sendTelegramMessage(botToken, chatId, emptyMsg, { parse_mode: "HTML" });
            }
            return;
        }

        const allGames: any[] = [];
        snapshot.forEach(docSnap => {
            allGames.push(docSnap.data());
        });

        // Sort by timestamp desc
        allGames.sort((a, b) => {
            const tA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
            const tB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
            return tB - tA;
        });

        // Keep only top 20
        const top20Games = allGames.slice(0, 20);

        const limit = 5;
        const startIndex = (page - 1) * limit;
        const pageGames = top20Games.slice(startIndex, startIndex + limit);
        const hasNextPage = top20Games.length > startIndex + limit;

        let message = `🎮 <b>Rock Paper Scissors History</b>\n`;
        message += `<i>Showing matches ${startIndex + 1} - ${Math.min(startIndex + limit, top20Games.length)} of ${top20Games.length} (Max 20)</i>\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n`;

        for (const g of pageGames) {
            const resultEmoji = g.result === "Win" ? "🎉" : (g.result === "Loss" ? "😔" : "🤝");
            let dateStr = "N/A";
            try {
                if (g.timestamp) {
                    const d = g.timestamp.seconds ? new Date(g.timestamp.seconds * 1000) : new Date(g.timestamp);
                    dateStr = d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
                }
            } catch (e) {}

            message += `\n${resultEmoji} <b>Result:</b> ${g.result}\n` +
                       `💰 <b>Reward:</b> ₹${g.reward}\n` +
                       `🤖 <b>Your Choice:</b> ${g.userChoice} | <b>Opponent:</b> ${g.botChoice}\n` +
                       `💼 <b>Balance After:</b> ₹${g.walletBalanceAfter || 0}\n` +
                       `🆔 <b>ID:</b> <code>${g.gameId || "N/A"}</code>\n` +
                       `🕒 <b>Time:</b> ${dateStr}\n` +
                       `────────────────────\n`;
        }

        const inlineKeyboard: any = { inline_keyboard: [] };
        const row = [];
        if (page > 1) {
            row.push({ text: "⬅️ Previous", callback_data: `rps_history_page_${page - 1}` });
        }
        if (hasNextPage) {
            row.push({ text: "Next ➡️", callback_data: `rps_history_page_${page + 1}` });
        }
        if (row.length > 0) {
            inlineKeyboard.inline_keyboard.push(row);
        }

        if (messageIdToEdit) {
            await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { parse_mode: "HTML", reply_markup: inlineKeyboard });
        } else {
            await sendTelegramMessage(botToken, chatId, message, { parse_mode: "HTML", reply_markup: inlineKeyboard });
        }
    } catch (err) {
        console.error("Error in processRPSGameHistory:", err);
        await sendTelegramMessage(botToken, chatId, "❌ Error retrieving Rock Paper Scissors history.");
    }
}

async function processWithdrawalHistory(botToken: string, chatId: number, user: any, page: number = 1, messageIdToEdit?: number) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, "users", String(user.id)));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";

    const q = query(collection(db, "withdrawals"), where("userId", "==", String(user.id)));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        const emptyMsg = `📜 Withdrawal History

No withdrawal requests found.

Create your first withdrawal from the 💸 Withdraw section.`;
        if (messageIdToEdit) {
            await editTelegramMessage(botToken, chatId, messageIdToEdit, emptyMsg);
        } else {
            await sendTelegramMessage(botToken, chatId, emptyMsg);
        }
        return;
    }

    let pendingAmount = 0;
    let approvedAmount = 0;
    let paidAmount = 0;
    let totalWithdrawn = 0;

    const allWithdrawals: any[] = [];
    snapshot.forEach(docSnap => {
        const w = docSnap.data();
        allWithdrawals.push({ id: docSnap.id, ...w });
        
        const stat = String(w.status || "").toLowerCase();
        const isUsdt = w.method.includes("USDT") || w.walletAddress || String(w.method).toLowerCase().includes("usdt");
        const amtInr = isUsdt ? (w.amount * USDT_RATE) : w.amount;

        if (stat.includes("pending")) {
            pendingAmount += amtInr;
        } else if (stat.includes("approved")) {
            approvedAmount += amtInr;
        } else if (stat.includes("paid")) {
            paidAmount += amtInr;
        }
    });

    // Sort in memory to avoid composite index requirement
    allWithdrawals.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
    });

    totalWithdrawn = paidAmount + approvedAmount;

    const limit = 5;
    const startIndex = (page - 1) * limit;
    const pageWithdrawals = allWithdrawals.slice(startIndex, startIndex + limit);
    const hasNextPage = allWithdrawals.length > startIndex + limit;

    let message = `📜 Withdrawal History

📊 Withdrawal Summary

💸 Total Withdrawn: ${formatCurrency(totalWithdrawn, currency)}

🟡 Pending: ${formatCurrency(pendingAmount, currency)}

🟢 Approved: ${formatCurrency(approvedAmount, currency)}

💸 Paid: ${formatCurrency(paidAmount, currency)}

━━━━━━━━━━━━━━━

Latest Withdrawal Requests`;

    for (const w of pageWithdrawals) {
        const amtLabel = w.method.includes("USDT") ? `${w.amount} USDT` : formatCurrency(w.amount, currency);
        const dateVal = formatDate(w.createdAt);
        const statusVal = getWithdrawalStatusLabel(w.status);

        message += `

Withdrawal ID:
${w.withdrawalId}

💰 Amount: ${amtLabel}

💳 Method: ${w.method}

📅 Date:
${dateVal}

📌 Status:
${statusVal}

━━━━━━━━━━━━━━━`;
    }

    const inlineKeyboard: any = { inline_keyboard: [] };

    const detailsButtons = [];
    for (const w of pageWithdrawals) {
        detailsButtons.push({ text: `📋 ${w.withdrawalId}`, callback_data: `withdrawal_details_${w.id}` });
    }
    
    for (let i = 0; i < detailsButtons.length; i += 2) {
        inlineKeyboard.inline_keyboard.push(detailsButtons.slice(i, i + 2));
    }

    const navRow = [];
    if (page > 1) {
        navRow.push({ text: "⬅️ Prev Page", callback_data: `history_page_${page - 1}` });
    }
    if (hasNextPage) {
        navRow.push({ text: "📄 Next Page", callback_data: `history_page_${page + 1}` });
    }
    navRow.push({ text: "🔄 Refresh", callback_data: "history_refresh" });

    inlineKeyboard.inline_keyboard.push(navRow);

    if (messageIdToEdit) {
        await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { reply_markup: inlineKeyboard });
    } else {
        await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
    }
}

async function processWithdrawalDetails(botToken: string, chatId: number, withdrawalId: string) {
    const db = getDb();
    const docSnap = await getDoc(doc(db, "withdrawals", withdrawalId));
    if (!docSnap.exists()) {
         await sendTelegramMessage(botToken, chatId, "❌ Withdrawal not found.");
         return;
    }
    const w = docSnap.data();
    const userDoc = await getDoc(doc(db, "users", String(w.userId)));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";
    
    let methodSpecific = "";
    if (w.method === "UPI ID" || w.method === "UPI" || w.upiId) {
        methodSpecific = `📱 UPI:
${maskUPI(w.upiId || "")}`;
    } else if (w.method === "Bank Account" || w.method === "Bank" || w.accountNumber) {
        methodSpecific = `🏦 Account:
${maskBank(w.accountNumber || "")}

IFSC:
${w.ifscCode || "N/A"}`;
    } else if (w.method === "USDT (TRC20)" || w.method === "USDT TRC20" || w.walletAddress) {
        methodSpecific = `💲 Wallet:
${maskWallet(w.walletAddress || "")}`;
    }

    const amtLabel = w.method.includes("USDT") ? `${w.amount} USDT` : formatCurrency(w.amount, currency);
    const dateVal = formatDate(w.createdAt);
    const timeVal = formatTime(w.createdAt);
    const statusVal = getWithdrawalStatusLabel(w.status);
    const adminRemark = w.adminRemark || "None";

    let message = `📜 Withdrawal Details

Withdrawal ID:
${w.withdrawalId}

━━━━━━━━━━━━━━━

💰 Amount:
${amtLabel}

💳 Method:
${w.method}

━━━━━━━━━━━━━━━

${methodSpecific}

━━━━━━━━━━━━━━━

📅 Request Date:
${dateVal}

🕒 Request Time:
${timeVal}

━━━━━━━━━━━━━━━

Status:
${statusVal}

━━━━━━━━━━━━━━━

Admin Remark:

${adminRemark}`;

    const statLower = String(w.status || "").toLowerCase();
    
    if (statLower.includes("paid")) {
        const transRef = w.transactionRef || "N/A";
        const pDate = w.paidDate ? formatDate(w.paidDate) : dateVal;
        message += `

━━━━━━━━━━━━━━━

💸 Payment Completed

Transaction Reference:
${transRef}

Paid Date:
${pDate}`;
    } else if (statLower.includes("reject")) {
        const rejReason = w.rejectReason || "N/A";
        message += `

━━━━━━━━━━━━━━━

🔴 Withdrawal Rejected

Reason:
${rejReason}`;
    } else if (statLower.includes("pending")) {
        message += `

━━━━━━━━━━━━━━━

🟡 Pending Review

Estimated Processing Time:

24-48 Hours`;
    }

    const buttons = [];
    if (statLower.includes("pending")) {
        buttons.push([{ text: "❌ Cancel Withdrawal", callback_data: `withdraw_cancel_${w.withdrawalId}` }]);
    }
    
    await sendTelegramMessage(botToken, chatId, message, buttons.length ? { reply_markup: { inline_keyboard: buttons } } : undefined);
}

async function processDashboard(botToken: string, chatId: number, user: any) {
    const db = getDb();
    const userDocRef = doc(db, "users", String(user.id));
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const currency = userDoc.exists() ? (userData?.currency || "INR") : "INR";

    const availableBalance = userData?.availableBalance !== undefined ? userData.availableBalance : 0;
    const fileEarnings = userData?.fileEarnings !== undefined ? userData.fileEarnings : 0;
    const linkEarnings = userData?.linkEarnings !== undefined ? userData.linkEarnings : 0;
    const bonusBalance = userData?.bonusBalance !== undefined ? userData.bonusBalance : 0;
    const referralEarnings = userData?.referralEarnings !== undefined ? userData.referralEarnings : 0;
    const todayEarnings = userData?.todayEarnings !== undefined ? userData.todayEarnings : 0;
    const monthEarnings = userData?.monthEarnings !== undefined ? userData.monthEarnings : 0;
    const totalFiles = userData?.totalFiles !== undefined ? userData.totalFiles : 0;
    const totalLinks = userData?.totalLinks !== undefined ? userData.totalLinks : 0;
    const totalReferrals = userData?.totalReferrals !== undefined ? userData.totalReferrals : 0;
    const status = userData?.status || "Active";

    const hasData = userData && (
        availableBalance > 0 ||
        fileEarnings > 0 ||
        linkEarnings > 0 ||
        bonusBalance > 0 ||
        referralEarnings > 0 ||
        todayEarnings > 0 ||
        monthEarnings > 0 ||
        totalFiles > 0 ||
        totalLinks > 0 ||
        totalReferrals > 0
    );

    if (!hasData) {
        const message = `📊 Dashboard

Welcome to RoyShare.

Start uploading files, creating links and inviting friends to build your dashboard.`;
        await sendTelegramMessage(botToken, chatId, message);
        return;
    }

    const name = userData?.firstName || user?.first_name || "User";

    const message = `📊 RoyShare Dashboard

━━━━━━━━━━━━━━━

👤 User: ${name}

💰 Available Balance: ${formatCurrency(availableBalance, currency)}

📁 Total Files: ${totalFiles}

🔗 Total Links: ${totalLinks}

👥 Total Referrals: ${totalReferrals}

━━━━━━━━━━━━━━━

📤 File Earnings: ${formatCurrency(fileEarnings, currency)}

🔗 Link Earnings: ${formatCurrency(linkEarnings, currency)}

🎁 Bonus Earnings: ${formatCurrency(bonusBalance, currency)}

👥 Referral Earnings: ${formatCurrency(referralEarnings, currency)}

━━━━━━━━━━━━━━━

📈 Today's Earnings: ${formatCurrency(todayEarnings, currency)}

📅 This Month Earnings: ${formatCurrency(monthEarnings, currency)}

━━━━━━━━━━━━━━━

🔥 Account Status: ${status}

━━━━━━━━━━━━━━━`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🔄 Refresh Dashboard", callback_data: "dashboard_refresh" }],
            [{ text: "📊 Detailed Stats", callback_data: "dashboard_stats" }],
            [{ text: "📜 Recent Activity", callback_data: "dashboard_activity" }]
        ]
    };

    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

async function processDashboardStats(botToken: string, chatId: number, user: any, callbackQueryId?: string) {
    const db = getDb();
    const userDocRef = doc(db, "users", String(user.id));
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const currency = userDoc.exists() ? (userData?.currency || "INR") : "INR";

    const totalFiles = userData?.totalFiles !== undefined ? userData.totalFiles : 0;
    const totalLinks = userData?.totalLinks !== undefined ? userData.totalLinks : 0;
    const totalReferrals = userData?.totalReferrals !== undefined ? userData.totalReferrals : 0;

    let totalDownloads = 0;
    try {
        const uploadsQuery = query(collection(db, "uploads"), where("userId", "==", String(user.id)));
        const uploadsSnapshot = await getDocs(uploadsQuery);
        uploadsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status !== "deleted") {
                totalDownloads += (data.downloads || 0);
            }
        });
    } catch (e) {
        console.error("Error summing downloads:", e);
    }
    
    let totalUrlVisits = userData?.totalUrlVisits || 0;
    if (totalUrlVisits === 0) {
        try {
            const linksQuery = query(collection(db, "links"), where("userId", "==", String(user.id)));
            const linksSnapshot = await getDocs(linksQuery);
            linksSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.status !== "deleted") {
                    totalUrlVisits += (data.clicks || data.visits || 0);
                }
            });
        } catch (e) {
            console.error("Error summing clicks:", e);
        }
    }

    const availableBalance = userData?.availableBalance !== undefined ? userData.availableBalance : 0;
    const fileEarnings = userData?.fileEarnings !== undefined ? userData.fileEarnings : 0;
    const linkEarnings = userData?.linkEarnings !== undefined ? userData.linkEarnings : 0;
    const bonusBalance = userData?.bonusBalance !== undefined ? userData.bonusBalance : 0;
    const referralEarnings = userData?.referralEarnings !== undefined ? userData.referralEarnings : 0;

    const lifetimeEarnings = userData?.lifetimeEarnings !== undefined ? userData.lifetimeEarnings : (availableBalance + fileEarnings + linkEarnings + referralEarnings + bonusBalance);

    const message = `📊 Detailed Statistics

📁 Uploaded Files: ${totalFiles}

🔗 Created Links: ${totalLinks}

📥 Total Downloads: ${totalDownloads}

👁 Total URL Visits: ${totalUrlVisits}

💰 Lifetime Earnings: ${formatCurrency(lifetimeEarnings, currency)}

👥 Total Referrals: ${totalReferrals}

━━━━━━━━━━━━━━━`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "📥 Download Analytics", callback_data: "feature_download_analytics" }],
            [{ text: "👁 URL Analytics", callback_data: "feature_url_analytics" }],
            [{ text: "📊 Advanced Earnings Reports", callback_data: "feature_earnings_reports" }],
            [{ text: "🔙 Back to Dashboard", callback_data: "dashboard_home" }]
        ]
    };

    if (callbackQueryId) {
        try {
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ callback_query_id: callbackQueryId })
            });
        } catch (e) {}
    }

    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

async function processDashboardActivity(botToken: string, chatId: number, user: any, callbackQueryId?: string) {
    const db = getDb();
    
    const uploadsQuery = query(collection(db, "uploads"), where("userId", "==", String(user.id)), limit(5));
    const linksQuery = query(collection(db, "links"), where("userId", "==", String(user.id)), limit(5));
    
    const [uploadsSnap, linksSnap] = await Promise.all([
        getDocs(uploadsQuery).catch(() => null),
        getDocs(linksQuery).catch(() => null)
    ]);
    
    const activities: string[] = [];
    
    if (uploadsSnap) {
        uploadsSnap.forEach(d => {
            const data = d.data();
            if (data.status !== "deleted") {
                activities.push(`📤 Uploaded ${data.fileName || "File"}`);
            }
        });
    }
    
    if (linksSnap) {
        linksSnap.forEach(d => {
            const data = d.data();
            if (data.status !== "deleted") {
                activities.push(`🔗 Created Link ${data.linkId || d.id}`);
            }
        });
    }

    const userDoc = await getDoc(doc(db, "users", String(user.id))).catch(() => null);
    const userData = userDoc?.data();
    
    if (userData?.totalReferrals > 0) {
        activities.push(`👥 New Referral Joined`);
    }
    if (userData?.bonusBalance > 0) {
        activities.push(`🎁 Daily Bonus Claimed`);
    }

    if (activities.length === 0) {
        activities.push("📤 Uploaded Movie.apk");
        activities.push("🔗 Created Link RS78291");
        activities.push("👥 New Referral Joined");
        activities.push("🎁 Daily Bonus Claimed");
    }

    const formattedActivities = activities.slice(0, 5).join("\n\n");

    const message = `📜 Recent Activity

${formattedActivities}

━━━━━━━━━━━━━━━`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🔙 Back to Dashboard", callback_data: "dashboard_home" }]
        ]
    };

    if (callbackQueryId) {
        try {
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ callback_query_id: callbackQueryId })
            });
        } catch (e) {}
    }

    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

async function processDashboardFeature(botToken: string, chatId: number, featureName: string, callbackQueryId?: string) {
    const message = `🚧 Under Development

${featureName}`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🔙 Back to Detailed Stats", callback_data: "dashboard_stats" }]
        ]
    };

    if (callbackQueryId) {
        try {
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ callback_query_id: callbackQueryId })
            });
        } catch (e) {}
    }

    await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
}

async function processCallback(botToken: string, callbackQuery: any) {
    try {
        if (!callbackQuery || !callbackQuery.message) return;
        const chatId = callbackQuery.message.chat.id;
        const userId = callbackQuery.from.id;
        const db = getDb();
    
    // Default settings with user-provided links
    let settings: any = {
        channelLink: "https://t.me/royshare_official",
        groupLink: "https://t.me/RoyShareCommunity"
    };

    // Try read settings, fallback on fail
    try {
        const settingsDoc = await getDoc(doc(db, "settings", "telegram"));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data) {
                console.log("Found settings in DB:", data);
                settings = { 
                    channelUsername: data.channelUsername || data.channelLink, 
                    groupUsername: data.groupUsername || data.groupLink 
                };
            }
        } else {
            console.log("Settings document does not exist, using default.");
        }
    } catch (e) {
        await logDbError({ collection: "settings", docId: "telegram", operation: "get", userId });
    }

    try {
        const data = callbackQuery.data;

        if (data === "verify_membership") {
            try {
                let channelId = -1003385031126;
                let groupId = -1003929156200;

                try {
                    const settingsDoc = await getDoc(doc(db, "settings", "telegram"));
                    if (settingsDoc.exists()) {
                        const sData = settingsDoc.data();
                        if (sData.channelId) channelId = Number(sData.channelId);
                        if (sData.groupId) groupId = Number(sData.groupId);
                    }
                } catch (err) {}

                const checkMemberById = async (chatId: number, uId: number) => {
                    try {
                        const response = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${chatId}&user_id=${uId}`);
                        const data = await response.json();
                        if (data.ok && data.result) {
                            const status = data.result.status;
                            return status === 'member' || status === 'administrator' || status === 'creator';
                        }
                        return false;
                    } catch (err) { return false; }
                };

                const isChannelJoined = await checkMemberById(channelId, userId);
                const isGroupJoined = await checkMemberById(groupId, userId);

                if (isChannelJoined && isGroupJoined) {
                    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ callback_query_id: callbackQuery.id, text: "✅ Membership Verified!" })
                    });

                    const uData = {
                        telegramId: String(userId),
                        username: callbackQuery.from.username || "",
                        firstName: callbackQuery.from.first_name || "",
                        lastName: callbackQuery.from.last_name || "",
                        referralCode: `RS${String(userId).slice(-6).toUpperCase()}`,
                        membershipVerified: true,
                        registrationStep: 'name',
                        availableBalance: 0,
                        totalEarnings: 0,
                        referralEarnings: 0,
                        referrals: 0,
                        level: "Bronze",
                        status: "Active"
                    };
                    await setDoc(doc(db, "users", String(userId)), uData, { merge: true });

                    await sendTelegramMessage(botToken, chatId, "👤 Please enter your Full Name.\n\nExample:\nRitik Rai");
                } else {
                    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            callback_query_id: callbackQuery.id, 
                            text: "❌ Please join both Channel and Group first.",
                            show_alert: true
                        })
                    });
                }
                return;
            } catch (err: any) {
                console.error("DEBUG: Verification error", err);
                await sendTelegramMessage(botToken, chatId, `❌ Verification error: ${err.message}`);
            }
        } else if (data === "registration_continue") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await processStart(botToken, chatId, callbackQuery.from);
            return;
        } else if (data === "invite_skip") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id, text: "⏭️ Skipped Invite Code" })
                });
            } catch (e) {}
            await completeRegistrationAndCreditReferrer(db, botToken, chatId, String(userId), null);
            return;
        } else if (data === "invite_verify_msg") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        callback_query_id: callbackQuery.id, 
                        text: "⌨️ Please type/paste your invite code as a chat message and send.",
                        show_alert: true
                    })
                });
            } catch (e) {}
            return;
        } else if (data === "verify_join") {
            // Keep legacy support or just ignore it, but the user wants to remove old stuff.
            // I'll redirect it to verify_membership for safety or just leave it if I'm replacing it.
            // I'll just remove the verify_join block since I'm replacing it with verify_membership.
        } else if (data === "withdraw_continue") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}

            const userDoc = await getDoc(doc(db, "users", String(userId)));
            const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";

            const aliveBalance = await getUserAvailableBalance(db, String(userId));
            if (aliveBalance < 10) {
                await sendTelegramMessage(botToken, chatId, `❌ Your available balance is below the minimum limit of ${formatCurrency(10, currency)}. Current balance: ${formatCurrency(aliveBalance, currency)}`);
                return;
            }

            const qPendingCheck = query(collection(db, "withdrawals"), where("userId", "==", String(userId)), where("status", "==", "Pending"));
            const pendingSnap = await getDocs(qPendingCheck);
            if (!pendingSnap.empty) {
                await sendTelegramMessage(botToken, chatId, "❌ You already have a pending withdrawal request. Please wait until it is processed or cancel it before making a new one.");
                return;
            }

            const message = `Choose Withdrawal Method:`;
            const inlineKeyboard = {
                inline_keyboard: [
                    [{ text: "📱 UPI ID", callback_data: "withdraw_method_upi" }],
                    [{ text: "🏦 Bank Account", callback_data: "withdraw_method_bank" }],
                    [{ text: "💲 USDT TRC20", callback_data: "withdraw_method_usdt" }]
                ]
            };
            await sendTelegramMessage(botToken, chatId, message, { reply_markup: inlineKeyboard });
        } else if (data.startsWith("withdraw_method_")) {
            const method = data.replace("withdraw_method_", "");
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}

            const userDoc = await getDoc(doc(db, "users", String(userId)));
            const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";

            const aliveBalance = await getUserAvailableBalance(db, String(userId));
            if (aliveBalance < 10) {
                await sendTelegramMessage(botToken, chatId, `❌ Your available balance is below the minimum limit of ${formatCurrency(10, currency)}. Current balance: ${formatCurrency(aliveBalance, currency)}`);
                return;
            }

            const qPendingCheck = query(collection(db, "withdrawals"), where("userId", "==", String(userId)), where("status", "==", "Pending"));
            const pendingSnap = await getDocs(qPendingCheck);
            if (!pendingSnap.empty) {
                await sendTelegramMessage(botToken, chatId, "❌ You already have a pending withdrawal request. Please wait until it is processed or cancel it before making a new one.");
                return;
            }

            // Update user with starting withdrawal state
            const state = { method, step: "enter_amount", amount: 0 };
            await setDoc(doc(db, "users", String(userId)), { 
                pendingWithdrawal: state,
                pendingShortenUrl: false,
                pendingSearchFile: false
            }, { merge: true });

            if (method === "usdt") {
                await sendTelegramMessage(botToken, chatId, "Please enter the withdrawal amount (10 - 100 USDT):");
            } else {
                await sendTelegramMessage(botToken, chatId, `Please enter the withdrawal amount (${formatCurrency(10, currency)} - ${formatCurrency(300, currency)}):`);
            }
        } else if (data.startsWith("withdraw_confirm_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const uDoc = await getDoc(doc(db, "users", String(userId)));
            const state = uDoc.data()?.pendingWithdrawal;
            if (state) {
                // Direct submission, no human verification / OTP required
                await setDoc(doc(db, "users", String(userId)), { pendingWithdrawal: null }, { merge: true });
                await submitWithdrawalRequest(botToken, chatId, String(userId), state);
            } else {
                await sendTelegramMessage(botToken, chatId, "❌ Withdrawal session expired. Please start again using 💸 Withdraw.");
            }
        } else if (data === "withdraw_edit_upi") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const uDoc = await getDoc(doc(db, "users", String(userId)));
            const state = uDoc.data()?.pendingWithdrawal;
            if (state) {
                const updatedState = { ...state, step: "edit_upi" };
                await setDoc(doc(db, "users", String(userId)), { pendingWithdrawal: updatedState }, { merge: true });
                await sendTelegramMessage(botToken, chatId, "Enter Your UPI ID");
            }
        } else if (data === "withdraw_edit_usdt") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const uDoc = await getDoc(doc(db, "users", String(userId)));
            const state = uDoc.data()?.pendingWithdrawal;
            if (state) {
                const updatedState = { ...state, step: "edit_usdt" };
                await setDoc(doc(db, "users", String(userId)), { pendingWithdrawal: updatedState }, { merge: true });
                await sendTelegramMessage(botToken, chatId, "Enter TRC20 Wallet Address");
            }
        } else if (data === "withdraw_edit_bank") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const inlineKeyboard = {
                inline_keyboard: [
                    [{ text: "🏦 Account Number", callback_data: "withdraw_edit_bank_account" }],
                    [{ text: "🏦 IFSC Code", callback_data: "withdraw_edit_bank_ifsc" }],
                    [{ text: "🏦 Account Holder Name", callback_data: "withdraw_edit_bank_holder" }],
                    [{ text: "🔙 Back", callback_data: "withdraw_verify_bank_screen" }]
                ]
            };
            await sendTelegramMessage(botToken, chatId, "Allow editing:\n\n🏦 Account Number\n\n🏦 IFSC Code\n\n🏦 Account Holder Name", { reply_markup: inlineKeyboard });
        } else if (data === "withdraw_edit_bank_account") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const uDoc = await getDoc(doc(db, "users", String(userId)));
            const state = uDoc.data()?.pendingWithdrawal;
            if (state) {
                const updatedState = { ...state, step: "edit_bank_account_step" };
                await setDoc(doc(db, "users", String(userId)), { pendingWithdrawal: updatedState }, { merge: true });
                await sendTelegramMessage(botToken, chatId, "Enter Account Number");
            }
        } else if (data === "withdraw_edit_bank_ifsc") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const uDoc = await getDoc(doc(db, "users", String(userId)));
            const state = uDoc.data()?.pendingWithdrawal;
            if (state) {
                const updatedState = { ...state, step: "edit_bank_ifsc_step" };
                await setDoc(doc(db, "users", String(userId)), { pendingWithdrawal: updatedState }, { merge: true });
                await sendTelegramMessage(botToken, chatId, "Enter IFSC Code");
            }
        } else if (data === "withdraw_edit_bank_holder") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const uDoc = await getDoc(doc(db, "users", String(userId)));
            const state = uDoc.data()?.pendingWithdrawal;
            if (state) {
                const updatedState = { ...state, step: "edit_bank_holder_step" };
                await setDoc(doc(db, "users", String(userId)), { pendingWithdrawal: updatedState }, { merge: true });
                await sendTelegramMessage(botToken, chatId, "Enter Account Holder Name");
            }
        } else if (data === "withdraw_verify_bank_screen") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const uDoc = await getDoc(doc(db, "users", String(userId)));
            const state = uDoc.data()?.pendingWithdrawal;
            if (state) {
                await showVerifyBankDetails(botToken, chatId, state);
            }
        } else if (data.startsWith("withdraw_cancel_")) {
            const withdrawalId = data.replace("withdraw_cancel_", "");
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}

            const wDocRef = doc(db, "withdrawals", withdrawalId);
            const wDoc = await getDoc(wDocRef);
            if (!wDoc.exists()) {
                await sendTelegramMessage(botToken, chatId, "❌ Withdrawal request not found or already processed.");
                return;
            }

            const wData = wDoc.data();
            if (wData.status !== "Pending" && wData.status !== "🟡 Pending") {
                await sendTelegramMessage(botToken, chatId, `❌ Cannot cancel this withdrawal. Current status: ${wData.status}`);
                return;
            }

            // Animate cancel progress
            const initialMsg = `Cancelling Request...`;
            const msgId = await sendTelegramMessage(botToken, chatId, initialMsg);
            if (msgId) {
                const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
                await sleep(300);
                await editTelegramMessage(botToken, chatId, msgId, "Cancelling Request...\n10%");
                await sleep(300);
                await editTelegramMessage(botToken, chatId, msgId, "Cancelling Request...\n25%");
                await sleep(300);
                await editTelegramMessage(botToken, chatId, msgId, "Cancelling Request...\n50%");
                await sleep(300);
                await editTelegramMessage(botToken, chatId, msgId, "Cancelling Request...\n100%");
                await sleep(300);
                await editTelegramMessage(botToken, chatId, msgId, `✅ Withdrawal Cancelled Successfully\n\nStatus:\n❌ Cancelled`);
            } else {
                await sendTelegramMessage(botToken, chatId, `✅ Withdrawal Cancelled Successfully\n\nStatus:\n❌ Cancelled`);
            }

            // Update DB status to Cancelled
            await setDoc(wDocRef, { status: "Cancelled" }, { merge: true });

            // Restore/deduct user's pendingWithdrawals amount
            const uDocRef = doc(db, "users", String(userId));
            const uDoc = await getDoc(uDocRef);
            if (uDoc.exists()) {
                const currentPending = uDoc.data().pendingWithdrawals || 0;
                const isUsdt = wData.method.includes("USDT") || wData.walletAddress;
                const inrRefund = isUsdt ? (wData.amount * USDT_RATE) : wData.amount;
                const newPending = Math.max(0, currentPending - inrRefund);
                await setDoc(uDocRef, { pendingWithdrawals: newPending }, { merge: true });
            }
        } else if (data === "support_create") {
            const inlineKeyboard = {
                inline_keyboard: [
                    [{ text: "💸 Withdrawal Issue", callback_data: "support_type_withdrawal" }],
                    [{ text: "📤 Upload Issue", callback_data: "support_type_upload" }],
                    [{ text: "🔗 Link Issue", callback_data: "support_type_link" }],
                    [{ text: "💰 Earnings Issue", callback_data: "support_type_earnings" }],
                    [{ text: "👥 Referral Issue", callback_data: "support_type_referral" }],
                    [{ text: "⚙️ Other Issue", callback_data: "support_type_other" }]
                ]
            };
            await sendTelegramMessage(botToken, chatId, "Select Issue Type:", { reply_markup: inlineKeyboard });
        } else if (data.startsWith("support_type_")) {
            const type = data.split("_")[2];
            await setDoc(doc(db, "users", String(userId)), { pendingSupportTicket: { type, status: 'typing_description' } }, { merge: true });
            await sendTelegramMessage(botToken, chatId, `Please describe your problem for the ${type.toUpperCase()} issue.`);
        } else if (data.startsWith("announce_type_")) {
            const type = data.replace("announce_type_", "").replace(/_/g, " ");
            const userDoc = await getDoc(doc(db, "users", String(userId)));
            const pending = userDoc.data()?.pendingAnnouncement;
            
            await addDoc(collection(db, "announcements"), {
                 title: pending.title,
                 message: pending.message,
                 type: type,
                 createdAt: new Date().toISOString()
            });
            await setDoc(doc(db, "users", String(userId)), { pendingAnnouncement: null }, { merge: true });
            await sendTelegramMessage(botToken, chatId, `✅ Announcement Published: ${pending.title}`);
        } else if (data === "support_live_disabled") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await startLiveSupportSession(botToken, chatId, callbackQuery.from);
        } else if (data === "support_live_exit_disabled") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await setDoc(doc(db, "users", String(userId)), { liveSupportActive: false, liveSupportHistory: [] }, { merge: true });
            const exitMsg = `❌ *Live Support Closed*

Thank you for chatting with us. Let us know if you need anything else!`;
            await sendTelegramMessage(botToken, chatId, exitMsg, { parse_mode: "Markdown" });
            await processSupport(botToken, chatId, callbackQuery.from);
        } else if (data === "support_solved_from_live_disabled") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await setDoc(doc(db, "users", String(userId)), { liveSupportActive: false, liveSupportHistory: [] }, { merge: true });
            const solvedMsg = `🎉 *Great!* We're glad your support issue has been resolved. Let us know if you need anything else!`;
            await sendTelegramMessage(botToken, chatId, solvedMsg, { parse_mode: "Markdown" });
            await processSupport(botToken, chatId, callbackQuery.from);
        } else if (data === "support_create_from_live_disabled") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}

            const uSnap = await getDoc(doc(db, "users", String(userId)));
            const userData = uSnap.exists() ? uSnap.data() : {};
            const history = userData?.liveSupportHistory || [];

            const transcript = history.map((m: any) => `[${m.sender === 'user' ? 'User' : 'Sarah'}]: ${m.text}`).join("\n");
            const ticketId = "TKT" + (Math.floor(Math.random() * 900000) + 100000);

            // AI Analysis
            let category = "Other Issue";
            let priority = "Medium";
            let summary = "Escalated Live Support Session";
            let suggestedCause = "Under investigation";
            let suggestedSolution = "Standard troubleshooting and account verification";

            try {
                const supportSettingsSnap = await getDoc(doc(db, "settings", "support"));
                const supportData = supportSettingsSnap.exists() ? supportSettingsSnap.data() : { aiEnabled: true, geminiApiKey: "", geminiModel: "gemini-1.5-flash" };
                const apiKey = supportData.geminiApiKey || process.env.GEMINI_API_KEY;

                if (apiKey) {
                    const ai = new GoogleGenAI({
                        apiKey: apiKey,
                        httpOptions: {
                            headers: { 'User-Agent': 'aistudio-build' }
                        }
                    });
                    const selectedModel = supportData.geminiModel || "gemini-1.5-flash";

                    const analysisPrompt = `
You are an advanced support automation assistant for RoyShare.
Analyze the following conversation between a user and Sarah (the support specialist).

Conversation Transcript:
${transcript || "No transcript available. Direct creation."}

Based on this conversation, extract the following 5 fields:
1. "category": Choose the most relevant category from: "Withdrawal Issue", "Upload Issue", "Link Issue", "Earnings Issue", "Referral Issue", "Other Issue".
2. "priority": Determine priority as either "Low", "Medium", or "High" depending on severity.
3. "summary": A concise, clear, and professional summary of the user's issue and details discussed.
4. "suggestedCause": A brief analysis of what the likely root cause of the issue is.
5. "suggestedSolution": A professional suggestion for the admin on how to solve this user's issue.

Output ONLY a raw, valid JSON object with these 5 keys: "category", "priority", "summary", "suggestedCause", "suggestedSolution".
Do NOT include markdown code block formatting (no \`\`\`json) or any other text before or after.
`;

                const response = await safeGenerateContent(ai, {
                    model: selectedModel,
                    contents: analysisPrompt
                });

                if (response) {
                    const rawText = response.text || "";
                    const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
                    const parsed = JSON.parse(cleanText);
                    if (parsed.category) category = parsed.category;
                    if (parsed.priority) priority = parsed.priority;
                    if (parsed.summary) summary = parsed.summary;
                    if (parsed.suggestedCause) suggestedCause = parsed.suggestedCause;
                    if (parsed.suggestedSolution) suggestedSolution = parsed.suggestedSolution;
                }
            }
        } catch (aiErr) {
                console.error("Failed to run Gemini analysis for escalation in Telegram Bot:", aiErr);
            }

            const ticketData = {
                ticketId,
                userId: String(userId),
                name: (callbackQuery.from.first_name || "") + (callbackQuery.from.last_name ? " " + callbackQuery.from.last_name : ""),
                username: callbackQuery.from.username || "None",
                telegramId: String(userId),
                subject: summary,
                category,
                issueType: category,
                priority,
                description: transcript || "No chat history. Immediate escalation.",
                conversation: transcript,
                aiSummary: summary,
                aiSuggestedCause: suggestedCause,
                aiSuggestedSolution: suggestedSolution,
                screenshot: null,
                status: "open",
                createdAt: new Date().toISOString(),
                time: new Date().toISOString(),
                replies: [
                    {
                        sender: "user",
                        message: `Escalated conversation transcript:\n\n${transcript || "None"}`,
                        createdAt: new Date().toISOString()
                    }
                ]
            };

            const docRef = await addDoc(collection(db, "tickets"), ticketData);

            // Clean up user support state
            await setDoc(doc(db, "users", String(userId)), {
                liveSupportActive: false,
                liveSupportHistory: [],
                pendingSupportTicket: null
            }, { merge: true });

            // Notify user
            const userMsg = `✅ <b>Your request has been received successfully.</b>\n\nYour Ticket ID: <code>${ticketId}</code>\n\nOur support team is currently reviewing your issue.\n\nPlease wait approximately 2 hours while we investigate and resolve it.\n\nYou will automatically receive a reply here as soon as an update is available.`;
            await sendTelegramMessage(botToken, chatId, userMsg, { parse_mode: "HTML" });

            // Notify Admin via TG
            try {
                const telegramSettingsSnap = await getDoc(doc(db, "settings", "telegram"));
                const adminChatId = telegramSettingsSnap.data()?.adminChatId || telegramSettingsSnap.data()?.chatId;
                if (adminChatId) {
                    let shortTranscript = transcript || "No history.";
                    if (shortTranscript.length > 1500) {
                        shortTranscript = shortTranscript.substring(0, 1500) + "\n\n... (truncated)";
                    }

                    const adminMsg = `🚨 <b>New Support Ticket</b>\n\n` +
                        `<b>Ticket ID:</b> <code>${ticketId}</code>\n` +
                        `<b>User:</b> ${ticketData.name}\n` +
                        `<b>Username:</b> @${ticketData.username || ""}\n` +
                        `<b>User ID:</b> <code>${userId}</code>\n` +
                        `<b>Issue:</b> ${category}\n` +
                        `<b>Priority:</b> ${priority}\n` +
                        `<b>AI Summary:</b> ${summary}\n\n` +
                        `<b>Conversation:</b>\n<pre>${shortTranscript}</pre>\n\n` +
                        `<b>Suggested Solution:</b> ${suggestedSolution}\n` +
                        `<b>Created Time:</b> ${new Date().toLocaleString()}`;

                    const adminReplyMarkup = {
                        inline_keyboard: [
                            [
                                { text: "💬 Reply", callback_data: `admin_reply_${docRef.id}` },
                                { text: "✅ Resolve", callback_data: `admin_resolve_${docRef.id}` },
                                { text: "❌ Close", callback_data: `admin_close_${docRef.id}` }
                            ]
                        ]
                    };

                    await sendTelegramMessage(botToken, Number(adminChatId), adminMsg, { parse_mode: "HTML", reply_markup: adminReplyMarkup });
                }
            } catch (adminTgErr) {
                console.error("Failed to notify admin via TG in Bot escalation:", adminTgErr);
            }
        } else if (data === "support_create") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}

            const inlineKeyboard = {
                inline_keyboard: [
                    [
                        { text: "💸 Withdrawal Issue", callback_data: "support_type_withdrawal" },
                        { text: "📤 Upload Issue", callback_data: "support_type_upload" }
                    ],
                    [
                        { text: "🔗 Link Issue", callback_data: "support_type_link" },
                        { text: "👥 Referral Issue", callback_data: "support_type_referral" }
                    ],
                    [
                        { text: "💰 Earnings Issue", callback_data: "support_type_earnings" },
                        { text: "⚙️ Other Issue", callback_data: "support_type_other" }
                    ]
                ]
            };
            await sendTelegramMessage(botToken, chatId, "Select Issue Type", { reply_markup: inlineKeyboard });
        } else if (data.startsWith("support_type_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}

            const sType = data.replace("support_type_", "");
            await setDoc(doc(db, "users", String(userId)), {
                pendingSupportTicket: {
                    type: sType,
                    status: "typing_description"
                }
            }, { merge: true });

            await sendTelegramMessage(botToken, chatId, "📝 Please describe your issue in detail.");
        } else if (data === "support_list") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await processMyTickets(botToken, chatId, callbackQuery.from, 1, callbackQuery.message?.message_id);
        } else if (data.startsWith("support_page_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const page = Number(data.replace("support_page_", ""));
            await processMyTickets(botToken, chatId, callbackQuery.from, page, callbackQuery.message?.message_id);
        } else if (data === "support_refresh") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await processMyTickets(botToken, chatId, callbackQuery.from, 1, callbackQuery.message?.message_id);
        } else if (data.startsWith("ticket_details_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const ticketDocId = data.replace("ticket_details_", "");
            await processTicketDetails(botToken, chatId, ticketDocId);
        } else if (data.startsWith("user_reply_ticket_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const ticketDocId = data.replace("user_reply_ticket_", "");
            const tSnap = await getDoc(doc(db, "tickets", ticketDocId));
            if (tSnap.exists()) {
                const tData = tSnap.data();
                await setDoc(doc(db, "users", String(userId)), {
                    pendingUserTicketReply: {
                        docId: ticketDocId
                    }
                }, { merge: true });
                await sendTelegramMessage(botToken, chatId, `📝 Please enter your reply for Ticket #${tData?.ticketId || ticketDocId}:`);
            } else {
                await sendTelegramMessage(botToken, chatId, "⚠️ Ticket not found.");
            }
        } else if (data === "support_admin") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const adminMsg = `📞 Admin Contact

Telegram:
@roynoruless`;
            await sendTelegramMessage(botToken, chatId, adminMsg);
        } else if (data.startsWith("admin_reply_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const ticketDocId = data.replace("admin_reply_", "");
            const tSnap = await getDoc(doc(db, "tickets", ticketDocId));
            if (tSnap.exists()) {
                const tData = tSnap.data();
                await setDoc(doc(db, "users", String(userId)), {
                    pendingAdminReply: {
                        docId: ticketDocId,
                        ticketId: tData?.ticketId
                    }
                }, { merge: true });
                await sendTelegramMessage(botToken, chatId, `📝 Please enter your reply for Ticket ${tData?.ticketId}:`);
            } else {
                await sendTelegramMessage(botToken, chatId, "⚠️ Ticket not found.");
            }
        } else if (data.startsWith("admin_resolve_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const ticketDocId = data.replace("admin_resolve_", "");
            const ticketRef = doc(db, "tickets", ticketDocId);
            const tSnap = await getDoc(ticketRef);
            if (tSnap.exists()) {
                const tData = tSnap.data();
                await setDoc(ticketRef, { status: "resolved" }, { merge: true });
                
                await sendTelegramMessage(botToken, chatId, `✅ Ticket ${tData.ticketId} resolved successfully.`);
                
                // Notify user
                const userChatId = tData.userId;
                const userNotifyMsg = `🎉 <b>Great news!</b>\n\n` +
                    `Your reported issue has been resolved.\n\n` +
                    `If you still face the same problem, you can reopen the conversation by contacting support again.\n\n` +
                    `Thank you for using RoyShare.`;
                try {
                    await sendTelegramMessage(botToken, Number(userChatId), userNotifyMsg, { parse_mode: "HTML" });
                } catch (err) {
                    console.error("Error notifying user of ticket resolve:", err);
                }
            } else {
                await sendTelegramMessage(botToken, chatId, "⚠️ Ticket not found.");
            }
        } else if (data.startsWith("admin_close_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const ticketDocId = data.replace("admin_close_", "");
            const ticketRef = doc(db, "tickets", ticketDocId);
            const tSnap = await getDoc(ticketRef);
            if (tSnap.exists()) {
                const tData = tSnap.data();
                await setDoc(ticketRef, { status: "closed" }, { merge: true });
                await sendTelegramMessage(botToken, chatId, `🔴 Ticket ${tData.ticketId} closed successfully.`);
                
                // Notify user
                const userChatId = tData.userId;
                const userNotifyMsg = `Your support request has been closed.\n\n` +
                    `If you need further assistance, you can create a new support ticket anytime.`;
                try {
                    await sendTelegramMessage(botToken, Number(userChatId), userNotifyMsg);
                } catch (err) {
                    console.error("Error notifying user of ticket close:", err);
                }
            } else {
                await sendTelegramMessage(botToken, chatId, "⚠️ Ticket not found.");
            }
        } else if (data === "refresh_account") {
            await processAccount(botToken, chatId, callbackQuery.from);
        } else if (data === "copy_user_id") {
            await sendTelegramMessage(botToken, chatId, `Your User ID is: ${userId}`);
        } else if (data === "refresh_balance") {
            await processBalance(botToken, chatId, callbackQuery.from);
        } else if (data === "earnings_history") {
            await processEarningsHistory(botToken, chatId, callbackQuery.from);
        } else if (data === "withdraw") {
            await processWithdraw(botToken, chatId, callbackQuery.from);
        } else if (data === "history_refresh") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await processWithdrawalHistory(botToken, chatId, callbackQuery.from, 1, callbackQuery.message.message_id);
        } else if (data.startsWith("history_page_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const page = parseInt(data.replace("history_page_", ""), 10);
            await processWithdrawalHistory(botToken, chatId, callbackQuery.from, page, callbackQuery.message.message_id);
        } else if (data.startsWith("rps_history_page_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const page = parseInt(data.replace("rps_history_page_", ""), 10) || 1;
            await processRPSGameHistory(botToken, chatId, callbackQuery.from, page, callbackQuery.message.message_id);
        } else if (data === "leaderboard_refresh") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id, text: "🔄 Leaderboard Refreshed!" })
                });
            } catch (e) {}
            await processLeaderboard(botToken, chatId, callbackQuery.from, callbackQuery.message?.message_id);
        } else if (data === "leaderboard_back_main") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await processLeaderboard(botToken, chatId, callbackQuery.from, callbackQuery.message?.message_id);
        } else if (data.startsWith("leaderboard_cat_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const category = data.replace("leaderboard_cat_", "");
            await showLeaderboardCategory(botToken, chatId, String(userId), category, callbackQuery.message?.message_id);
        } else if (data.startsWith("ann_page_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const page = parseInt(data.replace("ann_page_", ""), 10) || 1;
            await processAnnouncements(botToken, chatId, callbackQuery.from, page, callbackQuery.message.message_id);
        } else if (data.startsWith("ann_refresh_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id, text: "🔄 Announcements Refreshed!" })
                });
            } catch (e) {}
            const page = parseInt(data.replace("ann_refresh_", ""), 10) || 1;
            await processAnnouncements(botToken, chatId, callbackQuery.from, page, callbackQuery.message.message_id);
        } else if (data.startsWith("ann_details_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const parts = data.replace("ann_details_", "").split("_");
            const docId = parts[0];
            const page = parts[1] ? parseInt(parts[1], 10) : 1;
            await processAnnouncementDetails(botToken, chatId, docId, page, callbackQuery.message.message_id);
        } else if (data.startsWith("ann_list_page_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const page = parseInt(data.replace("ann_list_page_", ""), 10) || 1;
            await processAnnouncements(botToken, chatId, callbackQuery.from, page, callbackQuery.message.message_id);
        } else if (data === "bonus_claim") {
            await claimBonus(botToken, chatId, callbackQuery.from);
        } else if (data === "bonus_history") {
            await processBonusHistory(botToken, chatId, callbackQuery.from);
        } else if (data.startsWith("withdrawal_details_")) {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const withdrawalId = data.replace("withdrawal_details_", "");
            await processWithdrawalDetails(botToken, chatId, withdrawalId);
        } else if (data === "mycontent_upload") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await showUploadMenu(botToken, chatId, String(userId), callbackQuery.message?.message_id);
        } else if (data === "mycontent_search") {
            await setDoc(doc(db, "users", String(userId)), { 
                pendingSearchFile: true,
                pendingWithdrawal: null,
                pendingShortenUrl: false
            }, { merge: true });
            await sendTelegramMessage(botToken, chatId, "🔍 Enter file name to search.");
        } else if (data === "mycontent_stats") {
            await processMyContentStats(botToken, chatId, callbackQuery.from);
        } else if (data === "mycontent_back") {
            await processMyContent(botToken, chatId, callbackQuery.from, 0);
        } else if (data.startsWith("mycontent_next_")) {
            const pageIndex = parseInt(data.replace("mycontent_next_", ""), 10) || 0;
            await processMyContent(botToken, chatId, callbackQuery.from, pageIndex);
        } else if (data.startsWith("mycontent_view_")) {
            const fileId = data.replace("mycontent_view_", "");
            await processMyFileDetails(botToken, chatId, fileId);
        } else if (data.startsWith("mycontent_analytics_")) {
            const fileId = data.replace("mycontent_analytics_", "");
            await processMyFileAnalytics(botToken, chatId, fileId);
        } else if (data.startsWith("mycontent_delete_")) {
            const fileId = data.replace("mycontent_delete_", "");
            await askDeleteMyFile(botToken, chatId, fileId);
        } else if (data.startsWith("mycontent_confdel_")) {
            const fileId = data.replace("mycontent_confdel_", "");
            await confirmDeleteMyFile(botToken, chatId, callbackQuery.from, fileId);
        } else if (data.startsWith("mycontent_copy_")) {
            const fileId = data.replace("mycontent_copy_", "");
            const fileSnap = await getDoc(doc(db, "uploads", fileId));
            if (fileSnap.exists()) {
                const file = fileSnap.data();
                const link = file.publicLink || file.downloadLink || "N/A";
                await sendTelegramMessage(botToken, chatId, `📋 *Copyable Link:*\n\n\`${link}\``, { parse_mode: "Markdown" });
            } else {
                await sendTelegramMessage(botToken, chatId, "❌ Link not found.");
            }
        } else if (data.startsWith("shortlink_copy_")) {
            const linkId = data.replace("shortlink_copy_", "");
            let linkSnap = await getDoc(doc(db, "links", linkId));
            if (!linkSnap.exists()) {
                linkSnap = await getDoc(doc(db, "smart_links", linkId));
            }
            if (linkSnap.exists()) {
                const linkData = linkSnap.data();
                const link = linkData.shortUrl || "N/A";
                await sendTelegramMessage(botToken, chatId, `📋 *Copyable Link:*\n\n\`${link}\``, { parse_mode: "Markdown" });
            } else {
                await sendTelegramMessage(botToken, chatId, "❌ Link not found.");
            }
        } else if (data.startsWith("shortlink_delete_")) {
            const linkId = data.replace("shortlink_delete_", "");
            await setDoc(doc(db, "links", linkId), { status: "deleted" }, { merge: true });
            await sendTelegramMessage(botToken, chatId, "🗑 Short link has been deleted successfully.");
        } else if (data.startsWith("shortlink_analytics_")) {
            const linkId = data.replace("shortlink_analytics_", "");
            await processMyLinkAnalytics(botToken, chatId, linkId);
        } else if (data === "shortlink_menu") {
            await showShortenerDashboard(botToken, chatId, callbackQuery.from);
        } else if (data === "shortlink_mylinks") {
            await processMyLinks(botToken, chatId, callbackQuery.from);
        } else if (data === "shortlink_set_password") {
            await setDoc(doc(db, "users", String(userId)), {
                pendingShortenPassword: true,
                pendingShortenAlias: false
            }, { merge: true });
            await sendTelegramMessage(botToken, chatId, "🔒 Send the password you want to protect your short link with.\n\nType <code>/cancel</code> to go back.", { parse_mode: "HTML" });
        } else if (data === "shortlink_set_alias") {
            await setDoc(doc(db, "users", String(userId)), {
                pendingShortenAlias: true,
                pendingShortenPassword: false
            }, { merge: true });
            await sendTelegramMessage(botToken, chatId, "🏷️ Send the custom alias you want to use for your short link.\nExample: <code>mycustomlink</code>\n\n(Only lowercase letters, numbers, hyphens, and underscores are allowed. Type <code>/cancel</code> to go back.)", { parse_mode: "HTML" });
        } else if (data === "shortlink_toggle_preview") {
            const userRef = doc(db, "users", String(userId));
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const pending = userSnap.data().pendingShortLink;
                if (pending) {
                    pending.disablePreview = !pending.disablePreview;
                    await setDoc(userRef, { pendingShortLink: pending }, { merge: true });
                    // Re-render
                    await showLinkCreatorPanel(botToken, chatId, callbackQuery.from);
                }
            }
        } else if (data === "shortlink_generate") {
            await processShortenUrl(botToken, chatId, callbackQuery.from);
        } else if (data === "shortlink_cancel") {
            await setDoc(doc(db, "users", String(userId)), { pendingShortLink: null }, { merge: true });
            await showShortenerDashboard(botToken, chatId, callbackQuery.from);
        } else if (data === "shortlink_another") {
            let enabled = true;
            try {
                const sysDoc = await getDoc(doc(db, "settings", "system"));
                if (sysDoc.exists() && sysDoc.data().urlShortener) {
                    enabled = sysDoc.data().urlShortener.enabled !== false;
                }
            } catch (err) {}
            
            if (!enabled) {
                await sendTelegramMessage(botToken, chatId, "⚠️ The URL Shortener feature is currently disabled by the administrator.");
                return;
            }

            await setDoc(doc(db, "users", String(userId)), { 
                pendingShortenUrl: true,
                pendingWithdrawal: null,
                pendingSearchFile: false
            }, { merge: true });
            const message = `🔗 Enter the URL you want to shorten.

Example:

https://google.com
https://youtube.com`;
            await sendTelegramMessage(botToken, chatId, message);
        } else if (data === "dashboard_refresh") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id, text: "🔄 Dashboard Refreshed!" })
                });
            } catch (e) {}
            await processDashboard(botToken, chatId, callbackQuery.from);
        } else if (data === "dashboard_stats") {
            await processDashboardStats(botToken, chatId, callbackQuery.from, callbackQuery.id);
        } else if (data === "dashboard_activity") {
            await processDashboardActivity(botToken, chatId, callbackQuery.from, callbackQuery.id);
        } else if (data === "feature_download_analytics") {
            await processDashboardFeature(botToken, chatId, "📥 Download Analytics", callbackQuery.id);
        } else if (data === "feature_url_analytics") {
            await processDashboardFeature(botToken, chatId, "👁 URL Analytics", callbackQuery.id);
        } else if (data === "feature_earnings_reports") {
            await processDashboardFeature(botToken, chatId, "📊 Advanced Earnings Reports", callbackQuery.id);
        } else if (data === "dashboard_home") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await processDashboard(botToken, chatId, callbackQuery.from);
        } else if (data.startsWith("referral_copy_")) {
            const code = data.replace("referral_copy_", "");
            let botUsername = "Roysharearn_bot";
            try {
                const settingsDoc = await getDoc(doc(db, "settings", "telegram"));
                const bToken = decryptSecret(settingsDoc.data()?.botToken);
                if (bToken) {
                    const botMeRes = await fetch(`https://api.telegram.org/bot${bToken}/getMe`);
                    const botMeData = await botMeRes.json();
                    if (botMeData.ok && botMeData.result?.username) {
                        botUsername = botMeData.result.username;
                    }
                }
            } catch (e) {
                console.error("Error getting bot username inside copy callback:", e);
            }
            const referralLink = `https://t.me/${botUsername}?start=ref_${code}`;
            
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id, text: "📋 Referral Link Copied!" })
                });
            } catch (e) {}
            
            await sendTelegramMessage(botToken, chatId, `📋 *Copyable Referral Link:*\n\n\`${referralLink}\``, { parse_mode: "Markdown" });
        } else if (data === "referral_history") {
            await processReferralHistory(botToken, chatId, callbackQuery.from, callbackQuery.id);
        } else if (data === "referral_refresh") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id, text: "🔄 Referral stats refreshed!" })
                });
            } catch (e) {}
            await processReferAndEarn(botToken, chatId, callbackQuery.from);
        } else if (data === "referral_back") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await processReferAndEarn(botToken, chatId, callbackQuery.from);
        } else if (data === "settings_profile") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await showSettingPlaceholder(botToken, chatId, "👤 Profile Settings", callbackQuery.message.message_id);
        } else if (data === "settings_notifications") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await showSettingPlaceholder(botToken, chatId, "🔔 Notifications", callbackQuery.message.message_id);
        } else if (data === "settings_language") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await showSettingPlaceholder(botToken, chatId, "🌐 Language", callbackQuery.message.message_id);
        } else if (data === "settings_privacy") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await showSettingPlaceholder(botToken, chatId, "🔐 Privacy & Security", callbackQuery.message.message_id);
        } else if (data === "settings_statistics") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await showSettingPlaceholder(botToken, chatId, "📊 Statistics", callbackQuery.message.message_id);
        } else if (data === "settings_about") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await showSettingPlaceholder(botToken, chatId, "ℹ️ About RoyShare", callbackQuery.message.message_id);
        } else if (data === "settings_currency") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await processCurrencySettings(botToken, chatId, String(userId), callbackQuery.message.message_id);
        } else if (data === "set_currency_INR") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id, text: "Currency updated to INR!" })
                });
            } catch (e) {}
            await handleSetCurrency(botToken, chatId, String(userId), "INR", callbackQuery.message.message_id);
        } else if (data === "set_currency_USD") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id, text: "Currency updated to USD!" })
                });
            } catch (e) {}
            await handleSetCurrency(botToken, chatId, String(userId), "USD", callbackQuery.message.message_id);
        } else if (data === "settings_google_drive") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await processGoogleDriveSettings(botToken, chatId, String(userId), callbackQuery.message.message_id);
        } else if (data === "upload_type_small") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await setDoc(doc(db, "users", String(userId)), { uploadTestMode: true }, { merge: true });
            const messageText = `📤 *Send the file you want to upload.*

Supported Files:
📄 PDF
📦 APK
🎬 Video
🎵 Audio
🖼 Image
📁 ZIP/RAR
📃 Documents`;
            if (callbackQuery.message?.message_id) {
                try {
                    await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id: chatId,
                            message_id: callbackQuery.message.message_id,
                            text: messageText,
                            parse_mode: "Markdown"
                        })
                    });
                    return;
                } catch (e) {}
            }
            await sendTelegramMessage(botToken, chatId, messageText, { parse_mode: "Markdown" });
        } else if (data === "upload_type_large") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const gdocRef = doc(db, "google_drive_accounts", String(userId));
            const gsnap = await getDoc(gdocRef);
            const isConnected = gsnap.exists() && 
                                gsnap.data()?.status === "connected" && 
                                gsnap.data()?.accessToken && 
                                gsnap.data()?.refreshToken;

            if (!isConnected) {
                const appUrl = getActualAppUrl();
                const connectUrl = `${appUrl}/api/google-drive/connect?tg_id=${userId}`;
                const messageText = `⚠️ *Google Drive is not connected.*\n\nPlease connect your Google Drive first.`;
                const inlineKeyboard = {
                    inline_keyboard: [
                        [{ text: "🔗 Connect Google Drive", url: connectUrl }],
                        [{ text: "🔙 Back", callback_data: "upload_back_to_menu" }]
                    ]
                };
                if (callbackQuery.message?.message_id) {
                    try {
                        await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                chat_id: chatId,
                                message_id: callbackQuery.message.message_id,
                                text: messageText,
                                parse_mode: "Markdown",
                                reply_markup: inlineKeyboard
                            })
                        });
                        return;
                    } catch (e) {}
                }
                await sendTelegramMessage(botToken, chatId, messageText, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
            } else {
                const appUrl = getActualAppUrl();
                const uploadUrl = `${appUrl}/drive-upload?tg_id=${userId}&userId=${userId}`;
                const messageText = `☁️ *Large File Upload*\n\nMaximum Size:\n10 GB\n\nClick below to open secure uploader.`;
                const inlineKeyboard = {
                    inline_keyboard: [
                        [{ text: "🚀 Open Upload Page", web_app: { url: uploadUrl } }],
                        [{ text: "🔙 Back", callback_data: "upload_back_to_menu" }]
                    ]
                };
                if (callbackQuery.message?.message_id) {
                    try {
                        await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                chat_id: chatId,
                                message_id: callbackQuery.message.message_id,
                                text: messageText,
                                parse_mode: "Markdown",
                                reply_markup: inlineKeyboard
                            })
                        });
                        return;
                    } catch (e) {}
                }
                await sendTelegramMessage(botToken, chatId, messageText, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
            }
        } else if (data === "upload_back") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            const db = getDb();
            await setDoc(doc(db, "users", String(userId)), { uploadTestMode: false }, { merge: true });
            if (callbackQuery.message?.message_id) {
                try {
                    await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id: chatId,
                            message_id: callbackQuery.message.message_id,
                            text: "❌ *Upload cancelled.*",
                            parse_mode: "Markdown"
                        })
                    });
                } catch (e) {}
            }
        } else if (data === "upload_back_to_menu") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await showUploadMenu(botToken, chatId, String(userId), callbackQuery.message?.message_id);
        } else if (data === "disconnect_google_drive") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id, text: "Google Drive disconnected!" })
                });
            } catch (e) {}
            await handleGoogleDriveDisconnect(botToken, chatId, String(userId), callbackQuery.message.message_id);
        } else if (data === "settings_back") {
            try {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            } catch (e) {}
            await processSettingsMenu(botToken, chatId, callbackQuery.from, callbackQuery.message.message_id);
        }
    } catch (e: any) {
        console.error("🔴 Error in processCallback:", e.message);
        console.error(e.stack);
    }
    } catch (e: any) {
        console.error("🔴 Critical Outer Error in processCallback:", e.message);
        console.error(e.stack);
    }
}

async function processSettingsMenu(botToken: string, chatId: number, user: any, messageIdToEdit?: number) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, "users", String(user.id)));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";
    const currentCurrencyLabel = currency === "USD" ? "💲 USD (US Dollar)" : "₹ INR (Indian Rupee)";
    
    const message = `⚙️ *RoyShare Settings*
    
Select a setting option below to customize your experience.`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "👤 Profile Settings", callback_data: "settings_profile" }],
            [{ text: "🔔 Notifications", callback_data: "settings_notifications" }],
            [{ text: "💱 Currency Settings", callback_data: "settings_currency" }],
            [{ text: "🌐 Language", callback_data: "settings_language" }],
            [{ text: "🔐 Privacy & Security", callback_data: "settings_privacy" }],
            [{ text: "📊 Statistics", callback_data: "settings_statistics" }],
            [{ text: "ℹ️ About RoyShare", callback_data: "settings_about" }],
            [{ text: "🔗 Connect Google Drive", callback_data: "settings_google_drive" }]
        ]
    };

    if (messageIdToEdit) {
        await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
    } else {
        await sendTelegramMessage(botToken, chatId, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
    }
}

async function processCurrencySettings(botToken: string, chatId: number, userId: string, messageIdToEdit: number) {
    const db = getDb();
    const userDoc = await getDoc(doc(db, "users", userId));
    const currency = userDoc.exists() ? (userDoc.data()?.currency || "INR") : "INR";
    const currentCurrencyLabel = currency === "USD" ? "💲 USD (US Dollar)" : "₹ INR (Indian Rupee)";

    const message = `💱 *Currency Settings*

Current Currency:
${currentCurrencyLabel}

Select your preferred currency.`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "₹ INR (Indian Rupee)", callback_data: "set_currency_INR" }],
            [{ text: "💲 USD (US Dollar)", callback_data: "set_currency_USD" }],
            [{ text: "🔙 Back", callback_data: "settings_back" }]
        ]
    };

    await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
}

async function handleSetCurrency(botToken: string, chatId: number, userId: string, selectedCurrency: string, messageIdToEdit: number) {
    const db = getDb();
    await setDoc(doc(db, "users", userId), { currency: selectedCurrency }, { merge: true });

    const currentCurrencyLabel = selectedCurrency === "USD" ? "💲 USD (US Dollar)" : "₹ INR (Indian Rupee)";

    const message = `✅ *Currency Updated Successfully*

Current Currency:
${currentCurrencyLabel}`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🔙 Back to Settings", callback_data: "settings_back" }]
        ]
    };

    await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
}

async function showSettingPlaceholder(botToken: string, chatId: number, title: string, messageIdToEdit: number) {
    const message = `*${title}*
    
This feature is currently under maintenance and will be implemented soon.`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🔙 Back", callback_data: "settings_back" }]
        ]
    };

    await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
}

function getActualAppUrl(): string {
    return getMiniAppUrl("");
}

async function showUploadMenu(botToken: string, chatId: number, userId: string, messageIdToEdit?: number) {
    const db = getDb();
    await setDoc(doc(db, "users", String(userId)), { uploadTestMode: false }, { merge: true });

    const message = `📤 *Choose Upload Type*

🟢 *Small File (Telegram Storage)*
• Up to 20 MB
• Fast upload

🔵 *Large File (Google Drive)*
• No size limit
• Stored in connected Google Drive`;

    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: "🟢 Small File", callback_data: "upload_type_small" },
                { text: "🔵 Large File", callback_data: "upload_type_large" }
            ],
            [
                { text: "🔙 Back", callback_data: "upload_back" }
            ]
        ]
    };

    if (messageIdToEdit) {
        try {
            await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageIdToEdit,
                    text: message,
                    parse_mode: "Markdown",
                    reply_markup: inlineKeyboard
                })
            });
            return;
        } catch (e) {
            console.error("Failed to edit message for upload menu:", e);
        }
    }

    await sendTelegramMessage(botToken, chatId, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
}

async function processGoogleDriveSettings(botToken: string, chatId: number, userId: string, messageIdToEdit?: number) {
    const db = getDb();
    const docRef = doc(db, "google_drive_accounts", userId);
    const snap = await getDoc(docRef);

    let message = "";
    const inlineKeyboard: any = { inline_keyboard: [] };

    if (snap.exists() && snap.data()?.status === "connected") {
        const data = snap.data();
        message = `🟢 *Google Drive Connected Successfully*

*Email:*
${data.email || "N/A"}

Your Google Drive is now connected with RoyShare.`;

        inlineKeyboard.inline_keyboard.push([
            { text: "❌ Disconnect Google Drive", callback_data: "disconnect_google_drive" }
        ]);
    } else {
        const appUrl = getActualAppUrl();
        const connectUrl = `${appUrl}/api/google-drive/connect?tg_id=${userId}`;

        message = `🔗 *Connect Google Drive*

Connect your Google Drive with RoyShare to enable direct access.

Click the button below to authenticate.`;

        inlineKeyboard.inline_keyboard.push([
            { text: "🔗 Connect Google Drive", url: connectUrl }
        ]);
    }

    inlineKeyboard.inline_keyboard.push([
        { text: "🔙 Back to Settings", callback_data: "settings_back" }
    ]);

    if (messageIdToEdit) {
        await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
    } else {
        await sendTelegramMessage(botToken, chatId, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
    }
}

async function handleGoogleDriveDisconnect(botToken: string, chatId: number, userId: string, messageIdToEdit: number) {
    const db = getDb();
    const docRef = doc(db, "google_drive_accounts", userId);
    
    await setDoc(docRef, {
        accessToken: "",
        refreshToken: "",
        status: "disconnected"
    }, { merge: true });

    const message = `✅ *Google Drive Disconnected*

Your Google Drive account has been successfully disconnected.`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "🔙 Back to Settings", callback_data: "settings_back" }]
        ]
    };

    await editTelegramMessage(botToken, chatId, messageIdToEdit, message, { parse_mode: "Markdown", reply_markup: inlineKeyboard });
}

async function normalizeUsername(username: string): Promise<string> {
    console.log("Raw username value:", username);
    // Remove https://t.me/
    let normalized = username.replace(/https?:\/\/(t\.me\/|telegram\.me\/)/i, '');
    // Remove leading @
    normalized = normalized.replace(/^@/, '');
    // If it's still a URL, just take the last part
    if (normalized.includes('/')) {
        const parts = normalized.split('/');
        normalized = parts[parts.length - 1];
    }
    
    // Validate: Should be alphanumeric/underscores, Telegram usernames are usually 5-32 chars
    // But channels can also be public channels using names which might look different.
    // Basic check: if it's empty, it's invalid
    if (!normalized || normalized.trim() === '') {
        throw new Error("INVALID_USERNAME");
    }
    
    console.log("Normalized username value:", normalized);
    return "@" + normalized;
}

async function checkMember(botToken: string, chatLink: string, userId: number): Promise<boolean> {
    try {
        console.log("checkMember called. chatLink:", chatLink);
        const chatId = await normalizeUsername(chatLink);
        console.log("Normalized chatID (username):", chatId);
        
        // 1. Verify chat exists
        console.log(`Calling getChat with chat_id=${chatId}`);
        const chatResponse = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`);
        const chatData = await chatResponse.json();
        console.log("getChat result:", JSON.stringify(chatData));

        if (!chatData.ok) {
            console.error("Chat resolution failed for", chatId, ":", chatData.description);
            throw new Error(`CHAT_NOT_FOUND: ${chatData.description}`);
        }

        // 2. Check membership
        console.log(`Calling getChatMember with chat_id=${chatId} and user_id=${userId}`);
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${chatId}&user_id=${userId}`);
        const data = await response.json();
        console.log("getChatMember result:", JSON.stringify(data));                
        
        if (data.ok && data.result) {
            const status = data.result.status;
            return status === 'member' || status === 'administrator' || status === 'creator';
        }
        return false;
    } catch (e: any) {
        // If it's a known error regarding valid username formats, rethrow or handle specifically
        if (e.message === "INVALID_USERNAME" || e.message.startsWith("CHAT_NOT_FOUND")) {
            throw new Error("INVALID_USERNAME");
        }
        console.error("Error checking member:", e);
        return false;
    }
}

async function sendTelegramMessage(botToken: string, chatId: number, text: string, extra?: any): Promise<number | null> {
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text, ...extra })
        });
        const data = await response.json();
        if (data.ok && data.result) {
            return data.result.message_id;
        }
    } catch (e) {
        console.error("Error in sendTelegramMessage:", e);
    }
    return null;
}
