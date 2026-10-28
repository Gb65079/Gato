const gato = new Sprite();
const celio = new Sprite();
const ben = new Sprite();

gato.register_character("Gato", "gato", false);
celio.register_character("Célio", "celio", true);
celio.sprite.face_card = "assets/sprites/celio/animation_1.png";
celio.character_dom.style.width = "150px";
celio.character_dom.style.height = "150px";

framer.set_character_main_scene(gato);
framer.set_controls_to_character();
framer.register_characters([gato, celio]);

gato.set_position(
    Math.max(16, window.innerWidth * 0.08),
    Math.max(120, window.innerHeight * 0.61)
);
celio.set_position(
    Math.max(170, window.innerWidth * 0.68),
    Math.max(120, window.innerHeight * 0.58)
);
scene.enable_character_movement();

scene.create_scene("talk-to-celio", {
    startOn: "first-interaction",
    interactWith: celio,
    endOn: "last-interaction",
    dialogs: [
        {
            from: celio,
            to: gato,
            about: "Bem-vindos ao Ferro Velho. Eu sou Célio; vendo peças e scripts para recuperar permissões perdidas."
        },
        {
            from: celio,
            to: ben,
            about: "Se um erro fizer o Gato perder o acesso de administrador, tragam-no de volta. Por confiar em você, ajudo sem cobrar."
        },
        {
            from: gato,
            to: celio,
            about: assets.get("admin-access-lost") === true
                ? "Perdi minhas permissões de administrador. Você pode me ajudar?"
                : "Encontrei um arquivo de administrador. Você tem um script que ajude a recuperar funções do mundo?"
        },
        {
            from: celio,
            to: gato,
            about: assets.get("admin-access-lost") === true
                ? "Confio em Ben. Posso recuperar suas permissões; fale comigo quando estiver pronto."
                : "Tenho um script para liberar uma ferramenta de reparo, mas ele precisa do alvo correto."
        }
    ],
    afterItDoes: () => {
        assets.save("celio-introduced", true);
        document.dispatchEvent(new CustomEvent("kat:challenge-2-ready"));
        queueAdminRecovery();
    },
    disableControls: true
});

let adminRecoveryQueued = false;
scene.create_scene("celio-admin-recovery", {
    startOn: "first-interaction",
    interactWith: celio,
    endOn: "last-interaction",
    dialogs: [
        { from: gato, to: celio, about: "Ben me disse que você poderia me ajudar a recuperar o acesso de administrador." },
        { from: celio, to: gato, about: "Ben é meu amigo e confio nele. Vou restaurar suas permissões sem cobrar nada." },
        { from: ben, to: gato, about: "Obrigado, Célio. Vamos continuar a jornada." }
    ],
    afterItDoes: () => {
        assets.save("have-admin-file", true);
        assets.save("admin-access-lost", false);
        adminRecoveryQueued = false;
        document.dispatchEvent(new CustomEvent("kat:admin-access-restored"));
    },
    disableControls: true
});

function queueAdminRecovery() {
    if (
        assets.get("admin-access-lost") !== true ||
        adminRecoveryQueued
    ) {
        return;
    }

    adminRecoveryQueued = true;
    scene.push("celio-admin-recovery");
}
document.addEventListener("kat:admin-access-lost", queueAdminRecovery);
queueAdminRecovery();

const junkDetails = [
    { type: "pile", left: "8%", top: "22%", width: 230, height: 126 },
    { type: "electronics", left: "22%", top: "17%", width: 126, height: 82 },
    { type: "scrap", left: "38%", top: "21%", width: 174, height: 96 },
    { type: "pile", left: "57%", top: "19%", width: 252, height: 138 },
    { type: "electronics", left: "78%", top: "24%", width: 150, height: 90 },
    { type: "scrap", left: "92%", top: "18%", width: 170, height: 104 },
    { type: "scrap", left: "10%", top: "49%", width: 195, height: 112 },
    { type: "pile", left: "27%", top: "47%", width: 250, height: 140 },
    { type: "electronics", left: "47%", top: "43%", width: 138, height: 88 },
    { type: "pile", left: "72%", top: "49%", width: 270, height: 144 },
    { type: "scrap", left: "91%", top: "51%", width: 190, height: 108 },
    { type: "electronics", left: "15%", top: "78%", width: 145, height: 90 },
    { type: "pile", left: "47%", top: "82%", width: 290, height: 158 },
    { type: "scrap", left: "83%", top: "80%", width: 220, height: 120 }
];

junkDetails.forEach(({ type, left, top, width, height }) => {
    const detail = document.createElement("div");
    detail.className = `marketplace-junk marketplace-junk-${type}`;
    detail.setAttribute("aria-hidden", "true");
    detail.style.left = left;
    detail.style.top = top;
    detail.style.setProperty("--junk-width", `${width}px`);
    detail.style.setProperty("--junk-height", `${height}px`);
    document.body.appendChild(detail);
});


if(assets.get("have-ben")) {
    ben.register_character("Ben", "ben", false);
    ben.set_position(Math.max(100, window.innerWidth * 0.18), Math.max(130, window.innerHeight * 0.56));
    framer.character_follow_main_character(ben);
}

const marketPages = [
    "binary-room.html",
    "marketplace.html",
    "garden.html",
    "deepstrech.html",
    "refuge.html",
    "laboratorio.html",
    "teleport.html",
    "deepstrech.html",
    "binary-room.html",
    "final-commit.html"
];
const marketProgress = assets.get("completedChallenges") || [];
const recoveringAdmin = assets.get("admin-access-lost") === true;
const marketDestination = recoveringAdmin
    ? marketPages[marketProgress.length] || "final-commit.html"
    : "garden.html";

if (marketDestination !== "marketplace.html") {
    scene.createPortal("right").teleport({
        to: marketDestination,
        on: "interact",
        canTeleport: recoveringAdmin
            ? () => assets.get("admin-access-lost") !== true
            : () => assets.get("completedChallenges")?.includes(2) === true
    });

    scene.createPortal("top").teleport({
        to: "laboratorio.html",
        on: "interact"
    });
}

if (assets.get("celio-introduced")) {
    if (marketProgress.includes(1) && !marketProgress.includes(2)) {
        window.setTimeout(() => {
            document.dispatchEvent(new CustomEvent("kat:challenge-2-ready"));
        }, 0);
    }
    queueAdminRecovery();
} else {
    scene.push("talk-to-celio");
}

window.katQuestFollowUp({
    challengeId: 2,
    sceneName: "marketplace-challenge-2-complete",
    seenKey: "marketplace-challenge-2-complete-seen",
    dialogs: [
        {
            from: celio,
            to: gato,
            about: "Muito bem! Você calculou a força e passou os parâmetros na ordem certa."
        },
        {
            from: celio,
            to: gato,
            about: "A ferramenta de reparo está liberada. Agora pode seguir para o Jardim."
        }
    ]
});
