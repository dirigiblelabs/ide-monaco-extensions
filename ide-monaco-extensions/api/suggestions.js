var response = require("http/v4/response");
var request = require("http/v4/request");
var simpleRequire = require("ide-monaco-extensions/api/utils/simpleRequire");

var suggestions = [];

var module = simpleRequire.load(request.getParameter("moduleName"));

for (var i in module) {
	var functionText = module[i].toString();
	var suggestion = i + functionText.substring(functionText.indexOf("("), functionText.indexOf(")") + 1);
	var suggestionDescription = suggestion;
	suggestions.push({
		name: suggestion,
		description: suggestionDescription
	});
}

response.print(JSON.stringify(suggestions));
response.flush();
response.close();