const esprima = require('esprima');

const type = {
    Program,
    ExpressionStatement,
    LogicalExpression,
    BinaryExpression,
    Identifier,
    Literal,
    MemberExpression,
    CallExpression,
    UnaryExpression,
};

function _getAge(credentialNo) {
    return 29;
}

const builtIn = {
    _getAge,
};

function Program(node, scope, params) {
    return ast_excute(node.body[0], scope, params);
}

function ExpressionStatement(node, scope, params) {
    return ast_excute(node.expression, scope, params);
}

function LogicalExpression(node, scope, params) {
    const left = ast_excute(node.left, scope, params);
    const right = ast_excute(node.right, scope, params);
    switch (node.operator) {
    case '||':
        return left || right;
    case '&&':
        return left && right;
    default:
        return `LogicalExpression operator ${node.operator} is not defined`;
    }
}

function BinaryExpression(node, scope, params) {
    const left = ast_excute(node.left, scope, params);
    const right = ast_excute(node.right, scope, params);
    switch (node.operator) {
    case '||':
        return left || right;
    case '&&':
        return left && right;
    case '===':
        return left === right;
    case '!==':
        return left !== right;
    case '>':
        return left > right;
    case '>=':
        return left >= right;
    case '<':
        return left < right;
    case '<=':
        return left <= right;
    default:
        return `BinaryExpression operator ${node.operator} is not defined`;
    }
}

function Identifier(node, scope, { arg = [] }) {
    switch (node.name) {
    case 'stringify':
        return JSON.stringify(...arg); // 这个要判断是JSON.stringify
    case 'parse':
        return JSON.parse(...arg); // 这个要判断是JSON.parse
    case 'indexOf':
        return scope.indexOf(...arg);
    default:
        if (builtIn[node.name]) {
            return builtIn[node.name](...arg);
        }
        return scope[node.name];
    }
}

function Literal(node, scope, { computed = false }) {
    if (computed) {
        return scope[node.value];
    }
    return node.value;
}

function MemberExpression(node, scope, params) {
    scope = ast_excute(node.object, scope, params);
    params.computed = node.computed;
    return ast_excute(node.property, scope, params);
}

function CallExpression(node, scope, params) {
    let arg = [];
    arg = node.arguments.map((a) => ast_excute(a, scope, params));
    const result = ast_excute(node.callee, scope, { arg });
    return result;
}

function UnaryExpression(node, scope, params) {
    const value = ast_excute(node.argument, scope, params);
    return node.operator + value;
}

// eslint-disable-next-line camelcase
function ast_excute(astCode, scope, params = {}) {
    return type[astCode.type].call(this, astCode, scope, params);
}

// const program = 'modx === "MONTH" && comboCode === "PH0123"';
// const program = 'insurantList[0].name === "sss" && comboCode === "PH0123" && (modx === "SINGLE" || applicant.name === "sss1")';
// const program = 'insurantList[0].name === "sss1" || comboCode === "PH0124"';
const program = '(_getAge(insurantList[0].credentialNo) >= 30 && _getAge(insurantList[0].credentialNo) <= 40) && (collectPeriod === "10Y" || collectPeriod === "30Y" )';
// const program = 'JSON.stringify(insurantList).indexOf("222") > -1';
// const program = 'JSON.stringify(insurantList).indexOf(comboCode) > -1';
const astCode = esprima.parseScript(program);
console.log('=======parseScript', JSON.stringify(astCode, null, 4));
const formValue = {
    applicant: {
        name: 'sss',
        credentialNo: '12343',
        telephone: '1111',
    },
    insurantList: [{
        name: 'sss',
        credentialNo: '12343',
        telephone: '1111',
    }],
    modx: 'MONTH',
    comboCode: '12343',
    collectPeriod: '10Y',
};
const result = ast_excute(astCode, { ...formValue });

console.log('=======ast_excute==result', result);
// class Ast {
//     run(astCode, scope) {
//         const node = astCode.body[0];
//         type[node.type].call(this, node, scope);
//     }
// }

// Ast.run(astCode, { formValue });

// todo loadsh内置；计算结果缓存（或者内置函数中结果缓存）； 搞成单独的git项目