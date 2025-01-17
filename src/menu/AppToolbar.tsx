/*
MIT License

Copyright (c) 2024 Petteri Kautonen

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
import { FieldNames } from "rc-select/lib/Select";
import { CommonProps } from "../components/Types";
import { TooltipObjectButton } from "../components/wrappers/TooltipObjectButton";
import { SelectWithLabel } from "../components/wrappers/SelectWithLabel";
import { ToolTipObjectToggleButton } from "../components/wrappers/ToolTipObjectToggleButton";

export type ToolBarItem<T> = {
    icon?: React.ReactNode;
    title: string;
    tooltipTitle: string;
    clickActionObject?: T;
    type: "button" | "select" | "toggle";
    options?: { value: string; label: string }[] | undefined;
    fieldNames?: FieldNames | undefined;
    name?: string;
    disabled?: boolean;
};

export type ToolBarSeparator = "|";

/**
 * The props for the {@link AppToolbar} component.
 */
export type AppToolbarProps<T> = {
    toolBarItems: (ToolBarItem<T> | ToolBarSeparator)[];
    selectValues: {
        [key: string]: unknown;
    };
    onItemClick: (item: T, checked?: boolean) => void;
    onSelectChange(value: unknown, name?: string): void;
} & CommonProps;

// Type quard for tool bar item
const isToolBarSeparator = <T,>(item: ToolBarItem<T> | ToolBarSeparator): item is ToolBarSeparator => {
    return (item as ToolBarSeparator) === "|";
};

/**
 * A component for the application toolbar for the PasswordKeeper.
 * @param param0 The component props {@link AppToolbarProps}.
 * @returns A component.
 */
const AppToolbarComponent = <T,>({
    className, //
    toolBarItems,
    selectValues,
    onItemClick,
    onSelectChange,
}: AppToolbarProps<T>) => {
    const onClick = React.useCallback(
        (item: unknown, checked?: boolean) => {
            onItemClick(item as T, checked);
        },
        [onItemClick]
    );

    return (
        <div className={classNames(AppToolbar.name, className)}>
            {toolBarItems.map((item, index) =>
                isToolBarSeparator(item) ? (
                    <span
                        key={index} //
                        className="AppToolbar-separator"
                    />
                ) : (
                    createToolbarItem(item, onClick, onSelectChange, selectValues, index)
                )
            )}
        </div>
    );
};

/**
 * Creates a single toolbar item.
 * @param {ToolBarItem<T>} item The item to create.
 * @param {() => void} onClick The click handler for the item.
 * @param {(value: string, name?: string) => void} onSelectChange The select change handler for the item.
 * @param {{[key: string]: string}} selectValues The select values for the item.
 * @param {number} index The index of the item.
 * @returns A single toolbar item.
 */
const createToolbarItem = <T,>(
    item: ToolBarItem<T>,
    onClick: (item: unknown, checked?: boolean) => void,
    onSelectChange: (value: unknown, name?: string) => void,
    selectValues: { [key: string]: unknown },
    index: number
): JSX.Element => {
    if (item.type === "button") {
        return (
            <TooltipObjectButton //
                icon={item.icon}
                tooltipTitle={item.tooltipTitle}
                objectData={item.clickActionObject}
                onClick={onClick}
                key={index}
                disabled={item.disabled}
            />
        );
    }

    if (item.type === "select" && item.name) {
        return (
            <SelectWithLabel //
                label={item.title}
                options={item.options}
                fieldNames={item.fieldNames}
                valueChanged={onSelectChange}
                name={item.name}
                value={selectValues[item.name] as string}
                key={index}
                disabled={item.disabled}
            />
        );
    }

    if (item.type === "toggle" && item.name) {
        return (
            <ToolTipObjectToggleButton //
                icon={item.icon}
                tooltipTitle={item.tooltipTitle}
                objectData={item.clickActionObject}
                onClick={onClick}
                checked={selectValues[item.name] as boolean}
                key={index}
                disabled={item.disabled}
            />
        );
    }

    return <></>;
};

const AppToolbar = styled(AppToolbarComponent)`
    display: flex;
    flex-direction: row;
    gap: 4px;
    .AppToolbar-separator {
        width: 4px;
    }
    .Select-width {
        width: 200px;
    }
`;

export { AppToolbar };
