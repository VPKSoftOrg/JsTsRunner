//@ts-expect-error - React is required for JSX
import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faDoorOpen, faCircleQuestion, faInfo, faGear, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { LocalizeFunction } from "../localization/Localization";
import { SaveAsIcon, SaveIcon } from "../img/ImageExports";
import { filterUsableMenuItems, ItemTypeShortcut, MenuItems, renderShortcut, SubItemTypeShortcut } from "./AppMenu";

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
                    key: "exitMenu",
                    label: localize?.("exitMenu") ?? "Exit",
                    icon: <FontAwesomeIcon icon={faDoorOpen} />,
                    disabled: disabledItems?.includes("exitMenu"),
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
    | "saveAs";
