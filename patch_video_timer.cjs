const fs = require('fs');
let code = fs.readFileSync('src/pages/VideoTaskPage.tsx', 'utf8');

const oldTimer = `
  useEffect(() => {
    if (step === "readyToClaim" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);
`;

const newTimer = `
  // Pause timer if document is hidden
  useEffect(() => {
    if (step === "readyToClaim" && timeLeft > 0) {
      const timer = setInterval(() => {
        if (!document.hidden) {
          setTimeLeft((prev) => prev - 1);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);
`;

if (code.includes('setTimeLeft((prev) => prev - 1);')) {
  // Let's do a regex replacement for the useEffect
  const regex = /useEffect\(\(\) => \{\n    if \(step === "readyToClaim" && timeLeft > 0\) \{[\s\S]*?\}, \[step, timeLeft\]\);/;
  if (regex.test(code)) {
    code = code.replace(regex, newTimer.trim());
    fs.writeFileSync('src/pages/VideoTaskPage.tsx', code);
    console.log("Timer patched.");
  } else {
    console.log("Regex not matched.");
  }
} else {
  console.log("Not found.");
}
