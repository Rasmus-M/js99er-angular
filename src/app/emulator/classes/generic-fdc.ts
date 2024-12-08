import {DiskImage} from "./disk-image";
import {DiskFile, FixedRecord, Record, VariableRecord} from "./disk-file";
import {Log} from "../../classes/log";
import {Memory} from "./memory";
import {Util} from "../../classes/util";
import {AccessType, DataType, Disk, DiskError, FileType, OpCode, OperationMode, RecordType, STATUS_EOF, STATUS_INTERNAL, STATUS_NO_SUCH_FILE, STATUS_PROGRAM, STATUS_VARIABLE} from "./disk";
import {Console} from "../interfaces/console";
import {DiskDrive} from "./disk-drive";
import {VDP} from "../interfaces/vdp";
import {FDC} from "../interfaces/fdc";
import {Stateful} from "../interfaces/stateful";
import {DSRCard} from "../interfaces/dsr-card";

export const GENERIC_FDC_DSR_ROM: number[] = [
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

export class GenericFdc implements FDC, DSRCard {

    static ID = 'GENERIC_FDC';

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

    static DSR_HOOK_START = GenericFdc.DSR_ROM_POWER_UP;
    static DSR_HOOK_END = GenericFdc.DSR_ROM_FILES_16;

    private romEnabled = false;
    private memory: Memory;
    private catalogFile: DiskFile | null;
    private log: Log = Log.getLog();

    constructor(
        private console: Console,
        private diskDrives: DiskDrive[]
    ) {
        this.memory = console.getMemory();
        this.init();
    }

    public reset() {
        this.catalogFile = null;
    }

    public getId(): string {
        return GenericFdc.ID;
    }

    public getROM(): number[] {
        return GENERIC_FDC_DSR_ROM;
    }

    public isEnabled() {
        return this.romEnabled;
    }

    public getROMBank(): number {
        return 0;
    }

    public getCruAddress(): number {
        return 0x1100;
    }

    public readCruBit(bit: number): boolean {
        if (bit === 0) {
            return this.isEnabled();
        }
        return false;
    }

    public writeCruBit(bit: number, value: boolean): void {
        if (bit === 0) {
            this.romEnabled = value;
        }
    }

    private init() {
        this.console.getCPU().instructionExecuting().subscribe((pc) => {
            if (this.isEnabled() && pc >= GenericFdc.DSR_HOOK_START && pc <= GenericFdc.DSR_HOOK_END) {
                this.executeHooks(pc);
            }
        });
    }

    private executeHooks(pc: number) {
        const diskDrives = this.diskDrives;
        let status = 0;
        let drive = 0;
        // this.log.info("Executing DSR at PC=" + Util.toHexWord(pc));
        switch (pc) {
            case GenericFdc.DSR_ROM_POWER_UP:
                this.powerUp();
                break;
            case GenericFdc.DSR_ROM_DSK1:
                status = this.dsrRoutine(diskDrives[0], this.memory.getPADWord(0x8356) - 14, false);
                break;
            case GenericFdc.DSR_ROM_DSK2:
                status = this.dsrRoutine(diskDrives[1], this.memory.getPADWord(0x8356) - 14, false);
                break;
            case GenericFdc.DSR_ROM_DSK3:
                status = this.dsrRoutine(diskDrives[2], this.memory.getPADWord(0x8356) - 14, false);
                break;
            case GenericFdc.DSR_ROM_DSK:
                status = -1;
                for (let i = 0; i < diskDrives.length && status === -1; i++) {
                    status = this.dsrRoutine(diskDrives[i], this.memory.getPADWord(0x8356) - 13, true);
                }
                if (status === -1) {
                    status = 0x20;
                }
                break;
            case GenericFdc.DSR_ROM_FILES:
                this.setFiles(-1);
                break;
            case GenericFdc.DSR_ROM_SECTOR_IO_10:
                drive = this.memory.getPADByte(0x834C) - 1;
                if (drive >= 0 && drive < diskDrives.length) {
                    this.sectorIO(diskDrives[drive]);
                }
                break;
            case GenericFdc.DSR_ROM_FORMAT_DISK_11:
                this.log.warn("Subprogram >11: Format Disk not implemented");
                break;
            case GenericFdc.DSR_ROM_FILE_PROTECTION_12:
                this.log.warn("Subprogram >12: File Protection not implemented");
                break;
            case GenericFdc.DSR_ROM_RENAME_FILE_13:
                this.log.warn("Subprogram >13: Rename File not implemented");
                break;
            case GenericFdc.DSR_ROM_FILE_INPUT_14:
                drive = this.memory.getPADByte(0x834C) - 1;
                if (drive >= 0 && drive < diskDrives.length) {
                    this.fileInput(diskDrives[drive]);
                }
                break;
            case GenericFdc.DSR_ROM_FILE_OUTPUT_15:
                this.log.warn("Subprogram >15: File Output not implemented");
                break;
            case GenericFdc.DSR_ROM_FILES_16:
                this.setFiles(this.memory.getPADByte(0x834C));
                break;
            default:
                // this.log.warn("Subprogram at " + Util.toHexWord(pc) + " not found");
                break;
        }
        this.memory.setPADByte(0x837C, this.memory.getPADByte(0x837C) | status);
    }

    public powerUp() {
        this.log.info("Executing disk DSR power-up routine");
        this.setFiles(3);
    }

    public setFiles(nFiles: number) {
        // Code from Classic99
        if (nFiles === -1) {
            // Get parameter from BASIC
            // Get next basic token
            let x = this.memory.getPADWord(0x832c);
            // Skip "FILES"
            x += 7;
            // Get the VDP RAM
            const vdp = this.console.getVDP();
            // Get two bytes (size of string)
            let y = (vdp.getByte(x) << 8) | vdp.getByte(x + 1);
            // c8 means unquoted string, 1 is the length
            if (y === 0xc801) {
                // Increment pointer
                x += 2;
                // This is the number of files in ASCII
                y = vdp.getByte(x) - 0x30;
                if ((y <= 9) && (y >= 0)) {
                    // valid count
                    nFiles = y;
                    // Try to skip the rest of the statement
                    x += 3;
                    // Write new pointer
                    this.memory.setPADWord(0x832c, x);
                    // Clear 'current' token
                    this.memory.setPADWord(0x8342, 0);
                }
            }
        }
        if (nFiles === -1) {
            nFiles = 3;
        }
        this.log.info("Executing disk DSR FILES routine (n = " + nFiles + ")");
        if (nFiles > 0) {
            let newTop = 0x3def - (256 + 256 + 6) * nFiles - 5 - 1;
            this.memory.setPADWord(0x8370, newTop);
            const vdp = this.console.getVDP();
            vdp.setByte(++newTop, 0xaa); // Valid header
            vdp.setByte(++newTop, 0x3f); // Top of VRAM, MSB
            vdp.setByte(++newTop, 0xff); // Top of VRAM, LSB
            vdp.setByte(++newTop, 0x11); // CRU of this disk controller
            vdp.setByte(++newTop, nFiles); // Number of files
        } else {
            this.memory.setPADWord(0x8370, 0x3fff);
        }
    }

    private dsrRoutine(diskDrive: DiskDrive, pabAddr: number, checkDiskName: boolean): number {
        this.log.info("Executing DSR routine for " + diskDrive.getName() + ", PAB in " + Util.toHexWord(pabAddr));
        const vdp = this.console.getVDP();
        const opCode = vdp.getByte(pabAddr);
        const flagStatus = vdp.getByte(pabAddr + 1);
        const dataBufferAddress = vdp.getByte(pabAddr + 2) << 8 | vdp.getByte(pabAddr + 3);
        let recordLength = vdp.getByte(pabAddr + 4);
        const characterCount = vdp.getByte(pabAddr + 5);
        const recordNumber = vdp.getByte(pabAddr + 6) << 8 | vdp.getByte(pabAddr + 7);
        // let screenOffset = vdp.getByte(pabAddr + 8];
        const fileNameLength = vdp.getByte(pabAddr + 9);
        let fileName = "";
        for (let i = 0; i < fileNameLength; i++) {
            fileName += String.fromCharCode(vdp.getByte(pabAddr + 10 + i));
        }
        fileName = fileName.trim();
        const recordType = (flagStatus & 0x10) >> 4;
        const datatype = (flagStatus & 0x08) >> 3;
        const operationMode = (flagStatus & 0x06) >> 1;
        const accessType = flagStatus & 0x01;

        if (diskDrive.getDiskImage() === null) {
            this.setErrorCode(vdp, pabAddr, DiskError.DEVICE_ERROR);
            return -1;
        }

        const diskImage: DiskImage = diskDrive.getDiskImage()!;

        if (checkDiskName) {
            const nameParts = fileName.split(".");
            if (nameParts.length < 3 || nameParts[1] !== diskImage.getName()) {
                return -1;
            }
            fileName = diskDrive.getName() + "." + nameParts[2];
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
        const diskDriveName = diskDrive.getName();
        if (fileName.substring(0, diskDriveName.length + 1) === diskDriveName + ".") {
            fileName = fileName.substring(diskDriveName.length + 1);
            let file: DiskFile, record: Record;
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
                            vdp.setByte(pabAddr + 4, recordLength);
                        }
                        file = diskImage.getFile(fileName);
                        if (file == null || operationMode === OperationMode.OUTPUT) {
                            file = new DiskFile(fileName, FileType.DATA, recordType, recordLength, datatype);
                            diskImage.putFile(file);
                        }
                    } else {
                        if (fileName.length > 0) {
                            // Open existing file
                            file = diskImage.getFile(fileName);
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
                                vdp.setByte(pabAddr + 4, recordLength);
                            }
                        } else if (operationMode === OperationMode.INPUT) {
                            // Catalog
                            file = this.createCatalogFile(diskImage);
                            this.catalogFile = file;
                            if (recordLength === 0) {
                                recordLength = 38;
                                vdp.setByte(pabAddr + 4, recordLength);
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
                        file = diskImage.getFile(fileName);
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
                        file = diskImage.getFile(fileName);
                    } else {
                        // Catalog
                        file = this.catalogFile!;
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
                                            for (let i = 0; i < bytesToRead; i++) {
                                                vdp.setByte(dataBufferAddress + i, recordData[i]);
                                            }
                                            vdp.setByte(pabAddr + 5, bytesToRead);
                                            vdp.setByte(pabAddr + 6, (file.getRecordPointer() & 0xFF00) >> 8);
                                            vdp.setByte(pabAddr + 7, file.getRecordPointer() & 0x00FF);
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
                                this.log.info("EOF - closing file");
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
                    file = diskImage.getFile(fileName);
                    if (file != null) {
                        if (file.getFileType() === FileType.DATA) {
                            if (file.getOperationMode() === operationMode) {
                                if (file.getAccessType() === AccessType.RELATIVE) {
                                    file.setRecordPointer(recordNumber);
                                }
                                const bytesToWrite = recordType === RecordType.FIXED ? recordLength : characterCount;
                                const writeBuffer = [];
                                for (let i = 0; i < bytesToWrite; i++) {
                                    writeBuffer[i] = vdp.getByte(dataBufferAddress + i);
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
                                vdp.setByte(pabAddr + 6, (file.getRecordPointer() & 0xFF00) >> 8);
                                vdp.setByte(pabAddr + 7, file.getRecordPointer() & 0x00FF);
                                diskImage.invalidateBinaryImage();
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
                    file = diskImage.getFile(fileName);
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
                    file = diskImage.getFile(fileName);
                    if (file != null) {
                        if (file.getFileType() === FileType.PROGRAM) {
                            const loadBuffer = file.getProgram();
                            if (loadBuffer) {
                                for (let i = 0; i < Math.min(recordNumber, loadBuffer.length); i++) {
                                    vdp.setByte(dataBufferAddress + i, loadBuffer[i]);
                                }
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
                    for (let i = 0; i < recordNumber; i++) {
                        saveBuffer[i] = vdp.getByte(dataBufferAddress + i);
                    }
                    file = diskImage.getFile(fileName);
                    if (file == null) {
                        file = new DiskFile(fileName, FileType.PROGRAM, 0, 0, 0);
                        file.setProgram(new Uint8Array(saveBuffer));
                        diskImage.putFile(file);
                    } else {
                        file.setProgram(new Uint8Array(saveBuffer));
                    }
                    diskImage.invalidateBinaryImage();
                    break;
                case OpCode.DELETE:
                    this.log.info("Op-code " + opCode + ": DELETE");
                    file = diskImage.getFile(fileName);
                    if (file != null) {
                        diskImage.deleteFile(fileName);
                    } else {
                        errorCode = DiskError.FILE_ERROR;
                    }
                    break;
                case OpCode.SCRATCH:
                    this.log.info("Op-code " + opCode + ": SCRATCH");
                    file = diskImage.getFile(fileName);
                    if (file != null) {
                        if (file.getFileType() === FileType.DATA) {
                            if (file.getOperationMode() === operationMode && file.getAccessType() === AccessType.RELATIVE) {
                                file.setRecordPointer(recordNumber);
                                switch (file.getOperationMode()) {
                                    case OperationMode.UPDATE:
                                        if (file.getRecord() != null) {
                                            file.deleteRecord();
                                            diskImage.invalidateBinaryImage();
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
                    file = diskImage.getFile(fileName);
                    if (file != null) {
                        if (file.getDataType() === DataType.INTERNAL) {
                            fileStatus |= STATUS_INTERNAL;
                        }
                        if (file.getFileType() === FileType.PROGRAM) {
                            fileStatus |= STATUS_PROGRAM;
                        }
                        if (file.getRecordType() === RecordType.VARIABLE) {
                            fileStatus |= STATUS_VARIABLE;
                        }
                        if (file.isEOF()) {
                            fileStatus |= STATUS_EOF;
                        }
                    } else {
                        fileStatus |= STATUS_NO_SUCH_FILE;
                    }
                    vdp.setByte(pabAddr + 8, fileStatus);
                    break;
                default:
                    this.log.warn("Unknown DSR op-code: " + opCode);
                    errorCode = DiskError.ILLEGAL_OPERATION;
            }
        } else {
            status = 0x20;
        }
        if (errorCode) {
            this.setErrorCode(vdp, pabAddr, errorCode);
        }
        return status;
    }

    setErrorCode(vdp: VDP, pabAddr: number, errorCode: number) {
        this.log.info("Returned error code: " + errorCode + "\n");
        vdp.setByte(pabAddr + 1, (vdp.getByte(pabAddr + 1) | (errorCode << 5)) & 0xFF);
    }


    sectorIO(diskDrive: DiskDrive) {
        const memory = this.memory;
        const read = (memory.getPADWord(0x834C) & 0xFF) !== 0;
        const bufferAddr = memory.getPADWord(0x834E);
        const sectorNo = memory.getPADWord(0x8350);
        this.log.info("Sector I/O drive " + diskDrive.getName() + ", read: " + read + ", bufferAddr: " + Util.toHexWord(bufferAddr) + ", sectorNo: " + Util.toHexWord(sectorNo));
        const diskImage = diskDrive.getDiskImage();
        if (diskImage != null) {
            if (read) {
                const sector = diskImage.readSector(sectorNo);
                const vdp = this.console.getVDP();
                for (let i = 0; i < 256; i++) {
                    vdp.setByte(bufferAddr + i, sector[i]);
                }
                memory.setPADWord(0x834A, sectorNo);
                memory.setPADWord(0x8350, 0);
            } else {
                // Write not implemented:
                this.log.warn("Sector write not implemented");
            }
        }
    }

    fileInput(diskDrive: DiskDrive) {
        const memory = this.memory;
        const vdp = this.console.getVDP();
        const sectors = memory.getPADWord(0x834C) & 0xFF;
        const fileNameAddr = memory.getPADWord(0x834E);
        let fileName = "";
        for (let i = 0; i < 10; i++) {
            fileName += String.fromCharCode(vdp.getByte(fileNameAddr + i));
        }
        fileName = fileName.trim();
        const infoAddr = 0x8300 | memory.getPADByte(0x8350);
        const diskImage = diskDrive.getDiskImage();
        if (diskImage != null) {
            const file = diskImage.getFile(fileName);
            if (sectors !== 0) {
                const bufferAddr = memory.getPADWord(infoAddr);
                const firstSector = memory.getPADWord(infoAddr + 2);
                this.log.info("Reading file " + diskDrive.getName() + "." + fileName + " sectors " + firstSector + "-" + (firstSector + sectors - 1) + " to VDP " + Util.toHexWord(bufferAddr));
                if (file.getFileType() === FileType.PROGRAM) {
                    const program = file.getProgram();
                    if (program) {
                        for (let i = 0; i < sectors * 256; i++) {
                            vdp.setByte(bufferAddr + i, program[firstSector * 256 + i]);
                        }
                    }
                } else {
                    this.log.warn("File input only implemented for program files");
                }
                memory.setPADByte(0x834c, 0);
                memory.setPADByte(0x834d, sectors);
                memory.setPADByte(0x8350, 0);
            } else {
                this.log.info("Request file info for " + diskDrive.getName() + "." + fileName);
                memory.setPADWord(infoAddr + 2, file.getSectorCount());
                memory.setPADByte(infoAddr + 4, (file.getRecordType() << 7) | (file.getDataType() << 1) | file.getFileType());
                memory.setPADByte(infoAddr + 5, file.getFileType() === FileType.DATA ? Math.floor(256 / (file.getRecordLength() + (file.getRecordType() === RecordType.VARIABLE ? 1 : 0))) : 0);
                memory.setPADByte(infoAddr + 6, file.getEOFOffset());
                memory.setPADByte(infoAddr + 7, file.getFileType() === FileType.DATA ? file.getRecordLength() : 0);
                memory.setPADByte(infoAddr + 8, file.getFileType() === FileType.DATA ? (file.getRecordType() === RecordType.FIXED ? file.getRecordCount() : file.getSectorCount()) : 0);
            }
        }
    }

    createCatalogFile(diskImage: DiskImage | null): DiskFile {
        const catFile = new DiskFile("CATALOG", FileType.DATA, RecordType.FIXED, 38, DataType.INTERNAL);
        if (diskImage) {
            catFile.open(OperationMode.OUTPUT, AccessType.SEQUENTIAL);
            const data: number[] = [];
            let n = 0;
            n = this.writeAsString(data, n, diskImage.getName());
            n = this.writeAsFloat(data, n, 0);
            n = this.writeAsFloat(data, n, 1440); // Number of sectors on disk
            n = this.writeAsFloat(data, n, 1311); // Number of free sectors;
            catFile.putRecord(new FixedRecord(data, 38));
            const files = diskImage.getFiles();
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
        }
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

    getState(): any {
    }

    restoreState(state: any): void {
    }
}
