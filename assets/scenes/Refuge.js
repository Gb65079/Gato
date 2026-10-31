const gato = new Sprite();
const npcGroup = new Sprite();
const NPC1 = new Sprite();
const NPC2 = new Sprite();
const NPC3 = new Sprite();
const ancient = new Sprite();
const ben = new Sprite();

gato.register_character("Gato", "gato", false);
npcGroup.register_character("Grupo NPC", "NPCS", true);
NPC1.register_character("NPC1", "NPC1", true);
NPC2.register_character("NPC2", "NPC2", true);
NPC3.register_character("NPC3", "NPC3", true);
ancient.register_character("Biro", "biro", true, true);

framer.set_character_main_scene(gato);
framer.set_controls_to_character();
framer.register_characters([
    gato,
    ancient
]);
scene.enable_character_movement();

gato.set_position("portal_reference");

scene.create_scene("hello", {
    startOn: 'first-interaction',
    endOn: 'last-interaction',
    dialogs: [
    {
        from: ancient,
        to: gato,
        about: "Olá, viajante. Este é o refugio, onde nos abrigamos desse mundo. Oque te traz até aqui?"
    },
    {
        from: gato,
        to: gato,
        about: "Eu quem pergunto, onde estou?"
    },
    {
        from: ancient,
        to: gato,
        about: "Você está no Refúgio. O mundo lá fora está se desfazendo, e todos esperam que alguém encontre uma saída."
    },
    { 
        from: gato,
        to: gato,
        about: "Hummm?"
    },
    {
        from: gato,
        to: gato,
        about: "Como assim?"
    },
    {
        from: ancient,
        to: gato,
        about: "Procure Chromicos na Sala Binária. Ele é o guardião deste mundo e pode explicar o que está acontecendo."
    }
],
    afterItDoes: () => assets.save("talked-with-biro", true),
    disableControls: true
});

scene.create_scene("ben-talk", {
    startOn: 'immediate',
    endOn: 'last-interaction',
    dialogs: [
    {
        from: ben,
        to: gato,
        about: "Gato."
    },
    {
        from: gato,
        to: gato,
        about: "Sim, Ben?"
    },
    {
        from: ben,
        to: gato,
        about: "Sou aprendiz de Chromicos. Posso abrir telas de código quando precisarmos reparar alguma coisa."
    },
    {
        from: gato,
        to: gato,
        about: "Está bem. Confio em você."
    },
    {
        from: ben,
        to: gato,
        about: "Primeiro vamos ao Bazar Oculto. Célio vende scripts que talvez restaurem parte das suas permissões."
    },
    {
        from: ben,
        to: gato,
        about: "Depois seguimos pelo Jardim. Há uma passagem bloqueada pelos erros do mundo."
    }
],
    afterItDoes: () => assets.save("ben-taked", true),
    disableControls: true
});


if (assets.get("have-ben")) {
    ben.register_character("Ben", "ben", false);
    ben.set_position(Math.max(120, window.innerWidth * 0.24), Math.max(130, window.innerHeight * 0.58));
    framer.character_follow_main_character(ben);
    teleportPoints.createStoryPortal({
    direction: "top",
    to: "marketplace.html"
})

    if (assets.get("completedChallenges")?.includes(4)) {
        if (!assets.get("completedChallenges")?.includes(5)) {
            if (assets.get("refuge-debug-seen")) {
                window.setTimeout(() => {
                    document.dispatchEvent(new CustomEvent("kat:challenge-5-ready"));
                }, 0);
            } else {
                scene.create_scene("refuge-debug-search", {
                    startOn: "immediate",
                    endOn: "last-interaction",
                    dialogs: [
                        { from: ben, to: gato, about: "Os moradores disseram que um arquivo aparece por um instante perto daqui e depois desaparece." },
                        { from: gato, to: ben, about: "Dá para encontrá-lo sem começar tudo de novo?" },
                        { from: ben, to: gato, about: "Sim. Vou abrir a depuração; complete a linha que está fora de ordem e o arquivo ficará visível." }
                    ],
                    afterItDoes: () => {
                        assets.save("refuge-debug-seen", true);
                        document.dispatchEvent(new CustomEvent("kat:challenge-5-ready"));
                    },
                    disableControls: true
                });
                scene.push("refuge-debug-search");
            }
        }

        if (!scene.scenes.has("refuge-fragment-found")) {
            scene.create_scene("refuge-fragment-found", {
                startOn: "immediate",
                endOn: "last-interaction",
                dialogs: [
                    { from: ben, to: gato, about: "A depuração revelou o arquivo escondido. Este é o segundo fragmento criptografado." },
                    { from: ben, to: gato, about: "Agora vamos ao Laboratório procurar a extensão de teletransporte. Quando reunirmos os quatro fragmentos, voltaremos a Piona." }
                ],
                disableControls: true
            });
        }
        document.addEventListener("kat:encrypted-file-collected", (event) => {
            if (event.detail.number === 2 && !scene.currentScene) {
                scene.push("refuge-fragment-found");
            }
        });
    } else if (!assets.get("ben-taked")) {
        setTimeout(() => scene.push("ben-talk"), 2000);
    }
} else {
    teleportPoints.createStoryPortal({
        direction: "right",
        to: "binary-room.html",
        canTeleport: () => {
            if(!assets.get("talked-with-biro")) {
                if (!scene.activeAlert) {
                    scene.alert({
                        content: "Você precisa falar com Biro primeiro."
                    });
                }
                return false;
            }
            return true;
        }
    });
    if (!assets.get("talked-with-biro")) {
        scene.push("hello");
    }
}

window.katQuestFollowUp({
    challengeId: 5,
    sceneName: "refuge-challenge-5-complete",
    seenKey: "refuge-challenge-5-complete-seen",
    dialogs: [
        {
            from: ben,
            to: gato,
            about: "Boa depuração! Você corrigiu a atribuição e o arquivo voltou a ficar visível."
        },
        {
            from: ben,
            to: gato,
            about: "Esse é o segundo fragmento. Vamos ao Laboratório procurar a extensão de teletransporte."
        }
    ]
});

npcGroup.character_dom.style.width = "180px";
npcGroup.character_dom.style.height = "180px"
NPC1.character_dom.style.width = "150px";
NPC1.character_dom.style.height = "150px"
NPC2.character_dom.style.width = "180px";
NPC2.character_dom.style.height = "180px"
npcGroup.set_position(500, 300);
NPC1.set_position(800, 100);
NPC2.set_position(300, 600);
ancient.set_position(950, 450);