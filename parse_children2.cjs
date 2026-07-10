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
    console.log(`Expression at line 1899 found. Type: ${ts.SyntaxKind[loadingExpr.expression.kind]}`);
    if (ts.isConditionalExpression(loadingExpr.expression)) {
       const cond = loadingExpr.expression;
       console.log("When false type:", ts.SyntaxKind[cond.whenFalse.kind]);
       
       if (ts.isConditionalExpression(cond.whenFalse)) {
           const cond2 = cond.whenFalse;
           console.log("Nested whenFalse type:", ts.SyntaxKind[cond2.whenFalse.kind]);
           
           if (ts.isParenthesizedExpression(cond2.whenFalse) && ts.isJsxFragment(cond2.whenFalse.expression)) {
               console.log("Found fragment!");
               const frag = cond2.whenFalse.expression;
               console.log(`Fragment ends at line ${sourceFile.getLineAndCharacterOfPosition(frag.getEnd()).line + 1}`);
               
               // Look for unclosed tags inside the fragment
               // The fragment contains all the tabs!
               frag.children.forEach(c => {
                   if (ts.isJsxExpression(c)) {
                       const expr = c.expression;
                       if (expr && ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
                           console.log(`Tab section ends at line ${sourceFile.getLineAndCharacterOfPosition(c.getEnd()).line + 1}`);
                       }
                   }
               });
           }
       }
    }
} else {
    console.log("Loading expression not found");
}

