# JS99'er

This is the new version of js99er.net developed using Angular and TypeScript. Try it [here](https://js99er.net).

This project was originally generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.3.

## Setting up the development environment

* Clone the repository to a folder on your computer
* Install [Node.js](https://nodejs.org) 
* Install Angular CLI: ``npm install -g @angular/cli``
* Change to the directory containing the source code and install the dependencies: ``npm install``
* Run js99er locally by typing: ``ng serve``
* Open a browser and enter the address: ``http://localhost:4200``

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Embedding into a website

First build the project. Then edit the dist/index.html file and insert a config attribute into the js99er element, e.g.:

```
<js99er config='{"sidePanelVisible": false, "toolbarVisible": false, "cartridgeURL": "my-folder/my-cart.rpk", "settings": {}}'></js99er>
```

The config attribute is formatted as a JSON object. Setting both sidePanelVisible and toolbarVisible to false will disable the JS99er UI leaving only the console canvas.

The settings object may contain the following properties, shown here with the defaults:

```
"settings": {
    "SoundEnabled": true,
    "SpeechEnabled": true,
    "32KRAMEnabled": true,
    "F18AEnabled": false,
    "PCKeyboardEnabled": false,
    "MapArrowKeysEnabled": false,
    "GoogleDriveEnabled": false,
    "SAMSEnabled": false,
    "GRAMEnabled": false,
    "PixelatedEnabled": false,
    "PauseOnFocusLostEnabled": false,
    "TIPIEnabled": false,
    "DebugResetEnabled": false,
    "H264CodexEnabled": false,
    "FastTIPIMouseEnabled": false
}
```
