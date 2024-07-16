//@ts-expect-error - React is required for JSX
import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate, faCodeFork, faDoorOpen, faGear, faInfo, faListOl, faPlus, faScrewdriver } from "@fortawesome/free-solid-svg-icons";
import { LocalizeFunction } from "../localization/Localization";

import { SaveAsIcon, SaveIcon } from "../img/ImageExports";
import { ToolBarItem, ToolBarSeparator } from "./AppToolbar";
import { MenuKeys } from "./MenuItems";

type ToolBarItems = "scriptType";

export const appToolbarItems = (localize?: LocalizeFunction, darkMode?: boolean, disabledItems?: (MenuKeys | ToolBarItems)[]): (ToolBarItem<MenuKeys> | ToolBarSeparator)[] => [
    {
        icon: <FontAwesomeIcon icon={faGear} />,
        title: localize?.("preferences") ?? "Preferences",
        tooltipTitle: localize?.("preferences") ?? "Preferences",
        clickActionObject: "preferencesMenu",
        type: "button",
        disabled: disabledItems?.includes("preferencesMenu"),
    },
    {
        icon: <FontAwesomeIcon icon={faDoorOpen} />,
        title: localize?.("exitMenu") ?? "Exit",
        tooltipTitle: localize?.("exitMenu") ?? "Exit",
        clickActionObject: "exitMenu",
        type: "button",
        disabled: disabledItems?.includes("exitMenu"),
    },
    "|",
    {
        icon: <FontAwesomeIcon icon={faInfo} />,
        title: localize?.("aboutMenu") ?? "About",
        tooltipTitle: localize?.("aboutMenu") ?? "About",
        clickActionObject: "aboutMenu",
        type: "button",
        disabled: disabledItems?.includes("aboutMenu"),
    },
    "|",
    {
        title: localize?.("scriptType") ?? "Script Type",
        type: "select",
        tooltipTitle: "",
        options: [
            { label: "JavaScript", value: "javascript" },
            { label: "TypeScript", value: "typescript" },
        ],
        fieldNames: { label: "label", value: "value" },
        name: "language",
        disabled: disabledItems?.includes("scriptType"),
    },
    "|",
    {
        icon: <FontAwesomeIcon icon={faCodeFork} />,
        title: localize?.("convertToJs") ?? "Convert to JavaScript",
        tooltipTitle: localize?.("convertToJs") ?? "Convert to JavaScript",
        clickActionObject: "convertToJs",
        type: "button",
        disabled: disabledItems?.includes("convertToJs"),
    },
    {
        icon: <FontAwesomeIcon icon={faArrowsRotate} />,
        title: localize?.("reloadFromDisk") ?? "Reload file from Disk",
        tooltipTitle: localize?.("reloadFromDisk") ?? "Reload file from Disk",
        clickActionObject: "reloadFromDisk",
        type: "button",
        disabled: disabledItems?.includes("reloadFromDisk"),
    },
    {
        icon: <FontAwesomeIcon icon={faPlus} />,
        title: localize?.("addNewTab") ?? "New tab",
        tooltipTitle: localize?.("addNewTab") ?? "New tab",
        clickActionObject: "addNewTab",
        type: "button",
        disabled: disabledItems?.includes("addNewTab"),
    },
    "|",
    {
        icon: <SaveIcon width={16} height={16} darkMode={darkMode} />,
        title: localize?.("save") ?? "Save",
        tooltipTitle: localize?.("save") ?? "Save",
        clickActionObject: "save",
        type: "button",
        disabled: disabledItems?.includes("save"),
    },
    {
        icon: <SaveAsIcon width={16} height={16} darkMode={darkMode} />,
        title: localize?.("saveAs") ?? "Save As",
        tooltipTitle: localize?.("saveAs") ?? "Save As",
        clickActionObject: "saveAs",
        type: "button",
        disabled: disabledItems?.includes("saveAs"),
    },
    "|",
    {
        icon: <FontAwesomeIcon icon={faListOl} />,
        title: localize?.("oneLineEvaluation") ?? "One line evaluation",
        tooltipTitle: localize?.("oneLineEvaluation") ?? "One line evaluation",
        clickActionObject: "oneLineEvaluation",
        type: "toggle",
        disabled: disabledItems?.includes("oneLineEvaluation"),
        name: "oneLineEvaluation",
    },
    "|",
    {
        icon: <FontAwesomeIcon icon={faScrewdriver} />,
        title: "Test",
        tooltipTitle: "Test something",
        clickActionObject: "test",
        type: "button",
        disabled: process.env.NODE_ENV !== "development",
        name: "test",
    },
];

export type { ToolBarItems };
