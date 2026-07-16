import re

with open('src/components/LuckyDrawWinnerManager.tsx', 'r') as f:
    content = f.read()

old_btn = """                <button
                  onClick={handleSaveGiveaway}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-blue-500/10 cursor-pointer"
                >
                  Save Changes
                </button>"""

new_btn = """                <button
                  disabled={isSaving}
                  onClick={handleSaveGiveaway}
                  className={`px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2 ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : "Save Changes"}
                </button>"""

content = content.replace(old_btn, new_btn)

with open('src/components/LuckyDrawWinnerManager.tsx', 'w') as f:
    f.write(content)
