import {Component} from '@angular/core';
import {CommandService} from './command.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    providers: [CommandService]
})
export class AppComponent {
    title = "JS99'er";
}
