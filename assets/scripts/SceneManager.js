class SceneManager {
    constructor(framer) {
        if (!framer) {
            throw new TypeError("SceneManager requires a Framer instance.");
        }

        this.scenes = new Map();
        this.animations = new Map();
        this.currentScene = null;
        this.pendingScenes = [];
        this.fps = 60;
        this.effects = [];
        this.barriers = [];
        this.framer = framer;
        this.dialogTimer = null;
        this.dialogAdvanceTimer = null;
        this.dialogIndex = -1;
        this.dialogIsTyping = false;
        this.dialogText = "";
        this.dialogCharacter = null;
        this.controlsDisabledBeforeScene = false;
        this.flashCardTimer = null;
        this.flashCardIndex = -1;
        this.flashCardElement = null;
        this.flashCardAudio = null;
        this.flashCardLayersAbove = false;
        this.flashCardTimerElapsed = false;
        this.savedSceneStyles = null;
        this.savedCharacterStyles = [];
        this.animationOrigins = null;
        this.framer.sceneManager = this;
        window.addEventListener("keydown", (event) => {
            if (
                event.code === "KeyC" &&
                !event.repeat &&
                this.currentScene &&
                Array.isArray(this.currentScene.frames) &&
                this.currentScene.nextIn === "interaction"
            ) {
                event.preventDefault();
                this.advance_flash_card(true);
            }
        });
    }

    create_scene(name, options = {}) {
        if (typeof name !== "string" || name.trim() === "") {
            throw new TypeError("A scene must have a non-empty name.");
        }
        if (this.scenes.has(name)) {
            throw new Error(`Scene "${name}" is already registered.`);
        }
        if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new TypeError(`Options for scene "${name}" must be an object.`);
        }

        const scene = {
            name,
            startOn: "immediate",
            endOn: "last-interaction",
            dialogs: [],
            sequenceDialogs: true,
            sequenceScene: null,
            killNPC: false,
            characterStyle: "default",
            afterItPlay: null,
            afterItDoes: null,
            sceneStyle: "default",
            disableControls: false,
            createBarriers: [],
            ...options
        };

        if (!Array.isArray(scene.dialogs)) {
            throw new TypeError(`The dialogs for scene "${name}" must be an array.`);
        }
        if (!Array.isArray(scene.createBarriers)) {
            throw new TypeError(`The createBarriers for scene "${name}" must be an array.`);
        }
        if (scene.frames !== undefined) {
            if (!Array.isArray(scene.frames) || scene.frames.length === 0 ||
                scene.frames.some((frame) => {
                    if (typeof frame === "string") {
                        return frame.trim() === "";
                    }
                    if (!frame || typeof frame !== "object" || Array.isArray(frame) ||
                        typeof frame.frame !== "string" || frame.frame.trim() === "") {
                        return true;
                    }
                    return frame.dialog != null && (
                        typeof frame.dialog !== "object" ||
                        Array.isArray(frame.dialog) ||
                        typeof frame.dialog.about !== "string"
                    );
                })) {
                throw new TypeError(`Frames for scene "${name}" must contain image paths or { frame, dialog } objects.`);
            }
            if (scene.nextIn == null) {
                scene.nextIn = "interaction";
            }
            if (scene.sceneAnimationPos == null) {
                scene.sceneAnimationPos = "shake-view";
            }
            if (scene.nextIn !== "interaction" &&
                (!Number.isFinite(Number(scene.nextIn)) || Number(scene.nextIn) < 0)) {
                throw new TypeError(`nextIn for flash-card scene "${name}" must be milliseconds or "interaction".`);
            }
            if (scene.scene != null && (typeof scene.scene !== "object" || Array.isArray(scene.scene))) {
                throw new TypeError(`The scene display options for "${name}" must be an object.`);
            }
            this.get_flash_card_animation(scene.sceneAnimationPos);
            if (scene.scene && scene.scene.sound != null &&
                typeof scene.scene.sound !== "string" && !(scene.scene.sound instanceof Audio)) {
                throw new TypeError(`The scene sound for "${name}" must be an audio path, Audio object, or null.`);
            }
            if (scene.scene && scene.scene.style != null &&
                (typeof scene.scene.style !== "object" || Array.isArray(scene.scene.style))) {
                throw new TypeError(`The scene style for "${name}" must be an object.`);
            }
            if (scene.scene && scene.scene.imageStyle != null &&
                (typeof scene.scene.imageStyle !== "object" || Array.isArray(scene.scene.imageStyle))) {
                throw new TypeError(`The scene imageStyle for "${name}" must be an object.`);
            }
        }
        scene.dialogs.forEach((dialog, index) => {
            if (!dialog || typeof dialog !== "object" || Array.isArray(dialog)) {
                throw new TypeError(`Dialog ${index} in scene "${name}" must be an object.`);
            }
            if (dialog.finishOn != null &&
                (!Number.isFinite(Number(dialog.finishOn)) || Number(dialog.finishOn) < 0)) {
                throw new TypeError(`finishOn for dialog ${index} in scene "${name}" must be a non-negative duration.`);
            }
        });
        if (!["immediate", "first-interaction"].includes(scene.startOn)) {
            throw new TypeError(`Unsupported startOn value "${scene.startOn}" for scene "${name}".`);
        }
        if (!["last-interaction", "manual"].includes(scene.endOn)) {
            throw new TypeError(`Unsupported endOn value "${scene.endOn}" for scene "${name}".`);
        }
        if (scene.afterItDoes != null && typeof scene.afterItDoes !== "function") {
            throw new TypeError(`afterItDoes for scene "${name}" must be a function.`);
        }

        this.scenes.set(name, scene);
        return scene;
    }

    registerScene(name, options = {}) {
        return this.create_scene(name, options);
    }

    get_scene(name) {
        const scene = this.scenes.get(name);
        if (!scene) {
            throw new Error(`Scene "${name}" is not registered.`);
        }
        return scene;
    }

    push(name) {
        const scene = this.get_scene(name);
        if (scene.startOn === "first-interaction") {
            if (!this.pendingScenes.includes(scene)) {
                this.pendingScenes.push(scene);
            }
        } else {
            this.start_scene(scene);
        }
        return scene;
    }

    start_scene(sceneOrName) {
        const scene = typeof sceneOrName === "string"
            ? this.get_scene(sceneOrName)
            : sceneOrName;

        if (!scene || !this.scenes.has(scene.name)) {
            throw new Error("Cannot start a scene that is not registered.");
        }
        if (this.currentScene) {
            throw new Error(`Cannot start "${scene.name}" while "${this.currentScene.name}" is active.`);
        }

        this.pendingScenes = this.pendingScenes.filter((pending) => pending !== scene);
        this.currentScene = scene;
        this.dialogIndex = -1;
        this.controlsDisabledBeforeScene = this.framer.controlsDisabled;
        this.apply_scene_style(scene.sceneStyle);
        this.apply_character_style(scene.characterStyle);
        this.set_controls_disabled(scene.disableControls);
        this.create_barriers(scene.createBarriers);

        if (Array.isArray(scene.frames)) {
            this.start_flash_card_scene(scene);
        } else if (scene.dialogs.length === 0) {
            this.finish_scene(scene);
        } else {
            this.advance_dialog();
        }
        return scene;
    }

    handleInteraction(character) {
        if (this.currentScene) {
            if (Array.isArray(this.currentScene.frames)) {
                return true;
            }
            if (this.has_dialog_timer()) {
                return true;
            } else if (this.dialogIsTyping) {
                this.finish_typing();
            } else if (this.dialogIndex < this.currentScene.dialogs.length - 1) {
                this.advance_dialog();
            } else if (this.currentScene.endOn !== "manual") {
                this.finish_scene(this.currentScene);
            }
            return true;
        }

        const pendingScene = this.pendingScenes.find((scene) =>
            scene.startOn === "first-interaction" &&
            (!character || scene.dialogs.some((dialog) => dialog.from === character || dialog.to === character))
        );

        if (pendingScene) {
            this.start_scene(pendingScene);
            return true;
        }
        return false;
    }

    start_flash_card_scene(scene) {
        const display = scene.scene || {};
        const overlay = document.createElement("div");
        overlay.className = "scene-flashcard";
        overlay.classList.toggle("scene-flashcard-overlay", display.overlayAllElements !== false);
        if (display.overlayAllElements === false) {
            document.body.classList.add("has-non-overlay-flashcard");
            this.flashCardLayersAbove = true;
        }

        const image = document.createElement("img");
        image.className = "scene-flashcard-image";
        image.alt = "";
        image.draggable = false;
        const positionAnimation = this.get_flash_card_animation(scene.sceneAnimationPos);
        if (positionAnimation) {
            image.classList.add(positionAnimation);
        }

        if (display.centered !== false && display.centrelized !== false) {
            overlay.classList.add("scene-flashcard-centered");
        }
        Object.assign(overlay.style, display.style || {});
        Object.assign(image.style, display.imageStyle || {});
        overlay.appendChild(image);

        const counter = document.createElement("div");
        counter.className = "scene-flashcard-counter";
        overlay.appendChild(counter);
        if (scene.nextIn === "interaction") {
            const hint = document.createElement("div");
            hint.className = "scene-flashcard-hint";
            hint.textContent = "PRESSIONE C PARA CONTINUAR";
            overlay.appendChild(hint);
        }

        document.body.appendChild(overlay);

        this.flashCardElement = overlay;
        this.flashCardIndex = -1;
        document.body.classList.add("has-flashcard");
        this.start_flash_card_sound(display.sound);
        this.advance_flash_card();
    }

    get_flash_card_animation(animation) {
        const animations = {
            "shake-view": "scene-flashcard-shake",
            "bottom-to-top": "scene-flashcard-bottom-to-top",
            "low-to-high": "scene-flashcard-bottom-to-top",
            "top-to-bottom": "scene-flashcard-top-to-bottom",
            "high-to-low": "scene-flashcard-top-to-bottom",
            "side-to-side": "scene-flashcard-side-to-side",
            "sideways": "scene-flashcard-side-to-side",
            "random-sides": "scene-flashcard-random-sides",
            "minimal-view": "scene-flashcard-minimal-view",
            "general-view": "scene-flashcard-minimal-view"
        };
        if (animation == null || animation === "none") {
            return null;
        }
        if (!animations[animation]) {
            throw new TypeError(`Unsupported sceneAnimationPos value "${animation}".`);
        }
        return animations[animation];
    }

    advance_flash_card(fromInteraction = false) {
        const scene = this.currentScene;
        if (!scene || !Array.isArray(scene.frames) || !this.flashCardElement) {
            return false;
        }

        if (scene.nextIn === "interaction" && !fromInteraction) {
            return false;
        }
        if (fromInteraction && this.dialogIsTyping) {
            this.finish_flash_card_typing();
            return true;
        }

        if (this.flashCardTimer !== null) {
            window.clearTimeout(this.flashCardTimer);
            this.flashCardTimer = null;
        }

        this.flashCardIndex += 1;
        if (this.flashCardIndex >= scene.frames.length) {
            this.finish_scene(scene);
            return true;
        }

        this.flashCardTimerElapsed = false;
        const card = scene.frames[this.flashCardIndex];
        const frame = typeof card === "string" ? card : card.frame;
        const image = this.flashCardElement.querySelector(".scene-flashcard-image");
        if (!image) {
            throw new Error(`Flash-card image element is missing in scene "${scene.name}".`);
        }
        image.src = this.resolve_scene_image(frame);
        image.alt = typeof card === "object" && card.dialog ? card.dialog.about : "";

        const counter = this.flashCardElement.querySelector(".scene-flashcard-counter");
        if (counter) {
            counter.textContent =
                `${String(this.flashCardIndex + 1).padStart(2, "0")} / ${String(scene.frames.length).padStart(2, "0")}`;
        }

        image.classList.remove(
            "scene-flashcard-shake",
            "scene-flashcard-bottom-to-top",
            "scene-flashcard-top-to-bottom",
            "scene-flashcard-side-to-side",
            "scene-flashcard-random-sides",
            "scene-flashcard-minimal-view"
        );
        void image.offsetWidth;
        const animation = this.get_flash_card_animation(scene.sceneAnimationPos);
        if (animation) {
            image.classList.add(animation);
        }

        this.show_flash_card_dialog(typeof card === "object" ? card.dialog : null);
        if (scene.nextIn !== "interaction") {
            this.flashCardTimer = window.setTimeout(
                () => {
                    this.flashCardTimer = null;
                    this.flashCardTimerElapsed = true;
                    this.maybe_advance_flash_card();
                },
                Number(scene.nextIn)
            );
        }
        return true;
    }

    show_flash_card_dialog(dialog) {
        this.clear_dialog_timer();
        this.dialogIsTyping = false;
        if (!dialog || dialog.about.trim() === "") {
            const dialogBox = document.querySelector(".dialog-box");
            if (dialogBox) {
                dialogBox.classList.add("closed");
            }
            return;
        }

        this.dialogCharacter = dialog.from || this.framer.character_main_scene;
        this.dialogText = dialog.about;
        this.show_dialog(this.dialogCharacter, "");
        this.dialogIsTyping = true;

        let characterIndex = 0;
        const typeNextCharacter = () => {
            if (!this.currentScene || !Array.isArray(this.currentScene.frames)) {
                return;
            }
            const content = document.querySelector(".dialog-box #dialog-content");
            if (!content) {
                this.dialogIsTyping = false;
                throw new Error("The dialog content element was not found.");
            }

            characterIndex += 1;
            content.textContent = this.dialogText.slice(0, characterIndex);
            const talkSound = this.dialogCharacter &&
                this.dialogCharacter.effects &&
                this.dialogCharacter.effects.talk_sound;
            if (talkSound && typeof talkSound.play === "function") {
                talkSound.play();
            }

            if (characterIndex >= this.dialogText.length) {
                this.clear_dialog_timer();
                this.dialogIsTyping = false;
                this.maybe_advance_flash_card();
            }
        };

        this.dialogTimer = window.setInterval(typeNextCharacter, 25);
    }

    finish_flash_card_typing() {
        this.clear_dialog_timer();
        this.dialogIsTyping = false;
        const content = document.querySelector(".dialog-box #dialog-content");
        if (content) {
            content.textContent = this.dialogText;
        }
        this.maybe_advance_flash_card();
    }

    maybe_advance_flash_card() {
        if (
            this.flashCardTimerElapsed &&
            !this.dialogIsTyping &&
            this.currentScene &&
            Array.isArray(this.currentScene.frames)
        ) {
            this.advance_flash_card();
        }
    }

    resolve_scene_image(source) {
        if (/^(?:[a-z]+:|\/|data:)/i.test(source)) {
            return source;
        }
        if (source.startsWith("assets/")) {
            return source;
        }
        if (source.startsWith("images/")) {
            return `assets/scenes/${source}`;
        }
        if (source.includes("/")) {
            return source;
        }
        return `assets/scenes/images/${source}`;
    }

    start_flash_card_sound(sound) {
        if (sound == null) {
            return;
        }
        const audio = sound instanceof Audio ? sound : new Audio(sound);
        this.flashCardAudio = audio;
        const playback = audio.play();
        if (playback && typeof playback.catch === "function") {
            playback.catch((error) => {
                console.error("Failed to play flash-card scene audio.", error);
            });
        }
    }

    clear_flash_card() {
        if (this.flashCardTimer !== null) {
            window.clearTimeout(this.flashCardTimer);
            this.flashCardTimer = null;
        }
        if (this.flashCardElement) {
            this.flashCardElement.remove();
            this.flashCardElement = null;
        }
        document.body.classList.remove("has-flashcard");
        if (this.flashCardLayersAbove) {
            document.body.classList.remove("has-non-overlay-flashcard");
            this.flashCardLayersAbove = false;
        }
        if (this.flashCardAudio) {
            this.flashCardAudio.pause();
            this.flashCardAudio.currentTime = 0;
            this.flashCardAudio = null;
        }
        this.flashCardIndex = -1;
        this.flashCardTimerElapsed = false;
    }

    advance_dialog() {
        const scene = this.currentScene;
        if (!scene) {
            return;
        }

        this.clear_dialog_advance_timer();
        this.dialogIndex += 1;
        const dialog = scene.dialogs[this.dialogIndex];
        if (!dialog) {
            this.finish_scene(scene);
            return;
        }
        if (typeof dialog.about !== "string") {
            throw new TypeError(`Dialog ${this.dialogIndex} in scene "${scene.name}" must have string content.`);
        }

        this.dialogCharacter = dialog.from || this.framer.character_main_scene;
        this.dialogText = dialog.about;
        this.show_dialog(this.dialogCharacter, "");

        let characterIndex = 0;
        this.dialogIsTyping = this.dialogText.length > 0;
        if (!this.dialogIsTyping) {
            this.start_dialog_advance_timer(dialog);
            return;
        }

        this.dialogTimer = window.setInterval(() => {
            const dialogContent = document.querySelector(".dialog-box #dialog-content");
            if (!dialogContent) {
                this.clear_dialog_timer();
                this.dialogIsTyping = false;
                throw new Error("The dialog content element was not found.");
            }

            characterIndex += 1;
            dialogContent.textContent = this.dialogText.slice(0, characterIndex);
            const talkSound = this.dialogCharacter &&
                this.dialogCharacter.effects &&
                this.dialogCharacter.effects.talk_sound;
            if (talkSound && typeof talkSound.play === "function") {
                talkSound.play();
            }
            if (characterIndex >= this.dialogText.length) {
                this.clear_dialog_timer();
                this.dialogIsTyping = false;
                this.start_dialog_advance_timer(dialog);
            }
        }, 25);
    }

    show_dialog(character, text) {
        const dialogBox = document.querySelector(".dialog-box");
        const nameElement = document.querySelector(".dialog-box #dialog-character-name");
        const contentElement = document.querySelector(".dialog-box #dialog-content");
        const portrait = document.querySelector(".dialog-box img");

        if (!dialogBox || !nameElement || !contentElement) {
            throw new Error("The dialog UI is missing .dialog-box, #dialog-character-name, or #dialog-content.");
        }

        dialogBox.classList.remove("closed");
        nameElement.textContent = character && character.name ? character.name : "";
        contentElement.textContent = text;
        if (portrait && character && character.sprite && character.sprite.face_card) {
            portrait.src = character.sprite.face_card;
        }
    }

    finish_typing() {
        this.clear_dialog_timer();
        this.dialogIsTyping = false;
        const dialogContent = document.querySelector(".dialog-box #dialog-content");
        if (dialogContent) {
            dialogContent.textContent = this.dialogText;
        }
        const dialog = this.currentScene && this.currentScene.dialogs[this.dialogIndex];
        if (dialog) {
            this.start_dialog_advance_timer(dialog);
        }
    }

    has_dialog_timer() {
        const dialog = this.currentScene && this.currentScene.dialogs[this.dialogIndex];
        return Boolean(dialog && dialog.finishOn != null);
    }

    start_dialog_advance_timer(dialog) {
        this.clear_dialog_advance_timer();
        if (dialog.finishOn == null) {
            return;
        }

        this.dialogAdvanceTimer = window.setTimeout(() => {
            this.dialogAdvanceTimer = null;
            if (!this.currentScene || this.currentScene.dialogs[this.dialogIndex] !== dialog) {
                return;
            }
            if (this.dialogIndex < this.currentScene.dialogs.length - 1) {
                this.advance_dialog();
            } else {
                this.finish_scene(this.currentScene);
            }
        }, Number(dialog.finishOn));
    }

    clear_dialog_advance_timer() {
        if (this.dialogAdvanceTimer !== null) {
            window.clearTimeout(this.dialogAdvanceTimer);
            this.dialogAdvanceTimer = null;
        }
    }

    clear_dialog_timer() {
        if (this.dialogTimer !== null) {
            window.clearInterval(this.dialogTimer);
            this.dialogTimer = null;
        }
    }

    async finish_scene(scene = this.currentScene) {
        if (!scene || scene !== this.currentScene) {
            return;
        }

        this.clear_dialog_timer();
        this.clear_dialog_advance_timer();
        this.clear_flash_card();
        this.dialogIsTyping = false;
        this.currentScene = null;
        this.dialogIndex = -1;
        this.set_character_movement_enabled(!this.controlsDisabledBeforeScene);
        this.clear_barriers();
        this.restore_scene_styles();

        const dialogBox = document.querySelector(".dialog-box");
        if (dialogBox) {
            dialogBox.classList.add("closed");
        }

        if (scene.killNPC) {
            this.remove_scene_npcs(scene);
        }

        try {
            if (scene.afterItPlay) {
                await this.play_animation(scene.afterItPlay);
            }
            if (typeof scene.afterItDoes === "function") {
                await scene.afterItDoes(scene, this);
            }
            if (scene.sequenceScene) {
                this.push(scene.sequenceScene);
            }
        } catch (error) {
            console.error(`Failed to finish scene "${scene.name}".`, error);
        }
    }

    end_scene() {
        if (!this.currentScene) {
            return false;
        }
        this.finish_scene(this.currentScene);
        return true;
    }

    open_code_box(options = {}) {
        return this.framer.openCodeBox(options);
    }

    close_code_box() {
        return this.framer.closeCodeBox();
    }

    create_barriers(barriers) {
        this.clear_barriers();

        barriers.forEach((options) => {
            const left = Number(options.left ?? options.x ?? 0);
            const top = Number(options.top ?? options.y ?? 0);
            const width = Number(options.width ?? 0);
            const height = Number(options.height ?? 0);
            if (![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
                throw new TypeError("Each barrier needs finite x/y (or left/top), width, and height values.");
            }

            const element = document.createElement("div");
            element.className = "scene-barrier";
            Object.assign(element.style, {
                position: "absolute",
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
                opacity: "0",
                pointerEvents: "none"
            });
            document.body.appendChild(element);

            this.barriers.push({
                left,
                top,
                right: left + width,
                bottom: top + height,
                sides: options.sides !== false,
                topSide: options.top === true,
                bottomSide: options.bottom === true,
                element
            });
        });
    }

    canMove(character, top, left, previousTop, previousLeft) {
        const width = character.character_dom.offsetWidth;
        const height = character.character_dom.offsetHeight;
        const previousRight = previousLeft + width;
        const previousBottom = previousTop + height;
        const nextRight = left + width;
        const nextBottom = top + height;

        return !this.barriers.some((barrier) => {
            const overlapsVertically = top < barrier.bottom && nextBottom > barrier.top;
            const overlapsHorizontally = left < barrier.right && nextRight > barrier.left;
            const crossesLeft = previousRight <= barrier.left && nextRight > barrier.left;
            const crossesRight = previousLeft >= barrier.right && left < barrier.right;
            const crossesTop = previousBottom <= barrier.top && nextBottom > barrier.top;
            const crossesBottom = previousTop >= barrier.bottom && top < barrier.bottom;

            return (barrier.sides && overlapsVertically && (crossesLeft || crossesRight)) ||
                (barrier.topSide && overlapsHorizontally && crossesTop) ||
                (barrier.bottomSide && overlapsHorizontally && crossesBottom);
        });
    }

    clear_barriers() {
        this.barriers.forEach((barrier) => barrier.element.remove());
        this.barriers = [];
    }

    apply_scene_style(style) {
        if (style === "default" || style == null) {
            return;
        }

        if (typeof style === "string") {
            document.body.classList.add(style);
            this.savedSceneStyles = { className: style };
            return;
        }

        if (typeof style !== "object" || Array.isArray(style)) {
            throw new TypeError("sceneStyle must be 'default', a CSS class name, or a style object.");
        }

        const previous = {};
        Object.keys(style).forEach((key) => {
            previous[key] = document.body.style[key];
            document.body.style[key] = style[key];
        });
        this.savedSceneStyles = { previous };
    }

    apply_character_style(style, character = this.framer.character_main_scene) {
        if (style === "default" || style == null) {
            return;
        }
        if (typeof style !== "object" || Array.isArray(style)) {
            throw new TypeError("characterStyle must be 'default' or a style object.");
        }

        const element = character && character.character_dom;
        if (!element) {
            throw new Error("The character does not have a DOM element.");
        }

        const previous = {};
        Object.keys(style).forEach((key) => {
            if (key === "sprite") {
                if (typeof style.sprite !== "string") {
                    throw new TypeError("A character sprite must be a path or filename.");
                }
                previous.backgroundImage = element.style.backgroundImage;
                const spritePath = style.sprite.includes("/")
                    ? style.sprite
                    : `assets/sprites/${character.codname}/${style.sprite}`;
                element.style.backgroundImage = `url("${spritePath}")`;
            } else if (key === "effect") {
                return;
            } else if (key === "x" || key === "left") {
                previous.left = element.style.left;
                element.style.left = `${style[key]}px`;
            } else if (key === "y" || key === "top") {
                previous.top = element.style.top;
                element.style.top = `${style[key]}px`;
            } else {
                previous[key] = element.style[key];
                element.style[key] = style[key];
            }
        });
        if (Object.keys(previous).length > 0) {
            this.savedCharacterStyles.push({ element, previous });
        }
        if (character === this.framer.character_main_scene) {
            this.framer.set_character_position(
                parseFloat(element.style.top) || 0,
                parseFloat(element.style.left) || 0
            );
        }
    }

    restore_scene_styles() {
        if (this.savedSceneStyles) {
            if (this.savedSceneStyles.className) {
                document.body.classList.remove(this.savedSceneStyles.className);
            } else {
                Object.assign(document.body.style, this.savedSceneStyles.previous);
            }
            this.savedSceneStyles = null;
        }

        this.savedCharacterStyles.reverse().forEach(({ element, previous }) => {
            Object.assign(element.style, previous);
        });
        this.savedCharacterStyles = [];
        const mainCharacter = this.framer.character_main_scene;
        if (mainCharacter && mainCharacter.character_dom) {
            this.framer.set_character_position(
                parseFloat(mainCharacter.character_dom.style.top) || 0,
                parseFloat(mainCharacter.character_dom.style.left) || 0
            );
        }
    }

    set_controls_disabled(disabled) {
        this.set_character_movement_enabled(!disabled);
    }

    set_character_movement_enabled(enabled) {
        if (typeof enabled !== "boolean") {
            throw new TypeError("Character movement state must be a boolean.");
        }
        this.framer.controlsDisabled = !enabled;
        return enabled;
    }

    disable_character_movement() {
        return this.set_character_movement_enabled(false);
    }

    enable_character_movement() {
        return this.set_character_movement_enabled(true);
    }

    remove_scene_npcs(scene) {
        const participants = new Set();
        scene.dialogs.forEach((dialog) => {
            [dialog.from, dialog.to].forEach((character) => {
                if (character && character.isNPC) {
                    participants.add(character);
                }
            });
        });

        participants.forEach((character) => {
            if (character.character_dom) {
                character.character_dom.remove();
            }
            this.framer.npcs = this.framer.npcs.filter((npc) => npc !== character);
        });
    }

    create_animation(name, options = {}) {
        if (typeof name !== "string" || name.trim() === "") {
            throw new TypeError("An animation must have a non-empty name.");
        }
        if (this.animations.has(name)) {
            throw new Error(`Animation "${name}" is already registered.`);
        }
        if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new TypeError(`Options for animation "${name}" must be an object.`);
        }
        if (!Array.isArray(options.acts || []) || !Array.isArray(options.sceneActs || [])) {
            throw new TypeError(`The acts and sceneActs for animation "${name}" must be arrays.`);
        }

        const animation = {
            name,
            characterMainScene: this.framer.character_main_scene,
            secondaryCharacters: [],
            onSequence: true,
            acts: [],
            animationLinear: false,
            sceneActs: [],
            difuseActs: true,
            ...options
        };
        this.animations.set(name, animation);
        return animation;
    }

    get_animation(name) {
        const animation = this.animations.get(name);
        if (!animation) {
            throw new Error(`Animation "${name}" is not registered.`);
        }
        return animation;
    }

    async play_animation(animationOrName) {
        const animation = typeof animationOrName === "string"
            ? this.get_animation(animationOrName)
            : animationOrName;
        if (!animation || !Array.isArray(animation.acts)) {
            throw new TypeError("play_animation requires a registered animation or a valid animation object.");
        }

        if (this.animationOrigins) {
            throw new Error("An animation is already running in this SceneManager.");
        }

        const characters = new Set([
            animation.characterMainScene,
            ...(animation.secondaryCharacters || []),
            ...animation.acts.map((act) => act && act.character),
            ...(animation.sceneActs || []).map((act) => act && act.character)
        ].filter(Boolean));
        const snapshots = new Map();
        characters.forEach((character) => {
            if (!character.character_dom) {
                throw new Error(`Animation character "${character.name || "unknown"}" has no DOM element.`);
            }
        });
        characters.forEach((character) => {
            snapshots.set(character, {
                top: character.character_dom.style.top,
                left: character.character_dom.style.left,
                backgroundImage: character.character_dom.style.backgroundImage,
                isAnimating: character.isAnimating,
                isWalking: character.isWalking,
                lastDirection: character.lastDirection
            });
            character.isAnimating = true;
        });

        this.animationOrigins = new Map();
        snapshots.forEach((snapshot, character) => {
            this.animationOrigins.set(character, {
                top: parseFloat(snapshot.top) || 0,
                left: parseFloat(snapshot.left) || 0
            });
        });
        const acts = animation.acts.concat(animation.sceneActs || []);
        let animationSucceeded = false;
        try {
            const runAct = (act, index) => this.run_animation_act(animation, act, index);
            if (animation.onSequence) {
                for (let index = 0; index < acts.length; index += 1) {
                    await runAct(acts[index], index);
                    while (!acts[index].isFinished) {
                        await new Promise((resolve) => window.setTimeout(resolve, 0));
                    }
                }
            } else {
                await Promise.all(acts.map(runAct));
            }
            animationSucceeded = true;
        } finally {
            snapshots.forEach((snapshot, character) => {
                const element = character.character_dom;
                if (character.isWalking && typeof character.stop === "function") {
                    character.stop();
                }
                if (!animationSucceeded) {
                    element.style.top = snapshot.top;
                    element.style.left = snapshot.left;
                }
                element.style.backgroundImage = snapshot.backgroundImage;
                character.isAnimating = snapshot.isAnimating;
                character.isWalking = snapshot.isWalking;
                character.lastDirection = snapshot.lastDirection;
                if (character === this.framer.character_main_scene) {
                    this.framer.set_character_position(
                        parseFloat(element.style.top) || 0,
                        parseFloat(element.style.left) || 0
                    );
                }
            });
            this.animationOrigins = null;
        }
        return animation;
    }

    animate(animationOrName) {
        return this.play_animation(animationOrName);
    }

    async run_animation_act(animation, act, index) {
        if (!act || typeof act !== "object") {
            throw new TypeError(`Animation act ${index} must be an object.`);
        }

        act.isFinished = false;
        const character = act.character || animation.characterMainScene;
        const style = act.characterStyle || {};
        const { walk, effect, ...visualStyle } = style;
        const configuredDuration = act.finishOn == null ? null : Number(act.finishOn);
        const duration = configuredDuration === null ? 0 : configuredDuration;
        if (!Number.isFinite(duration) || duration < 0) {
            throw new TypeError(`Animation act ${index} has an invalid finishOn duration.`);
        }
        const startedAt = performance.now();

        try {
            if (character && Object.keys(visualStyle).length > 0) {
                this.apply_animation_style(character, visualStyle);
            }
            if (typeof walk === "function") {
                let walkQueue = Promise.resolve();
                const walkCharacter = (pose, left, direction, spriteIndex) => {
                    const task = walkQueue.then(() => typeof pose === "object" && pose !== null
                        ? this.animate_character(character, pose, duration)
                        : this.animate_walk_pose(
                            character,
                            pose,
                            left,
                            direction,
                            spriteIndex,
                            duration,
                            Number(act.walkSpeed ?? animation.walkSpeed ?? 240)
                        ));
                    walkQueue = task;
                    return task;
                };
                await Promise.resolve(walk(walkCharacter));
                await walkQueue;
            }
            if (typeof effect === "function") {
                effect((source) => this.play_effect(source));
            }
            if (typeof act.effect === "function") {
                act.effect((source) => this.play_effect(source));
            }
            if (act.sceneStyle) {
                this.apply_scene_style(act.sceneStyle);
            }

            if (act.characterPointOfVision) {
                this.framer.cameraTarget = character || animation.characterMainScene;
            }

            const remainingDuration = duration - (performance.now() - startedAt);
            if (remainingDuration > 0) {
                await new Promise((resolve) => window.setTimeout(resolve, remainingDuration));
            }
            act.isFinished = true;
        } catch (error) {
            act.isFinished = false;
            throw error;
        }
    }

    apply_animation_style(character, style) {
        const element = character.character_dom;
        const relative = style.relative !== false;
        if (style.sprite !== undefined) {
            element.style.backgroundImage = `url("${this.resolve_sprite_path(character, style.sprite)}")`;
        }
        if (style.x !== undefined || style.left !== undefined) {
            const x = Number(style.x ?? style.left);
            if (!Number.isFinite(x)) {
                throw new TypeError("Animation x/left must be a finite number.");
            }
            const currentLeft = parseFloat(element.style.left) || 0;
            element.style.left = `${relative ? currentLeft + x : x}px`;
        }
        if (style.y !== undefined || style.top !== undefined) {
            const y = Number(style.y ?? style.top);
            if (!Number.isFinite(y)) {
                throw new TypeError("Animation y/top must be a finite number.");
            }
            const currentTop = parseFloat(element.style.top) || 0;
            element.style.top = `${relative ? currentTop + y : y}px`;
        }
        if (character === this.framer.character_main_scene) {
            this.framer.set_character_position(
                parseFloat(element.style.top) || 0,
                parseFloat(element.style.left) || 0
            );
        }
    }

    animate_walk_pose(character, topOffset, leftOffset, direction, spriteIndex = 0, duration = 0, speed = 240) {
        if (!character || !character.character_dom || typeof character.walk !== "function") {
            throw new Error("Animated walk() requires a Sprite character with a walk() method.");
        }
        if (![topOffset, leftOffset, spriteIndex].every((value) => Number.isFinite(Number(value)))) {
            throw new TypeError("walk() offsets and sprite index must be finite numbers.");
        }
        if (!Number.isFinite(duration) || duration < 0 || !Number.isFinite(speed) || speed <= 0) {
            throw new TypeError("walk() duration must be non-negative and speed must be positive.");
        }

        const startTop = parseFloat(character.character_dom.style.top) || 0;
        const startLeft = parseFloat(character.character_dom.style.left) || 0;
        const endTop = startTop + Number(topOffset);
        const endLeft = startLeft + Number(leftOffset);
        const movementDistance = Math.hypot(Number(topOffset), Number(leftOffset));
        const movementDuration = duration || (movementDistance / speed) * 1000;

        if (movementDuration === 0) {
            character.walk(endTop, endLeft, direction, Number(spriteIndex));
            if (character === this.framer.character_main_scene) {
                this.framer.set_character_position(endTop, endLeft);
            }
            return Promise.resolve(character);
        }

        const startedAt = performance.now();
        const frameInterval = 1000 / 8;
        return new Promise((resolve) => {
            const step = (now) => {
                const elapsed = Math.min(now - startedAt, movementDuration);
                const progress = elapsed / movementDuration;
                const top = startTop + (endTop - startTop) * progress;
                const left = startLeft + (endLeft - startLeft) * progress;
                const frame = (Number(spriteIndex) + Math.floor(elapsed / frameInterval)) % 2;

                character.walk(top, left, direction, frame);
                if (character === this.framer.character_main_scene) {
                    this.framer.set_character_position(top, left);
                }

                if (elapsed >= movementDuration) {
                    resolve(character);
                    return;
                }
                window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
        });
    }

    async animate_character(character, options = {}, defaultDuration = 0) {
        if (!character || !character.character_dom) {
            throw new Error("animate_character() requires a character with a DOM element.");
        }
        if (typeof options === "function") {
            const wasAnimating = character.isAnimating;
            if (character.isWalking && typeof character.stop === "function") {
                character.stop();
            }
            character.isAnimating = true;

            let animationQueue = Promise.resolve();
            const animate = (pose, left, direction, spriteIndex = 0) => {
                const task = animationQueue.then(() => {
                    if (pose && typeof pose === "object") {
                        return this.animate_character(character, pose, defaultDuration);
                    }
                    return this.animate_walk_pose(
                        character,
                        pose,
                        left,
                        direction,
                        spriteIndex,
                        defaultDuration
                    );
                });
                animationQueue = task;
                return task;
            };

            try {
                await Promise.resolve(options(animate));
                await animationQueue;
                return character;
            } finally {
                character.isAnimating = wasAnimating;
            }
        }
        if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new TypeError("Character animation options must be an object or a callback.");
        }

        const element = character.character_dom;
        const startTop = parseFloat(element.style.top) || 0;
        const startLeft = parseFloat(element.style.left) || 0;
        const position = options.position || {};
        const offsetX = Number(options.x ?? position.x ?? options.left ?? position.left ?? 0);
        const offsetY = Number(options.y ?? position.y ?? options.top ?? position.top ?? 0);
        if (![offsetX, offsetY].every(Number.isFinite)) {
            throw new TypeError("Animation position offsets must be finite numbers.");
        }
        const relative = options.relative !== false;
        const endLeft = relative ? startLeft + offsetX : offsetX;
        const endTop = relative ? startTop + offsetY : offsetY;
        const frames = options.frames || (options.sprite ? [options.sprite] : []);
        if (!Array.isArray(frames) || frames.some((frame) => typeof frame !== "string")) {
            throw new TypeError("Animation frames must be an array of sprite paths.");
        }
        const fps = Number(options.fps ?? 8);
        const fallbackDuration = defaultDuration > 0
            ? defaultDuration
            : frames.length * 1000 / fps;
        const duration = Number(options.duration ?? fallbackDuration);
        if (!Number.isFinite(fps) || fps <= 0 || !Number.isFinite(duration) || duration < 0) {
            throw new TypeError("Animation fps must be positive and duration must be non-negative.");
        }

        if (options.direction) {
            this.animate_walk_pose(character, 0, 0, options.direction, 0);
        }
        if (duration === 0) {
            element.style.left = `${endLeft}px`;
            element.style.top = `${endTop}px`;
            if (frames.length > 0) {
                element.style.backgroundImage = `url("${this.resolve_sprite_path(character, frames[0])}")`;
            }
            return Promise.resolve(character);
        }

        const originalImage = element.style.backgroundImage;
        const frameDuration = 1000 / fps;
        const startedAt = performance.now();
        const wasAnimating = character.isAnimating;
        if (character.isWalking && typeof character.stop === "function") {
            character.stop();
        }
        character.isAnimating = true;

        return new Promise((resolve) => {
            const tick = (now) => {
                const elapsed = Math.min(now - startedAt, duration);
                const progress = elapsed / duration;
                element.style.left = `${startLeft + (endLeft - startLeft) * progress}px`;
                element.style.top = `${startTop + (endTop - startTop) * progress}px`;
                if (frames.length > 0) {
                    const frame = Math.floor(elapsed / frameDuration);
                    const frameIndex = options.loop === false
                        ? Math.min(frame, frames.length - 1)
                        : frame % frames.length;
                    element.style.backgroundImage =
                        `url("${this.resolve_sprite_path(character, frames[frameIndex])}")`;
                }
                if (elapsed >= duration) {
                    if (character.isWalking && typeof character.stop === "function") {
                        character.stop();
                    }
                    if (options.restoreSprite || frames.length === 0) {
                        element.style.backgroundImage = originalImage;
                    } else {
                        const finalFrame = options.loop === false
                            ? frames[frames.length - 1]
                            : frames[Math.floor(elapsed / frameDuration) % frames.length];
                        element.style.backgroundImage =
                            `url("${this.resolve_sprite_path(character, finalFrame)}")`;
                    }
                    if (character === this.framer.character_main_scene) {
                        this.framer.set_character_position(endTop, endLeft);
                    }
                    character.isAnimating = wasAnimating;
                    resolve(character);
                    return;
                }
                window.requestAnimationFrame(tick);
            };
            window.requestAnimationFrame(tick);
        });
    }

    resolve_sprite_path(character, sprite) {
        if (typeof sprite !== "string" || sprite.trim() === "") {
            throw new TypeError("A sprite must be a non-empty path.");
        }
        if (/^(?:[a-z]+:|\/|data:)/i.test(sprite) || sprite.includes("/")) {
            return sprite;
        }
        return `assets/sprites/${character.codname}/${sprite}`;
    }

    play_effect(source) {
        if (typeof source !== "string" || source.trim() === "") {
            throw new TypeError("An effect must be an audio source path.");
        }
        const audio = new Audio(source);
        this.effects.push(audio);
        audio.addEventListener("ended", () => {
            this.effects = this.effects.filter((effect) => effect !== audio);
        }, { once: true });
        const playback = audio.play();
        if (playback && typeof playback.catch === "function") {
            playback.catch((error) => {
                console.error(`Failed to play effect "${source}".`, error);
            });
        }
        return audio;
    }
}
