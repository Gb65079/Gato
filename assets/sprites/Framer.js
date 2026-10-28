class Framer {
    constructor() {
        this.scene = window;
        this.character_main_scene = null;
        this.readyToDialog = false;
        this.isOnDialog = false;
        this.characters = [];
        this.npcs = [];
        this.followingCharacters = [];
        this.controlsDisabled = false;
        this.sceneManager = null;
        this.interactionCharacter = null;
        this.characterPosition = { top: 100, left: 100 };
        this.codeBox = null;
        this.codeBoxFrame = null;
        this.codeBoxPreviousControlsDisabled = false;
        this.createdPlaceObjects = [];
        this.placeObjectSequence = 0;
        this.glitches = new Map();
        this.placeApi = this.createPlaceApi();
    }

    register_characters(characters = []) {
        characters.forEach(x=>{
            x.framer = this;
            if(!x.isNPC) this.characters.push(x);
            else this.npcs.push(x);
        })
    }

    character_follow_main_character(character) {
        if (!character || !character.character_dom || typeof character.walk !== "function") {
            throw new TypeError("A following character must have a DOM element and a walk() method.");
        }
        if (!this.character_main_scene) {
            throw new Error("A main character must be set before adding a follower.");
        }
        if (character === this.character_main_scene) {
            throw new Error("The main character cannot follow itself.");
        }

        const existingFollower = this.followingCharacters.find(
            (follower) => follower.character === character
        );
        if (existingFollower) {
            return character;
        }

        character.framer = this;
        this.followingCharacters.push({
            character,
            distance: 65 * (this.followingCharacters.length + 1)
        });
        return character;
    }

    set_character_main_scene(character) {
        this.character_main_scene = character;
        character.framer = this;
    }
    set_controls_to_character() {
        const keysPressed = {};
        const keysJustPressed = {};

        window.addEventListener('keydown', (event) => {
            if (!keysPressed[event.code]) {
                keysJustPressed[event.code] = true;
            }
            keysPressed[event.code] = true; 
        });

        window.addEventListener('keyup', (event) => {
            keysPressed[event.code] = false;
            keysJustPressed[event.code] = false;
        });

        let currentTop = this.characterPosition.top;
        let currentLeft = this.characterPosition.left;
        let isTeleporting = false;
        let portalSpawnApplied = false;
        let adminRecoveryRequired = assets.get("admin-access-lost") === true;
        const teleportThroughPortal = (portal, destination) => {
            if (typeof destination !== "string" || destination.trim() === "") {
                throw new TypeError("Portal destination must be a non-empty path.");
            }
            if (isTeleporting) {
                return false;
            }
            if (adminRecoveryRequired &&
                !destination.split(/[?#]/)[0].endsWith("marketplace.html")) {
                return false;
            }

            isTeleporting = true;
            this.character_main_scene.stop();
            if (window.katSound) {
                window.katSound.play("teleport");
            }
            this.sceneManager.animate_character(this.character_main_scene, {
                frames: ["spawn.png", "spawn1.png", "spawn3.png"],
                fps: 5,
                loop: false
            }).then(() => {
                try {
                    assets.save("portal_reference", portal.direction);
                } catch (error) {
                    isTeleporting = false;
                    console.error("Failed to save portal spawn reference.", error);
                    return;
                }
                window.location.assign(destination);
            }).catch((error) => {
                isTeleporting = false;
                console.error("Failed to play portal teleport animation.", error);
            });
            return true;
        };
        window.addEventListener("resize", () => {
            const element = this.character_main_scene.character_dom;
            const left = Math.max(0, Math.min(
                parseFloat(element.style.left) || 0,
                Math.max(0, window.innerWidth - element.offsetWidth)
            ));
            const top = Math.max(0, Math.min(
                parseFloat(element.style.top) || 0,
                Math.max(0, window.innerHeight - element.offsetHeight)
            ));
            element.style.left = `${left}px`;
            element.style.top = `${top}px`;
            this.set_character_position(top, left);
        });

        const updateRecoveryPortals = (recovering) => {
            if (!this.sceneManager) {
                return;
            }
            this.sceneManager.portals.forEach((portal) => {
                if (!portal.recoveryDestination) {
                    return;
                }
                portal.destination = recovering
                    ? portal.recoveryDestination
                    : portal.normalDestination;
            });
        };

        document.addEventListener("kat:admin-access-lost", () => {
            adminRecoveryRequired = true;
            updateRecoveryPortals(true);
        });
        document.addEventListener("kat:admin-access-restored", () => {
            adminRecoveryRequired = false;
            updateRecoveryPortals(false);
        });

        this.character_main_scene.character_dom.style.top = currentTop + 'px';
        this.character_main_scene.character_dom.style.left = currentLeft + 'px';

        const speed = 5;
        let frameCounter = 0;
        let currentSpriteIndex = 0;
        const animationSpeed = 8;

        const gameLoop = () => {
            currentTop = this.characterPosition.top;
            currentLeft = this.characterPosition.left;

            if (!portalSpawnApplied) {
                portalSpawnApplied = true;
                const portalReference = assets.get("portal_reference");
                if (portalReference != null) {
                    if (!this.character_main_scene.hasManualPosition) {
                        this.character_main_scene.set_position("portal_reference");
                    }
                    assets.save("portal_reference", null);
                }
            }

            if (isTeleporting || this.character_main_scene.isAnimating) {
                requestAnimationFrame(gameLoop);
                return;
            }

            let isMoving = false;
            let direction = null;

            let nextTop = currentTop;
            let nextLeft = currentLeft;

            let interactionPortal = null;
            if (this.sceneManager && this.sceneManager.portals.length > 0) {
                const characterBounds = this.character_main_scene.get_hitbox_bounds();
                for (const portal of this.sceneManager.portals) {
                    portal.teleportTo = (destination) => teleportThroughPortal(portal, destination);
                    if (!portal.element.isConnected || portal.on !== "interact" || !portal.destination) {
                        continue;
                    }

                    const portalBounds = portal.element.getBoundingClientRect();
                    const nearby = !(
                        characterBounds.right + 20 <= portalBounds.left ||
                        characterBounds.left - 20 >= portalBounds.right ||
                        characterBounds.bottom + 20 <= portalBounds.top ||
                        characterBounds.top - 20 >= portalBounds.bottom
                    );
                    let prompt = portal.element.querySelector(".pressToTalk");
                    const isMarketplace = portal.destination.split(/[?#]/)[0].endsWith("marketplace.html");
                    const promptText = adminRecoveryRequired && !isMarketplace
                        ? "ADM perdido — vá ao Bazar"
                        : "P — entrar";
                    if (nearby && !prompt) {
                        prompt = document.createElement("div");
                        prompt.className = "pressToTalk";
                        portal.element.appendChild(prompt);
                    }
                    if (nearby && prompt && prompt.textContent !== promptText) {
                        prompt.textContent = promptText;
                    } else if (!nearby && prompt) {
                        prompt.remove();
                    }
                    if (nearby && !interactionPortal) {
                        interactionPortal = portal;
                    }
                }
            }

            if (
                keysJustPressed["KeyP"] &&
                interactionPortal &&
                !this.controlsDisabled &&
                !this.codeBox &&
                !this.isOnDialog
            ) {
                keysJustPressed["KeyP"] = false;
                let canTeleport = true;
                if (interactionPortal.canTeleport) {
                    try {
                        const permission = interactionPortal.canTeleport();
                        if (typeof permission !== "boolean") {
                            throw new TypeError('Portal "canTeleport" must return a boolean.');
                        }
                        canTeleport = permission;
                    } catch (error) {
                        console.error("Failed to check portal teleport permission.", error);
                        canTeleport = false;
                    }
                }

                if (canTeleport) {
                    let destination;
                    try {
                        destination = interactionPortal.resolveDestination
                            ? interactionPortal.resolveDestination()
                            : interactionPortal.destination;
                    } catch (error) {
                        console.error("Failed to resolve portal destination.", error);
                        requestAnimationFrame(gameLoop);
                        return;
                    }
                    if (destination) {
                        teleportThroughPortal(interactionPortal, destination);
                    }
                    requestAnimationFrame(gameLoop);
                    return;
                }
            }

            if (!this.controlsDisabled && (keysPressed['ArrowUp'] || keysPressed['KeyW'])) {
                nextTop -= speed;
                direction = 'top';
                isMoving = true;
            } else if (!this.controlsDisabled && (keysPressed['ArrowDown'] || keysPressed['KeyS'])) {
                nextTop += speed;
                direction = 'bottom';
                isMoving = true;
            } else if (!this.controlsDisabled && (keysPressed['ArrowLeft'] || keysPressed['KeyA'])) {
                nextLeft -= speed;
                direction = 'left';
                isMoving = true;
            } else if (!this.controlsDisabled && (keysPressed['ArrowRight'] || keysPressed['KeyD'])) {
                nextLeft += speed;
                direction = 'right';
                isMoving = true;
            } else if (
                keysJustPressed['KeyE'] &&
                !this.codeBox &&
                (
                    this.readyToDialog ||
                    (this.sceneManager && (this.sceneManager.currentScene || this.sceneManager.activeAlert))
                ) &&
                !this.isOnDialog
            ) {
                const character = this.interactionCharacter || this.npcs[0];
                this.sceneManager.handleInteraction(character);
                
            }

            const characterElement = this.character_main_scene.character_dom;
            nextTop = Math.max(0, Math.min(
                nextTop,
                Math.max(0, window.innerHeight - characterElement.offsetHeight)
            ));
            nextLeft = Math.max(0, Math.min(
                nextLeft,
                Math.max(0, window.innerWidth - characterElement.offsetWidth)
            ));
            isMoving = isMoving && (nextTop !== currentTop || nextLeft !== currentLeft);

            if (isMoving) {
                this.character_main_scene.facingDirection = direction;
                let npcCollision = false;
                let interactionCharacter = null;

                for (let npc of this.npcs) {
                    if (this.hitNPCHitbox(nextTop, nextLeft, npc)) {
                        npcCollision = true;
                        interactionCharacter = npc;
                        break;
                    }
                }

                const glitchCollision = !npcCollision && this.hitsGlitches(nextLeft, nextTop);
                const barrierCollision = !npcCollision && !glitchCollision && this.sceneManager &&
                    !this.sceneManager.canMove(
                        this.character_main_scene,
                        nextTop,
                        nextLeft,
                        currentTop,
                        currentLeft
                    );
                const placeObjectCollision = !npcCollision && !glitchCollision && !barrierCollision &&
                    this.hitsCreatedPlaceObject(nextTop, nextLeft);

                if (!npcCollision && !glitchCollision && !barrierCollision && !placeObjectCollision) {
                    currentTop = nextTop;
                    currentLeft = nextLeft;
                    this.characterPosition = { top: currentTop, left: currentLeft };

                    frameCounter++;
                    if (frameCounter >= animationSpeed) {
                        currentSpriteIndex = (currentSpriteIndex === 0) ? 1 : 0;
                        frameCounter = 0;
                    }
                    this.npcs.forEach((npc) => {
                        const prompt = npc.character_dom.querySelector(".pressToTalk");
                        if (prompt) {
                            prompt.remove();
                        }
                    });
                    this.readyToDialog = false;
                    this.interactionCharacter = null;

                    this.character_main_scene.walk(currentTop, currentLeft, direction, currentSpriteIndex);
                } else {
                    this.character_main_scene.stop();
                    this.npcs.forEach((npc) => {
                        const characterElement = npc.character_dom;
                        const existingPrompt = characterElement.querySelector(".pressToTalk");
                        if (npc !== interactionCharacter) {
                            if (existingPrompt) {
                                existingPrompt.remove();
                            }
                            return;
                        }

                        const prompt = existingPrompt || document.createElement("div");
                        prompt.className = "pressToTalk";
                        prompt.textContent = "pressione E";
                        if (!existingPrompt) {
                            characterElement.appendChild(prompt);
                        }
                    });
                    this.readyToDialog = npcCollision;
                    this.interactionCharacter = interactionCharacter;
                }
            } else {
                this.character_main_scene.stop();
                frameCounter = 0;
                currentSpriteIndex = 0;
            }

            this.update_following_characters();
            keysJustPressed['KeyE'] = false;
            keysJustPressed['KeyP'] = false;
            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }

    generateGlitches(options = {}) {
        if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new TypeError("Glitch options must be an object.");
        }
        const { i, squaresCount = 20, reference } = options;
        if (i == null) {
            throw new TypeError("Glitch groups require an i identifier.");
        }
        if (!Number.isInteger(squaresCount) || squaresCount < 1) {
            throw new TypeError("squaresCount must be a positive integer.");
        }
        if (this.glitches.has(i)) {
            throw new Error(`Glitch group "${i}" already exists.`);
        }

        const referenceElement = reference && (
            reference.element || reference.character_dom || reference
        );
        if (!referenceElement || typeof referenceElement.getBoundingClientRect !== "function") {
            throw new TypeError("Glitch reference must be a portal or DOM element.");
        }
        const bounds = referenceElement.getBoundingClientRect();
        const elements = [];
        const referenceZIndex = Number.parseInt(referenceElement.style.zIndex, 10);
        const spreadWidth = Math.min(
            window.innerWidth,
            Math.max(bounds.width * 3, Math.sqrt(squaresCount) * 42)
        );
        const spreadHeight = Math.min(
            window.innerHeight,
            Math.max(bounds.height * 2.5, Math.sqrt(squaresCount) * 42)
        );
        const spreadLeft = Math.max(0, Math.min(
            (bounds.left + bounds.right - spreadWidth) / 2,
            window.innerWidth - spreadWidth
        ));
        const spreadTop = Math.max(0, Math.min(
            (bounds.top + bounds.bottom - spreadHeight) / 2,
            window.innerHeight - spreadHeight
        ));
        const columns = Math.ceil(Math.sqrt(
            squaresCount * spreadWidth / spreadHeight
        ));
        const rows = Math.ceil(squaresCount / columns);
        const cellWidth = spreadWidth / columns;
        const cellHeight = spreadHeight / rows;

        for (let index = 0; index < squaresCount; index += 1) {
            const size = 12 + Math.floor(Math.random() * 21);
            const column = index % columns;
            const row = Math.floor(index / columns);
            const left = Math.max(0, Math.min(
                spreadLeft + (column + 0.2 + Math.random() * 0.6) * cellWidth - size / 2,
                window.innerWidth - size
            ));
            const top = Math.max(0, Math.min(
                spreadTop + (row + 0.2 + Math.random() * 0.6) * cellHeight - size / 2,
                window.innerHeight - size
            ));
            const element = document.createElement("div");
            element.className = "framer-glitch-square";
            element.setAttribute("aria-hidden", "true");
            Object.assign(element.style, {
                position: "fixed",
                left: `${left}px`,
                top: `${top}px`,
                width: `${size}px`,
                height: `${size}px`,
                zIndex: String(Number.isFinite(referenceZIndex) ? referenceZIndex + 1 : 2),
                animationDelay: `${-Math.random() * 900}ms`
            });
            document.body.appendChild(element);
            elements.push(element);
        }

        this.glitches.set(i, elements);
        return elements.length;
    }

    removeGlitch(i, index) {
        const elements = this.glitches.get(i);
        if (!elements) {
            return false;
        }
        if (index === undefined) {
            elements.forEach((element) => element.remove());
            this.glitches.delete(i);
            return true;
        }
        if (!Number.isInteger(index) || index < 0 || index >= elements.length) {
            throw new RangeError(`Glitch square index "${index}" is out of range.`);
        }

        elements[index].remove();
        elements.splice(index, 1);
        if (elements.length === 0) {
            this.glitches.delete(i);
        }
        return true;
    }

    hitsGlitches(left, top) {
        if (this.glitches.size === 0 || !this.character_main_scene) {
            return false;
        }

        const character = this.character_main_scene;
        const bounds = character.get_hitbox_bounds(left, top);
        for (const elements of this.glitches.values()) {
            for (const element of elements) {
                if (!element.isConnected) {
                    continue;
                }
                const glitchBounds = element.getBoundingClientRect();
                if (
                    bounds.left < glitchBounds.right &&
                    bounds.right > glitchBounds.left &&
                    bounds.top < glitchBounds.bottom &&
                    bounds.bottom > glitchBounds.top
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    update_following_characters() {
        if (this.followingCharacters.length === 0 || !this.character_main_scene) {
            return;
        }

        const mainCharacter = this.character_main_scene;
        const mainTop = parseFloat(mainCharacter.character_dom.style.top) || 0;
        const mainLeft = parseFloat(mainCharacter.character_dom.style.left) || 0;
        const trailingDirections = {
            top: { top: 1, left: 0 },
            bottom: { top: -1, left: 0 },
            left: { top: 0, left: 1 },
            right: { top: 0, left: -1 }
        };
        const trailingDirection = trailingDirections[mainCharacter.facingDirection] ||
            trailingDirections.bottom;

        this.followingCharacters.forEach(({ character, distance }) => {
            if (character.isAnimating) {
                return;
            }

            const element = character.character_dom;
            const currentTop = parseFloat(element.style.top) || 0;
            const currentLeft = parseFloat(element.style.left) || 0;
            const targetTop = mainTop + trailingDirection.top * distance;
            const targetLeft = mainLeft + trailingDirection.left * distance;
            const deltaTop = targetTop - currentTop;
            const deltaLeft = targetLeft - currentLeft;
            const distanceToTarget = Math.hypot(deltaTop, deltaLeft);

            if (distanceToTarget <= 1) {
                if (character.isWalking && typeof character.stop === "function") {
                    character.stop();
                }
                return;
            }

            const step = Math.min(5, distanceToTarget);
            const nextTop = currentTop + deltaTop / distanceToTarget * step;
            const nextLeft = currentLeft + deltaLeft / distanceToTarget * step;
            const direction = Math.abs(deltaTop) > Math.abs(deltaLeft)
                ? (deltaTop < 0 ? "top" : "bottom")
                : (deltaLeft < 0 ? "left" : "right");

            if (character.isNPC) {
                element.style.top = `${nextTop}px`;
                element.style.left = `${nextLeft}px`;
                element.style.zIndex = String(Math.round(nextTop + element.offsetHeight));
            } else {
                character.walk(
                    nextTop,
                    nextLeft,
                    direction,
                    Math.floor(performance.now() / 125) % 2
                );
            }
        });
    }

    set_character_position(top, left) {
        this.characterPosition = { top, left };
        if (this.character_main_scene && this.character_main_scene.character_dom) {
            this.character_main_scene.character_dom.style.top = `${top}px`;
            this.character_main_scene.character_dom.style.left = `${left}px`;
            this.character_main_scene.character_dom.style.zIndex = String(Math.round(
                top + this.character_main_scene.character_dom.offsetHeight
            ));
        }
    }

    createPlaceApi() {
        const deletar = () => this.deleteNextPlaceObject();
        deletar.tudo = () => this.clearCreatedPlaceObjects();
        deletar.quantidade = () => this.createdPlaceObjects.length;

        return {
            criar: {
                caixa: (options) => this.createPlaceObject("caixa", options),
                caminho: (options) => this.createPlaceObject("caminho", options),
                bola: (options) => this.createPlaceObject("bola", options),
                parede: (options) => this.createPlaceObject("parede", options)
            },
            deletar
        };
    }

    createPlaceObject(type, options = {}) {
        const dimensions = {
            caixa: { width: 86, height: 72 },
            caminho: { width: 132, height: 38 },
            bola: { width: 52, height: 52 },
            parede: { width: 116, height: 92 }
        }[type];
        if (!dimensions) {
            throw new TypeError(`Unknown place object "${type}".`);
        }
        if (options == null) {
            options = {};
        }
        if (typeof options !== "object" || Array.isArray(options)) {
            throw new TypeError("Place object options must be an object.");
        }
        for (const key of ["offsetX", "offsetY"]) {
            if (options[key] !== undefined && !Number.isFinite(options[key])) {
                throw new TypeError(`Place object ${key} must be a finite number.`);
            }
        }
        const character = this.character_main_scene;
        if (!character || !character.character_dom || !character.character_dom.isConnected) {
            throw new Error("A main character must be on screen before creating place objects.");
        }

        const rect = character.character_dom.getBoundingClientRect();
        const direction = character.facingDirection || "bottom";
        const horizontal = direction === "left" || direction === "right";
        const objectExtent = horizontal ? dimensions.width : dimensions.height;
        const characterExtent = horizontal ? rect.width : rect.height;
        const distance = characterExtent / 2 + objectExtent / 2 + 12;
        const directionOffsets = {
            bottom: { x: 0, y: distance },
            top: { x: 0, y: -distance },
            left: { x: -distance, y: 0 },
            right: { x: distance, y: 0 }
        };
        const facingOffset = directionOffsets[direction] || directionOffsets.bottom;
        const centerX = rect.left + rect.width / 2 + facingOffset.x + (options.offsetX || 0);
        const centerY = rect.top + rect.height / 2 + facingOffset.y + (options.offsetY || 0);
        const scale = Math.max(0.55, Math.min(1.15, 0.62 + centerY / window.innerHeight * 0.52));
        const element = document.createElement("div");
        const sequence = ++this.placeObjectSequence;
        element.className = `place-object place-object-${type}`;
        element.dataset.placeObjectId = String(sequence);
        element.dataset.blocksMovement = String(type === "caixa" || type === "parede");
        element.setAttribute("aria-label", `${type} criado no cenário`);
        element.style.width = `${dimensions.width}px`;
        element.style.height = `${dimensions.height}px`;
        element.style.left = `${centerX}px`;
        element.style.top = `${centerY}px`;
        element.style.zIndex = String(Math.round(centerY + dimensions.height * scale / 2));
        element.style.setProperty("--place-scale", String(scale));
        document.body.appendChild(element);
        this.createdPlaceObjects.push(element);
        return element;
    }

    deleteNextPlaceObject() {
        const element = this.createdPlaceObjects.shift();
        if (!element) {
            return false;
        }
        element.remove();
        return true;
    }

    clearCreatedPlaceObjects() {
        const removedCount = this.createdPlaceObjects.length;
        this.createdPlaceObjects.forEach((element) => element.remove());
        this.createdPlaceObjects.length = 0;
        return removedCount;
    }

    hitsCreatedPlaceObject(top, left) {
        const characterBounds = this.character_main_scene.get_hitbox_bounds(left, top);

        return this.createdPlaceObjects.some((element) => {
            if (!element.isConnected || element.dataset.blocksMovement !== "true") {
                return false;
            }
            const objectBounds = element.getBoundingClientRect();
            return !(
                characterBounds.right <= objectBounds.left ||
                characterBounds.left >= objectBounds.right ||
                characterBounds.bottom <= objectBounds.top ||
                characterBounds.top >= objectBounds.bottom
            );
        });
    }

    start_talk(character, dialog) {

        this.isOnDialog = true;

        const dialogBox = document.querySelector(".dialog-box");
        const dialogBoxChName = document.querySelector(".dialog-box #dialog-character-name");
        const dialogContent = document.querySelector(".dialog-box #dialog-content");

        dialogBox.classList.remove('closed');
        dialogBoxChName.innerHTML = character.name;
        dialogContent.innerHTML = ""
        const dialogArray = Array.from(dialog);

        dialogArray.forEach((x, i) => {
        setTimeout(() => {
            character.effects.talk_sound.play();
            dialogContent.innerHTML += x;
        
            if (i === dialogArray.length - 1) {
            this.isOnDialog = false;
            }
        }, 50 + (i * 10));
    });

    }

    hitNPCHitbox(testTop, testLeft, npc) {
        const characterBounds = this.character_main_scene.get_hitbox_bounds(testLeft, testTop);
        const npcBounds = npc.get_hitbox_bounds();
        const interactionMargin = 5;

        return !(
            characterBounds.right + interactionMargin <= npcBounds.left ||
            characterBounds.left - interactionMargin >= npcBounds.right ||
            characterBounds.bottom + interactionMargin <= npcBounds.top ||
            characterBounds.top - interactionMargin >= npcBounds.bottom
        );
    }

    openCodeBox(options = {}) {
        if (this.codeBox) {
            this.codeBox.input.focus();
            return this.codeBox.element;
        }
        if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new TypeError("Code box options must be an object.");
        }
        if (options.validate != null && typeof options.validate !== "function") {
            throw new TypeError("Code box validate must be a function.");
        }
        if (options.onSubmit != null && typeof options.onSubmit !== "function") {
            throw new TypeError("Code box onSubmit must be a function.");
        }
        if (options.onCode != null && typeof options.onCode !== "function") {
            throw new TypeError("Code box onCode must be a function.");
        }
        const mode = options.mode || "match";
        if (!["match", "on-code"].includes(mode)) {
            throw new TypeError(`Unsupported code box mode "${mode}".`);
        }
        if (mode === "match" &&
            (typeof options.expectedCode !== "string" || options.expectedCode.trim() === "")) {
            throw new TypeError("Code box expectedCode must contain the quest's expected JavaScript solution.");
        }
        const executionContext = options.context || {};
        if (!executionContext || typeof executionContext !== "object" || Array.isArray(executionContext)) {
            throw new TypeError("Code box context must be an object of quest APIs.");
        }
        const contextNames = Object.keys(executionContext);
        if (contextNames.some((key) => !/^[A-Za-z_$][\w$]*$/.test(key) || ["framer", "scene", "character", "quest", "lugar"].includes(key))) {
            throw new TypeError("Code box context keys must be valid identifiers and cannot replace built-in game APIs.");
        }

        const panel = document.createElement("section");
        panel.className = "code-box";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-label", options.description || "Editor de código");

        const description = document.createElement("p");
        description.className = "code-box-description";
        description.textContent = options.description || "Escreva o código para resolver esta etapa.";

        const editor = document.createElement("div");
        editor.className = "code-editor";
        const gutter = document.createElement("pre");
        gutter.className = "code-editor-gutter";
        gutter.setAttribute("aria-hidden", "true");
        const highlight = document.createElement("pre");
        highlight.className = "code-editor-highlight";
        highlight.setAttribute("aria-hidden", "true");
        const code = document.createElement("code");
        highlight.appendChild(code);
        const input = document.createElement("textarea");
        input.className = "code-editor-input";
        input.placeholder = options.placeholder || "function resolver() {\n    // seu código aqui\n}";
        input.spellcheck = false;
        input.autocapitalize = "off";
        input.autocomplete = "off";
        input.autocorrect = "off";
        input.setAttribute("aria-label", "Código JavaScript");
        input.value = options.initialCode || "";
        editor.append(gutter, highlight, input);

        const status = document.createElement("div");
        status.className = "code-box-status";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        panel.append(description, editor, status);
        document.body.appendChild(panel);

        this.codeBoxPreviousControlsDisabled = this.controlsDisabled;
        this.controlsDisabled = true;
        this.codeBox = {
            element: panel,
            input,
            code,
            gutter,
            status,
            checking: false,
            sceneOnOpen: this.sceneManager && this.sceneManager.currentScene,
            options
        };

        const syncEditorScroll = () => {
            highlight.scrollTop = input.scrollTop;
            highlight.scrollLeft = input.scrollLeft;
            gutter.scrollTop = input.scrollTop;
        };
        const updateCode = () => {
            this.updateCodeBox();
            syncEditorScroll();
            if (mode === "match") {
                this.checkCodeBoxSolution();
            }
        };
        input.addEventListener("input", updateCode);
        input.addEventListener("scroll", syncEditorScroll);
        input.addEventListener("keydown", (event) => {
            if (event.key === "Tab") {
                event.preventDefault();
                const start = input.selectionStart;
                const end = input.selectionEnd;
                input.setRangeText("    ", start, end, "end");
                updateCode();
            } else if (event.key === "Escape") {
                event.preventDefault();
                this.closeCodeBox();
            } else if (event.key === "Enter" && mode === "on-code" && !event.shiftKey) {
                event.preventDefault();
                this.runCodeBox();
            }
        });

        updateCode();
        this.positionCodeBox();
        input.focus();
        this.followCodeBox();
        return panel;
    }

    open_code_box(options = {}) {
        return this.openCodeBox(options);
    }

    closeCodeBox() {
        if (!this.codeBox) {
            return false;
        }

        const { element, options, sceneOnOpen } = this.codeBox;
        element.remove();
        this.codeBox = null;
        if (!this.sceneManager || this.sceneManager.currentScene === sceneOnOpen) {
            this.controlsDisabled = this.codeBoxPreviousControlsDisabled;
        }
        if (this.codeBoxFrame !== null) {
            window.cancelAnimationFrame(this.codeBoxFrame);
            this.codeBoxFrame = null;
        }
        if (typeof options.onClose === "function") {
            options.onClose();
        }
        return true;
    }

    close_code_box() {
        return this.closeCodeBox();
    }

    positionCodeBox() {
        if (!this.codeBox || !this.character_main_scene?.character_dom) {
            return;
        }

        const characterRect = this.character_main_scene.character_dom.getBoundingClientRect();
        const panel = this.codeBox.element;
        const panelRect = panel.getBoundingClientRect();
        const margin = 12;
        const canPlaceRight = characterRect.right + margin + panelRect.width <= window.innerWidth - margin;
        const left = canPlaceRight
            ? characterRect.right + margin
            : characterRect.left - panelRect.width - margin;
        const top = Math.max(
            margin,
            Math.min(characterRect.top, window.innerHeight - panelRect.height - margin)
        );

        panel.style.left = `${Math.max(margin, Math.min(left, window.innerWidth - panelRect.width - margin))}px`;
        panel.style.top = `${top}px`;
    }

    followCodeBox() {
        if (!this.codeBox) {
            return;
        }
        this.positionCodeBox();
        this.codeBoxFrame = window.requestAnimationFrame(() => this.followCodeBox());
    }

    updateCodeBox(error = null) {
        if (!this.codeBox) {
            return;
        }

        const { input, code, gutter, status } = this.codeBox;
        const source = input.value;
        const errorOffset = error && Number.isInteger(error.offset) ? error.offset : -1;
        code.innerHTML = this.highlightJavaScript(source, errorOffset);

        const lineCount = Math.max(1, source.split("\n").length);
        gutter.textContent = Array.from({ length: lineCount }, (_, index) => {
            const lineNumber = index + 1;
            return error && error.line === lineNumber ? `${lineNumber}  !` : `${lineNumber}`;
        }).join("\n");
        gutter.classList.toggle("has-error", Boolean(error));

        if (error) {
            status.className = "code-box-status is-error";
            status.textContent = `Linha ${error.line}, coluna ${error.column}: ${error.message}`;
            return;
        }

        try {
            if (source.trim()) {
                this.createCodeFunction(source, this.codeBox.options.mode);
            }
            status.className = "code-box-status is-valid";
            status.textContent = source.trim()
                ? (this.codeBox.options.mode === "on-code"
                    ? "Sintaxe válida. Enter executa; Shift+Enter cria uma linha."
                    : "Sintaxe válida.")
                : "Aguardando código JavaScript.";
        } catch (syntaxError) {
            const location = this.getCodeErrorLocation(syntaxError, source);
            status.className = "code-box-status is-error";
            status.textContent = `Linha ${location.line}, coluna ${location.column}: ${syntaxError.message}`;
            gutter.textContent = Array.from({ length: lineCount }, (_, index) => {
                const lineNumber = index + 1;
                return lineNumber === location.line ? `${lineNumber}  !` : `${lineNumber}`;
            }).join("\n");
            gutter.classList.add("has-error");
            code.innerHTML = this.highlightJavaScript(source, location.offset);
        }
    }

    highlightJavaScript(source, errorOffset = -1) {
        const tokenPattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|false|finally|for|from|function|if|import|in|instanceof|let|new|null|of|return|static|super|switch|this|throw|true|try|typeof|undefined|var|void|while|with|yield)\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*(?=\s*\()|[+\-*\/%=<>!&|^~?:]+|[{}()[\].,;])/g;
        let result = "";
        let lastIndex = 0;
        let match;
        while ((match = tokenPattern.exec(source)) !== null) {
            result += this.escapeCodeHtml(source.slice(lastIndex, match.index));
            const token = match[0];
            let tokenClass = "token-operator";
            if (token.startsWith("//") || token.startsWith("/*")) {
                tokenClass = "token-comment";
            } else if (/^["'`]/.test(token)) {
                tokenClass = "token-string";
            } else if (/^\d/.test(token)) {
                tokenClass = "token-number";
            } else if (/^(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|false|finally|for|from|function|if|import|in|instanceof|let|new|null|of|return|static|super|switch|this|throw|true|try|typeof|undefined|var|void|while|with|yield)$/.test(token)) {
                tokenClass = "token-keyword";
            } else if (/^[A-Za-z_$]/.test(token)) {
                tokenClass = "token-function";
            }
            const tokenEnd = match.index + token.length;
            if (errorOffset >= match.index && errorOffset < tokenEnd) {
                const insideOffset = errorOffset - match.index;
                result += `<span class="${tokenClass}">${this.escapeCodeHtml(token.slice(0, insideOffset))}</span>`;
                result += `<mark class="code-error-marker">${this.escapeCodeHtml(token[insideOffset]) || " "}</mark>`;
                result += `<span class="${tokenClass}">${this.escapeCodeHtml(token.slice(insideOffset + 1))}</span>`;
            } else {
                result += `<span class="${tokenClass}">${this.escapeCodeHtml(token)}</span>`;
            }
            lastIndex = tokenEnd;
        }
        result += this.escapeCodeHtml(source.slice(lastIndex));
        return source.endsWith("\n") ? result : `${result}\n`;
    }

    escapeCodeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    getCodeErrorLocation(error, source) {
        const line = Number(error.lineNumber || error.line);
        const column = Number(error.columnNumber || error.column);
        const lines = source.split("\n");
        const message = String(error.message);
        const stackLocation = String(error.stack || "").match(/<anonymous>:(\d+):(\d+)/);
        const messageLocation = message.match(/\((\d+):(\d+)\)/) ||
            message.match(/line\s+(\d+)(?:\s*,?\s*column\s+(\d+))?/i);
        const resolvedLine = Number.isInteger(line) && line > 0
            ? line
            : stackLocation
                ? Math.max(1, Number(stackLocation[1]) - 1)
                : messageLocation ? Number(messageLocation[1]) : 1;
        const resolvedColumn = Number.isInteger(column) && column > 0
            ? column
            : stackLocation
                ? Number(stackLocation[2])
                : messageLocation && messageLocation[2] ? Number(messageLocation[2]) : 1;
        const boundedLine = Math.min(resolvedLine, lines.length);
        let offset = lines.slice(0, boundedLine - 1).reduce((total, text) => total + text.length + 1, 0);
        offset += Math.min(resolvedColumn - 1, (lines[boundedLine - 1] || "").length);
        return {
            line: boundedLine,
            column: resolvedColumn,
            offset,
            message: error.message
        };
    }

    createCodeFunction(source, mode = "match", parameterNames = []) {
        if (mode === "on-code") {
            const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
            return new AsyncFunction(...parameterNames, `"use strict";\n${source}`);
        }
        return new Function(...parameterNames, `"use strict";\n${source}`);
    }

    findCodeSyntaxIssue(source) {
        const opening = new Map([["}", "{"], [")", "("], ["]", "["]]);
        const stack = [];
        let quote = null;
        let quoteOffset = -1;
        let inLineComment = false;
        let inBlockComment = false;

        for (let index = 0; index < source.length; index += 1) {
            const char = source[index];
            const next = source[index + 1];

            if (inLineComment) {
                if (char === "\n") {
                    inLineComment = false;
                }
                continue;
            }
            if (inBlockComment) {
                if (char === "*" && next === "/") {
                    inBlockComment = false;
                    index += 1;
                }
                continue;
            }
            if (quote) {
                if (char === "\\") {
                    index += 1;
                } else if (char === quote) {
                    quote = null;
                }
                continue;
            }
            if (char === "/" && next === "/") {
                inLineComment = true;
                index += 1;
            } else if (char === "/" && next === "*") {
                inBlockComment = true;
                index += 1;
            } else if (char === "'" || char === '"' || char === "`") {
                quote = char;
                quoteOffset = index;
            } else if (char === "{" || char === "(" || char === "[") {
                stack.push({ char, offset: index });
            } else if (opening.has(char)) {
                const last = stack.pop();
                if (!last || last.char !== opening.get(char)) {
                    return { offset: index, message: `Delimitador inesperado "${char}".` };
                }
            }
        }

        if (quote) {
            return { offset: quoteOffset, message: "String não foi fechada." };
        }
        if (inBlockComment) {
            return { offset: Math.max(0, source.lastIndexOf("/*")), message: "Comentário não foi fechado." };
        }
        if (stack.length > 0) {
            const last = stack[stack.length - 1];
            return { offset: last.offset, message: `Delimitador "${last.char}" não foi fechado.` };
        }
        return null;
    }

    getCodeSimilarity(first, second) {
        const normalize = (code) => code.replace(/\s+/g, "").trim();
        const left = normalize(first);
        const right = normalize(second);
        const maxLength = Math.max(left.length, right.length);
        if (maxLength === 0) {
            return 1;
        }
        if (Math.abs(left.length - right.length) / maxLength > 0.1) {
            return 0;
        }

        let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
        for (let row = 1; row <= left.length; row += 1) {
            const current = [row];
            for (let column = 1; column <= right.length; column += 1) {
                const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
                current[column] = Math.min(
                    previous[column] + 1,
                    current[column - 1] + 1,
                    previous[column - 1] + substitutionCost
                );
            }
            previous = current;
        }
        return 1 - previous[right.length] / maxLength;
    }

    async checkCodeBoxSolution() {
        if (!this.codeBox) {
            return false;
        }

        const editor = this.codeBox;
        const source = editor.input.value;
        if (editor.checking || !source.trim()) {
            return false;
        }

        try {
            this.createCodeFunction(source);
        } catch (syntaxError) {
            return false;
        }

        if (this.getCodeSimilarity(source, editor.options.expectedCode) < 0.9) {
            return false;
        }

        editor.checking = true;
        editor.input.readOnly = true;
        try {
            if (typeof editor.options.validate === "function") {
                const validationResult = await editor.options.validate(source, {
                    framer: this,
                    character: this.character_main_scene,
                    sceneManager: this.sceneManager
                });
                if (this.codeBox !== editor) {
                    return false;
                }
                if (validationResult !== true) {
                    const message = typeof validationResult === "string"
                        ? validationResult
                        : "A solução ainda não atende ao objetivo.";
                    editor.status.className = "code-box-status is-error";
                    editor.status.textContent = message;
                    return false;
                }
            }

            if (typeof editor.options.onSubmit === "function") {
                const result = await editor.options.onSubmit(source, {
                    framer: this,
                    character: this.character_main_scene,
                    sceneManager: this.sceneManager
                });
                if (this.codeBox !== editor) {
                    return false;
                }
                if (result === false || typeof result === "string") {
                    editor.status.className = "code-box-status is-error";
                    editor.status.textContent = typeof result === "string"
                        ? result
                        : "A solução ainda não atende ao objetivo.";
                    return false;
                }
            }

            this.closeCodeBox();
            return true;
        } catch (error) {
            editor.status.className = "code-box-status is-error";
            editor.status.textContent = `Falha ao validar a solução: ${error.message}`;
            return false;
        } finally {
            editor.checking = false;
            if (this.codeBox === editor) {
                editor.input.readOnly = false;
            }
        }
    }

    async runCodeBox() {
        if (!this.codeBox) {
            return false;
        }
        const editor = this.codeBox;
        const source = editor.input.value;
        if (!source.trim() || editor.checking) {
            return false;
        }

        editor.checking = true;
        editor.input.readOnly = true;
        editor.status.className = "code-box-status";
        editor.status.textContent = "Executando...";
        try {
            const context = {
                framer: this,
                scene: this.sceneManager,
                character: this.character_main_scene,
                quest: editor.options.quest || {},
                lugar: this.placeApi,
                ...(editor.options.context || {})
            };
            const parameterNames = Object.keys(context);
            const parameterValues = Object.values(context);
            const script = this.createCodeFunction(source, "on-code", parameterNames);
            const result = await script(...parameterValues);

            if (this.codeBox !== editor) {
                return false;
            }

            let callbackResult = result;
            if (typeof editor.options.onCode === "function") {
                callbackResult = await editor.options.onCode(result, context);
            }
            if (this.codeBox !== editor) {
                return false;
            }
            if (callbackResult === false || typeof callbackResult === "string") {
                editor.status.className = "code-box-status is-error";
                editor.status.textContent = typeof callbackResult === "string"
                    ? callbackResult
                    : "O script executou, mas a quest ainda não foi concluída.";
                return false;
            }
            if (callbackResult === true) {
                this.closeCodeBox();
                return true;
            }

            editor.status.className = "code-box-status is-valid";
            editor.status.textContent = "Código executado.";
            return true;
        } catch (error) {
            const location = this.getCodeErrorLocation(error, source);
            const delimiterIssue = this.findCodeSyntaxIssue(source);
            const issue = delimiterIssue || location;
            editor.status.className = "code-box-status is-error";
            editor.status.textContent = `Linha ${issue.line || location.line}, coluna ${issue.column || location.column}: ${issue.message}`;
            editor.gutter.classList.add("has-error");
            editor.code.innerHTML = this.highlightJavaScript(source, issue.offset);
            return false;
        } finally {
            editor.checking = false;
            if (this.codeBox === editor) {
                editor.input.readOnly = false;
                editor.input.focus();
            }
        }
    }
}