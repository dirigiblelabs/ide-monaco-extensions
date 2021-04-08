var acorn = require("acornjs/acorn");
var workspaceManager = require("platform/v4/workspace");

exports.parse = function(workspaceName, projectName, filePath) {
    let parsed = acorn.parse(getFile(workspaceName, projectName, filePath));
    flatParsedBody(parsed);

    let requires = getRequires(parsed);
    let assignments = getAssignments(requires, parsed);;
    let allAssignments = Object.assign({}, assignments);

    do {
        assignments = getAssignments(assignments, parsed);
        allAssignments = Object.assign(allAssignments, assignments);
    } while (!isEmptyObject(assignments));

    return allAssignments;
};

function getFile(workspaceName, projectName, filePath) {
    let workspace = workspaceManager.getWorkspace(workspaceName);
    let project = workspace.getProject(projectName);
    let file = project.getFile(filePath);
    return file.getText();
}

function getAssignments(requires, parsed) {
    let assignments = {};
    parsed.body.filter(e => {
        let isAssignments = false;
        
        if (e.type === "VariableDeclaration") {
            isAssignments = e.declarations.filter(declaration => {
                return declaration  && declaration.init && declaration.init.callee
                    && declaration.init.callee.type && declaration.init.callee.object
                    && declaration.type === "VariableDeclarator"
                    && declaration.init.type === "CallExpression"
                    && declaration.init.callee.type === "MemberExpression"
                    && Object.keys(requires).includes(declaration.init.callee.object.name)
            }).length > 0;
        }
        return isAssignments;
    }).forEach(e => {
        let keyword = e.declarations[0].id.name;
        let parentVariable = e.declarations[0].init.callee.object.name;
        let method = e.declarations[0].init.callee.property.name;
        assignments[keyword] = {
            parentVariable: parentVariable,
            parentModule: requires[parentVariable],
            method: method
        };
    });
    return assignments;
}

function getRequires(parsed) {
    let requires = {};
    parsed.body.filter(e => {
        let isRequire = false;
        
        if (e.type === "VariableDeclaration") {
            isRequire = e.declarations.filter(declaration => {
                return declaration  && declaration.init && declaration.init.callee
                    && declaration.type === "VariableDeclarator"
                    && declaration.init.type === "CallExpression"
                    && declaration.init.callee.name === "require";
            }).length > 0;
        }
        return isRequire;
    }).forEach(e => {
        let keyword = e.declarations[0].id.name;
        let module = e.declarations[0].init.arguments[0].value
        requires[keyword] = module;
    });
    return requires;
}

function flatParsedBody(parsed) {
    flatTryStatement(parsed);
    parsed.body.filter(e => e.type === "FunctionDeclaration")
    .forEach(e => {
        parsed.body = parsed.body.concat(e.body.body);
        flatTryStatement(e.body);
        parsed.body = parsed.body.concat(e.body.body);
    });
}

function flatTryStatement(parsed) {
    parsed.body.filter(e => e.type === "TryStatement")
    .forEach(e => {
        parsed.body = parsed.body.concat(e.block.body);
        parsed.body = parsed.body.concat(e.handler.body);
        parsed.body = parsed.body.concat(e.finalizer.body);
    });
}


function isEmptyObject(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object
}