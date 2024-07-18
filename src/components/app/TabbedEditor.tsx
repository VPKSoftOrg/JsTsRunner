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

import * as React from "react";
import { styled } from "styled-components";
import classNames from "classnames";
import { Editor } from "@monaco-editor/react";
import { Tab } from "rc-tabs/lib/interface";
import { CommonProps, FileTabData, ScriptType } from "../Types";
import { useDebounce } from "../../hooks/useDebounce";
import { JavaScriptLogo, TypeScriptLogo } from "../../utilities/app/Images";
import { ConfirmPopup } from "../popups/ConfirmPopup";
import { DialogButtons, DialogResult, PopupType } from "../Enums";
import { useTranslate } from "../../localization/Localization";
import { NotificationType } from "../../utilities/app/Notify";
import { evalueateValue, evalueateValueByLines } from "../../utilities/app/Code";
import { Settings } from "../../utilities/app/Settings";
import { DraggableTabs } from "../wrappers/DraggableTabs";

/**
 * The props for the {@link TabbedEditor} component.
 */
type TabbedEditorProps = {
    darkMode: boolean;
    fileTabs: FileTabData[];
    activeTabKey: number;
    settings: Settings | null;
    fileSaveQueryVisible: boolean;
    setFileSaveQueryVisible: (value: boolean) => void;
    setActiveTabKey: (value: number) => void;
    saveFileTabs: (fileTabsOverride?: FileTabData[]) => void;
    setActiveTabScriptType: (scriptType: ScriptType) => void;
    setFileTabs: (fileTabs: FileTabData[]) => void;
    onNewOutput: (output: string | string[]) => void;
    saveTab: (activeTabKey: number) => Promise<boolean>;
    notification: (type: NotificationType, title: string | null | undefined | Error | unknown, duration?: number) => void;
} & CommonProps;

/**
 * A  component ...
 * @param param0 The component props: {@link TabbedEditorProps}.
 * @returns A component.
 */
const TabbedEditorComponent = ({
    className, //
    darkMode,
    fileTabs = [],
    activeTabKey,
    settings,
    fileSaveQueryVisible,
    setFileSaveQueryVisible,
    setActiveTabKey,
    saveFileTabs,
    setActiveTabScriptType,
    onNewOutput,
    setFileTabs,
    saveTab,
    notification,
}: TabbedEditorProps) => {
    const [saveQueryResult, setSaveQueryResult] = React.useState<DialogResult | undefined>();
    const [tabItems, setTabItems] = React.useState<Tab[]>([]);
    const beingDragged = React.useRef<boolean>(false);

    const fileNameRef = React.useRef<string>("");
    const keyRef = React.useRef<number>(0);
    // The i18n translation hook.
    const { translate } = useTranslate();

    // The active tab changed.
    const onTabChange = React.useCallback(
        (activeTabKey?: string) => {
            const newKey = Number.parseInt(activeTabKey ?? "0");
            const language = fileTabs.find(f => f.uid === newKey)?.script_language;
            setActiveTabScriptType((language ?? "typescript") as ScriptType);
            setActiveTabKey(newKey);
        },
        [fileTabs, setActiveTabKey, setActiveTabScriptType]
    );

    // The active tab's content changed.
    const onEditValueChange = React.useCallback(
        (value: string | undefined) => {
            const newTabs = [...fileTabs];
            const index = newTabs.findIndex(f => f.uid === activeTabKey);
            newTabs[index].content = value ?? null;
            newTabs[index].modified_at_state = new Date();
            setFileTabs(newTabs);
        },
        [activeTabKey, fileTabs, setFileTabs]
    );

    // Use an effect to update the tab items instead of memoizing them to allow reordering.
    React.useEffect(() => {
        const items: Tab[] = [];

        for (const tab of fileTabs) {
            items.push({
                label: `${tab.file_name_path === null || tab.modified_at_state !== tab.modified_at ? "* " : ""}${tab.file_name}`,
                key: tab.uid.toString(),
                closable: true,
                className: "TabPane",
                icon: <img className="IconStyle" src={tab.script_language === "typescript" ? TypeScriptLogo : JavaScriptLogo} width="16px" height="16px" />,
                children: (
                    <Editor //
                        className="Editor"
                        language={tab.script_language}
                        theme={darkMode ? "vs-dark" : "light"}
                        value={tab.content ?? undefined}
                        onChange={onEditValueChange}
                    />
                ),
            });
        }

        setTabItems(items);
    }, [darkMode, fileTabs, onEditValueChange]);

    // Set the active tab key if there are opened tabs and the active tab key is not valid.
    React.useEffect(() => {
        if (fileTabs.length > 0 && !fileTabs.some(f => f.uid === activeTabKey)) {
            setActiveTabKey(fileTabs[0].uid);
        }
    }, [fileTabs, activeTabKey, setActiveTabKey]);

    const [newContent, setNewContent] = React.useState<{ content: string | null; script_language: ScriptType; evalueate_per_line: boolean } | null>(null);

    // Keep the current tab data the same if it has not actually been changed, so the code won't be re-evaluated all the time.
    React.useEffect(() => {
        const tab = fileTabs.find(f => f.uid === activeTabKey);
        if (tab && (newContent?.content !== tab.content || newContent?.script_language !== tab.script_language || newContent?.evalueate_per_line !== tab.evalueate_per_line)) {
            setNewContent({ content: tab.content, script_language: tab.script_language, evalueate_per_line: tab.evalueate_per_line });
        }
    }, [activeTabKey, fileTabs, newContent?.content, newContent?.evalueate_per_line, newContent?.script_language]);

    // Evaluate the active tab's code.
    const evalueateCallback = React.useCallback(async () => {
        if (newContent && (newContent.content ?? null) !== null) {
            let value: string | string[] = "";

            try {
                if (newContent.evalueate_per_line && settings) {
                    value = await evalueateValueByLines(newContent.content, settings.skip_undefined_on_js, settings.skip_empty_on_js, newContent.script_language);
                    value = value.map(f => `${translate("line", "Line")} ${f}`);
                } else {
                    value = await evalueateValue(newContent.content, true, newContent.script_language);
                }
            } catch (error) {
                notification("error", error);
            }

            onNewOutput(value);
        }
    }, [newContent, notification, onNewOutput, settings, translate]);

    // Don't debounce the evaluation if the user is dragging a tab.
    const postponeDebounce = React.useCallback(() => {
        return beingDragged.current;
    }, []);

    useDebounce(evalueateCallback, 1_500, postponeDebounce);

    // Removes the tab with the provided key.
    const removeTabByKey = React.useCallback(
        (key: number) => {
            const newTabs = [...fileTabs];
            const index = newTabs.findIndex(f => f.uid === key);
            newTabs.splice(index, 1);
            setFileTabs(newTabs);
            saveFileTabs(newTabs);
            setSaveQueryResult(undefined);
            keyRef.current = 0;
        },
        [fileTabs, setFileTabs, saveFileTabs]
    );

    // Occurs if a tab was removed or added. In this case only react on the removed case.
    const onTabEdit = React.useCallback(
        (key: React.MouseEvent | React.KeyboardEvent | string, action: "add" | "remove") => {
            if (action === "remove") {
                const newTabs = [...fileTabs];
                if (typeof key === "string") {
                    keyRef.current = Number.parseInt(key);
                    const index = newTabs.findIndex(f => f.uid === keyRef.current);
                    if (newTabs[index].modified_at_state === newTabs[index].modified_at && newTabs[index].file_name_path !== null) {
                        removeTabByKey(keyRef.current);
                        return;
                    }

                    if (saveQueryResult === undefined) {
                        fileNameRef.current = newTabs.find(f => f.uid === Number.parseInt(key))?.file_name ?? "";
                        setFileSaveQueryVisible(true);
                        return;
                    }

                    if (saveQueryResult === DialogResult.Cancel) {
                        setFileSaveQueryVisible(false);
                        setSaveQueryResult(undefined);
                        return;
                    }
                }
            }
        },
        [fileTabs, removeTabByKey, saveQueryResult, setFileSaveQueryVisible]
    );

    // React to the save query popup result.
    React.useEffect(() => {
        if (saveQueryResult === DialogResult.Yes || saveQueryResult === DialogResult.No) {
            const newTabs = [...fileTabs];
            if (saveQueryResult === DialogResult.Yes) {
                saveTab(keyRef.current)
                    .then(f => {
                        if (f) {
                            const index = newTabs.findIndex(f => f.uid === keyRef.current);
                            newTabs.splice(index, 1);
                            setFileTabs(newTabs);
                            saveFileTabs(newTabs);
                            removeTabByKey(keyRef.current);
                        }
                    })
                    .catch(error => notification("error", error));
            } else {
                removeTabByKey(keyRef.current);
            }
            setSaveQueryResult(undefined);
        }
    }, [fileTabs, notification, removeTabByKey, saveFileTabs, saveQueryResult, saveTab, setFileTabs]);

    // Close the save query popup and set the result to the state.
    const onFileSaveQueryClose = React.useCallback(
        (result: DialogResult) => {
            setSaveQueryResult(result);
            setFileSaveQueryVisible(false);
        },
        [setFileSaveQueryVisible]
    );

    // Reorder the tab contents based on the order in the changed file tabs array.
    const onItemsReordered = React.useCallback(
        (value: Tab[]) => {
            const newTabs: FileTabData[] = [];
            for (const tabItem of value) {
                const tab = fileTabs.find(t => t.uid === Number.parseInt(tabItem.key));
                if (tab) {
                    newTabs.push(tab);
                }
            }

            saveFileTabs(newTabs);
        },
        [fileTabs, saveFileTabs]
    );

    // Indicate that a tab is being dragged.
    const onDraggingChanged = React.useCallback((dragging: boolean) => {
        beingDragged.current = dragging;
    }, []);

    return (
        <>
            <DraggableTabs //
                className={classNames(TabbedEditor.name, className)}
                items={tabItems}
                activeKey={activeTabKey.toString()}
                type="editable-card"
                hideAdd
                onChange={onTabChange}
                onEdit={onTabEdit}
                setItems={setTabItems}
                onItemsReordered={onItemsReordered}
                onDraggingChanged={onDraggingChanged}
            />
            <ConfirmPopup //
                visible={fileSaveQueryVisible}
                mode={PopupType.Confirm}
                message={translate("saveFileBeforeClose", "Save the file '{{file}}' before closing it?", { file: fileNameRef.current })}
                buttons={DialogButtons.Yes | DialogButtons.No | DialogButtons.Cancel}
                onClose={onFileSaveQueryClose}
            />
        </>
    );
};

const TabbedEditor = styled(TabbedEditorComponent)`
    width: 100%;
    height: 70%;
    .TabPane {
        height: 100%;
        width: 100%;
    }
    .IconStyle {
        vertical-align: middle;
    }
`;

export { TabbedEditor };
