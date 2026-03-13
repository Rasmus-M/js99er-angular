import {Component, input, OnDestroy, OnInit, signal, computed} from '@angular/core';
import {Subscription} from 'rxjs';
import {DiskImage} from '../../emulator/classes/disk-image';
import {DiskFile} from '../../emulator/classes/disk-file';
import {EventDispatcherService} from '../../services/event-dispatcher.service';
import {ConsoleEvent, ConsoleEventType} from '../../classes/console-event';
import {TI994A} from '../../emulator/classes/ti994a';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {DiskDrive} from '../../emulator/classes/disk-drive';
import {SelectionModel} from '@angular/cdk/collections';
import {faBan, faDownload, faHdd, faPlus, faSave, faTrash} from '@fortawesome/free-solid-svg-icons';
import {FileType} from "../../emulator/classes/disk";

@Component({
    selector: 'disk',
    templateUrl: './disk.component.html',
    styleUrls: ['./disk.component.css'],
    standalone: false
})
export class DiskComponent implements OnInit, OnDestroy {

    diskImages = input.required<DiskImage[]>();

    protected readonly FileType = FileType;

    diskDrives = signal<DiskDrive[]>([]);
    diskImageDrives = signal<string[]>([]);
    driveIndex = signal(0);
    diskImageIndex = signal(0);
    diskFiles = signal<DiskFile[]>([]);
    diskImage = computed(() => this.diskImages()[this.diskImageIndex()]);

    displayedColumns = ['select', 'fileName', 'fileType', 'dataType', 'recordType', 'recordLength', 'fileSize'];
    selection: SelectionModel<DiskFile>;

    driveIcon = faHdd;
    emptyIcon = faBan;
    diskIcon = faSave;
    addDiskIcon = faPlus;
    deleteIcon = faTrash;
    saveDiskIcon = faDownload;

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
                this.diskDrives.set(ti994A.getDiskDrives());
                this.onDiskImageChanged(this.diskImageIndex());
                break;
            case ConsoleEventType.DISK_MODIFIED: {
                    const diskImage = event.data;
                    const index = this.diskImages().indexOf(diskImage);
                    if (index !== -1) {
                        this.onDiskImageChanged(index);
                    }
                    this.resetSelection();
                }
                break;
            case ConsoleEventType.DISK_INSERTED: {
                    const index = this.diskImages().indexOf(event.data.diskImage);
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
                if (this.deletingDisk) {
                    this.commandDispatcherService.deleteDisk(this.diskImage());
                }
                this.onDiskImageChanged(-1);
                break;
            case ConsoleEventType.DISK_DELETED:
                this.updateAllDiskImageDrives();
                this.diskImageIndex.set(-1);
                break;
            case ConsoleEventType.DISK_DRIVE_CHANGED: {
                    // Self-generated
                    const diskDrive: DiskDrive = this.diskDrives()[event.data];
                    const diskImage: DiskImage = diskDrive.getDiskImage()!;
                    this.onDiskImageChanged(this.diskImages().indexOf(diskImage));
                }
                break;
            case ConsoleEventType.STATE_RESTORED:
                this.onDriveIndexChanged(this.driveIndex());
                break;
        }
    }

    onDriveIndexChanged(index: number) {
        this.driveIndex.set(index);
        this.eventDispatcherService.diskDriveChanged(this.driveIndex());
    }

    onDiskImageChanged(index: number) {
        this.diskImageIndex.set(index);
        this.diskFiles.set(index >= 0 ? this.diskImages()[index].getFilesArray() : []);
        this.updateAllDiskImageDrives();
    }

    resetSelection() {
        this.selection = new SelectionModel<DiskFile>(true, []);
    }

    addDisk() {
        this.commandDispatcherService.addDisk();
    }

    insertDiskIndex(index: number) {
        this.diskImageIndex.set(index);
        this.insertDisk();
    }

    insertDisk() {
        const index = this.diskImageIndex();
        if (index >= 0) {
            this.commandDispatcherService.insertDisk(this.driveIndex(), this.diskImages()[index]);
        } else {
            this.commandDispatcherService.removeDisk(this.driveIndex());
        }
    }

    deleteDisk() {
        this.deletingDisk = true;
        this.commandDispatcherService.removeDisk(this.driveIndex());
    }

    deleteFiles() {
        this.commandDispatcherService.deleteDiskFiles(this.diskImage(), this.selection.selected);
    }

    saveDiskFiles() {
        this.commandDispatcherService.saveDiskFiles(this.diskImage(), this.selection.selected);
    }

    saveDisk() {
        this.commandDispatcherService.saveDisk(this.diskImage());
    }

    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.diskFiles().length;
        return numSelected === numRows;
    }

    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.diskFiles().forEach(row => this.selection.select(row));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    private updateAllDiskImageDrives() {
        for (let i = 0; i < this.diskImages().length; i++) {
            this.diskImageDrives()[i] = this.updateDiskImageDrives(this.diskImages()[i]);
        }
    }

    private updateDiskImageDrives(diskImage: DiskImage): string {
        let s = "";
        if (this.diskDrives()) {
            this.diskDrives().forEach((diskDrive) => {
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
