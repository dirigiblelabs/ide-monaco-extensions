var response = require("http/v4/response");
var extensions = require("core/v4/extensions");
var modulesParser = require("ide-monaco-extensions/api/utils/modulesParser");

var modules = [];
var apiModulesExtensions = extensions.getExtensions("api-modules");

apiModulesExtensions.forEach(function(apiModule) {
	var module = require(apiModule);
	modules = modules.concat(module.getContent());
});

let repositoryModules = modulesParser.getModules();
modules = modules.concat(repositoryModules);

response.println(JSON.stringify(modules));