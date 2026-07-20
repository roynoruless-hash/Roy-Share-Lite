import express from "express";
import { getDb } from "../lib/firebase";
import { doc, getDoc, runTransaction, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, increment } from "firebase/firestore";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

const router = express.Router();
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests" }
});

router.use(apiLimiter);

// AES encryption details for user IDs
function encryptId(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from("12345678901234567890123456789012"), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptId(text: any) {
  if (!text || typeof text !== "string") return "";
  try {
    const textParts = text.split(":");
    if (textParts.length < 2) return text;
    const iv = Buffer.from(textParts.shift() as string, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from("12345678901234567890123456789012"), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch(e) {
    return text;
  }
}

function getPublicCode(telegramId: string) {
  const hash = crypto.createHash("sha256").update(String(telegramId)).digest("hex");
  return "RS" + hash.substring(0, 5).toUpperCase();
}

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

function checkWinner(board: string[]): "X" | "O" | "draw" | null {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as "X" | "O";
    }
  }
  if (board.every(cell => cell !== "")) return "draw";
  return null;
}

// 1. Join matchmaking queue
router.post("/join", async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ success: false, message: "Missing telegramId" });

    const db = getDb();
    const settingsSnap = await getDoc(doc(db, "settings", "ttt"));
    const settings = settingsSnap.exists() ? settingsSnap.data() : { enabled: true, entryFee: 5 };

    if (!settings || settings.enabled === false) {
      return res.status(400).json({ success: false, message: "Tic Tac Toe Battle is currently disabled." });
    }

    const entryFee = settings.entryFee || 5;
    let newBalance = 0;

    await runTransaction(db, async (t) => {
      const queueRef = doc(db, "ttt_queue", String(telegramId));
      const queueSnap = await t.get(queueRef);
      if (queueSnap.exists()) {
        throw new Error("You are already in matchmaking queue or match.");
      }

      const userRef = doc(db, "users", String(telegramId));
      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      const userData = userSnap.data();

      const totalBalance = (userData.balance || 0) + (userData.rewardBalance || 0);
      if (totalBalance < entryFee) {
        throw new Error("Insufficient Balance");
      }

      let deductFromReward = 0;
      let deductFromMain = 0;
      if (userData.rewardBalance >= entryFee) {
        deductFromReward = entryFee;
      } else {
        deductFromReward = userData.rewardBalance || 0;
        deductFromMain = entryFee - deductFromReward;
      }

      t.update(userRef, {
        rewardBalance: Math.max(0, (userData.rewardBalance || 0) - deductFromReward),
        balance: Math.max(0, (userData.balance || 0) - deductFromMain)
      });
      newBalance = totalBalance - entryFee;

      t.set(queueRef, {
        telegramId: String(telegramId),
        publicCode: getPublicCode(telegramId),
        joinedAt: serverTimestamp(),
        status: "searching",
        matchId: null,
        paidFromReward: deductFromReward,
        paidFromMain: deductFromMain
      });

      const txRef = doc(collection(db, "transactions"));
      t.set(txRef, {
        userId: String(telegramId),
        amount: entryFee,
        type: "debit",
        description: "Tic Tac Toe Battle Entry Fee",
        timestamp: serverTimestamp(),
        status: "completed"
      });
    });

    res.json({ success: true, newBalance, publicCode: getPublicCode(telegramId) });
  } catch (error: any) {
    console.error("[TTT SERVER] Error in /join:", error);
    const friendlyMessages = ["You are already in matchmaking queue or match.", "User not found", "Insufficient Balance", "Tic Tac Toe Battle is currently disabled."];
    const isFriendly = friendlyMessages.includes(error.message);
    res.status(400).json({ success: false, message: isFriendly ? error.message : "Failed to join queue. Please try again." });
  }
});

// 2. Queue matchmaking poller / queue processor
router.post("/matchmake", async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ success: false, message: "Missing telegramId" });

    const db = getDb();
    const myQueueRef = doc(db, "ttt_queue", String(telegramId));
    const myQueueSnap = await getDoc(myQueueRef);
    if (!myQueueSnap.exists()) return res.json({ success: false, status: "not_in_queue" });

    const myQueue = myQueueSnap.data();
    if (myQueue.status === "matched" && myQueue.matchId) {
      return res.json({ success: true, status: "matched", matchId: myQueue.matchId });
    }

    const queueQuery = query(collection(db, "ttt_queue"), where("status", "==", "searching"));
    const queueSnaps = await getDocs(queueQuery);

    let opponent = null;
    for (const docSnap of queueSnaps.docs) {
      if (docSnap.id !== String(telegramId)) {
        opponent = { id: docSnap.id, ...docSnap.data() };
        break;
      }
    }

    const settingsSnap = await getDoc(doc(db, "settings", "ttt"));
    const settings = settingsSnap.exists() ? settingsSnap.data() : { 
      enabled: true, 
      aiEnabled: true, 
      aiDifficulty: "Impossible", 
      entryFee: 5, 
      prizePool: 20, 
      moveTimer: 10, 
      matchTimeout: 15,
      disconnectPolicy: "autolose",
      disconnectTimeout: 30,
      drawPolicy: "refund",
      rewardAdsEnabled: true,
      rewardAdsMode: "mode2"
    };

    if (opponent) {
      let matchId = null;
      await runTransaction(db, async (t) => {
        const tOpponentSnap = await t.get(doc(db, "ttt_queue", opponent.id));
        const tMySnap = await t.get(myQueueRef);

        if (tOpponentSnap.data()?.status === "searching" && tMySnap.data()?.status === "searching") {
          const matchRef = doc(collection(db, "ttt_matches"));
          matchId = matchRef.id;

          const goesFirst = Math.random() < 0.5 ? "player1" : "player2";
          const startingTurnId = goesFirst === "player1" ? String(telegramId) : opponent.telegramId;

          t.set(matchRef, {
            id: matchId,
            status: "active",
            prizePool: settings.prizePool || 20,
            entryFee: settings.entryFee || 5,
            moveTimer: settings.moveTimer || 10,
            board: ["", "", "", "", "", "", "", "", ""],
            turn: startingTurnId,
            moveCount: 0,
            player1: { encTelegramId: encryptId(String(telegramId)), publicCode: myQueue.publicCode, symbol: "X", ready: false, isAI: false, disconnected: false, disconnectedAt: null },
            player2: { encTelegramId: encryptId(opponent.telegramId), publicCode: opponent.publicCode, symbol: "O", ready: false, isAI: false, disconnected: false, disconnectedAt: null },
            lastMoveAt: Date.now(),
            createdAt: serverTimestamp(),
            resultProcessed: false
          });

          t.update(myQueueRef, { status: "matched", matchId });
          t.update(doc(db, "ttt_queue", opponent.id), { status: "matched", matchId });
        }
      });

      if (matchId) {
        return res.json({ success: true, status: "matched", matchId });
      }
    }

    const joinedAt = myQueue.joinedAt?.toDate() || new Date();
    const waitTime = (Date.now() - joinedAt.getTime()) / 1000;

    if (settings.aiEnabled && waitTime > (settings.matchTimeout || 15)) {
      let matchId = null;
      await runTransaction(db, async (t) => {
        const tMySnap = await t.get(myQueueRef);
        if (tMySnap.data()?.status === "searching") {
          const matchRef = doc(collection(db, "ttt_matches"));
          matchId = matchRef.id;

          const aiId = "AI_" + Date.now();
          const names = ["Shadow", "Titan", "Nova", "Ghost", "Hunter", "Inferno", "Alpha", "Rogue"];
          const aiName = names[Math.floor(Math.random() * names.length)];
          const aiCode = "RS-" + Math.floor(Math.random() * 900 + 100);

          const goesFirst = Math.random() < 0.5 ? "player1" : "player2";
          let board = ["", "", "", "", "", "", "", "", ""];
          let moveCount = 0;
          let startingTurnId = goesFirst === "player1" ? String(telegramId) : aiId;

          // If AI goes first, let it choose immediately!
          if (goesFirst === "player2") {
            const aiDifficulty = settings.aiDifficulty || "Impossible";
            const chosenMove = computeAIMove(board, aiDifficulty);
            board[chosenMove] = "O";
            moveCount = 1;
            startingTurnId = String(telegramId); // Now user's turn
          }

          t.set(matchRef, {
            id: matchId,
            status: "active",
            prizePool: settings.prizePool || 20,
            entryFee: settings.entryFee || 5,
            moveTimer: settings.moveTimer || 10,
            board: board,
            turn: startingTurnId,
            moveCount: moveCount,
            player1: { encTelegramId: encryptId(String(telegramId)), publicCode: myQueue.publicCode, symbol: "X", ready: false, isAI: false, disconnected: false, disconnectedAt: null },
            player2: { encTelegramId: encryptId(aiId), publicCode: aiCode, symbol: "O", ready: true, isAI: true, disconnected: false, disconnectedAt: null, aiDifficulty: settings.aiDifficulty || "Impossible", aiName: aiName },
            lastMoveAt: Date.now(),
            createdAt: serverTimestamp(),
            resultProcessed: false
          });

          t.update(myQueueRef, { status: "matched", matchId });
        }
      });

      if (matchId) {
        return res.json({ success: true, status: "matched", matchId });
      }
    }

    return res.json({ success: true, status: "searching" });
  } catch (error: any) {
    console.error("[TTT SERVER] Matchmaking Error:", error);
    res.status(400).json({ success: false, message: "An error occurred during matchmaking." });
  }
});

// 3. Cancel matchmaking queue
router.post("/cancel-queue", async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ success: false, message: "Missing telegramId" });

    const db = getDb();
    let refunded = false;

    await runTransaction(db, async (t) => {
      const qRef = doc(db, "ttt_queue", String(telegramId));
      const qSnap = await t.get(qRef);
      if (!qSnap.exists()) return;

      const queueData = qSnap.data();
      if (queueData.status === "searching") {
        const userRef = doc(db, "users", String(telegramId));
        const userSnap = await t.get(userRef);
        if (userSnap.exists()) {
          const paidFromReward = queueData.paidFromReward || 0;
          const paidFromMain = queueData.paidFromMain || 0;
          const totalRefund = paidFromReward + paidFromMain;

          t.update(userRef, {
            balance: (userSnap.data().balance || 0) + paidFromMain,
            rewardBalance: (userSnap.data().rewardBalance || 0) + paidFromReward
          });

          if (totalRefund > 0) {
            t.set(doc(collection(db, "transactions")), {
              userId: String(telegramId),
              amount: totalRefund,
              type: "credit",
              description: "Tic Tac Toe Queue Refund",
              timestamp: serverTimestamp(),
              status: "completed"
            });
          }
          refunded = true;
        }
        t.delete(qRef);
      }
    });

    res.json({ success: true, refunded });
  } catch (error: any) {
    console.error("[TTT SERVER] Cancel Queue Error:", error);
    res.status(400).json({ success: false, message: "Failed to cancel matchmaking." });
  }
});

// 4. Submit a move
router.post("/submit-move", async (req, res) => {
  try {
    const { telegramId, matchId, cellIndex, adCompleted } = req.body;
    if (!telegramId || !matchId || cellIndex === undefined) return res.status(400).json({ success: false, message: "Missing parameter" });

    const cell = Number(cellIndex);
    if (cell < 0 || cell > 8) return res.status(400).json({ success: false, message: "Invalid cell index" });

    const db = getDb();
    let matchEnded = false;
    let finalWinner = null;
    let finalWinType = null;

    await runTransaction(db, async (t) => {
      const matchRef = doc(db, "ttt_matches", matchId);
      const matchSnap = await t.get(matchRef);
      if (!matchSnap.exists()) throw new Error("Match not found");

      const match = matchSnap.data();
      if (match.status !== "active") throw new Error("Match is not active");

      const p1Id = decryptId(match.player1.encTelegramId);
      const p2Id = decryptId(match.player2.encTelegramId);

      const isPlayer1 = p1Id === String(telegramId);
      const isPlayer2 = p2Id === String(telegramId);

      if (!isPlayer1 && !isPlayer2) throw new Error("Unauthorized move submission");
      if (match.turn !== String(telegramId)) throw new Error("Not your turn");

      const symbol = isPlayer1 ? "X" : "O";
      if (match.board[cell] !== "") throw new Error("Cell already filled");

      const nextBoard = [...match.board];
      nextBoard[cell] = symbol;
      let nextMoveCount = match.moveCount + 1;
      let nextTurn = isPlayer1 ? p2Id : p1Id;

      let winnerSymbol = checkWinner(nextBoard);

      if (winnerSymbol) {
        matchEnded = true;
        finalWinner = winnerSymbol === "X" ? "player1" : "player2";
        finalWinType = winnerSymbol === "draw" ? "draw" : "win";
      } else if (match.player2.isAI) {
        // Run AI Turn immediately in the same step
        const aiDifficulty = match.player2.aiDifficulty || "Impossible";
        const aiMove = computeAIMove(nextBoard, aiDifficulty);
        if (aiMove !== -1) {
          nextBoard[aiMove] = "O";
          nextMoveCount += 1;
          nextTurn = p1Id; // turn back to user

          const postAIMWinnerSymbol = checkWinner(nextBoard);
          if (postAIMWinnerSymbol) {
            matchEnded = true;
            finalWinner = postAIMWinnerSymbol === "X" ? "player1" : "player2";
            finalWinType = postAIMWinnerSymbol === "draw" ? "draw" : "win";
          }
        }
      }

      const updateData: any = {
        board: nextBoard,
        moveCount: nextMoveCount,
        turn: nextTurn,
        lastMoveAt: Date.now()
      };

      if (adCompleted) {
        updateData.player1AdCompleted = true;
      }

      if (matchEnded) {
        updateData.status = "completed";
        updateData.winnerId = finalWinType === "draw" ? "draw" : (finalWinner === "player1" ? p1Id : p2Id);
        updateData.winType = finalWinType;
        updateData.completedAt = serverTimestamp();
      }

      t.update(matchRef, updateData);
    });

    if (matchEnded) {
      await resolveTTTMatchInternal(matchId);
    }

    res.json({ success: true, ended: matchEnded });
  } catch (error: any) {
    console.error("[TTT SERVER] submit-move error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to submit move" });
  }
});

// 5. Recover or Force Resolve / Move Timeout Handling
router.post("/recover", async (req, res) => {
  try {
    const { matchId } = req.body;
    if (!matchId) return res.status(400).json({ success: false, message: "Missing matchId" });

    const db = getDb();
    const matchRef = doc(db, "ttt_matches", matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) {
      return res.json({ success: false, status: "CANCELLED" });
    }

    const match = matchSnap.data();
    if (match.status === "completed") {
      return res.json({ success: true, status: "COMPLETED" });
    }

    // Check move timeout
    const settingsSnap = await getDoc(doc(db, "settings", "ttt"));
    const settings = settingsSnap.exists() ? settingsSnap.data() : { moveTimer: 10 };

    const elapsed = (Date.now() - match.lastMoveAt) / 1000;
    if (match.status === "active" && elapsed > (settings.moveTimer || 10)) {
      // Move timeout happened!
      const activePlayerId = match.turn;
      const p1Id = decryptId(match.player1.encTelegramId);
      const p2Id = decryptId(match.player2.encTelegramId);

      const isP1Turn = activePlayerId === p1Id;
      const timeoutPolicy = settings.timeoutPolicy || "autolose"; // autolose | randomCell

      let matchEnded = false;
      let finalWinnerId = null;
      let finalWinType = "timeout";

      await runTransaction(db, async (t) => {
        const tMatchSnap = await t.get(matchRef);
        if (!tMatchSnap.exists() || tMatchSnap.data()?.status !== "active") return;

        if (timeoutPolicy === "randomCell") {
          // Select a random empty cell
          const board = [...match.board];
          const emptyIndices: number[] = [];
          for (let i = 0; i < 9; i++) {
            if (board[i] === "") emptyIndices.push(i);
          }

          if (emptyIndices.length > 0) {
            const cell = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            const symbol = isP1Turn ? "X" : "O";
            board[cell] = symbol;
            let nextMoveCount = match.moveCount + 1;
            let nextTurn = isP1Turn ? p2Id : p1Id;

            let winnerSymbol = checkWinner(board);

            if (winnerSymbol) {
              matchEnded = true;
              finalWinnerId = winnerSymbol === "draw" ? "draw" : (winnerSymbol === "X" ? p1Id : p2Id);
              finalWinType = winnerSymbol === "draw" ? "draw" : "win";
            } else if (match.player2.isAI) {
              const aiDifficulty = match.player2.aiDifficulty || "Impossible";
              const aiMove = computeAIMove(board, aiDifficulty);
              if (aiMove !== -1) {
                board[aiMove] = "O";
                nextMoveCount += 1;
                nextTurn = p1Id;

                const postAIMWinnerSymbol = checkWinner(board);
                if (postAIMWinnerSymbol) {
                  matchEnded = true;
                  finalWinnerId = postAIMWinnerSymbol === "draw" ? "draw" : (postAIMWinnerSymbol === "X" ? p1Id : p2Id);
                  finalWinType = postAIMWinnerSymbol === "draw" ? "draw" : "win";
                }
              }
            }

            const updateData: any = {
              board,
              moveCount: nextMoveCount,
              turn: nextTurn,
              lastMoveAt: Date.now()
            };

            if (matchEnded) {
              updateData.status = "completed";
              updateData.winnerId = finalWinnerId;
              updateData.winType = finalWinType;
              updateData.completedAt = serverTimestamp();
            }

            t.update(matchRef, updateData);
          } else {
            // No empty cells, draw
            t.update(matchRef, {
              status: "completed",
              winnerId: "draw",
              winType: "draw",
              completedAt: serverTimestamp()
            });
            matchEnded = true;
          }
        } else {
          // Auto Lose
          const loserId = activePlayerId;
          const winnerId = isP1Turn ? p2Id : p1Id;

          t.update(matchRef, {
            status: "completed",
            winnerId,
            winType: "timeout",
            completedAt: serverTimestamp()
          });
          matchEnded = true;
        }
      });

      if (matchEnded || timeoutPolicy !== "randomCell") {
        await resolveTTTMatchInternal(matchId);
        return res.json({ success: true, status: "COMPLETED" });
      }
    }

    res.json({ success: true, status: match.status.toUpperCase() });
  } catch (error: any) {
    console.error("[TTT SERVER] Force recovery failed:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 6. Handle Disconnect state updates
router.post("/handle-disconnect", async (req, res) => {
  try {
    const { telegramId, matchId, disconnected } = req.body;
    if (!telegramId || !matchId) return res.status(400).json({ success: false, message: "Missing parameter" });

    const db = getDb();
    await runTransaction(db, async (t) => {
      const matchRef = doc(db, "ttt_matches", matchId);
      const matchSnap = await t.get(matchRef);
      if (!matchSnap.exists()) return;

      const match = matchSnap.data();
      const p1Id = decryptId(match.player1.encTelegramId);
      const p2Id = decryptId(match.player2.encTelegramId);

      const updateData: any = {};
      if (p1Id === String(telegramId)) {
        updateData["player1.disconnected"] = !!disconnected;
        updateData["player1.disconnectedAt"] = disconnected ? Date.now() : null;
      } else if (p2Id === String(telegramId)) {
        updateData["player2.disconnected"] = !!disconnected;
        updateData["player2.disconnectedAt"] = disconnected ? Date.now() : null;
      }

      t.update(matchRef, updateData);
    });

    res.json({ success: true });
  } catch (e: any) {
    console.error("[TTT SERVER] Disconnect handle error:", e);
    res.status(500).json({ success: false });
  }
});

// 7. Handle Disconnect Timeout expiration
router.post("/handle-disconnect-timeout", async (req, res) => {
  try {
    const { matchId } = req.body;
    if (!matchId) return res.status(400).json({ success: false, message: "Missing matchId" });

    const db = getDb();
    const settingsSnap = await getDoc(doc(db, "settings", "ttt"));
    const settings = settingsSnap.exists() ? settingsSnap.data() : { disconnectPolicy: "autolose" };

    const matchRef = doc(db, "ttt_matches", matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists() || matchSnap.data().status !== "active") {
      return res.json({ success: false, message: "Match not active or not found" });
    }

    const match = matchSnap.data();
    const p1Id = decryptId(match.player1.encTelegramId);
    const p2Id = decryptId(match.player2.encTelegramId);

    const p1Disconnected = match.player1.disconnected;
    const p2Disconnected = match.player2.disconnected;

    if (!p1Disconnected && !p2Disconnected) {
      return res.json({ success: false, message: "No player is disconnected" });
    }

    const policy = settings.disconnectPolicy || "autolose"; // autolose | aitakeover | refund
    let matchEnded = false;

    await runTransaction(db, async (t) => {
      if (policy === "refund") {
        // Cancel match and refund
        t.update(matchRef, {
          status: "cancelled",
          completedAt: serverTimestamp()
        });

        const entryFee = match.entryFee || 5;
        if (!match.player1.isAI) {
          const u1Ref = doc(db, "users", p1Id);
          t.update(u1Ref, { balance: increment(entryFee) });
          t.set(doc(collection(db, "transactions")), {
            userId: p1Id,
            amount: entryFee,
            type: "credit",
            description: "Tic Tac Toe Disconnect Refund",
            timestamp: serverTimestamp(),
            status: "completed"
          });
        }
        if (!match.player2.isAI) {
          const u2Ref = doc(db, "users", p2Id);
          t.update(u2Ref, { balance: increment(entryFee) });
          t.set(doc(collection(db, "transactions")), {
            userId: p2Id,
            amount: entryFee,
            type: "credit",
            description: "Tic Tac Toe Disconnect Refund",
            timestamp: serverTimestamp(),
            status: "completed"
          });
        }
      } else if (policy === "aitakeover") {
        // Replace disconnected player with AI
        const updateData: any = {};
        if (p1Disconnected && !match.player1.isAI) {
          updateData["player1.isAI"] = true;
          updateData["player1.disconnected"] = false;
          updateData["player1.disconnectedAt"] = null;
        }
        if (p2Disconnected && !match.player2.isAI) {
          updateData["player2.isAI"] = true;
          updateData["player2.disconnected"] = false;
          updateData["player2.disconnectedAt"] = null;
          updateData["player2.aiDifficulty"] = settings.aiDifficulty || "Impossible";
          updateData["player2.aiName"] = "Substitute Bot";
        }

        // If turn was on disconnected player, let AI play immediately
        const activeTurnId = match.turn;
        if ((activeTurnId === p1Id && p1Disconnected) || (activeTurnId === p2Id && p2Disconnected)) {
          const board = [...match.board];
          const activeSymbol = activeTurnId === p1Id ? "X" : "O";
          const difficulty = settings.aiDifficulty || "Impossible";
          const aiMove = computeAIMove(board, difficulty);

          if (aiMove !== -1) {
            board[aiMove] = activeSymbol;
            updateData.board = board;
            updateData.moveCount = match.moveCount + 1;
            updateData.turn = activeTurnId === p1Id ? p2Id : p1Id;
            updateData.lastMoveAt = Date.now();

            const winSymbol = checkWinner(board);
            if (winSymbol) {
              matchEnded = true;
              updateData.status = "completed";
              updateData.winnerId = winSymbol === "draw" ? "draw" : (winSymbol === "X" ? p1Id : p2Id);
              updateData.winType = winSymbol === "draw" ? "draw" : "win";
              updateData.completedAt = serverTimestamp();
            }
          }
        }

        t.update(matchRef, updateData);
      } else {
        // Auto Lose
        const loserId = p1Disconnected ? p1Id : p2Id;
        const winnerId = p1Disconnected ? p2Id : p1Id;

        t.update(matchRef, {
          status: "completed",
          winnerId,
          winType: "disconnect",
          completedAt: serverTimestamp()
        });
        matchEnded = true;
      }
    });

    if (matchEnded || policy === "autolose") {
      await resolveTTTMatchInternal(matchId);
    }

    res.json({ success: true, policyApplied: policy });
  } catch (error: any) {
    console.error("[TTT SERVER] Disconnect expiration error:", error);
    res.status(500).json({ success: false });
  }
});

// 8. Reward claiming router for Ad Mode 2 and Ad Mode 3
router.post("/claim-prize", async (req, res) => {
  try {
    const { telegramId, matchId, adCompleted } = req.body;
    if (!telegramId || !matchId) return res.status(400).json({ success: false, message: "Missing matchId or telegramId" });

    const db = getDb();
    const matchRef = doc(db, "ttt_matches", matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) return res.status(404).json({ success: false, message: "Match not found" });

    const match = matchSnap.data();
    if (match.status !== "completed") return res.status(400).json({ success: false, message: "Match is not completed yet" });
    if (match.resultProcessed) return res.status(400).json({ success: false, message: "Prize already claimed" });

    const p1Id = decryptId(match.player1.encTelegramId);
    const p2Id = decryptId(match.player2.encTelegramId);
    const isWinner = match.winnerId === String(telegramId);

    if (!isWinner) return res.status(403).json({ success: false, message: "Only the winner can claim the prize pool." });

    const settingsSnap = await getDoc(doc(db, "settings", "ttt"));
    const settings = settingsSnap.exists() ? settingsSnap.data() : { rewardAdsEnabled: true };

    if (settings.rewardAdsEnabled && !adCompleted) {
      return res.status(400).json({ success: false, message: "Watching the ad is required to claim your prize." });
    }

    // Process prize payout now!
    const result = await finalizePayout(matchId, String(telegramId), adCompleted);
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: result.message || "Failed to claim prize." });
    }
  } catch (error: any) {
    console.error("[TTT SERVER] claim-prize error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper: resolve match internally and pay out immediately or postpone for claim depending on Reward Ad Mode
async function resolveTTTMatchInternal(matchId: string): Promise<{ success: boolean; message?: string }> {
  const db = getDb();
  try {
    const matchRef = doc(db, "ttt_matches", matchId);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) throw new Error("Match not found");
    const match = matchSnap.data();

    const settingsSnap = await getDoc(doc(db, "settings", "ttt"));
    const settings = settingsSnap.exists() ? settingsSnap.data() : { rewardAdsEnabled: true, rewardAdsMode: "mode2" };

    const adEnabled = settings.rewardAdsEnabled !== false;
    const adMode = settings.rewardAdsMode || "mode2";

    // Draw policy check
    if (match.winnerId === "draw") {
      const drawPolicy = settings.drawPolicy || "refund";
      await runTransaction(db, async (t) => {
        console.log(`[TTT SERVER] resolveTTTMatchInternal (DRAW) - TX START for matchId: ${matchId}`);
        const startTime = Date.now();
        const p1Id = decryptId(match.player1.encTelegramId);
        const p2Id = decryptId(match.player2.encTelegramId);

        // READS
        let u1Data: any = {};
        if (!match.player1.isAI) {
          console.log(`[TTT SERVER] resolveTTTMatchInternal (DRAW) - READ p1 uRef (${p1Id})`);
          const u1Snap = await t.get(doc(db, "users", p1Id));
          u1Data = u1Snap.exists() ? u1Snap.data() : {};
        }

        let u2Data: any = {};
        if (!match.player2.isAI) {
          console.log(`[TTT SERVER] resolveTTTMatchInternal (DRAW) - READ p2 uRef (${p2Id})`);
          const u2Snap = await t.get(doc(db, "users", p2Id));
          u2Data = u2Snap.exists() ? u2Snap.data() : {};
        }

        console.log(`[TTT SERVER] resolveTTTMatchInternal (DRAW) - ALL READS COMPLETED. STARTING WRITES.`);

        // WRITES
        t.update(matchRef, { resultProcessed: true });

        // Delete queues
        t.delete(doc(db, "ttt_queue", p1Id));
        if (!match.player2.isAI) {
          t.delete(doc(db, "ttt_queue", p2Id));
        }

        // Stats update
        const statsRef = doc(db, "stats", "ttt");
        t.set(statsRef, {
          totalMatches: increment(1),
          draws: increment(1)
        }, { merge: true });

        // Save History
        saveHistory(t, matchId, "draw", null, match, u1Data, u2Data);

        const duration = Date.now() - startTime;
        console.log(`[TTT SERVER] resolveTTTMatchInternal (DRAW) - TX SUCCESS. Duration: ${duration}ms`);
      });
      return { success: true };
    }

    // If Ad is enabled and Mode is 2 or 3, we postpone the payout until they claim it explicitly
    if (adEnabled && (adMode === "mode2" || adMode === "mode3")) {
      // Just mark result as ready for claim
      await updateDoc(matchRef, { claimReady: true });
      return { success: true };
    }

    // Otherwise, pay out immediately (Ad Mode 1, or Ad disabled)
    return await finalizePayout(matchId, match.winnerId, false);
  } catch (err: any) {
    console.error("[TTT SERVER] Resolve Match Failed:", err);
    return { success: false, message: err.message };
  }
}

async function finalizePayout(matchId: string, winnerId: string, adCompleted: boolean): Promise<{ success: boolean; message?: string }> {
  const db = getDb();
  try {
    await runTransaction(db, async (t) => {
      console.log(`[TTT SERVER] finalizePayout - TX START for matchId: ${matchId}`);
      const startTime = Date.now();
      const matchRef = doc(db, "ttt_matches", matchId);
      console.log(`[TTT SERVER] finalizePayout - READ matchRef`);
      const matchSnap = await t.get(matchRef);
      if (!matchSnap.exists()) throw new Error("Match not found");

      const match = matchSnap.data();
      if (match.resultProcessed) {
        console.log(`[TTT SERVER] finalizePayout - Match already processed`);
        return;
      }

      const p1Id = decryptId(match.player1.encTelegramId);
      const p2Id = decryptId(match.player2.encTelegramId);

      // Perform all other reads first!
      const uRef = doc(db, "users", winnerId);
      console.log(`[TTT SERVER] finalizePayout - READ winner uRef (${winnerId})`);
      const uSnap = await t.get(uRef);
      
      let u1Data: any = {};
      if (!match.player1.isAI) {
        if (p1Id === winnerId) {
          u1Data = uSnap.exists() ? uSnap.data() : {};
        } else {
          console.log(`[TTT SERVER] finalizePayout - READ p1 uRef (${p1Id})`);
          const u1Snap = await t.get(doc(db, "users", p1Id));
          u1Data = u1Snap.exists() ? u1Snap.data() : {};
        }
      }

      let u2Data: any = {};
      if (!match.player2.isAI) {
        if (p2Id === winnerId) {
          u2Data = uSnap.exists() ? uSnap.data() : {};
        } else {
          console.log(`[TTT SERVER] finalizePayout - READ p2 uRef (${p2Id})`);
          const u2Snap = await t.get(doc(db, "users", p2Id));
          u2Data = u2Snap.exists() ? u2Snap.data() : {};
        }
      }

      console.log(`[TTT SERVER] finalizePayout - ALL READS COMPLETED. STARTING WRITES.`);

      const prizePool = match.prizePool || 20;

      // Credit the winner
      if (uSnap.exists()) {
        t.update(uRef, { balance: increment(prizePool) });
        t.set(doc(collection(db, "transactions")), {
          userId: winnerId,
          amount: prizePool,
          type: "credit",
          description: "Tic Tac Toe Battle Win",
          timestamp: serverTimestamp(),
          status: "completed"
        });
      }

      // Update match document
      const updateData: any = {
        resultProcessed: true
      };
      if (adCompleted) {
        updateData.claimAdCompleted = true;
      }
      t.update(matchRef, updateData);

      // Clean queues
      t.delete(doc(db, "ttt_queue", p1Id));
      if (!match.player2.isAI) {
        t.delete(doc(db, "ttt_queue", p2Id));
      }

      // Global Stats
      const statsRef = doc(db, "stats", "ttt");
      t.set(statsRef, {
        totalMatches: increment(1),
        wins: increment(1),
        adsCompleted: adCompleted ? increment(1) : increment(0)
      }, { merge: true });

      // Save game history records
      saveHistory(t, matchId, "win", winnerId, match, u1Data, u2Data);

      const duration = Date.now() - startTime;
      console.log(`[TTT SERVER] finalizePayout - TX SUCCESS. Duration: ${duration}ms`);
    });

    return { success: true };
  } catch (err: any) {
    console.error("[TTT SERVER] finalizePayout failed:", err);
    return { success: false, message: err.message };
  }
}

function saveHistory(t: any, matchId: string, type: "win" | "draw", winnerId: string | null, match: any, u1Data: any, u2Data: any) {
  const db = getDb();
  const p1Id = decryptId(match.player1.encTelegramId);
  const p2Id = decryptId(match.player2.encTelegramId);

  // Player 1 history
  if (!match.player1.isAI) {
    const result1 = type === "draw" ? "Draw" : (winnerId === p1Id ? "Win" : "Loss");
    const reward1 = result1 === "Win" ? (match.prizePool || 20) : 0;

    t.set(doc(db, "ttt_history", matchId + "_" + p1Id), {
      gameId: matchId,
      userId: p1Id,
      username: u1Data.username || "None",
      telegramId: p1Id,
      gameName: "Tic Tac Toe Battle",
      opponent: match.player2.isAI ? (match.player2.aiName || "Bot") : (p2Id),
      difficulty: match.player2.isAI ? (match.player2.aiDifficulty || "Impossible") : "Human",
      result: result1,
      reward: reward1,
      timestamp: serverTimestamp(),
      board: match.board,
      duration: Math.round((Date.now() - (match.createdAt?.toDate()?.getTime() || Date.now())) / 1000)
    });
  }

  // Player 2 history
  if (!match.player2.isAI) {
    const result2 = type === "draw" ? "Draw" : (winnerId === p2Id ? "Win" : "Loss");
    const reward2 = result2 === "Win" ? (match.prizePool || 20) : 0;

    t.set(doc(db, "ttt_history", matchId + "_" + p2Id), {
      gameId: matchId,
      userId: p2Id,
      username: u2Data.username || "None",
      telegramId: p2Id,
      gameName: "Tic Tac Toe Battle",
      opponent: p1Id,
      difficulty: "Human",
      result: result2,
      reward: reward2,
      timestamp: serverTimestamp(),
      board: match.board,
      duration: Math.round((Date.now() - (match.createdAt?.toDate()?.getTime() || Date.now())) / 1000)
    });
  }
}

// AI ENGINE moves selectors
function computeAIMove(board: string[], difficulty: string): number {
  const emptyIndices: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === "") emptyIndices.push(i);
  }

  if (emptyIndices.length === 0) return -1;

  if (difficulty === "Easy") {
    // 100% random moves
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  if (difficulty === "Medium") {
    // Blocks immediate win, otherwise takes random
    // Can O win?
    for (const idx of emptyIndices) {
      board[idx] = "O";
      if (checkWinner(board) === "O") {
        board[idx] = "";
        return idx;
      }
      board[idx] = "";
    }
    // Can X win? (Block X)
    for (const idx of emptyIndices) {
      board[idx] = "X";
      if (checkWinner(board) === "X") {
        board[idx] = "";
        return idx;
      }
      board[idx] = "";
    }
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  if (difficulty === "Hard") {
    // 90% perfect play, 10% easy/medium AI play
    if (Math.random() < 0.1) {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }
    return getMinimaxMove(board);
  }

  // Impossible AI - Always minimax (Never loses)
  return getMinimaxMove(board);
}

function getMinimaxMove(board: string[]): number {
  let bestVal = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i] === "") {
      board[i] = "O";
      const moveVal = minimaxEval(board, 0, false, -Infinity, Infinity);
      board[i] = "";
      if (moveVal > bestVal) {
        bestVal = moveVal;
        bestMove = i;
      }
    }
  }
  return bestMove !== -1 ? bestMove : 0;
}

function minimaxEval(board: string[], depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
  const winner = checkWinner(board);
  if (winner === "O") return 10 - depth;
  if (winner === "X") return -10 + depth;
  if (board.every(cell => cell !== "")) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === "") {
        board[i] = "O";
        const val = minimaxEval(board, depth + 1, false, alpha, beta);
        board[i] = "";
        best = Math.max(best, val);
        alpha = Math.max(alpha, val);
        if (beta <= alpha) break;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === "") {
        board[i] = "X";
        const val = minimaxEval(board, depth + 1, true, alpha, beta);
        board[i] = "";
        best = Math.min(best, val);
        beta = Math.min(beta, val);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
}

export default router;
