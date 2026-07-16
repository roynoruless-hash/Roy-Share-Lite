import re

with open('src/pages/PublicLuckyDrawPage.tsx', 'r') as f:
    content = f.read()

old_render = """  }

  const giveawayIsEnded = timeLeft.isExpired || giveaway?.status === "Ended";

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">"""

new_render = """  }

  const timing = giveaway ? getGiveawayTimingStatus(giveaway) : { status: 'Draft', message: '' };
  const giveawayIsEnded = timing.status === 'Ended' || timing.status === 'Completed' || timing.status === 'Drawing';
  const giveawayIsActive = timing.status === 'Active';

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="p-4 flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">"""

content = content.replace(old_render, new_render)

with open('src/pages/PublicLuckyDrawPage.tsx', 'w') as f:
    f.write(content)
