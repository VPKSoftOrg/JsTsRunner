import * as React from "react";
import { styled } from "styled-components";
import classNames from "classnames";
import { Tabs } from "antd";
import { Editor } from "@monaco-editor/react";
import ts from "typescript";
import { invoke } from "@tauri-apps/api/core";
import { CommonProps } from "../Types";
import { useDebounce } from "../../hooks/useDebounce";

/**
 * The props for the {@link TabbedEditor} component.
 */
type TabbedEditorProps = {
    darkMode: boolean;
} & CommonProps;

/**
 * A  component ...
 * @param param0 The component props: {@link TabbedEditorProps}.
 * @returns A component.
 */
const TabbedEditorComponent = ({
    className, //
    darkMode,
}: TabbedEditorProps) => {
    const [activeTabKey, setActiveTabKey] = React.useState(0);
    const [editorValue, setEditorValue] = React.useState<string>();

    const onTabChange = React.useCallback((activeTabKey?: string) => {
        setActiveTabKey(activeTabKey ? Number.parseInt(activeTabKey) : 0);
    }, []);

    const tabItems = React.useMemo(() => {
        const items = [];
        items.push({
            label: "TODO::File name",
            key: "1",
            closable: true,
            className: "TabPane",
            children: (
                <div className="EditorContainer">
                    <Editor //
                        language="typescript"
                        theme={darkMode ? "vs-dark" : "light"}
                        value={editorValue}
                        onChange={setEditorValue}
                    />
                </div>
            ),
        });
        return items;
    }, [darkMode, editorValue]);

    const evalueateValue = React.useCallback(async () => {
        if (editorValue) {
            const result = ts.transpileModule(editorValue, {
                compilerOptions: {
                    target: ts.ScriptTarget.ES2023,
                    module: ts.ModuleKind.ESNext,
                    noEmit: false,
                },
            });

            console.log(result.outputText);

            const value: string = await invoke("run_script", { code: result.outputText });
            console.log(value);
        }
    }, [editorValue]);

    useDebounce(evalueateValue, 5_000);

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
    display: flex;
    min-height: 0;
    height: 70%;
    .EditorContainer {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
    }
    .TabPane {
        display: flex;
        min-height: 0;
        height: 100%;
    }
`;

export { TabbedEditor };
