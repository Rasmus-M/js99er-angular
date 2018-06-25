import {AfterViewInit, Component, ElementRef, OnInit} from '@angular/core';
import * as $ from 'jquery';
import * as imageMapResize from 'image-map-resizer';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';

@Component({
    selector: 'app-keyboard',
    templateUrl: './keyboard.component.html',
    styleUrls: ['./keyboard.component.css']
})
export class KeyboardComponent implements OnInit, AfterViewInit {

    constructor(
        private element: ElementRef,
        private commandDispatcherService: CommandDispatcherService
    ) {}

    ngOnInit() {
    }

    ngAfterViewInit() {
        const that = this;
        const map = this.element.nativeElement.querySelector('map');
        const $map = $(map);
        $map.find('#key0').on('click', () => {
            virtualKeyPress(48);
        });
        $map.find('#key1').on('click', () => {
            virtualKeyPress(49);
        });
        $map.find('#key2').on('click', () => {
            virtualKeyPress(50);
        });
        $map.find('#key3').on('click', () => {
            virtualKeyPress(51);
        });
        $map.find('#key4').on('click', () => {
            virtualKeyPress(52);
        });
        $map.find('#key5').on('click', () => {
            virtualKeyPress(53);
        });
        $map.find('#key6').on('click', () => {
            virtualKeyPress(54);
        });
        $map.find('#key7').on('click', () => {
            virtualKeyPress(55);
        });
        $map.find('#key8').on('click', () => {
            virtualKeyPress(56);
        });
        $map.find('#key9').on('click', () => {
            virtualKeyPress(57);
        });
        $map.find('#keyA').on('click', () => {
            virtualKeyPress(65);
        });
        $map.find('#keyB').on('click', () => {
            virtualKeyPress(66);
        });
        $map.find('#keyC').on('click', () => {
            virtualKeyPress(67);
        });
        $map.find('#keyD').on('click', () => {
            virtualKeyPress(68);
        });
        $map.find('#keyE').on('click', () => {
            virtualKeyPress(69);
        });
        $map.find('#keyF').on('click', () => {
            virtualKeyPress(70);
        });
        $map.find('#keyG').on('click', () => {
            virtualKeyPress(71);
        });
        $map.find('#keyH').on('click', () => {
            virtualKeyPress(72);
        });
        $map.find('#keyI').on('click', () => {
            virtualKeyPress(73);
        });
        $map.find('#keyJ').on('click', () => {
            virtualKeyPress(74);
        });
        $map.find('#keyK').on('click', () => {
            virtualKeyPress(75);
        });
        $map.find('#keyL').on('click', () => {
            virtualKeyPress(76);
        });
        $map.find('#keyM').on('click', () => {
            virtualKeyPress(77);
        });
        $map.find('#keyN').on('click', () => {
            virtualKeyPress(78);
        });
        $map.find('#keyO').on('click', () => {
            virtualKeyPress(79);
        });
        $map.find('#keyP').on('click', () => {
            virtualKeyPress(80);
        });
        $map.find('#keyQ').on('click', () => {
            virtualKeyPress(81);
        });
        $map.find('#keyR').on('click', () => {
            virtualKeyPress(82);
        });
        $map.find('#keyS').on('click', () => {
            virtualKeyPress(83);
        });
        $map.find('#keyT').on('click', () => {
            virtualKeyPress(84);
        });
        $map.find('#keyU').on('click', () => {
            virtualKeyPress(85);
        });
        $map.find('#keyV').on('click', () => {
            virtualKeyPress(86);
        });
        $map.find('#keyW').on('click', () => {
            virtualKeyPress(87);
        });
        $map.find('#keyX').on('click', () => {
            virtualKeyPress(88);
        });
        $map.find('#keyY').on('click', () => {
            virtualKeyPress(89);
        });
        $map.find('#keyZ').on('click', () => {
            virtualKeyPress(90);
        });
        $map.find('#keyEquals').on('click', () => {
            virtualKeyPress(187);
        });
        $map.find('#keyDiv').on('click', () => {
            virtualKeyPress(189);
        });
        $map.find('#keySemicolon').on('click', () => {
            virtualKeyPress(186);
        });
        $map.find('#keyEnter').on('click', () => {
            virtualKeyPress(13);
        });
        $map.find('#keyComma').on('click', () => {
            virtualKeyPress(188);
        });
        $map.find('#keyFullStop').on('click', () => {
            virtualKeyPress(190);
        });
        $map.find('#keySpace').on('click', () => {
            virtualKeyPress(32);
        });
        $map.find('#keyLShift').on('click', () => {
            virtualKeyPress(16);
        });
        $map.find('#keyRShift').on('click', () => {
            virtualKeyPress(16);
        });
        $map.find('#keyCtrl').on('click', () => {
            virtualKeyPress(17);
        });
        $map.find('#keyFctn').on('click', () => {
            virtualKeyPress(18);
        });
        $map.find('#keyAlpha').on('click', () => {
            virtualKeyPress(20);
        });
        imageMapResize(map);

        function virtualKeyPress(keyCode: number) {
            that.commandDispatcherService.pressKey(keyCode);
        }
    }
}

