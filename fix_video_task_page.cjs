const fs = require('fs');

let code = fs.readFileSync('/app/applet/src/pages/VideoTaskPage.tsx', 'utf8');

const startStr = '// Inject Script dynamically';
const endStr = '// Listen for postback';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newInjection = `// Inject Script dynamically from Global Manager
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
      
      code = code.substring(0, startIndex) + newInjection + code.substring(endIndex);
      fs.writeFileSync('/app/applet/src/pages/VideoTaskPage.tsx', code);
      console.log("Successfully patched video injection logic");
} else {
  console.log("Could not find start/end string");
}

