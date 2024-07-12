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

import { getAppState, runScript, runScriptLineByLine } from "../../components/app/TauriWrappers";
import { ScriptType } from "../../components/Types";
import { LocalizeFunction } from "../../localization/Localization";
import { transpileTypeSctiptToJs } from "./TypeSciptTranspile";

const evalueateValue = async (content: string | undefined | null, skipUndefined: boolean, scriptType: ScriptType) => {
    if (content !== undefined && content !== null) {
        const scriptValue = content;
        let script = "";

        if (scriptType === "typescript") {
            try {
                script = transpileTypeSctiptToJs(content, true);
            } catch (error) {
                return `${error}`;
            }
        } else {
            script = scriptValue;
        }
        let value: string = "";

        try {
            value = await runScript(script);
        } catch (error) {
            value = `${error}`;
        }

        try {
            const appState = await getAppState();
            if (appState.log_stack.length > 0) {
                value = appState.log_stack.join("\n") + "\n" + value;
            }
        } catch (error) {
            value = `${error}`;
        }

        return skipUndefined && value === "undefined" ? "" : value;
    }

    return "";
};

const evalueateValueByLines = async (content: string | undefined | null, skipUndefined: boolean, skipEmptyLines: boolean, scriptType: ScriptType, translate: LocalizeFunction) => {
    if (content !== undefined && content !== null) {
        const scriptValue = content;
        let script: string[] = [];
        if (scriptType === "typescript") {
            const scriptLines = content.split("\n");
            for (let i = 0; i < scriptLines.length; i++) {
                try {
                    scriptLines[i] = transpileTypeSctiptToJs(scriptLines[i], true);
                } catch (error) {
                    scriptLines[i] = `${error}`;
                }
            }
            script = scriptLines;
        } else {
            script = scriptValue.split("\n");
        }
        let value: string[] = [];

        try {
            value = await runScriptLineByLine(script);
        } catch (error) {
            value = [`${error}`];
        }

        for (let i = 0; i < value.length; i++) {
            if (skipUndefined && value[i] === "undefined") {
                value[i] = "";
            }
        }

        try {
            const appState = await getAppState();

            for (const line of appState.log_stack_lines) {
                if (line.line_number >= 0 && line.line_number < value.length) {
                    value[line.line_number] += line.lines.join(" ");
                }
            }
        } catch (error) {
            value = [`${error}`];
        }

        let line = 1;
        if (skipEmptyLines) {
            for (let i = 0; i < value.length; i++) {
                if (value[i] === "") {
                    value.splice(i, 1);
                    i--;
                } else {
                    value[i] = `${translate("line", "Line")}: ${line.toString().padStart(2, " ")}. ${value[i]}`;
                }
                line++;
            }
        }

        return value;
    }

    return [];
};

export { evalueateValue, evalueateValueByLines };
