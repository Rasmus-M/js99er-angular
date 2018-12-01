import {Log} from './log';
import {DiskImage} from '../emulator/classes/diskimage';
import {DiskDrive} from '../emulator/classes/diskdrive';

export class Database {

    static NAME = "js99er";
    static VERSION = 4;
    static DISK_DRIVES_STORE = "diskDrives";
    static DISK_IMAGES_STORE = "diskImages";
    static BINARY_FILE_STORE = "binaryFiles";
    static MACHINE_STATE_STORE = "machineStates";

    private db: IDBDatabase;
    private supported: boolean;
    private log: Log = Log.getLog();

    constructor(callback) {
        this.db = null;
        this.supported = this.open(callback);
    }

    open(callback) {
        const that = this;
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
            };

            request.onsuccess = function () {
                that.log.info("Database opened OK.");
                that.db = request.result as IDBDatabase;
                if (callback) { callback(true); }
            };

            request.onerror = function () {
                that.log.warn("Database could not be opened: " + request.error.message);
                that.db = null;
                if (callback) { callback(false); }
            };

            return true;
        } else {
            that.log.warn("IndexedDB not supported by this browser.");
            return false;
        }
    }

    isSupported() {
        return this.supported;
    }

    getDiskDrive(name, callback: (result: DiskDrive | boolean) => void) {
        if (this.db != null && name != null) {
            const that = this;

            const trans: IDBTransaction = this.db.transaction([Database.DISK_DRIVES_STORE], "readonly");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_DRIVES_STORE);

            const request: IDBRequest = store.get(name);

            request.onsuccess = function () {
                if (callback) { callback(request.result); }
            };

            request.onerror = function () {
                that.log.error(request.error.message);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    putDiskDrive(diskDrive: DiskDrive, callback: (boolean) => void) {
        if (this.db != null) {
            const that = this;

            const trans: IDBTransaction = this.db.transaction([Database.DISK_DRIVES_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_DRIVES_STORE);

            const request: IDBRequest = store.put(diskDrive.getState());

            request.onsuccess = function () {
                if (callback) { callback(true); }
            };

            request.onerror = function () {
                that.log.error(request.error.message);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    getDiskImages(callback: (diskImages: DiskImage[] | boolean) => void) {
        if (this.db != null) {
            const that = this;

            const diskImages = [];
            const trans: IDBTransaction = this.db.transaction([Database.DISK_IMAGES_STORE], "readonly");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_IMAGES_STORE);

            // Get everything in the store;
            const cursorRequest = store.openCursor();

            cursorRequest.onsuccess = function () {
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

            cursorRequest.onerror = function () {
                that.log.error(cursorRequest.error.message);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    getDiskImage(name: string, callback: (boolean) => void) {
        if (this.db != null && name != null) {
            const that = this;

            const trans: IDBTransaction = this.db.transaction([Database.DISK_IMAGES_STORE], "readonly");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_IMAGES_STORE);

            const request: IDBRequest = store.get(name);

            request.onsuccess = function () {
                const state = request.result;
                const diskImage = new DiskImage(state.name, null);
                diskImage.restoreState(state);
                if (callback) { callback(diskImage); }
            };

            request.onerror = function () {
                that.log.error(request.error.message);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    putDiskImage(diskImage: DiskImage, callback: (boolean) => void) {
        if (this.db != null) {
            const that = this;

            const trans: IDBTransaction = this.db.transaction([Database.DISK_IMAGES_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_IMAGES_STORE);

            const request: IDBRequest = store.put(diskImage.getState());

            request.onsuccess = function () {
                if (callback) { callback(true); }
            };

            request.onerror = function () {
                that.log.error(request.error.message);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    deleteDiskImage(name: string, callback: (boolean) => void) {
        if (this.db != null && name != null) {
            const that = this;

            const trans: IDBTransaction = this.db.transaction([Database.DISK_IMAGES_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_IMAGES_STORE);

            const request: IDBRequest = store.delete(name);

            request.onsuccess = function () {
                if (callback) { callback(true); }
            };

            request.onerror = function () {
                that.log.error(request.error.message);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    deleteAllDiskImages(callback: (boolean) => void) {
        if (this.db != null) {
            const that = this;

            const trans: IDBTransaction = this.db.transaction([Database.DISK_IMAGES_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.DISK_IMAGES_STORE);

            // Get everything in the store;
            const cursorRequest = store.openCursor();

            cursorRequest.onsuccess = function () {
                const cursor = cursorRequest.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    if (callback) { callback(true); }
                }
            };

            cursorRequest.onerror = function () {
                that.log.error(cursorRequest.error.message);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    getBinaryFile(name: string, callback: (boolean) => void) {
        if (this.db != null && name != null) {
            const that = this;

            const trans: IDBTransaction = this.db.transaction([Database.BINARY_FILE_STORE], "readonly");
            const store: IDBObjectStore = trans.objectStore(Database.BINARY_FILE_STORE);

            const request: IDBRequest = store.get(name);

            request.onsuccess = function () {
                const obj = request.result;
                if (obj) {
                    if (callback) { callback(obj.binaryFile); }
                } else {
                    if (callback) { callback(false); }
                }
            };

            request.onerror = function () {
                that.log.error(request.error.message);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    putBinaryFile(name: string, binaryFile: Uint8Array, callback: (boolean) => void) {
        if (this.db != null) {
            const that = this;

            const trans: IDBTransaction = this.db.transaction([Database.BINARY_FILE_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.BINARY_FILE_STORE);

            const request: IDBRequest = store.put({name: name, binaryFile: binaryFile});

            request.onsuccess = function () {
                if (callback) { callback(true); }
            };

            request.onerror = function () {
                that.log.error(request.error.message);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    getMachineState(name: string, callback: (boolean) => void) {
        if (this.db != null && name != null) {
            const that = this;

            const trans: IDBTransaction = this.db.transaction([Database.MACHINE_STATE_STORE], "readonly");
            const store: IDBObjectStore = trans.objectStore(Database.MACHINE_STATE_STORE);

            const request: IDBRequest = store.get(name);

            request.onsuccess = function () {
                const obj = request.result;
                if (obj) {
                    if (callback) { callback(obj.state); }
                } else {
                    if (callback) { callback(false); }
                }
            };

            request.onerror = function () {
                that.log.error(request.error.message);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }

    putMachineState(name: string, state: any, callback: (boolean) => void) {
        if (this.db != null) {
            const that = this;

            const trans: IDBTransaction = this.db.transaction([Database.MACHINE_STATE_STORE], "readwrite");
            const store: IDBObjectStore = trans.objectStore(Database.MACHINE_STATE_STORE);

            const request: IDBRequest = store.put({name: name, state: state});

            request.onsuccess = function () {
                if (callback) { callback(true); }
            };

            request.onerror = function () {
                that.log.error(request.error.message);
                if (callback) { callback(false); }
            };
        } else {
            if (callback) { callback(false); }
        }
    }
}
