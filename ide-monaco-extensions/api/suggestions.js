var response = require("http/v4/response");
var request = require("http/v4/request");
var repository = require("platform/v4/repository");
var config = require("core/v4/configurations");
var modulesParser = require("ide-monaco-extensions/api/utils/modulesParser");
var suggestionsParser = require("ide-monaco-extensions/api/utils/suggestionsParser");

const PATH_REGISTRY_PUBLIC = "/registry/public";
const MODULE_INFO_PREFIX = "MODULE_INFO_";

let moduleName = request.getParameter("moduleName");
let info = loadModulesInfo();

let suggestions = info[moduleName];
if (!suggestions) {
    let modules = modulesParser.getModules();
    modules.forEach(e => {
        try {
            let resource = repository.getResource(`${PATH_REGISTRY_PUBLIC}/${e.name}.js`);
            let information = resource.getInformation();
            let lastModifiedAt = information.getModifiedAt().getTime();
            if (!info[e.name] || (info[e.name].lastModifiedAt < lastModifiedAt)) {
                info[e.name] = {
                    lastModifiedAt: lastModifiedAt,
                    suggestions: suggestionsParser.parse(e.name)
                }
            }
        } catch(e) {
            console.error(`Error occured ${e}`);
        }
    });
    saveModulesInfo(info);
    suggestions = info[moduleName];
}

response.print(JSON.stringify(suggestions));
response.flush();
response.close();

function loadModulesInfo() {
    let modulesInfo = {};
    let keys = config.getKeys();
    let configKeys = [];
    for (let i = 0 ; i < keys.length; i ++) {
        configKeys.push(keys[i]);
    }
    let modules = configKeys.filter(e => e.startsWith(MODULE_INFO_PREFIX));
    modules.forEach(e => {
        let moduleId = e.substring(MODULE_INFO_PREFIX.length);
        modulesInfo[moduleId] = JSON.parse(config.get(e));
    });
    return modulesInfo;
}

function saveModulesInfo(modulesInfo) {
    for (let next in modulesInfo) {
        let moduleData = JSON.stringify(modulesInfo[next]);
        config.set(`${MODULE_INFO_PREFIX}${next}`, moduleData)
    }
}