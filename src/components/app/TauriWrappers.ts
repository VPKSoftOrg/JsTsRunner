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

import { invoke } from "@tauri-apps/api/core";
import { FileTabData } from "../Types";

type AppStateResult = {
    log_stack: string[];
    file_ids: number[];
    file_tabs: FileTabData[];
};

/**
 * Executes a script using the Tauri API and V8.
 *
 * @param {string} code - The script code to execute.
 * @return {Promise<string>} The result of the script execution.
 */
const runScript = async (code: string): Promise<string> => {
    try {
        return await invoke("run_script", { code });
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Gets the application state from the Tauri API.
 * @returns {Promise<AppStateResult>} The application state.
 * @throws {Error} If the Tauri API call fails.
 */
const getAppState = async (): Promise<AppStateResult> => {
    try {
        return await invoke("get_app_state");
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Adds a new tab to the application.
 * @param {FileTabData} tab_data - The tab data to add.
 * @returns {Promise<boolean>} A value indicating whether the tab was added successfully.
 * @throws {Error} If the Tauri API call fails.
 */
const addNewTab = async (tab_data: FileTabData) => {
    try {
        return await invoke("add_new_tab", { tabData: tab_data });
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Saves the open tabs using the Tauri API call.
 * @returns {Promise<boolean>} A value indicating whether the tabs were saved successfully.
 * @throws {Error} If the Tauri API call fails.
 */
const saveOpenTabs = async (): Promise<boolean> => {
    try {
        return await invoke("save_open_tabs");
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Updates the open tabs using the Tauri API call.
 * @param {FileTabData[]} tabs - The tabs to update.
 * @returns {Promise<boolean>} A value indicating whether the tabs were updated successfully.
 * @throws {Error} If the Tauri API call fails.
 */
const updateOpenTabs = async (tabs: FileTabData[]): Promise<boolean> => {
    try {
        return await invoke("update_open_tabs", { tabData: tabs });
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Loads the file state using the Tauri API call into the Rust backend state.
 * @returns {Promise<boolean>} A value indicating whether the file state was loaded successfully.
 * @throws {Error} If the Tauri API call fails.
 */
const loadFileState = async (): Promise<boolean> => {
    try {
        return await invoke("load_file_state");
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Gets a new tab unique id using the Tauri API call.
 * @returns {Promise<number>} The new tab unique id.
 * @throws {Error} If the Tauri API call fails.
 */
const getNewTabId = async (): Promise<number> => {
    try {
        return await invoke("get_new_tab_id");
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Opens an existing file using the Tauri API call.
 * @param {string} fileName - The name of the file to open.
 * @returns {Promise<boolean>} A value indicating whether the file was opened successfully.
 * @throws {Error} If the Tauri API call fails.
 */
const openExistingFile = async (fileName: string): Promise<boolean> => {
    try {
        return invoke("open_existing_file", { fileName });
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Checks if a file has changed in the file system using the Tauri API call.
 * @param {FileTabData} data - The file data to check.
 * @returns {Promise<boolean>} A value indicating whether the file has changed in the file system.
 * @throws {Error} If the Tauri API call fails.
 */
const isFileChangedInFs = async (data: FileTabData): Promise<boolean> => {
    // Don't bother for an API call if the file is not temporary.
    if (data.is_temporary) {
        return false;
    }

    try {
        return await invoke("is_file_changed_in_fs", { data });
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Reloads the file contents using the Tauri API call.
 * @param {FileTabData} data - The file data to reload.
 * @returns {Promise<boolean>} A value indicating whether the file contents were reloaded successfully.
 * @throws {Error} If the Tauri API call fails.
 */
const reloadFileContents = async (data: FileTabData) => {
    try {
        return await invoke("reload_file_contents", { data });
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Saves the file contents using the Tauri API call.
 * @param {FileTabData} data - The file data to save.
 * @param {string | null} fileNamePath - The name and path of the file to save.
 * @returns {Promise<boolean>} A value indicating whether the file contents were saved successfully.
 * @throws {Error} If the Tauri API call fails.
 */
const saveFileContents = async (data: FileTabData, fileNamePath: string | null) => {
    try {
        return await invoke("save_file_contents", { data, fileNamePath });
    } catch (error) {
        throw new Error(`${error}`);
    }
};

export {
    //
    runScript,
    getAppState,
    addNewTab,
    saveOpenTabs,
    updateOpenTabs,
    loadFileState,
    getNewTabId,
    openExistingFile,
    isFileChangedInFs,
    reloadFileContents,
    saveFileContents,
};

export type { AppStateResult };
