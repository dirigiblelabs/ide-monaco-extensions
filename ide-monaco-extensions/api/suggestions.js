var response = require("http/v4/response");
var request = require("http/v4/request");
var suggestionsParser = require("ide-monaco-extensions/api/utils/suggestionsParser");

var suggestions = suggestionsParser.parse(request.getParameter("moduleName"));

var secondLevelSuggestions = [];

suggestions
    .filter(e => e.returnType)
    .forEach(function(e) {
        e.returnType.functions.forEach(function(f) {
            f.parent = e.name.substring(0, e.name.indexOf("("));
            f.fqn = e.name + "." + f.name
        });
        secondLevelSuggestions = secondLevelSuggestions.concat(e.returnType.functions);
    });

suggestions = suggestions.concat(secondLevelSuggestions);

response.print(JSON.stringify(suggestions));
response.flush();
response.close();
