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

let deepestNode = null;
let maxDepth = 0;

function visit(node, depth) {
  if (node.kind === ts.SyntaxKind.JsxElement || node.kind === ts.SyntaxKind.JsxOpeningElement) {
    // We can print out JsxElements that are unclosed... wait, the parser creates a tree, if there's a syntax error, it recovers.
    // Let's just find syntax errors.
  }
  ts.forEachChild(node, child => visit(child, depth + 1));
}
visit(sourceFile, 0);

const diagnostics = sourceFile.parseDiagnostics;
if (diagnostics.length) {
  diagnostics.forEach(d => {
    const pos = sourceFile.getLineAndCharacterOfPosition(d.start);
    console.log(`Line ${pos.line + 1}: ${d.messageText}`);
  });
}
