import gapi from 'gapi-client';
import {Log} from '../../classes/log';
import {DiskImage} from './disk-image';

export interface GFile {
    id: string;
    name: string;
    title: string;
    downloadUrl?: string;
    data: Uint8Array;
}

export class GoogleDrive {

    private readonly name: string;
    private readonly path: string;
    private folderId: string | null;
    private diskImage: DiskImage;
    private log: Log = Log.getLog();

    constructor(name: string, path: string) {
        this.name = name;
        this.path = path;
    }

    reset() {
        this.folderId = null;
        this.diskImage = new DiskImage(this.name, null);
    }

    getName() {
        return this.name;
    }

    getDiskImage() {
        return this.diskImage;
    }

    getFolderId(callback: (id: string) => void) {
        const that = this;
        if (this.folderId !== null) {
            callback(this.folderId);
        } else {
            this.getOrCreateFolder(this.path.split("/"), "root", (id) => {
                that.folderId = id;
                callback(id);
            });
        }
    }

    getFiles(parent: string, callback: (items: any[]) => void) {
        const request = gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'GET',
            'params': {'q': "mimeType != 'application/vnd.google-apps.folder' and '" + parent + "' in parents and trashed = false"}
        });
        request.execute((result: any) => {
            callback(result.items);
        });
   }

    findFile(fileName: string, parent: string, callback: (id: string) => void) {
        const request = gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'GET',
            'params': {'q': "mimeType != 'application/vnd.google-apps.folder' and title = '" + fileName + "' and '" + parent + "' in parents and trashed = false"}
        });

        request.execute((result: any) => {
            const items = result.items;
            const id = items && items.length > 0 ? items[0].id : null;
            this.log.info("findFile '" + fileName + "': " + id);
            callback(id);
        });
   }

    getFile(fileId: string, callback: (file: GFile) => any) {
        const request = gapi.client.request({
            'path': '/drive/v2/files/' + fileId,
            'method': 'GET'
        });
        request.execute(callback as (response: any) => any);
   }

    getFileContents(parent: string, callback: (files: GFile[]) => void) {
        const that = this;
        const files: any[] = [];
        this.getFiles(parent, (items) => {
            _getFileContents(items, () => {
                callback(files);
            });
        });
        function _getFileContents(items: GFile[], callback2: () => void) {
            if (items.length) {
                const item = items.shift();
                if (item) {
                    that.getFileContent(item.id, (data) => {
                        files.push({id: item.id, name: item.title, data: data});
                        _getFileContents(items, callback2);
                    });
                }
            } else {
                callback2();
            }
        }
   }

    getFileContent(fileId: string, callback: (data: Uint8Array | null) => void) {
        this.getFile(fileId, (file: GFile) => {
            if (file.downloadUrl) {
                this.log.info("getFileContent: " + file.title);
                const accessToken = gapi.auth.getToken().access_token;
                const xhr = new XMLHttpRequest();
                // See https://stackoverflow.com/questions/68016649/google-drive-api-download-file-gives-lockeddomaincreationfailure-error
                xhr.open('GET', file.downloadUrl.replace('content.googleapis.com', 'www.googleapis.com'));
                xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                xhr.responseType = "arraybuffer";
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        callback(new Uint8Array(xhr.response));
                    }
                };
                xhr.onerror = () => {
                    callback(null);
                };
                xhr.send();
            } else {
                callback(null);
            }
        });
   }

    insertOrUpdateFile(fileName: string, parent: string, fileData: Uint8Array<ArrayBuffer>, callback: (file: any) => void) {
        this.findFile(fileName, parent, (fileId) => {
            if (fileId === null) {
                this.insertFile(fileName, parent, fileData, callback);
            } else {
                this.updateFile(fileId, fileData, callback);
            }
        });
   }

    insertFile(fileName: string, parent: string, fileData: Uint8Array<ArrayBuffer>, callback: (file: any) => void) {
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        const reader = new FileReader();
        reader.readAsBinaryString(new Blob([fileData]));
        reader.onload = () => {
            const contentType = "application/octet-stream";
            const metadata = {
                'title': fileName,
                'mimeType': contentType,
                'parents': [{'id': parent}]
            };

            const base64Data = btoa(reader.result as string);
            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                base64Data +
                close_delim;

            const request = gapi.client.request({
                'path': '/upload/drive/v2/files',
                'method': 'POST',
                'params': {'uploadType': 'multipart'},
                'headers': {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody});

            request.execute(callback);
        };
   }

    updateFile(fileId: string, fileData: Uint8Array<ArrayBuffer>, callback: (file: any) => void) {
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        const reader = new FileReader();
        reader.readAsBinaryString(new Blob([fileData]));
        reader.onload = () => {
            this.getFile(fileId, (metadata) => {
                const contentType = "application/octet-stream";
                const base64Data = btoa(reader.result as string);
                const multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: ' + contentType + '\r\n' +
                    'Content-Transfer-Encoding: base64\r\n' +
                    '\r\n' +
                    base64Data +
                    close_delim;

                const request = gapi.client.request({
                    'path': '/upload/drive/v2/files/' + fileId,
                    'method': 'PUT',
                    'params': {'uploadType': 'multipart', 'alt': 'json'},
                    'headers': {
                        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                    },
                    'body': multipartRequestBody});

                request.execute(callback);
            });
        };
   }

    getOrCreateFolder(path: string[], parent: string, callback: (parent: string) => void) {
        if (path.length > 0) {
            this.getFolder(path[0], parent, (id) => {
                if (id === null) {
                    this.createFolder(path[0], parent, (id2) => {
                        this.getOrCreateFolder(path.splice(1), id2, callback);
                    });
                } else {
                    this.getOrCreateFolder(path.splice(1), id, callback);
                }
            });
        } else {
            callback(parent);
        }
   }

    createFolder(folderName: string, parent: string, callback: (id: string) => void) {
        const metadata = {
            'title': folderName,
            'parents': [{'id': parent}],
            'mimeType': 'application/vnd.google-apps.folder'
        };

        const request = gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'POST',
            'body': JSON.stringify(metadata)
        });

        request.execute((result: any) => {
            const id = result.id;
            this.log.info("createFolder '" + folderName + "': " + id);
            callback(id);
        });
   }

    getFolder(folderName: string, parent: string, callback: (id: string) => void) {
        const request = gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'GET',
            'params': {'q': "mimeType = 'application/vnd.google-apps.folder' and title = '" + folderName + "' and '" + parent + "' in parents and trashed = false"}
        });

        request.execute((result: any) => {
            const items = result.items;
            const id = items.length > 0 ? items[0].id : null;
            this.log.info("getFolder '" + folderName + "': " + id);
            callback(id);
        });
   }
}
