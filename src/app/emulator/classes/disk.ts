export enum OpCode {
    OPEN = 0,
    CLOSE = 1,
    READ = 2,
    WRITE = 3,
    REWIND = 4,
    LOAD = 5,
    SAVE = 6,
    DELETE = 7,
    SCRATCH = 8,
    STATUS = 9
}

export enum FileType {
    DATA = 0,
    PROGRAM = 1
}

export enum AccessType {
    SEQUENTIAL = 0,
    RELATIVE = 1
}

export enum RecordType {
    FIXED = 0,
    VARIABLE = 1
}

export enum DataType {
    DISPLAY = 0,
    INTERNAL = 1
}

export enum OperationMode {
    NONE = -1,
    UPDATE = 0, // Read and write
    OUTPUT = 1, // Create and write
    INPUT = 2,  // Read only
    APPEND = 3  // Add to end only
}

export enum DiskError {
    BAD_DEVICE_NAME = 0,
    WRITE_PROTECTED = 1,
    BAD_OPEN_ATTRIBUTE = 2,
    ILLEGAL_OPERATION = 3,
    OUT_OF_SPACE = 4,
    READ_PAST_END = 5,
    DEVICE_ERROR = 6,
    FILE_ERROR = 7
}

export const STATUS_NO_SUCH_FILE = 0x80;
export const STATUS_PROTECTED = 0x40;
export const STATUS_INTERNAL = 0x10;
export const STATUS_PROGRAM = 0x08;
export const STATUS_VARIABLE = 0x04;
export const STATUS_DISK_FULL = 0x02;
export const STATUS_EOF = 0x01;

export class Disk {

    static FILE_TYPE_LABELS: string[] = [
        "Data", "Program"
    ];

    static ACCESS_TYPE_LABELS: string[] = [
        "Sequential", "Relative"
    ];

    static DATA_TYPE_LABELS: string[] = [
        "Display", "Internal"
    ];

    static RECORD_TYPE_LABELS: string[] = [
        "Fixed", "Variable"
    ];

    static OPERATION_MODE_LABELS = [
        "Update", "Output", "Input", "Append"
    ];

}

