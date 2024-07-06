import * as React from "react";
import { styled } from "styled-components";
import classNames from "classnames";
import { Tabs } from "antd";
import { Editor } from "@monaco-editor/react";
import { CommonProps, FileTabData, ScriptType } from "../Types";
import { useDebounce } from "../../hooks/useDebounce";
import { JavaScriptLogo, TypeScriptLogo } from "../../utilities/app/Images";
import { transpileTypeSctiptToJs } from "../../utilities/app/TypeSciptTranspile";
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
}: TabbedEditorProps) => {
    const onTabChange = React.useCallback(
        (activeTabKey?: string) => {
            const newKey = Number.parseInt(activeTabKey ?? "0");
            const language = fileTabs.find(f => f.index === newKey)?.script_language;
            setActiveTabScriptType((language ?? "typescript") as ScriptType);
            setActiveTabKey(newKey);
        },
        [fileTabs, setActiveTabKey, setActiveTabScriptType]
    );

    const onEditValueChange = React.useCallback(
        (value: string | undefined) => {
            const newTabs = [...fileTabs];
            const index = newTabs.findIndex(f => f.index === activeTabKey);
            newTabs[index].content = value ?? null;
            setFileTabs(newTabs);
        },
        [activeTabKey, fileTabs, setFileTabs]
    );

    const tabItems = React.useMemo(() => {
        const items = [];

        for (const tab of fileTabs) {
            items.push({
                label: tab.file_name,
                key: tab.index.toString(),
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
        if (fileTabs.length > 0 && !fileTabs.some(f => f.index === activeTabKey)) {
            setActiveTabKey(fileTabs[0].index);
        }
    }, [fileTabs, activeTabKey, setActiveTabKey]);

    const evalueateValue = React.useCallback(async () => {
        const tab = fileTabs.find(f => f.index === activeTabKey);
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

    const onTabEdit = React.useCallback(
        (_: unknown, action: "add" | "remove") => {
            if (action === "remove") {
                const newTabs = [...fileTabs];
                const index = newTabs.findIndex(f => f.index === activeTabKey);
                newTabs.splice(index, 1);
                setFileTabs(newTabs);
                saveFileTabs();
            }
        },
        [activeTabKey, fileTabs, saveFileTabs, setFileTabs]
    );

    return (
        <Tabs //
            className={classNames(TabbedEditor.name, className)}
            items={tabItems}
            type="editable-card"
            hideAdd
            onChange={onTabChange}
            onEdit={onTabEdit}
        />
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
