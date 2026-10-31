const gato = new Sprite();
const ben = new Sprite();

gato.register_character("Gato", "gato", false);
if (assets.get("have-ben")) {
    ben.register_character("Ben", "ben", false);
}

framer.set_character_main_scene(gato);
framer.set_controls_to_character();
framer.register_characters(assets.get("have-ben") ? [gato, ben] : [gato]);

gato.set_position(
    Math.max(0, window.innerWidth / 2 - 80),
    Math.max(0, window.innerHeight * 0.58)
);
if (assets.get("have-ben")) {
    ben.set_position(
        Math.max(0, window.innerWidth / 2),
        Math.max(0, window.innerHeight * 0.58)
    );
    framer.character_follow_main_character(ben);
}


const gardenTrees = [
    { left: "10%", top: "20%", width: 180 },
    { left: "86%", top: "18%", width: 210 },
    { left: "21%", top: "74%", width: 190 },
    { left: "78%", top: "76%", width: 185 },
    { left: "48%", top: "34%", width: 150 },
    { left: "93%", top: "52%", width: 170 },
    { left: "5%", top: "52%", width: 160 }
];

const gardenGlitchLayer = document.querySelector(".garden-glitch-layer");
if (!gardenGlitchLayer) {
    throw new Error("The garden glitch layer is missing.");
}

const repairStatus = document.createElement("div");
repairStatus.className = "garden-repair-status";
repairStatus.setAttribute("aria-live", "polite");
repairStatus.textContent = "GLITCHS REMOVIDOS";
repairStatus.hidden = true;
document.body.appendChild(repairStatus);

function clearGardenGlitches() {
    framer.removeGlitch("garden-path");
    gardenGlitchLayer.classList.add("garden-glitch-layer-cleared");
    document.querySelectorAll(".garden-tree-corrupted").forEach((tree) => {
        tree.classList.remove("garden-tree-corrupted");
    });
    repairStatus.hidden = false;
    updateDeepstrechPoint();
}

gardenTrees.forEach(({ left, top, width }, index) => {
    const tree = document.createElement("img");
    tree.className = `garden-tree garden-tree-${index % 3}`;
    if (index === 0 || index === 1 || index === 4) {
        tree.classList.add("garden-tree-corrupted");
    }
    tree.src = "assets/sprites/SpriteSheets/arvore.png";
    tree.alt = "";
    tree.setAttribute("aria-hidden", "true");
    tree.draggable = false;
    tree.style.left = left;
    tree.style.top = top;
    tree.style.width = `${width}px`;
    document.body.appendChild(tree);
});

const deepstrech = teleportPoints.createStoryPortal({
    direction: "top",
    to: "deepstrech.html",
    canTeleport: () => assets.get("completedChallenges")?.includes(3) === true &&
        window.encryptedFiles.collected(1)
});

teleportPoints.createStoryPortal({
    direction: "bottom",
    to: "marketplace.html"
});
framer.generateGlitches({ i: "garden-path", squaresCount: 50, reference: deepstrech });

function updateDeepstrechPoint() {
    deepstrech.element.classList.toggle(
        "garden-portal-locked",
        !assets.get("completedChallenges")?.includes(3) ||
            !window.encryptedFiles.collected(1)
    );
}

document.addEventListener("kat:challenge-complete", (event) => {
    if (event.detail.id === 3) {
        clearGardenGlitches();
        updateDeepstrechPoint();
    }
});

document.addEventListener("kat:encrypted-file-collected", (event) => {
    if (event.detail.number === 1) {
        updateDeepstrechPoint();
    }
});

if (assets.get("completedChallenges")?.includes(3)) {
    clearGardenGlitches();
}
updateDeepstrechPoint();

scene.create_scene("garden-arrival", {
    startOn: "immediate",
    endOn: "last-interaction",
    dialogs: [
        {
            from: ben,
            to: gato,
            about: "A ferramenta que Célio nos vendeu pode executar este script. Calcule os glitches que ainda restam e confirme as condições de energia antes de removê-los."
        },
        {
            from: gato,
            to: ben,
            about: "Vou calcular o total, completar a condição e executar o script para limpar o Jardim."
        },
        {
            from: ben,
            to: gato,
            about: "Isso. Quando os glitches sumirem, o primeiro arquivo criptografado ficará visível."
        }
    ],
    afterItDoes: () => {
        if(assets.get("admin-key-available")) assets.save("garden-arrival-seen", true);
        document.dispatchEvent(new CustomEvent("kat:challenge-3-ready"));
    },
    disableControls: true
});

scene.create_scene("garden-fragment-found", {
    startOn: "immediate",
    endOn: "last-interaction",
    dialogs: [
        { from: ben, to: gato, about: "Você encontrou o primeiro fragmento criptografado." },
        { from: ben, to: gato, about: "Vamos levá-lo a Piona, na Lacuna Profunda. Ela pode decifrar o arquivo." }
    ],
    disableControls: true
});
document.addEventListener("kat:encrypted-file-collected", (event) => {
    if (event.detail.number === 1) {
        scene.push("garden-fragment-found");
    }
});

if (!assets.get("completedChallenges")?.includes(3)) {
    if (assets.get("garden-arrival-seen")) {
        window.setTimeout(() => {
            document.dispatchEvent(new CustomEvent("kat:challenge-3-ready"));
        }, 0);
    } else {
        scene.push("garden-arrival");
    }
}

window.katQuestFollowUp({
    challengeId: 3,
    sceneName: "garden-challenge-3-complete",
    seenKey: "garden-challenge-3-complete-seen",
    dialogs: [
        {
            from: ben,
            to: gato,
            about: "Ótimo! A conta mostrou quantos glitches restavam, e a condição confirmou que havia energia suficiente."
        },
        {
            from: ben,
            to: gato,
            about: "O script limpou o caminho. Agora podemos procurar o primeiro fragmento criptografado."
        }
    ]
});