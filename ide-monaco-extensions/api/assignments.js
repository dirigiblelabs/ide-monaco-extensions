var response = require("http/v4/response");
var request = require("http/v4/request");
var assignmentsParser = require("ide-monaco-extensions/api/utils/assignmentsParser");

var file = request.getParameter("file");

if (!file) {
    throw new Error("Missing 'file' query parameter");
}

var workspaceName = file.substring(1, file.indexOf("/", 1));
var workspaceIndex = file.indexOf(workspaceName) + workspaceName.length + 1;
var projectName = file.substring(file.indexOf(workspaceName) + workspaceName.length + 1, file.indexOf("/", workspaceIndex));
var filePath = file.substring(file.indexOf(projectName) + projectName.length);

var assignments = assignmentsParser.parse(workspaceName, projectName, filePath);

response.print(JSON.stringify(assignments));
response.flush();
response.close();
