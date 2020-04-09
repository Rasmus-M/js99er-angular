import {AccessType, DataType, FileType, OperationMode, RecordType} from './disk';
import {State} from '../interfaces/state';
import {Log} from '../../classes/log';
import {DiskFile, FixedRecord, VariableRecord} from './diskfile';

export class DiskImageEvent {

    type: string;
    name: string;
    diskImage: DiskImage;

    constructor(type: string, name: string) {
        this.type = type;
        this.name = name;
    }
}

export class DiskImage implements State {

    private name: string;
    private files: {[name: string]: DiskFile};
    private binaryImage: Uint8Array;
    private eventHandler: (object) => void;
    private log: Log;

    constructor(name: string, eventHandler: (event: DiskImageEvent) => void) {
        this.name = name;
        this.files = {};
        this.binaryImage = null;
        this.eventHandler = eventHandler;
        this.log = Log.getLog();
    }

    setEventHandler(eventHandler: (event: DiskImageEvent) => void) {
        this.eventHandler = eventHandler;
    }

    fireEvent(event: DiskImageEvent) {
        if (typeof(this.eventHandler) === "function") {
            event.diskImage = this;
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
        const filesArray: DiskFile[] = [];
        for (const fileName in this.files) {
            if (this.files.hasOwnProperty(fileName)) {
                filesArray.push(this.files[fileName]);
            }
        }
        return filesArray.sort((a, b) => a.getName().localeCompare(b.getName()));
    }

    putFile(file: DiskFile) {
        this.files[file.getName()] = file;
        this.setBinaryImage(null); // Invalidate binary image on write
        this.fireEvent(new DiskImageEvent("fileAdded", file.getName()));
    }

    getFile(fileName): DiskFile {
        return this.files[fileName];
    }

    deleteFile(fileName) {
        delete this.files[fileName];
        this.setBinaryImage(null); // Invalidate binary image on write
        this.fireEvent(new DiskImageEvent("fileDeleted", fileName));
    }

    loadTIFile(fileName: string, fileBuffer: Uint8Array, ignoreTIFileName: boolean): DiskFile {
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
        for (let i = 0; i < Math.min(str.length, padLen); i++) {
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
