import {Memory} from "./memory";
import {AccessType, DataType, Disk, DiskError, FileType, OpCode, OperationMode, RecordType, STATUS_EOF, STATUS_INTERNAL, STATUS_NO_SUCH_FILE, STATUS_PROGRAM, STATUS_VARIABLE} from "./disk";
import {Log} from "../../classes/log";
import gapi from "gapi-client";
import {GFile, GoogleDrive} from "./google-drive";
import {Console} from "../interfaces/console";
import {Util} from "../../classes/util";
import {DiskFile, FixedRecord, VariableRecord} from "./disk-file";
import {Stateful} from "../interfaces/stateful";
import {FDC} from "../interfaces/fdc";

export const GOOGLE_DRIVE_FDC_DSR_ROM = [
    0xAA,                           // >4000 Standard header
    0x01,                           // >4001 Version
    0x00,                           // >4002 No programs allowed in peripheral card ROMs
    0x00,                           // >4003 Not used
    0x40, 0x10,                     // >4004 Pointer to power-up list
    0x00, 0x00,                     // >4006 Pointer to program list
    0x40, 0x14,                     // >4008 Pointer to DSR list
    0x00, 0x00,                     // >400A Pointer to subprogram list
    0x00, 0x00,                     // >400C Pointer to ISR list
    0x00, 0x00,                     // >400E Pointer to ?
    // Power-up list
    0x00, 0x00,                     // >4010 Link to next power-up routine (no more)
    0x40, 0x32,                     // >4012 Address of this power-up routine
    // DSR list
    0x40, 0x1E,                     // >4014 Link to next DSR
    0x40, 0x34,                     // >4016 Address of this DSR
    0x04,                           // >4018 Name length
    0x47, 0x44, 0x52, 0x31,         // >4019 Name "GDR1"
    0x00,                           // >401D Align to word
    0x40, 0x28,                     // >401E Link to next DSR
    0x40, 0x38,                     // >4020 Address of this DSR
    0x04,                           // >4022 Name length
    0x47, 0x44, 0x52, 0x32,         // >4023 Name "GDR2"
    0x00,                           // >4027 Align to word
    0x00, 0x00,                     // >4028 Link to next DSR (no more)
    0x40, 0x3C,                     // >402A Address of this DSR
    0x04,                           // >402C Name length
    0x47, 0x44, 0x52, 0x33,         // >402D Name "GDR3"
    0x00,                           // >4031 Align to word
    // Power-up routine
    0x04, 0x5B,                     // >4032 B *R11
    // GDR1 routine
    0x05, 0xCB,                     // >4034 INCT R11
    0x04, 0x5B,                     // >4036 B *R11
    // GDR2 routine
    0x05, 0xCB,                     // >4038 INCT R11
    0x04, 0x5B,                     // >403A B *R11
    // GDR3 routine
    0x05, 0xCB,                     // >403C INCT R11
    0x04, 0x5B                      // >403E B *R11
];

export class GoogleDriveFdc implements FDC {

    static DSR_ROM_POWER_UP = 0x4032;
    static DSR_ROM_GDR1 = 0x4034;
    static DSR_ROM_GDR2 = 0x4038;
    static DSR_ROM_GDR3 = 0x403C;

    static DSR_HOOK_START = GoogleDriveFdc.DSR_ROM_POWER_UP;
    static DSR_HOOK_END = GoogleDriveFdc.DSR_ROM_GDR3;

    static CLIENT_ID = "101694421528-72cnh0nor5rvoj245fispof8hdaq47i4.apps.googleusercontent.com";
    static SCOPES = 'https://www.googleapis.com/auth/drive';

    private memory: Memory;
    private ram: Uint8Array;
    private authorized = false;
    private catalogFile: DiskFile | null;
    private log = Log.getLog();

    constructor(
        private console: Console,
        private googleDrives: GoogleDrive[]
    ) {
        this.memory = console.getMemory();
        this.init();
    }

    init() {
        this.console.getCPU().instructionExecuting().subscribe((pc) => {
            if (this.memory.isGoogleDriveROMEnabled() && pc >= GoogleDriveFdc.DSR_HOOK_START && pc <= GoogleDriveFdc.DSR_HOOK_END) {
                this.executeHooks(pc);
            }
        });
    }

    reset(): void {
    }

    private executeHooks(pc: number): boolean {
        this.ram = this.console.getVDP().getRAM();
        let googleDrive: GoogleDrive | null = null;
        switch (pc) {
            case GoogleDriveFdc.DSR_ROM_POWER_UP:
                this.powerUp((result) => {
                    this.console.getCPU().setSuspended(false);
                });
                // Suspend CPU until callback
                this.console.getCPU().setSuspended(true);
                return true;
            case GoogleDriveFdc.DSR_ROM_GDR1:
                googleDrive = this.googleDrives[0];
                break;
            case GoogleDriveFdc.DSR_ROM_GDR2:
                googleDrive = this.googleDrives[1];
                break;
            case GoogleDriveFdc.DSR_ROM_GDR3:
                googleDrive = this.googleDrives[2];
                break;
            default:
                return false;
        }
        if (googleDrive !== null) {
            const pabAddr = this.memory.getPADWord(0x8356) - 14;
            const opCode = this.ram[pabAddr];
            const fdc = this;
            if (this.authorized) {
                this.dsrRoutine(googleDrive, pabAddr, (status, errorCode) => {
                    fdc.log.info("Returned error code: " + errorCode + "\n");
                    fdc.ram[pabAddr + 1] = (this.ram[pabAddr + 1] | (errorCode << 5)) & 0xFF;
                    fdc.memory.setPADByte(0x837C, this.memory.getPADByte(0x837C) | status);
                    fdc.console.getCPU().setSuspended(false);
                });
                // Suspend CPU until callback
                fdc.console.getCPU().setSuspended(true);
                return true;
            } else {
                fdc.log.warn("Not signed in to Google");
                fdc.log.info("Failed opcode: " + opCode);
                fdc.ram[pabAddr + 1] = (this.ram[pabAddr + 1] | (DiskError.DEVICE_ERROR << 5)) & 0xFF;
                fdc.memory.setPADByte(0x837C, this.memory.getPADByte(0x837C) | 0x20);
            }
        }
        return false;
    }

    private powerUp(callback: (result: boolean) => void) {
        const log = this.log;
        log.info("Executing Google Drive DSR power-up routine");
        gapi.load("client:auth2", () => {
            log.info("Google library loaded");
            gapi.client.init({
                clientId: GoogleDriveFdc.CLIENT_ID,
                scope: GoogleDriveFdc.SCOPES
            }).then(() => {
                log.info("Google client initialized");
                const authInstance = gapi.auth2.getAuthInstance();
                if (authInstance.isSignedIn.get()) {
                    log.info("Already signed in");
                    this.authorized = true;
                    callback(true);
                } else {
                    authInstance.signIn();
                    authInstance.isSignedIn.listen((isSignedIn: boolean) => {
                        log.info("Signed in: " + isSignedIn);
                        this.authorized = isSignedIn;
                        callback(isSignedIn);
                    });
                }
            });
        });
    }

    private dsrRoutine(googleDrive: GoogleDrive, pabAddr: number, callback: (status: number, error: DiskError) => void) {
        this.log.info("Executing DSR routine for " + googleDrive.getName() + ", PAB in " + Util.toHexWord(pabAddr) + ".");
        const opCode = this.ram[pabAddr];
        const flagStatus = this.ram[pabAddr + 1];
        const dataBufferAddress = this.ram[pabAddr + 2] << 8 | this.ram[pabAddr + 3];
        let recordLength = this.ram[pabAddr + 4];
        const characterCount = this.ram[pabAddr + 5];
        const recordNumber = this.ram[pabAddr + 6] << 8 | this.ram[pabAddr + 7];
        const screenOffset = this.ram[pabAddr + 8];
        const fileNameLength = this.ram[pabAddr + 9];
        let fileName = "";
        for (let i = 0; i < fileNameLength; i++) {
            fileName += String.fromCharCode(this.ram[pabAddr + 10 + i]);
        }
        const recordType = (flagStatus & 0x10) >> 4;
        const datatype = (flagStatus & 0x08) >> 3;
        const operationMode = (flagStatus & 0x06) >> 1;
        const accessType = flagStatus & 0x01;

        const fdc = this;

        this.log.debug(
            fileName + ": " +
            Disk.OPERATION_MODE_LABELS[operationMode] + ", " +
            Disk.ACCESS_TYPE_LABELS[accessType] + ", " +
            Disk.DATA_TYPE_LABELS[datatype] + ", " +
            Disk.RECORD_TYPE_LABELS[recordType] + ", " +
            recordLength
        );

        const diskImage = googleDrive.getDiskImage();

        googleDrive.getFolderId((parent) => {
            if (parent !== null) {
                const googleDriveName = googleDrive.getName();
                if (fileName.substring(0, googleDriveName.length + 1) === googleDriveName + ".") {
                    fileName = fileName.substring(googleDriveName.length + 1);
                    let file, record;
                    switch (opCode) {
                        case OpCode.OPEN:
                            fdc.log.info("Op-code " + opCode + ": OPEN");
                            if (operationMode === OperationMode.OUTPUT) {
                                // Create a new file
                                if (recordLength === 0) {
                                    recordLength = 128;
                                    // Write default record length to PAB
                                    fdc.ram[pabAddr + 4] = recordLength;
                                }
                                file = new DiskFile(fileName, FileType.DATA, recordType, recordLength, datatype);
                                diskImage.putFile(file);
                                file.open(operationMode, accessType);
                                callback(0, 0);
                            } else {
                                if (fileName.length > 0) {
                                    // Open existing file
                                    googleDrive.findFile(fileName, parent, (id) => {
                                        if (id !== null) {
                                            googleDrive.getFileContent(id, (data) => {
                                                if (data) {
                                                    file = diskImage.loadTIFile(fileName, data, true);
                                                    if (file !== null) {
                                                        if (file.getOperationMode() !== -1 || file.getFileType() === FileType.PROGRAM || file.getRecordType() !== recordType || file.getRecordLength() !== recordLength && recordLength !== 0) {
                                                            callback(0, DiskError.BAD_OPEN_ATTRIBUTE);
                                                            return;
                                                        }
                                                        if (recordLength === 0) {
                                                            recordLength = file.getRecordLength();
                                                            fdc.ram[pabAddr + 4] = recordLength;
                                                        }
                                                        file.open(operationMode, accessType);
                                                        callback(0, 0);
                                                    } else {
                                                        callback(0, DiskError.FILE_ERROR);
                                                    }
                                                } else {
                                                    callback(0, DiskError.FILE_ERROR);
                                                }
                                            });
                                        } else {
                                            callback(0, DiskError.FILE_ERROR);
                                        }
                                    });
                                } else if (operationMode === OperationMode.INPUT) {
                                    // Catalog
                                    googleDrive.getFileContents(parent, (files) => {
                                        file = fdc.createCatalogFile(googleDrive, files);
                                        fdc.catalogFile = file;
                                        if (recordLength === 0) {
                                            recordLength = 38;
                                            fdc.ram[pabAddr + 4] = recordLength;
                                        }
                                        file.open(operationMode, accessType);
                                        callback(0, 0);
                                    });
                                } else {
                                    callback(0, DiskError.ILLEGAL_OPERATION);
                                }
                            }
                            break;
                        case OpCode.CLOSE:
                            fdc.log.info("Op-code " + opCode + ": CLOSE");
                            if (fileName.length > 0) {
                                file = diskImage.getFile(fileName);
                                if (file !== null) {
                                    if (file.getFileType() === FileType.DATA) {
                                        if (file.getOperationMode() === operationMode) {
                                            // Save file if it's a write
                                            if (file.getOperationMode() !== OperationMode.INPUT) {
                                                file.close();
                                                fdc.log.info("Saving to Google Drive");
                                                const fileData = diskImage.createTIFile(fileName);
                                                if (fileData !== null) {
                                                    googleDrive.insertOrUpdateFile(fileName, parent, fileData, () => {
                                                        callback(0, 0);
                                                    });
                                                } else {
                                                    callback(0, DiskError.FILE_ERROR);
                                                }
                                            } else {
                                                file.close();
                                                callback(0, 0);
                                            }
                                        } else {
                                            callback(0, DiskError.ILLEGAL_OPERATION);
                                        }
                                    } else {
                                        callback(0, DiskError.FILE_ERROR);
                                    }
                                } else {
                                    callback(0, DiskError.FILE_ERROR);
                                }
                            } else {
                                fdc.catalogFile = null;
                                callback(0, 0);
                            }
                            break;
                        case OpCode.READ:
                            fdc.log.info("Op-code " + opCode + ": READ");
                            if (fileName.length > 0) {
                                file = diskImage.getFile(fileName);
                            } else {
                                // Catalog
                                file = fdc.catalogFile;
                            }
                            if (file !== null) {
                                if (file.getFileType() === FileType.DATA) {
                                    if (file.getAccessType() === AccessType.RELATIVE && fileName.length > 0) {
                                        file.setRecordPointer(recordNumber);
                                    }
                                    record = file.getRecord();
                                    if (record !== null) {
                                        if (file.getOperationMode() === operationMode) {
                                            switch (file.getOperationMode()) {
                                                case OperationMode.UPDATE:
                                                case OperationMode.INPUT:
                                                    const recordData = record.getData();
                                                    const bytesToRead = Math.min(recordData.length, recordLength);
                                                    for (let i = 0; i < bytesToRead; i++) {
                                                        fdc.ram[dataBufferAddress + i] = recordData[i];
                                                    }
                                                    fdc.ram[pabAddr + 5] = bytesToRead;
                                                    fdc.ram[pabAddr + 6] = (file.getRecordPointer() & 0xFF00) >> 8;
                                                    fdc.ram[pabAddr + 7] = file.getRecordPointer() & 0x00FF;
                                                    callback(0, 0);
                                                    break;
                                                case OperationMode.OUTPUT:
                                                case OperationMode.APPEND:
                                                    callback(0, DiskError.ILLEGAL_OPERATION);
                                                    break;
                                            }
                                        } else {
                                            callback(0, DiskError.ILLEGAL_OPERATION);
                                        }
                                    } else {
                                        fdc.log.info("EOF - closing file.");
                                        file.close();
                                        callback(0, DiskError.READ_PAST_END);
                                    }
                                } else {
                                    callback(0, DiskError.FILE_ERROR);
                                }
                            } else {
                                callback(0, DiskError.FILE_ERROR);
                            }
                            break;
                        case OpCode.WRITE:
                            fdc.log.info("Op-code " + opCode + ": WRITE");
                            file = diskImage.getFile(fileName);
                            if (file !== null) {
                                if (file.getFileType() === FileType.DATA) {
                                    if (file.getOperationMode() === operationMode) {
                                        if (file.getAccessType() === AccessType.RELATIVE) {
                                            file.setRecordPointer(recordNumber);
                                        }
                                        const bytesToWrite = recordType === RecordType.FIXED ? recordLength : characterCount;
                                        const writeBuffer = [];
                                        for (let i = 0; i < bytesToWrite; i++) {
                                            writeBuffer[i] = fdc.ram[dataBufferAddress + i];
                                        }
                                        if (recordType === RecordType.FIXED) {
                                            record = new FixedRecord(writeBuffer, recordLength);
                                        } else {
                                            record = new VariableRecord(writeBuffer);
                                        }
                                        switch (file.getOperationMode()) {
                                            case OperationMode.UPDATE:
                                                file.putRecord(record);
                                                callback(0, 0);
                                                break;
                                            case OperationMode.OUTPUT:
                                            case OperationMode.APPEND:
                                                if (file.isEOF()) {
                                                    file.putRecord(record);
                                                    callback(0, 0);
                                                } else {
                                                    callback(0, DiskError.ILLEGAL_OPERATION);
                                                }
                                                break;
                                            case OperationMode.INPUT:
                                                callback(0, DiskError.ILLEGAL_OPERATION);
                                                break;
                                        }
                                        fdc.ram[pabAddr + 6] = (file.getRecordPointer() & 0xFF00) >> 8;
                                        fdc.ram[pabAddr + 7] = file.getRecordPointer() & 0x00FF;
                                    } else {
                                        callback(0, DiskError.ILLEGAL_OPERATION);
                                    }
                                } else {
                                    callback(0, DiskError.FILE_ERROR);
                                }
                            } else {
                                callback(0, DiskError.FILE_ERROR);
                            }
                            break;
                        case OpCode.REWIND:
                            fdc.log.info("Op-code " + opCode + ": REWIND");
                            file = diskImage.getFile(fileName);
                            if (file !== null) {
                                if (file.getOperationMode() === operationMode) {
                                    if (file.getFileType() !== FileType.PROGRAM) {
                                        file.rewind();
                                        callback(0, 0);
                                    } else {
                                        callback(0, DiskError.FILE_ERROR);
                                    }
                                } else {
                                    callback(0, DiskError.ILLEGAL_OPERATION);
                                }
                            } else {
                                callback(0, DiskError.FILE_ERROR);
                            }
                            break;
                        case OpCode.LOAD:
                            fdc.log.info("Op-code " + opCode + ": LOAD");
                            googleDrive.findFile(fileName, parent, (id) => {
                                if (id !== null) {
                                    googleDrive.getFileContent(id, (data) => {
                                        if (data) {
                                            file = diskImage.loadTIFile(fileName, data, true);
                                            if (file !== null && file.getFileType() === FileType.PROGRAM) {
                                                const loadBuffer = file.getProgram();
                                                if (loadBuffer) {
                                                    for (let i = 0; i < Math.min(recordNumber, loadBuffer.length); i++) {
                                                        fdc.ram[dataBufferAddress + i] = loadBuffer[i];
                                                    }
                                                }
                                                callback(0, 0);
                                            } else {
                                                callback(0, DiskError.FILE_ERROR);
                                            }
                                        } else {
                                            callback(0, DiskError.FILE_ERROR);
                                        }
                                    });
                                } else {
                                    callback(0, DiskError.FILE_ERROR);
                                }
                            });
                            break;
                        case OpCode.SAVE:
                            fdc.log.info("Op-code " + opCode + ": SAVE");
                            const programBuffer = new Uint8Array(recordNumber);
                            for (let i = 0; i < recordNumber; i++) {
                                programBuffer[i] = fdc.ram[dataBufferAddress + i];
                            }
                            file = new DiskFile(fileName, FileType.PROGRAM, 0, 0, 0);
                            file.setProgram(programBuffer);
                            diskImage.putFile(file);
                            const saveBuffer = diskImage.createTIFile(fileName);
                            if (saveBuffer !== null) {
                                googleDrive.insertOrUpdateFile(fileName, parent, saveBuffer, (file2) => {
                                    callback(0, 0);
                                });
                            } else {
                                callback(0, DiskError.FILE_ERROR);
                            }
                            break;
                        case OpCode.DELETE:
                            fdc.log.info("Op-code " + opCode + ": DELETE");
                            callback(0, DiskError.ILLEGAL_OPERATION);
                            break;
                        case OpCode.SCRATCH:
                            fdc.log.info("Op-code " + opCode + ": SCRATCH");
                            callback(0, DiskError.ILLEGAL_OPERATION);
                            break;
                        case OpCode.STATUS:
                            fdc.log.info("Op-code " + opCode + ": STATUS");
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
                            fdc.ram[pabAddr + 8] = fileStatus;
                            callback(0, 0);
                            break;
                        default:
                            fdc.log.warn("Unknown DSR op-code: " + opCode);
                            callback(0, DiskError.ILLEGAL_OPERATION);
                    }
                } else {
                    callback(0x20, DiskError.DEVICE_ERROR);
                }
            } else {
                callback(0x20, DiskError.DEVICE_ERROR);
            }
        });
    }

    createCatalogFile(googleDrive: GoogleDrive, files: GFile[]): DiskFile {
        const catFile = new DiskFile("CATALOG", FileType.DATA, RecordType.FIXED, 38, DataType.INTERNAL);
        catFile.open(OperationMode.OUTPUT, AccessType.SEQUENTIAL);
        const data: number[] = [];
        let n = 0;
        n = this.writeAsString(data, n, googleDrive.getDiskImage().getName());
        n = this.writeAsFloat(data, n, 0);
        n = this.writeAsFloat(data, n, 1440); // Number of sectors on disk
        n = this.writeAsFloat(data, n, 1311); // Number of free sectors;
        catFile.putRecord(new FixedRecord(data, 38));
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i].name;
            const file = googleDrive.getDiskImage().loadTIFile(fileName, files[i].data, true);
            if (file) {
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

    writeAsString(data: number[], n: number, str: string) {
        data[n++] = str.length;
        for (let i = 0; i < str.length; i++) {
            data[n++] = str.charCodeAt(i);
        }
        return n;
    }

    // Translated from Classic99
    writeAsFloat(data: number[], n: number, val: number) {
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
}
