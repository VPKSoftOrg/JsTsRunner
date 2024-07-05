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
    file_index: number;
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

const getAppState = async (): Promise<AppStateResult> => {
    try {
        return await invoke("get_app_state");
    } catch (error) {
        throw new Error(`${error}`);
    }
};

const addNewTab = async (tab_data: FileTabData) => {
    try {
        return await invoke("add_new_tab", { tabData: tab_data });
    } catch (error) {
        throw new Error(`${error}`);
    }
};

const saveOpenTabs = async (): Promise<boolean> => {
    try {
        return await invoke("save_open_tabs");
    } catch (error) {
        throw new Error(`${error}`);
    }
};

export { runScript, getAppState, addNewTab, saveOpenTabs };
export type { AppStateResult };
