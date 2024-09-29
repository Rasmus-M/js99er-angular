import {Injectable} from "@angular/core";
import {Settings} from "../classes/settings";

export interface ConfigObject {
    sidePanelVisible?: boolean;
    toolbarVisible?: boolean;
    settings?: Settings;
    cartName?: string;
    cartridgeURL?: string;
}

@Injectable({
    providedIn: 'root',
})
export class ConfigService {

    private _config: ConfigObject;

    get config(): ConfigObject {
        return this._config;
    }

    set config(value: any) {
        console.log("Setting config to", value);
        this._config = value;
    }
}
