import re

with open('src/pages/PublicUpiGiveawayPage.tsx', 'r') as f:
    content = f.read()

old_notstarted = """          if (timing.status === "NotStarted") {
            return (
              <div className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-3xl text-center text-blue-400 text-sm space-y-3">
                <Clock className="w-10 h-10 mx-auto text-blue-500" />
                <h3 className="font-bold text-white">Not Started Yet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{timing.message}</p>
                {giveaway.startDate && (
                  <p className="text-[11px] text-slate-500 font-mono mt-2">
                    Starts at: {formatFriendlyKolkata(giveaway.startDate)}
                  </p>
                )}
              </div>
            );
          }"""

new_notstarted = """          if (timing.status === "NotStarted") {
            return (
              <div className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-3xl text-center text-blue-400 text-sm space-y-4">
                <Clock className="w-10 h-10 mx-auto text-blue-500" />
                <h3 className="font-bold text-white">Giveaway Has Not Started Yet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{timing.message}</p>
                
                {timeLeft.isCountingToStart && (
                  <div className="pt-4">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block text-center mb-2">Starts In</span>
                    <div className="grid grid-cols-4 gap-2 text-center max-w-xs mx-auto">
                      <div className="bg-slate-950/40 p-2.5 rounded-xl border border-blue-500/20"><span className="text-lg font-black text-white block">{timeLeft.days}</span><span className="text-[9px] text-blue-400 font-bold uppercase">Days</span></div>
                      <div className="bg-slate-950/40 p-2.5 rounded-xl border border-blue-500/20"><span className="text-lg font-black text-white block">{timeLeft.hours}</span><span className="text-[9px] text-blue-400 font-bold uppercase">Hours</span></div>
                      <div className="bg-slate-950/40 p-2.5 rounded-xl border border-blue-500/20"><span className="text-lg font-black text-white block">{timeLeft.minutes}</span><span className="text-[9px] text-blue-400 font-bold uppercase">Mins</span></div>
                      <div className="bg-slate-950/40 p-2.5 rounded-xl border border-blue-500/20"><span className="text-lg font-black text-white block">{timeLeft.seconds}</span><span className="text-[9px] text-blue-400 font-bold uppercase">Secs</span></div>
                    </div>
                  </div>
                )}
                {giveaway.startDate && (
                  <p className="text-[11px] text-slate-500 font-mono mt-4">
                    Scheduled for: {formatFriendlyKolkata(giveaway.startDate)}
                  </p>
                )}
              </div>
            );
          }"""

content = content.replace(old_notstarted, new_notstarted)

with open('src/pages/PublicUpiGiveawayPage.tsx', 'w') as f:
    f.write(content)
