import {Component, ElementRef, OnInit} from '@angular/core';
import {Log} from '../../classes/log';

@Component({
    selector: 'app-log',
    templateUrl: './log.component.html',
    styleUrls: ['./log.component.css']
})
export class LogComponent implements OnInit {

    constructor(private element: ElementRef) {
    }

    ngOnInit() {
        const pre = this.element.nativeElement.querySelector('pre');
        Log.getLog().init(pre);
    }

}
