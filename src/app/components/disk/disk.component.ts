import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {DiskImage} from '../../emulator/classes/diskimage';
import {DiskFile} from '../../emulator/classes/diskfile';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {ConsoleEvent, ConsoleEventType} from '../../classes/consoleevent';
import {TI994A} from '../../emulator/classes/ti994a';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {DiskDrive} from '../../emulator/classes/diskdrive';
import {SelectionModel} from '@angular/cdk/collections';
import { faHdd, faBan, faSave, faPlus, faDownload, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import {FileType} from "../../emulator/classes/disk";

@Component({
    selector: 'app-disk',
    templateUrl: './disk.component.html',
    styleUrls: ['./disk.component.css']
})
export class DiskComponent implements OnInit, OnDestroy {

    @Input() diskImages: DiskImage[];

    protected readonly FileType = FileType;

    diskDrives: DiskDrive[];
    diskImageDrives: string[] = [];
    driveIndex = 0;
    diskImageIndex = 0;
    diskFiles: DiskFile[];
    displayedColumns = ['select', 'fileName', 'fileType', 'dataType', 'recordType', 'recordLength', 'fileSize'];
    selection: SelectionModel<DiskFile>;

    driveIcon = faHdd;
    emptyIcon = faBan;
    diskIcon = faSave;
    addDiskIcon = faPlus;
    deleteIcon = faBan;
    saveDiskIcon = faDownload;
    insertDiskIcon = faCaretUp;

    private subscription: Subscription;
    private deletingDisk = false;

    constructor(
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService
    ) {
    }

    ngOnInit() {
        this.subscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
        this.resetSelection();
    }

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.READY:
                const ti994A: TI994A = event.data;
                this.diskDrives = ti994A.getDiskDrives();
                this.onDiskImageChanged(this.diskImageIndex);
                break;
            case ConsoleEventType.DISK_MODIFIED: {
                    const diskImage = event.data;
                    const index = this.diskImages.indexOf(diskImage);
                    if (index !== -1) {
                        this.onDiskImageChanged(index);
                    }
                    this.resetSelection();
                }
                break;
            case ConsoleEventType.DISK_INSERTED: {
                    const index = this.diskImages.indexOf(event.data.diskImage);
                    if (index !== -1) {
                        this.onDiskImageChanged(index);
                    }
                    this.updateAllDiskImageDrives();
                }
                break;
            case ConsoleEventType.DISK_ADDED:
                this.updateAllDiskImageDrives();
                break;
            case ConsoleEventType.DISK_REMOVED:
                // this.updateAllDiskImageDrives();
                if (this.deletingDisk) {
                    this.commandDispatcherService.deleteDisk(this.diskImages[this.diskImageIndex]);
                }
                this.onDiskImageChanged(-1);
                break;
            case ConsoleEventType.DISK_DELETED:
                this.updateAllDiskImageDrives();
                this.diskImageIndex = -1;
                break;
            case ConsoleEventType.DISK_DRIVE_CHANGED: {
                    // Self-generated
                    const diskDrive: DiskDrive = this.diskDrives[event.data];
                    const diskImage: DiskImage = diskDrive.getDiskImage()!;
                    this.onDiskImageChanged(this.diskImages.indexOf(diskImage));
                }
                break;
            case ConsoleEventType.STATE_RESTORED:
                this.onDriveIndexChanged(this.driveIndex);
                break;
        }
    }

    onDriveIndexChanged(index: number) {
        this.driveIndex = index;
        this.eventDispatcherService.diskDriveChanged(this.driveIndex);
    }

    onDiskImageChanged(index: number) {
        this.diskImageIndex = index;
        const files = [];
        if (index >= 0) {
            const filesObject = this.diskImages[index].getFiles();
            for (const name in filesObject) {
                if (filesObject.hasOwnProperty(name)) {
                    files.push(filesObject[name]);
                }
            }
        }
        this.diskFiles = files;
        this.updateAllDiskImageDrives();
    }

    resetSelection() {
        this.selection = new SelectionModel<DiskFile>(true, []);
    }

    addDisk() {
        this.commandDispatcherService.addDisk();
    }

    insertDiskIndex(index: number) {
        this.diskImageIndex = index;
        this.insertDisk();
    }

    insertDisk() {
        const index = this.diskImageIndex;
        if (index >= 0) {
            this.commandDispatcherService.insertDisk(this.driveIndex, this.diskImages[index]);
        } else {
            this.commandDispatcherService.removeDisk(this.driveIndex);
        }
    }

    deleteDisk() {
        this.deletingDisk = true;
        this.commandDispatcherService.removeDisk(this.driveIndex);
    }

    deleteFiles() {
        this.commandDispatcherService.deleteDiskFiles(this.diskImages[this.diskImageIndex], this.selection.selected);
    }

    saveDiskFiles() {
        this.commandDispatcherService.saveDiskFiles(this.diskImages[this.diskImageIndex], this.selection.selected);
    }

    saveDisk() {
        this.commandDispatcherService.saveDisk(this.diskImages[this.diskImageIndex]);
    }

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.diskFiles.length;
        return numSelected === numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.diskFiles.forEach(row => this.selection.select(row));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    private updateAllDiskImageDrives() {
        for (let i = 0; i < this.diskImages.length; i++) {
            this.diskImageDrives[i] = this.updateDiskImageDrives(this.diskImages[i]);
        }
    }

    private updateDiskImageDrives(diskImage: DiskImage): string {
        let s = "";
        if (this.diskDrives) {
            this.diskDrives.forEach((diskDrive) => {
                if (diskDrive.getDiskImage() === diskImage) {
                    s += (s.length > 0 ? ", " : "") + diskDrive.getName();
                }
            });
            if (s.length > 0) {
                s = "(in " + s + ")";
            }
        }
        return s;
    }
}
