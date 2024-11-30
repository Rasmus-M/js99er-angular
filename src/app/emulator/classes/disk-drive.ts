import {DiskImage, DiskImageEvent} from './disk-image';
import {Stateful} from "../interfaces/stateful";

export class DiskDrive implements Stateful {

    private name: string;
    private diskImage: DiskImage | null;

    constructor(name: string, diskImage: DiskImage) {
        this.name = name;
        this.diskImage = diskImage;
    }

    getName(): string {
        return this.name;
    }

    getDiskImage(): DiskImage | null {
        return this.diskImage;
    }

    setDiskImage(diskImage: DiskImage | null) {
        this.diskImage = diskImage;
    }

    loadBinaryImage(dskFileName: string, fileBuffer: Uint8Array, eventHandler: (event: DiskImageEvent) => void): DiskImage {
        const diskImage = new DiskImage(dskFileName, eventHandler);
        diskImage.loadBinaryImage(fileBuffer);
        this.setDiskImage(diskImage);
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
