const {access} = require('fs/promises');
const {constants} = require('fs');
const _ = require('underscore');

const _isBad = (value) => {
    return _.isUndefined(value) || _.isNull(value) || _.isEmpty(value)
}

const _exit = () => {
    console.log("please provide at most 2 files (1 settings file, 1 environment file)");
    process.exit();
}

const _fileExists = async (file) => {
    try {
        await access(_mergeFile, constants.R_OK | constants.W_OK);
        return true;
    } catch(error){
        return false;
    }
}

const files = process.argv.slice(2);
if(files.length < 1 || files.length > 2) _exit();
const _envFile = _.find(files, (_file) => {return _file.includes('env')});
const _settingsFile = _.find(files, (_file) => {return _file !== _envFile});
let _path = _envFile.split('/');
_path.pop();
const _mergeFile = `${_path.join('/')}/merge.json`;
if(_isBad(_envFile)) _exit();
const settingsFile = _settingsFile ? require(_settingsFile) : {};
const envFile = _envFile ? require(_envFile) : {};
const _merge = _fileExists(_mergeFile) ? require(_mergeFile) : [];
_merge.forEach((key) => {
    if(_.isString(key) && envFile[key]) settingsFile[key] = envFile[key];
    if(_.isObject(key) && envFile[key.key]) settingsFile[key.parent][key.key] = envFile[key.key];
});
if(_settingsFile) envFile.METEOR_SETTINGS = settingsFile;

const stringifiedArray = _.keys(envFile).map((key) => {
    let value = envFile[key];
    if(!_.isBoolean(value) && !_.isNumber(value) && !_.isArray(value) && !_.isObject(value)){
        value = value.replace(/(^")|("$)/g, "");
        return `${key}=${value}`;
    }
    if(_.isObject(value) || _.isArray(value)){
        
        return `${key}="${JSON.stringify(value)}"`;
    }
    return `${key}=${value}`;
});
/*
stringifiedArray.forEach((string) => {
    console.log(string);
});
*/
console.log(`"${stringifiedArray.join("\n")}"`);
process.exit();
