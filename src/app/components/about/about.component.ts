import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

    @Input() title: string;
    @Input() version: string;
    @Input() date: string;

    constructor() {
    }

    ngOnInit() {
    }
}
