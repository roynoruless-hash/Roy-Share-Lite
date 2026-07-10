import React, { memo } from "react";
import { motion } from "motion/react";
import { 
  Send, 
  Bot, 
  Zap, 
  ShieldCheck, 
  Cloud, 
  Lock, 
  Cpu, 
  Workflow, 
  Database, 
  HardDrive, 
  TrendingUp, 
  UserCheck, 
  Code2, 
  Briefcase, 
  MessageSquare, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  Clock,
  Shield,
  EyeOff,
  Settings,
  Bell,
  Fingerprint
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Footer from "../components/Footer";

const TelegramIntegrationPage = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Bot className="w-3 h-3" /> Automation & Workflow
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight"
          >
            Telegram Bot <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Integration</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed mb-10"
          >
            RoyShare's Telegram Bot is the engine behind our seamless file distribution network. It's not just a bot; it's a powerful automation layer that bridges the gap between your content, your Google Drive, and your audience.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="https://t.me/Roysharearn_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
            >
              🚀 Launch Bot
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* 1. What is Telegram Bot Integration? */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">
                Seamless <span className="text-blue-400">Content Management</span> Through Telegram
              </h2>
              <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                <p>
                  Telegram Bot Integration is the cornerstone of the RoyShare ecosystem. It allows creators to upload, manage, and track their shared content directly within the Telegram application. Instead of navigating complex web dashboards for every small action, our bot provides a streamlined interface for all your file-sharing needs.
                </p>
                <p>
                  This integration leverages the Telegram Bot API to create a command-driven workflow that is both intuitive and incredibly fast. Whether you're in a group, a channel, or a private chat with the bot, RoyShare's automation handles the heavy lifting of file transfers and link management in the background.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-[3rem] bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/10 flex items-center justify-center overflow-hidden group"
            >
              <Send className="w-48 h-48 text-blue-500/20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Bot className="w-24 h-24 text-blue-400 shadow-2xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Why RoyShare uses Telegram */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Why Telegram?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Choosing the right platform for automation was critical. Telegram offered the perfect balance of speed, security, and accessibility.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Universal Accessibility", desc: "Telegram is available on every device, allowing you to manage your files on the go without needing a dedicated mobile app.", icon: Clock },
              { title: "Native File Handling", desc: "Telegram's architecture is built for file sharing, supporting up to 2GB uploads natively which integrates perfectly with our system.", icon: HardDrive },
              { title: "API Power", desc: "The Telegram Bot API is highly robust, allowing us to build deep automation that feels like a native experience.", icon: Cpu },
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 text-blue-400">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How the System Works Step-by-Step */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">The Integrated Lifecycle</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">A transparent look at how data flows through the RoyShare ecosystem.</p>
          </div>
          <div className="space-y-12 relative">
            <div className="absolute left-8 top-12 bottom-12 w-px bg-blue-500/20 hidden lg:block" />
            {[
              { step: "01", title: "Authentication", desc: "User connects their RoyShare account to the Telegram Bot via a secure one-time token.", icon: UserCheck },
              { step: "02", title: "Storage Linking", desc: "User authorizes RoyShare to upload files to their personal Google Drive through Google OAuth.", icon: Cloud },
              { step: "03", title: "Trigger Event", desc: "User sends a file or a link to the Telegram Bot.", icon: Send },
              { step: "04", title: "Backend Processing", desc: "RoyShare's server verifies the request and initiates the secure transfer to Google Drive.", icon: Cpu },
              { step: "05", title: "API Communication", desc: "Our server uses the Google Drive API to stream the file directly into the user's account.", icon: Workflow },
              { step: "06", title: "Link Creation", desc: "Once confirmed, we generate a RoyShare smart link with built-in analytics and reward tracking.", icon: Zap },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-8 items-start relative z-10"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-blue-500/20 flex-shrink-0 flex items-center justify-center text-blue-400 font-black text-xl shadow-2xl relative">
                  <div className="absolute -inset-2 bg-blue-500/5 blur-xl rounded-full" />
                  {item.step}
                </div>
                <div className="pt-2">
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    {item.title}
                    <item.icon className="w-5 h-5 text-blue-500/40" />
                  </h3>
                  <p className="text-slate-400 text-lg max-w-3xl leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Sections 4-15 */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto space-y-32">
          
          {/* Upload Flow & Link Generation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                  <h4 className="text-white font-bold mb-2">Upload Flow</h4>
                  <p className="text-slate-500 text-xs">Files are streamed directly. RoyShare never writes the data to its own disk.</p>
                </div>
                <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10">
                  <h4 className="text-white font-bold mb-2">Smart Links</h4>
                  <p className="text-slate-500 text-xs">Dynamic redirection ensures high-performance delivery every time.</p>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-6">Advanced Storage Orchestration</h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                When you upload a file through our Telegram bot, we don't just "store" it. We orchestrate a secure transfer between Telegram's servers and your Google Drive. RoyShare acts as the secure bridge, utilizing the Google Drive API to place the file exactly where you want it.
              </p>
              <p className="text-slate-400 text-lg leading-relaxed">
                This API-based integration ensures that your files are never exposed to RoyShare's long-term storage. We only hold the data in a temporary memory buffer during the transfer, providing ultimate privacy and speed.
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative p-1 p-px bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-[3rem]">
                <div className="p-10 rounded-[3rem] bg-slate-950 border border-white/5 space-y-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-blue-400" /> Reward Mechanism
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-slate-400">Download Tracking</span>
                      <span className="text-emerald-400 font-bold">Real-time</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-slate-400">Unique Visitor Filter</span>
                      <span className="text-blue-400 font-bold">Enabled</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-slate-400">Earning Transparency</span>
                      <span className="text-purple-400 font-bold">100%</span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed text-center px-4">
                    Every download link generated by our Telegram Bot is embedded with tracking tokens that monitor valid downloads and attribute them directly to your earnings balance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Privacy In-Depth (Sections 8-15) */}
          <div className="relative p-12 sm:p-20 rounded-[4rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <div className="max-w-3xl mx-auto text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.15)]"
                >
                  <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </motion.div>
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8 tracking-tight">Security & Privacy Protocol</h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Our architecture is built on the principle of "Zero-Trust Storage." We never want to own your data; we only want to help you share it securely.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
                <div className="space-y-8 p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Lock className="w-6 h-6 text-emerald-500" /> Access Controls
                  </h3>
                  <div className="space-y-6">
                    <div className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        <strong className="text-white">Google OAuth Security:</strong> We only receive the specific authorization codes needed for the actions you request. Your master Google password is never touched.
                      </p>
                    </div>
                    <div className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        <strong className="text-white">Limited Scopes:</strong> We request only the "File Creation" and "Metadata" scopes, which do not allow us to browse your entire Drive.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <EyeOff className="w-6 h-6 text-blue-500" /> Privacy Constraints
                  </h3>
                  <div className="space-y-6">
                    <div className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        <strong className="text-white">No File Reading:</strong> RoyShare servers are technically incapable of opening or reading the content of your files. They only handle binary streams.
                      </p>
                    </div>
                    <div className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        <strong className="text-white">Zero Modification:</strong> We cannot edit or delete your files. Our permissions are strictly additive for the purpose of uploading new content.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 rounded-[3rem] bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-white/10 text-center">
                <h3 className="text-2xl font-bold text-white mb-4">Ownership Guarantee</h3>
                <p className="text-slate-300 max-w-2xl mx-auto mb-0">
                  RoyShare recognizes you as the sole owner of every byte uploaded through our system. We never copy, sell, or modify your content. Your storage remains your sovereign territory, and RoyShare acts only as your chosen automation agent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits (16-18) & Use Cases (19) */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Who is this for?</h2>
            <p className="text-slate-400">Our Telegram integration is designed to solve complex sharing problems for a diverse audience.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all group">
              <Code2 className="w-12 h-12 text-blue-400 mb-8 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-white mb-4">Developers</h3>
              <p className="text-slate-500 leading-relaxed mb-6">Automate file delivery from your CI/CD pipelines or scripts directly into monetized channels using our bot commands.</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2 italic">✔ Webhook Integration</li>
                <li className="flex items-center gap-2 italic">✔ Command-line control</li>
                <li className="flex items-center gap-2 italic">✔ API scalability</li>
              </ul>
            </div>
            <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group">
              <Briefcase className="w-12 h-12 text-purple-400 mb-8 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-white mb-4">Creators</h3>
              <p className="text-slate-500 leading-relaxed mb-6">Focus on your content, not the logistics. Manage your entire distribution empire from your pocket.</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2 italic">✔ Mobile-first management</li>
                <li className="flex items-center gap-2 italic">✔ Instant link sharing</li>
                <li className="flex items-center gap-2 italic">✔ Group distribution</li>
              </ul>
            </div>
            <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group">
              <TrendingUp className="w-12 h-12 text-emerald-400 mb-8 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-white mb-4">Businesses</h3>
              <p className="text-slate-500 leading-relaxed mb-6">Securely share corporate assets or marketing materials with granular tracking and no hosting overhead.</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2 italic">✔ Cost optimization</li>
                <li className="flex items-center gap-2 italic">✔ Engagement analytics</li>
                <li className="flex items-center gap-2 italic">✔ Brand control</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ (20) */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Expert Insights & FAQ</h2>
            <p className="text-slate-400">Technical answers for the security-conscious user.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "Is the Telegram communication encrypted?", a: "Yes. All interactions with our bot use Telegram's MTProto encryption for transport security, and our backend communication with Google uses SSL/TLS." },
              { q: "Can the bot see my private messages?", a: "No. The RoyShare bot only has access to messages explicitly sent to it or commands it is programmed to respond to within groups (if given admin rights)." },
              { q: "What happens if I accidentally send a private file?", a: "The bot only uploads files when you use a specific upload command or interactive button. It does not auto-scan your chat history." },
              { q: "How does RoyShare identify my Google account?", a: "We use a unique internal ID mapped to your authenticated Telegram profile. This mapping is securely stored and used only for API orchestration." },
              { q: "Are there limits to file sizes in the bot?", a: "The bot respects Telegram's native file limits (currently up to 2GB) and your available Google Drive storage capacity." },
              { q: "Does RoyShare modify the file metadata?", a: "We maintain the original file integrity. We only add standard Google Drive metadata tags required for our system to identify the file later for download generation." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="flex items-center gap-3 mb-4 text-white font-bold group-hover:text-blue-400 transition-colors">
                  <HelpCircle className="w-5 h-5 text-blue-500/60" /> {item.q}
                </div>
                <p className="text-slate-500 text-sm leading-relaxed ml-8">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Recommendations & Conclusion (21-23) */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="p-12 rounded-[3rem] bg-blue-500/5 border border-blue-500/10">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-400" /> Best Practices
              </h3>
              <ul className="space-y-4">
                {[
                  "Enable Two-Factor Authentication on both your Telegram and Google accounts.",
                  "Regularly review your authorized apps in your Google Security settings.",
                  "Use clear naming conventions for your files to improve searchability in Drive.",
                  "Check your RoyShare dashboard weekly to monitor download performance.",
                  "Revoke bot permissions if you plan to be inactive for long periods."
                ].map((text, i) => (
                  <li key={i} className="flex gap-4 text-slate-400 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500/40 flex-shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-12 rounded-[3rem] bg-purple-500/5 border border-purple-500/10 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-white mb-6">Final Conclusion</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                The RoyShare Telegram Bot Integration represents the peak of modern SaaS automation. By combining the social convenience of Telegram with the enterprise-grade reliability of Google Drive, we've created a tool that respects user privacy while maximizing distribution efficiency.
              </p>
              <p className="text-slate-400 leading-relaxed italic">
                Whether you're a single creator or a scaling business, our bot is ready to serve as your dedicated file-sharing infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto p-12 sm:p-20 rounded-[4rem] bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden text-center shadow-2xl group">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
          
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Experience Seamless Automation</h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">Start your first automated upload today and see how Telegram transforms your workflow.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://t.me/Roysharearn_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                <Bot className="w-6 h-6" /> Launch Telegram Bot
              </a>
              <button 
                onClick={() => window.location.href = '/contact'}
                className="w-full sm:w-auto px-10 py-5 bg-white/10 border border-white/20 text-white font-bold rounded-2xl backdrop-blur-md hover:bg-white/20 transition-all flex items-center justify-center gap-3"
              >
                <MessageSquare className="w-5 h-5" /> Contact Our Team
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer hideCTA={true} />
    </main>
  );
};

export default memo(TelegramIntegrationPage);
