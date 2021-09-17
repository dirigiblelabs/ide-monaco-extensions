let response = require("http/v4/response");
let modulesParser = require("ide-monaco-extensions/api/utils/modulesParser");

let modules = modulesParser.getModules();

response.println(JSON.stringify(modules));