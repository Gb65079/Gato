const gato = new Sprite();
const ben = new Sprite();

gato.register_character("Gato", "gato", false);
if (assets.get("have-ben")) {
    ben.register_character("Ben", "ben", false);
}
framer.set_character_main_scene(gato);
framer.set_controls_to_character();
framer.register_characters(assets.get("have-ben") ? [gato, ben] : [gato]);
scene.enable_character_movement();
if (assets.get("have-ben")) {
    ben.set_position(Math.max(160, window.innerWidth * 0.3), Math.max(130, window.innerHeight * 0.58));
    framer.character_follow_main_character(ben);
}

const scriptPositions = [
    { left: "9%", top: "17%", width: 82, rotation: "-8deg" },
    { left: "23%", top: "65%", width: 96, rotation: "7deg" },
    { left: "35%", top: "16%", width: 74, rotation: "12deg" },
    { left: "42%", top: "76%", width: 108, rotation: "-11deg" },
    { left: "64%", top: "17%", width: 90, rotation: "5deg" },
    { left: "76%", top: "70%", width: 84, rotation: "-7deg" },
    { left: "91%", top: "39%", width: 104, rotation: "10deg" },
    { left: "13%", top: "84%", width: 72, rotation: "14deg" },
    { left: "87%", top: "86%", width: 88, rotation: "-13deg" }
];

scriptPositions.forEach(({ left, top, width, rotation }, index) => {
    const script = document.createElement("div");
    script.className = "lab-script";
    script.setAttribute("aria-hidden", "true");
    script.style.left = left;
    script.style.top = top;
    script.style.setProperty("--script-width", `${width}px`);
    script.style.setProperty("--script-rotation", rotation);
    script.style.animationDelay = `${index * -170}ms`;
    document.body.appendChild(script);
});

const terminal = document.querySelector(".lab-machine-main");
if (!terminal) {
    throw new Error("The laboratory main terminal is missing.");
}
framer.generateGlitches({ i: "lab-terminal", squaresCount: 24, reference: terminal });

teleportPoints.createStoryPortal({
    direction: "top",
    to: "teleport.html",
    canTeleport: () => assets.get("completedChallenges")?.includes(6) === true &&
        window.encryptedFiles.collected(3)
});

scene.create_scene("laboratory-discovery", {
    startOn: "immediate",
    endOn: "last-interaction",
    dialogs: [
        {
            from: ben,
            to: gato,
            about: "Encontrei a extensão de teletransporte, mas o script repete o mesmo teletransporte várias vezes sem necessidade."
        },
        {
            from: gato,
            to: ben,
            about: "Podemos simplificar o programa e usar a extensão para procurar outro fragmento?"
        },
        {
            from: ben,
            to: gato,
            about: "Sim. Troque as quatro instruções de teletransporte por um laço. Quando funcionar, alcançaremos o fragmento."
        }
    ],
    afterItDoes: () => document.dispatchEvent(new CustomEvent("kat:challenge-6-ready")),
    disableControls: true
});

scene.create_scene("laboratory-fragment-found", {
    startOn: "immediate",
    endOn: "last-interaction",
    dialogs: [
        { from: ben, to: gato, about: "A extensão funcionou! Encontramos o terceiro fragmento criptografado." },
        { from: ben, to: gato, about: "Agora vamos testar a extensão nas plataformas de teletransporte." }
    ],
    disableControls: true
});
document.addEventListener("kat:encrypted-file-collected", (event) => {
    if (event.detail.number === 3) {
        scene.push("laboratory-fragment-found");
    }
});

if (
    assets.get("have-ben") &&
    assets.get("completedChallenges")?.includes(5) &&
    !assets.get("completedChallenges")?.includes(6)
) {
    if (assets.get("laboratory-discovery-seen")) {
        window.setTimeout(() => {
            document.dispatchEvent(new CustomEvent("kat:challenge-6-ready"));
        }, 0);
    } else {
        const discovery = scene.get_scene("laboratory-discovery");
        discovery.afterItDoes = () => {
            assets.save("laboratory-discovery-seen", true);
            document.dispatchEvent(new CustomEvent("kat:challenge-6-ready"));
        };
        scene.push("laboratory-discovery");
    }
}

window.katQuestFollowUp({
    challengeId: 6,
    sceneName: "laboratory-challenge-6-complete",
    seenKey: "laboratory-challenge-6-complete-seen",
    dialogs: [
        {
            from: ben,
            to: gato,
            about: "O laço repetiu o teletransporte quatro vezes sem duplicar o comando."
        },
        {
            from: ben,
            to: gato,
            about: "A extensão está pronta. Vamos testar nas plataformas e buscar o próximo fragmento."
        }
    ]
});
