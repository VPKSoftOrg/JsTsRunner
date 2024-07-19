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
import classNames from "classnames";
import { styled } from "styled-components";
import { Button, Modal } from "antd";
import { PopupTypeOk } from "../Enums";
import { CommonProps } from "../Types";
import { useTranslate } from "../../localization/Localization";
import { ErrorIcon, InformationIcon, WarningIcon } from "../../img/ImageExports";

/**
 * The props for the {@link MessagePopup} component.
 */
type MessagePopupProps = {
    /** A value indicating whether this popup is visible. */
    visible: boolean;
    /** The mode of the popup. */
    mode: PopupTypeOk;
    /** The message to display on the popup contents. */
    message: string;
    /** An optional title to override the default, which is generated from the {@link mode} prop value. */
    overrideTitle?: string;
    /** Occurs when the popup is closed. */
    onClose: () => void;
} & CommonProps;

/**
 * A popup component to display different icon depending on the {@link mode} prop.
 * @param param0 The component props: {@link MessagePopupProps}.
 * @returns A component.
 */
const MessagePopupComponent = ({
    className, //
    visible,
    mode,
    message,
    overrideTitle,
    onClose,
}: MessagePopupProps) => {
    // The i18n translation hook.
    const { translate } = useTranslate();
    const hideViaButton = React.useRef(false);

    // Memoize the popup title depending on the specified mode.
    const title = React.useMemo(() => {
        if (overrideTitle) {
            return overrideTitle;
        }

        switch (mode) {
            case PopupTypeOk.Information: {
                return translate("information");
            }
            case PopupTypeOk.Warning: {
                return translate("warning");
            }
            case PopupTypeOk.Error: {
                return translate("error");
            }
            default: {
                return translate("information");
            }
        }
    }, [mode, overrideTitle, translate]);

    // Close the dialog with the specified result.
    const onCloseCallback = React.useCallback(() => {
        // Set the ref to indicate that the
        // dialog was closed via a button to avoid double-callback
        // from the hiding event.
        hideViaButton.current = true;

        // Call the actual close callback.
        onClose();
    }, [onClose]);

    // The Ok button was clicked.
    const onOkClick = React.useCallback(() => {
        onCloseCallback();
    }, [onCloseCallback]);

    const icon = React.useMemo(() => {
        switch (mode) {
            case PopupTypeOk.Information: {
                return <InformationIcon className="Icon" />;
            }
            case PopupTypeOk.Warning: {
                return <WarningIcon className="Icon" />;
            }
            case PopupTypeOk.Error: {
                return <ErrorIcon className="Icon" />;
            }
            default: {
                return <InformationIcon className="Icon" />;
            }
        }
    }, [mode]);

    return (
        <Modal //
            title={title}
            open={visible}
            width={400}
            footer={null}
            onCancel={onOkClick}
            centered
        >
            <div className={classNames(MessagePopupComponent.name, className)}>
                <div className="Popup-content">
                    {icon}
                    <div className="Popup-messageText">{message}</div>
                </div>
                <div className="Popup-ButtonRow">
                    <Button //
                        onClick={onOkClick}
                    >
                        {translate("ok")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const MessagePopup = styled(MessagePopupComponent)`
    display: flex;
    flex-direction: column;
    height: 100%;
    .Icon {
        height: 100%;
        width: 30%;
    }
    .Popup-messageText {
        height: 100%;
        width: 70%;
        align-self: center;
        text-align: center;
        margin: 10px;
    }
    .Popup-content {
        display: flex;
        flex-direction: row;
        height: 100%;
        min-height: 100px;
        width: 100%;
    }
    .Popup-ButtonRow {
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: center;
        gap: 10px;
    }
`;

export { MessagePopup };
