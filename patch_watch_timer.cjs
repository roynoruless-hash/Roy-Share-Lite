const fs = require('fs');
let code = fs.readFileSync('src/pages/VideoTaskPage.tsx', 'utf8');

// We need to add watchTimeLeft
const stateRegex = /const \[timeLeft, setTimeLeft\] = useState\(0\);/;
code = code.replace(stateRegex, 'const [timeLeft, setTimeLeft] = useState(0);\n  const [watchTimeLeft, setWatchTimeLeft] = useState(0);');

// When session is created, set watchTimeLeft to task's countdown
const setWatchTimeLeftRegex = /setSessionToken\(data\.token\);/;
code = code.replace(setWatchTimeLeftRegex, 'setSessionToken(data.token);\n      setWatchTimeLeft(parseInt(data.countdown) || 0);');

// Add the watch timer effect
const watchTimerEffect = `
  // Active watch timer (pauses when hidden)
  useEffect(() => {
    let timer: any;
    if (step === "readyToClaim" && watchTimeLeft > 0) {
      timer = setInterval(() => {
        if (!document.hidden && document.visibilityState !== 'hidden') {
          setWatchTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, watchTimeLeft]);
`;

code = code.replace(/useEffect\(\(\) => \{\n    return \(\) => \{\n      if \(heartbeatIntervalRef\.current\)/, watchTimerEffect + '\n  $&');

// Update the claim button to check watchTimeLeft
const claimBtnRegex = /disabled=\{timeLeft > 0 \|\| claimDelay\}/;
code = code.replace(claimBtnRegex, 'disabled={timeLeft > 0 || watchTimeLeft > 0 || claimDelay}');

const claimBtnClassRegex = /\(timeLeft > 0 \|\| claimDelay\) \? "bg-slate-800 text-slate-500 cursor-not-allowed"/;
code = code.replace(claimBtnClassRegex, '(timeLeft > 0 || watchTimeLeft > 0 || claimDelay) ? "bg-slate-800 text-slate-500 cursor-not-allowed"');

const claimBtnTextRegex = /\{timeLeft > 0 \? \`Claim Reward in \$\{timeLeft\}s\` : claimDelay \? <Loader2 className="w-5 h-5 animate-spin" \/> : "Claim Reward"\}/;
code = code.replace(claimBtnTextRegex, '{timeLeft > 0 ? `Please wait ${timeLeft}s` : watchTimeLeft > 0 ? `Watch Ad (${watchTimeLeft}s)` : claimDelay ? <Loader2 className="w-5 h-5 animate-spin" /> : "Claim Reward"}');

// In handleWatchAds, let's remove the frontend pre-watch countdown that goes to readyToWatch and instead use it for human verification if needed, or leave it. Wait, the old code had "countdown" step which decrements `timeLeft`. 
// We are adding `watchTimeLeft`.

// Now we need to update the Server side `server.ts` to also enforce that active watch time is checked.
fs.writeFileSync('src/pages/VideoTaskPage.tsx', code);
console.log("Watch timer patched on frontend.");
