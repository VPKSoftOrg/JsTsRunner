/**
 * The common props for to be shared with among the components.
 */
type CommonProps = {
    /** The HTML class attribute. */
    className?: string;
    /** A value which uniquely identifies a node among items in an array. */
    key?: React.Key | null | undefined;
};

type FileTabData = {
    index: number;
    path: string | null;
    file_name: string;
    is_temporary: boolean;
    script_language: string;
    content: string | null;
};

export type { CommonProps, FileTabData };
