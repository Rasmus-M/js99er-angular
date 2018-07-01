import {Component, Input, OnInit} from '@angular/core';
import {DiskImage} from '../../emulator/classes/disk';
import {TI994A} from '../../emulator/classes/ti994a';

@Component({
    selector: 'app-disk',
    templateUrl: './disk.component.html',
    styleUrls: ['./disk.component.css']
})
export class DiskComponent implements OnInit {

    @Input() ti994A: TI994A;
    @Input() diskImages: DiskImage[];

    constructor() {
    }

    ngOnInit() {
    }
}
