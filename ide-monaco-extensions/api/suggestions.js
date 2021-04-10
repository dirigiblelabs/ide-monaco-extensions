var response = require("http/v4/response");
var request = require("http/v4/request");
var repository = require("platform/v4/repository");
var config = require("core/v4/configurations");
var modulesParser = require("ide-monaco-extensions/api/utils/modulesParser");
var suggestionsParser = require("ide-monaco-extensions/api/utils/suggestionsParser");

const PATH_REGISTRY_PUBLIC = "/registry/public";
const MODULE_INFO_PREFIX = "MODULE_INFO_";

let moduleName = request.getParameter("moduleName");
let moduleInfo = loadModuleInfo(moduleName);

try {
    let resource = repository.getResource(`${PATH_REGISTRY_PUBLIC}/${moduleName}.js`);
    let information = resource.getInformation();
    let lastModifiedAt = information.getModifiedAt().getTime();
    if (isEmptyObject(moduleInfo) || moduleInfo.lastModifiedAt < lastModifiedAt) {
        moduleInfo = {
            moduleName: moduleName,
            lastModifiedAt: lastModifiedAt,
            suggestions: suggestionsParser.parse(moduleName)
        }
        saveModuleInfo(moduleInfo);
    }
} catch (e) {
    console.error(`Error occured ${e}`);
}

response.print(JSON.stringify(moduleInfo.suggestions));
response.flush();
response.close();

function loadModuleInfo(moduleName) {
    return JSON.parse(config.get(MODULE_INFO_PREFIX + moduleName, "{}"));
}

function saveModuleInfo(moduleInfo) {
    config.set(`${MODULE_INFO_PREFIX}${moduleInfo.moduleName}`, JSON.stringify(moduleInfo));
}

function isEmptyObject(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object
}