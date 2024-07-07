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
import Select from "antd/es/select";
import { FieldNames } from "rc-select/lib/Select";
import { CommonProps } from "../Types";

/**
 * The props for the {@link SelectWithLabel} component.
 */
type SelectWithLabelProps = {
    options?: { value: string; label: string }[] | undefined;
    fieldNames?: FieldNames | undefined;
    label: string;
    name?: string;
    value: string;
    width?: string;
    disabled?: boolean;
    valueChanged: (value: string, name?: string) => void;
} & CommonProps;

/**
 * A select component with a label.
 * @param param0 The component props: {@link SelectWithLabelProps}.
 * @returns A component.
 */
const SelectWithLabelComponent = ({
    className, //
    options,
    fieldNames,
    name,
    label,
    value,
    key,
    disabled,
    valueChanged,
}: SelectWithLabelProps) => {
    const defaultValue = React.useMemo(() => options?.[0]?.value, [options]);

    const onSelect = React.useCallback(
        (value: string) => {
            valueChanged(value, name);
        },
        [name, valueChanged]
    );

    return (
        <div //
            className={classNames(SelectWithLabel.name, className)}
            key={key}
        >
            <div className="Label">{label}</div>
            <Select //
                className="Select-width"
                options={options}
                fieldNames={fieldNames}
                value={value}
                onSelect={onSelect}
                defaultValue={defaultValue}
                disabled={disabled}
            />
        </div>
    );
};

const SelectWithLabel = styled(SelectWithLabelComponent)`
    display: flex;
    flex-direction: row;
    .Select-width {
        width: ${props => props.width};
    }

    .Label {
        padding-right: 8px;
        align-self: center;
    }
`;

export { SelectWithLabel };
