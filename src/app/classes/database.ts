import {Log} from './log';
import {DiskImage} from '../emulator/classes/disk-image';
import {DiskDrive} from '../emulator/classes/disk-drive';
import {MemoryBlock, Software} from "./software";

export class Database {

    static NAME = "js99er";
    static VERSION = 5;
    static DISK_DRIVES_STORE = "diskDrives";
    static DISK_IMAGES_STORE = "diskImages";
    static BINARY_FILE_STORE = "binaryFiles";
    static MACHINE_STATE_STORE = "machineStates";
    static SOFTWARE_STORE = "software";

    private db: IDBDatabase | null;
    private supported: boolean;
    private log: Log = Log.getLog();

    constructor(callback: (supported: boolean) => void) {
        this.db = null;
        this.supported = this.open(callback);
    }

    open(callback: (result: boolean) => void) {
        if (window.indexedDB) {

            const request: IDBOpenDBRequest = indexedDB.open(Database.NAME, Database.VERSION);

            // Only called when Database.VERSION changes
            request.onupgradeneeded = function (e: IDBVersionChangeEvent) {
                const db: IDBDatabase = request.result;
                if (!db.objectStoreNames.contains(Database.DISK_DRIVES_STORE)) {
                    db.createObjectStore(Database.DISK_DRIVES_STORE, { keyPath: "name" });
                }
                if (!db.objectStoreNames.contains(Database.DISK_IMAGES_STORE)) {
                    db.createObjectStore(Database.DISK_IMAGES_STORE, { keyPath: "name" });
                }
                if (!db.objectStoreNames.contains(Database.BINARY_FILE_STORE)) {
                    db.createObjectStore(Database.BINARY_FILE_STORE, {keyPath: "name"});
                }
                if (!db.objectStoreNames.contains(Database.MACHINE_STATE_STORE)) {
                    db.createObjectStore(Database.MACHINE_STATE_STORE, {keyPath: "name"});
                }
                if (!db.objectStoreNames.contains(Database.SOFTWARE_STORE)) {
                    db.createObjectStore(Database.SOFTWARE_STORE, {keyPath: "name"});
                }
            };

            request.onsuccess = () => {
                this.log.info("Database opened OK.");
                this.db = request.result as IDBDatabase;
                if (callback) { callback(true); }
            };

            request.onerror = () => {
                this.log.warn("Database could not be opened: " + request.error?.message);
                this.db = null;
                if (callback) { callback(false); }
            };

            return true;
        } else {
            this.log.warn("IndexedDB not supported by this browser.");
            return false;
        }
    }

    isSupported() {
        return this.supported;
    }

    getDiskDrive(name: string, callback: (result: DiskDrive | false) => void) {
        if (this.db != null && name != null) {
            const trans: IDBTransaction = this.db.transaction([Database.DISK_DRIVES_STORE], "readonly");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_DRIVES_STORE);

            const request: IDBRequest = store.get(name);

            request.onsuccess = () => {
                if (callback) { callback(request.result); }
            };

            request.onerror = () => {
                this.logError(request);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    putDiskDrive(diskDrive: DiskDrive, callback: (result: boolean) => void) {
        if (this.db != null) {
            const trans: IDBTransaction = this.db.transaction([Database.DISK_DRIVES_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_DRIVES_STORE);

            const request: IDBRequest = store.put(diskDrive.getState());

            request.onsuccess = () => {
                if (callback) { callback(true); }
            };

            request.onerror = () => {
                this.logError(request);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    getDiskImages(callback: (diskImages: DiskImage[] | boolean) => void) {
        if (this.db != null) {
            const diskImages: DiskImage[] = [];
            const trans: IDBTransaction = this.db.transaction([Database.DISK_IMAGES_STORE], "readonly");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_IMAGES_STORE);

            // Get everything in the store;
            const cursorRequest = store.openCursor();

            cursorRequest.onsuccess = () => {
                const cursor = cursorRequest.result;
                if (cursor) {
                    const state = cursor.value;
                    const diskImage = new DiskImage(state.name, null);
                    diskImage.restoreState(state);
                    diskImages.push(diskImage);

                    cursor.continue();
                } else {
                    if (callback) { callback(diskImages); }
                }
            };

            cursorRequest.onerror = () => {
                this.logError(cursorRequest);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    getDiskImage(name: string, callback: (result: false | DiskImage) => void) {
        if (this.db != null && name != null) {
            const trans: IDBTransaction = this.db.transaction([Database.DISK_IMAGES_STORE], "readonly");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_IMAGES_STORE);

            const request: IDBRequest = store.get(name);

            request.onsuccess = () => {
                const state = request.result;
                const diskImage = new DiskImage(state.name, null);
                diskImage.restoreState(state);
                if (callback) { callback(diskImage); }
            };

            request.onerror = () => {
                this.logError(request);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    putDiskImage(diskImage: DiskImage, callback: (result: boolean) => void) {
        if (this.db != null) {
            const trans: IDBTransaction = this.db.transaction([Database.DISK_IMAGES_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_IMAGES_STORE);

            const request: IDBRequest = store.put(diskImage.getState());

            request.onsuccess = () => {
                if (callback) { callback(true); }
            };

            request.onerror = () => {
                this.logError(request);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    deleteDiskImage(name: string, callback: (result: boolean) => void) {
        if (this.db != null && name != null) {
            const trans: IDBTransaction = this.db.transaction([Database.DISK_IMAGES_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_IMAGES_STORE);

            const request: IDBRequest = store.delete(name);

            request.onsuccess = () => {
                if (callback) { callback(true); }
            };

            request.onerror = () => {
                this.logError(request);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    deleteAllDiskImages(callback: (result: boolean) => void) {
        if (this.db != null) {
            const trans: IDBTransaction = this.db.transaction([Database.DISK_IMAGES_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_IMAGES_STORE);

            // Get everything in the store;
            const cursorRequest = store.openCursor();

            cursorRequest.onsuccess = () => {
                const cursor = cursorRequest.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    if (callback) { callback(true); }
                }
            };

            cursorRequest.onerror = () => {
                this.logError(cursorRequest);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    getBinaryFile(name: string, callback: (result: false | Uint8Array) => void) {
        if (this.db != null && name != null) {
            const trans: IDBTransaction = this.db.transaction([Database.BINARY_FILE_STORE], "readonly");
            const store: IDBObjectStore = trans.objectStore(Database.BINARY_FILE_STORE);

            const request: IDBRequest = store.get(name);

            request.onsuccess = () => {
                const obj = request.result;
                if (obj) {
                    if (callback) { callback(obj.binaryFile); }
                } else {
                    if (callback) { callback(false); }
                }
            };

            request.onerror = () => {
                this.logError(request);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    putBinaryFile(name: string, binaryFile: Uint8Array, callback: (result: boolean) => void) {
        if (this.db != null) {
            const trans: IDBTransaction = this.db.transaction([Database.BINARY_FILE_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.BINARY_FILE_STORE);

            const request: IDBRequest = store.put({name: name, binaryFile: binaryFile});

            request.onsuccess = () => {
                if (callback) { callback(true); }
            };

            request.onerror = () => {
                this.logError(request);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    getMachineState(name: string, callback: (result: false | any) => void) {
        if (this.db != null && name != null) {
            const trans: IDBTransaction = this.db.transaction([Database.MACHINE_STATE_STORE], "readonly");
            const store: IDBObjectStore = trans.objectStore(Database.MACHINE_STATE_STORE);

            const request: IDBRequest = store.get(name);

            request.onsuccess = () => {
                const obj = request.result;
                if (obj) {
                    if (callback) { callback(obj.state); }
                } else {
                    if (callback) { callback(false); }
                }
            };

            request.onerror = () => {
                this.logError(request);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    putMachineState(name: string, state: any, callback: (result: boolean) => void) {
        if (this.db != null) {
            const trans: IDBTransaction = this.db.transaction([Database.MACHINE_STATE_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.MACHINE_STATE_STORE);

            const request: IDBRequest = store.put({name: name, state: state});

            request.onsuccess = () => {
                if (callback) { callback(true); }
            };

            request.onerror = () => {
                this.logError(request);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    getSoftware(name: string, callback: (result: false | Software) => void) {
        if (this.db != null && name != null) {
            const trans: IDBTransaction = this.db.transaction([Database.SOFTWARE_STORE], "readonly");
            const store: IDBObjectStore = trans.objectStore(Database.SOFTWARE_STORE);

            const request: IDBRequest = store.get(name);

            request.onsuccess = () => {
                const obj = request.result;
                if (obj) {
                    const software = new Software();
                    Object.assign(software, obj.software);
                    if (obj.software._memoryBlocks) {
                        software.memoryBlocks = [];
                        for (const _memoryBlock of obj.software._memoryBlocks) {
                            software.memoryBlocks.push(new MemoryBlock(_memoryBlock._address, _memoryBlock._data));
                        }
                    }
                    if (callback) { callback(software); }
                } else {
                    if (callback) { callback(false); }
                }
            };

            request.onerror = () => {
                this.logError(request);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    putSoftware(name: string, software: Software, callback: (result: boolean) => void) {
        if (this.db != null) {
            const trans: IDBTransaction = this.db.transaction([Database.SOFTWARE_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.SOFTWARE_STORE);

            const request: IDBRequest = store.put({name: name, software: software});

            request.onsuccess = () => {
                if (callback) { callback(true); }
            };

            request.onerror = () => {
                this.logError(request);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    logError(request: IDBRequest) {
        if (request.error) {
            this.log.error(request.error.message);
        }
    }
}
