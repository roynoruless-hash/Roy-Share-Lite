const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const advTabStart = `{false && activeTab === "📢 Advertisement Settings" && (`
let advTabStartIndex = code.indexOf(advTabStart);
if (advTabStartIndex !== -1) {
    console.log("Found start at", advTabStartIndex);
    let slice = code.substring(advTabStartIndex, advTabStartIndex + 200);
    console.log("Start block:", slice);
    
    // We can count brackets to find the matching ')' for this `{false && ... && (`
    // It's a bit complex with JSX inside, but we can search for a unique string near the end
    // Let's find the end of the file.
    let tail = code.substring(code.length - 200);
    console.log("Tail:\n", tail);
} else {
    console.log("Not found");
}
