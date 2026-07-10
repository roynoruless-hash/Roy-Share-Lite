import React, { useState } from "react";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { motion, AnimatePresence } from "motion/react";
import { User as UserIconType } from "../types";
import { User as UserIcon, ChevronRight, ChevronLeft, Check, Smartphone, Globe, MapPin, Calendar, Languages, Heart, GraduationCap, Briefcase, DollarSign, Users, Baby } from "lucide-react";

export const ProfileSetup: React.FC = () => {
  const { completeProfile } = useTelegramAuth();
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<Partial<UserIconType>>({
    mobileNumber: "",
    country: "",
    state: "",
    city: "",
    gender: "",
    dateOfBirth: "",
    language: "",
    interests: [],
    education: "",
    occupation: "",
    incomeRange: "",
    maritalStatus: "",
    children: "",
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      await completeProfile(details);
    } catch (err) {
      console.error("Setup error:", err);
    }
  };

  const updateDetail = (key: keyof UserIconType, value: any) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInterest = (interest: string) => {
    const current = details.interests || [];
    if (current.includes(interest)) {
      updateDetail("interests", current.filter((i) => i !== interest));
    } else {
      updateDetail("interests", [...current, interest]);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Smartphone className="w-4 h-4" /> Mobile Number
              </label>
              <input
                type="tel"
                value={details.mobileNumber}
                onChange={(e) => updateDetail("mobileNumber", e.target.value)}
                placeholder="+91 00000 00000"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Country
                </label>
                <input
                  type="text"
                  value={details.country}
                  onChange={(e) => updateDetail("country", e.target.value)}
                  placeholder="India"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> State
                </label>
                <input
                  type="text"
                  value={details.state}
                  onChange={(e) => updateDetail("state", e.target.value)}
                  placeholder="Delhi"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> City
              </label>
              <input
                type="text"
                value={details.city}
                onChange={(e) => updateDetail("city", e.target.value)}
                placeholder="New Delhi"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4" /> Gender
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["Male", "Female", "Other"].map((g) => (
                  <button
                    key={g}
                    onClick={() => updateDetail("gender", g)}
                    className={`py-3 rounded-xl border transition-all ${
                      details.gender === g
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Date of Birth
              </label>
              <input
                type="date"
                value={details.dateOfBirth}
                onChange={(e) => updateDetail("dateOfBirth", e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Languages className="w-4 h-4" /> Primary Language
              </label>
              <input
                type="text"
                value={details.language}
                onChange={(e) => updateDetail("language", e.target.value)}
                placeholder="English / Hindi"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4" /> Interests (Select multiple)
              </label>
              <div className="flex flex-wrap gap-2">
                {["Tech", "Sports", "Gaming", "Finance", "Travel", "Food", "Fashion", "Movies", "Music", "Art"].map((i) => (
                  <button
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className={`px-4 py-2 rounded-full border text-sm transition-all ${
                      details.interests?.includes(i)
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Education
              </label>
              <select
                value={details.education}
                onChange={(e) => updateDetail("education", e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
              >
                <option value="">Select Education</option>
                <option value="High School">High School</option>
                <option value="Bachelor's">Bachelor's Degree</option>
                <option value="Master's">Master's Degree</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Occupation
              </label>
              <input
                type="text"
                value={details.occupation}
                onChange={(e) => updateDetail("occupation", e.target.value)}
                placeholder="Software Engineer"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Monthly Income Range
              </label>
              <select
                value={details.incomeRange}
                onChange={(e) => updateDetail("incomeRange", e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
              >
                <option value="">Select Income Range</option>
                <option value="₹0 - ₹20k">₹0 - ₹20,000</option>
                <option value="₹20k - ₹50k">₹20,000 - ₹50,000</option>
                <option value="₹50k - ₹1L">₹50,000 - ₹1,00,000</option>
                <option value="₹1L+">₹1,00,000+</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Marital Status
                </label>
                <select
                  value={details.maritalStatus}
                  onChange={(e) => updateDetail("maritalStatus", e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                >
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Baby className="w-4 h-4" /> Children
                </label>
                <select
                  value={details.children}
                  onChange={(e) => updateDetail("children", e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                >
                  <option value="">Select</option>
                  <option value="None">None</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3+">3+</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
              <p className="text-xs text-blue-400/80 leading-relaxed">
                By completing your profile, you agree to our <strong>Terms of Service</strong>, <strong>Privacy Policy</strong>, and <strong>Reward Policy</strong>. This information helps us provide relevant surveys and tasks.
              </p>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] p-6">
      <div className="max-w-md mx-auto py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-white tracking-tight">Complete Profile</h1>
            <span className="text-sm font-medium text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
              Step {step} of {totalSteps}
            </span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              className="h-full bg-blue-500"
            />
          </div>
        </header>

        <main className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </main>

        <footer className="mt-12 flex gap-4">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900/50 border border-slate-800 hover:border-slate-700 text-white py-4 rounded-2xl font-semibold transition-all active:scale-[0.98]"
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
          >
            {step === totalSteps ? (
              <>
                <Check className="w-5 h-5" /> Finish Setup
              </>
            ) : (
              <>
                Continue <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
