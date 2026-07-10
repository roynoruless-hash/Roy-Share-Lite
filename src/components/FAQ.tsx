import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  HelpCircle, 
  Plus, 
  Minus, 
  Search, 
  FileUp, 
  FileDown, 
  Cloud, 
  Bot, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle, 
  Headphones,
  ChevronRight,
  MessageSquare,
  BookOpen
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is RoyShare?",
    answer: "RoyShare is a premium content monetization platform that allows creators to earn rewards by sharing files and smart links. We provide secure cloud storage and lightning-fast delivery powered by Google Drive and Telegram integration."
  },
  {
    question: "How do I upload files?",
    answer: "You can upload files directly through our Telegram bot or use our web-based Drive Upload page. Once uploaded, RoyShare generates a secure, protected link that you can share with your audience."
  },
  {
    question: "How does Google Drive storage work?",
    answer: "RoyShare utilizes Google Drive API to store your files securely. This ensures high availability, fast download speeds, and enterprise-grade security for your data while keeping the process seamless for both creators and downloaders."
  },
  {
    question: "How do I earn rewards?",
    answer: "You earn rewards every time someone visits your shared links or downloads your files. Our platform tracks unique visitors and completions, providing transparent earning reports in real-time."
  },
  {
    question: "How do Smart Links work?",
    answer: "Smart Links are advanced shortened URLs that protect your destination content behind a verification layer. This allows you to monetize any URL while ensuring your visitors are genuine human users."
  },
  {
    question: "How do I connect Telegram?",
    answer: "Simply launch our official Telegram bot (@RoyShareBot) and follow the instructions to link your account. You'll be able to manage uploads, track earnings, and receive instant notifications directly in Telegram."
  },
  {
    question: "What file types are supported?",
    answer: "We support a wide range of file types including documents, images, videos, archives, and applications. As long as the content complies with our community guidelines, you can share it via RoyShare."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we prioritize security. All files are stored on secure Google Drive infrastructure, and all links are SSL protected. We also implement advanced anti-spam and anti-fraud measures to protect both creators and users."
  },
  {
    question: "Can I delete uploaded files?",
    answer: "Yes, you have full control over your content. You can manage and delete your uploaded files through your creator dashboard or via the Telegram bot at any time."
  },
  {
    question: "How do I contact support?",
    answer: "Our support team is available 24/7. You can reach us through the 'Help Center' in the Telegram bot or by opening a support ticket directly on our website."
  },
  {
    question: "How long are files stored?",
    answer: "Files are stored as long as your account remains active and the content complies with our terms of service. We don't have a strict expiration date for active content, ensuring your links stay functional."
  },
  {
    question: "How do withdrawals work?",
    answer: "Withdrawals are processed quickly through various payment methods. Once you reach the minimum threshold, you can request a payout through your dashboard, and our team will verify and process it within 24-48 hours."
  }
];

const helpCenterCards = [
  {
    icon: FileUp,
    title: "Upload Guide",
    description: "Learn how to upload and manage your files effectively."
  },
  {
    icon: FileDown,
    title: "Download Guide",
    description: "Tips for ensuring your users have the best download experience."
  },
  {
    icon: Cloud,
    title: "Google Drive Guide",
    description: "Understanding how our cloud storage integration works."
  },
  {
    icon: Bot,
    title: "Telegram Guide",
    description: "Master the RoyShare Telegram bot for automation."
  },
  {
    icon: DollarSign,
    title: "Earnings Guide",
    description: "Strategies to maximize your rewards and understanding payouts."
  },
  {
    icon: ShieldCheck,
    title: "Account & Security",
    description: "Best practices for keeping your creator account secure."
  },
  {
    icon: AlertCircle,
    title: "Troubleshooting",
    description: "Solutions to common issues and technical questions."
  },
  {
    icon: Headphones,
    title: "Contact Support",
    description: "Direct access to our dedicated 24/7 assistance team."
  }
];

const FAQItemComponent = memo(({ item, isOpen, onClick }: { item: FAQItem, isOpen: boolean, onClick: () => void }) => {
  return (
    <div className="mb-4">
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all duration-300 border ${
          isOpen 
            ? "bg-white/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
            : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
        }`}
      >
        <span className={`text-left font-bold transition-colors ${isOpen ? "text-blue-400" : "text-white"}`}>
          {item.question}
        </span>
        <div className={`flex-shrink-0 ml-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          {isOpen ? (
            <Minus className="w-5 h-5 text-blue-400" />
          ) : (
            <Plus className="w-5 h-5 text-slate-500" />
          )}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-2 text-slate-400 text-sm leading-relaxed">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

FAQItemComponent.displayName = "FAQItemComponent";

const HelpCard = memo(({ card, index }: { card: typeof helpCenterCards[0], index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.05 }}
    className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group flex flex-col h-full"
  >
    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
      <card.icon className="w-6 h-6 text-blue-400" />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
    <p className="text-slate-500 text-sm mb-6 flex-grow leading-relaxed">{card.description}</p>
    <button 
      onClick={() => window.location.href = '/help'}
      className="flex items-center gap-2 text-blue-400 text-sm font-bold group/btn hover:text-blue-300 transition-colors"
    >
      Read Guide <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
    </button>
  </motion.div>
));

HelpCard.displayName = "HelpCard";

const FAQSection = memo(({ featuredOnly = false }: { featuredOnly?: boolean }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const displayFAQs = featuredOnly ? faqData.slice(0, 5) : faqData;
  const displayHelpCards = featuredOnly ? helpCenterCards.slice(0, 4) : helpCenterCards;

  return (
    <section className={`relative ${featuredOnly ? "py-16 sm:py-24" : "py-24 sm:py-32"} px-6 bg-slate-950 overflow-hidden`}>
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* FAQ Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <HelpCircle className="w-3 h-3" /> Get Answers
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight"
          >
            ❓ Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Everything you need to know before using RoyShare.
          </motion.p>
        </div>

        {/* FAQ Accordion Grid */}
        <div className={`max-w-3xl mx-auto ${featuredOnly ? "mb-16" : "mb-32"}`}>
          {displayFAQs.map((item, index) => (
            <FAQItemComponent
              key={index}
              item={item}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}

          {featuredOnly && (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <button 
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white hover:text-slate-950 transition-all group"
                onClick={() => window.location.href = '/faq'}
              >
                View All FAQs <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </div>

        {/* Help Center Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-display font-bold text-white mb-6 tracking-tight"
          >
            📚 Help Center
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto mb-10"
          >
            Quick access to guides and documentation.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto relative group"
          >
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search help articles..."
              aria-label="Search help articles"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
            />
          </motion.div>
        </div>

        {/* Help Center Cards Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${featuredOnly ? "lg:grid-cols-4" : "lg:grid-cols-4"} gap-6 mb-16`}>
          {displayHelpCards.map((card, index) => (
            <HelpCard key={index} card={card} index={index} />
          ))}
        </div>

        {featuredOnly && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <button 
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white hover:text-slate-950 transition-all group"
              onClick={() => window.location.href = '/help'}
            >
              Open Help Center <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {/* Bottom CTA Card (Full version only) */}
        {!featuredOnly && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto p-10 sm:p-14 rounded-[3rem] bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 backdrop-blur-md text-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Need more help?</h3>
              <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
                Our support team is ready to help you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-950 font-bold rounded-2xl transition-all"
                  onClick={() => window.location.href = '/support'}
                >
                  <MessageSquare className="w-5 h-5" />
                  💬 Contact Support
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/20 transition-all"
                  onClick={() => window.location.href = '/help'}
                >
                  <BookOpen className="w-5 h-5" />
                  📚 View Help Center
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
});

FAQSection.displayName = "FAQSection";

export default FAQSection;
