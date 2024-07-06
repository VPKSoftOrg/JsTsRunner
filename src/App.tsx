import * as React from "react";
import { useState } from "react";
import { styled } from "styled-components";
import { Editor } from "@monaco-editor/react";
import "./App.css";
import classNames from "classnames";
import { getCurrent } from "@tauri-apps/api/window";
import { StyledTitle } from "./components/app/WindowTitle";
import { useTranslate } from "./localization/Localization";
import { MenuKeys, appMenuItems } from "./menu/MenuItems";
import { AboutPopup } from "./components/popups/AboutPopup";
import { PreferencesPopup } from "./components/popups/PreferencesPopup";
import { useSettings } from "./utilities/app/Settings";
import { useWindowStateSaver } from "./hooks/UseWindowStateListener";
import { useAntdTheme, useAntdToken } from "./context/AntdThemeContext";
import { CommonProps, FileTabData, ScriptType } from "./components/Types";
import { AppMenuToolbar } from "./menu/AppMenuToolbar";
import { TabbedEditor } from "./components/app/TabbedEditor";
import { AppStateResult, addNewTab, getAppState, loadFileState, saveOpenTabs, updateOpenTabs } from "./components/app/TauriWrappers";
import { useNotify } from "./utilities/app/Notify";
import { useDebounce } from "./hooks/useDebounce";

type AppProps = CommonProps;

/**
 * Renders the main application component.
 *
 * @return {JSX.Element} The rendered application component.
 */
const App = ({ className }: AppProps) => {
    const [contextHolder, notification] = useNotify();
    const settingsErrorCallback = React.useCallback(
        (error: Error | string | unknown) => {
            notification("error", `${error}`);
        },
        [notification]
    );

    const [evaluationResult, setEvaluationResult] = useState("");
    const [aboutPopupVisible, setAboutPopupVisible] = React.useState(false);
    const [preferencesVisible, setPreferencesVisible] = React.useState(false);
    const [settings, settingsLoaded, updateSettings, reloadSettings] = useSettings(settingsErrorCallback);
    const { token } = useAntdToken();
    const { setStateSaverEnabled, restoreState } = useWindowStateSaver(10_000);
    const { setTheme, updateBackround } = useAntdTheme();
    const [previewDarkMode, setPreviewDarkMode] = React.useState<boolean | null>(null);
    const [selectedValues, setSelectedValues] = React.useState<{ [key: string]: string }>({ language: "javascript" });
    const [fileTabs, setFileTabs] = React.useState<FileTabData[]>([]);
    const appWindow = React.useMemo(() => getCurrent(), []);
    const indexRef = React.useRef<number>(0);
    const appStateLoaded = React.useRef<boolean>(false);

    React.useEffect(() => {
        if (appStateLoaded.current && !settingsLoaded) {
            return;
        }
        loadFileState()
            .then(() => {
                getAppState()
                    .then((result: AppStateResult) => {
                        setFileTabs(result.file_tabs);
                        indexRef.current = result.file_index;
                        appStateLoaded.current = true;
                    })
                    .catch(error => notification("error", error));
            })
            .catch(error => notification("error", error));
    }, [notification, settingsLoaded]);

    React.useEffect(() => {
        if (settingsLoaded && settings !== null) {
            setStateSaverEnabled(settings.save_window_state);
            void restoreState();
        }
    }, [restoreState, settingsLoaded, settings, setStateSaverEnabled]);

    const { translate, setLocale } = useTranslate();

    React.useEffect(() => {
        if (settings && setTheme) {
            void setLocale(settings.locale);
            setTheme(settings.dark_mode ? "dark" : "light");
        }
    }, [setLocale, setTheme, settings]);

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

    useDebounce(saveFileTabs, 5_000);

    const onClose = React.useCallback(() => {
        return false;
    }, []);

    const aboutPopupClose = React.useCallback(() => {
        setAboutPopupVisible(false);
    }, []);

    const menuItems = React.useMemo(() => {
        return appMenuItems(translate);
    }, [translate]);

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
                case "addNewTab": {
                    let newFileName = translate("newFileWithIndex", "New file {{index}}", { index: indexRef.current + 1 });
                    newFileName += selectedValues["language"] === "typescript" ? ".ts" : ".js";

                    void addNewTab({
                        index: 0,
                        path: null,
                        is_temporary: true,
                        script_language: selectedValues["language"],
                        content: null,
                        file_name: newFileName,
                    })
                        .then(() => {
                            getAppState()
                                .then((result: AppStateResult) => {
                                    setFileTabs(result.file_tabs);
                                    indexRef.current = result.file_index;
                                })
                                .catch(error => notification("error", error));
                        })
                        .catch(error => notification("error", error));
                    break;
                }
                default: {
                    break;
                }
            }
        },
        [appWindow, notification, selectedValues, translate]
    );

    const onPreferencesClose = React.useCallback(() => {
        setPreferencesVisible(false);
        void reloadSettings().then(() => {
            setPreviewDarkMode(null);
            setTheme && setTheme(settings?.dark_mode ? "dark" : "light");
        });
    }, [reloadSettings, setTheme, settings?.dark_mode]);

    // This effect occurs when the theme token has been changed and updates the
    // root and body element colors to match to the new theme.
    React.useEffect(() => {
        updateBackround && updateBackround(token);
    }, [token, updateBackround]);

    const toggleDarkMode = React.useCallback(
        (antdTheme: "light" | "dark") => {
            setTheme && setTheme(antdTheme);
            setPreviewDarkMode(antdTheme === "dark");
        },
        [setTheme]
    );

    const onNewOutput = React.useCallback(
        (output: string) => {
            setEvaluationResult(output);
        },
        [setEvaluationResult]
    );

    const onSelectedValueChanged = React.useCallback(
        (value: string, name?: string) => {
            if (name) {
                setSelectedValues({ ...selectedValues, [name]: value });
            }
        },
        [selectedValues]
    );

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

    if (!settingsLoaded || settings === null) {
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
                menuItems={menuItems}
                onItemClick={onMenuItemClick}
                selectValues={selectedValues}
                onSelectChange={onSelectedValueChanged}
            />
            <div className={classNames(App.name, className)}>
                <div id="mainView" className="App-itemsView">
                    <TabbedEditor //
                        darkMode={previewDarkMode ?? settings.dark_mode ?? false}
                        onNewOutput={onNewOutput}
                        activeTabScriptType={selectedValues["language"] as ScriptType}
                        fileTabs={fileTabs}
                        setFileTabs={setFileTabs}
                    />
                    <div className="EditorResultContainer">
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
