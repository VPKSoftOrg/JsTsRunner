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
    script_language: string;
    /** The content of the file. */
    content: string | null;
    /** The last modified date of the file. */
    modified_at: Date | null;
    /** The last modified date of the file in the application state. */
    modified_at_state: Date | null;
};

type ScriptType = "typescript" | "javascript";

export type { CommonProps, FileTabData, ScriptType };
