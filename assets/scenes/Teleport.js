const gato = new Sprite();
const ben = new Sprite();

gato.register_character("Gato", "gato", false);
if (assets.get("have-ben")) {
    ben.register_character("Ben", "ben", false);
}

framer.set_character_main_scene(gato);
framer.set_controls_to_character();
framer.register_characters(assets.get("have-ben") ? [gato, ben] : [gato]);
gato.set_position(Math.max(80, window.innerWidth * 0.24), Math.max(130, window.innerHeight * 0.56));
if (assets.get("have-ben")) {
    ben.set_position(Math.max(160, window.innerWidth * 0.34), Math.max(130, window.innerHeight * 0.56));
    framer.character_follow_main_character(ben);
}
scene.enable_character_movement();

const platforms = [
    { signal: "VERMELHO", color: "#b63c58", left: "24%", top: "38%" },
    { signal: "VERDE", color: "#54a96c", left: "50%", top: "27%" },
    { signal: "AZUL", color: "#4388c1", left: "76%", top: "40%" }
];
platforms.forEach(({ signal, color, left, top }) => {
    const platform = document.createElement("div");
    platform.className = "teleport-platform";
    platform.dataset.signal = signal;
    platform.style.left = left;
    platform.style.top = top;
    platform.style.setProperty("--platform-color", color);
    platform.innerHTML = `<span>SINAL ${signal}</span><i></i>`;
    document.body.appendChild(platform);
});

document.addEventListener("kat:challenge-complete", (event) => {
    if (event.detail.id === 7) {
        document.querySelector('.teleport-platform[data-signal="VERDE"]')?.classList.add("is-active");
    }
});

scene.create_scene("teleport-arrival", {
    startOn: "immediate",
    endOn: "last-interaction",
    dialogs: [
        { from: ben, to: gato, about: "A extensão nos trouxe atrás da tela em que você apareceu. O último fragmento está ali, mas os bits estão descarregados." },
        { from: gato, to: ben, about: "Qualquer 0 ou 1 serve para chegar até ele?" },
        { from: ben, to: gato, about: "Não. O teletransporte só executa quando o sinal verde está ativo. Complete a condição e o arquivo ficará acessível." }
    ],
    afterItDoes: () => document.dispatchEvent(new CustomEvent("kat:challenge-7-ready")),
    disableControls: true
});

scene.create_scene("teleport-fragment-found", {
    startOn: "immediate",
    endOn: "last-interaction",
    dialogs: [
        { from: ben, to: gato, about: "Conseguimos! Este é o quarto e último fragmento criptografado." },
        { from: ben, to: gato, about: "Vamos voltar a Piona para decifrar os quatro arquivos e reconstruir o programa." }
    ],
    disableControls: true
});
document.addEventListener("kat:encrypted-file-collected", (event) => {
    if (event.detail.number === 4) {
        scene.push("teleport-fragment-found");
    }
});

teleportPoints.createStoryPortal({
    direction: "right",
    to: "deepstrech.html",
    canTeleport: () => assets.get("completedChallenges")?.includes(7) === true &&
        window.encryptedFiles.collected(4)
});
if (assets.get("teleport-arrival-seen")) {
    if (!assets.get("completedChallenges")?.includes(7)) {
        window.setTimeout(() => {
            document.dispatchEvent(new CustomEvent("kat:challenge-7-ready"));
        }, 0);
    }
} else {
    scene.get_scene("teleport-arrival").afterItDoes = () => {
        assets.save("teleport-arrival-seen", true);
        document.dispatchEvent(new CustomEvent("kat:challenge-7-ready"));
    };
    scene.push("teleport-arrival");
}

window.katQuestFollowUp({
    challengeId: 7,
    sceneName: "teleport-challenge-7-complete",
    seenKey: "teleport-challenge-7-complete-seen",
    dialogs: [
        {
            from: ben,
            to: gato,
            about: "Isso! O resto da divisão indicou o bit correto, e o teletransporte foi ativado."
        },
        {
            from: ben,
            to: gato,
            about: "Com o quarto fragmento em mãos, vamos voltar a Piona para montar o programa."
        }
    ]
});
