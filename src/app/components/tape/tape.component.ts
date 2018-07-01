import {Component, Input, OnInit} from '@angular/core';
import {TI994A} from '../../emulator/classes/ti994a';

@Component({
    selector: 'app-tape',
    templateUrl: './tape.component.html',
    styleUrls: ['./tape.component.css']
})
export class TapeComponent implements OnInit {

    @Input() ti994A: TI994A;

    constructor() {
    }

    ngOnInit() {
    }
}
