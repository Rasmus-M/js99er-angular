import {Injectable} from '@angular/core';

// Modification of zip.js HttpReader that uses GET instead of HEAD
class HttpReader {

    url: string;
    size = 0;
    data: Uint8Array;

    constructor(url) {
        this.url = url;
    }

    getData(callback, onerror) {
        const that = this;
        let request;
        if (!this.data) {
            request = new XMLHttpRequest();
            request.addEventListener("load", function() {
                if (!that.size) {
                    that.size = Number(request.getResponseHeader("Content-Length"));
                }
                that.data = new Uint8Array(request.response);
                callback();
            }, false);
            request.addEventListener("error", onerror, false);
            request.open("GET", this.url);
            request.responseType = "arraybuffer";
            request.send();
        } else {
            callback();
        }
    }

    init(callback, onerror) {
        const that = this;
        const request = new XMLHttpRequest();
        request.addEventListener("load", function() {
            that.size = Number(request.getResponseHeader("Content-Length"));
            callback();
        }, false);
        request.addEventListener("error", onerror, false);
        request.open("GET", this.url); // Changed from HEAD request
        request.send();
    }

    readUint8Array(index, length, callback, onerror) {
        const that = this;
        this.getData(function() {
            callback(new Uint8Array(that.data.subarray(index, index + length)));
        }, onerror);
    }
}

@Injectable()
export class ZipService {

    private zip = window.zip;

    constructor() {
        this.zip.workerScriptsPath = './assets/scripts/';
    }

    createBlobReader(file: File) {
        return new this.zip.BlobReader(file);
    }

    createHttpReader(url: string) {
        return new HttpReader(url);
    }

    createReader(reader: any, callback: (zipReader) => void, onerror: (err: any) => void) {
        return this.zip.createReader(reader, callback, onerror);
    }

    createTextWriter(encoding: string) {
        return new this.zip.TextWriter('ISO-8859-1');
    }

    createBlobWriter() {
        return new this.zip.BlobWriter();
    }
}
