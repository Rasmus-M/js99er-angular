// @ts-ignore
import zip from 'zip-js/WebContent/zip.js';
import BlobReader = zip.BlobReader;
import Reader = zip.Reader;
import TextWriter = zip.TextWriter;
import BlobWriter = zip.BlobWriter;
import ZipReader = zip.ZipReader;
import {Injectable} from '@angular/core';

// Modification of zip.js HttpReader that uses GET instead of HEAD
class HttpReader implements zip.HttpReader {

    url: string;
    size = 0;
    data: Uint8Array;

    constructor(url: string) {
        this.url = url;
    }

    getData(callback: () => void, onerror: (error: any) => void) {
        const that = this;
        let request: XMLHttpRequest;
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

    init(callback: () => void, onerror: (error: any) => void) {
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

    readUint8Array(index: number, length: number, callback: (data: Uint8Array) => void, onerror: (error: any) => void) {
        const that = this;
        this.getData(function() {
            callback(new Uint8Array(that.data.subarray(index, index + length)));
        }, onerror);
    }
}

@Injectable()
export class ZipService {

    private zip = zip.zip;

    constructor() {
        this.zip.workerScriptsPath = './assets/scripts/';
    }

    createBlobReader(file: File): BlobReader {
        return new this.zip.BlobReader(file);
    }

    createHttpReader(url: string): HttpReader {
        return new HttpReader(url);
    }

    createReader(reader: any, callback: (zipReader: ZipReader) => void, onerror: (err: any) => void): Reader {
        return this.zip.createReader(reader, callback, onerror);
    }

    createTextWriter(encoding: string): TextWriter {
        return new this.zip.TextWriter('ISO-8859-1');
    }

    createBlobWriter(): BlobWriter {
        return new this.zip.BlobWriter();
    }
}
