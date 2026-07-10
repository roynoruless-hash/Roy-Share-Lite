const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `const {\n        destinationUrl,\n        customAlias,\n        totalPages,\n        autoRedirect,\n        finalRedirectDelay,\n        instructions,\n        reward,\n        status,\n        pagesConfig\n      } = req.body;`,
  `const {\n        destinationUrl,\n        customAlias,\n        isPasswordProtected,\n        password,\n        totalPages,\n        autoRedirect,\n        finalRedirectDelay,\n        instructions,\n        reward,\n        status,\n        pagesConfig\n      } = req.body;`
);

code = code.replace(
  `let alias = customAlias ? customAlias.trim() : "";\n      if (alias) {\n        const q = query(collection(db, "smart_links"), where("alias", "==", alias));`,
  `let alias = customAlias ? customAlias.trim() : "";\n      if (alias) {\n        if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {\n          return res.status(400).json({ error: "Alias must only contain letters, numbers, dashes, and underscores." });\n        }\n        const q = query(collection(db, "smart_links"), where("alias", "==", alias));`
);

code = code.replace(
  `let alias = customAlias ? customAlias.trim() : "";\n      if (alias && alias !== existingData.alias) {\n        const q = query(collection(db, "smart_links"), where("alias", "==", alias));`,
  `let alias = customAlias ? customAlias.trim() : "";\n      if (alias && alias !== existingData.alias) {\n        if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {\n          return res.status(400).json({ error: "Alias must only contain letters, numbers, dashes, and underscores." });\n        }\n        const q = query(collection(db, "smart_links"), where("alias", "==", alias));`
);

code = code.replace(
  `const newLinkDoc = {\n        id: newLinkId,\n        destinationUrl,\n        alias,\n        shortUrl,\n        totalPages: Number(totalPages) || 1,`,
  `const newLinkDoc = {\n        id: newLinkId,\n        destinationUrl,\n        alias,\n        shortUrl,\n        isPasswordProtected: isPasswordProtected === true,\n        password: password || "",\n        totalPages: Number(totalPages) || 1,`
);

code = code.replace(
  `if (alias) {\n        updateData.alias = alias;\n        const rawAppUrl = process.env.APP_URL || "https://www.royshare.online";\n        const appUrl = (rawAppUrl.includes("run.app") || rawAppUrl.includes("ais-dev") || rawAppUrl === "MY_APP_URL") \n          ? "https://www.royshare.online" \n          : rawAppUrl;\n        const baseDomain = appUrl.replace(/\\/$/, "");\n        updateData.shortUrl = \`\${baseDomain}/s/\${alias}\`;\n      }\n\n      if (totalPages !== undefined) updateData.totalPages = Number(totalPages) || 1;`,
  `if (alias) {\n        updateData.alias = alias;\n        const rawAppUrl = process.env.APP_URL || "https://www.royshare.online";\n        const appUrl = (rawAppUrl.includes("run.app") || rawAppUrl.includes("ais-dev") || rawAppUrl === "MY_APP_URL") \n          ? "https://www.royshare.online" \n          : rawAppUrl;\n        const baseDomain = appUrl.replace(/\\/$/, "");\n        updateData.shortUrl = \`\${baseDomain}/s/\${alias}\`;\n      }\n\n      if (typeof isPasswordProtected !== "undefined") updateData.isPasswordProtected = isPasswordProtected;\n      if (typeof password !== "undefined") updateData.password = password;\n\n      if (totalPages !== undefined) updateData.totalPages = Number(totalPages) || 1;`
);

// also for session/init
code = code.replace(
  `res.json({\n        success: true,\n        sessionId,\n        type,\n        status: itemData.status || itemData.Status || "Active",`,
  `res.json({\n        success: true,\n        sessionId,\n        type,\n        isPasswordProtected: itemData.isPasswordProtected === true,\n        status: itemData.status || itemData.Status || "Active",`
);

fs.writeFileSync('server.ts', code);
console.log('patched');
