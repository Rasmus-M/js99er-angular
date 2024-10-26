import {Component, ElementRef, OnInit} from "@angular/core";
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from "@angular/material/tooltip";
import {ConfigService} from "./services/config.service";

export const customTooltipDefaults: MatTooltipDefaultOptions = {
    showDelay: 1000,
    hideDelay: 0,
    touchendHideDelay: 0
};

@Component({
    selector: 'js99er',
    templateUrl: './js99er.component.html',
    styleUrls: ['./js99er.component.css'],
    providers: [
        {provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: customTooltipDefaults}
    ]
})
export class Js99erComponent implements OnInit {

    static readonly TITLE = "JS99'er";
    static readonly VERSION = "12.5.0";
    static readonly DATE = "October 26, 2024";

    constructor(
        private elm: ElementRef,
        private configService: ConfigService
    ) {
    }

    ngOnInit(): void {
        const configAttr = this.elm.nativeElement.getAttribute("config");
        if (configAttr) {
            this.configService.config = JSON.parse(configAttr);
        }
    }
}
