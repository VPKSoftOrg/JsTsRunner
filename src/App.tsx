import * as React from "react";
import { styled } from "styled-components";
import { Editor } from "@monaco-editor/react";
import "./App.css";
import classNames from "classnames";
import { getCurrent } from "@tauri-apps/api/window";
import { open, save, SaveDialogOptions } from "@tauri-apps/plugin-dialog";
import { StyledTitle } from "./components/app/WindowTitle";
import { LocalizeFunction, useTranslate } from "./localization/Localization";
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
    isExistingFileMissingInFs,
    isFileChangedInFs,
    loadFileState,
    openExistingFile,
    reloadFileContents,
    saveFileContents,
    saveOpenTabs,
    setKeepCurrentFileInEditor,
    updateOpenTabs,
} from "./components/app/TauriWrappers";
import { NotificationType, useNotify } from "./utilities/app/Notify";
import { useDebounce } from "./hooks/useDebounce";
import { transpileTypeSctiptToJs } from "./utilities/app/TypeSciptTranspile";
import { ToolBarItems } from "./menu/ToolbarItems";
import { DialogButtons, DialogResult, PopupType } from "./components/Enums";
import { ConfirmPopup } from "./components/popups/ConfirmPopup";
import { evalueateValue, evalueateValueByLines } from "./utilities/app/Code";

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
    const [evaluationResult, setEvaluationResult] = React.useState<string | string[]>("");
    const [aboutPopupVisible, setAboutPopupVisible] = React.useState(false);
    const [preferencesVisible, setPreferencesVisible] = React.useState(false);
    const [settings, settingsLoaded, updateSettings, reloadSettings] = useSettings(settingsErrorCallback);
    const [appStateLoaded, setAppStateLoaded] = React.useState<boolean>(false);
    const [previewDarkMode, setPreviewDarkMode] = React.useState<boolean | null>(null);
    const [selectedValues, setSelectedValues] = React.useState<{ [key: string]: unknown }>({ language: "javascript", oneLineEvaluation: false });
    const [fileTabs, setFileTabs] = React.useState<FileTabData[]>([]);
    const [activeTabKey, setActiveTabKey] = React.useState(0);
    const [disabledItems, setDisabledItems] = React.useState<(MenuKeys | ToolBarItems)[]>([]);
    const [reloadConfirmVisible, setReloadConfirmVisible] = React.useState(false);
    const [keepFileInEditorVisible, setKeepFileInEditorVisible] = React.useState(false);

    const fileNameRef = React.useRef<string>("");
    const lostFileNameRef = React.useRef<string>("");

    const setSelectedValue = React.useCallback(
        (key: "language" | "oneLineEvaluation", value: unknown) => {
            if (selectedValues[key] === value) {
                return;
            }
            const values = { ...selectedValues };
            values[key] = value;
            setSelectedValues(values);
        },
        [selectedValues]
    );

    // Antd theme-related hooks.
    const { token } = useAntdToken();
    const { setTheme, updateBackround } = useAntdTheme();

    // A hook for saving and restoring the window state.
    const { setStateSaverEnabled, restoreState } = useWindowStateSaver(10_000);

    // The i18n translation hook.
    const { translate, setLocale } = useTranslate();

    // Store the application's current window into a memoized variable.
    const appWindow = React.useMemo(() => getCurrent(), []);

    // Evaluate the active tab's code.
    const evaluateActiveCode = React.useCallback(() => {
        if (activeTabKey) {
            const tabScript = fileTabs.find(tab => tab.uid === activeTabKey);
            if (tabScript && settings) {
                if (tabScript.evalueate_per_line) {
                    evalueateValueByLines(tabScript.content, settings.skip_undefined_on_js, settings.skip_empty_on_js, tabScript.script_language)
                        .then(value => {
                            setEvaluationResult(value.map(f => `${translate("line", "Line")} ${f}`));
                        })
                        .catch(error => notification("error", error));
                } else {
                    evalueateValue(tabScript.content, true, tabScript.script_language)
                        .then(value => {
                            setEvaluationResult(value);
                        })
                        .catch(error => notification("error", error));
                }
            }
        }
    }, [activeTabKey, fileTabs, notification, settings, translate]);

    const setAppStateToState = React.useCallback((state: AppStateResult) => {
        setFileTabs(state.file_tabs);
        if (state.active_tab_id !== null && state.active_tab_id > 0) {
            setActiveTabKey(state.active_tab_id);
        }
    }, []);

    // Load the initial application state consisting of the file tabs and related data.
    React.useEffect(() => {
        if (appStateLoaded && settingsLoaded) {
            return;
        }

        loadFileState()
            .then(() => {
                getAppState()
                    .then((result: AppStateResult) => {
                        setAppStateToState(result);
                        setAppStateLoaded(true);
                        evaluateActiveCode();
                    })
                    .catch(error => notification("error", error));
            })
            .catch(error => notification("error", error));
    }, [appStateLoaded, evaluateActiveCode, notification, setAppStateToState, settingsLoaded]);

    // Check if the active tab's file has been changed in the filesystem.
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

    // Check if the active tab's file has disappeared from the filesystem.
    const checkFileLostFs = React.useCallback(() => {
        const tabScript = fileTabs.find(tab => tab.uid === activeTabKey);
        if (tabScript) {
            isExistingFileMissingInFs(tabScript)
                .then(result => {
                    if (result) {
                        lostFileNameRef.current = tabScript.file_name;
                        setKeepFileInEditorVisible(true);
                    }
                })
                .catch(error => notification("error", error));
        }
    }, [fileTabs, activeTabKey, notification]);

    // Enable or disable the specified menu or toolbar item.
    const enableDisableMenuToolbarItem = React.useCallback(
        (mtItem: MenuKeys | ToolBarItems, enabled: boolean) => {
            if (enabled) {
                if (disabledItems.includes(mtItem)) {
                    setDisabledItems(f => f.filter(item => item !== mtItem));
                }
            } else {
                if (!disabledItems.includes(mtItem)) {
                    setDisabledItems(f => (f.includes(mtItem) ? f : [...f, mtItem]));
                }
            }
        },
        [disabledItems]
    );

    // Disable the "Convert to JavaScript" menu item if the currently selected file is not a JavaScript file.
    React.useEffect(() => {
        const tabScript = fileTabs.find(tab => tab.uid === activeTabKey);
        if (tabScript) {
            enableDisableMenuToolbarItem("convertToJs", tabScript.script_language === "typescript");
            setSelectedValue("oneLineEvaluation", tabScript.evalueate_per_line);

            checkTabFileChanged();
            checkFileLostFs();
        }
    }, [activeTabKey, checkFileLostFs, checkTabFileChanged, enableDisableMenuToolbarItem, fileTabs, setSelectedValue]);

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
        if (!appStateLoaded || !settingsLoaded) {
            return Promise.resolve();
        }

        return updateOpenTabs(fileTabs)
            .then(() => {
                void saveOpenTabs()
                    .then(() => {
                        getAppState()
                            .then((result: AppStateResult) => {
                                setAppStateToState(result);
                            })
                            .catch(error => notification("error", error));
                    })
                    .catch(error => notification("error", error));
            })
            .catch(error => notification("error", error));
    }, [appStateLoaded, fileTabs, notification, setAppStateToState, settingsLoaded]);

    // A debounced callback to save the current file tabs if nothing has changed in 5 seconds.
    useDebounce(saveFileTabs, 5_000); // TODO::Make this configurable

    // A callback to close the application returning always false to not to prevent the app from closing.
    const onClose = React.useCallback(async () => {
        const saveTabsPromise = saveFileTabs();
        const updateSettingsPromise = () => {
            if (settings) {
                return updateSettings(settings);
            }

            return Promise.resolve();
        };

        try {
            await Promise.all([saveTabsPromise, updateSettingsPromise()]);
        } catch (error) {
            notification("error", error);
        }

        return false;
    }, [notification, saveFileTabs, settings, updateSettings]);

    // A callback to to set the about popup hidden when closed.
    const aboutPopupClose = React.useCallback(() => {
        setAboutPopupVisible(false);
    }, []);

    // A callback to reload the application state.
    const reloadAppState = React.useCallback(() => {
        getAppState()
            .then((result: AppStateResult) => {
                setAppStateToState(result);
            })
            .catch(error => notification("error", error));
    }, [notification, setAppStateToState]);

    // A callback to reload the current file contents.
    const reloadCurrentFileContents = React.useCallback(() => {
        const newTabs = [...fileTabs];
        const index = newTabs.findIndex(f => f.uid === activeTabKey);
        if (index !== -1 && newTabs[index].file_name_path !== null) {
            reloadFileContents(newTabs[index])
                .then(() => {
                    reloadAppState();
                })
                .catch(error => notification("error", error));
        }
    }, [activeTabKey, fileTabs, reloadAppState, notification]);

    // A callback to open an existing file.
    const openExistingFileWrapped = React.useCallback(
        (filePath: string) => {
            return openExistingFile(filePath)
                .then(() => {
                    saveOpenTabs()
                        .then(() => {
                            getAppState()
                                .then((result: AppStateResult) => {
                                    setAppStateToState(result);
                                })
                                .catch(error => notification("error", error));
                        })
                        .catch(error => notification("error", error));
                })
                .catch(error => notification("error", error));
        },
        [notification, setAppStateToState]
    );

    // A callback to save the application state and reload it afterwards.
    const saveAppStateReload = React.useCallback(async () => {
        return saveOpenTabs()
            .then(() => {
                getAppState()
                    .then((result: AppStateResult) => {
                        setAppStateToState(result);
                    })
                    .catch(error => notification("error", error));
            })
            .catch(error => notification("error", error));
    }, [notification, setAppStateToState]);

    // Enable or disable the "Save", "Save As" and "Evaluate Code" menu and toolbar items
    // based on the currently selected tab.
    React.useEffect(() => {
        const tab = fileTabs.findIndex(tab => tab.uid === activeTabKey);
        enableDisableMenuToolbarItem("save", tab !== -1);
        enableDisableMenuToolbarItem("saveAs", tab !== -1);
        enableDisableMenuToolbarItem("evaluateCode", tab !== -1);
    }, [activeTabKey, enableDisableMenuToolbarItem, fileTabs]);

    // A callback to save the tab specified by the tab key.
    const saveFileCallback = React.useCallback(
        async (tabkey: number) => {
            return saveTab(tabkey, fileTabs, translate, saveAppStateReload, notification);
        },
        [fileTabs, translate, saveAppStateReload, notification]
    );

    // A callback to handle menu item and toolbar item clicks.
    const onMenuItemClick = React.useCallback(
        (key: unknown, checked?: boolean) => {
            const keyValue = key as MenuKeys;
            switch (keyValue) {
                case "exitMenu": {
                    void Promise.resolve(onClose()).then(result => {
                        if (!result) {
                            void appWindow.close();
                        }
                    });
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
                    void open(getOpenDialogFilter(translate))
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
                                script_language: selectedValues["language"] as ScriptType,
                                content: null,
                                file_name: newFileName,
                                modified_at: null,
                                file_name_path: null,
                                modified_at_state: new Date(),
                                evalueate_per_line: false,
                            })
                                .then(() => {
                                    saveAppStateReload().catch(error => notification("error", error));
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
                case "save": {
                    void saveFileCallback(activeTabKey).catch(error => notification("error", error));

                    break;
                }
                case "saveAs": {
                    const index = fileTabs.findIndex(f => f.uid === activeTabKey);
                    if (index !== -1) {
                        const tab = fileTabs[index];
                        save(getDialogFilter(translate, tab))
                            .then((fileName: string | null) => {
                                if (fileName) {
                                    saveFileContents(tab, fileName)
                                        .then(() => saveAppStateReload())
                                        .catch(error => notification("error", error));
                                }
                            })
                            .catch(error => notification("error", error));
                    }
                    break;
                }
                case "evaluateCode": {
                    evaluateActiveCode();
                    break;
                }
                case "oneLineEvaluation": {
                    setSelectedValue("oneLineEvaluation", checked ?? false);

                    const tabs = [...fileTabs];
                    const index = tabs.findIndex(f => f.uid === activeTabKey);
                    if (index !== -1) {
                        const tab = fileTabs[index];
                        tab.evalueate_per_line = !tab.evalueate_per_line;
                        setFileTabs(tabs);
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        },
        [
            activeTabKey,
            appWindow,
            evaluateActiveCode,
            fileTabs,
            notification,
            onClose,
            openExistingFileWrapped,
            reloadCurrentFileContents,
            saveAppStateReload,
            saveFileCallback,
            selectedValues,
            setSelectedValue,
            translate,
        ]
    );

    // A callback to do checks when the focus changes.
    const focusChangedCallback = React.useCallback(() => {
        checkTabFileChanged();
        checkFileLostFs();
    }, [checkFileLostFs, checkTabFileChanged]);

    // Tauri v2 uses async unlisten functions, so handle the effect a bit differently.
    React.useEffect(() => {
        const unlistenPromise = getCurrent().onFocusChanged(({ payload: focused }) => {
            if (focused) {
                focusChangedCallback();
            }
        });

        // Return a cleanup function as a promise resove chain.
        return () => {
            unlistenPromise
                .then(unlisten => {
                    unlisten();
                })
                .catch(error => {
                    notification("error", error);
                });
        };
    }, [fileTabs, focusChangedCallback, notification]);

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
        (output: string | string[]) => {
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
    }, [appWindow, notification, saveFileTabs, settings, updateSettings]);

    // A callback after the reload confirm popup is closed and a result from the popup is received.
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

    const keepFileInEditorConfirmClose = React.useCallback(
        (result: DialogResult) => {
            setKeepFileInEditorVisible(false);
            if (result === DialogResult.Yes) {
                const tabScript = fileTabs.find(tab => tab.uid === activeTabKey);
                if (tabScript) {
                    setKeepCurrentFileInEditor(tabScript)
                        .then(() => {
                            reloadCurrentFileContents();
                        })
                        .catch(error => notification("error", error));
                }
            } else {
                const newTabs = [...fileTabs];
                const index = newTabs.findIndex(f => f.uid === activeTabKey);
                newTabs.splice(index, 1);
                setFileTabs(newTabs);
                void saveFileTabs().catch(error => notification("error", error));
            }
        },
        [activeTabKey, fileTabs, notification, reloadCurrentFileContents, saveFileTabs]
    );

    const evaluateEditorValue = React.useMemo(() => {
        return Array.isArray(evaluationResult) ? evaluationResult.join("\n") : evaluationResult;
    }, [evaluationResult]);

    // Render loading indicator if the settings and app state are not loaded yet.
    if (!settingsLoaded || settings === null || appStateLoaded === false) {
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
                darkMode={previewDarkMode ?? settings.dark_mode ?? false}
            />
            <div className={classNames(App.name, className)}>
                <div id="mainView" className="App-itemsView">
                    <TabbedEditor //
                        darkMode={previewDarkMode ?? settings.dark_mode ?? false}
                        onNewOutput={onNewOutput}
                        fileTabs={fileTabs}
                        activeTabKey={activeTabKey}
                        setActiveTabKey={setActiveTabKey}
                        setFileTabs={setFileTabs}
                        setActiveTabScriptType={setScriptStype}
                        saveFileTabs={saveFileTabs}
                        saveTab={saveFileCallback}
                        notification={notification}
                        settings={settings}
                    />
                    <div className="EditorResultContainer">
                        {translate("result", "Result")}
                        <Editor //
                            theme={previewDarkMode ?? settings.dark_mode ?? false ? "vs-dark" : "light"}
                            className="EditorResult"
                            value={evaluateEditorValue}
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
            <ConfirmPopup //
                visible={keepFileInEditorVisible}
                mode={PopupType.Confirm}
                message={translate("fileNoLongerExistsKeepInEditor", "The file '{{file}}' no longer exists. Keep the file in the editor?", { file: lostFileNameRef.current })}
                buttons={DialogButtons.Yes | DialogButtons.No}
                onClose={keepFileInEditorConfirmClose}
            />
        </>
    );
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
