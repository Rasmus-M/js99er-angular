import {Injectable, OnInit} from '@angular/core';
import {ModuleService} from './module.service';

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
        return new this.zip.HttpReader(url);
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
