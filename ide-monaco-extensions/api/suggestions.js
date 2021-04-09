var response = require("http/v4/response");
var request = require("http/v4/request");
var suggestionsParser = require("ide-monaco-extensions/api/utils/suggestionsParser");

var suggestions = suggestionsParser.parse(request.getParameter("moduleName"));

response.print(JSON.stringify(suggestions));
response.flush();
response.close();
