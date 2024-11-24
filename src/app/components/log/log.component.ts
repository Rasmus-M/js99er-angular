import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Log} from '../../classes/log';
import {faDownload, faTrash} from "@fortawesome/free-solid-svg-icons";
import {ActivatedRoute} from "@angular/router";
import {Location} from "@angular/common";

@Component({
    selector: 'log',
    templateUrl: './log.component.html',
    styleUrls: ['./log.component.css']
})
export class LogComponent implements OnInit, OnChanges {

    @Input() active: boolean;

    protected readonly clearIcon = faTrash;
    private preElement: HTMLPreElement;
    private log = Log.getLog();

    constructor(
        private element: ElementRef
    ) {}

    ngOnInit() {
        this.preElement = this.element.nativeElement.querySelector('pre');
        this.log.init(this.preElement);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['active'] && changes['active'].currentValue === true) {
            this.scrollBottom();
        }
    }

    clearLog() {
        this.log.clear();
    }

    scrollBottom() {
        if (this.preElement) {
            this.preElement.scrollTop = this.preElement.scrollHeight;
        }
    }
}
