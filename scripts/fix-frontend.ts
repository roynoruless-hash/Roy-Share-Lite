import fs from "fs";

let content = fs.readFileSync("src/components/split-or-steal/SplitOrStealMatch.tsx", "utf8");

const oldIsP1 = '  const isP1 = match.player1.telegramId === String(user?.telegramId);';
const newIsP1 = `  const [myPublicCode, setMyPublicCode] = useState<string | null>(null);

  useEffect(() => {
    if (user?.telegramId) {
      const getCode = async () => {
        const msgUint8 = new TextEncoder().encode(String(user.telegramId));
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setMyPublicCode("RS" + hashHex.substring(0, 5).toUpperCase());
      };
      getCode();
    }
  }, [user?.telegramId]);

  if (!match || !myPublicCode) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const isP1 = match.player1.publicCode === myPublicCode;`;

content = content.replace('  if (!match) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;', '');
content = content.replace(oldIsP1, newIsP1);

// Also fix getDb, etc if any.

fs.writeFileSync("src/components/split-or-steal/SplitOrStealMatch.tsx", content);
console.log("Fixed frontend!");
