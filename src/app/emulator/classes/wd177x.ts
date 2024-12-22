import {Log} from "../../classes/log";
import {DiskDrive} from "./disk-drive";
import {Util} from "../../classes/util";

export class WD177x {

    private command = 0;
    private drive = 0;
    private side = 0;
    private track = 0;
    private sector = 0;
    private direction = 1;
    private data = 0;
    private readyForData = true;
    private busy = false;
    private headLoadRequested = false;
    private headLoaded = false;
    private readBuffer: number[] = [];
    private writeBuffer: number[] = [];
    private log = Log.getLog();

    constructor(
        private diskDrives: DiskDrive[]) {
    }

    public reset() {
        this.command = 0;
        this.drive = 0;
        this.side = 0;
        this.track = 0;
        this.sector = 0;
        this.direction = 1;
        this.data = 0;
        this.busy = false;
        this.headLoadRequested = false;
        this.headLoaded = false;
        this.readBuffer = [];
        this.writeBuffer = [];
    }

    public getDrive() {
        this.log.debug("Get drive: " + this.drive);
        return this.drive;
    }

    public setDrive(drive: number, enabled: boolean) {
        if (enabled) {
            this.log.debug("Select drive: " + drive);
            this.drive = drive;
        } else if (this.drive === drive) {
            this.drive = 0;
        }
    }

    public getSide() {
        this.log.debug("Get side: " + Util.toHexByte(this.side));
        return this.side;
    }

    public setSide(side: number) {
        this.log.debug("Set side " + Util.toHexByte(side));
        this.side = side;
    }

    public getTrack() {
        this.log.debug("Get track: " + Util.toHexByte(this.track));
        return this.track;
    }

    public setTrack(track: number) {
        this.log.debug("Set track: " + Util.toHexByte(track));
        this.track = track;
    }

    public getSector() {
        this.log.debug("Get sector: " + Util.toHexByte(this.sector));
        return this.sector;
    }

    public setSector(sector: number) {
        this.log.debug("Set sector: " + Util.toHexByte(sector));
        this.sector = sector;
    }

    public getData() {
        // this.log.debug("Get data: " + Util.toHexByte(this.data));
        const byte = this.data;
        if (this.readBuffer.length > 0) {
            this.readByteFromBuffer();
            this.readyForData = true;
        } else {
            this.readyForData = false;
        }
        return byte;
    }

    public setData(data: number) {
        this.log.debug("Set data " + Util.toHexByte(data));
        this.data = data;
        this.writeByteToBuffer(data);
    }

    /*
        Command	        >80	>40	>20	>10	>08	>04	>02  >01
        Restore	        0	0	0	0	h	V	r1	 r0
        Seek	        0	0	0	1	h	V	r1	 r0
        Step	        0	0	1	T	h	V	r1	 r0
        Step-in	        0	1	0	T	h	V	r1	 r0
        Step-out	    0	1	1	T	h	V	r1	 r0
        Read sector	    1	0	0	m	S	E	C/0  0
        Write sector	1	0	1	m	S	E	C/a1 a0
        Read ID	        1	1	0	0	0	E'	0	 0
        Read track	    1	1	1	0	0	E'	0	 s*
        Write track	    1	1	1	1	0	E'	0	 0
        Force interrupt	1	1	0	1	I3	I2	I1 	 I0
     */

    public setCommand(command: number) {
        // this.log.debug("Command: " + Util.toHexByte(command));
        this.command = command;
        const flag = (command & 0x10) !== 0;
        const flags = command & 0x0f;
        switch (command & 0xf0) {
            case 0x00:
                this.restore(flags);
                break;
            case 0x10:
                this.seek(flags);
                break;
            case 0x20:
            case 0x30:
                this.step(flag, flags);
                break;
            case 0x40:
            case 0x50:
                this.stepIn(flag, flags);
                break;
            case 0x60:
            case 0x70:
                this.stepOut(flag, flags);
                break;
            case 0x80:
            case 0x90:
                this.readSector(flag, flags);
                break;
            case 0xa0:
            case 0xb0:
                this.writeSector(flag, flags);
                break;
            case 0xc0:
                this.readId(flags);
                break;
            case 0xd0:
                this.forceInterrupt(flags);
                break;
            case 0xe0:
                this.readTrack(flags);
                break;
            case 0xf0:
                this.writeTrack(flags);
                break;
        }
    }

    private restore(flags: number) {
        this.log.info("Cmd: Restore");
        this.track = 0;
        if (flags & 0x08) {
            this.loadHead();
        }
        this.busy = true;
    }

    private seek(flags: number) {
        this.log.info("Cmd: Seek track " + Util.toHexByte(this.data));
        this.track = this.data;
        if (flags & 0x08) {
            this.loadHead();
        }
        this.busy = true;
    }

    private step(updateTrackRegister: boolean, flags: number) {
        this.log.info("Cmd: Step: " + updateTrackRegister);
        if (updateTrackRegister) {
            if (this.direction > 0) {
                this.track = Math.min(this.track + 1, 255);
            } else {
                this.track = Math.max(this.track - 1, 0);
            }
        }
        if (flags & 0x08) {
            this.loadHead();
        }
        this.busy = true;
    }

    private stepIn(updateTrackRegister: boolean, flags: number) {
        this.log.info("Cmd: Step in: " + updateTrackRegister);
        this.direction = 1;
        this.step(updateTrackRegister, flags);
    }

    private stepOut(updateTrackRegister: boolean, flags: number) {
        this.log.info("Cmd: Step out: " + updateTrackRegister);
        this.direction = -1;
        this.step(updateTrackRegister, flags);
    }

    private readSector(multiple: boolean, flags: number) {
        this.log.info("Cmd: Read sector " +
            "(sector " + Util.toHexByte(this.sector) +
            ", track " + Util.toHexByte(this.track) +
            ", side " + Util.toHexByte(this.side) + ")" +
            (multiple ? " multiple" : "")
        );
        this.readSectorIntoBuffer();
        this.readByteFromBuffer();
        this.loadHead();
    }

    private writeSector(multiple: boolean, flags: number) {
        this.log.info("Cmd: Write sector " +
            "(sector " + Util.toHexByte(this.sector) +
            ", track " + Util.toHexByte(this.track) +
            ", side " + Util.toHexByte(this.side) + ")" +
            (multiple ? " multiple" : "")
        );
        this.writeBuffer = [];
    }

    private readId(flags: number) {
        this.log.debug("Cmd: Read ID");
        this.readBuffer.push(this.track);
        this.readBuffer.push(this.side);
        this.readBuffer.push(this.sector);
        this.readBuffer.push(0x01);
        this.readBuffer.push(0x00);
        this.readBuffer.push(0x00);
        this.readByteFromBuffer();
        this.loadHead();
        this.busy = true;
    }

    private forceInterrupt(flags: number) {
        this.log.debug("Cmd: Force interrupt");
        this.busy = false;
    }

    private readTrack(flags: number) {
        this.log.info("Cmd: Read track (not implemented)");
    }

    private writeTrack(flags: number) {
        this.log.info("Cmd: Write track (not implemented)");
    }

    public getStatus() {
        const track0 = this.track === 0 && ((this.command & 0x80) === 0 || (this.command & 0xf0) === 0xd0);
        this.log.debug("Read status: " +
            (this.headLoaded ? "head loaded, " : "") +
            (track0 ? "track 0, " : "") +
            (this.busy ? "busy" : "not busy")
        );
        let status = 0;
        if (this.headLoaded) {
            status |= 0x20;
        }
        if (track0) {
            status |= 0x04;
        }
        if (this.busy) {
            status |= 0x01;
        }
        this.busy = false;
        return status;
    }

    public loadHead() {
        this.headLoadRequested = true;
        this.headLoaded = true;
    }

    public isHeadLoadRequested() {
        return this.headLoadRequested;
    }

    public isBusy() {
        const value = this.busy;
        this.busy = false;
        return value;
    }

    public isReadyForData() {
        const value = this.readyForData;
        this.readyForData = true;
        return value;
    }

    private readSectorIntoBuffer() {
        const diskImage = this.diskDrives[this.drive - 1].getDiskImage();
        if (diskImage) {
            const sectorIndex = diskImage.getSectorIndex(this.side, this.track, this.sector);
            const sectorBytes = diskImage.readSector(sectorIndex);
            for (const byte of sectorBytes) {
                this.readBuffer.push(byte);
            }
        }
    }

    private readByteFromBuffer() {
        this.data = this.readBuffer.shift() || 0x00;
        if (this.readBuffer.length === 0 && (this.command & 0xf0) === 0x90) {
            // Read sector multiple
            this.sector++;
            this.readSectorIntoBuffer();
        }
    }

    private writeBufferToSector() {
        const diskImage = this.diskDrives[this.drive - 1].getDiskImage();
        if (diskImage) {
            const sectorIndex = diskImage.getSectorIndex(this.side, this.track, this.sector);
            diskImage.writeSector(sectorIndex, new Uint8Array(this.writeBuffer));
        }
    }

    private writeByteToBuffer(data: number) {
        this.writeBuffer.push(data);
        if (this.writeBuffer.length === 256) {
            this.writeBufferToSector();
            this.writeBuffer = [];
            if (this.command === 0xb0) {
                this.sector++;
            }
        }
    }

    getState(): any {
        return {
            command: this.command,
            drive: this.drive,
            side: this.side,
            track: this.track,
            sector: this.sector,
            direction: this.direction,
            data: this.data,
            busy: this.busy,
            headLoadedRequested: this.headLoadRequested,
            headLoaded: this.headLoaded,
            readBuffer: this.readBuffer,
            writeBuffer: this.writeBuffer
        };
    }

    restoreState(state: any): void {
        this.command = state.command;
        this.drive = state.drive;
        this.side = state.side;
        this.track = state.track;
        this.sector = state.sector;
        this.direction = state.direction;
        this.data = state.data;
        this.busy = state.busy;
        this.headLoadRequested = state.headLoadRequested;
        this.headLoaded = state.headLoaded;
        this.readBuffer = state.readBuffer;
        this.writeBuffer = state.writeBuffer;
    }
}
