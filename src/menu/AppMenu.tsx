import * as React from "react";
import { Menu, MenuProps } from "antd";
import { MenuInfo, MenuMode } from "rc-menu/lib/interface";
import { styled } from "styled-components";
import classNames from "classnames";
import { ItemType, MenuDividerType, MenuItemType, SubMenuType } from "antd/es/menu/interface";
import { CommonProps } from "../components/Types";
import { MenuKeys } from "./MenuItems";

export type ShortcutKey = {
    shortcut?: {
        keyboardKey?: string;
        ctrl?: boolean;
        shift?: boolean;
        alt?: boolean;
    };
};

type MenuItemTypeShortcut = MenuItemType & ShortcutKey;
type ItemTypeShortcut = ItemType<MenuItemTypeShortcut> & ShortcutKey;
type SubItemTypeShortcut = SubMenuType<MenuItemTypeShortcut> & ShortcutKey;

export type MenuItems = (ItemTypeShortcut | SubItemTypeShortcut | MenuDividerType)[];

// Typeguard for SubMenuType via the children prop
const isSubMenu = (item: ItemTypeShortcut | SubItemTypeShortcut | MenuDividerType): item is SubItemTypeShortcut => "children" in item;

const isMenuDivider = (item: ItemTypeShortcut | SubItemTypeShortcut | MenuDividerType): item is MenuDividerType => "type" in item && item.type === "divider";

/**
 * The props for the {@link AppMenu} component.
 */
export type AppMenuProps = {
    /** The menu items for the application menu. */
    items: MenuItems;
    /** The mode of the application menu. */
    mode?: MenuMode;
    /**
     * Occurs then the menu item was clicked.
     * @param key The action key from the menu item.
     * @returns {void}
     */
    onItemClick: (key: MenuKeys) => void;
} & CommonProps;

/**
 * A component for the application menu for the PasswordKeeper.
 * @param param0 The component props {@link AppMenuProps}.
 * @returns A component.
 */
const AppMenu = ({
    items,
    className, //
    mode = "horizontal",
    onItemClick,
}: AppMenuProps) => {
    const onClick: MenuProps["onClick"] = React.useCallback(
        (e: MenuInfo) => {
            const key = e.key as MenuKeys;
            onItemClick(key);
        },
        [onItemClick]
    );

    React.useEffect(() => {
        const menuKeyDown = (e: KeyboardEvent) => {
            // Collect the items children props into an array
            const subMenuItems = items.filter(f => !isMenuDivider(f));
            const allItems: (ItemTypeShortcut | SubItemTypeShortcut)[] = [];

            for (const item of subMenuItems) {
                allItems.push(item);
                if (isSubMenu(item)) {
                    const subItems = (item.children as (MenuDividerType | ItemTypeShortcut)[]).filter(child => !isMenuDivider(child)).map(child => child as ItemTypeShortcut);
                    allItems.push(...subItems);
                }
            }

            let keydItems = allItems.filter(item => {
                return item?.shortcut?.keyboardKey === e.key;
            });

            if (e.ctrlKey) {
                keydItems = keydItems.filter(item => {
                    return item.shortcut?.ctrl === true;
                });
            }

            if (e.shiftKey) {
                keydItems = keydItems.filter(item => {
                    return item.shortcut?.shift === true;
                });
            }

            if (e.altKey) {
                keydItems = keydItems.filter(item => {
                    return item.shortcut?.alt === true;
                });
            }

            if (keydItems.length > 0) {
                e.stopPropagation();
                e.preventDefault();
                onItemClick(keydItems[0].key as MenuKeys);
            }
        };

        window.addEventListener("keydown", menuKeyDown);

        return () => window.removeEventListener("keydown", menuKeyDown);
    }, [items, onItemClick]);

    return (
        <div className={classNames(AppMenu.name, className)}>
            <Menu //
                mode={mode}
                items={items}
                onClick={onClick}
            />
        </div>
    );
};

const StyledAppMenu = styled(AppMenu)`
    // Add style(s) here
`;

const renderShortcut = (shortcut: { keyboardKey?: string; ctrl?: boolean; shift?: boolean; alt?: boolean }) => {
    return (
        <>
            {shortcut && <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</>}
            {shortcut?.ctrl && <kbd>Ctrl</kbd>}
            {shortcut?.alt && <kbd>Alt</kbd>}
            {shortcut?.shift && <kbd>Shift</kbd>}
            {shortcut?.keyboardKey && <kbd>{shortcut.keyboardKey.toUpperCase()}</kbd>}
        </>
    );
};

export { StyledAppMenu as AppMenu };
export { renderShortcut };
