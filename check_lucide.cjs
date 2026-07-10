const lucide = require('lucide-react');
const icons = [
  "Zap", "Play", "CheckCircle2", "AlertTriangle", "Timer", "Tv", "Target", "ShieldAlert",
  "Award", "Clock", "AlertCircle", "Info", "Smartphone", "MousePointer2", "ClipboardCheck",
  "Sparkles", "Copy", "ExternalLink", "Eye", "EyeOff", "RotateCcw", "UserPlus", "Trash2",
  "Search", "User", "Filter", "Download", "Users", "Check", "Terminal", "Globe", "RefreshCw",
  "FileCode", "Activity", "Layers", "Radio", "XCircle", "CheckCircle"
];
let missing = [];
for (let icon of icons) {
  if (!lucide[icon]) {
    missing.push(icon);
  }
}
console.log("Missing icons:", missing);
