const fs = require('fs');
let code = fs.readFileSync('src/components/split-or-steal/SplitOrStealMatch.tsx', 'utf8');

const toMove = `  const [myPublicCode, setMyPublicCode] = useState<string | null>(null);

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
  }, [user?.telegramId]);`;

code = code.replace(toMove, '');

const insertAt = `export default function SplitOrStealMatch({ matchId, onBack }: { matchId: string, onBack: () => void }) {
  const { user } = useTelegramAuth();`;

code = code.replace(insertAt, `${insertAt}\n${toMove}\n`);

fs.writeFileSync('src/components/split-or-steal/SplitOrStealMatch.tsx', code);
console.log("Patched");
