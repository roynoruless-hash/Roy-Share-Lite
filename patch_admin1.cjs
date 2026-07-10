const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Update smartLinkForm initial state if it's there
code = code.replace(
  `const [smartLinkForm, setSmartLinkForm] = useState({\n    destinationUrl: "",\n    customAlias: "",\n    autoGenerateAlias: true,\n    totalPages: 1,\n    autoRedirect: true,\n    finalRedirectDelay: 0,\n    instructions: "Follow the steps below to reach your destination.",\n    reward: 0,\n    status: "Enabled",\n    pagesConfig: [],\n  });`,
  `const [smartLinkForm, setSmartLinkForm] = useState({\n    destinationUrl: "",\n    isPasswordProtected: false,\n    password: "",\n    customAlias: "",\n    autoGenerateAlias: true,\n    totalPages: 1,\n    autoRedirect: true,\n    finalRedirectDelay: 0,\n    instructions: "Follow the steps below to reach your destination.",\n    reward: 0,\n    status: "Enabled",\n    pagesConfig: [],\n  });`
);

// Add to reset action
code = code.replace(
  `setSmartLinkForm({\n                destinationUrl: "",\n                customAlias: "",\n                autoGenerateAlias: true,\n                totalPages: 1,\n                autoRedirect: true,\n                finalRedirectDelay: 0,\n                instructions: "Follow the steps below to reach your destination.",\n                reward: 0,\n                status: "Enabled",\n                pagesConfig: [],\n              });`,
  `setSmartLinkForm({\n                destinationUrl: "",\n                isPasswordProtected: false,\n                password: "",\n                customAlias: "",\n                autoGenerateAlias: true,\n                totalPages: 1,\n                autoRedirect: true,\n                finalRedirectDelay: 0,\n                instructions: "Follow the steps below to reach your destination.",\n                reward: 0,\n                status: "Enabled",\n                pagesConfig: [],\n              });`
);

// In the payload for create and edit smart link
code = code.replace(
  `body = {\n          ...smartLinkForm,\n          customAlias: smartLinkForm.autoGenerateAlias\n            ? ""\n            : smartLinkForm.customAlias,\n        };`,
  `body = {\n          ...smartLinkForm,\n          customAlias: smartLinkForm.autoGenerateAlias\n            ? ""\n            : smartLinkForm.customAlias,\n        };` // Wait, this will match both create and edit, which is fine since smartLinkForm has isPasswordProtected and password now, they will just be spread.
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('patched admin state');
