import {Component, computed, effect, input, output, signal} from "@angular/core";
import {Util} from "../../classes/util";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";
import {toObservable} from "@angular/core/rxjs-interop";

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
    modelChange = output<number>();

    protected value = signal('');
    protected maxLength = computed(() => this.digits() + 1);

    constructor(
        private commandDispatcherService: CommandDispatcherService
    ) {
        toObservable(this.model).subscribe(
            value => {
                this.value.set(isNaN(value) ? '' : Util.toHexWordShort(value));
            }
        );
    }

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
