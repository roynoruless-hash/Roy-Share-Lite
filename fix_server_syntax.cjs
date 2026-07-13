const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const badString = `</script>
</body>
</html>\`);
} catch (err) {
          console.error("Heartbeat sync error:", err);
        }
      }, 5000);
    });
  </script>
</body>
</html>\`);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});`;

const goodString = `</script>
</body>
</html>\`);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});`;

if (code.includes(badString)) {
  code = code.replace(badString, goodString);
  fs.writeFileSync('server.ts', code);
  console.log("Fixed!");
} else {
  console.log("Could not find exact bad string, trying regex...");
  const regex = /<\/script>\s*<\/body>\s*<\/html>`\);\s*} catch \(err\) \{\s*console\.error\("Heartbeat sync error:", err\);\s*}\s*},\s*5000\);\s*}\);\s*<\/script>\s*<\/body>\s*<\/html>`\);/g;
  code = code.replace(regex, `</script>
</body>
</html>\`);`);
  fs.writeFileSync('server.ts', code);
  console.log("Fixed via regex");
}
