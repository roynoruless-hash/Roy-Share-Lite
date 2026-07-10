const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const sourceFile = ts.createSourceFile(
  'src/pages/AdminDashboard.tsx',
  code,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

// We need to walk the tree and find JsxElement / JsxFragment / JsxExpression
// that spans past line 1869
function walk(node, depth = 0) {
    if (!node) return;
    
    // Find unclosed elements. An unclosed JSX element is usually missing its closingElement or has a synthetic one.
    if (ts.isJsxElement(node)) {
        if (!node.closingElement || node.closingElement.pos === node.closingElement.end) {
            const startLine = sourceFile.getLineAndCharacterOfPosition(node.openingElement.getStart()).line + 1;
            console.log(`Possible unclosed JSX element starting at line ${startLine}, tag: ${node.openingElement.tagName.getText()}`);
        }
    } else if (ts.isJsxFragment(node)) {
        if (!node.closingFragment || node.closingFragment.pos === node.closingFragment.end) {
             const startLine = sourceFile.getLineAndCharacterOfPosition(node.openingFragment.getStart()).line + 1;
             console.log(`Possible unclosed JSX fragment starting at line ${startLine}`);
        }
    }

    ts.forEachChild(node, child => walk(child, depth + 1));
}

walk(sourceFile);
