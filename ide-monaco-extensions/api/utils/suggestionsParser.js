var contentManager = require("platform/v4/registry");
var acorn = require("acornjs/acorn");

String.prototype.replaceAll = function(search, replacement) {
    return this.replace(new RegExp(search, 'g'), replacement);
};

exports.parse = function(moduleName) {
    var content = contentManager.getText(moduleName + ".js");
    var comments = [];
    var nodes = acorn.parse(content, {
        onComment: comments,
        ranges: true
    });

    let objects = getObjects(nodes.body);
    let functions = getFunctions(nodes.body);
    let transformedFunctions = {};

    for (let i = 0; i < functions.length; i ++) {
        let func = transformFunction(functions[i], comments);
        addTransformedFunction(transformedFunctions, "exports", func);
    }

    for (let i = 0; i < objects.length; i ++) {
        getFunctions(objects[i].body.body).forEach(next => {
            let func = transformFunction(next, comments);
            addTransformedFunction(transformedFunctions, objects[i].id.name, func);
        });
    }

    return transformedFunctions;
}

function getObjects(body) {
    return body.filter(e => e.type === "FunctionDeclaration");
}

function getFunctions(body) {
    return body.filter(e => {
        let isFunction = false;
        if (e.type === "ExpressionStatement" && e.expression.type === "AssignmentExpression") {
            if (e.expression.operator === "=" && e.expression.left.object.name === "exports" || e.expression.left.object.type === "ThisExpression") {
                isFunction = true;
            }
        }
        return isFunction;
    });
}

function transformFunction(func, comments) {
    return {
        id: func.expression.left.property.name,
        params: getParams(func),
        documentation: getDocumentation(func, comments),
        returnType: getReturnType(func),
        isFunction: func.expression.right.type === "FunctionExpression"
    };
}

function addTransformedFunction(transformedFunctions, objectName, func) {
    if (!transformedFunctions[objectName]) {
        transformedFunctions[objectName] = {};
    }
    let functionId = func.id;
    if (func.isFunction) {
        func.definition = `${functionId}(${func.params.join(", ")})`;
    } else {
        func.definition = functionId;
    }
    delete func.id;

    transformedFunctions[objectName][functionId] = func;
    let documentation;
    if (func.documentation) {
        documentation = func.documentation.value;
    } else {
        documentation = transformedFunctions[objectName][functionId].definition;
    }
    transformedFunctions[objectName][functionId].documentation = formatDocumentation(documentation);
}

function getParams(func) {
    let params = func.expression.right.params;
    return params && params.length > 0 ? params.map(e => e.name) : [];
}

function getDocumentation(func, comments) {
    let selectedComments = comments.filter(e => e.end < func.expression.start && e.end + 12 >= func.expression.start);
    return selectedComments && selectedComments.length > 0 ? selectedComments[selectedComments.length - 1] : {}
}

function getReturnType(func) {
    let returnType = "void";
    if (func.expression && func.expression.right && func.expression.right.body && func.expression.right.body.body) {
        let returnStatement = func.expression.right.body.body.filter(e => e.type === "ReturnStatement")[0];
        if (returnStatement && returnStatement.argument && returnStatement.argument.type === "NewExpression") {
            // Do something
            returnType = returnStatement.argument.callee.name;
            console.error(JSON.stringify(returnType));
        }
        return returnType;
    }
}

function formatDocumentation(documentation) {
    return documentation ? documentation.replaceAll("\\*", "") : documentation;
}
