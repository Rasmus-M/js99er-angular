import {Injectable} from '@angular/core';
import {Database} from '../classes/database';
import {DiskImage} from '../emulator/classes/diskimage';
import {DiskDrive} from '../emulator/classes/diskdrive';
import {Subject} from "rxjs";
import {Observable} from "rxjs";

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
}
