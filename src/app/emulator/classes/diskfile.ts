import {AccessType, DataType, FileType, OperationMode, RecordType} from './disk';
import {State} from '../interfaces/state';
import {Util} from '../../classes/util';

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
