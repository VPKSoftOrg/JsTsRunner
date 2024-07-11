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

//@ts-expect-error - React is required for JSX
import * as React from "react";
import classNames from "classnames";
import { styled } from "styled-components";
import { CommonProps } from "../components/Types";
import saveAsIcon from "./floppy-diskette-with-pen-svgrepo-com.svg";
import saveIcon from "./floppy-disk-digital-data-storage-or-save-interface-symbol-svgrepo-com.svg";

type IconProps = CommonProps & {
    darkMode?: boolean;
    height?: string | number;
    width?: string | number;
    alt?: string;
    icon: string;
};

const SvgIcon = ({
    //
    className,
    key,
    height = 20,
    width = 20,
    alt,
    icon,
}: IconProps) => {
    return <img src={icon} alt={alt} width={width} height={height} key={key} className={classNames(SvgIcon.name, className)} />;
};

const StyledSvgIcon = styled(SvgIcon)`
    ${props => (props.darkMode === true ? "filter: invert(1);" : "")}
`;

const SaveAsIcon = (props: Omit<IconProps, "icon">) => {
    return <StyledSvgIcon icon={saveAsIcon} {...props} />;
};

const SaveIcon = (props: Omit<IconProps, "icon">) => {
    return <StyledSvgIcon icon={saveIcon} {...props} />;
};

export { SaveAsIcon, SaveIcon };
