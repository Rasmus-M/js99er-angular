import {Injectable} from '@angular/core';
import {Database} from '../classes/database';
import {DiskImage} from '../emulator/classes/disk-image';
import {DiskDrive} from '../emulator/classes/disk-drive';
import {Subject} from "rxjs";
import {Observable} from "rxjs";
import {Software} from "../classes/software";

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {

    private database: Database;
    private supported: boolean;
    private ready = new Subject<boolean>();

    constructor() {
        const service = this;
        this.database = new Database((success) => {
            service.supported = success;
            this.ready.next(success);
        });
    }

    isSupported(): boolean {
        return this.supported;
    }

    whenReady() {
        return this.ready.asObservable();
    }

    getDiskImages() {
        const subject = new Subject<DiskImage[]>();
        this.database.getDiskImages(
            (result: any) => {
                if (result) {
                    subject.next(result);
                } else {
                    subject.error("Failed to get disk images");
                }
            }
        );
        return subject.asObservable();
    }

    putDiskImage(diskImage: DiskImage): Observable<void> {
        const subject = new Subject<void>();
        this.database.putDiskImage(diskImage,
            (success: boolean) => {
                if (success) {
                    subject.next();
                } else {
                    subject.error("Failed to put disk image " + diskImage.getName());
                }
            }
        );
        return subject.asObservable();
    }

    deleteAllDiskImages(): Observable<void> {
        const subject = new Subject<void>();
        this.database.deleteAllDiskImages(
            (success: boolean) => {
                if (success) {
                    subject.next();
                } else {
                    subject.error("Failed to delete all disk images");
                }
            }
        );
        return subject.asObservable();
    }

    getDiskDrive(name: string): Observable<any> {
        const subject = new Subject<any>();
        this.database.getDiskDrive(name,
            (result: any) => {
                if (result) {
                    subject.next(result);
                } else {
                    subject.error("Failed to get disk drive " + name);
                }
            }
        );
        return subject.asObservable();
    }

    putDiskDrive(diskDrive: DiskDrive): Observable<void> {
        const subject = new Subject<void>();
        this.database.putDiskDrive(diskDrive,
            (success: boolean) => {
                if (success) {
                    subject.next();
                } else {
                    subject.error("Failed to put disk drive " + diskDrive.getName());
                }
            }
        );
        return subject.asObservable();
    }

    getMachineState(name: string): Observable<any> {
        const subject = new Subject<any>();
        this.database.getMachineState(name,
            (result: any) => {
                if (result) {
                    subject.next(result);
                } else {
                    subject.error("Failed to get machine state");
                }
            }
        );
        return subject.asObservable();
    }

    putMachineState(name: string, state: any): Observable<void> {
        const subject = new Subject<void>();
        this.database.putMachineState(name, state,
            (success: boolean) => {
                if (success) {
                    subject.next();
                } else {
                    subject.error("Failed to put machine state");
                }
            }
        );
        return subject.asObservable();
    }

    getSoftware(name: string): Observable<Software> {
        const subject = new Subject<Software>();
        this.database.getSoftware(name,
            (result: Software | false) => {
                if (result !== false) {
                    subject.next(result as Software);
                } else {
                    subject.error("Failed to get software");
                }
            }
        );
        return subject.asObservable();
    }

    putSoftware(name: string, software: Software): Observable<void> {
        const subject = new Subject<void>();
        this.database.putSoftware(name, software,
            (success: boolean) => {
                if (success) {
                    subject.next();
                } else {
                    subject.error("Failed to put software");
                }
            }
        );
        return subject.asObservable();
    }
}
