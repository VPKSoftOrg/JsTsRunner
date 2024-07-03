import * as React from "react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { exit } from "@tauri-apps/plugin-process";
import { styled } from "styled-components";
import { Editor } from "@monaco-editor/react";
import "./App.css";
import { Tabs } from "antd";
import classNames from "classnames";
import * as ts from "typescript";
import { StyledTitle } from "./components/app/WindowTitle";
import { useTranslate } from "./localization/Localization";
import { AppMenu } from "./menu/AppMenu";
import { MenuKeys, appMenuItems } from "./menu/MenuItems";
import { AboutPopup } from "./components/popups/AboutPopup";
import { AppToolbar } from "./menu/AppToolbar";
import { appToolbarItems } from "./menu/ToolbarItems";
import { PreferencesPopup } from "./components/popups/PreferencesPopup";
import { useSettings } from "./utilities/app/Settings";
import { useWindowStateSaver } from "./hooks/UseWindowStateListener";
import { useAntdTheme, useAntdToken } from "./context/AntdThemeContext";
import { CommonProps } from "./components/Types";
import { AppMenuToolbar } from "./menu/AppMenuToolbar";
import { TabbedEditor } from "./components/app/TabbedEditor";

type AppProps = CommonProps;

/**
 * Renders the main application component.
 *
 * @return {JSX.Element} The rendered application component.
 */
const App = ({ className }: AppProps) => {
    const [greetMsg, setGreetMsg] = useState("");
    const [evaluationResult, setEvaluationResult] = useState("");
    const [aboutPopupVisible, setAboutPopupVisible] = React.useState(false);
    const [preferencesVisible, setPreferencesVisible] = React.useState(false);
    const [settings, settingsLoaded, updateSettings, reloadSettings] = useSettings();
    const { token } = useAntdToken();
    const { setStateSaverEnabled, restoreState } = useWindowStateSaver(10_000);
    const { setTheme, updateBackround } = useAntdTheme();
    const [previewDarkMode, setPreviewDarkMode] = React.useState<boolean | null>(null);

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

    const greet = React.useCallback(async () => {
        // Learn more about Tauri commands at https://github.com/VPKSoftOrg/JsTsRunner/v1/guides/features/command
        if (evaluationResult.trim().length > 0) {
            const value: string = await invoke("run_script", { code: evaluationResult });
            setGreetMsg(value);
        }
    }, [evaluationResult]);

    React.useEffect(() => {
        void greet();
    }, [greet, evaluationResult]);

    const onClose = React.useCallback(() => {
        return false;
    }, []);

    const aboutPopupClose = React.useCallback(() => {
        setAboutPopupVisible(false);
    }, []);

    const onFinish = React.useCallback(async (e: { greetName: string }) => {
        setEvaluationResult(e.greetName);
    }, []);

    const menuItems = React.useMemo(() => {
        return appMenuItems(translate);
    }, [translate]);

    const onMenuItemClick = React.useCallback((key: unknown) => {
        const keyValue = key as MenuKeys;
        switch (keyValue) {
            case "exitMenu": {
                void exit(0);
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
            default: {
                break;
            }
        }
    }, []);

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

    if (!settingsLoaded || settings === null) {
        return <div>Loading...</div>;
    }

    return (
        <>
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
            />
            <div className={classNames(App.name, className)}>
                <div id="mainView" className="App-itemsView">
                    <TabbedEditor //
                        darkMode={previewDarkMode ?? settings.dark_mode ?? false}
                    />
                    <div className="EditorResultContainer">
                        <Editor //
                            theme="vs-dark"
                            className="EditorResult"
                            language="json"
                        />
                    </div>
                </div>
            </div>
            <AboutPopup //
                visible={aboutPopupVisible}
                onClose={aboutPopupClose}
                textColor="white"
            />
            {updateSettings && (
                <PreferencesPopup //
                    visible={preferencesVisible}
                    onClose={onPreferencesClose}
                    updateSettings={updateSettings}
                    settings={settings}
                    translate={translate}
                    toggleDarkMode={toggleDarkMode}
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
