class Framer {
    constructor() {
        this.scene = window;
        this.character_main_scene = null;
        this.readyToDialog = false;
        this.isOnDialog = false;
        this.characters = [];
        this.npcs = [];
        this.controlsDisabled = false;
        this.sceneManager = null;
        this.interactionCharacter = null;
        this.characterPosition = { top: 100, left: 100 };
        this.codeBox = null;
        this.codeBoxFrame = null;
        this.codeBoxPreviousControlsDisabled = false;
        this.createdPlaceObjects = [];
        this.placeObjectSequence = 0;
        this.placeApi = this.createPlaceApi();
    }

    register_characters(characters = []) {
        characters.forEach(x=>{
            x.framer = this;
            if(!x.isNPC) this.characters.push(x);
            else this.npcs.push(x);
        })
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

        this.character_main_scene.character_dom.style.top = currentTop + 'px';
        this.character_main_scene.character_dom.style.left = currentLeft + 'px';

        const speed = 5;
        let frameCounter = 0;
        let currentSpriteIndex = 0;
        const animationSpeed = 8;

        const gameLoop = () => {
            currentTop = this.characterPosition.top;
            currentLeft = this.characterPosition.left;

            if (this.character_main_scene.isAnimating) {
                requestAnimationFrame(gameLoop);
                return;
            }

            let isMoving = false;
            let direction = null;

            let nextTop = currentTop;
            let nextLeft = currentLeft;

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
                keysJustPressed['KeyP'] &&
                !this.codeBox &&
                (this.readyToDialog || (this.sceneManager && this.sceneManager.currentScene)) &&
                !this.isOnDialog
            ) {
                const character = this.interactionCharacter || this.npcs[0];
                this.sceneManager.handleInteraction(character);
                
            }

            if (isMoving) {
                this.character_main_scene.facingDirection = direction;
                let npcCollision = false;
                let interactionCharacter = null;

                for (let npc of this.npcs) {
                    if (this.hitNPCHitbox(nextTop, nextLeft, npc.character_dom)) {
                        npcCollision = true;
                        interactionCharacter = npc;
                        break;
                    }
                }

                const barrierCollision = !npcCollision && this.sceneManager &&
                    !this.sceneManager.canMove(
                        this.character_main_scene,
                        nextTop,
                        nextLeft,
                        currentTop,
                        currentLeft
                    );
                const placeObjectCollision = !npcCollision && !barrierCollision &&
                    this.hitsCreatedPlaceObject(nextTop, nextLeft);

                if (!npcCollision && !barrierCollision && !placeObjectCollision) {
                    currentTop = nextTop;
                    currentLeft = nextLeft;
                    this.characterPosition = { top: currentTop, left: currentLeft };

                    frameCounter++;
                    if (frameCounter >= animationSpeed) {
                        currentSpriteIndex = (currentSpriteIndex === 0) ? 1 : 0;
                        frameCounter = 0;
                    }
                    [].slice.call(document.querySelectorAll('.npc')).map(x=>x.innerHTML = ``)
                    this.readyToDialog = false;
                    this.interactionCharacter = null;

                    this.character_main_scene.walk(currentTop, currentLeft, direction, currentSpriteIndex);
                } else {
                    this.character_main_scene.stop();
                    if (npcCollision) {
                        [].slice.call(document.querySelectorAll('.npc')).map(x=>x.innerHTML = `<div class="pressToTalk">P</div>`);
                        [].slice.call(document.querySelectorAll('.npc .pressToTalk')).map(x=>x.style.display = "block");
                    }
                    this.readyToDialog = npcCollision;
                    this.interactionCharacter = interactionCharacter;
                }
            } else {
                this.character_main_scene.stop();
                frameCounter = 0;
                currentSpriteIndex = 0;
            }

            keysJustPressed['KeyP'] = false;
            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
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
        const character = this.character_main_scene.character_dom;
        const width = character.offsetWidth;
        const height = character.offsetHeight;
        const characterBounds = {
            left,
            right: left + width,
            top,
            bottom: top + height
        };

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
        const charWidth = this.character_main_scene.character_dom.offsetWidth;
        const charHeight = this.character_main_scene.character_dom.offsetHeight;

        const charLeft = testLeft;
        const charRight = testLeft + charWidth;
        const charTop = testTop;
        const charBottom = testTop + charHeight;

        const npcLeft = npc.offsetLeft;
        const npcRight = npc.offsetLeft + npc.offsetWidth;
        const npcTop = npc.offsetTop;
        const npcBottom = npc.offsetTop + npc.offsetHeight;

        return !(
            charRight < npcLeft ||
            charLeft > npcRight ||
            charBottom < npcTop ||
            charTop > npcBottom
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