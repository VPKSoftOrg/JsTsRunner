//@ts-expect-error - React is required for JSX
import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faDoorOpen, faCircleQuestion, faInfo, faGear } from "@fortawesome/free-solid-svg-icons";
import { LocalizeFunction } from "../localization/Localization";
import { MenuItems } from "./AppMenu";

export const appMenuItems = (localize?: LocalizeFunction, disabledItems?: MenuKeys[]): MenuItems => [
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

export type MenuKeys = "fileMenu" | "helpMenu" | "aboutMenu" | "exitMenu" | "preferencesMenu" | "addNewTab" | "convertToJs";
