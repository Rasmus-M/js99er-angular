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
    @Input() digits: number;
    @Output() modelChange = new EventEmitter<number>();

    protected value: string;
    protected maxLength = 5;

    constructor(
        private commandDispatcherService: CommandDispatcherService
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['model']) {
            this.value = isNaN(this.model) ? '' : Util.toHexWordShort(this.model);
        }
        if (changes['digits']) {
            this.maxLength = this.digits + 1;
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
