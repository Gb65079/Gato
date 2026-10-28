const gato = new Sprite();
const piona = new Sprite();
const ben = new Sprite();

gato.register_character("Gato", "gato", false);
piona.register_character("Piona", "Piona", true);
if (assets.get("have-ben")) {
    ben.register_character("Ben", "ben", false);
}

framer.set_character_main_scene(gato);
framer.set_controls_to_character();
framer.register_characters(assets.get("have-ben") ? [gato, piona, ben] : [gato, piona]);
gato.set_position(120, 340);
piona.set_position(Math.max(180, window.innerWidth * 0.72), 340);
piona.character_dom.style.width = "180px";
piona.character_dom.style.height = "180px";
if (assets.get("have-ben")) {
    ben.set_position(70, 430);
    framer.character_follow_main_character(ben);
}
scene.enable_character_movement();

const completed = assets.get("completedChallenges") || [];
const returnedWithAllFiles = completed.includes(7) &&
    window.encryptedFiles.allCollected();
const pionaExit = returnedWithAllFiles ? "binary-room.html" : "refuge.html";
teleportPoints.createStoryPortal({
    direction: "left",
    to: pionaExit,
    canTeleport: () => pionaExit === "binary-room.html"
        ? assets.get("completedChallenges")?.includes(8) === true &&
            window.encryptedFiles.allCollected()
        : assets.get("completedChallenges")?.includes(4) === true
});

if (!assets.get("piona-introduced")) {
    scene.create_scene("piona-first-visit", {
        startOn: "immediate",
        endOn: "last-interaction",
        dialogs: [
            {
                from: piona,
                to: gato,
                about: "Você conseguiu chegar à Lacuna Profunda. Sou Piona, professora deste mundo. O que traz você até aqui?"
            },
            ...(assets.get("have-ben") ? [
                {
                    from: ben,
                    to: gato,
                    about: "Piona é professora e consegue decifrar arquivos corrompidos. Guarde todos os fragmentos para formar o programa de saída."
                }
            ] : []),
            {
                from: gato,
                to: piona,
                about: "Encontrei um arquivo criptografado no Jardim. Disseram que você sabe decifrar códigos."
            },
            {
                from: piona,
                to: gato,
                about: "Posso decifrá-lo. São quatro fragmentos, espalhados por lugares diferentes; precisamos reunir todos para formar a saída."
            },
            {
                from: piona,
                to: gato,
                about: "Para voltar ao Refúgio, precisamos conferir se o primeiro fragmento foi coletado. Se foi, o portal pode ser liberado."
            },
            ...(assets.get("have-ben") ? [
                {
                    from: ben,
                    to: gato,
                    about: "A condição do código nos ajuda a decidir o próximo passo. Agora vamos procurar os outros fragmentos no Refúgio, no Laboratório e nas plataformas."
                }
            ] : [])
        ],
        afterItDoes: () => {
            if(assets.get("admin-key-available")) assets.save("piona-introduced", true);
            document.dispatchEvent(new CustomEvent("kat:challenge-4-ready"));
        },
        disableControls: true
    });
}

if (returnedWithAllFiles && !assets.get("piona-four-files-seen")) {
    scene.create_scene("piona-four-files", {
        startOn: "immediate",
        endOn: "last-interaction",
        dialogs: [
            {
                from: piona,
                to: gato,
                about: "Você encontrou os quatro arquivos! Já decifrei cada fragmento. Agora complete as lacunas para unir as instruções numa sequência de saída."
            },
            ...(assets.get("have-ben") ? [
                {
                    from: ben,
                    to: gato,
                    about: "Cada arquivo tem uma parte do programa. Confira a sequência, preencha só o que falta e depois voltaremos juntos para ver Chromicos."
                }
            ] : []),
            {
                from: gato,
                to: piona,
                about: "Quando o código estiver completo, levo-o de volta a Chromicos."
            },
            {
                from: piona,
                to: gato,
                about: "Ele poderá abrir o terminal final. Vá com cuidado: uma instrução fora de ordem pode impedir a saída."
            }
        ],
        afterItDoes: () => {
            assets.save("piona-four-files-seen", true);
            document.dispatchEvent(new CustomEvent("kat:challenge-8-ready"));
        },
        disableControls: true
    });

    scene.push("piona-four-files");
} else if (returnedWithAllFiles) {
    window.setTimeout(() => {
        document.dispatchEvent(new CustomEvent("kat:challenge-8-ready"));
    }, 0);
} else if (!assets.get("piona-introduced")) {
    scene.push("piona-first-visit");
} else if (!completed.includes(4)) {
    window.setTimeout(() => {
        document.dispatchEvent(new CustomEvent("kat:challenge-4-ready"));
    }, 0);
}

window.katQuestFollowUp({
    challengeId: 4,
    sceneName: "piona-challenge-4-complete",
    seenKey: "piona-challenge-4-complete-seen",
    dialogs: assets.get("have-ben")
        ? [
            {
                from: ben,
                to: gato,
                about: "Boa, KAT! Você usou OU corretamente: o fragmento ou minha autorização já permite abrir o portal."
            },
            {
                from: ben,
                to: gato,
                about: "O Refúgio está liberado. Vamos voltar e continuar procurando os outros arquivos."
            }
        ]
        : [
            {
                from: piona,
                to: gato,
                about: "Muito bem! Com OU, o portal abre quando o fragmento foi encontrado ou quando Ben autorizou a passagem."
            }
        ]
});

window.katQuestFollowUp({
    challengeId: 8,
    sceneName: "piona-challenge-8-complete",
    seenKey: "piona-challenge-8-complete-seen",
    dialogs: [
        {
            from: piona,
            to: gato,
            about: "Os quatro fragmentos foram inseridos na ordem certa e o programa foi executado."
        },
        ...(assets.get("have-ben") ? [
            {
                from: ben,
                to: gato,
                about: "Agora vamos voltar à Sala Binária. Chromicos poderá revisar o código conosco."
            }
        ] : [])
    ]
});
