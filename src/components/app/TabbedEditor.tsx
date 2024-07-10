import * as React from "react";
import { styled } from "styled-components";
import classNames from "classnames";
import { Tabs } from "antd";
import { Editor } from "@monaco-editor/react";
import { CommonProps, FileTabData, ScriptType } from "../Types";
import { useDebounce } from "../../hooks/useDebounce";
import { JavaScriptLogo, TypeScriptLogo } from "../../utilities/app/Images";
import { transpileTypeSctiptToJs } from "../../utilities/app/TypeSciptTranspile";
import { ConfirmPopup } from "../popups/ConfirmPopup";
import { DialogButtons, DialogResult, PopupType } from "../Enums";
import { useTranslate } from "../../localization/Localization";
import { NotificationType } from "../../utilities/app/Notify";
import { getAppState, runScript } from "./TauriWrappers";

/**
 * The props for the {@link TabbedEditor} component.
 */
type TabbedEditorProps = {
    darkMode: boolean;
    fileTabs: FileTabData[];
    activeTabScriptType: ScriptType;
    activeTabKey: number;
    setActiveTabKey: (value: number) => void;
    saveFileTabs: () => void;
    setActiveTabScriptType: (scriptType: ScriptType) => void;
    setFileTabs: (fileTabs: FileTabData[]) => void;
    onNewOutput: (output: string) => void;
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
    activeTabScriptType,
    activeTabKey,
    setActiveTabKey,
    saveFileTabs,
    setActiveTabScriptType,
    onNewOutput,
    setFileTabs,
    saveTab,
    notification,
}: TabbedEditorProps) => {
    const [fileSaveQueryVisible, setFileSaveQueryVisible] = React.useState(false);
    const [saveQueryResult, setSaveQueryResult] = React.useState<DialogResult | undefined>();
    const fileNameRef = React.useRef<string>("");
    const keyRef = React.useRef<number>(0);
    // The i18n translation hook.
    const { translate } = useTranslate();

    const onTabChange = React.useCallback(
        (activeTabKey?: string) => {
            const newKey = Number.parseInt(activeTabKey ?? "0");
            const language = fileTabs.find(f => f.uid === newKey)?.script_language;
            setActiveTabScriptType((language ?? "typescript") as ScriptType);
            setActiveTabKey(newKey);
        },
        [fileTabs, setActiveTabKey, setActiveTabScriptType]
    );

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

    const tabItems = React.useMemo(() => {
        const items = [];

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

        return items;
    }, [darkMode, fileTabs, onEditValueChange]);

    React.useEffect(() => {
        if (fileTabs.length > 0 && !fileTabs.some(f => f.uid === activeTabKey)) {
            setActiveTabKey(fileTabs[0].uid);
        }
    }, [fileTabs, activeTabKey, setActiveTabKey]);

    const evalueateValue = React.useCallback(async () => {
        const tab = fileTabs.find(f => f.uid === activeTabKey);
        const editorValue = tab?.content;
        if (editorValue !== undefined && editorValue !== null) {
            const scriptValue = editorValue;
            let script = "";
            if (activeTabScriptType === "typescript") {
                try {
                    script = transpileTypeSctiptToJs(editorValue, true);
                } catch (error) {
                    onNewOutput(`${error}`);
                    return;
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

            onNewOutput(value);
        }
    }, [activeTabKey, activeTabScriptType, fileTabs, onNewOutput]);

    useDebounce(evalueateValue, 1_500);

    const removeTabByKey = React.useCallback(
        (key: number) => {
            const newTabs = [...fileTabs];
            const index = newTabs.findIndex(f => f.uid === key);
            newTabs.splice(index, 1);
            setFileTabs(newTabs);
            saveFileTabs();
            setSaveQueryResult(undefined);
            keyRef.current = 0;
        },
        [fileTabs, setFileTabs, saveFileTabs]
    );

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
        [fileTabs, removeTabByKey, saveQueryResult]
    );

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
                            saveFileTabs();
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

    const onFileSaveQueryClose = React.useCallback(
        (result: DialogResult) => {
            setSaveQueryResult(result);
            setFileSaveQueryVisible(false);
        },
        [setFileSaveQueryVisible]
    );

    return (
        <>
            <Tabs //
                className={classNames(TabbedEditor.name, className)}
                items={tabItems}
                type="editable-card"
                hideAdd
                onChange={onTabChange}
                onEdit={onTabEdit}
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
