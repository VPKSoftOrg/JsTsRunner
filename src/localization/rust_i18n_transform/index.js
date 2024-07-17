#!/usr/bin/env node
"use strict";
// A script to transform i18n json files to Rust rust-i18n crate supported format.
Object.defineProperty(exports, "__esModule", { value: true });
var promises_1 = require("node:fs/promises");
var node_path_1 = require("node:path");
var node_fs_1 = require("node:fs");
var commander_1 = require("commander");
commander_1.program
    .version("0.1.0") //
    .description("i18n transform for Rust")
    .option("-s, --source [dir]", "Source directory", "../../")
    .option("-d, --destination [dir]", "Destination directory", "../../../../src-tauri/locales")
    .parse();
var baseDir = import.meta.dirname;
var sourceDir = node_path_1.default.join(baseDir, commander_1.program.opts().source);
var destinationDir = node_path_1.default.join(baseDir, commander_1.program.opts().destination);
var dirents = await (0, promises_1.readdir)(node_path_1.default.join(sourceDir), { withFileTypes: true });
var locales = dirents
    .filter(function (f) { return f.isDirectory(); })
    .filter(function (f) { return f.name.length === 2; })
    .map(function (f) { return f.name; });
for (var _i = 0, locales_1 = locales; _i < locales_1.length; _i++) {
    var locale = locales_1[_i];
    var destinationLocale = { _version: 1 };
    var localeFiles = await (0, promises_1.readdir)(node_path_1.default.join(sourceDir, locale));
    for (var _a = 0, localeFiles_1 = localeFiles; _a < localeFiles_1.length; _a++) {
        var file = localeFiles_1[_a];
        var contents = (0, node_fs_1.readFileSync)(node_path_1.default.join(sourceDir, locale, file), { encoding: "utf8" });
        var jsonContent = JSON.parse(contents);
        for (var _b = 0, _c = Object.entries(jsonContent); _b < _c.length; _b++) {
            var _d = _c[_b], key = _d[0], value = _d[1];
            destinationLocale["".concat(node_path_1.default.parse(file).name, ".").concat(key)] = value.replaceAll(/({{)(.*?)(}})/g, "%{$2}");
        }
    }
    var json = JSON.stringify(destinationLocale, null, 4);
    if (!(0, node_fs_1.existsSync)(destinationDir)) {
        (0, node_fs_1.mkdirSync)(destinationDir);
    }
    (0, node_fs_1.writeFileSync)(node_path_1.default.join(destinationDir, "".concat(locale, ".json")), json);
}
