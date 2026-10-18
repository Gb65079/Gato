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
            this.character_dom.style.backgroundImage = 'url(' + this.sprite.idle + ')';
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
            this.character_dom.style.backgroundImage = 'url(' + this.sprite.npc_animation.idle[0] + ')';

            let currentSpriteIndex = 0;
            const animationSpeed = 10;
            let frameCounter = 0;

            const animate = () => {
                frameCounter++;
                if (frameCounter >= animationSpeed) {
                    currentSpriteIndex = (currentSpriteIndex + 1) % this.sprite.npc_animation.idle.length;
                    frameCounter = 0;
                }
                this.character_dom.style.backgroundImage = 'url(' + this.sprite.npc_animation.idle[currentSpriteIndex] + ')';
                requestAnimationFrame(animate);
            };

            requestAnimationFrame(animate);
        }

        this.character_dom.style.backgroundSize = 'contain';
        this.character_dom.style.backgroundRepeat = 'no-repeat';
        this.character_dom.style.backgroundPosition = 'center';
        this.character_dom.style.imageRendering = 'pixelated';
        this.character_dom.style.width = '104px';
        this.character_dom.style.height = '104px';
        this.character_dom.style.position = 'absolute';
        this.character_dom.style.left = '0px';
        this.character_dom.style.top = '0px';
        this.character_dom.id = realname;
        document.body.appendChild(this.character_dom);

        this.hitbox.top = this.character_dom.offsetTop;
        this.hitbox.left = this.character_dom.offsetLeft;
        this.hitbox.right = this.character_dom.offsetLeft + this.character_dom.offsetWidth;
        this.hitbox.bottom = this.character_dom.offsetTop + this.character_dom.offsetHeight;

        this.startSoundEffect();
    }

    set_position(x, y) {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const elementWidth = this.character_dom.offsetWidth || 0;
    const elementHeight = this.character_dom.offsetHeight || 0;

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
            if (this.effects.walk_sound.paused) {
                this.effects.walk_sound.play();
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

        if (spriteArray) {
            this.character_dom.style.backgroundImage = 'url(' + spriteArray[spriteIndex] + ')';
        }
    }

    stop() {
        if (this.isWalking) {
            this.isWalking = false;
            this.lastDirection = null;
            this.effects.walk_sound.pause();
            this.effects.walk_sound.currentTime = 0;
            this.character_dom.style.backgroundImage = 'url(' + this.sprite.idle + ')';
        }
    }
}
