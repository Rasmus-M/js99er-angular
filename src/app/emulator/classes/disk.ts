import {Memory} from './memory';
import {Log} from '../../classes/log';
import {Util} from '../../classes/util';
import {State} from '../interfaces/state';
import {TI994A} from './ti994a';

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

export class DiskDrive implements State {

    static DSR_ROM: number[] = [
        0xAA,                           // >4000 Standard header
        0x01,                           // >4001 Version
        0x00,                           // >4002 No programs allowed in peripheral card ROMs
        0x00,                           // >4003 Not used
        0x40, 0x10,                     // >4004 Pointer to power-up list
        0x00, 0x00,                     // >4006 Pointer to program list
        0x40, 0x14,                     // >4008 Pointer to DSR list
        0x40, 0x32,                     // >400A Pointer to subprogram list
        0x00, 0x00,                     // >400C Pointer to ISR list
        0x00, 0x00,                     // >400E Pointer to ?
        // Power-up list
        0x00, 0x00,                     // >4010 Link to next power-up routine (no more)
        0x40, 0x66,                     // >4012 Address of this power-up routine
        // DSR list
        0x40, 0x1E,                     // >4014 Link to next DSR
        0x40, 0x68,                     // >4016 Address of this DSR
        0x04,                           // >4018 Name length
        0x44, 0x53, 0x4B, 0x31,         // >4019 Name "DSK1"
        0x00,                           // >401D Align to word
        0x40, 0x28,                     // >401E Link to next DSR
        0x40, 0x6C,                     // >4020 Address of this DSR
        0x04,                           // >4022 Name length
        0x44, 0x53, 0x4B, 0x32,         // >4023 Name "DSK2"
        0x00,                           // >4027 Align to word
        0x00, 0x00,                     // >4028 Link to next DSR (no more)
        0x40, 0x70,                     // >402A Address of this DSR
        0x04,                           // >402C Name length
        0x44, 0x53, 0x4B, 0x33,         // >402D Name "DSK3"
        0x00,                           // >4031 Align to word
        // Subprogram list
        // FILES
        0x40, 0x3C,                     // >4032 Link to next subprogram
        0x40, 0x74,                     // >4034 Address of FILES subprogram
        0x05,                           // >4036 Name length
        0x46, 0x49, 0x4C, 0x45, 0x53,   // >4037 Name "FILES"
        // >10
        0x40, 0x42,                     // >403C Link to next subprogram
        0x40, 0x78,                     // >403E Address of >10 subprogram
        0x01,                           // >4040 Name length
        0x10,                           // >4041 Name >10
        // >11
        0x40, 0x48,                     // >4042 Link to next subprogram
        0x40, 0x7C,                     // >4044 Address of >11 subprogram
        0x01,                           // >4046 Name length
        0x11,                           // >4047 Name >11
        // >12
        0x40, 0x4E,                     // >4048 Link to next subprogram
        0x40, 0x80,                     // >404A Address of >12 subprogram
        0x01,                           // >404C Name length
        0x12,                           // >404D Name >12
        // >13
        0x40, 0x54,                     // >404E Link to next subprogram
        0x40, 0x84,                     // >4050 Address of >13 subprogram
        0x01,                           // >4052 Name length
        0x13,                           // >4053 Name >13
        // >14
        0x40, 0x5A,                     // >4054 Link to next subprogram
        0x40, 0x88,                     // >4056 Address of >14 subprogram
        0x01,                           // >4058 Name length
        0x14,                           // >4059 Name >14
        // >15
        0x40, 0x60,                     // >405A Link to next subprogram
        0x40, 0x8C,                     // >405C Address of >15 subprogram
        0x01,                           // >405E Name length
        0x15,                           // >405F Name >15
        // >16
        0x00, 0x00,                     // >4060 Link to next subprogram (no more)
        0x40, 0x90,                     // >4062 Address of >16 subprogram
        0x01,                           // >4064 Name length
        0x16,                           // >4065 Name >16
        // Power-up routine
        0x04, 0x5B,                     // >4066 B *R11
        // DSK1 routine
        0x05, 0xCB,                     // >4068 INCT R11
        0x04, 0x5B,                     // >406A B *R11
        // DSK2 routine
        0x05, 0xCB,                     // >406C INCT R11
        0x04, 0x5B,                     // >406E B *R11
        // DSK3 routine
        0x05, 0xCB,                     // >4070 INCT R11
        0x04, 0x5B,                     // >4072 B *R11
        // FILES subprogram
        0x05, 0xCB,                     // >4074 INCT R11
        0x04, 0x5B,                     // >4076 B *R11
        // >10 subprogram
        0x05, 0xCB,                     // >4078 INCT R11
        0x04, 0x5B,                     // >407A B *R11
        // >11 subprogram
        0x05, 0xCB,                     // >407C INCT R11
        0x04, 0x5B,                     // >407E B *R11
        // >12 subprogram
        0x05, 0xCB,                     // >4080 INCT R11
        0x04, 0x5B,                     // >4082 B *R11
        // >13 subprogram
        0x05, 0xCB,                     // >4084 INCT R11
        0x04, 0x5B,                     // >4086 B *R11
        // >14 subprogram
        0x05, 0xCB,                     // >4088 INCT R11
        0x04, 0x5B,                     // >408A B *R11
        // >15 subprogram
        0x05, 0xCB,                     // >408C INCT R11
        0x04, 0x5B,                     // >408E B *R11
        // >16 subprogram
        0x05, 0xCB,                     // >4090 INCT R11
        0x04, 0x5B                      // >4092 B *R11
    ];

    static OPERATION_MODES = [
        "UPDATE", "OUTPUT", "INPUT", "APPEND"
    ];

    static STATUS_NO_SUCH_FILE = 0x80;
    static STATUS_PROTECTED = 0x40;
    static STATUS_INTERNAL = 0x10;
    static STATUS_PROGRAM = 0x08;
    static STATUS_VARIABLE = 0x04;
    static STATUS_DISK_FULL = 0x02;
    static STATUS_EOF = 0x01;

    static DSR_ROM_POWER_UP = 0x4066;
    static DSR_ROM_DSK1 = 0x4068;
    static DSR_ROM_DSK2 = 0x406C;
    static DSR_ROM_DSK3 = 0x4070;
    static DSR_ROM_FILES = 0x4074;
    static DSR_ROM_SECTOR_IO_10 = 0x4078;
    static DSR_ROM_FORMAT_DISK_11 = 0x407C;
    static DSR_ROM_FILE_PROTECTION_12 = 0x4080;
    static DSR_ROM_RENAME_FILE_13 = 0x4084;
    static DSR_ROM_FILE_INPUT_14 = 0x4088;
    static DSR_ROM_FILE_OUTPUT_15 = 0x408C;
    static DSR_ROM_FILES_16  = 0x4090;

    static DSR_HOOK_START = DiskDrive.DSR_ROM_POWER_UP;
    static DSR_HOOK_END = DiskDrive.DSR_ROM_FILES_16;

    private name: string;
    private diskImage: DiskImage;
    private console: TI994A;
    private ram: Uint8Array;
    private catalogFile: DiskFile;

    private log: Log = Log.getLog();

    constructor(name: string, diskImage: DiskImage, console: TI994A) {
        this.name = name;
        this.diskImage = diskImage;
        this.console = console;
    }

    static execute(pc: number, diskDrives: DiskDrive[], memory: Memory) {
        let status = 0;
        switch (pc) {
            case DiskDrive.DSR_ROM_POWER_UP:
                DiskDrive.powerUp(memory);
                break;
            case DiskDrive.DSR_ROM_DSK1:
                status = diskDrives[0].dsrRoutine(memory.getPADWord(0x8356) - 14);
                break;
            case DiskDrive.DSR_ROM_DSK2:
                status = diskDrives[1].dsrRoutine(memory.getPADWord(0x8356) - 14);
                break;
            case DiskDrive.DSR_ROM_DSK3:
                status = diskDrives[2].dsrRoutine(memory.getPADWord(0x8356) - 14);
                break;
            case DiskDrive.DSR_ROM_FILES:
                DiskDrive.setFiles(-1, memory);
                break;
            case DiskDrive.DSR_ROM_SECTOR_IO_10:
                const drive = memory.getPADByte(0x834C) - 1;
                if (drive >= 0 && drive < diskDrives.length) {
                    diskDrives[drive].sectorIO(memory);
                }
                break;
            case DiskDrive.DSR_ROM_FORMAT_DISK_11:
                Log.getLog().warn("Subprogram >11: Format Disk not implemented.");
                break;
            case DiskDrive.DSR_ROM_FILE_PROTECTION_12:
                Log.getLog().warn("Subprogram >12: File Protection not implemented.");
                break;
            case DiskDrive.DSR_ROM_RENAME_FILE_13:
                Log.getLog().warn("Subprogram >13: Rename File not implemented.");
                break;
            case DiskDrive.DSR_ROM_FILE_INPUT_14:
                Log.getLog().warn("Subprogram >14: File Input not implemented.");
                break;
            case DiskDrive.DSR_ROM_FILE_OUTPUT_15:
                Log.getLog().warn("Subprogram >15: File Output not implemented.");
                break;
            case DiskDrive.DSR_ROM_FILES_16:
                DiskDrive.setFiles(memory.getPADByte(0x834C), memory);
                break;
            default:
                // Log.getLog().warn("Subprogram at " + pc.toHexWord() + " not found.");
                break;
        }
        memory.setPADByte(0x837C, memory.getPADByte(0x837C) | status);
    }

    static powerUp(memory: Memory) {
        Log.getLog().info("Executing disk DSR power-up routine.");
        DiskDrive.setFiles(3, memory);
    }

    static setFiles(nFiles: number, memory: Memory) {
        if (nFiles === -1) {
            // Get parameter from BASIC (code from Classic99)
            let x = memory.getPADWord(0x832c);		// Get next basic token
            x += 7;						                // Skip "FILES"
            const vdpRAM = memory.getVDP().getRAM();    // Get the VDP RAM
            let y = (vdpRAM[x] << 8) | vdpRAM[x + 1];	// Get two bytes (size of string)
            if (y === 0xc801) {                         // c8 means unquoted string, 1 is the length
                x += 2;						            // Increment pointer
                y = vdpRAM[x] - 0x30;				    // this is the number of files in ASCII
                if ((y <= 9) && (y >= 0)) {
                    // valid count
                    nFiles = y;
                    // Try to skip the rest of the statement
                    x += 3;
                    memory.setPADWord(0x832c, x);    // Write new pointer
                    memory.setPADWord(0x8342, 0); // Clear 'current' token
                }
            }
        }
        if (nFiles === -1) {
            nFiles = 3;
        }
        Log.getLog().info("Executing disk DSR FILES routine (n = " + nFiles + ").");
        memory.writeWord(0x8370, 0x4000 - nFiles * 0x2B8, null);
        memory.writeWord(0x8350, memory.readWord(0x8350, null) & 0x00FF, null);
    }

    reset() {
        this.ram = this.console.getVDP().getRAM();
        this.catalogFile = null;
    }

    getName(): string {
        return this.name;
    }

    dsrRoutine(pabAddr: number) {
        this.log.info("Executing DSR routine for " + this.name + ", PAB in " + Util.toHexWord(pabAddr) + ".");
        let i;
        const opCode = this.ram[pabAddr];
        const flagStatus = this.ram[pabAddr + 1];
        const dataBufferAddress = this.ram[pabAddr + 2] << 8 | this.ram[pabAddr + 3];
        let recordLength = this.ram[pabAddr + 4];
        const characterCount = this.ram[pabAddr + 5];
        const recordNumber = this.ram[pabAddr + 6] << 8 | this.ram[pabAddr + 7];
        // let screenOffset = this.ram[pabAddr + 8];
        const fileNameLength = this.ram[pabAddr + 9];
        let fileName = "";
        for (i = 0; i < fileNameLength; i++) {
            fileName += String.fromCharCode(this.ram[pabAddr + 10 + i]);
        }
        const recordType = (flagStatus & 0x10) >> 4;
        const datatype = (flagStatus & 0x08) >> 3;
        const operationMode = (flagStatus & 0x06) >> 1;
        const accessType = flagStatus & 0x01;

        this.log.info(
            fileName + ": " +
            DiskDrive.OPERATION_MODES[operationMode] + ", " +
            (accessType === AccessType.RELATIVE ? "RELATIVE" : "SEQUENTIAL") + ", " +
            (datatype === DataType.DISPLAY ? "DISPLAY" : "INTERNAL") + ", " +
            (recordType === RecordType.FIXED ? "FIXED" : "VARIABLE") + ", " +
             recordLength
        );
        // this.log.info("File name: " + fileName);
        // this.log.info("Operation mode: " + OperationMode.OPERATION_MODES[operationMode]);
        // this.log.info("Access type: " + (accessType == AccessType.RELATIVE ? "RELATIVE" : "SEQUENTIAL"));
        // this.log.info("Datatype: " + (datatype == DataType.DISPLAY ? "DISPLAY" : "INTERNAL"));
        // this.log.info("Record type: " + (recordType == RecordType.FIXED ? "FIXED" : "VARIABLE"));
        // this.log.info("Record length: " + recordLength);
        // this.log.info("Character count: " + characterCount);
        // this.log.info("Record number: " + recordNumber);

        let errorCode = 0;
        let status = 0;
        if (this.diskImage != null) {
            if (fileName.substr(0, this.name.length + 1) === this.name + ".") {
                fileName = fileName.substr(this.name.length + 1);
                let file, record;
                switch (opCode) {
                    case OpCode.OPEN:
                        this.log.info("Op-code " + opCode + ": OPEN");
                        if (operationMode === OperationMode.OUTPUT ||
                            operationMode === OperationMode.APPEND ||
                            operationMode === OperationMode.UPDATE) {
                            // Create a new file
                            if (recordLength === 0) {
                                recordLength = 80;
                                // Write default record length to PAB
                                this.ram[pabAddr + 4] = recordLength;
                            }
                            file = this.diskImage.getFile(fileName);
                            if (file == null || operationMode === OperationMode.OUTPUT) {
                                file = new DiskFile(fileName, FileType.DATA, recordType, recordLength, datatype);
                                this.diskImage.putFile(file);
                            }
                        } else {
                            if (fileName.length > 0) {
                                // Open existing file
                                file = this.diskImage.getFile(fileName);
                                if (file == null) {
                                    errorCode = DiskError.FILE_ERROR;
                                    break;
                                }
                                if (file.getOperationMode() !== -1 ||
                                    file.getFileType() === FileType.PROGRAM ||
                                    file.getRecordType() !== recordType ||
                                    file.getRecordLength() !== recordLength && recordLength !== 0) {
                                    errorCode = DiskError.BAD_OPEN_ATTRIBUTE;
                                    break;
                                }
                                if (recordLength === 0) {
                                    recordLength = file.getRecordLength();
                                    this.ram[pabAddr + 4] = recordLength;
                                }
                            } else if (operationMode === OperationMode.INPUT) {
                                // Catalog
                                file = this.createCatalogFile();
                                this.catalogFile = file;
                                if (recordLength === 0) {
                                    recordLength = 38;
                                    this.ram[pabAddr + 4] = recordLength;
                                }
                            } else {
                                errorCode = DiskError.ILLEGAL_OPERATION;
                                break;
                            }
                        }
                        file.open(operationMode, accessType);
                        break;
                    case OpCode.CLOSE:
                        this.log.info("Op-code " + opCode + ": CLOSE");
                        if (fileName.length > 0) {
                            file = this.diskImage.getFile(fileName);
                            if (file != null) {
                                if (file.getFileType() === FileType.DATA) {
                                    if (file.getOperationMode() === operationMode) {
                                        file.close();
                                    } else {
                                        errorCode = DiskError.ILLEGAL_OPERATION;
                                    }
                                } else {
                                    errorCode = DiskError.FILE_ERROR;
                                }
                            } else {
                                errorCode = DiskError.FILE_ERROR;
                            }
                        } else {
                            this.catalogFile = null;
                        }
                        break;
                    case OpCode.READ:
                        this.log.info("Op-code " + opCode + ": READ");
                        if (fileName.length > 0) {
                            file = this.diskImage.getFile(fileName);
                        } else {
                            // Catalog
                            file = this.catalogFile;
                        }
                        if (file != null) {
                            if (file.getFileType() === FileType.DATA) {
                                if (fileName.length > 0 && file.getAccessType() === AccessType.RELATIVE) {
                                    file.setRecordPointer(recordNumber);
                                }
                                record = file.getRecord();
                                if (record != null) {
                                    if (file.getOperationMode() === operationMode) {
                                        switch (file.getOperationMode()) {
                                            case OperationMode.UPDATE:
                                            case OperationMode.INPUT:
                                                const recordData = record.getData();
                                                const bytesToRead = Math.min(recordData.length, recordLength);
                                                for (i = 0; i < bytesToRead; i++) {
                                                    this.ram[dataBufferAddress + i] = recordData[i];
                                                }
                                                this.ram[pabAddr + 5] = bytesToRead;
                                                this.ram[pabAddr + 6] = (file.getRecordPointer() & 0xFF00) >> 8;
                                                this.ram[pabAddr + 7] = file.getRecordPointer() & 0x00FF;
                                                break;
                                            case OperationMode.OUTPUT:
                                            case OperationMode.APPEND:
                                                errorCode = DiskError.ILLEGAL_OPERATION;
                                                break;
                                        }
                                    } else {
                                        errorCode = DiskError.ILLEGAL_OPERATION;
                                    }
                                } else {
                                    this.log.info("EOF - close file.");
                                    file.close();
                                    errorCode = DiskError.READ_PAST_END;
                                }
                            } else {
                                errorCode = DiskError.FILE_ERROR;
                            }
                        } else {
                            errorCode = DiskError.FILE_ERROR;
                        }
                        break;
                    case OpCode.WRITE:
                        this.log.info("Op-code " + opCode + ": WRITE");
                        file = this.diskImage.getFile(fileName);
                        if (file != null) {
                            if (file.getFileType() === FileType.DATA) {
                                if (file.getOperationMode() === operationMode) {
                                    if (file.getAccessType() === AccessType.RELATIVE) {
                                        file.setRecordPointer(recordNumber);
                                    }
                                    const bytesToWrite = recordType === RecordType.FIXED ? recordLength : characterCount;
                                    const writeBuffer = [];
                                    for (i = 0; i < bytesToWrite; i++) {
                                        writeBuffer[i] = this.ram[dataBufferAddress + i];
                                    }
                                    if (recordType === RecordType.FIXED) {
                                        record = new FixedRecord(writeBuffer, recordLength);
                                    } else {
                                        record = new VariableRecord(writeBuffer);
                                    }
                                    switch (file.getOperationMode()) {
                                        case OperationMode.UPDATE:
                                        case OperationMode.OUTPUT:
                                            file.putRecord(record);
                                            break;
                                        case OperationMode.APPEND:
                                            if (file.isEOF()) {
                                                file.putRecord(record);
                                            } else {
                                                errorCode = DiskError.ILLEGAL_OPERATION;
                                            }
                                            break;
                                        case OperationMode.INPUT:
                                            errorCode = DiskError.ILLEGAL_OPERATION;
                                            break;
                                    }
                                    this.ram[pabAddr + 6] = (file.getRecordPointer() & 0xFF00) >> 8;
                                    this.ram[pabAddr + 7] = file.getRecordPointer() & 0x00FF;
                                    this.diskImage.setBinaryImage(null); // Invalidate binary image on write
                                } else {
                                    errorCode = DiskError.ILLEGAL_OPERATION;
                                }
                            } else {
                                errorCode = DiskError.FILE_ERROR;
                            }
                        } else {
                            errorCode = DiskError.FILE_ERROR;
                        }
                        break;
                    case OpCode.REWIND:
                        this.log.info("Op-code " + opCode + ": REWIND");
                        file = this.diskImage.getFile(fileName);
                        if (file != null) {
                            if (file.getOperationMode() === operationMode) {
                                if (file.getFileType() !== FileType.PROGRAM) {
                                    file.rewind();
                                } else {
                                    errorCode = DiskError.FILE_ERROR;
                                }
                            } else {
                                errorCode = DiskError.ILLEGAL_OPERATION;
                            }
                        } else {
                            errorCode = DiskError.FILE_ERROR;
                        }
                        break;
                    case OpCode.LOAD:
                        this.log.info("Op-code " + opCode + ": LOAD");
                        file = this.diskImage.getFile(fileName);
                        if (file != null) {
                            if (file.getFileType() === FileType.PROGRAM) {
                                const loadBuffer = file.getProgram();
                                for (i = 0; i < Math.min(recordNumber, loadBuffer.length); i++) {
                                    this.ram[dataBufferAddress + i] = loadBuffer[i];
                                }
                            } else {
                                errorCode = DiskError.FILE_ERROR;
                            }
                        } else {
                            errorCode = DiskError.FILE_ERROR;
                        }
                        break;
                    case OpCode.SAVE:
                        this.log.info("Op-code " + opCode + ": SAVE");
                        const saveBuffer = [];
                        for (i = 0; i < recordNumber; i++) {
                            saveBuffer[i] = this.ram[dataBufferAddress + i];
                        }
                        file = this.diskImage.getFile(fileName);
                        if (file == null) {
                            file = new DiskFile(fileName, FileType.PROGRAM, 0, 0, 0);
                            file.setProgram(saveBuffer);
                            this.diskImage.putFile(file);
                        } else {
                            file.setProgram(saveBuffer);
                        }
                        this.diskImage.setBinaryImage(null); // Invalidate binary image on write
                        break;
                    case OpCode.DELETE:
                        this.log.info("Op-code " + opCode + ": DELETE");
                        file = this.diskImage.getFile(fileName);
                        if (file != null) {
                            this.diskImage.deleteFile(fileName);
                        } else {
                            errorCode = DiskError.FILE_ERROR;
                        }
                        break;
                    case OpCode.SCRATCH:
                        this.log.info("Op-code " + opCode + ": SCRATCH");
                        file = this.diskImage.getFile(fileName);
                        if (file != null) {
                            if (file.getFileType() === FileType.DATA) {
                                if (file.getOperationMode() === operationMode && file.getAccessType() === AccessType.RELATIVE) {
                                    file.setRecordPointer(recordNumber);
                                    switch (file.getOperationMode()) {
                                        case OperationMode.UPDATE:
                                            if (file.getRecord() != null) {
                                                file.deleteRecord();
                                                this.diskImage.setBinaryImage(null); // Invalidate binary image on write
                                            } else {
                                                errorCode = DiskError.ILLEGAL_OPERATION;
                                            }
                                            break;
                                        case OperationMode.OUTPUT:
                                        case OperationMode.INPUT:
                                        case OperationMode.APPEND:
                                            errorCode = DiskError.ILLEGAL_OPERATION;
                                            break;
                                    }
                                } else {
                                    errorCode = DiskError.ILLEGAL_OPERATION;
                                }
                            } else {
                                errorCode = DiskError.FILE_ERROR;
                            }
                        } else {
                            errorCode = DiskError.FILE_ERROR;
                        }
                        break;
                    case OpCode.STATUS:
                        this.log.info("Op-code " + opCode + ": STATUS");
                        let fileStatus = 0;
                        file = this.diskImage.getFile(fileName);
                        if (file != null) {
                            if (file.getDataType() === DataType.INTERNAL) {
                                fileStatus |= DiskDrive.STATUS_INTERNAL;
                            }
                            if (file.getFileType() === FileType.PROGRAM) {
                                fileStatus |= DiskDrive.STATUS_PROGRAM;
                            }
                            if (file.getRecordType() === RecordType.VARIABLE) {
                                fileStatus |= DiskDrive.STATUS_VARIABLE;
                            }
                            if (file.isEOF()) {
                                fileStatus |= DiskDrive.STATUS_EOF;
                            }

                        } else {
                            fileStatus |= DiskDrive.STATUS_NO_SUCH_FILE;
                        }
                        this.ram[pabAddr + 8] = fileStatus;
                        break;
                    default:
                        this.log.error("Unknown DSR op-code: " + opCode);
                        errorCode = DiskError.ILLEGAL_OPERATION;
                }
            } else {
                status = 0x20;
            }
        } else {
            errorCode = DiskError.DEVICE_ERROR;
        }
        this.log.info("Returned error code: " + errorCode + "\n");
        this.ram[pabAddr + 1] = (this.ram[pabAddr + 1] | (errorCode << 5)) & 0xFF;
        return status;
    }

    sectorIO(memory: Memory) {
        const read = (memory.getPADWord(0x834C) & 0x0F) !== 0;
        const bufferAddr = memory.getPADWord(0x834E);
        const sectorNo = memory.getPADWord(0x8350);
        this.log.info("Sector I/O drive " + this.name + ", read: " + read + ", bufferAddr: " + Util.toHexWord(bufferAddr) + ", sectorNo: " + Util.toHexWord(sectorNo));
        if (this.diskImage != null) {
            if (read) {
                const sector = this.diskImage.readSector(sectorNo);
                for (let i = 0; i < 256; i++) {
                    this.ram[bufferAddr + i] = sector[i];
                }
                memory.setPADWord(0x834A, sectorNo);
                memory.setPADWord(0x8350, 0);
            } else {
                // Write not implemented:
                this.log.warn("Sector write not implemented.");
            }
        }
    }

    getDiskImage(): DiskImage {
        return this.diskImage;
    }

    setDiskImage(diskImage: DiskImage) {
        this.diskImage = diskImage;
    }

    createCatalogFile(): DiskFile {
        const catFile = new DiskFile("CATALOG", FileType.DATA, RecordType.FIXED, 38, DataType.INTERNAL);
        catFile.open(OperationMode.OUTPUT, AccessType.SEQUENTIAL);
        const data = [];
        let n = 0;
        n = this.writeAsString(data, n, this.diskImage.getName());
        n = this.writeAsFloat(data, n, 0);
        n = this.writeAsFloat(data, n, 1440); // Number of sectors on disk
        n = this.writeAsFloat(data, n, 1311); // Number of free sectors;
        catFile.putRecord(new FixedRecord(data, 38));
        const files = this.diskImage.getFiles();
        for (const fileName in files) {
            if (files.hasOwnProperty(fileName)) {
                const file = files[fileName];
                let type = 0;
                if (file.getFileType() === FileType.PROGRAM) {
                    type = 5;
                } else {
                    type = 1; // DF
                    if (file.getDataType() === DataType.INTERNAL) {
                        type += 2;
                    }
                    if (file.getRecordType() === RecordType.VARIABLE) {
                        type += 1;
                    }
                }
                n = 0;
                n = this.writeAsString(data, n, fileName);
                n = this.writeAsFloat(data, n, type);
                n = this.writeAsFloat(data, n, file.getSectorCount());
                n = this.writeAsFloat(data, n, file.getRecordLength());
                catFile.putRecord(new FixedRecord(data, 38));
            }
        }
        n = 0;
        n = this.writeAsString(data, n, "");
        n = this.writeAsFloat(data, n, 0);
        n = this.writeAsFloat(data, n, 0);
        this.writeAsFloat(data, n, 0);
        catFile.putRecord(new FixedRecord(data, 38));
        catFile.close();
        // this.log.info(catFile.toString());
        return catFile;
    }

    writeAsString(data: number[], n: number, str: string): number {
        data[n++] = str.length;
        for (let i = 0; i < str.length; i++) {
            data[n++] = str.charCodeAt(i);
        }
        return n;
    }

    // Translated from Classic99
    writeAsFloat(data: number[], n: number, val: number): number {
        const word = [0, 0];
        // First write a size byte of 8
        data[n++] = 8;
        // Translation of the TICC code, we can do better later ;)
        // Basically, we get the exponent and two bytes, and the rest are zeros
        const tmp = val;
        if (val < 0) {
            val = -val;
        }
        if (val >= 100) {
            word[0] = Math.floor(val / 100) | 0x4100; // 0x41 is the 100s counter, not sure how this works with 10,000, maybe it doesn't?
            word[1] = Math.floor(val % 100);
        } else {
            if (val === 0) {
                word[0] = 0;
            } else {
                word[0] = val | 0x4000;
            }
            word[1] = 0;
        }
        if (tmp < 0) {
            word[0] = ((~word[0]) + 1) & 0xFFFF;
        }
        data[n++] = (word[0] >>> 8) & 0xff;
        data[n++] = word[0] & 0xff;
        data[n++] = word[1] & 0xff;
        // and five zeros
        for (let i = 0; i < 5; i++) {
            data[n++] = 0;
        }
        return n;
    }

    loadDSKFromURL(url: string, onLoad: () => void) {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        const self = this;
        xhr.onload = function () {
            self.loadDSKFile("", new Uint8Array(xhr.response));
            if (onLoad) {
                onLoad();
            }
        };
        xhr.send();
    }

    loadDSKFile(dskFileName: string, fileBuffer: Uint8Array) {
        let volumeName = "";
        for (let i = 0; i < 10; i++) {
            const ch = fileBuffer[i];
            if (ch >= 32 && ch < 128) {
                volumeName += String.fromCharCode(ch);
            }
        }
        volumeName = volumeName.trim();
        this.log.info("Volume name: " + volumeName);
        const diskImage = new DiskImage(volumeName, null);
        const totalSectors = (fileBuffer[0x0A] << 8) + fileBuffer[0x0B];
        this.log.info("Total sectors: " + totalSectors);
        for (let fileDescriptorIndex = 0; fileDescriptorIndex < 128; fileDescriptorIndex++) {
            const fileDescriptorSectorNo = (fileBuffer[0x100 + fileDescriptorIndex * 2] << 8) + fileBuffer[0x100 + fileDescriptorIndex * 2 + 1];
            if (fileDescriptorSectorNo !== 0) {
                const fileDescriptorRecord = fileDescriptorSectorNo * 256;
                let fileName = "";
                for (let i = 0; i < 10; i++) {
                    const ch = fileBuffer[fileDescriptorRecord + i];
                    if (ch >= 32 && ch < 128) {
                        fileName += String.fromCharCode(ch);
                    }
                }
                fileName = fileName.trim();
                this.log.info("File name: " + fileName);
                const statusFlags = fileBuffer[fileDescriptorRecord + 0x0C];
                const recordType = (statusFlags & 0x80) >> 7;
                const datatype = (statusFlags & 0x02) >> 1;
                const fileType = (statusFlags & 0x01);
                // this.log.info("Status flags: " + statusFlags.toString(2).padl("0", 8));
                const recordsPerSector = fileBuffer[fileDescriptorRecord + 0x0D];
                // this.log.info("Records per sector: " + recordsPerSector);
                const sectorsAllocated = (fileBuffer[fileDescriptorRecord + 0x0E] << 8) + fileBuffer[fileDescriptorRecord + 0x0F];
                // this.log.info("Sectors allocated: " + sectorsAllocated);
                const endOfFileOffset = fileBuffer[fileDescriptorRecord + 0x10];
                // this.log.info("EOF offset: " + endOfFileOffset);
                let recordLength = fileBuffer[fileDescriptorRecord + 0x11];
                // this.log.info("Logical record length: " + recordLength);
                const fileLength = fileType === FileType.PROGRAM ? (sectorsAllocated - 1) * 256 + (endOfFileOffset === 0 ? 256 : endOfFileOffset) : recordLength * sectorsAllocated * recordsPerSector;
                this.log.info(
                    (fileType === FileType.DATA ? "DATA" : "PROGRAM") + ": " +
                    (fileType === FileType.DATA ?
                        (datatype === DataType.DISPLAY ? "DISPLAY" : "INTERNAL") + ", " +
                        (recordType === RecordType.FIXED ? "FIXED" : "VARIABLE") + ", " +
                        recordLength + ", "
                        : ""
                    ) + "file length = " + fileLength
                );
                let diskFile;
                if (fileType === FileType.DATA) {
                    diskFile = new DiskFile(fileName, fileType, recordType, recordLength, datatype);
                } else {
                    diskFile = new DiskFile(fileName, fileType, 0, 0, 0);
                }
                diskFile.open(OperationMode.OUTPUT, AccessType.SEQUENTIAL);
                const program = [];
                let sectorsLeft = sectorsAllocated;
                let nLast = -1;
                for (let dataChainPointerIndex = 0; dataChainPointerIndex < 0x4C; dataChainPointerIndex++) {
                    const dataChainPointer = fileDescriptorRecord + 0x1C + 3 * dataChainPointerIndex;
                    let m = ((fileBuffer[dataChainPointer + 1] & 0x0F) << 8) | fileBuffer[dataChainPointer];
                    const n = (fileBuffer[dataChainPointer + 2] << 4) | ((fileBuffer[dataChainPointer + 1] & 0xF0) >> 4);
                    if (m !== 0) {
                        // this.log.info("Data chain pointer index " + dataChainPointerIndex);
                        if (totalSectors > 1600) {
                            // For high capacity disks (> 1600 sectors) multiply by sectors/AU
                            m *= 2;
                        }
                        const startSector = m;
                        const endSector = m + n - (nLast + 1);
                        // this.log.info("Sectors " + startSector + " to " + endSector);
                        nLast = n;
                        for (let sector = startSector; sector <= endSector; sector++) {
                            sectorsLeft--;
                            if (fileType === FileType.DATA) {
                                // Data
                                if (recordType === RecordType.FIXED) {
                                    for (let record = 0; record < recordsPerSector; record++) {
                                        const data = [];
                                        for (let i = 0; i < recordLength; i++) {
                                            data.push(fileBuffer[sector * 256 + record * recordLength + i]);
                                        }
                                        diskFile.putRecord(new FixedRecord(data, recordLength));
                                    }
                                } else {
                                    let i = sector * 256;
                                    recordLength = fileBuffer[i++];
                                    // TODO: Correct to stop loading if recordLength is zero?
                                    while (recordLength !== 0xFF && recordLength !== 0) {
                                        const data = [];
                                        for (let j = 0; j < recordLength; j++) {
                                            data[j] = fileBuffer[i++];
                                        }
                                        diskFile.putRecord(new VariableRecord(data));
                                        recordLength = fileBuffer[i++];
                                    }
                                    if (recordLength === 0) {
                                        this.log.info("Missing EOF marker.");
                                    }
                                }
                            } else {
                                // Program
                                for (let i = 0; i < ((sectorsLeft > 0 || endOfFileOffset === 0) ? 256 : endOfFileOffset); i++) {
                                    program.push(fileBuffer[sector * 256 + i]);
                                }
                            }
                        }
                    }
                }
                diskFile.close();
                if (fileType === FileType.PROGRAM) {
                    diskFile.setProgram(program);
                }
                diskImage.putFile(diskFile);
            }
        }
        this.setDiskImage(diskImage);
        diskImage.setBinaryImage(fileBuffer);
        return diskImage;
    }

    setRAM(ram: Uint8Array) {
        this.ram = ram;
    }

    getState(): object {
        return {
            name: this.name,
            diskImage: this.diskImage != null ? this.diskImage.getName() : null
        };
    }

    restoreState(state: any) {
        this.name = state.name;
        this.diskImage = state.diskImage;
    }
}

export class DiskImage implements State {

    private name: string;
    private files: {[name: string]: DiskFile};
    private binaryImage: Uint8Array;
    private eventHandler: (object) => void;
    private log: Log;

    constructor(name: string, eventHandler: (object) => void) {
        this.name = name;
        this.files = {};
        this.binaryImage = null;
        this.eventHandler = eventHandler;
        this.log = Log.getLog();
    }

    setEventHandler(eventHandler: (object) => void) {
        this.eventHandler = eventHandler;
    }

    fireEvent(event: {}) {
        if (typeof(this.eventHandler) === "function") {
            this.eventHandler(event);
        }
    }

    getName(): string {
        return this.name;
    }

    getFiles(): {[name: string]: DiskFile} {
        return this.files;
    }

    getFilesArray(): DiskFile[] {
        const filesArray = [];
        for (const fileName in this.files) {
            if (this.files.hasOwnProperty(fileName)) {
                filesArray.push(this.files[fileName]);
            }
        }
        return filesArray;
    }

    putFile(file: DiskFile) {
        this.files[file.getName()] = file;
        this.setBinaryImage(null); // Invalidate binary image on write
        this.fireEvent({type: "fileAdded", name: file.getName()});
    }

    getFile(fileName): DiskFile {
        return this.files[fileName];
    }

    deleteFile(fileName) {
        delete this.files[fileName];
        this.setBinaryImage(null); // Invalidate binary image on write
        this.fireEvent({type: "fileDeleted", name: fileName});
    }

    loadTIFile(fileName: string, fileBuffer: Uint8Array, ignoreTIFileName: boolean) {
        if (fileBuffer != null && fileBuffer.length > 0x80) {
            let sectors;
            let flags;
            let recsPerSector;
            let eofOffset;
            let recordLength;
            let recordType;
            let datatype;
            let fileType;
            let fileLength;
            let sectorOffset;
            let pcFormat = false;
            let id = "";
            for (let i = 1; i < 8; i++) {
                id += String.fromCharCode(fileBuffer[i]);
            }
            let tiFileName = "";
            if (fileBuffer[0] === 0x07 && id === "TIFILES") {
                if (!ignoreTIFileName && fileBuffer[0x10] !== 0xCA) {
                    for (let i = 0x10; i < 0x1A; i++) {
                        if (fileBuffer[i] >= 32 && fileBuffer[i] < 128) {
                            tiFileName += String.fromCharCode(fileBuffer[i]);
                        }
                    }
                    tiFileName = tiFileName.trim();
                }
                if (tiFileName.length > 0) {
                    this.log.info("TI name is '" + tiFileName + "'.");
                } else {
                    for (let i = 0; i < fileName.length; i++) {
                        if (fileName.charAt(i).match(/[0-9A-Za-z_\-]/) && tiFileName.length < 10) {
                            tiFileName += fileName.charAt(i);
                        }
                    }
                }
                sectors = fileBuffer[0x8] << 8 | fileBuffer[0x9];
                flags = fileBuffer[0xA];
                recsPerSector = fileBuffer[0xB];
                eofOffset = fileBuffer[0xC];
                recordLength = fileBuffer[0xD];
                recordType = (flags & 0x80) >> 7;
                datatype = (flags & 0x02) >> 1;
                fileType = (flags & 0x01);
                fileLength = sectors * 256  - (eofOffset > 0 ? 256 - eofOffset : 0);
                sectorOffset = 0x80;
            } else if ((String.fromCharCode(fileBuffer[0]) + id).trim().toUpperCase() === fileName.substr(0, 8).trim().toUpperCase()) {
                tiFileName = "";
                for (let i = 0; i < 10; i++) {
                    if (fileBuffer[i] >= 32 && fileBuffer[i] < 128) {
                        tiFileName += String.fromCharCode(fileBuffer[i]);
                    }
                }
                tiFileName = tiFileName.trim();
                this.log.info(fileName + " looks like a V9T9 file.");
                flags = fileBuffer[0x0C];
                recordType = (flags & 0x80) >> 7;
                datatype = (flags & 0x02) >> 1;
                fileType = (flags & 0x01);
                recsPerSector = fileBuffer[0x0D];
                sectors = (fileBuffer[0x0E] << 8) + fileBuffer[0x0F];
                eofOffset = fileBuffer[0x10];
                recordLength = fileBuffer[0x11];
                fileLength = sectors * 256  - (eofOffset > 0 ? 256 - eofOffset : 0);
                sectorOffset = 0x80;
            } else {
                this.log.warn(fileName + " is not in TIFILES or V9T9 format. Assuming D/F 80.");
                tiFileName = "";
                for (let i = 0; i < fileName.length; i++) {
                    if (fileName.charAt(i).match(/[0-9A-Za-z_\-]/) && fileName.length < 10) {
                        tiFileName += fileName.charAt(i);
                    }
                }
                recordType = RecordType.FIXED;
                datatype = DataType.DISPLAY;
                fileType = FileType.DATA;
                recsPerSector = 3;
                sectors = Math.floor(fileBuffer.length / 256);
                recordLength = 80;
                fileLength = fileBuffer.length;
                sectorOffset = 0;
                pcFormat = true;
            }
            this.log.info("Loading '" + fileName + "' to " + this.name + " ...");
            this.log.info(
                (fileType === FileType.DATA ? "DATA" : "PROGRAM") + ": " +
                (fileType === FileType.DATA ?
                    (datatype === DataType.DISPLAY ? "DISPLAY" : "INTERNAL") + ", " +
                    (recordType === RecordType.FIXED ? "FIXED" : "VARIABLE") + ", " +
                    recordLength + ", "
                    : ""
                ) + "file length = " + fileLength
            );
            this.log.info("");
            if (fileBuffer.length >= sectorOffset + fileLength) {
                let file;
                if (fileType === FileType.DATA) {
                    file = new DiskFile(tiFileName, fileType, recordType, recordLength, datatype);
                    file.open(OperationMode.OUTPUT, AccessType.SEQUENTIAL);
                    let sector, rec, data;
                    if (recordType === RecordType.FIXED) {
                        if (!pcFormat) {
                            for (sector = 0; sector < sectors; sector++) {
                                for (rec = 0; rec < recsPerSector; rec++) {
                                    if (sector * 256 + rec * recordLength < fileLength) {
                                        data = [];
                                        for (let i = 0; i < recordLength; i++) {
                                            data[i] = fileBuffer[sectorOffset + sector * 256 + rec * recordLength + i];
                                        }
                                        file.putRecord(new FixedRecord(data, recordLength));
                                    }
                                }
                            }
                        } else {
                            data = [];
                            let i = 0;
                            while (i < fileBuffer.length) {
                                data.push(fileBuffer[i++]);
                                if (data.length === recordLength) {
                                    file.putRecord(new FixedRecord(data, recordLength));
                                    data = [];
                                    if (fileBuffer[i] === 0xd || fileBuffer[i + 1] === 0xa) {
                                        i += 2;
                                    }
                                }
                            }
                            if (data.length > 0) {
                                file.putRecord(new FixedRecord(data, recordLength));
                            }
                        }
                    } else {
                        this.log.info("Sectors=" + sectors);
                        for (sector = 0; sector < sectors; sector++) {
                            let i = sectorOffset + sector * 256;
                            let sectorBytesLeft = 256;
                            recordLength = fileBuffer[i++];
                            sectorBytesLeft--;
                            while (recordLength !== 0xFF && sectorBytesLeft > 0) {
                                data = [];
                                for (let j = 0; j < recordLength && sectorBytesLeft > 0; j++) {
                                    data[j] = fileBuffer[i++];
                                    sectorBytesLeft--;
                                }
                                file.putRecord(new VariableRecord(data));
                                if (sectorBytesLeft > 0) {
                                    recordLength = fileBuffer[i++];
                                    sectorBytesLeft--;
                                } else {
                                    recordLength = 0xFF;
                                }
                            }
                        }
                        this.log.info(file.getRecordCount() + " records read.");
                    }
                    file.close();
                } else {
                    file = new DiskFile(tiFileName, fileType, 0, 0, 0);
                    const program = [];
                    for (let i = 0; i < fileLength; i++) {
                        program[i] = fileBuffer[sectorOffset + i];
                    }
                    file.setProgram(program);
                }
                this.putFile(file);
                this.setBinaryImage(null); // Invalidate binary image on write
                return file;
            } else {
                this.log.error(fileName + " is too short.");
                return null;
            }
        }
        this.log.warn(fileName + " is not in TIFILES format.");
        return null;
    }

    saveTIFile(fileName: string): Uint8Array {
        const file = this.getFile(fileName);
        if (file != null) {
            const data = [];
            let n = 0;
            // ID
            n = this.writeByte(data, n, 0x07);
            n = this.writeString(data, n, "TIFILES", 7);
            // Total number of sectors
            n = this.writeWord(data, n, file.getSectorCount());
            // Flags
            n = this.writeByte(data, n, (file.getRecordType() << 7) | (file.getDataType() << 1) | file.getFileType());
            // #Rec/sect
            n = this.writeByte(data, n, file.getFileType() === FileType.DATA && file.getRecordLength() > 0 ? Math.floor(256 / (file.getRecordLength() + (file.getRecordType() === RecordType.VARIABLE ? 1 : 0))) : 0);
            // EOF offset
            n = this.writeByte(data, n, file.getEOFOffset());
            // Record length
            n = this.writeByte(data, n, file.getRecordLength());
            // #LogLevel 3 records
            n = this.writeLEWord(data, n, file.getFileType() === FileType.DATA ? (file.getRecordType() === RecordType.FIXED ? file.getRecordCount() : file.getSectorCount()) : 0);
            // File name
            n = this.writeString(data, n, fileName, 10);
            // Padding
            for (; n < 128; n++) {
                data[n] = 0;
            }
            // Content
            if (file.getFileType() === FileType.DATA) {
                const records = file.getRecords();
                const recordCount = file.getRecordCount();
                let recData;
                if (file.getRecordType() === RecordType.FIXED) {
                    const recordPerSector = Math.floor(256 / file.getRecordLength());
                    let recCnt = 0;
                    for (let i = 0; i < recordCount; i++) {
                        recData = records[i].getData();
                        for (let j = 0; j < recData.length; j++) {
                            n = this.writeByte(data, n, recData[j]);
                        }
                        recCnt++;
                        if (recCnt === recordPerSector) {
                            while ((n & 0xFF) !== 0) {
                                n = this.writeByte(data, n, 0);
                            }
                            recCnt = 0;
                        }
                    }
                } else {
                    let sectorBytesLeft = 256;
                    for (let i = 0; i < recordCount; i++) {
                        recData = records[i].getData();
                        if (sectorBytesLeft <= recData.length) {
                            if (sectorBytesLeft > 0) {
                                n = this.writeByte(data, n, 0xFF);
                                sectorBytesLeft--;
                                while (sectorBytesLeft > 0) {
                                    n = this.writeByte(data, n, 0);
                                    sectorBytesLeft--;
                                }
                            }
                            sectorBytesLeft = 256;
                        }
                        n = this.writeByte(data, n, recData.length);
                        sectorBytesLeft--;
                        for (let j = 0; j < recData.length; j++) {
                            n = this.writeByte(data, n, recData[j]);
                            sectorBytesLeft--;
                        }
                    }
                    if (sectorBytesLeft > 0) {
                        n = this.writeByte(data, n, 0xFF);
                        sectorBytesLeft--;
                        while (sectorBytesLeft > 0) {
                            n = this.writeByte(data, n, 0);
                            sectorBytesLeft--;
                        }
                    }
                    this.log.info(recordCount + " records written.");
                }
            } else {
                const program = file.getProgram();
                for (let i = 0; i < program.length; i++, n++) {
                    data[n] = program[i];
                }
            }
            return new Uint8Array(data);
        } else {
            return null;
        }
    }

    readSector(sectorNo: number): Uint8Array {
        const sector = new Uint8Array(256);
        const tiDiskImage = this.getBinaryImage();
        const sectorOffset = 256 * sectorNo;
        for (let i = 0; i < 256; i++) {
            sector[i] = tiDiskImage[sectorOffset + i];
        }
        return sector;
    }

    getBinaryImage(): Uint8Array {
        if (this.binaryImage == null) {
            this.binaryImage = this.createBinaryImage();
        }
        return this.binaryImage;
    }

    setBinaryImage(binaryImage: Uint8Array) {
        this.binaryImage = binaryImage;
    }

    createBinaryImage(): Uint8Array {
        let n, i, j;
        const dskImg = new Uint8Array(1440 * 256);
        // Volume Information Block
        n = 0;
        n = this.writeString(dskImg, n, this.name, 10); // Volume name
        n = this.writeWord(dskImg, n, 1440); // Total sectors
        n = this.writeByte(dskImg, n, 18); // Sectors per track
        n = this.writeString(dskImg, n, "DSK", 3); // ID
        n = this.writeByte(dskImg, n, 0x20); // Protection
        n = this.writeByte(dskImg, n, 40); // Tracks per side
        n = this.writeByte(dskImg, n, 2); // Number of sides
        n = this.writeByte(dskImg, n, 2); // Density
        // Allocation bit map
        this.writeByte(dskImg, 0x38, 0x03); // Reserve sectors 0 and 1
        for (i = 0xEC; i <= 0xFF; i++) { // Unused map entries
            dskImg[i] = 0xFF;
        }
        const files = this.getFilesArray();
        const fileCount = Math.min(files.length, 127);
        let nextDataSectorNo = 2 + fileCount;
        for (let f = 0; f < fileCount; f++) {
            const file = files[f];
            // File Descriptor Index Record
            this.writeWord(dskImg, 256 + 2 * f, 2 + f);
            // File Descriptor Record
            const fileDescriptorAddr = (2 + f) * 256;
            n = fileDescriptorAddr;
            // Name
            n = this.writeString(dskImg, n, file.getName(), 10);
            // Extended record length
            n = this.writeWord(dskImg, n, 0);
            // Status flags
            n = this.writeByte(dskImg, n, (file.getRecordType() << 7) | (file.getDataType() << 1) | file.getFileType());
            // Records per sector
            n = this.writeByte(dskImg, n, file.getFileType() === FileType.DATA ? Math.floor(256 / (file.getRecordLength() + (file.getRecordType() === RecordType.VARIABLE ? 1 : 0))) : 0);
            // Sectors allocated
            n = this.writeWord(dskImg, n, file.getSectorCount());
            // End of file offset
            n = this.writeByte(dskImg, n, file.getEOFOffset());
            // Record length
            n = this.writeByte(dskImg, n, file.getFileType() === FileType.DATA ? file.getRecordLength() : 0);
            // Number of level 3 records
            n = this.writeLEWord(dskImg, n, file.getFileType() === FileType.DATA ? (file.getRecordType() === RecordType.FIXED ? file.getRecordCount() : file.getSectorCount()) : 0);
            // Data sectors
            const startSectorNo = nextDataSectorNo;
            let sectorNo = startSectorNo;
            n = sectorNo * 256;
            if (file.getFileType() === FileType.DATA) {
                const records = file.getRecords();
                const recordCount = file.getRecordCount();
                let data;
                if (file.getRecordType() === RecordType.FIXED) {
                    const recordPerSector = Math.floor(256 / file.getRecordLength());
                    let recCnt = 0;
                    for (i = 0; i < recordCount; i++) {
                        data = records[i].getData();
                        for (j = 0; j < data.length; j++) {
                            n = this.writeByte(dskImg, n, data[j]);
                        }
                        recCnt++;
                        if (recCnt === recordPerSector) {
                            sectorNo++;
                            n = sectorNo * 256;
                            recCnt = 0;
                        }
                    }
                    if (recCnt === 0) {
                        sectorNo--;
                    }
                } else {
                    let sectorBytesLeft = 256;
                    for (i = 0; i < recordCount; i++) {
                        data = records[i].getData();
                        if (sectorBytesLeft <= data.length) {
                            if (sectorBytesLeft > 0) {
                                n = this.writeByte(dskImg, n, 0xFF);
                                sectorBytesLeft--;
                                while (sectorBytesLeft > 0) {
                                    n = this.writeByte(dskImg, n, 0);
                                    sectorBytesLeft--;
                                }
                            }
                            sectorNo++;
                            n = sectorNo * 256;
                            sectorBytesLeft = 256;
                        }
                        n = this.writeByte(dskImg, n, data.length);
                        sectorBytesLeft--;
                        for (j = 0; j < data.length; j++) {
                            n = this.writeByte(dskImg, n, data[j]);
                            sectorBytesLeft--;
                        }
                    }
                    if (sectorBytesLeft > 0) {
                        n = this.writeByte(dskImg, n, 0xFF);
                        sectorBytesLeft--;
                        while (sectorBytesLeft > 0) {
                            n = this.writeByte(dskImg, n, 0);
                            sectorBytesLeft--;
                        }
                    }
                    if (sectorBytesLeft === 256) {
                        sectorNo--;
                    }
                }
            } else {
                // Program
                const program = file.getProgram();
                for (i = 0; i < program.length; i++) {
                    n = this.writeByte(dskImg, n, program[i]);
                }
                sectorNo += Math.floor(program.length / 256) - (program.length % 256 === 0 ? 1 : 0);
            }
            nextDataSectorNo = sectorNo + 1;
            // Data chain pointer block
            const sectorCount = sectorNo - startSectorNo;
            n = fileDescriptorAddr + 0x1C;
            n = this.writeByte(dskImg, n, startSectorNo & 0x00FF);
            n = this.writeByte(dskImg, n, ((sectorCount & 0x000F) << 4) | ((startSectorNo & 0x0F00) >> 8));
            n = this.writeByte(dskImg, n, (sectorCount & 0x0FF0) >> 4);
            // Allocation bit map
            for (i = startSectorNo; i <= sectorNo; i++) {
                dskImg[0x38 + (i >> 3)] |= (1 << (i & 7));
            }
            dskImg[0x38 + ((f + 2) >> 3)] |= (1 << ((f + 2) & 7));
        }
        return dskImg;
    }

    writeString(data: number[] | Uint8Array, n: number, str: string, padLen: number) {
        for (let i = 0; i < str.length; i++) {
            data[n++] = str.charCodeAt(i);
        }
        for (let i = 0; i < padLen - str.length; i++) {
            data[n++] = 0x20;
        }
        return n;
    }

    writeByte(data: number[] | Uint8Array, n: number, b: number) {
        data[n++] = b & 0x00FF;
        return n;
    }

    writeWord(data: number[] | Uint8Array, n: number, w: number) {
        data[n++] = (w & 0xFF00) >> 8;
        data[n++] = w & 0x00FF;
        return n;
    }

    writeLEWord(data: number[] | Uint8Array, n: number, w: number) {
        data[n++] = w & 0x00FF;
        data[n++] = (w & 0xFF00) >> 8;
        return n;
    }

    getState(): object {
        const files = {};
        for (const fileName in this.files) {
            if (this.files.hasOwnProperty(fileName)) {
                files[fileName] = this.files[fileName].getState();
            }
        }
        return {
            name: this.name,
            files: files
        };
    }

    restoreState(state: any) {
        this.name = state.name;
        const files = {};
        for (const fileName in state.files) {
            if (state.files.hasOwnProperty(fileName)) {
                const file = new DiskFile(fileName, FileType.DATA, RecordType.FIXED, 80, DataType.INTERNAL);
                file.restoreState(state.files[fileName]);
                files[fileName] = file;
            }
        }
        this.files = files;
    }
}

export class DiskFile implements State {

    private name: string;
    private fileType: FileType;
    private recordType: RecordType;
    private recordLength: number;
    private dataType: DataType;
    private operationMode: OperationMode;
    private recordPointer: number;
    private records: Record[];
    private program: Uint8Array;
    private accessType: AccessType;

    constructor(name, fileType: FileType, recordType: RecordType, recordLength, dataType: DataType) {
        this.name = name;
        this.fileType = fileType;
        this.recordType = recordType;
        this.recordLength = recordLength;
        this.dataType = dataType;
        this.operationMode = -1;
        this.recordPointer = -1;
        this.records = [];
        this.program = null;
    }

    getName(): string {
        return this.name;
    }

    getFileType(): FileType {
        return this.fileType;
    }

    getRecordType(): RecordType {
        return this.recordType;
    }

    getRecordLength(): number {
        return this.recordLength;
    }

    getSectorCount(): number {
        let sectors = 0;
        if (this.getFileType() === FileType.DATA) {
            if (this.getRecordType() === RecordType.FIXED) {
                const recsPerSector = Math.floor(256 / this.recordLength);
                sectors = Math.floor(this.records.length / recsPerSector) + (this.records.length % recsPerSector === 0 ? 0 : 1);
            } else {
                sectors = 1;
                let sectorBytesLeft = 256;
                for (let i = 0; i < this.records.length; i++) {
                    const recordSize = this.records[i].getData().length + 1;
                    if (sectorBytesLeft >= recordSize) {
                        sectorBytesLeft -= recordSize;
                    } else {
                        sectors++;
                        sectorBytesLeft = 256 - recordSize;
                    }
                }
            }
        } else if (this.program) {
            sectors = Math.floor((this.program.length) / 256) + (this.program.length % 256 === 0 ? 0 : 1);
        }
        return sectors;
    }

    getEOFOffset(): number {
        let eofOffset = 0;
        if (this.getFileType() === FileType.DATA) {
            if (this.getRecordType() === RecordType.FIXED) {
                const recsPerSector = Math.floor(256 / this.recordLength);
                eofOffset = (this.getRecordCount() % recsPerSector) * this.recordLength;
            } else {
                let sectorBytesLeft = 256;
                for (let i = 0; i < this.records.length; i++) {
                    const recordSize = this.records[i].getData().length + 1;
                    if (sectorBytesLeft >= recordSize) {
                        sectorBytesLeft -= recordSize;
                    } else {
                        sectorBytesLeft = 256 - recordSize;
                    }
                }
                eofOffset = 256 - sectorBytesLeft;
            }
        } else {
            eofOffset = this.program.length % 256;
        }
        return eofOffset;
    }

    getFileSize(): number {
        if (this.fileType === FileType.DATA) {
            if (this.recordType === RecordType.FIXED) {
                return this.recordLength * this.records.length;
            } else {
                let length = 0;
                for (let i = 0; i < this.records.length; i++) {
                    length += this.records[i].getData().length + 1;
                }
                return length;
            }
        } else {
            return this.program.length;
        }
    }

    getDataType(): DataType {
        return this.dataType;
    }

    getOperationMode(): OperationMode {
        return this.operationMode;
    }

    getAccessType(): AccessType {
        return this.accessType;
    }

    getRecordPointer(): number {
        return this.recordPointer;
    }

    setRecordPointer(recordPointer: number) {
        this.recordPointer = recordPointer;
    }

    rewind() {
        this.recordPointer = 0;
    }

    open(operationMode: OperationMode, accessType: AccessType) {
        this.operationMode = operationMode;
        this.recordPointer = 0;
        this.accessType = accessType;
    }

    getRecord(): Record {
        return this.records[this.recordPointer++];
    }

    putRecord(record: Record) {
        return this.records[this.recordPointer++] = record;
    }

    deleteRecord() {
        delete this.records[this.recordPointer];
    }

    setProgram(program: Uint8Array) {
        this.program = program;
    }

    getProgram(): Uint8Array {
        return this.program;
    }

    close() {
        this.operationMode = -1;
        this.recordPointer = -1;
    }

    getRecords(): Record[] {
        return this.records;
    }

    getRecordCount(): number {
        return this.records.length;
    }

    isEOF(): boolean {
        return this.recordPointer >= this.getRecordCount();
    }

    getState(): object {
        if (this.fileType === FileType.DATA) {
            const records = [];
            for (let i = 0; i < this.records.length; i++) {
                records[i] = this.records[i].getState();
            }
            return {
                name: this.name,
                fileType: this.fileType,
                recordType: this.recordType,
                recordLength: this.recordLength,
                datatype: this.dataType,
                records: records

            };
        } else {
            return {
                name: this.name,
                fileType: this.fileType,
                program: this.program
            };
        }
    }

    restoreState(state: any) {
        this.name = state.name;
        this.fileType = state.fileType;
        if (state.fileType === FileType.DATA) {
            this.recordType = state.recordType;
            this.recordLength = state.recordLength;
            this.dataType = state.dataType;
            const records = [];
            for (let i = 0; i < state.records.length; i++) {
                let record;
                if (this.recordType === RecordType.FIXED) {
                    record = new FixedRecord(null, 0);
                } else {
                    record = new VariableRecord(state.records[i].data);
                }
                record.restoreState(state.records[i]);
                records[i] = record;
            }
            this.records = records;
        } else {
            this.program = state.program;
            this.recordType = 0;
            this.recordLength = 0;
            this.dataType = 0;
        }
    }

    toString(): string {
        let s = "";
        let i;
        if (this.fileType === FileType.DATA) {
            for (i = 0; i < this.records.length; i++) {
                s += "Record " + i + ": ";
                const data = this.records[i].getData();
                for (let j = 0; j < data.length; j++) {
                    s += Util.toHexByteShort(data[j]);
                }
                s += "\n";
            }
        } else {
            for (i = 0; i < this.program.length; i++) {
                if (i % 32 === 0) {
                    s += i.toHexWord() + " ";
                }
                s += Util.toHexByteShort(this.program[i]);
                if (i % 8 === 7) {
                    s += " ";
                }
                if (i % 32 === 31) {
                    s += "\n";
                }
            }
        }
        return s;
    }
}

class Record implements State {

    protected data: number[];

    constructor() {
        this.data = [];
    }

    getData(): number[] {
        return this.data;
    }

    getState(): object {
        return {
            data: this.data
        };
    }

    restoreState(state: any) {
        this.data = state.data;
    }
}

export class FixedRecord extends Record {

    constructor(data: string | number[], length: number) {
        super();
        let i;
        if (typeof(data) === "string") {
            for (i = 0; i < length; i++) {
                this.data[i] = data.length > i ? data.charCodeAt(i) : 0;
            }
        } else if (typeof(data) === "object") {
            for (i = 0; i < length; i++) {
                this.data[i] = data.length > i ? data[i] : 0;
            }
        }
    }
}

export class VariableRecord extends Record {

    constructor(data: string | number[]) {
        super();
    }
}

