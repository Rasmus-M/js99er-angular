import {Injectable} from '@angular/core';
import {Database} from '../classes/database';
import {DiskImage} from '../emulator/classes/diskimage';
import {DiskDrive} from '../emulator/classes/diskdrive';

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {

    private database: Database;
    private supported: boolean;

    constructor() {
        const service = this;
        this.database = new Database(function (success) {
            service.supported = success;
        });
    }

    isSupported(): boolean {
        return this.supported;
    }

    getDiskImages(callback: (diskImages: DiskImage[]) => void) {
        this.database.getDiskImages(callback);
    }

    putDiskImage(diskImage: DiskImage, callback: (success: boolean) => void) {
        this.database.putDiskImage(diskImage, callback);
    }

    deleteAllDiskImages(callback: (success: boolean) => void) {
        this.database.deleteAllDiskImages(callback);
    }

    getDiskDrive(name: string, callback: (state: any) => void) {
        this.database.getDiskDrive(name, callback);
    }

    putDiskDrive(diskDrive: DiskDrive, callback: (success: boolean) => void) {
        this.database.putDiskDrive(diskDrive, callback);
    }

    getMachineState(name: string, callback: (state: any) => void) {
        this.database.getMachineState(name, callback);
    }

    putMachineState(name: string, state: any, callback: (success: boolean) => void) {
        this.database.putMachineState(name, state, callback);
    }
}
