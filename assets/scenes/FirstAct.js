const musicBackground = new Audio();
const gato = new Sprite();

gato.register_character("Gato", "gato", false);

framer.set_character_main_scene(gato);
framer.set_controls_to_character();
framer.register_characters([
    gato
]);

musicBackground.preload = "auto";
musicBackground.volume = 0.1;
musicBackground.src = "assets/effects/game_start.mp3";
const playOpeningMusic = () => {
    if (!window.katSound || !window.katSound.unlocked || !musicBackground.paused) {
        return;
    }

    musicBackground.play().catch((error) => {
        console.error("Failed to play the opening music.", error);
    });
};
document.addEventListener("kat:audio-unlocked", playOpeningMusic, { once: true });
musicBackground.onended = () => {
    musicBackground.currentTime = 0;
    playOpeningMusic();
}

gato.set_position(
    Math.max(0, window.innerWidth * 0.3),
    Math.max(0, Math.min(400, window.innerHeight - gato.character_dom.offsetHeight))
);

scene.create_animation("abduction", {
    characterMainScene: gato,
    onSequence: true,
    acts: [
      {
        characterStyle: {
            walk: (w) => w({
                frames: [
                    "spawn.png",
                    "spawn1.png",
                    "spawn2.png",
                    "spawn.png",
                    "spawn1.png",
                    "spawn2.png",
                    "spawn3.png",
                    "spawn4.png"
                ],
                fps: 5,
                loop: false
            })
        },
        finishOn: 2000,
        effect: () => {
            scene.push("gato_fala1")
            playOpeningMusic();
        }
      }]
});

scene.create_animation("look_around", {
    characterMainScene: gato,
    onSequence: true,
    acts: [
    {
        characterStyle: {
            walk: (w) => w(100, 0, "bottom", 0)
        }
    },
    {
        characterStyle: {
            walk: (w) => w(0, 500, "right", 0)
        }
    },
    {
        characterStyle: {
            walk: (w) => w(0, -100, "left", 0)
        }
    },
    {
        characterStyle: {
            walk: (w) => w(-100, 0, "top", 0)
        },
        finishOn: 2000,
        effect: () => scene.push("gato_fala2")
    },
]
});

scene.create_animation("more_look_around", {
    characterMainScene: gato,
    onSequence: true,
    acts: [
    {
        characterStyle: {
            walk: (w) => w(150, 0, "bottom", 0)
        }
    },
    {
        characterStyle: {
            walk: (w) => w(0, 600, "right", 0)
        }
    },
    {
        characterStyle: {
            walk: (w) => w(0, -400, "left", 0)
        }
    },
    {
        characterStyle: {
            walk: (w) => w(-400, 0, "top", 0)
        },
        effect: () => scene.push("gato_fala3"),
        finishOn: 2000
    },
]
});

scene.create_scene("gato_fala1", {
    startOn: "immediate",
    endOn: "last-interaction",
    dialogs: [
        {
            from: gato,
            to: gato,
            about: "....",
            finishOn: 5000
        }, 
        {
            from: gato,
            to: gato,
            about: "Mas... onde estou? O que aconteceu?",
            finishOn: 2000
        },
        {
            from: gato,
            to: gato,
            about: "Que lugar estranho...",
            finishOn: 2000
        }
    ],
    afterItDoes: () => scene.animate("look_around"),
    disableControls: true
});

scene.create_scene("gato_fala2", {
    startOn: "immediate",
    endOn: "last-interaction",
    dialogs: [
        {
            from: gato,
            to: gato,
            about: "Onde estou? Será que isto é um sonho?",
            finishOn: 5000
        },
        {
            from: gato,
            to: gato,
            about: "Tem alguém aí?",
            finishOn: 2000
        }
    ],
    afterItDoes: () => scene.animate("more_look_around"),
    disableControls: true
});

scene.create_scene("gato_fala3", {
    startOn: "immediate",
    endOn: "last-interaction",
    dialogs: [
        {
            from: gato,
            to: gato,
            about: "Onde eu estou?",
            finishOn: 5000
        }, 
        {
            from: gato,
            to: gato,
            about: "Não tem ninguém por perto... e eu consigo falar?",
            finishOn: 2000
        },
        {
            from: gato,
            to: gato,
            about: "Isto é muito estranho...",
            finishOn: 2000
        },
        {
            from: gato,
            to: gato,
            about: "Espera... por que me lembro de uma porta?",
            finishOn: 2000
        },
        {
            from: gato,
            to: gato,
            about: "Espera... isto não é o mundo real?",
            finishOn: 2000
        }
    ],
    afterItDoes: async() => {
        await scene.animate_character(gato, (w) => 
            w(0, 700, "right", 0)
        );

        scene.push("gato_fala4")
    },
    disableControls: true
});

scene.create_scene("gato_fala4", {
    startOn: "immediate",
    endOn: "last-interaction",
    dialogs: [
        {
            from: gato,
            to: gato,
            about: "Aqui....",
            finishOn: 4000
        }, 
        {
            from: gato,
            to: gato,
            about: "Vou descobrir o que está acontecendo!",
            finishOn: 2000
        }
    ],
    afterItDoes: async() => {
        await scene.animate_character(gato, (w) => 
            w(0, 100, "right", 0)
        );

        localStorage.setItem("assets", "{}");
        assets.save("started", true);
        window.location.href = "/refuge.html";
    },
    disableControls: true
});

gato.character_dom.style.display= "none"

setTimeout(()=>{
    
scene.animate("abduction");
gato.character_dom.style.display = 'block'
scene.disable_character_movement();
},2000);