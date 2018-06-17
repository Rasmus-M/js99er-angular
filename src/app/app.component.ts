import {Component} from '@angular/core';
import {CommandDispatcherService} from './command-dispatcher.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    providers: [CommandDispatcherService]
})
export class AppComponent {
    title = "JS99'er";
}
