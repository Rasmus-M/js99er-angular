import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from "@angular/core";
import {Util} from "../../classes/util";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";

@Component({
    selector: 'hex-input-field',
    templateUrl: 'hex-input-field.component.html',
    styleUrls: ['hex-input-field.component.css']
})
export class HexInputFieldComponent implements OnChanges {

    @Input() model: number;
    @Input() placeholder: string;
    @Output() modelChange = new EventEmitter<number>();

    protected value: string;

    constructor(
        private commandDispatcherService: CommandDispatcherService
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['model']) {
            this.value = isNaN(this.model) ? '' : Util.toHexWordShort(this.model);
        }
    }

    onChange(value: any) {
        this.model = Util.parseHexNumber(value);
        this.modelChange.emit(this.model);
    }

    onFocus() {
        this.commandDispatcherService.stopKeyboard();
    }

    onBlur() {
        this.commandDispatcherService.startKeyboard();
    }
}
