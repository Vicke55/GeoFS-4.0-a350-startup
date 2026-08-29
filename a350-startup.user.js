// ==UserScript==
// @name         GeoFS A350 Startup v0.5
// @namespace    Vicke55
// @version      0.5.1
// @description  Airbus A350 Startup Panel for GeoFS
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log('[A350] =================================');
    console.log('[A350] GeoFS A350 Startup v0.5.1');
    console.log('[A350] =================================');

    // ============================================================
    // GITHUB
    // ============================================================

    const GITHUB_BASE =
        'https://raw.githubusercontent.com/Vicke55/geofs-a350-startup/main/';

    const IMAGE_BASE = GITHUB_BASE + 'images/';
    const SOUND_BASE = GITHUB_BASE + 'sounds/';
    const CLICK_SOUND = SOUND_BASE + 'cockpit-click.mp3';

    // ============================================================
    // IMAGE SETTINGS
    // ============================================================

    const IMAGE_COUNT = 32;

    const IMAGE_WIDTH = 1414;
    const IMAGE_HEIGHT = 2000;

    // EXACT IMAGE CROP
    const CROP_TOP = 870;
    const CROP_BOTTOM = 1700;

    // ============================================================
    // DELAYS
    // ============================================================

    const EXT_DELAY = 3000;
    const APU_START_DELAY = 3000;

    // ============================================================
    // STATE
    // ============================================================

    const state = {

        open: false,

        image: 1,

        // --------------------------------------------------------
        // ELECTRICAL
        // --------------------------------------------------------

        bat1: false,
        bat2: false,

        ext1: false,
        ext2: false,

        extConnected: false,
        extBusy: false,

        // --------------------------------------------------------
        // FUEL
        // --------------------------------------------------------

        fuelPumps: [
            false,
            false,
            false,
            false,
            false,
            false
        ],

        // --------------------------------------------------------
        // APU
        // --------------------------------------------------------

        apuMaster: false,
        apuStart: false,
        apuAvailable: false,
        apuGen: false,
        apuBleed: false,

        apuTimer: null,
        apuStartToken: 0,

        // --------------------------------------------------------
        // ENGINES
        // --------------------------------------------------------

        engMode: 'NORM',

        eng1Started: false,
        eng2Started: false,

        eng1Bleed: true,
        eng2Bleed: true,

        // --------------------------------------------------------
        // PACKS
        // --------------------------------------------------------

        pack1: true,
        pack2: true,

        // --------------------------------------------------------
        // SOUND
        // --------------------------------------------------------

        soundEnabled: true
    };

    // ============================================================
    // CHECKLIST
    // ============================================================

    const checklist = {

        beforeStart: [

            {
                text: 'Battery 1 and 2',
                info: 'Press BAT 1 and BAT 2 which both are located to the left in the ELEC section.'
            },

            {
                text: 'Connect EXT (if not already connected)',
                info: 'Open ground and press connect.'
            },

            {
                text: 'Turn on EXT 1 and 2 (when they show AVAIL)',
                info: 'Press EXT 1 and EXT 2 which are found to the right of BAT 2.'
            },

            {
                text: 'Turn on the fuel pumps',
                info: 'Press all the buttons on the top of the panel from left to right.'
            },

            {
                text: 'APU Master on',
                info: 'Press the MASTER SWITCH which is located in the top of the APU section.'
            },

            {
                text: 'APU Start     Click twice',
                info: 'Press the START button under the MASTER SWITCH in the APU section.'
            },

            {
                text: 'APU Gen (wait until the APU start shows AVAIL)',
                info: 'Press the button labeled APU GEN to the right in the ELEC section.'
            },

            {
                text: 'APU Bleed on',
                info: 'Press APU BLEED which is in the middle of the AIR section.'
            },

            {
                text: 'Turn off EXT 1 and 2',
                info: 'Press EXT 1 and EXT 2 in the middle of the ELEC section.'
            },

            {
                text: 'Disconnect EXT',
                info: 'Open ground and press disconnect.'
            },

            {
                text: 'ENG Mode selector to IGN/START (wait until EXT 1 and 2 is dark)',
                info: 'Press on the switch in the middle of the box in the bottom right.'
            },

            {
                text: 'Start ENG 2     Click twice',
                info: 'Press ENG 2.'
            },

            {
                text: 'Start ENG 1 (wait until ENG 2 has turned on)     Click twice',
                info: 'Press ENG 1.'
            }
        ],

        afterStart: [

            {
                text: 'ENG Mode selector to NORM (wait until ENG 1 and 2 is fully turned on)',
                info: 'Press on the switch in the middle of the box in the bottom right.'
            },

            {
                text: 'ENG 1 and 2 BLEED on',
                info: 'Press ENG 1 BLEED and ENG 2 BLEED in the top of the AIR section.'
            },

            {
                text: 'Pack 1 and 2 on',
                info: 'Press PACK 1 and 2 in the bottom of the AIR section.'
            },

            {
                text: 'APU BLEED off',
                info: 'Press APU BLEED which is in the middle of the AIR section.'
            },

            {
                text: 'APU GEN off',
                info: 'Press APU GEN in ELEC section.'
            },

            {
                text: 'APU MASTER off',
                info: 'Press APU MASTER in the APU section.'
            },

            {
                text: 'FLAPS',
                info: 'Test all flap positions and leave it on 1 or 2 after. Press F.'
            },

            {
                text: 'SPOILERS',
                info: 'Test all 3 spoiler positions and leave it ARMED. Press B.'
            },

            {
                text: 'CONTROL',
                info: 'Test controls by moving mouse or joystick up, down, left and right.'
            }
        ]
    };

    // ============================================================
    // CSS
    // ============================================================

    const style = document.createElement('style');

    style.textContent = `

        #a350-startup-overlay {
            position: fixed;
            inset: 0;
            z-index: 999990;
            display: none;
            pointer-events: none;
        }

        #a350-startup-window {
            position: absolute;

            top: 50%;
            left: 50%;

            transform: translate(-50%, -50%);

            width: 92vw;
            height: 88vh;

            display: flex;

            background: rgba(10, 10, 10, 0.96);

            border: 1px solid #555;
            border-radius: 6px;

            box-shadow:
                0 10px 40px rgba(0, 0, 0, 0.85);

            overflow: hidden;

            pointer-events: auto;
        }

        #a350-left {
            width: 340px;
            flex-shrink: 0;

            display: flex;
            flex-direction: column;

            background: rgba(18, 18, 18, 0.98);

            border-right: 1px solid #555;

            color: white;

            font-family: Arial, sans-serif;
        }

        #a350-left-header {
            padding: 16px;
            border-bottom: 1px solid #444;
        }

        #a350-title {
            font-size: 20px;
            font-weight: bold;
        }

        #a350-version {
            margin-top: 3px;
            color: #888;
            font-size: 11px;
        }

        #a350-tabs {
            display: flex;
            border-bottom: 1px solid #444;
        }

        .a350-tab {
            flex: 1;

            height: 38px;

            border: none;

            background: transparent;

            color: #aaa;

            font-family: Arial, sans-serif;
            font-size: 11px;
            font-weight: bold;

            cursor: pointer;
        }

        .a350-tab:hover {
            background: rgba(255,255,255,0.05);
            color: white;
        }

        .a350-tab.active {
            color: white;
            background: rgba(255,255,255,0.08);
        }

        #a350-checklist-content {
            flex: 1;
            overflow-y: auto;
            padding: 14px;
        }

        #a350-observation {
            margin-bottom: 18px;

            padding: 9px 10px;

            background: rgba(70,70,70,0.25);

            border: 1px solid #666;
            border-radius: 4px;

            color: #ddd;

            font-size: 11px;
            font-weight: bold;
            line-height: 1.4;
        }

        .a350-section-title {
            margin-bottom: 10px;
            color: #bbb;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .a350-check-item {
            margin-bottom: 12px;
            color: #eee;
            font-size: 13px;
            line-height: 1.3;
        }

        .a350-check-main {
            display: flex;
            align-items: flex-start;
            gap: 7px;
        }

        .a350-check-main input {
            width: 16px;
            height: 16px;

            margin: 0;

            flex-shrink: 0;

            cursor: pointer;
        }

        .a350-check-text {
            flex: 1;
            cursor: pointer;
        }

        .a350-check-item.checked .a350-check-text {
            color: #777;
            text-decoration: line-through;
        }

        .a350-more-info {
            margin-left: 3px;
            margin-top: 0;

            padding: 0;

            background: transparent;

            border: none;

            color: #999;

            font-family: Arial, sans-serif;
            font-size: 11px;

            cursor: pointer;

            white-space: nowrap;
        }

        .a350-more-info:hover {
            color: white;
            text-decoration: underline;
        }

        .a350-info-text {
            display: none;

            margin-left: 23px;
            margin-top: 5px;
            padding: 7px 8px;

            background: rgba(0,0,0,0.35);

            border-left: 2px solid #666;

            color: #aaa;

            font-size: 11px;
            line-height: 1.4;
        }

        .a350-info-text.visible {
            display: block;
        }

        .a350-checklist-reset {
            width: 100%;

            margin-top: 15px;
            margin-bottom: 10px;

            padding: 9px;

            background: #222;

            border: 1px solid #666;
            border-radius: 4px;

            color: white;

            font-family: Arial, sans-serif;
            font-size: 11px;
            font-weight: bold;

            cursor: pointer;
        }

        .a350-checklist-reset:hover {
            background: #333;
        }

        #a350-ground-controls {
            display: none;
        }

        .a350-ground-button {
            width: 100%;

            margin-bottom: 10px;

            padding: 10px;

            background: #222;

            border: 1px solid #666;
            border-radius: 4px;

            color: white;

            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: bold;

            cursor: pointer;
        }

        .a350-ground-button:hover {
            background: #333;
        }

        .a350-ground-button:disabled {
            opacity: 0.4;
            cursor: default;
        }

        #a350-ext-status {
            margin-bottom: 16px;

            padding: 9px;

            border: 1px solid #555;
            border-radius: 4px;

            background: #111;

            color: #aaa;

            text-align: center;

            font-size: 12px;
        }

        #a350-settings {
            display: none;
        }

        .a350-setting {
            margin-bottom: 18px;
            color: #ddd;
            font-size: 13px;
        }

        .a350-setting label {
            display: flex;
            align-items: center;

            gap: 8px;

            cursor: pointer;
        }

        #a350-panel-area {
            position: relative;

            flex: 1;

            min-width: 0;
            min-height: 0;

            display: flex;

            align-items: center;
            justify-content: center;

            background: #080808;

            overflow: hidden;
        }

        #a350-panel-image-wrapper {
            position: relative;

            overflow: hidden;

            cursor: crosshair;

            user-select: none;

            box-shadow:
                0 0 20px rgba(0,0,0,0.7);
        }

        #a350-panel-image {
            display: block;

            max-width: none;
            max-height: none;

            user-select: none;

            -webkit-user-drag: none;
        }

        #a350-panel-topbar {
            position: absolute;

            top: 10px;
            left: 10px;
            right: 10px;

            display: flex;

            justify-content: space-between;
            align-items: center;

            pointer-events: none;
        }

        #a350-image-number {
            padding: 6px 10px;

            background: rgba(0,0,0,0.75);

            border: 1px solid #555;
            border-radius: 4px;

            color: white;

            font-family: Arial, sans-serif;
            font-size: 12px;
        }

        #a350-close {
            width: 36px;
            height: 36px;

            background: rgba(0,0,0,0.75);

            border: 1px solid #777;
            border-radius: 4px;

            color: white;

            font-size: 20px;

            cursor: pointer;

            pointer-events: auto;
        }

        #a350-close:hover {
            background: rgba(70,70,70,0.9);
        }

        #a350-click-status {
            position: absolute;

            bottom: 10px;
            left: 50%;

            transform: translateX(-50%);

            padding: 6px 10px;

            background: rgba(0,0,0,0.75);

            border: 1px solid #555;
            border-radius: 4px;

            color: #bbb;

            font-family: Arial, sans-serif;
            font-size: 11px;

            pointer-events: none;
        }

        #a350-warning {
            display: none;

            position: absolute;

            bottom: 45px;
            left: 50%;

            transform: translateX(-50%);

            padding: 9px 14px;

            background: rgba(100,0,0,0.9);

            border: 1px solid #d33;
            border-radius: 4px;

            color: #ffb0b0;

            font-family: Arial, sans-serif;

            font-size: 12px;
            font-weight: bold;

            white-space: nowrap;

            pointer-events: none;
        }

        #a350-startup-menu-button {
            position: relative;
            z-index: 1000000;

            white-space: nowrap;
        }

        #a350-startup-menu-button.a350-forced-button {
            margin-left: 4px;
        }
    `;

    document.head.appendChild(style);

    // ============================================================
    // SOUND
    // ============================================================

    const clickSound = new Audio(CLICK_SOUND);
    clickSound.volume = 0.7;

    function playClick() {

        if (!state.soundEnabled) {
            return;
        }

        try {

            clickSound.currentTime = 0;

            const promise = clickSound.play();

            if (promise && promise.catch) {
                promise.catch(() => {});
            }

        } catch (e) {

            console.warn(
                '[A350] Click sound failed.'
            );
        }
    }

    // ============================================================
    // GEOFS
    // ============================================================

    function getAircraft() {

        if (
            typeof window.geofs === 'undefined' ||
            !window.geofs.aircraft ||
            !window.geofs.aircraft.instance
        ) {
            return null;
        }

        return window.geofs.aircraft.instance;
    }

    // ============================================================
    // ENGINE CONTROL
    // ============================================================

    function startEngine1() {

        const aircraft = getAircraft();

        if (!aircraft) {
            console.warn('[A350] Aircraft not available.');
            return false;
        }

        try {

            aircraft.startEngines(0);

            state.eng1Started = true;

            console.log(
                '[A350] ENGINE 1 START COMMAND SENT.'
            );

            return true;

        } catch (error) {

            console.error(
                '[A350] ENGINE 1 START ERROR:',
                error
            );

            return false;
        }
    }

    function startEngine2() {

        const aircraft = getAircraft();

        if (!aircraft) {
            console.warn('[A350] Aircraft not available.');
            return false;
        }

        try {

            aircraft.startEngines(1);

            state.eng2Started = true;

            console.log(
                '[A350] ENGINE 2 START COMMAND SENT.'
            );

            return true;

        } catch (error) {

            console.error(
                '[A350] ENGINE 2 START ERROR:',
                error
            );

            return false;
        }
    }

    function stopBothEngines() {

        const aircraft = getAircraft();

        if (!aircraft) {
            console.warn('[A350] Aircraft not available.');
            return false;
        }

        try {

            aircraft.stopEngines();

            state.eng1Started = false;
            state.eng2Started = false;

            return true;

        } catch (error) {

            console.error(
                '[A350] ENGINE STOP ERROR:',
                error
            );

            return false;
        }
    }

    // ============================================================
    // APU
    // ============================================================

    function clearAPUTimer() {

        if (state.apuTimer !== null) {

            clearTimeout(
                state.apuTimer
            );

            state.apuTimer = null;
        }
    }

    function startAPU() {

        if (state.apuAvailable) {

            if (state.image === 15) {
                loadImage(16);
            }

            return;
        }

        if (state.apuStart) {
            return;
        }

        state.apuStartToken++;

        const currentToken =
            state.apuStartToken;

        state.apuMaster = true;
        state.apuStart = true;
        state.apuAvailable = false;

        clearAPUTimer();

        if (state.image === 15) {
            loadImage(15);
        }

        state.apuTimer =
            setTimeout(
                function () {

                    if (
                        currentToken !==
                        state.apuStartToken
                    ) {
                        return;
                    }

                    state.apuTimer = null;

                    state.apuStart = false;
                    state.apuAvailable = true;

                    if (state.image === 15) {
                        loadImage(16);
                    }

                },
                APU_START_DELAY
            );
    }

    // ============================================================
    // APU RESET
    // ============================================================

    function resetAPU() {

        state.apuStartToken++;

        clearAPUTimer();

        state.apuMaster = false;
        state.apuStart = false;
        state.apuAvailable = false;
        state.apuGen = false;
        state.apuBleed = false;
    }

    // ============================================================
    // COLD & DARK RESET
    // ============================================================

    function applyColdAndDark() {

        stopBothEngines();

        resetAPU();

        state.bat1 = false;
        state.bat2 = false;

        state.ext1 = false;
        state.ext2 = false;

        state.extConnected = false;
        state.extBusy = false;

        state.fuelPumps = [
            false,
            false,
            false,
            false,
            false,
            false
        ];

        state.eng1Started = false;
        state.eng2Started = false;

        state.image = 1;

        loadImage(1);

        updateEXTUI();

        console.log(
            '[A350] COLD & DARK RESET COMPLETE.'
        );
    }

    // ============================================================
    // EXT CONTROL
    // ============================================================

    async function connectEXT() {

        if (state.extBusy || state.extConnected) {
            return;
        }

        state.extBusy = true;

        updateEXTUI();

        await wait(EXT_DELAY);

        state.ext1 = true;
        state.ext2 = true;

        state.extConnected = true;
        state.extBusy = false;

        updateEXTUI();

        if (state.image === 3) {
            loadImage(5);
        }
    }

    async function disconnectEXT() {

        if (state.extBusy || !state.extConnected) {
            return;
        }

        state.extBusy = true;

        updateEXTUI();

        await wait(EXT_DELAY);

        state.ext1 = false;
        state.ext2 = false;

        state.extConnected = false;
        state.extBusy = false;

        updateEXTUI();

        if (state.image === 20) {
            loadImage(21);
        }
    }

    function updateEXTUI() {

        const status =
            document.getElementById(
                'a350-ext-status'
            );

        const connect =
            document.getElementById(
                'a350-ext-connect'
            );

        const disconnect =
            document.getElementById(
                'a350-ext-disconnect'
            );

        if (!status) {
            return;
        }

        if (state.extBusy) {

            status.textContent =
                'EXT PWR — CONNECTING / DISCONNECTING...';

        } else if (state.extConnected) {

            status.textContent =
                'EXT PWR — CONNECTED';

        } else {

            status.textContent =
                'EXT PWR — DISCONNECTED';
        }

        if (connect) {

            connect.disabled =
                state.extBusy ||
                state.extConnected;
        }

        if (disconnect) {

            disconnect.disabled =
                state.extBusy ||
                !state.extConnected;
        }
    }

    // ============================================================
    // IMAGE FLOW
    // ============================================================

    function getNextImage() {

        const current = state.image;

        if (current === 1) {
            return state.extConnected ? 4 : 2;
        }

        if (current === 2) {
            return 3;
        }

        if (current === 3) {

            if (!state.extConnected) {

                showWarning(
                    'CONNECT EXT TO CONTINUE'
                );

                return null;
            }

            return 5;
        }

        if (current === 4) {
            return 5;
        }

        if (current === 5) {
            return 6;
        }

        if (
            current >= 6 &&
            current < 15
        ) {
            return current + 1;
        }

        if (current === 15) {

            if (!state.apuAvailable) {

                startAPU();

                return null;
            }

            return 16;
        }

        if (
            current >= 16 &&
            current < 20
        ) {
            return current + 1;
        }

        if (current === 20) {

            if (state.extConnected) {

                showWarning(
                    'DISCONNECT EXT TO CONTINUE'
                );

                return null;
            }

            return 21;
        }

        if (
            current >= 21 &&
            current < IMAGE_COUNT
        ) {
            return current + 1;
        }

        return null;
    }

    // ============================================================
    // END OF STARTUP
    // ============================================================

    function finishStartup() {

        stopBothEngines();

        state.image = 1;

        hideWarning();

        loadImage(1);
    }

    function advanceImage() {

        hideWarning();

        if (state.image === IMAGE_COUNT) {

            finishStartup();

            return;
        }

        const next = getNextImage();

        if (next === null) {
            return;
        }

        loadImage(next);
    }

    // ============================================================
    // IMAGE LOADING / CROPPING / SCALING
    // ============================================================

    function loadImage(number) {

        number = Math.max(
            1,
            Math.min(
                IMAGE_COUNT,
                number
            )
        );

        state.image = number;

        const image =
            document.getElementById(
                'a350-panel-image'
            );

        const wrapper =
            document.getElementById(
                'a350-panel-image-wrapper'
            );

        const panelArea =
            document.getElementById(
                'a350-panel-area'
            );

        if (!image || !wrapper || !panelArea) {
            return;
        }

        updateImageNumber();

        image.onload = function () {

            const cropHeight =
                CROP_BOTTOM - CROP_TOP;

            if (cropHeight <= 0) {

                console.error(
                    '[A350] Invalid crop settings.'
                );

                return;
            }

            const panelWidth =
                panelArea.clientWidth;

            const panelHeight =
                panelArea.clientHeight;

            if (
                panelWidth <= 0 ||
                panelHeight <= 0
            ) {
                return;
            }

            /*
             * The visible image is:
             *
             * WIDTH  = 1414 px
             * HEIGHT = 830 px
             *
             * Scale is calculated from BOTH dimensions.
             *
             * This prevents the 1414 px image width
             * from being cut off at the sides.
             */

            const availableHeight =
                panelHeight * 0.96;

            const availableWidth =
                panelWidth - 20;

            const scaleByHeight =
                availableHeight / cropHeight;

            const scaleByWidth =
                availableWidth / IMAGE_WIDTH;

            const scale =
                Math.min(
                    scaleByHeight,
                    scaleByWidth
                );

            const scaledWidth =
                IMAGE_WIDTH * scale;

            const scaledHeight =
                IMAGE_HEIGHT * scale;

            const visibleHeight =
                cropHeight * scale;

            /*
             * Wrapper contains ONLY the visible
             * 870 -> 1700 section.
             */

            wrapper.style.width =
                scaledWidth + 'px';

            wrapper.style.height =
                visibleHeight + 'px';

            /*
             * Original image keeps its complete
             * 1414 x 2000 proportions.
             */

            image.style.width =
                scaledWidth + 'px';

            image.style.height =
                scaledHeight + 'px';

            /*
             * Move original image upward so
             * original pixel 870 becomes the
             * first visible pixel.
             */

            image.style.transform =
                'translateY(-' +
                (CROP_TOP * scale) +
                'px)';

            image.style.transformOrigin =
                'top left';

            updateImageNumber();

            console.log(
                '[A350] Image loaded:',
                number,
                '| scale:',
                scale,
                '| width:',
                scaledWidth,
                '| visible height:',
                visibleHeight,
                '| crop:',
                CROP_TOP,
                '-',
                CROP_BOTTOM
            );
        };

        image.onerror = function () {

            console.error(
                '[A350] IMAGE LOAD ERROR:',
                IMAGE_BASE +
                number +
                '.png'
            );
        };

        image.src =
            IMAGE_BASE +
            number +
            '.png';

        console.log(
            '[A350] IMAGE:',
            number
        );
    }

    function updateImageNumber() {

        const element =
            document.getElementById(
                'a350-image-number'
            );

        if (!element) {
            return;
        }

        element.textContent =
            'IMAGE ' +
            state.image +
            ' / ' +
            IMAGE_COUNT;
    }

    // ============================================================
    // WARNING
    // ============================================================

    function showWarning(text) {

        const warning =
            document.getElementById(
                'a350-warning'
            );

        if (!warning) {
            return;
        }

        warning.textContent = text;
        warning.style.display = 'block';
    }

    function hideWarning() {

        const warning =
            document.getElementById(
                'a350-warning'
            );

        if (!warning) {
            return;
        }

        warning.style.display = 'none';
    }

    // ============================================================
    // CHECKLIST UI
    // ============================================================

    function createChecklistItem(item, container) {

        const wrapper =
            document.createElement('div');

        wrapper.className =
            'a350-check-item';

        const main =
            document.createElement('div');

        main.className =
            'a350-check-main';

        const checkbox =
            document.createElement('input');

        checkbox.type =
            'checkbox';

        const text =
            document.createElement('span');

        text.className =
            'a350-check-text';

        text.textContent =
            item.text;

        const infoButton =
            document.createElement('button');

        infoButton.type =
            'button';

        infoButton.className =
            'a350-more-info';

        infoButton.textContent =
            '[ More info ]';

        const info =
            document.createElement('div');

        info.className =
            'a350-info-text';

        info.textContent =
            item.info;

        checkbox.addEventListener(
            'change',
            function () {

                wrapper.classList.toggle(
                    'checked',
                    checkbox.checked
                );

                console.log(
                    '[A350] CHECKLIST:',
                    item.text,
                    checkbox.checked
                        ? 'CHECKED'
                        : 'UNCHECKED'
                );
            }
        );

        infoButton.addEventListener(
            'click',
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                playClick();

                const visible =
                    info.classList.contains(
                        'visible'
                    );

                info.classList.toggle(
                    'visible',
                    !visible
                );
            }
        );

        main.appendChild(checkbox);
        main.appendChild(text);
        main.appendChild(infoButton);

        wrapper.appendChild(main);
        wrapper.appendChild(info);

        container.appendChild(wrapper);
    }

    function createChecklistSection(
        title,
        items,
        container
    ) {

        const titleElement =
            document.createElement('div');

        titleElement.className =
            'a350-section-title';

        titleElement.textContent =
            title;

        container.appendChild(
            titleElement
        );

        items.forEach(
            function (item) {

                createChecklistItem(
                    item,
                    container
                );
            }
        );
    }

    function resetChecklist() {

        const checkboxes =
            document.querySelectorAll(
                '#a350-checklist-content input[type="checkbox"]'
            );

        checkboxes.forEach(
            function (checkbox) {

                checkbox.checked = false;

                const item =
                    checkbox.closest(
                        '.a350-check-item'
                    );

                if (item) {

                    item.classList.remove(
                        'checked'
                    );
                }
            }
        );

        console.log(
            '[A350] CHECKLIST RESET.'
        );
    }

    // ============================================================
    // TABS
    // ============================================================

    function showTab(tab) {

        const checklistContent =
            document.getElementById(
                'a350-checklist-content'
            );

        const ground =
            document.getElementById(
                'a350-ground-controls'
            );

        const settings =
            document.getElementById(
                'a350-settings'
            );

        const tabs =
            document.querySelectorAll(
                '.a350-tab'
            );

        tabs.forEach(
            function (button) {

                button.classList.toggle(
                    'active',
                    button.dataset.tab === tab
                );
            }
        );

        if (checklistContent) {

            checklistContent.style.display =
                tab === 'before'
                    ? 'block'
                    : 'none';
        }

        if (ground) {

            ground.style.display =
                tab === 'ground'
                    ? 'block'
                    : 'none';
        }

        if (settings) {

            settings.style.display =
                tab === 'settings'
                    ? 'block'
                    : 'none';
        }
    }

    // ============================================================
    // PANEL UI
    // ============================================================

    function createPanel() {

        if (
            document.getElementById(
                'a350-startup-overlay'
            )
        ) {
            return;
        }

        const overlay =
            document.createElement('div');

        overlay.id =
            'a350-startup-overlay';

        const windowElement =
            document.createElement('div');

        windowElement.id =
            'a350-startup-window';

        // ========================================================
        // LEFT
        // ========================================================

        const left =
            document.createElement('div');

        left.id =
            'a350-left';

        left.innerHTML = `

            <div id="a350-left-header">

                <div id="a350-title">
                    A350 STARTUP
                </div>

                <div id="a350-version">
                    v0.5.1
                </div>

            </div>

            <div id="a350-tabs">

                <button
                    class="a350-tab active"
                    data-tab="before"
                >
                    CHECKLIST
                </button>

                <button
                    class="a350-tab"
                    data-tab="ground"
                >
                    GROUND
                </button>

                <button
                    class="a350-tab"
                    data-tab="settings"
                >
                    SETTINGS
                </button>

            </div>
        `;

        // ========================================================
        // CHECKLIST
        // ========================================================

        const checklistContent =
            document.createElement('div');

        checklistContent.id =
            'a350-checklist-content';

        const observation =
            document.createElement('div');

        observation.id =
            'a350-observation';

        observation.textContent =
            'OBS! Every button has to be pushed from left to right (except the engines)';

        checklistContent.appendChild(
            observation
        );

        createChecklistSection(
            'Before Start',
            checklist.beforeStart,
            checklistContent
        );

        const afterTitle =
            document.createElement('div');

        afterTitle.className =
            'a350-section-title';

        afterTitle.style.marginTop =
            '24px';

        afterTitle.textContent =
            'After Start';

        checklistContent.appendChild(
            afterTitle
        );

        checklist.afterStart.forEach(
            function (item) {

                createChecklistItem(
                    item,
                    checklistContent
                );
            }
        );

        const checklistReset =
            document.createElement('button');

        checklistReset.type =
            'button';

        checklistReset.className =
            'a350-checklist-reset';

        checklistReset.textContent =
            'RESET CHECKLIST';

        checklistReset.addEventListener(
            'click',
            function () {

                playClick();

                resetChecklist();
            }
        );

        checklistContent.appendChild(
            checklistReset
        );

        left.appendChild(
            checklistContent
        );

        // ========================================================
        // GROUND
        // ========================================================

        const ground =
            document.createElement('div');

        ground.id =
            'a350-ground-controls';

        ground.style.padding =
            '14px';

        ground.innerHTML = `

            <div class="a350-section-title">
                GROUND
            </div>

            <div id="a350-ext-status">
                EXT PWR — DISCONNECTED
            </div>

            <button
                id="a350-ext-connect"
                class="a350-ground-button"
            >
                CONNECT EXT PWR
            </button>

            <button
                id="a350-ext-disconnect"
                class="a350-ground-button"
                disabled
            >
                DISCONNECT EXT PWR
            </button>

        `;

        left.appendChild(
            ground
        );

        // ========================================================
        // SETTINGS
        // ========================================================

        const settings =
            document.createElement('div');

        settings.id =
            'a350-settings';

        settings.style.padding =
            '14px';

        settings.innerHTML = `

            <div class="a350-section-title">
                SETTINGS
            </div>

            <div class="a350-setting">

                <label>

                    <input
                        id="a350-sound-toggle"
                        type="checkbox"
                        checked
                    >

                    Cockpit click sound

                </label>

            </div>

            <div class="a350-setting">

                <button
                    id="a350-cold-dark-reset"
                    class="a350-ground-button"
                >
                    APPLY COLD & DARK
                </button>

            </div>

        `;

        left.appendChild(
            settings
        );

        // ========================================================
        // TAB EVENTS
        // ========================================================

        left.querySelectorAll(
            '.a350-tab'
        ).forEach(
            function (button) {

                button.addEventListener(
                    'click',
                    function () {

                        playClick();

                        showTab(
                            button.dataset.tab
                        );
                    }
                );
            }
        );

        // ========================================================
        // EXT EVENTS
        // ========================================================

        left.querySelector(
            '#a350-ext-connect'
        ).addEventListener(
            'click',
            function () {

                playClick();

                connectEXT();
            }
        );

        left.querySelector(
            '#a350-ext-disconnect'
        ).addEventListener(
            'click',
            function () {

                playClick();

                disconnectEXT();
            }
        );

        // ========================================================
        // SOUND SETTING
        // ========================================================

        left.querySelector(
            '#a350-sound-toggle'
        ).addEventListener(
            'change',
            function () {

                state.soundEnabled =
                    this.checked;
            }
        );

        // ========================================================
        // COLD & DARK RESET
        // ========================================================

        left.querySelector(
            '#a350-cold-dark-reset'
        ).addEventListener(
            'click',
            function () {

                playClick();

                applyColdAndDark();
            }
        );

        // ========================================================
        // PANEL
        // ========================================================

        const panelArea =
            document.createElement('div');

        panelArea.id =
            'a350-panel-area';

        const wrapper =
            document.createElement('div');

        wrapper.id =
            'a350-panel-image-wrapper';

        const image =
            document.createElement('img');

        image.id =
            'a350-panel-image';

        image.draggable =
            false;

        wrapper.appendChild(
            image
        );

        panelArea.appendChild(
            wrapper
        );

        // ========================================================
        // TOPBAR
        // ========================================================

        const topbar =
            document.createElement('div');

        topbar.id =
            'a350-panel-topbar';

        const imageNumber =
            document.createElement('div');

        imageNumber.id =
            'a350-image-number';

        const close =
            document.createElement('button');

        close.id =
            'a350-close';

        close.type =
            'button';

        close.textContent =
            '×';

        close.addEventListener(
            'click',
            function () {

                playClick();

                closePanel();
            }
        );

        topbar.appendChild(
            imageNumber
        );

        topbar.appendChild(
            close
        );

        panelArea.appendChild(
            topbar
        );

        // ========================================================
        // STATUS
        // ========================================================

        const clickStatus =
            document.createElement('div');

        clickStatus.id =
            'a350-click-status';

        clickStatus.textContent =
            'Click panel';

        panelArea.appendChild(
            clickStatus
        );

        // ========================================================
        // WARNING
        // ========================================================

        const warning =
            document.createElement('div');

        warning.id =
            'a350-warning';

        panelArea.appendChild(
            warning
        );

        // ========================================================
        // PANEL CLICK
        // ========================================================

        wrapper.addEventListener(
            'click',
            function () {

                playClick();

                clickStatus.textContent =
                    'Panel clicked — image ' +
                    state.image;

                // IMAGE 32
                if (state.image === IMAGE_COUNT) {

                    finishStartup();

                    return;
                }

                // IMAGE 15 = APU START
                if (state.image === 15) {

                    if (!state.apuAvailable) {

                        startAPU();

                        return;
                    }

                    advanceImage();

                    return;
                }

                // IMAGE 23 = ENGINE 2
                if (state.image === 23) {

                    if (!state.eng2Started) {

                        const started =
                            startEngine2();

                        if (!started) {

                            showWarning(
                                'ENGINE 2 COULD NOT START'
                            );

                            return;
                        }

                        return;
                    }

                    advanceImage();

                    return;
                }

                // IMAGE 24 = ENGINE 1
                if (state.image === 24) {

                    if (!state.eng1Started) {

                        const started =
                            startEngine1();

                        if (!started) {

                            showWarning(
                                'ENGINE 1 COULD NOT START'
                            );

                            return;
                        }

                        return;
                    }

                    advanceImage();

                    return;
                }

                // NORMAL FLOW
                advanceImage();
            }
        );

        // ========================================================
        // ASSEMBLE
        // ========================================================

        windowElement.appendChild(
            left
        );

        windowElement.appendChild(
            panelArea
        );

        overlay.appendChild(
            windowElement
        );

        document.body.appendChild(
            overlay
        );

        loadImage(1);

        updateEXTUI();
    }

    // ============================================================
    // OPEN / CLOSE
    // ============================================================

    function openPanel() {

        createPanel();

        const overlay =
            document.getElementById(
                'a350-startup-overlay'
            );

        if (!overlay) {
            return;
        }

        overlay.style.display =
            'block';

        state.open =
            true;

        loadImage(
            state.image
        );

        console.log(
            '[A350] Panel OPEN.'
        );
    }

    function closePanel() {

        const overlay =
            document.getElementById(
                'a350-startup-overlay'
            );

        if (!overlay) {
            return;
        }

        overlay.style.display =
            'none';

        state.open =
            false;

        console.log(
            '[A350] Panel CLOSED.'
        );
    }

    function togglePanel() {

        if (state.open) {

            closePanel();

        } else {

            openPanel();
        }
    }

    // ============================================================
    // MENU BUTTON
    // ============================================================

    function createMenuButton() {

        if (
            document.getElementById(
                'a350-startup-menu-button'
            )
        ) {

            return true;
        }

        const buttons =
            Array.from(
                document.querySelectorAll(
                    'button'
                )
            );

        console.log(
            '[A350] Searching for GeoFS menu button...'
        );

        const aircraftButton =
            buttons.find(
                function (btn) {

                    return (
                        btn.textContent
                            .trim()
                            .toLowerCase() ===
                        'aircraft'
                    );
                }
            );

        const locationButton =
            buttons.find(
                function (btn) {

                    return (
                        btn.textContent
                            .trim()
                            .toLowerCase() ===
                        'location'
                    );
                }
            );

        const cameraButton =
            buttons.find(
                function (btn) {

                    return (
                        btn.textContent
                            .trim()
                            .toLowerCase() ===
                        'camera'
                    );
                }
            );

        const menuCandidates =
            buttons.filter(
                function (btn) {

                    const text =
                        btn.innerText ||
                        btn.textContent ||
                        '';

                    return (
                        text.trim().length > 0
                    );
                }
            );

        let reference =
            aircraftButton ||
            locationButton ||
            cameraButton;

        if (!reference) {

            reference =
                menuCandidates.find(
                    function (btn) {

                        const text =
                            (
                                btn.innerText ||
                                btn.textContent ||
                                ''
                            )
                            .trim()
                            .toLowerCase();

                        return (
                            text === 'aircraft' ||
                            text === 'location' ||
                            text === 'camera' ||
                            text === 'settings'
                        );
                    }
                );
        }

        if (!reference) {

            console.log(
                '[A350] GeoFS menu not ready yet.'
            );

            return false;
        }

        const button =
            document.createElement('button');

        button.id =
            'a350-startup-menu-button';

        button.type =
            'button';

        button.className =
            'mdl-button mdl-js-button';

        button.textContent =
            'A350 STARTUP';

        button.addEventListener(
            'click',
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                playClick();

                togglePanel();
            }
        );

        if (cameraButton) {

            cameraButton.insertAdjacentElement(
                'afterend',
                button
            );

        } else if (locationButton) {

            locationButton.insertAdjacentElement(
                'afterend',
                button
            );

        } else if (aircraftButton) {

            aircraftButton.insertAdjacentElement(
                'afterend',
                button
            );

        } else if (reference.parentElement) {

            reference.parentElement.appendChild(
                button
            );

        } else {

            console.warn(
                '[A350] Could not insert menu button.'
            );

            return false;
        }

        if (
            window.componentHandler &&
            window.componentHandler.upgradeElement
        ) {

            try {

                window.componentHandler.upgradeElement(
                    button
                );

            } catch (e) {

                console.warn(
                    '[A350] MDL upgrade failed.'
                );
            }
        }

        console.log(
            '[A350] ================================='
        );

        console.log(
            '[A350] A350 STARTUP MENU BUTTON ADDED.'
        );

        console.log(
            '[A350] ================================='
        );

        return true;
    }

    // ============================================================
    // WAIT
    // ============================================================

    function wait(ms) {

        return new Promise(
            function (resolve) {

                setTimeout(
                    resolve,
                    ms
                );
            }
        );
    }

    // ============================================================
    // ESC
    // ============================================================

    document.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key === 'Escape' &&
                state.open
            ) {

                closePanel();
            }
        }
    );

    // ============================================================
    // WINDOW RESIZE
    // ============================================================

    window.addEventListener(
        'resize',
        function () {

            if (state.open) {

                loadImage(
                    state.image
                );
            }
        }
    );

    // ============================================================
    // DEBUG API
    // ============================================================

    window.a350 = {

        state,

        open: openPanel,
        close: closePanel,
        toggle: togglePanel,

        image: loadImage,
        next: advanceImage,

        connectEXT,
        disconnectEXT,

        start1: startEngine1,
        start2: startEngine2,

        stop: stopBothEngines,

        startAPU,
        resetAPU,

        coldDark: applyColdAndDark,

        resetChecklist
    };

    // ============================================================
    // INITIALIZE PANEL
    // ============================================================

    createPanel();

    // ============================================================
    // INITIALIZE MENU BUTTON
    // ============================================================

    let menuAttempts = 0;

    const MAX_MENU_ATTEMPTS = 120;

    const menuTimer =
        setInterval(
            function () {

                menuAttempts++;

                if (createMenuButton()) {

                    clearInterval(
                        menuTimer
                    );

                    console.log(
                        '[A350] Menu initialization complete.'
                    );

                    return;
                }

                if (
                    menuAttempts >=
                    MAX_MENU_ATTEMPTS
                ) {

                    clearInterval(
                        menuTimer
                    );

                    console.warn(
                        '[A350] Could not find GeoFS menu after 60 seconds.'
                    );

                    console.warn(
                        '[A350] Use window.a350.open() in console to open the panel.'
                    );
                }

            },
            500
        );

    console.log(
        '[A350] v0.5.1 ready.'
    );

})();
