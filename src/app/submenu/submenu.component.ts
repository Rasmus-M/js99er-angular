import {Component, Input, OnInit} from '@angular/core';
import {SoftwareType} from '../classes/software';

@Component({
    selector: 'app-submenu',
    templateUrl: './submenu.component.html',
    styleUrls: ['./submenu.component.css']
})
export class SubmenuComponent implements OnInit {

    @Input() structure: any;
    st: SoftwareType;

    constructor() {
    }

    ngOnInit() {
    }
}
