// This code is based on the And Design Tabs demo: https://ant.design/components/tabs#tabs-demo-custom-tab-bar-node
// I just refactored it.

import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, PointerSensor, closestCenter, useSensor } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type TabPaneProps, Tabs, type TabsProps } from "antd";
import classNames from "classnames";
import type { RenderTabBar, Tab } from "rc-tabs/lib/interface";
import * as React from "react";
import { styled } from "styled-components";
import type { Cursor } from "../Types";

/**
 * The props for the {@link DraggableTabs} component.
 */
type DraggableTabsProps = TabsProps & {
    setItems: (value: Tab[]) => void;
    onItemsReordered?: (value: Tab[]) => void;
    onDraggingChanged?: (dragging: boolean) => void;
};

/**
 * The props for the {@link DraggableTabPane} component.
 */
type DraggableTabPaneProps = React.HTMLAttributes<HTMLDivElement> & {
    "data-node-key": string;
    cursor?: Cursor | undefined;
} & TabPaneProps;

/**
 * A wrapper for the Antd {@link TabPane} component with drag and drop support.
 * @param param0 The component props: {@link DraggableTabPaneProps}.
 * @returns A component.
 */
const DraggableTabNode = ({ ...props }: DraggableTabPaneProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: props["data-node-key"],
    });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Translate.toString(transform),
        transition,
        cursor: props.cursor,
    };

    return React.cloneElement(
        props.children as React.ReactElement,
        {
            ref: setNodeRef,
            style,
            ...attributes,
            ...listeners,
        } as React.HTMLAttributes<HTMLDivElement>
    );
};

/**
 * A wrapper for the Antd {@link Tabs} component with drag and drop support.
 * @param {DraggableTabsProps} param0 The component props: {@link DraggableTabsProps}.
 * @returns A component.
 */
const DraggableTabsComponent = (props: DraggableTabsProps) => {
    const sensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } });
    const [isDragging, setIsDragging] = React.useState(false);

    React.useEffect(() => {
        props.onDraggingChanged?.(isDragging);
    }, [isDragging, props]);

    const onDragStart = React.useCallback(() => {
        setIsDragging(true);
    }, []);

    const onDragEnd = React.useCallback(
        ({ active, over }: DragEndEvent) => {
            setIsDragging(false);
            if (!props.items) {
                return;
            }
            if (active.id !== over?.id) {
                const activeIndex = props.items.findIndex(i => i.key === active.id);
                const overIndex = props.items.findIndex(i => i.key === over?.id);
                const newItems = arrayMove(props.items, activeIndex, overIndex);

                props.setItems(newItems);
                props.onItemsReordered?.(newItems);
            }
        },
        [props]
    );

    const renderChildren = React.useCallback(
        (node: React.ReactElement) => {
            const cursor: Cursor = isDragging ? "move" : "pointer";
            return (
                <DraggableTabNode //
                    {...(typeof node.props === "object" ? node.props : {})}
                    key={node.key}
                    cursor={cursor}
                    data-node-key={`${node.key}`}
                >
                    {node}
                </DraggableTabNode>
            );
        },
        [isDragging]
    );

    const renderTabBar = React.useCallback<RenderTabBar>(
        (tabBarProps, DefaultTabBar) => {
            return (
                <DndContext //
                    sensors={[sensor]}
                    onDragEnd={onDragEnd}
                    onDragStart={onDragStart}
                    collisionDetection={closestCenter}
                >
                    <SortableContext //
                        items={props.items?.map(i => i.key) ?? []}
                        strategy={horizontalListSortingStrategy}
                    >
                        <DefaultTabBar //
                            {...tabBarProps}
                        >
                            {renderChildren}
                        </DefaultTabBar>
                    </SortableContext>
                </DndContext>
            );
        },
        [onDragEnd, onDragStart, props.items, renderChildren, sensor]
    );

    // Discard props not intended directly for the component.
    const newProps = React.useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { setItems: _1, onItemsReordered: _2, onDraggingChanged: _3, ...newProps } = props;
        return newProps;
    }, [props]);

    return (
        <Tabs //
            className={classNames(DraggableTabsComponent.name, props.className)}
            renderTabBar={renderTabBar}
            {...newProps}
        />
    );
};

const DraggableTabs = styled(DraggableTabsComponent)`
    // Add style(s) here
`;

export { DraggableTabs };
