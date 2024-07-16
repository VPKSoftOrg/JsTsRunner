/*
MIT License

Copyright (c) 2024 VPKSoft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { save, SaveDialogOptions } from "@tauri-apps/plugin-dialog";
import { FileTabData, ScriptType } from "../../components/Types";
import { LocalizeFunction } from "../../localization/Localization";
import { saveFileContents } from "../../components/app/TauriWrappers";
import { NotificationType } from "./Notify";

/**
 * Generates a new tab with the given script language and file name.
 *
 * @param {ScriptType} script_language - The script language of the new tab.
 * @param {string} newFileName - The name of the file for the new tab.
 * @return {FileTabData} The newly generated tab.
 */
const genNewTab = (script_language: ScriptType, newFileName: string): FileTabData => {
    return {
        uid: 0,
        path: null,
        is_temporary: true,
        script_language: script_language,
        content: null,
        file_name: newFileName,
        modified_at: null,
        file_name_path: null,
        modified_at_state: new Date(),
        evalueate_per_line: false,
    };
};

/**
 * Saves the contents of the active tab to the file.
 * @param {FileTabData} tab - The tab to save.
 * @param {string | null} fileNamePath - The name and path of the file to save.
 * @returns {Promise<boolean>} A value indicating whether the file contents were saved successfully.
 */
const saveTab = async (
    activeTabKey: number,
    fileTabs: FileTabData[],
    translate: LocalizeFunction,
    saveAppStateReload: () => Promise<void>,
    notification: (type: NotificationType, title: string | null | undefined | Error | unknown, duration?: number) => void
): Promise<boolean> => {
    const index = fileTabs.findIndex(f => f.uid === activeTabKey);
    if (index !== -1) {
        const tab = fileTabs[index];
        if (tab.file_name_path === null) {
            try {
                const fileName = await save(getDialogFilter(translate, tab));
                if (fileName) {
                    try {
                        try {
                            await saveFileContents(tab, fileName);
                            await saveAppStateReload();
                        } catch (error) {
                            notification("error", error);
                            return false;
                        }
                    } catch (error) {
                        notification("error", error);
                        return false;
                    }
                } else {
                    return false;
                }
            } catch (error) {
                notification("error", error);
                return false;
            }
        } else {
            try {
                await saveFileContents(tab, tab.file_name_path);
                await saveAppStateReload();
            } catch (error) {
                notification("error", error);
                return false;
            }
        }
    }

    return true;
};

/**
 * Returns the save dialog filter.
 * @param {FileTabData} data - The file tab data.
 * @returns {SaveDialogOptions} The save dialog filter.
 */
const getDialogFilter = (translate: LocalizeFunction, data: FileTabData): SaveDialogOptions => {
    const result: SaveDialogOptions =
        data.script_language === "typescript"
            ? { filters: [{ name: translate("typeScriptFiles", "TypeScript files"), extensions: ["ts"] }] }
            : { filters: [{ name: translate("javaScriptFiles", "JavaScript files"), extensions: ["js"] }] };

    result.defaultPath = data.file_name_path ?? data.file_name;

    return result;
};

/**
 * Returns the open dialog filter.
 * @returns {OpenDialogOptions} The open dialog filter.
 */
const getOpenDialogFilter = (translate: LocalizeFunction) => ({ filters: [{ name: translate("scriptFiles", "Script Files"), extensions: ["js", "ts"] }] });

export { genNewTab, saveTab, getDialogFilter, getOpenDialogFilter };
