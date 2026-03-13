import {Component, computed, input, linkedSignal, output} from "@angular/core";
import {Util} from "../../classes/util";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";

@Component({
    selector: 'hex-input-field',
    templateUrl: 'hex-input-field.component.html',
    styleUrls: ['hex-input-field.component.css'],
    standalone: false
})
export class HexInputFieldComponent {

    model = input(0);
    placeholder = input('');
    digits = input(4);

    protected value = linkedSignal(() => {
        const value = this.model();
        return isNaN(value) ? '' : Util.toHexWordShort(value);
    });
    protected maxLength = computed(() => this.digits() + 1);

    modelChange = output<number>();

    constructor(
        private commandDispatcherService: CommandDispatcherService
    ) {}

    onChange() {
        this.modelChange.emit(Util.parseHexNumber(this.value()));
    }

    onFocus() {
        this.commandDispatcherService.stopKeyboard();
    }

    onBlur() {
        this.commandDispatcherService.startKeyboard();
    }
}
