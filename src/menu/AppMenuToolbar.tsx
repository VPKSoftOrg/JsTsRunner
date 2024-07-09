/*
MIT License

Copyright (c) 2024 VPKSoft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import * as React from "react";
import { styled } from "styled-components";
import classNames from "classnames";
import { CommonProps } from "../components/Types";
import { useTranslate } from "../localization/Localization";
import { AppMenu } from "./AppMenu";
import { AppToolbar } from "./AppToolbar";
import { appMenuItems, MenuKeys } from "./MenuItems";
import { appToolbarItems, ToolBarItems } from "./ToolbarItems";

/**
 * The props for the {@link AppMenuToolbar} component.
 */
type AppMenuToolbarProps = {
    selectValues: {
        [key: string]: string;
    };
    disabledItems?: (MenuKeys | ToolBarItems)[];
    darkMode?: boolean;
    onItemClick: (key: MenuKeys) => void;
    onSelectChange(value: string, name?: string): void;
} & CommonProps;

/**
 * A combined menu and toolbar component.
 * @param param0 The component props: {@link AppMenuToolbarProps}.
 * @returns A component.
 */
const AppMenuToolbarComponent = ({
    className, //
    selectValues,
    disabledItems,
    darkMode,
    onItemClick,
    onSelectChange,
}: AppMenuToolbarProps) => {
    const { translate } = useTranslate();

    const onToolbarItemInternal = React.useCallback(
        (key: unknown) => {
            onItemClick(key as MenuKeys);
        },
        [onItemClick]
    );

    return (
        <div //
            className={classNames(AppMenuToolbar.name, className)}
        >
            <AppMenu //
                items={appMenuItems(translate, disabledItems as MenuKeys[] | undefined)}
                onItemClick={onToolbarItemInternal}
            />
            <AppToolbar //
                toolBarItems={appToolbarItems(translate, darkMode, disabledItems)}
                onItemClick={onToolbarItemInternal}
                onSelectChange={onSelectChange}
                selectValues={selectValues}
            />
        </div>
    );
};

const AppMenuToolbar = styled(AppMenuToolbarComponent)`
    display: flex;
    flex-direction: column;
    min-height: 0px;
    margin-bottom: 10px;
`;

export { AppMenuToolbar };
