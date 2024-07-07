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
    /** A flag indicating whether the file is temporary. */
    is_temporary: boolean;
    /** The language of the script. */
    script_language: string;
    /** The content of the file. */
    content: string | null;
};

type ScriptType = "typescript" | "javascript";

export type { CommonProps, FileTabData, ScriptType };
