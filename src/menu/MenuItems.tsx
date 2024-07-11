//@ts-expect-error - React is required for JSX
import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faDoorOpen, faCircleQuestion, faInfo, faGear, faFolderOpen, faArrowsRotate, faPlay, faCodeFork } from "@fortawesome/free-solid-svg-icons";
import { LocalizeFunction } from "../localization/Localization";
import { SaveAsIcon, SaveIcon } from "../img/ImageExports";
import { filterUsableMenuItems, ItemTypeShortcut, MenuItems, renderShortcut, SubItemTypeShortcut } from "./AppMenu";

/**
 * Creates the menu items for the application.
 *
 * @param {LocalizeFunction} localize The localization function to use.
 * @param {boolean} darkMode Whether the dark mode is enabled or not.
 * @param {MenuKeys[]} disabledItems The keys of the menu items that should be disabled.
 * @return {MenuItems} The menu items for the application.
 *
 * @remarks This function creates an *abstraction* to the use of the `antd` menu. Do not add more logic here to deepen the *abstraction*. If more complex logic is required, use the `antd` api directly.
 */
export const appMenuItems = (localize?: LocalizeFunction, darkMode?: boolean, disabledItems?: MenuKeys[]): MenuItems => {
    const result = [
        {
            key: "fileMenu",
            label: localize?.("fileMenu") ?? "File",
            icon: <FontAwesomeIcon icon={faFile} />,
            disabled: disabledItems?.includes("fileMenu"),
            children: [
                {
                    key: "preferencesMenu",
                    label: localize?.("preferences") ?? "Preferences",
                    icon: <FontAwesomeIcon icon={faGear} />,
                    disabled: disabledItems?.includes("preferencesMenu"),
                },
                {
                    type: "divider",
                },
                {
                    key: "openFile",
                    label: localize?.("openFile") ?? "Open File",
                    icon: <FontAwesomeIcon icon={faFolderOpen} />,
                    disabled: disabledItems?.includes("openFile"),
                    shortcut: {
                        keyboardKey: "o",
                        ctrlOrMeta: true,
                    },
                },
                {
                    key: "save",
                    label: localize?.("save") ?? "Save",
                    icon: <SaveIcon width={16} height={16} darkMode={darkMode} />,
                    disabled: disabledItems?.includes("save"),
                    shortcut: {
                        keyboardKey: "s",
                        ctrlOrMeta: true,
                    },
                },
                {
                    key: "saveAs",
                    label: localize?.("saveAs") ?? "Save As",
                    icon: <SaveAsIcon width={16} height={16} darkMode={darkMode} />,
                    disabled: disabledItems?.includes("saveAs"),
                    shortcut: {
                        keyboardKey: "s",
                        ctrlOrMeta: true,
                        alt: true,
                    },
                },
                {
                    type: "divider",
                },
                {
                    key: "reloadFromDisk",
                    label: localize?.("reloadFromDisk") ?? "Reload file from Disk",
                    icon: <FontAwesomeIcon icon={faArrowsRotate} />,
                    disabled: disabledItems?.includes("reloadFromDisk"),
                    shortcut: {
                        keyboardKey: "r",
                        ctrlOrMeta: true,
                    },
                },
                {
                    type: "divider",
                },
                {
                    key: "exitMenu",
                    label: localize?.("exitMenu") ?? "Exit",
                    icon: <FontAwesomeIcon icon={faDoorOpen} />,
                    disabled: disabledItems?.includes("exitMenu"),
                },
            ],
        },
        {
            key: "codeMenu",
            label: localize?.("codeMenu") ?? "Code",
            icon: <FontAwesomeIcon icon={faGear} />,
            disabled: disabledItems?.includes("codeMenu"),
            children: [
                {
                    key: "convertToJs",
                    label: localize?.("convertToJs") ?? "Convert to JavaScript",
                    icon: <FontAwesomeIcon icon={faCodeFork} />,
                    disabled: disabledItems?.includes("convertToJs"),
                },
                {
                    key: "evaluateCode",
                    label: localize?.("evaluateCode") ?? "Evaluate Code",
                    icon: <FontAwesomeIcon icon={faPlay} />,
                    disabled: disabledItems?.includes("evaluateCode"),
                    shortcut: {
                        keyboardKey: "e",
                        ctrlOrMeta: true,
                    },
                },
            ],
        },
        {
            key: "helpMenu",
            label: localize?.("helpMenu") ?? "Help",
            icon: <FontAwesomeIcon icon={faCircleQuestion} />,
            disabled: disabledItems?.includes("helpMenu"),
            children: [
                {
                    key: "aboutMenu",
                    label: localize?.("aboutMenu") ?? "About",
                    icon: <FontAwesomeIcon icon={faInfo} />,
                    disabled: disabledItems?.includes("aboutMenu"),
                },
            ],
        },
    ];

    addShortcutKeys(result);

    return result;
};

const addShortcutKeys = (items: MenuItems) => {
    const filterItems: (ItemTypeShortcut | SubItemTypeShortcut)[] = filterUsableMenuItems(items);

    for (const item of filterItems) {
        if (item.shortcut) {
            item.label = renderShortcut(typeof item.label === "string" ? item.label : null, item.shortcut);
        }
    }
};

export type MenuKeys =
    | "fileMenu" //
    | "helpMenu"
    | "aboutMenu"
    | "exitMenu"
    | "preferencesMenu"
    | "addNewTab"
    | "convertToJs"
    | "openFile"
    | "reloadFromDisk"
    | "save"
    | "saveAs"
    | "codeMenu"
    | "evaluateCode";
