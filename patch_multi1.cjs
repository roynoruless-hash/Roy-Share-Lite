const fs = require('fs');
let code = fs.readFileSync('src/components/MultiPageEngine.tsx', 'utf8');

// Add state
const targetState = `const [captchaError, setCaptchaError] = useState(false);`;
const replaceState = `const [captchaError, setCaptchaError] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordVerifying, setPasswordVerifying] = useState(false);

  const handlePasswordSubmit = async () => {
     if (!passwordInput) return;
     setPasswordVerifying(true);
     setPasswordError("");
     try {
       const res = await fetch(\`\${API_BASE}/api/smart-links/session/verify-password\`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ sessionId, password: passwordInput })
       });
       const data = await res.json();
       if (res.ok && data.success) {
          setIsPasswordProtected(false);
       } else {
          setPasswordError("❌ Incorrect Password");
       }
     } catch (err) {
       setPasswordError("An error occurred");
     }
     setPasswordVerifying(false);
  };
`;

if (code.indexOf(targetState) !== -1) {
    code = code.replace(targetState, replaceState);
}

// Add to initData processing
const targetInit = `setItemData(initData.data);
        setSessionId(initData.sessionId);`;
const replaceInit = `setItemData(initData.data);
        setSessionId(initData.sessionId);
        if (initData.isPasswordProtected) {
           setIsPasswordProtected(true);
        }`;

if (code.indexOf(targetInit) !== -1) {
    code = code.replace(targetInit, replaceInit);
}

// Add render block
const targetRender = `if (securityBlockReason) {`;
const replaceRender = `if (isPasswordProtected) {
    return (
      <div className="min-h-screen relative text-slate-200 font-sans flex flex-col justify-between overflow-hidden">
        <AnimatedBackground />
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-700 backdrop-blur-md rounded-2xl p-8 shadow-2xl space-y-6 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-white">This link is password protected.</h2>
            {passwordError && <p className="text-rose-400 text-sm font-semibold">{passwordError}</p>}
            <div className="text-left space-y-2">
              <label className="block text-sm font-medium text-slate-400">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="Enter password..."
                onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
              />
            </div>
            <button
              onClick={handlePasswordSubmit}
              disabled={passwordVerifying || !passwordInput}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition"
            >
              {passwordVerifying ? "Verifying..." : "Unlock Button"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (securityBlockReason) {`;

if (code.indexOf(targetRender) !== -1) {
    code = code.replace(targetRender, replaceRender);
}

fs.writeFileSync('src/components/MultiPageEngine.tsx', code);
console.log("Patched MultiPageEngine");
