const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const sourceFile = ts.createSourceFile('AdminDashboard.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

let loadingExpr = null;

function walk(node) {
    if (ts.isJsxExpression(node)) {
        const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        if (startLine === 1899) {
            loadingExpr = node;
            return;
        }
    }
    ts.forEachChild(node, walk);
}
walk(sourceFile);

if (loadingExpr) {
    let cond = loadingExpr.expression;
    console.log(`Cond 1 type: ${ts.SyntaxKind[cond.kind]}`);
    cond = cond.whenFalse;
    console.log(`Cond 2 type: ${ts.SyntaxKind[cond.kind]}`);
    cond = cond.whenFalse;
    console.log(`Cond 3 type: ${ts.SyntaxKind[cond.kind]}`);
    cond = cond.whenFalse;
    console.log(`Cond 4 type: ${cond ? ts.SyntaxKind[cond.kind] : 'undefined'}`);
    
}
