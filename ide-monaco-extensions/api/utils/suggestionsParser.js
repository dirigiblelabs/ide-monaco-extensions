var contentManager = require("repository/v4/content");
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

    var functionDeclarations = nodes.body
        .filter(e => e.type === "FunctionDeclaration")
        .map(function(element) {
            let name = element.id.name;
            let expression = element.expression
            let functions = element.body.body
                .filter(e => e.type === "ExpressionStatement")
                .map(e => extractExpression(e, comments))
                .filter(e => e !== null);
            return {
                name: name,
                functions: functions
            }
        });

    var result = nodes.body
        .filter(e => e.type === "ExpressionStatement")
        .map(function(element) {
            return extractExpression(element, comments, functionDeclarations);
        }).filter(e => e !== null);

    return result;
}

function extractExpression(element, comments, functionDeclarations) {
    let expression = element.expression;
    if (expression && expression.type === "AssignmentExpression" && expression.operator === "=") {
        let left = expression.left;
        let right = expression.right;
        if (right.type === "FunctionExpression") {
            let properties = right.params.map(e => e.name);
            let name = left.property.name + "(" + properties.join(", ") + ")"; 
            let documentation = extractDocumentation(comments, element, name);
            documentation = formatDocumentation(documentation, name, true);
            let returnStatement = right.body.body.filter(e => e.type === "ReturnStatement")[0];
            let returnType = null;
            if (functionDeclarations && returnStatement && returnStatement.argument.type === "NewExpression") {
                returnType = returnStatement.argument.callee.name;
                returnType = functionDeclarations.filter(e => e.name === returnType)[0];
            }
            return {
                name: name,
                documentation: documentation,
                returnType: returnType,
                isFunction: true
            };
        } else if (right.type === "Literal") {
            let name = left.property.name;
            let documentation = extractDocumentation(comments, element, name);
            documentation = formatDocumentation(documentation, name, false);
            return {
                name: name,
                documentation: documentation,
                isProperty: true
            };
        }
    }
    return null;
}

function extractDocumentation(comments, element, defaultDocumentation) {
    let documentation = comments.filter(function(comment) {
        if (comment.type === "Block") {
            let diff = element.start - comment.end;
            return  diff > 0 && diff <= 10;
        }
        return false;
    })[0];  
    return documentation ? documentation.value : defaultDocumentation;
}

function formatDocumentation(documentation, expression, isFunction) {
    return [
        "```javascript",
        (isFunction ? "function " : "") + expression,
        "```",
        "",
        "---",
        documentation.replaceAll("\\*", "")
    ].join("\n");
}
