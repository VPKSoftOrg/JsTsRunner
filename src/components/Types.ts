/**
 * The common props for to be shared with among the components.
 */
type CommonProps = {
    /** The HTML class attribute. */
    className?: string;
    /** A value which uniquely identifies a node among items in an array. */
    key?: React.Key | null | undefined;
};

/**
 * The file tab data in the Tauri application state.
 */
type FileTabData = {
    /** The unique identifier. */
    uid: number;
    /** The path of the file. */
    path: string | null;
    /** The name of the file. */
    file_name: string;
    /** The name and path of the file. */
    file_name_path: string | null;
    /** A flag indicating whether the file is temporary. */
    is_temporary: boolean;
    /** The language of the script. */
    script_language: ScriptType;
    /** The content of the file. */
    content: string | null;
    /** The last modified date of the file. */
    modified_at: Date | null;
    /** The last modified date of the file in the application state. */
    modified_at_state: Date | null;
    /** A flag indicating whether to evaluate each line separately or the entire file content at once. */
    evalueate_per_line: boolean;
};

type ScriptType = "typescript" | "javascript";

type Cursor =
    | "alias"
    | "all-scroll"
    | "auto"
    | "cell"
    | "col-resize"
    | "context-menu"
    | "copy"
    | "crosshair"
    | "default"
    | "e-resize"
    | "ew-resize"
    | "grab"
    | "grabbing"
    | "help"
    | "move"
    | "n-resize"
    | "ne-resize"
    | "nesw-resize"
    | "no-drop"
    | "none"
    | "not-allowed"
    | "ns-resize"
    | "nw-resize"
    | "nwse-resize"
    | "pointer"
    | "progress"
    | "row-resize"
    | "s-resize"
    | "se-resize"
    | "sw-resize"
    | "text"
    | "vertical-text"
    | "w-resize"
    | "wait"
    | "zoom-in"
    | "zoom-out";

export type { CommonProps, FileTabData, ScriptType, Cursor };
