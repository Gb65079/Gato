const gato = new Sprite();
const chromicos = new Sprite();
const ben = new Sprite();
const admKey = new Sprite();

gato.register_character("Gato", "gato", false);
chromicos.register_character("Chromicos", "chromicos", true, true);
ben.register_character("Ben", "ben", false);
admKey.register_character("ADMKEY", "portador_de_arquivo", true)
admKey.character_dom.style.display = "none";

framer.set_character_main_scene(gato);
framer.set_controls_to_character();
framer.register_characters([
    gato,
    ben,
    admKey,
    chromicos
]);
const binaryProgress = assets.get("completedChallenges") || [];
const teleportTo = binaryProgress.includes(7) &&
    window.encryptedFiles.allCollected()? "final-commit.html" : "refuge.html";
teleportPoints.createStoryPortal({
    direction: "left",
    to: teleportTo,
    canTeleport: () => {
        const completed = assets.get("completedChallenges") || [];
        if (completed.includes(8) && !completed.includes(9)) {
            scene.alert({ content: "O programa ainda precisa de atenção." });
            return false;
        }

        if (!assets.get("have-admin-file")) {
            scene.alert({ content: "Colete o arquivo de administrador primeiro." });
            return false;
        }
        return true;
    }
});
ben.set_position(-500, -10);
admKey.set_position(-50, 50)

scene.create_scene("power_chromicos", {
    startOn: 'first-interaction',
    endOn: 'last-interaction',
    dialogs: [
    {
        from: gato,
        to: chromicos,
        about: "Oi, o senhor é Chromicos?"
    },
    {
        from: chromicos,
        to: gato,
        about: "Sim. Sou Chromicos, guardião deste mundo. O NPC mais sabio, como preferir."
    },
    {
        from: gato,
        to: chromicos,
        about: "Disseram que só vou sair daqui se conseguir escrever um final. Você pode me ajudar a entender este mundo?"
    },
    {
        from: chromicos,
        to: gato,
        about: "Para encontrar a saída, você precisará aprender a reparar o programa desse mundo."
    },
    {
        from: gato,
        to: chromicos,
        about: "Mas por que eu? O que preciso fazer?"
    },
    {
        from: chromicos,
        to: gato,
        about: "Eu esperava sua chegada. A saída só vai aparecer quando o programa que a controla estiver completo."
    },
    {
        from: gato,
        to: chromicos,
        about: "Entendi..."
    },
    {
        from: chromicos,
        to: gato,
        about: "Não poderei acompanhá-lo pela jornada, pois preciso depurar, para que consiga programar. Por isso, quero apresentar você ao meu aprendiz."
    },
],
    afterItDoes: async () => {
        await scene.animate("ben");
        scene.push("wake-ben");
    },
    disableControls: true

});

scene.create_scene("wake-ben", {
    startOn: 'immediate',
    endOn: 'last-interaction',
    dialogs: [
    {
        from: chromicos,
        to: gato,
        about: "Este é Ben, meu aprendiz. Ele vai acompanhar você, abrir as telas de código e ajudar a investigar as falhas."
    },
    {
        from: gato,
        to: chromicos,
        about: "Ahhhh... Olá Ben"
    },
    {
        from: ben,
        to: gato,
        about: "Olá, Gato."
    },
    {
        from: chromicos,
        to: gato,
        about: "Preciso entrar em repouso para depurar. Ben conhece o caminho e vai guiar você. Espero vê-los quando o programa estiver pronto."
    },
    {
        from: gato,
        to: chromicos,
        about: "Ok..."
    },
    {
        from: ben,
        to: gato,
        about: "Há um arquivo de administrador guardado no canto, mas o NPC está travado. Vou abrir a tela de código para você completar os comandos que faltam."
    }
],
    afterItDoes: () => {
        assets.save("have-ben", true);
        framer.character_follow_main_character(ben);
        ben.character_dom.style.display = "block";
        document.dispatchEvent(new CustomEvent("kat:challenge-1-ready"));
    },
    disableControls: true

});

scene.create_animation("ben", {
    characterMainScene: ben,
    onSequence: true,
    acts: [
    {
        characterStyle: {
            walk: (w) => w(0, -140, "left", 0)
        }
    },
    {
        characterStyle: {
            walk: (w) => w(-230, 0, "top", 0)
        }
    }
]
});

scene.enable_character_movement();

chromicos.set_position(650, 300);
chromicos.character_dom.style.height = "250px";
chromicos.character_dom.style.width = "250px";
gato.set_position(Math.max(150, window.innerWidth * 0.22), 300);

let adminKeyAlertRegistered = false;
function registerAdminKeyAlert() {
    if (adminKeyAlertRegistered || assets.get("have-admin-file")) {
        return;
    }

    adminKeyAlertRegistered = true;
    admKey.character_dom.style.display = "block";
    admKey.set_position(Math.max(160, window.innerWidth * 0.78), Math.max(130, window.innerHeight * 0.48));
    scene.alert({
        startOn: "first-interaction",
        interactWith: admKey,
        endOn: "last-interaction",
        content: "Arquivo de administrador coletado! Volte ao Refúgio e siga com Ben até o Bazar Oculto.",
        onInteract: () => {
            assets.save("have-admin-file", true);
            assets.save("admin-access-lost", false);
            document.dispatchEvent(new CustomEvent("kat:admin-access-restored"));
        },
        destroyNPC: admKey
    });
}

document.addEventListener("kat:challenge-complete", (event) => {
    if (event.detail.id !== 1 || assets.get("admin-key-available")) {
        return;
    }

    assets.save("admin-key-available", true);
    registerAdminKeyAlert();
});

if (assets.get("admin-key-available")) {
    registerAdminKeyAlert();
}

if (assets.get("have-ben")) {
    ben.character_dom.style.display = "block";
    framer.character_follow_main_character(ben);
    if (binaryProgress.includes(8) && !binaryProgress.includes(9)) {
        if (assets.get("chromicos-review-seen")) {
            window.setTimeout(() => {
                document.dispatchEvent(new CustomEvent("kat:challenge-9-ready"));
            }, 0);
        } else {
            scene.create_scene("chromicos-review", {
                startOn: "immediate",
                endOn: "last-interaction",
                dialogs: [
                    { from: chromicos, to: gato, about: "Parece que vocês reuniram os quatro fragmentos do programa, ele está quase finalizado agora." },
                    { from: ben, to: gato, about: "Encontramos uma falha na ordem dos comandos. Complete a linha que executa a saída só depois da validação." },
                    { from: chromicos, to: gato, about: "Revise com calma. Quando esse erro for corrigido, abrirei o terminal final." }
                ],
                afterItDoes: () => {
                    assets.save("chromicos-review-seen", true);
                    document.dispatchEvent(new CustomEvent("kat:challenge-9-ready"));
                },
                disableControls: true
            });
            scene.push("chromicos-review");
        }
    } else if (!binaryProgress.includes(8) && !assets.get("binary-return-seen")) {
        scene.create_scene("binary-return", {
            startOn: "immediate",
            endOn: "last-interaction",
            dialogs: [
                { from: chromicos, to: gato, about: "Você pegou o arquivo de administrador. Agora Célio poderá ajudar a restaurar as permissões." }
            ],
            afterItDoes: () => assets.save("binary-return-seen", true),
            disableControls: true
        });
        scene.push("binary-return");
    }
} else {
    scene.push("power_chromicos");
}

window.katQuestFollowUp({
    challengeId: 1,
    sceneName: "binary-challenge-1-complete",
    seenKey: "binary-challenge-1-complete-seen",
    dialogs: [
        {
            from: ben,
            to: gato,
            about: "Boa, Gato! Você reiniciou o NPC e o tornou visível usando a variável certa."
        },
        {
            from: ben,
            to: gato,
            about: "O arquivo de administrador ficou disponível. Pegue-o no canto da sala antes de seguirmos."
        }
    ]
});

window.katQuestFollowUp({
    challengeId: 9,
    sceneName: "binary-challenge-9-complete",
    seenKey: "binary-challenge-9-complete-seen",
    dialogs: [
        {
            from: chromicos,
            to: gato,
            about: "A validação passou: o código está pronto e os quatro arquivos estão corretos."
        },
        {
            from: ben,
            to: gato,
            about: "Você corrigiu a ordem da verificação. Agora o terminal final está liberado."
        }
    ]
});