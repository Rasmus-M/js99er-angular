import * as gapi from 'gapi-client';
import {AccessType, DataType, Disk, DiskError, FileType, OpCode, OperationMode, RecordType} from './disk';
import {Log} from '../../classes/log';
import {TI994A} from './ti994a';
import {Memory} from './memory';
import {Util} from '../../classes/util';
import {DiskFile, FixedRecord, VariableRecord} from './diskfile';
import {DiskImage} from './diskimage';
import {DiskDrive} from './diskdrive';

export class GoogleDrive {

    static DSR_ROM = [
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

    static DSR_ROM_POWER_UP = 0x4032;
    static DSR_ROM_GDR1 = 0x4034;
    static DSR_ROM_GDR2 = 0x4038;
    static DSR_ROM_GDR3 = 0x403C;

    static DSR_HOOK_START = GoogleDrive.DSR_ROM_POWER_UP;
    static DSR_HOOK_END = GoogleDrive.DSR_ROM_GDR3;

    static CLIENT_ID = "101694421528-72cnh0nor5rvoj245fispof8hdaq47i4.apps.googleusercontent.com";
    static SCOPES = 'https://www.googleapis.com/auth/drive';
    static AUTHORIZED = false;

    private name: string;
    private path: string;
    private console: TI994A;
    private ram: Uint8Array;
    private folderId: string;
    private diskImage: DiskImage;
    private catalogFile: DiskFile;
    private log: Log = Log.getLog();

    static execute = function (pc: number, googleDrives: GoogleDrive[], memory: Memory, callback: (boolean) => void): boolean {
        let googleDrive = null;
        switch (pc) {
            case GoogleDrive.DSR_ROM_POWER_UP:
                GoogleDrive.powerUp(callback);
                // return false; // Continue
                return true; // Suspend CPU until callback
            case GoogleDrive.DSR_ROM_GDR1:
                googleDrive = googleDrives[0];
                break;
            case GoogleDrive.DSR_ROM_GDR2:
                googleDrive = googleDrives[1];
                break;
            case GoogleDrive.DSR_ROM_GDR3:
                googleDrive = googleDrives[2];
                break;
            default:
                return false; // Continue
        }
        if (googleDrive !== null) {
            const pabAddr = memory.getPADWord(0x8356) - 14;
            const opCode = googleDrive.ram[pabAddr];
            GoogleDrive.authorize(
                opCode !== OpCode.READ && opCode !== OpCode.WRITE,
                () => {
                    googleDrive.dsrRoutine(pabAddr, function (status, errorCode) {
                        googleDrive.log.info("Returned error code: " + errorCode + "\n");
                        googleDrive.ram[pabAddr + 1] = (googleDrive.ram[pabAddr + 1] | (errorCode << 5)) & 0xFF;
                        memory.setPADByte(0x837C, memory.getPADByte(0x837C) | status);
                        callback(true); // Resume CPU
                    });
                },
                () => {
                    googleDrive.log.info("Failed opcode: " + opCode);
                    googleDrive.ram[pabAddr + 1] = (googleDrive.ram[pabAddr + 1] | (DiskError.DEVICE_ERROR << 5)) & 0xFF;
                    memory.setPADByte(0x837C, memory.getPADByte(0x837C) | 0x20);
                    callback(false); // Resume CPU
                }
            );
            return true; // Suspend CPU until callback
        }
        return false; // Continue
    };

    static authorize = function (refresh: boolean, success: () => void, failure: () => void) {
       if (GoogleDrive.AUTHORIZED) {
            setTimeout(success);
        } else {
            Log.getLog().warn("Not signed in to Google");
            setTimeout(failure);
        }
    };

    static powerUp = function (callback: (boolean) => void) {
        const log = Log.getLog();
        log.info("Executing Google Drive DSR power-up routine.");
        gapi.load("client:auth2", function() {
            log.info("Google library loaded");
            gapi.client.init({
                clientId: GoogleDrive.CLIENT_ID,
                scope: GoogleDrive.SCOPES
            }).then(function () {
                log.info("Google client init OK");
                const authInstance = gapi.auth2.getAuthInstance();
                if (authInstance.isSignedIn.get()) {
                    log.info("Already signed in.");
                    GoogleDrive.AUTHORIZED = true;
                    callback(true);
                } else {
                    authInstance.signIn();
                    authInstance.isSignedIn.listen(function (isSignedIn) {
                        log.info("Signed in: " + isSignedIn);
                        GoogleDrive.AUTHORIZED = isSignedIn;
                        callback(isSignedIn);
                    });
                }
            });
        });
    };


    constructor(name: string, path: string, console: TI994A) {
        this.name = name;
        this.path = path;
        this.console = console;
    }

    reset() {
        this.ram = this.console.getVDP().getRAM();
        this.folderId = null;
        this.diskImage = new DiskImage(this.name, null);
        this.catalogFile = null;
    }

    getFolderId(callback: (id: string) => void) {
        const that = this;
        if (this.folderId !== null) {
            callback(this.folderId);
        } else {
            this.getOrCreateFolder(this.path.split("/"), "root", (id) => {
                that.folderId = id;
                callback(id);
            });
        }
   }

    dsrRoutine(pabAddr: number, callback: (statuc: number, error: DiskError) => void) {
        this.log.info("Executing DSR routine for " + this.name + ", PAB in " + Util.toHexWord(pabAddr) + ".");
        let i;
        const opCode = this.ram[pabAddr];
        const flagStatus = this.ram[pabAddr + 1];
        const dataBufferAddress = this.ram[pabAddr + 2] << 8 | this.ram[pabAddr + 3];
        let recordLength = this.ram[pabAddr + 4];
        const characterCount = this.ram[pabAddr + 5];
        const recordNumber = this.ram[pabAddr + 6] << 8 | this.ram[pabAddr + 7];
        const screenOffset = this.ram[pabAddr + 8];
        const fileNameLength = this.ram[pabAddr + 9];
        let fileName = "";
        for (i = 0; i < fileNameLength; i++) {
            fileName += String.fromCharCode(this.ram[pabAddr + 10 + i]);
        }
        const recordType = (flagStatus & 0x10) >> 4;
        const datatype = (flagStatus & 0x08) >> 3;
        const operationMode = (flagStatus & 0x06) >> 1;
        const accessType = flagStatus & 0x01;

        const that = this;

        this.log.debug(
            fileName + ": " +
            Disk.OPERATION_MODE_LABELS[operationMode] + ", " +
            Disk.ACCESS_TYPE_LABELS[accessType] + ", " +
            Disk.DATA_TYPE_LABELS[datatype] + ", " +
            Disk.RECORD_TYPE_LABELS[recordType] + ", " +
            recordLength
        );

        this.getFolderId((parent) => {
            if (parent !== null) {
                if (fileName.substr(0, that.name.length + 1) === that.name + ".") {
                    fileName = fileName.substr(that.name.length + 1);
                    let file, record;
                    switch (opCode) {
                        case OpCode.OPEN:
                            that.log.info("Op-code " + opCode + ": OPEN");
                            if (operationMode === OperationMode.OUTPUT) {
                                // Create a new file
                                if (recordLength === 0) {
                                    recordLength = 128;
                                    // Write default record length to PAB
                                    that.ram[pabAddr + 4] = recordLength;
                                }
                                file = new DiskFile(fileName, FileType.DATA, recordType, recordLength, datatype);
                                that.diskImage.putFile(file);
                                file.open(operationMode, accessType);
                                callback(0, 0);
                            } else {
                                if (fileName.length > 0) {
                                    // Open existing file
                                    that.findFile(fileName, parent, (id) => {
                                        if (id !== null) {
                                            that.getFileContent(id, (data) => {
                                                file = that.diskImage.loadTIFile(fileName, data, true);
                                                if (file !== null) {
                                                    if (file.getOperationMode() !== -1 || file.getFileType() === FileType.PROGRAM || file.getRecordType() !== recordType || file.getRecordLength() !== recordLength && recordLength !== 0) {
                                                        callback(0, DiskError.BAD_OPEN_ATTRIBUTE);
                                                        return;
                                                    }
                                                    if (recordLength === 0) {
                                                        recordLength = file.getRecordLength();
                                                        that.ram[pabAddr + 4] = recordLength;
                                                    }
                                                    file.open(operationMode, accessType);
                                                    callback(0, 0);
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
                                    that.getFileContents(parent, (files) => {
                                        file = that.createCatalogFile(files);
                                        that.catalogFile = file;
                                        if (recordLength === 0) {
                                            recordLength = 38;
                                            that.ram[pabAddr + 4] = recordLength;
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
                            that.log.info("Op-code " + opCode + ": CLOSE");
                            if (fileName.length > 0) {
                                file = that.diskImage.getFile(fileName);
                                if (file !== null) {
                                    if (file.getFileType() === FileType.DATA) {
                                        if (file.getOperationMode() === operationMode) {
                                            // Save file if it's a write
                                            if (file.getOperationMode() !== OperationMode.INPUT) {
                                                file.close();
                                                that.log.info("Saving to Google Drive");
                                                const fileData = that.diskImage.saveTIFile(fileName);
                                                if (fileData !== null) {
                                                    that.insertOrUpdateFile(fileName, parent, fileData, (file2) => {
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
                                that.catalogFile = null;
                                callback(0, 0);
                            }
                            break;
                        case OpCode.READ:
                            that.log.info("Op-code " + opCode + ": READ");
                            if (fileName.length > 0) {
                                file = that.diskImage.getFile(fileName);
                            } else {
                                // Catalog
                                file = that.catalogFile;
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
                                                    for (i = 0; i < bytesToRead; i++) {
                                                        that.ram[dataBufferAddress + i] = recordData[i];
                                                    }
                                                    that.ram[pabAddr + 5] = bytesToRead;
                                                    that.ram[pabAddr + 6] = (file.getRecordPointer() & 0xFF00) >> 8;
                                                    that.ram[pabAddr + 7] = file.getRecordPointer() & 0x00FF;
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
                                        that.log.info("EOF - closing file.");
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
                            that.log.info("Op-code " + opCode + ": WRITE");
                            file = that.diskImage.getFile(fileName);
                            if (file !== null) {
                                if (file.getFileType() === FileType.DATA) {
                                    if (file.getOperationMode() === operationMode) {
                                        if (file.getAccessType() === AccessType.RELATIVE) {
                                            file.setRecordPointer(recordNumber);
                                        }
                                        const bytesToWrite = recordType === RecordType.FIXED ? recordLength : characterCount;
                                        const writeBuffer = [];
                                        for (i = 0; i < bytesToWrite; i++) {
                                            writeBuffer[i] = that.ram[dataBufferAddress + i];
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
                                        that.ram[pabAddr + 6] = (file.getRecordPointer() & 0xFF00) >> 8;
                                        that.ram[pabAddr + 7] = file.getRecordPointer() & 0x00FF;
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
                            that.log.info("Op-code " + opCode + ": REWIND");
                            file = that.diskImage.getFile(fileName);
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
                            that.log.info("Op-code " + opCode + ": LOAD");
                            that.findFile(fileName, parent, (id) => {
                                if (id !== null) {
                                    that.getFileContent(id, (data) => {
                                        file = that.diskImage.loadTIFile(fileName, data, true);
                                        if (file !== null && file.getFileType() === FileType.PROGRAM) {
                                            const loadBuffer = file.getProgram();
                                            for (i = 0; i < Math.min(recordNumber, loadBuffer.length); i++) {
                                                that.ram[dataBufferAddress + i] = loadBuffer[i];
                                            }
                                            callback(0, 0);
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
                            that.log.info("Op-code " + opCode + ": SAVE");
                            const programBuffer = new Uint8Array(recordNumber);
                            for (i = 0; i < recordNumber; i++) {
                                programBuffer[i] = that.ram[dataBufferAddress + i];
                            }
                            file = new DiskFile(fileName, FileType.PROGRAM, 0, 0, 0);
                            file.setProgram(programBuffer);
                            that.diskImage.putFile(file);
                            const saveBuffer = that.diskImage.saveTIFile(fileName);
                            if (saveBuffer !== null) {
                                that.insertOrUpdateFile(fileName, parent, saveBuffer, (file2) => {
                                    callback(0, 0);
                                });
                            } else {
                                callback(0, DiskError.FILE_ERROR);
                            }
                            break;
                        case OpCode.DELETE:
                            that.log.info("Op-code " + opCode + ": DELETE");
                            callback(0, DiskError.ILLEGAL_OPERATION);
                            break;
                        case OpCode.SCRATCH:
                            that.log.info("Op-code " + opCode + ": SCRATCH");
                            callback(0, DiskError.ILLEGAL_OPERATION);
                            break;
                        case OpCode.STATUS:
                            that.log.info("Op-code " + opCode + ": STATUS");
                            let fileStatus = 0;
                            file = that.diskImage.getFile(fileName);
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
                            that.ram[pabAddr + 8] = fileStatus;
                            callback(0, 0);
                            break;
                        default:
                            that.log.warn("Unknown DSR op-code: " + opCode);
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

    createCatalogFile(files: any[]): DiskFile {
        const catFile = new DiskFile("CATALOG", FileType.DATA, RecordType.FIXED, 38, DataType.INTERNAL);
        catFile.open(OperationMode.OUTPUT, AccessType.SEQUENTIAL);
        const data = [];
        let n = 0;
        n = this.writeAsString(data, n, this.diskImage.getName());
        n = this.writeAsFloat(data, n, 0);
        n = this.writeAsFloat(data, n, 1440); // Number of sectors on disk
        n = this.writeAsFloat(data, n, 1311); // Number of free sectors;
        catFile.putRecord(new FixedRecord(data, 38));
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i].name;
            const file = this.diskImage.loadTIFile(fileName, files[i].data, true);
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

    writeAsString(data, n, str) {
        data[n++] = str.length;
        for (let i = 0; i < str.length; i++) {
            data[n++] = str.charCodeAt(i);
        }
        return n;
   }

    // Translated from Classic99
    writeAsFloat(data, n, val) {
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

    getFiles(parent, callback) {
        const request = gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'GET',
            'params': {'q': "mimeType != 'application/vnd.google-apps.folder' and '" + parent + "' in parents and trashed = false"}
        });
        request.execute((result) => {
            callback(result.items);
        });
   }

    findFile(fileName, parent, callback) {
        const request = gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'GET',
            'params': {'q': "mimeType != 'application/vnd.google-apps.folder' and title = '" + fileName + "' and '" + parent + "' in parents and trashed = false"}
        });

        request.execute((result) => {
            const items = result.items;
            const id = items && items.length > 0 ? items[0].id : null;
            this.log.info("findFile '" + fileName + "': " + id);
            callback(id);
        });
   }

    getFile(fileId, callback) {
        const request = gapi.client.request({
            'path': '/drive/v2/files/' + fileId,
            'method': 'GET'
        });
        request.execute(callback);
   }

    getFileContents(parent, callback) {
        const that = this;
        const files = [];
        this.getFiles(parent, (items) => {
            _getFileContents(items, () => {
                callback(files);
            });
        });
        function _getFileContents(items, callback2) {
            if (items.length) {
                const item = items.shift();
                that.getFileContent(item.id, (data) => {
                    files.push({id: item.id, name: item.title, data: data});
                    _getFileContents(items, callback2);
                });
            } else {
                callback2();
            }
        }
   }

    getFileContent(fileId, callback) {
        this.getFile(fileId, (file) => {
            if (file.downloadUrl) {
                this.log.info("getFileContent: " + file.title);
                const accessToken = gapi.auth.getToken().access_token;
                const xhr = new XMLHttpRequest();
                // See https://stackoverflow.com/questions/68016649/google-drive-api-download-file-gives-lockeddomaincreationfailure-error
                xhr.open('GET', file.downloadUrl.replace('content.googleapis.com', 'www.googleapis.com'));
                xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                xhr.responseType = "arraybuffer";
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        callback(new Uint8Array(xhr.response));
                    }
                };
                xhr.onerror = () => {
                    callback(null);
                };
                xhr.send();
            } else {
                callback(null);
            }
        });
   }

    insertOrUpdateFile(fileName, parent, fileData, callback) {
        this.findFile(fileName, parent, (fileId) => {
            if (fileId === null) {
                this.insertFile(fileName, parent, fileData, callback);
            } else {
                this.updateFile(fileId, fileData, callback);
            }
        });
   }

    insertFile(fileName, parent, fileData, callback) {
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const reader = new FileReader();
        reader.readAsBinaryString(new Blob([fileData]));
        reader.onload = (e) => {
            const contentType = "application/octet-stream";
            const metadata = {
                'title': fileName,
                'mimeType': contentType,
                'parents': [{'id': parent}]
            };

            const base64Data = btoa(reader.result as string);
            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                base64Data +
                close_delim;

            const request = gapi.client.request({
                'path': '/upload/drive/v2/files',
                'method': 'POST',
                'params': {'uploadType': 'multipart'},
                'headers': {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody});

            request.execute(callback);
        };
   }

    updateFile(fileId, fileData, callback) {
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const reader = new FileReader();
        reader.readAsBinaryString(new Blob([fileData]));
        reader.onload = (e) => {
            this.getFile(fileId, (metadata) => {
                const contentType = "application/octet-stream";
                const base64Data = btoa(reader.result as string);
                const multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: ' + contentType + '\r\n' +
                    'Content-Transfer-Encoding: base64\r\n' +
                    '\r\n' +
                    base64Data +
                    close_delim;

                const request = gapi.client.request({
                    'path': '/upload/drive/v2/files/' + fileId,
                    'method': 'PUT',
                    'params': {'uploadType': 'multipart', 'alt': 'json'},
                    'headers': {
                        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                    },
                    'body': multipartRequestBody});

                request.execute(callback);
            });
        };
   }

    getOrCreateFolder(path, parent, callback) {
        if (path.length > 0) {
            this.getFolder(path[0], parent, (id) => {
                if (id === null) {
                    this.createFolder(path[0], parent, (id2) => {
                        this.getOrCreateFolder(path.splice(1), id2, callback);
                    });
                } else {
                    this.getOrCreateFolder(path.splice(1), id, callback);
                }
            });
        } else {
            callback(parent);
        }
   }

    createFolder(folderName, parent, callback) {
        const metadata = {
            'title': folderName,
            'parents': [{'id': parent}],
            'mimeType': 'application/vnd.google-apps.folder'
        };

        const request = gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'POST',
            'body': JSON.stringify(metadata)
        });

        request.execute((result) => {
            const id = result.id;
            this.log.info("createFolder '" + folderName + "': " + id);
            callback(id);
        });
   }

    getFolder(folderName, parent, callback) {
        const request = gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'GET',
            'params': {'q': "mimeType = 'application/vnd.google-apps.folder' and title = '" + folderName + "' and '" + parent + "' in parents and trashed = false"}
        });

        request.execute((result) => {
            const items = result.items;
            const id = items.length > 0 ? items[0].id : null;
            this.log.info("getFolder '" + folderName + "': " + id);
            callback(id);
        });
   }
}
