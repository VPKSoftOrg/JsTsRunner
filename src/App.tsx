import * as React from "react";
import { useState } from "react";
import { styled } from "styled-components";
import { Editor } from "@monaco-editor/react";
import "./App.css";
import classNames from "classnames";
import { getCurrent } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import { StyledTitle } from "./components/app/WindowTitle";
import { useTranslate } from "./localization/Localization";
import { MenuKeys } from "./menu/MenuItems";
import { AboutPopup } from "./components/popups/AboutPopup";
import { PreferencesPopup } from "./components/popups/PreferencesPopup";
import { useSettings } from "./utilities/app/Settings";
import { useWindowStateSaver } from "./hooks/UseWindowStateListener";
import { useAntdTheme, useAntdToken } from "./context/AntdThemeContext";
import { CommonProps, FileTabData, ScriptType } from "./components/Types";
import { AppMenuToolbar } from "./menu/AppMenuToolbar";
import { TabbedEditor } from "./components/app/TabbedEditor";
import {
    AppStateResult,
    addNewTab,
    getAppState,
    getNewTabId,
    isFileChangedInFs,
    loadFileState,
    openExistingFile,
    reload_file_contents,
    saveOpenTabs,
    updateOpenTabs,
} from "./components/app/TauriWrappers";
import { useNotify } from "./utilities/app/Notify";
import { useDebounce } from "./hooks/useDebounce";
import { transpileTypeSctiptToJs } from "./utilities/app/TypeSciptTranspile";
import { ToolBarItems } from "./menu/ToolbarItems";
import { DialogButtons, DialogResult, PopupType } from "./components/Enums";
import { ConfirmPopup } from "./components/popups/ConfirmPopup";

type AppProps = CommonProps;

/**
 * Renders the main application component.
 *
 * @return {JSX.Element} The rendered application component.
 */
const App = ({ className }: AppProps) => {
    const [contextHolder, notification] = useNotify();

    // A callback for notification from useSettings hook to display an error message.
    const settingsErrorCallback = React.useCallback(
        (error: Error | string | unknown) => {
            notification("error", `${error}`);
        },
        [notification]
    );

    // State variables.
    const [evaluationResult, setEvaluationResult] = useState("");
    const [aboutPopupVisible, setAboutPopupVisible] = React.useState(false);
    const [preferencesVisible, setPreferencesVisible] = React.useState(false);
    const [settings, settingsLoaded, updateSettings, reloadSettings] = useSettings(settingsErrorCallback);
    const [previewDarkMode, setPreviewDarkMode] = React.useState<boolean | null>(null);
    const [selectedValues, setSelectedValues] = React.useState<{ [key: string]: string }>({ language: "javascript" });
    const [fileTabs, setFileTabs] = React.useState<FileTabData[]>([]);
    const [activeTabKey, setActiveTabKey] = React.useState(0);
    const [disabledItems, setDisabledItems] = React.useState<(MenuKeys | ToolBarItems)[]>([]);
    const [reloadConfirmVisible, setReloadConfirmVisible] = React.useState(false);

    const fileNameRef = React.useRef<string>("");
    const previousFocusedRef = React.useRef<boolean>(false);

    // Antd theme-related hooks.
    const { token } = useAntdToken();
    const { setTheme, updateBackround } = useAntdTheme();

    // A hook for saving and restoring the window state.
    const { setStateSaverEnabled, restoreState } = useWindowStateSaver(10_000);

    // The i18n translation hook.
    const { translate, setLocale } = useTranslate();

    // Store the application's current window into a memoized variable.
    const appWindow = React.useMemo(() => getCurrent(), []);
    const appStateLoaded = React.useRef<boolean>(false);

    // Load the initial application state consisting of the file tabs and related data.
    React.useEffect(() => {
        if (appStateLoaded.current && !settingsLoaded) {
            return;
        }
        loadFileState()
            .then(() => {
                getAppState()
                    .then((result: AppStateResult) => {
                        setFileTabs(result.file_tabs);
                        appStateLoaded.current = true;
                    })
                    .catch(error => notification("error", error));
            })
            .catch(error => notification("error", error));
    }, [notification, settingsLoaded]);

    const checkTabFileChanged = React.useCallback(() => {
        const tabScript = fileTabs.find(tab => tab.uid === activeTabKey);
        if (tabScript) {
            isFileChangedInFs(tabScript)
                .then(result => {
                    if (result) {
                        fileNameRef.current = tabScript.file_name;
                        setReloadConfirmVisible(true);
                    }
                })
                .catch(error => notification("error", error));
        }
    }, [fileTabs, activeTabKey, notification]);

    // Disable the "Convert to JavaScript" menu item if the currently selected file is not a JavaScript file.
    React.useEffect(() => {
        const tabScript = fileTabs.find(tab => tab.uid === activeTabKey);
        if (tabScript) {
            if (tabScript.script_language === "typescript") {
                setDisabledItems(f => f.filter(item => item !== "convertToJs"));
            } else {
                setDisabledItems(f => (f.includes("convertToJs") ? f : [...f, "convertToJs"]));
            }

            checkTabFileChanged();
        }
    }, [fileTabs, activeTabKey, notification, checkTabFileChanged]);

    // Restore the window state.
    React.useEffect(() => {
        if (settingsLoaded && settings !== null) {
            setStateSaverEnabled(settings.save_window_state);
            void restoreState();
        }
    }, [restoreState, settingsLoaded, settings, setStateSaverEnabled]);

    // Set the theme and locale based on the application settings.
    React.useEffect(() => {
        if (settings && setTheme) {
            void setLocale(settings.locale);
            setTheme(settings.dark_mode ? "dark" : "light");
        }
    }, [setLocale, setTheme, settings]);

    // A debounced callback to save the current file tabs.
    const saveFileTabs = React.useCallback(() => {
        if (!appStateLoaded.current || !settingsLoaded) {
            return;
        }
        void updateOpenTabs(fileTabs)
            .then(() => {
                void saveOpenTabs().catch(error => notification("error", error));
            })
            .catch(error => notification("error", error));
    }, [fileTabs, notification, settingsLoaded]);

    // A debounced callback to save the current file tabs if nothing has changed in 5 seconds.
    useDebounce(saveFileTabs, 5_000); // TODO::Make this configurable

    // A callback to close the application returning always false to not to prevent the app from closing.
    const onClose = React.useCallback(() => {
        return false;
    }, []);

    // A callback to to set the about popup hidden when closed.
    const aboutPopupClose = React.useCallback(() => {
        setAboutPopupVisible(false);
    }, []);

    const reloadAppState = React.useCallback(() => {
        getAppState()
            .then((result: AppStateResult) => {
                setFileTabs(result.file_tabs);
            })
            .catch(error => notification("error", error));
    }, [notification]);

    const reloadCurrentFileContents = React.useCallback(() => {
        const newTabs = [...fileTabs];
        const index = newTabs.findIndex(f => f.uid === activeTabKey);
        if (index !== -1 && newTabs[index].file_name_path !== null) {
            reload_file_contents(newTabs[index])
                .then(() => {
                    reloadAppState();
                })
                .catch(error => notification("error", error));
        }
    }, [activeTabKey, fileTabs, reloadAppState, notification]);

    const openExistingFileWrapped = React.useCallback(
        (filePath: string) => {
            return openExistingFile(filePath)
                .then(() => {
                    saveOpenTabs()
                        .then(() => {
                            getAppState()
                                .then((result: AppStateResult) => {
                                    setFileTabs(result.file_tabs);
                                })
                                .catch(error => notification("error", error));
                        })
                        .catch(error => notification("error", error));
                })
                .catch(error => notification("error", error));
        },
        [notification]
    );

    // A callback to handle menu item and toolbar item clicks.
    const onMenuItemClick = React.useCallback(
        (key: unknown) => {
            const keyValue = key as MenuKeys;
            switch (keyValue) {
                case "exitMenu": {
                    void appWindow.close();
                    break;
                }
                case "aboutMenu": {
                    setAboutPopupVisible(true);
                    break;
                }
                case "preferencesMenu": {
                    setPreferencesVisible(true);
                    break;
                }
                case "openFile": {
                    void open({ filters: [{ name: translate("scriptFiles", "Script Files"), extensions: ["js", "ts"] }] })
                        .then(files => {
                            if (files) {
                                void openExistingFileWrapped(files.path).catch(error => notification("error", error));
                            }
                        })
                        .catch(error => notification("error", error));
                    break;
                }
                case "addNewTab": {
                    getNewTabId()
                        .then(uid => {
                            let newFileName = translate("newFileWithIndex", "New file {{index}}", { index: uid });
                            newFileName += selectedValues["language"] === "typescript" ? ".ts" : ".js";

                            void addNewTab({
                                uid: 0,
                                path: null,
                                is_temporary: true,
                                script_language: selectedValues["language"],
                                content: null,
                                file_name: newFileName,
                                modified_at: null,
                                file_name_path: null,
                            })
                                .then(() => {
                                    saveOpenTabs()
                                        .then(() => {
                                            getAppState()
                                                .then((result: AppStateResult) => {
                                                    setFileTabs(result.file_tabs);
                                                })
                                                .catch(error => notification("error", error));
                                        })
                                        .catch(error => notification("error", error));
                                })
                                .catch(error => notification("error", error));
                        })
                        .catch(error => notification("error", error));

                    break;
                }
                case "reloadFromDisk": {
                    reloadCurrentFileContents();
                    break;
                }
                case "convertToJs": {
                    const newTabs = [...fileTabs];
                    const index = newTabs.findIndex(f => f.uid === activeTabKey);
                    if (index !== -1 && newTabs[index].script_language === "typescript") {
                        newTabs[index].script_language = "javascript";
                        newTabs[index].content = transpileTypeSctiptToJs(newTabs[index].content ?? "", true);
                        setFileTabs(newTabs);
                    } else {
                        notification("info", translate("currentMustBeTsFile", "The current file type must be a TypeScript file in order to convert it to JavaScript."));
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        },
        [activeTabKey, appWindow, fileTabs, notification, openExistingFileWrapped, reloadCurrentFileContents, selectedValues, translate]
    );

    React.useEffect(() => {
        const unlisten = async () =>
            await appWindow.onFocusChanged(({ payload: focused }) => {
                if (focused && previousFocusedRef.current !== focused) {
                    checkTabFileChanged();
                }
                previousFocusedRef.current = focused;
            });

        // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
        return () => {
            void unlisten()
                .then()
                .catch(error => notification("error", error));
        };
    }, [appWindow, checkTabFileChanged, notification]);

    // A callback to close the preferences popup.
    const onPreferencesClose = React.useCallback(() => {
        setPreferencesVisible(false);

        // Reload the application settings.
        void reloadSettings().then(() => {
            // Reset the theme based on the application settings.
            setPreviewDarkMode(null);
            setTheme && setTheme(settings?.dark_mode ? "dark" : "light");
        });
    }, [reloadSettings, setTheme, settings?.dark_mode]);

    // This effect occurs when the theme token has been changed and updates the
    // root and body element colors to match to the new theme.
    React.useEffect(() => {
        updateBackround && updateBackround(token);
    }, [token, updateBackround]);

    // A callback to toggle the dark mode from the preferences popup.
    const toggleDarkMode = React.useCallback(
        (antdTheme: "light" | "dark") => {
            setTheme && setTheme(antdTheme);
            setPreviewDarkMode(antdTheme === "dark");
        },
        [setTheme]
    );

    // A callback to set the script evaluation result in the state.
    const onNewOutput = React.useCallback(
        (output: string) => {
            setEvaluationResult(output);
        },
        [setEvaluationResult]
    );

    // A callback to set Select component(s) values from the tool bar into the state.
    const onSelectedValueChanged = React.useCallback(
        (value: string, name?: string) => {
            if (name) {
                setSelectedValues({ ...selectedValues, [name]: value });
            }
        },
        [selectedValues]
    );

    // A callback to set the script language in the state when the selected tab page changed.
    const setScriptStype = React.useCallback(
        (value: ScriptType) => {
            setSelectedValues({ ...selectedValues, language: value });
        },
        [selectedValues]
    );

    // A callback to handle the application close request event and optionally prevent the application from closing.
    React.useEffect(() => {
        const unlisten = async () =>
            await appWindow.onCloseRequested(async (/*event: CloseRequestedEvent*/) => {
                // Currently allow the application to close always.
                // The following call would prevent the application from closing:
                // event.preventDefault();
            });

        return () => {
            void unlisten();
        };
    }, [appWindow]);

    const onReloadConfirmClose = React.useCallback(
        (result: DialogResult) => {
            setReloadConfirmVisible(false);
            if (result === DialogResult.Yes) {
                reloadCurrentFileContents();
            }
            reloadAppState();
        },
        [reloadAppState, reloadCurrentFileContents]
    );

    // Render loading indicator if the settings and app state are not loaded yet.
    if (!settingsLoaded || settings === null || appStateLoaded.current === false) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {contextHolder}
            <StyledTitle //
                title="JsTsRunner"
                onClose={onClose}
                darkMode={previewDarkMode ?? settings.dark_mode ?? false}
                maximizeTitle={translate("maximize")}
                minimizeTitle={translate("minimize")}
                closeTitle={translate("close")}
            />
            <AppMenuToolbar //
                onItemClick={onMenuItemClick}
                selectValues={selectedValues}
                onSelectChange={onSelectedValueChanged}
                disabledItems={disabledItems}
            />
            <div className={classNames(App.name, className)}>
                <div id="mainView" className="App-itemsView">
                    <TabbedEditor //
                        darkMode={previewDarkMode ?? settings.dark_mode ?? false}
                        onNewOutput={onNewOutput}
                        activeTabScriptType={selectedValues["language"] as ScriptType}
                        fileTabs={fileTabs}
                        activeTabKey={activeTabKey}
                        setActiveTabKey={setActiveTabKey}
                        setFileTabs={setFileTabs}
                        setActiveTabScriptType={setScriptStype}
                        saveFileTabs={saveFileTabs}
                    />
                    <div className="EditorResultContainer">
                        {translate("result", "Result")}
                        <Editor //
                            theme={previewDarkMode ?? settings.dark_mode ?? false ? "vs-dark" : "light"}
                            className="EditorResult"
                            value={evaluationResult}
                        />
                    </div>
                </div>
            </div>
            <AboutPopup //
                visible={aboutPopupVisible}
                onClose={aboutPopupClose}
                textColor="white"
                darkMode={previewDarkMode ?? settings.dark_mode ?? false}
            />
            {updateSettings && (
                <PreferencesPopup //
                    visible={preferencesVisible}
                    onClose={onPreferencesClose}
                    updateSettings={updateSettings}
                    settings={settings}
                    translate={translate}
                    toggleDarkMode={toggleDarkMode}
                    notification={notification}
                />
            )}
            <ConfirmPopup //
                visible={reloadConfirmVisible}
                mode={PopupType.Confirm}
                message={translate("fileHasBeenChangedReload", "The file '{{file}}' has been changed. Reload the file to see the changed contents.", { file: fileNameRef.current })}
                buttons={DialogButtons.Yes | DialogButtons.No}
                onClose={onReloadConfirmClose}
            />
        </>
    );
};

const SyledApp = styled(App)`
    height: 100%;
    width: 100%;
    display: contents;
    .App-itemsView {
        display: flex;
        flex: auto; // 100% breaks this
        width: 100%;
        flex-direction: column;
        min-height: 0px;
    }
    .TabsContainer {
        height: 100%;
    }
    .EditorCode {
        height: 100%;
        width: 100%;
    }
    .EditorResultContainer {
        height: 30%;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .ant-tabs-content {
        height: 100%;
    }
    .ant-tabs-content-holder {
        height: 100%;
    }
`;

export { SyledApp as App };
