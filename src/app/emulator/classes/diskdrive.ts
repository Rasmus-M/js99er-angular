import {DiskFile, FixedRecord, VariableRecord} from './diskfile';
import {AccessType, DataType, Disk, DiskError, FileType, OpCode, OperationMode, RecordType} from './disk';
import {State} from '../interfaces/state';
import {DiskImage} from './diskimage';
import {TI994A} from './ti994a';
import {Log} from '../../classes/log';
import {Util} from '../../classes/util';
import {Memory} from './memory';

export class DiskDrive implements State {

    static DSR_ROM: number[] = [
        0xAA,                           // >4000 Standard header
        0x01,                           // >4001 Version
        0x00,                           // >4002 No programs allowed in peripheral card ROMs
        0x00,                           // >4003 Not used
        0x40, 0x10,                     // >4004 Pointer to power-up list
        0x00, 0x00,                     // >4006 Pointer to program list
        0x40, 0x14,                     // >4008 Pointer to DSR list
        0x40, 0x3A,                     // >400A Pointer to subprogram list
        0x00, 0x00,                     // >400C Pointer to ISR list
        0x00, 0x00,                     // >400E Pointer to ?
        // Power-up list
        0x00, 0x00,                     // >4010 Link to next power-up routine (no more)
        0x40, 0x6E,                     // >4012 Address of this power-up routine
        // DSR list
        // DSK1
        0x40, 0x1E,                     // >4014 Link to next DSR
        0x40, 0x70,                     // >4016 Address of this DSR
        0x04,                           // >4018 Name length
        0x44, 0x53, 0x4B, 0x31,         // >4019 Name "DSK1"
        0x00,                           // >401D Align to word
        // DSK2
        0x40, 0x28,                     // >401E Link to next DSR
        0x40, 0x74,                     // >4020 Address of this DSR
        0x04,                           // >4022 Name length
        0x44, 0x53, 0x4B, 0x32,         // >4023 Name "DSK2"
        0x00,                           // >4027 Align to word
        // DSK3
        0x40, 0x32,                     // >4028 Link to next DSR
        0x40, 0x78,                     // >402A Address of this DSR
        0x04,                           // >402C Name length
        0x44, 0x53, 0x4B, 0x33,         // >402D Name "DSK3"
        0x00,                           // >4031 Align to word
        // DSK
        0x00, 0x00,                     // >4032 Link to next DSR (no more)
        0x40, 0x7C,                     // >4034 Address of this DSR
        0x03,                           // >4036 Name length
        0x44, 0x53, 0x4B,               // >4037 Name "DSK"
        // Subprogram list
        // FILES
        0x40, 0x44,                     // >403A Link to next subprogram
        0x40, 0x80,                     // >403C Address of FILES subprogram
        0x05,                           // >403E Name length
        0x46, 0x49, 0x4C, 0x45, 0x53,   // >403F Name "FILES"
        // >10
        0x40, 0x4A,                     // >4044 Link to next subprogram
        0x40, 0x84,                     // >4046 Address of >10 subprogram
        0x01,                           // >4048 Name length
        0x10,                           // >4049 Name >10
        // >11
        0x40, 0x50,                     // >404A Link to next subprogram
        0x40, 0x88,                     // >404C Address of >11 subprogram
        0x01,                           // >405E Name length
        0x11,                           // >405F Name >11
        // >12
        0x40, 0x56,                     // >4050 Link to next subprogram
        0x40, 0x8C,                     // >4052 Address of >12 subprogram
        0x01,                           // >4054 Name length
        0x12,                           // >4055 Name >12
        // >13
        0x40, 0x5C,                     // >4056 Link to next subprogram
        0x40, 0x90,                     // >4058 Address of >13 subprogram
        0x01,                           // >405A Name length
        0x13,                           // >405B Name >13
        // >14
        0x40, 0x62,                     // >405C Link to next subprogram
        0x40, 0x94,                     // >405E Address of >14 subprogram
        0x01,                           // >4060 Name length
        0x14,                           // >4061 Name >14
        // >15
        0x40, 0x68,                     // >4062 Link to next subprogram
        0x40, 0x98,                     // >4064 Address of >15 subprogram
        0x01,                           // >4066 Name length
        0x15,                           // >4067 Name >15
        // >16
        0x00, 0x00,                     // >4068 Link to next subprogram (no more)
        0x40, 0x9C,                     // >406A Address of >16 subprogram
        0x01,                           // >406C Name length
        0x16,                           // >406D Name >16
        // Power-up routine
        0x04, 0x5B,                     // >406E B *R11
        // DSK1 routine
        0x05, 0xCB,                     // >4070 INCT R11
        0x04, 0x5B,                     // >4072 B *R11
        // DSK2 routine
        0x05, 0xCB,                     // >4074 INCT R11
        0x04, 0x5B,                     // >4076 B *R11
        // DSK3 routine
        0x05, 0xCB,                     // >4078 INCT R11
        0x04, 0x5B,                     // >407A B *R11
        // DSK routine
        0x05, 0xCB,                     // >407C INCT R11
        0x04, 0x5B,                     // >407E B *R11
        // FILES subprogram
        0x05, 0xCB,                     // >4080 INCT R11
        0x04, 0x5B,                     // >4082 B *R11
        // >10 subprogram
        0x05, 0xCB,                     // >4084 INCT R11
        0x04, 0x5B,                     // >4086 B *R11
        // >11 subprogram
        0x05, 0xCB,                     // >4088 INCT R11
        0x04, 0x5B,                     // >408A B *R11
        // >12 subprogram
        0x05, 0xCB,                     // >408C INCT R11
        0x04, 0x5B,                     // >408E B *R11
        // >13 subprogram
        0x05, 0xCB,                     // >4090 INCT R11
        0x04, 0x5B,                     // >4092 B *R11
        // >14 subprogram
        0x05, 0xCB,                     // >4094 INCT R11
        0x04, 0x5B,                     // >4096 B *R11
        // >15 subprogram
        0x05, 0xCB,                     // >4098 INCT R11
        0x04, 0x5B,                     // >409A B *R11
        // >16 subprogram
        0x05, 0xCB,                     // >409C INCT R11
        0x04, 0x5B                      // >409E B *R11
    ];

    static STATUS_NO_SUCH_FILE = 0x80;
    static STATUS_PROTECTED = 0x40;
    static STATUS_INTERNAL = 0x10;
    static STATUS_PROGRAM = 0x08;
    static STATUS_VARIABLE = 0x04;
    static STATUS_DISK_FULL = 0x02;
    static STATUS_EOF = 0x01;

    static DSR_ROM_POWER_UP = 0x406E;
    static DSR_ROM_DSK1 = 0x4070;
    static DSR_ROM_DSK2 = 0x4074;
    static DSR_ROM_DSK3 = 0x4078;
    static DSR_ROM_DSK = 0x407C;
    static DSR_ROM_FILES = 0x4080;
    static DSR_ROM_SECTOR_IO_10 = 0x4084;
    static DSR_ROM_FORMAT_DISK_11 = 0x4088;
    static DSR_ROM_FILE_PROTECTION_12 = 0x408C;
    static DSR_ROM_RENAME_FILE_13 = 0x4090;
    static DSR_ROM_FILE_INPUT_14 = 0x4094;
    static DSR_ROM_FILE_OUTPUT_15 = 0x4098;
    static DSR_ROM_FILES_16  = 0x409C;

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
        let drive = 0;
        // Log.getLog().info("Executing DSR at PC=" + Util.toHexWord(pc) + ".");
        switch (pc) {
            case DiskDrive.DSR_ROM_POWER_UP:
                DiskDrive.powerUp(memory);
                break;
            case DiskDrive.DSR_ROM_DSK1:
                status = diskDrives[0].dsrRoutine(memory.getPADWord(0x8356) - 14, false);
                break;
            case DiskDrive.DSR_ROM_DSK2:
                status = diskDrives[1].dsrRoutine(memory.getPADWord(0x8356) - 14, false);
                break;
            case DiskDrive.DSR_ROM_DSK3:
                status = diskDrives[2].dsrRoutine(memory.getPADWord(0x8356) - 14, false);
                break;
            case DiskDrive.DSR_ROM_DSK:
                status = -1;
                for (let i = 0; i < diskDrives.length && status === -1; i++) {
                    status = diskDrives[i].dsrRoutine(memory.getPADWord(0x8356) - 13, true);
                }
                if (status === -1) {
                    status = 0x20;
                }
                break;
            case DiskDrive.DSR_ROM_FILES:
                DiskDrive.setFiles(-1, memory);
                break;
            case DiskDrive.DSR_ROM_SECTOR_IO_10:
                drive = memory.getPADByte(0x834C) - 1;
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
                drive = memory.getPADByte(0x834C) - 1;
                if (drive >= 0 && drive < diskDrives.length) {
                    diskDrives[drive].fileInput(memory);
                }
                break;
            case DiskDrive.DSR_ROM_FILE_OUTPUT_15:
                Log.getLog().warn("Subprogram >15: File Output not implemented.");
                break;
            case DiskDrive.DSR_ROM_FILES_16:
                DiskDrive.setFiles(memory.getPADByte(0x834C), memory);
                break;
            default:
                // Log.getLog().warn("Subprogram at " + Util.toHexWord(pc) + " not found.");
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
        memory.writeWord(0x8370, 0x3fff - nFiles * 0x2B8, null);
        memory.writeWord(0x8350, memory.readWord(0x8350, null) & 0x00FF, null);
    }

    reset() {
        this.ram = this.console.getVDP().getRAM();
        this.catalogFile = null;
    }

    getName(): string {
        return this.name;
    }

    dsrRoutine(pabAddr: number, checkDiskName: boolean): number {
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
        fileName = fileName.trim();
        const recordType = (flagStatus & 0x10) >> 4;
        const datatype = (flagStatus & 0x08) >> 3;
        const operationMode = (flagStatus & 0x06) >> 1;
        const accessType = flagStatus & 0x01;

        if (checkDiskName) {
            const nameParts = fileName.split(".");
            if (nameParts.length < 3 || this.diskImage === null || nameParts[1] !== this.diskImage.getName()) {
                return -1;
            }
            fileName = this.name + "." + nameParts[2];
        }

        this.log.info(
            fileName + ": " +
            Disk.OPERATION_MODE_LABELS[operationMode] + ", " +
            Disk.ACCESS_TYPE_LABELS[accessType] + ", " +
            Disk.DATA_TYPE_LABELS[datatype] + ", " +
            Disk.RECORD_TYPE_LABELS[recordType] + ", " +
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
            if (fileName.substring(0, this.name.length + 1) === this.name + ".") {
                fileName = fileName.substring(this.name.length + 1);
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
                                    this.log.info("EOF - closing file.");
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
                            file.setProgram(new Uint8Array(saveBuffer));
                            this.diskImage.putFile(file);
                        } else {
                            file.setProgram(new Uint8Array(saveBuffer));
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
                        this.log.warn("Unknown DSR op-code: " + opCode);
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
        const read = (memory.getPADWord(0x834C) & 0xFF) !== 0;
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

    fileInput(memory: Memory) {
        const sectors = memory.getPADWord(0x834C) & 0xFF;
        const fileNameAddr = memory.getPADWord(0x834E);
        let fileName = "";
        for (let i = 0; i < 10; i++) {
            fileName += String.fromCharCode(this.ram[fileNameAddr + i]);
        }
        fileName = fileName.trim();
        const infoAddr = 0x8300 | memory.getPADByte(0x8350);
        if (this.diskImage != null) {
            const file = this.diskImage.getFile(fileName);
            if (sectors !== 0) {
                const bufferAddr = memory.getPADWord(infoAddr);
                const firstSector = memory.getPADWord(infoAddr + 2);
                this.log.info("Reading file " + this.getName() + "." + fileName + " sectors " + firstSector + "-" + (firstSector + sectors - 1) + " to VDP " + Util.toHexWord(bufferAddr));
                if (file.getFileType() === FileType.PROGRAM) {
                    const program = file.getProgram();
                    for (let i = 0; i < sectors * 256; i++) {
                        this.ram[bufferAddr + i] = program[firstSector * 256 + i];
                    }
                } else {
                    this.log.warn("File input only implemented for program files.");
                }
                memory.setPADByte(0x834c, 0);
                memory.setPADByte(0x834d, sectors);
                memory.setPADByte(0x8350, 0);
            } else {
                this.log.info("Request file info for " + this.getName() + "." + fileName);
                memory.setPADWord(infoAddr + 2, file.getSectorCount());
                memory.setPADByte(infoAddr + 4, (file.getRecordType() << 7) | (file.getDataType() << 1) | file.getFileType());
                memory.setPADByte(infoAddr + 5, file.getFileType() === FileType.DATA ? Math.floor(256 / (file.getRecordLength() + (file.getRecordType() === RecordType.VARIABLE ? 1 : 0))) : 0);
                memory.setPADByte(infoAddr + 6, file.getEOFOffset());
                memory.setPADByte(infoAddr + 7, file.getFileType() === FileType.DATA ? file.getRecordLength() : 0);
                memory.setPADByte(infoAddr + 8, file.getFileType() === FileType.DATA ? (file.getRecordType() === RecordType.FIXED ? file.getRecordCount() : file.getSectorCount()) : 0);
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

    loadDSKFromURL(url: string, onLoad: () => void, eventHandler: (DiskImageEvent) => void) {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
            this.loadDSKFile("", new Uint8Array(xhr.response), eventHandler);
            if (onLoad) {
                onLoad();
            }
        };
        xhr.send();
    }

    loadDSKFile(dskFileName: string, fileBuffer: Uint8Array, eventHandler: (DiskImageEvent) => void) {
        let volumeName = "";
        for (let i = 0; i < 10; i++) {
            const ch = fileBuffer[i];
            if (ch >= 32 && ch < 128) {
                volumeName += String.fromCharCode(ch);
            }
        }
        volumeName = volumeName.trim();
        this.log.info("Volume name: " + volumeName);
        const diskImage = new DiskImage(volumeName, eventHandler);
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
                    Disk.FILE_TYPE_LABELS[fileType] + ": " +
                    (fileType === FileType.DATA ?
                        Disk.DATA_TYPE_LABELS[datatype] + ", " +
                        Disk.RECORD_TYPE_LABELS[recordType] + ", " +
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
                    diskFile.setProgram(new Uint8Array(program));
                }
                diskImage.putFile(diskFile);
            }
        }
        this.setDiskImage(diskImage);
        diskImage.setBinaryImage(fileBuffer);
        return diskImage;
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
