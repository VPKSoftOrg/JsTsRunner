//@ts-expect-error - React is required for JSX
import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate, faDoorOpen, faGear, faInfo, faPlus } from "@fortawesome/free-solid-svg-icons";
import { LocalizeFunction } from "../localization/Localization";

import { ToolBarItem, ToolBarSeparator } from "./AppToolbar";
import { MenuKeys } from "./MenuItems";

export const appToolbarItems = (localize?: LocalizeFunction): (ToolBarItem<MenuKeys> | ToolBarSeparator)[] => [
    {
        icon: <FontAwesomeIcon icon={faGear} />,
        title: localize?.("preferences") ?? "Preferences",
        tooltipTitle: localize?.("preferences") ?? "Preferences",
        clickActionObject: "preferencesMenu",
        type: "button",
    },
    {
        icon: <FontAwesomeIcon icon={faDoorOpen} />,
        title: localize?.("exitMenu") ?? "Exit",
        tooltipTitle: localize?.("exitMenu") ?? "Exit",
        clickActionObject: "exitMenu",
        type: "button",
    },
    "|",
    {
        icon: <FontAwesomeIcon icon={faInfo} />,
        title: localize?.("aboutMenu") ?? "About",
        tooltipTitle: localize?.("aboutMenu") ?? "About",
        clickActionObject: "aboutMenu",
        type: "button",
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
    },
    "|",
    {
        icon: <FontAwesomeIcon icon={faArrowsRotate} />,
        title: localize?.("convertToJs") ?? "Convert to JavaScript",
        tooltipTitle: localize?.("convertToJs") ?? "Convert to JavaScript",
        clickActionObject: "convertToJs",
        type: "button",
    },
    {
        icon: <FontAwesomeIcon icon={faPlus} />,
        title: localize?.("addNewTab") ?? "New tab",
        tooltipTitle: localize?.("addNewTab") ?? "New tab",
        clickActionObject: "addNewTab",
        type: "button",
    },
];
