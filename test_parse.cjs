const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const sourceFile = ts.createSourceFile('AdminDashboard.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function getLine(pos) {
    return sourceFile.getLineAndCharacterOfPosition(pos).line + 1;
}

let target = null;
function walk(node) {
    if (ts.isJsxElement(node)) {
        if (node.openingElement.tagName.getText() === 'div' && getLine(node.getStart()) === 1909) {
            target = node;
            return;
        }
    }
    ts.forEachChild(node, walk);
}
walk(sourceFile);

if (target) {
    console.log("Target div found!");
    // count children
    target.children.forEach(c => {
         const startLine = getLine(c.getStart());
         let type = 'unknown';
         if (ts.isJsxElement(c)) type = `element ${c.openingElement.tagName.getText()}`;
         else if (ts.isJsxExpression(c)) type = 'expression';
         else if (ts.isJsxText(c)) {
             if (c.getText().trim() === '') return;
             type = 'text';
         }
         else if (ts.isJsxSelfClosingElement(c)) type = `self-closing ${c.tagName.getText()}`;
         
         console.log(`Child: ${type} at line ${startLine}`);
    });
}
