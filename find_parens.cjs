const fs = require('fs');
const ts = require('typescript');

const file = 'src/pages/AdminDashboard.tsx';
const code = fs.readFileSync(file, 'utf8');

const sourceFile = ts.createSourceFile(
  file,
  code,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

function visit(node) {
  // we just want to see if the AST has any missing parens, but TS recovers.
  // Let's just print all Diagnostics.
}

const diagnostics = sourceFile.parseDiagnostics;
diagnostics.forEach(d => {
  const pos = sourceFile.getLineAndCharacterOfPosition(d.start);
  console.log(`Line ${pos.line + 1}: ${d.messageText}`);
});
