import * as React from "react";
import { styled } from "styled-components";
import classNames from "classnames";
import { Tabs } from "antd";
import { Editor } from "@monaco-editor/react";
import ts from "typescript";
import { CommonProps, FileTabData } from "../Types";
import { useDebounce } from "../../hooks/useDebounce";
import { getAppState, runScript } from "./TauriWrappers";

/**
 * The props for the {@link TabbedEditor} component.
 */
type TabbedEditorProps = {
    darkMode: boolean;
    activeTabScriptType: "typescript" | "javascript";
    fileTabs: FileTabData[];
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
    onNewOutput,
}: TabbedEditorProps) => {
    const [activeTabKey, setActiveTabKey] = React.useState(0);
    const [editorValue, setEditorValue] = React.useState<string>();
    const [scriptType, setScriptType] = React.useState<"typescript" | "javascript">("typescript");

    const onTabChange = React.useCallback((activeTabKey?: string) => {
        setActiveTabKey(activeTabKey ? Number.parseInt(activeTabKey) : 0);
    }, []);

    const tabItems = React.useMemo(() => {
        const items = [];
        for (const tab of fileTabs) {
            items.push({
                label: tab.file_name,
                key: tab.index.toString(),
                closable: true,
                className: "TabPane",
                children: (
                    <Editor //
                        className="Editor"
                        language={tab.script_language}
                        theme={darkMode ? "vs-dark" : "light"}
                        value={editorValue}
                        onChange={setEditorValue}
                    />
                ),
            });
        }

        return items;
    }, [darkMode, editorValue, fileTabs]);

    React.useEffect(() => {
        if (fileTabs.length > 0 && !fileTabs.some(f => f.index === activeTabKey)) {
            setActiveTabKey(fileTabs[0].index);
        }
    }, [fileTabs, activeTabKey]);

    React.useEffect(() => {
        if (fileTabs.length > 0) {
            const tab = fileTabs.find(f => f.index === activeTabKey);
            if (tab) {
                setEditorValue(tab.content ?? "");
                setScriptType(tab.script_language as "typescript" | "javascript");
            }
        }
    }, [fileTabs, activeTabKey]);

    const evalueateValue = React.useCallback(async () => {
        if (editorValue) {
            let script = "";
            if (scriptType === "typescript") {
                const result = ts.transpileModule(editorValue, {
                    compilerOptions: {
                        target: ts.ScriptTarget.ES2023,
                        module: ts.ModuleKind.ESNext,
                        noEmit: false,
                    },
                });
                script = result.outputText;
            } else {
                script = editorValue;
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
    }, [editorValue, onNewOutput, scriptType]);

    useDebounce(evalueateValue, 1_500, [editorValue]);

    return (
        <Tabs //
            className={classNames(TabbedEditor.name, className)}
            items={tabItems}
            type="editable-card"
            hideAdd
            onChange={onTabChange}
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
`;

export { TabbedEditor };
