class Sprite {
    constructor() {
        this.name = "Dummy"
        this.codname = "Dummy";
        this.sprite = {
            "idle": '',
            "walk_front": [],
            "walk_back": [],
            "walk_side": [],
            "walk_otherside": [],
            "face_card": "",
            "npc_animation": {}
        }

        this.effects = {
            "talk_sound": "",
            "walk_sound": ""
        }
        this.hitbox = {
            "top": 0,
            "left": 0,
            "right": 0,
            "bottom": 0
        }
        this.character_dom = document.createElement('div');
        this.lastDirection = null;
        this.facingDirection = "bottom";
        this.isWalking = false;
        this.isNPC = false;
        this.spriteAssets = new Map();
        this.spriteRequestId = 0;
        this.spriteReady = false;
        this.currentSpritePath = null;
        this.destroyed = false;
        this.hasManualPosition = false;
    }

    get_hitbox_bounds(left = this.character_dom.offsetLeft, top = this.character_dom.offsetTop) {
        const width = this.character_dom.offsetWidth;
        const height = this.character_dom.offsetHeight;
        const hitboxWidth = Math.min(width * 0.46, 58);
        const hitboxHeight = Math.min(height * 0.3, 40);
        const bottomInset = height * 0.08;

        return {
            left: left + (width - hitboxWidth) / 2,
            right: left + (width + hitboxWidth) / 2,
            top: top + height - bottomInset - hitboxHeight,
            bottom: top + height - bottomInset
        };
    }

    load_sprite(path) {
        const existingAsset = this.spriteAssets.get(path);
        if (existingAsset) {
            return existingAsset;
        }

        const image = new Image();
        const asset = { image, loaded: false, promise: null };
        asset.promise = new Promise((resolve) => {
            image.onload = () => {
                const decoded = typeof image.decode === "function"
                    ? image.decode().catch((error) => {
                        if (!image.naturalWidth) {
                            throw error;
                        }
                    })
                    : Promise.resolve();
                decoded.then(() => {
                    asset.loaded = true;
                    resolve(asset);
                }).catch((error) => {
                    console.error(`Failed to decode sprite "${path}".`, error);
                    resolve(null);
                });
            };
            image.onerror = () => {
                console.error(`Failed to load sprite "${path}".`);
                resolve(null);
            };
            image.src = path;
        });

        this.spriteAssets.set(path, asset);
        return asset;
    }

    preload_sprites(paths) {
        return Promise.all(paths.map((path) => this.load_sprite(path).promise)).then((assets) => {
            if (assets.some((asset) => !asset)) {
                throw new Error(`One or more sprites failed to load for "${this.name}".`);
            }
        });
    }

    set_sprite(path) {
        if (path === this.currentSpritePath && this.spriteReady) {
            return;
        }
        const asset = this.load_sprite(path);
        const requestId = ++this.spriteRequestId;
        this.currentSpritePath = path;
        const applySprite = () => {
            if (requestId !== this.spriteRequestId) {
                return;
            }
            this.character_dom.style.backgroundImage = `url("${path}")`;
            this.character_dom.style.visibility = "visible";
            this.spriteReady = true;
        };

        if (asset.loaded) {
            applySprite();
        } else {
            asset.promise.then((loadedAsset) => {
                if (loadedAsset) {
                    applySprite();
                }
            });
        }
    }
      
    register_character(realname, name, NPC = false) {
        this.name = realname;
        this.codname = name

        this.isNPC = NPC;
        if (!NPC) {
            this.sprite.idle = 'assets/sprites/' + name + '/idle.png'
            this.sprite.walk_front = [
                'assets/sprites/' + name + '/walking_1.png',
                'assets/sprites/' + name + '/walking_2.png'
            ]
            this.sprite.walk_back = [
                'assets/sprites/' + name + '/walking_back_1.png',
                'assets/sprites/' + name + '/walking_back_2.png'
            ]
            this.sprite.walk_side = [
                'assets/sprites/' + name + '/walking_side_1.png',
                'assets/sprites/' + name + '/walking_side_2.png'
            ]
            this.sprite.walk_otherside = [
                'assets/sprites/' + name + '/walking_otherside_1.png',
                'assets/sprites/' + name + '/walking_otherside_2.png'
            ]
            this.sprite.face_card = 'assets/sprites/' + name + '/face_card.png'

            this.effects.talk_sound = 'assets/sprites/SpriteSheets/' + name + '_talk.wav'
            this.effects.walk_sound = 'assets/sprites/SpriteSheets/walk.wav'

            this.character_dom.classList.add('character');
            this.set_sprite(this.sprite.idle);
        } else {
            this.sprite.npc_animation.idle = [
                'assets/sprites/' + name + '/animation_1.png',
                'assets/sprites/' + name + '/animation_2.png',
                'assets/sprites/' + name + '/animation_3.png'
            ]

            this.sprite.face_card = 'assets/sprites/' + name + '/face_card.png'

            this.effects.talk_sound = 'assets/sprites/SpriteSheets/npc_talk.wav'
            this.effects.walk_sound = 'assets/sprites/SpriteSheets/walk.wav'

            this.character_dom.classList.add('npc');
            this.set_sprite(this.sprite.npc_animation.idle[0]);

            let currentSpriteIndex = 0;
            const animationSpeed = 10;
            let frameCounter = 0;

            const animate = () => {
                if (this.destroyed) {
                    return;
                }
                frameCounter++;
                if (frameCounter >= animationSpeed) {
                    currentSpriteIndex = (currentSpriteIndex + 1) % this.sprite.npc_animation.idle.length;
                    frameCounter = 0;
                    this.set_sprite(this.sprite.npc_animation.idle[currentSpriteIndex]);
                }
                requestAnimationFrame(animate);
            };

            requestAnimationFrame(animate);
        }

        this.character_dom.style.backgroundSize = 'contain';
        this.character_dom.style.backgroundRepeat = 'no-repeat';
        this.character_dom.style.backgroundPosition = 'center';
        this.character_dom.style.imageRendering = 'pixelated';
        this.character_dom.style.visibility = 'hidden';
        this.character_dom.style.width = '130px';
        this.character_dom.style.height = '130px';
        this.character_dom.style.position = 'absolute';
        this.character_dom.style.left = '0px';
        this.character_dom.style.top = '0px';
        this.character_dom.id = realname;
        document.body.appendChild(this.character_dom);
        void this.preload_sprites([
            this.sprite.idle,
            ...this.sprite.walk_front,
            ...this.sprite.walk_back,
            ...this.sprite.walk_side,
            ...this.sprite.walk_otherside,
            ...(this.sprite.npc_animation.idle || []),
            this.sprite.face_card
        ].filter(Boolean)).catch((error) => {
            console.error(`Failed to preload sprites for "${this.name}".`, error);
        });

        this.hitbox.top = this.character_dom.offsetTop;
        this.hitbox.left = this.character_dom.offsetLeft;
        this.hitbox.right = this.character_dom.offsetLeft + this.character_dom.offsetWidth;
        this.hitbox.bottom = this.character_dom.offsetTop + this.character_dom.offsetHeight;

        this.startSoundEffect();
    }

    set_position(x, y) {
        if (x !== "portal_reference" && (x != null || y != null)) {
            this.hasManualPosition = true;
        }

        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const elementWidth = this.character_dom.offsetWidth || 0;
        const elementHeight = this.character_dom.offsetHeight || 0;

        if (x === "portal_reference") {
            if (y !== undefined && y !== null) {
                throw new TypeError('set_position("portal_reference") does not accept a y coordinate.');
            }

            const reference = assets.get("portal_reference");
            if (reference == null) {
                return this;
            }
            if (!["top", "bottom", "left", "right"].includes(reference)) {
                throw new TypeError(`Unsupported portal reference "${reference}".`);
            }

            const margin = 150;
            const referencePosition = {};
            if (reference === "left") {
                referencePosition.x = margin;
                referencePosition.y = (windowHeight - elementHeight) / 2;
            } else if (reference === "right") {
                referencePosition.x = windowWidth - elementWidth - margin;
                referencePosition.y = (windowHeight - elementHeight) / 2;
            } else if (reference === "top") {
                referencePosition.x = (windowWidth - elementWidth) / 2;
                referencePosition.y = margin;
            } else {
                referencePosition.x = (windowWidth - elementWidth) / 2;
                referencePosition.y = windowHeight - elementHeight - margin;
            }

            const portals = this.framer &&
                this.framer.sceneManager &&
                this.framer.sceneManager.portals;
            if (Array.isArray(portals)) {
                const referenceCenter = {
                    x: referencePosition.x + elementWidth / 2,
                    y: referencePosition.y + elementHeight / 2
                };
                const nearestPortal = portals.reduce((nearest, portal) => {
                    if (
                        !portal.element ||
                        !portal.element.isConnected ||
                        typeof portal.element.getBoundingClientRect !== "function"
                    ) {
                        return nearest;
                    }
                    const bounds = portal.element.getBoundingClientRect();
                    const distance = Math.hypot(
                        bounds.left + bounds.width / 2 - referenceCenter.x,
                        bounds.top + bounds.height / 2 - referenceCenter.y
                    );
                    return !nearest || distance < nearest.distance
                        ? { portal, bounds, distance }
                        : nearest;
                }, null);

                if (nearestPortal) {
                    const bounds = nearestPortal.bounds;
                    const portalDirection = nearestPortal.portal.direction || reference;
                    if (portalDirection === "left") {
                        referencePosition.x = bounds.right + 24;
                        referencePosition.y = bounds.top + (bounds.height - elementHeight) / 2;
                    } else if (portalDirection === "right") {
                        referencePosition.x = bounds.left - elementWidth - 24;
                        referencePosition.y = bounds.top + (bounds.height - elementHeight) / 2;
                    } else if (portalDirection === "top") {
                        referencePosition.x = bounds.left + (bounds.width - elementWidth) / 2;
                        referencePosition.y = bounds.bottom + 24;
                    } else if (portalDirection === "bottom") {
                        referencePosition.x = bounds.left + (bounds.width - elementWidth) / 2;
                        referencePosition.y = bounds.top - elementHeight - 24;
                    }
                }
            }

            x = referencePosition.x;
            y = referencePosition.y;
        }

        if (x !== undefined && x !== null) {
            let posX = x < 0 ? windowWidth - Math.abs(x) - elementWidth : x;
            posX = Math.max(0, Math.min(posX, windowWidth - elementWidth));

            this.character_dom.style.right = "";
            this.character_dom.style.left = posX + "px";
        }

        if (y !== undefined && y !== null) {
            let posY = y < 0 ? windowHeight - Math.abs(y) - elementHeight : y;
            posY = Math.max(0, Math.min(posY, windowHeight - elementHeight));

            this.character_dom.style.bottom = "";
            this.character_dom.style.top = posY + "px";
        }
        this.character_dom.style.zIndex = String(Math.round(
            (parseFloat(this.character_dom.style.top) || 0) + elementHeight
        ));

        if (this.framer && this.framer.character_main_scene === this) {
            this.framer.set_character_position(
                parseFloat(this.character_dom.style.top) || 0,
                parseFloat(this.character_dom.style.left) || 0
            );
        }
        return this;
    }

    startSoundEffect() {
        if(!(this.effects.talk_sound instanceof Audio)) 
            this.effects.talk_sound = new Audio(this.effects.talk_sound);

        if(!(this.effects.walk_sound instanceof Audio))
            this.effects.walk_sound = new Audio(this.effects.walk_sound);

        this.effects.talk_sound.autoPlay = false;
        this.effects.talk_sound.loop = false;
        this.effects.talk_sound.preload = 'auto';
        this.effects.walk_sound.preload = 'auto';
        this.effects.walk_sound.autoPlay = false;
        this.effects.walk_sound.loop = true;
    }

    walk(top, left, direction, spriteIndex) {
        this.character_dom.style.top = top + 'px';
        this.character_dom.style.left = left + 'px';
        this.character_dom.style.zIndex = String(Math.round(top + this.character_dom.offsetHeight));
        this.facingDirection = direction;

        if (!this.isWalking || this.lastDirection !== direction) {
            this.isWalking = true;
            this.lastDirection = direction;
            if (
                (!window.katSound || window.katSound.unlocked) &&
                this.effects.walk_sound.paused
            ) {
                const playback = this.effects.walk_sound.play();
                if (playback && typeof playback.catch === "function") {
                    playback.catch((error) => {
                        console.error(`Failed to play walking audio for "${this.name}".`, error);
                    });
                }
            }
        }

        let spriteArray;
        if (direction === 'left') {
            spriteArray = this.sprite.walk_otherside;
        } else if (direction === 'right') {
            spriteArray = this.sprite.walk_side;
        } else if (direction === 'top') {
            spriteArray = this.sprite.walk_back;
        } else if (direction === 'bottom') {
            spriteArray = this.sprite.walk_front;
        }

        if (spriteArray && spriteArray[spriteIndex]) {
            this.set_sprite(spriteArray[spriteIndex]);
        }
    }

    stop() {
        if (this.isWalking) {
            this.isWalking = false;
            this.lastDirection = null;
            this.effects.walk_sound.pause();
            this.effects.walk_sound.currentTime = 0;
            this.set_sprite(this.sprite.idle);
        }
    }

    destroy() {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;
        this.spriteRequestId += 1;
        if (this.effects.walk_sound && typeof this.effects.walk_sound.pause === "function") {
            this.effects.walk_sound.pause();
            this.effects.walk_sound.currentTime = 0;
        }
        if (this.effects.talk_sound && typeof this.effects.talk_sound.pause === "function") {
            this.effects.talk_sound.pause();
            this.effects.talk_sound.currentTime = 0;
        }
        this.spriteAssets.clear();
        this.character_dom.remove();
        if (this.framer) {
            this.framer.npcs = this.framer.npcs.filter((npc) => npc !== this);
            this.framer.characters = this.framer.characters.filter((character) => character !== this);
            this.framer.followingCharacters = this.framer.followingCharacters.filter(
                (follower) => follower.character !== this
            );
            if (this.framer.interactionCharacter === this) {
                this.framer.interactionCharacter = null;
                this.framer.readyToDialog = false;
            }
        }
    }
}
