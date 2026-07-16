import re

with open('src/components/LuckyDrawWinnerManager.tsx', 'r') as f:
    content = f.read()

old_save = """  const handleSaveGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formTitle.trim()) {
      showToast("Please provide a title for the giveaway.", "error");
      return;
    }

    if (!formId.trim()) {
      showToast("Campaign ID cannot be empty.", "error");
      return;
    }"""

new_save = """  const handleSaveGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    // Validations
    if (!formTitle.trim()) {
      showToast("Please provide a title for the giveaway.", "error");
      return;
    }

    if (!formId.trim()) {
      showToast("Campaign ID cannot be empty.", "error");
      return;
    }

    if (!formPrizeAmount || formPrizeAmount <= 0) {
      showToast("Please enter a valid Prize Amount greater than 0.", "error");
      return;
    }

    if (!formWinnerCount || formWinnerCount <= 0) {
      showToast("Please enter a valid Total Winners count greater than 0.", "error");
      return;
    }"""

content = content.replace(old_save, new_save)

old_try = """    try {
      const docRef = doc(db, "lucky_draws", formId.trim());"""

new_try = """    setIsSaving(true);
    try {
      const docRef = doc(db, "lucky_draws", formId.trim());"""

content = content.replace(old_try, new_try)

old_catch = """      setIsModalOpen(false);
    } catch (err: any) {
      console.error("[LuckyDraw] Save error:", err);
      showToast("Failed to save Campaign: " + err.message, "error");
    }
  };"""

new_catch = """      setIsModalOpen(false);
    } catch (err: any) {
      console.error("[LuckyDraw] Save error:", err);
      showToast("Failed to save Campaign: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };"""

content = content.replace(old_catch, new_catch)

with open('src/components/LuckyDrawWinnerManager.tsx', 'w') as f:
    f.write(content)
