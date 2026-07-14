const fs = require('fs');

let code = fs.readFileSync('/app/applet/src/pages/VideoTaskPage.tsx', 'utf8');

// We need to add state for ClickAdillaConfig and fetch it.
if (!code.includes('clickAdillaConfig')) {
  code = code.replace(
    'const [claiming, setClaiming] = useState(false);',
    'const [claiming, setClaiming] = useState(false);\n  const [clickAdillaConfig, setClickAdillaConfig] = useState<any>(null);'
  );

  const fetchCode = `
  const fetchClickAdillaConfig = async () => {
    try {
      const res = await fetch(\`\${API_BASE}/api/clickadilla-ads-manager\`);
      if (res.ok) {
        const data = await res.json();
        setClickAdillaConfig(data);
      }
    } catch (e) {
      console.error("Failed to load ClickAdilla config:", e);
    }
  };
`;
  
  code = code.replace(
    '  useEffect(() => {',
    fetchCode + '\n  useEffect(() => {\n    fetchClickAdillaConfig();'
  );
}

const scriptInjectionReplacement = `
      // Inject Script dynamically from Global Manager
      if (clickAdillaConfig && scriptContainerRef.current) {
        scriptContainerRef.current.innerHTML = "";
        
        if (clickAdillaConfig.css) {
          const style = document.createElement("style");
          style.innerHTML = clickAdillaConfig.css;
          scriptContainerRef.current.appendChild(style);
        }
        
        if (clickAdillaConfig.html) {
          const div = document.createElement("div");
          div.innerHTML = clickAdillaConfig.html;
          scriptContainerRef.current.appendChild(div);
        }
        
        if (clickAdillaConfig.script) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = clickAdillaConfig.script;
          const scripts = tempDiv.getElementsByTagName('script');
          for (let i = 0; i < scripts.length; i++) {
            const newScript = document.createElement('script');
            if (scripts[i].src) newScript.src = scripts[i].src;
            newScript.innerHTML = scripts[i].innerHTML;
            newScript.async = true;
            scriptContainerRef.current.appendChild(newScript);
          }
        }
      } else if (task.clickadillaScript && scriptContainerRef.current) {
        // Fallback for old tasks
        scriptContainerRef.current.innerHTML = "";
        const template = document.createElement('template');
        template.innerHTML = task.clickadillaScript;
        const scripts = template.content.querySelectorAll('script');
        scripts.forEach(script => {
          const newScript = document.createElement('script');
          Array.from(script.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
          newScript.innerHTML = script.innerHTML;
          scriptContainerRef.current?.appendChild(newScript);
        });
      }
`;

if (code.includes('if (task.clickadillaScript')) {
  code = code.replace(
    /if \(task\.clickadillaScript[\s\S]*?\/\/ Listen for postback/m,
    scriptInjectionReplacement + '\n      // Listen for postback'
  );
}


fs.writeFileSync('/app/applet/src/pages/VideoTaskPage.tsx', code);
console.log("Patched VideoTaskPage.tsx script injection");
