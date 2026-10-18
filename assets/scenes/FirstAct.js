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
musicBackground.src = "assets/effects/Distant.mp3";
musicBackground.onended = () => {
    musicBackground.currentTime = 0;
    musicBackground.play()
}

gato.character_dom.style.top = "400px"

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
                    "spawn3.png",
                    "chocked.png"
                ],
                fps: 3,
                loop: false
            })
        },
        finishOn: 2000,
        effect: () => {
            scene.push("gato_fala1")
            musicBackground.play()
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
            about: "Hãn?? mas... oque... onde estou... COMO APRENDI A FALAR!?",
            finishOn: 2000
        }, 
        {
            from: gato,
            to: gato,
            about: "Mas... que lugar... estranho?",
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
            about: "ALLOOUUUUUUUUU!!!!!!",
            finishOn: 5000
        }, 
        {
            from: gato,
            to: gato,
            about: "TEM ALGUÉM AIIII!!!???",
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
            about: "Não tem ninguém por perto... e porque eu falo?",
            finishOn: 2000
        }, 
        {
            from: gato,
            to: gato,
            about: "É estranho....",
            finishOn: 2000
        }, 
        {
            from: gato,
            to: gato,
            about: "Espera... porque me lembro de uma porta?",
            finishOn: 2000
        }, 
        {
            from: gato,
            to: gato,
            about: "Espera... isso não é o mundo real?",
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
            finishOn: 5000
        }, 
        {
            from: gato,
            to: gato,
            about: "Vou descobrir oque está acontecendo!",
            finishOn: 2000
        }
    ],
    afterItDoes: async() => {
        await scene.animate_character(gato, (w) => 
            w(0, 100, "right", 0)
        );

        window.location.href = "/lobby.html";
    },
    disableControls: true
});

setTimeout(()=>{
    
scene.animate("abduction");
scene.disable_character_movement();
},4000);