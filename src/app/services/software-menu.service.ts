import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Software} from '../classes/software';
import {Observable} from 'rxjs/Observable';
import {ModuleService} from './module.service';
import {Subject} from 'rxjs';

@Injectable()
export class SoftwareMenuService {

    constructor(
        private moduleService: ModuleService,
        private httpClient: HttpClient) {
    }

    getMenuData(): Observable<any> {
        return this.httpClient.get("assets/software/index.json", {responseType: "json"});
    }

    loadModuleFromMenu(url: string): Observable<Software> {
        if (url.substr(url.length - 3).toLowerCase() === 'rpk') {
            return this.moduleService.loadRPKModuleFromURL('assets/' + url);
        } else if (url.substr(url.length - 3).toLowerCase() === 'bin') {
            return this.moduleService.loadBinModuleFromURL('assets/' + url);
        } else if (url.substr(url.length - 4).toLowerCase() === 'json') {
            return this.moduleService.loadJSONModuleFromURL('assets/' + url);
        } else {
            const subject = new Subject<Software>();
            subject.error("Invalid url: " + url);
            return subject.asObservable();
        }
    }
}
