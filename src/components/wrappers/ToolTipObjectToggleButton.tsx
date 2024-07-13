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
import { Radio, Tooltip } from "antd";
import { CommonProps } from "../Types";

/**
 * The props for the {@link ToolTipObjectToggleButton} component.
 */
type ToolTipObjectToggleButtonProps<T> = {
    icon?: React.ReactNode;
    objectData: T;
    children?: React.ReactNode;
    tooltipTitle: string;
    disabled?: boolean;
    checked: boolean;
    onClick: (objectData: T | undefined, checked?: boolean) => void;
} & CommonProps;

/**
 * A toggle button component for toolbar.
 * @param param0 The component props: {@link ToolTipObjectToggleButtonProps}.
 * @returns A component.
 */
const ToolTipObjectToggleButtonComponent = <T,>({
    className, //
    tooltipTitle,
    key,
    disabled = false,
    objectData,
    icon,
    checked,
    onClick,
}: ToolTipObjectToggleButtonProps<T>) => {
    const onClickHandler = React.useCallback(() => {
        onClick(objectData, !checked);
    }, [objectData, onClick, checked]);

    return (
        <Tooltip title={tooltipTitle} key={key}>
            <Radio.Group //
                buttonStyle="solid"
                optionType="button"
                value={checked ? objectData : undefined}
            >
                <Radio //
                    className={classNames(ToolTipObjectToggleButton.name, className)}
                    checked={checked}
                    onClick={onClickHandler}
                    disabled={disabled}
                    value={objectData}
                >
                    {icon}
                </Radio>
            </Radio.Group>
        </Tooltip>
    );
};

const ToolTipObjectToggleButton = styled(ToolTipObjectToggleButtonComponent)`
    // Add style(s) here
`;

export { ToolTipObjectToggleButton };
