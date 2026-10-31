const framer = new Framer();
const scene = new SceneManager(framer);

const assets = {
    get: (key) => {
        const m = JSON.parse(localStorage.getItem("assets"));
        if(!m) return null;
        return m[key];
    },
    save: (key, value) => {
        const m = JSON.parse(localStorage.getItem("assets")) || {};
        m[key] = value;

        localStorage.setItem("assets", JSON.stringify(m));
    },
    clear: () => {
        localStorage.clear();
    }
}

window.katQuestFollowUp = ({ challengeId, sceneName, seenKey, dialogs }) => {
    if (!Number.isInteger(challengeId) || challengeId < 1 || challengeId > 10 ||
        typeof sceneName !== "string" || sceneName.trim() === "" ||
        typeof seenKey !== "string" || seenKey.trim() === "" ||
        !Array.isArray(dialogs) || dialogs.length === 0) {
        throw new TypeError("Quest follow-up requires a challenge id, scene name, seen key, and dialogs.");
    }

    scene.create_scene(sceneName, {
        startOn: "immediate",
        endOn: "last-interaction",
        dialogs,
        afterItDoes: () => assets.save(seenKey, true),
        disableControls: true
    });

    let followUpTimer = null;
    const scheduleFollowUp = () => {
        if (assets.get(seenKey) === true || followUpTimer !== null) {
            return;
        }

        followUpTimer = window.setTimeout(() => {
            followUpTimer = null;
            const challengeOverlay = document.querySelector(".challenge-overlay");
            if (scene.currentScene || scene.activeAlert || framer.codeBox ||
                (challengeOverlay && !challengeOverlay.hidden)) {
                scheduleFollowUp();
                return;
            }
            scene.push(sceneName);
        }, 500);
    };

    document.addEventListener("kat:challenge-complete", (event) => {
        if (event.detail?.id === challengeId) {
            scheduleFollowUp();
        }
    });

    const completed = assets.get("completedChallenges");
    if (Array.isArray(completed) && completed.includes(challengeId)) {
        scheduleFollowUp();
    }
};

if(
    !assets.get('started') &&
    window.location.pathname != "/"
) window.location.href = "/"

window.katCodeHighlighter = {
    render: (container, source) => {
        if (!(container instanceof Element) || typeof source !== "string") {
            throw new TypeError("Code highlighting requires an element and a source string.");
        }

        const keywords = new Set([
            "INICIO", "SE", "ENTÃO", "SENÃO", "FIM", "FIM_PARA", "FIM_SE", "FIM_ENQUANTO",
            "REPETIR", "FIM_REPETIR", "VEZES", "ENQUANTO", "PARA", "DE", "ATE", "FACA"
        ]);
        const logicalOperators = new Set(["E", "OU", "NÃO"]);
        const actions = new Set([
            "ABRIR", "APAGAR", "APAGAR_ARQUIVO", "ATIVAR", "DELETAR",
            "EXECUTAR", "EXECUTAR_PROGRAMA", "EXECUTAR_SAIDA", "INSERIR_CODIGO",
            "LIBERAR", "LIBERAR_PORTAL", "LIGAR", "LOCALIZAR", "MOSTRAR",
            "MOSTRAR_ARQUIVO", "MOSTRAR_DICA", "OCULTAR", "OCULTAR_ARQUIVO",
            "REINICIAR", "REPARAR", "REPARAR_CAMINHO", "REMOVER_GLITCHS",
            "TELETRANSPORTAR", "VALIDAR", "VALIDAR_CODIGO"
        ]);
        const values = new Set([
            "ADM", "AZUL", "BEN", "FALSO", "GATO", "LUZ", "NPC", "PORTA",
            "SOM", "VAZIO", "VERDADEIRO", "VERDE", "VERMELHO"
        ]);
        const functions = new Set(["MOD"]);
        const pattern = /[\p{L}_][\p{L}\p{N}_]*|\d+(?:\.\d+)?|<=|>=|==|!=|<-|[+\-*/%<>]|[()[\]{}:.,]/gu;
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;

        while ((match = pattern.exec(source)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(source.slice(lastIndex, match.index)));
            }

            const token = match[0];
            let tokenClass = "";
            if (keywords.has(token)) {
                tokenClass = "token-keyword";
            } else if (functions.has(token) || logicalOperators.has(token) ||
                ["+", "-", "*", "/", "%", "<", ">", "<=", ">=", "==", "!=", "<-"].includes(token)) {
                tokenClass = "token-operator";
            } else if (actions.has(token)) {
                tokenClass = "token-action";
            } else if (values.has(token)) {
                tokenClass = "token-value";
            } else if (/^\d/.test(token)) {
                tokenClass = "token-number";
            } else if (/^[\p{Ll}_]/u.test(token)) {
                tokenClass = "token-variable";
            }

            if (tokenClass) {
                const span = document.createElement("span");
                span.className = tokenClass;
                span.textContent = token;
                fragment.appendChild(span);
            } else {
                fragment.appendChild(document.createTextNode(token));
            }
            lastIndex = pattern.lastIndex;
        }

        if (lastIndex < source.length) {
            fragment.appendChild(document.createTextNode(source.slice(lastIndex)));
        }
        container.replaceChildren(fragment);
    }
};

document.addEventListener("visibilitychange", () => {
    if (document.hidden) scene.alert({
        startOn: "immediate",
        endOn: "last-interaction",
        content: "ERR: saida inesperada, reiniciando tudo..."
    })

    setTimeout(()=>{
        localStorage.clear();
        assets.save("started", true);
        window.location.href="/refuge.html"
    },5000)
});

;(() => {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
        console.error("Web Audio is not available; game sound effects are disabled.");
        window.katSound = {
            unlocked: false,
            unlock: () => {},
            play: () => {}
        };
        return;
    }

    let audioContext = null;
    let audioUnlocked = false;
    const sounds = {
        teleport: [440, 660, 880],
        success: [523, 659, 784],
        error: [220, 165],
        terminal: [440]
    };

    window.katSound = {
        get unlocked() {
            return audioUnlocked;
        },
        unlock: () => {
            audioContext = audioContext || new AudioContextConstructor();
            audioUnlocked = true;
            if (audioContext.state === "suspended") {
                audioContext.resume().catch((error) => {
                    console.error("Failed to resume game audio.", error);
                });
            }
            document.dispatchEvent(new CustomEvent("kat:audio-unlocked"));
        },
        play: (name) => {
            const notes = sounds[name];
            if (!notes) {
                throw new TypeError(`Unsupported game sound "${name}".`);
            }

            if (!audioUnlocked) {
                return;
            }

            const now = audioContext.currentTime;
            notes.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();
                const start = now + index * 0.075;
                oscillator.type = "square";
                oscillator.frequency.setValueAtTime(frequency, start);
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(0.07, start + 0.012);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
                oscillator.connect(gain);
                gain.connect(audioContext.destination);
                oscillator.start(start);
                oscillator.stop(start + 0.13);
            });
        }
    };

    const unlockGameAudio = () => window.katSound.unlock();
    window.addEventListener("pointerdown", unlockGameAudio, { once: true });
    window.addEventListener("keydown", unlockGameAudio, { once: true });
})();
