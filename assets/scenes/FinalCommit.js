const gato = new Sprite();
const ben = new Sprite();
const chromicos = new Sprite();

gato.register_character("Gato", "gato", false);
if (assets.get("have-ben")) {
    ben.register_character("Ben", "ben", false);
}
chromicos.register_character("Chromicos", "chromicos", true, true);

framer.set_character_main_scene(gato);
framer.set_controls_to_character();
framer.register_characters(assets.get("have-ben") ? [gato, ben, chromicos] : [gato, chromicos]);
gato.set_position(Math.max(80, window.innerWidth * 0.34), Math.max(150, window.innerHeight * 0.58));
if (assets.get("have-ben")) {
    ben.set_position(Math.max(160, window.innerWidth * 0.45), Math.max(150, window.innerHeight * 0.58));
    framer.character_follow_main_character(ben);
}
chromicos.set_position(Math.max(240, window.innerWidth * 0.62), Math.max(150, window.innerHeight * 0.58));

chromicos.character_dom.style.height = "250px";
chromicos.character_dom.style.width = "250px";
scene.enable_character_movement();

const terminal = document.createElement("div");
terminal.className = "final-terminal";
terminal.setAttribute("aria-label", "Terminal de execução final");
terminal.innerHTML = `
    <header class="final-terminal-header">
        <span>TERMINAL FINAL // KAT-OS</span>
        <strong class="final-terminal-status">AGUARDANDO PROGRAMA</strong>
    </header>
    <pre class="final-terminal-code" aria-live="polite"><code></code></pre>
    <p class="final-terminal-output" aria-live="polite">Aguardando código validado...</p>
    <div class="final-terminal-progress" aria-hidden="true"><span></span></div>`;
document.body.appendChild(terminal);

const terminalCode = terminal.querySelector(".final-terminal-code code");
const terminalStatus = terminal.querySelector(".final-terminal-status");
const terminalOutput = terminal.querySelector(".final-terminal-output");
const terminalProgress = terminal.querySelector(".final-terminal-progress span");
window.finalTerminal = {
    run: async (lines) => {
        if (!Array.isArray(lines) || lines.length === 0 ||
            lines.some((line) => typeof line !== "string" || line.trim() === "")) {
            throw new TypeError("The final program must contain non-empty code lines.");
        }

        terminal.classList.add("is-running");
        terminalCode.replaceChildren();
        terminalOutput.textContent = "Compilando os quatro fragmentos...";
        terminalStatus.textContent = "COMPILANDO";
        terminalProgress.style.width = "0%";
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const lineDelay = reducedMotion ? 0 : 420;

        for (let index = 0; index < lines.length; index += 1) {
            const line = document.createElement("span");
            line.className = "final-terminal-line";
            window.katCodeHighlighter.render(line, lines[index]);
            terminalCode.appendChild(line);
            terminalProgress.style.width = `${Math.round(((index + 1) / lines.length) * 100)}%`;
            terminalStatus.textContent = `EXECUTANDO ${index + 1}/${lines.length}`;
            if (window.katSound) {
                window.katSound.play("terminal");
            }
            await new Promise((resolve) => window.setTimeout(resolve, lineDelay));
        }

        terminalStatus.textContent = "SAÍDA VALIDADA";
        terminalOutput.textContent = "SIMULAÇÃO TERMINADA POR: KAT";
        terminal.classList.remove("is-running");
        if (window.katSound) {
            window.katSound.play("success");
        }

        triggerWhiteout();
    }
};

function triggerWhiteout() {
    document.body.classList.add("fade-to-white");

    document.dispatchEvent(new CustomEvent("kat:simulation-complete"));
    setTimeout(()=>{
        document.body.classList.remove("fade-to-white");
        localStorage.clear();
    },1000)
}

if (!assets.get("final-terminal-intro-seen")) {
    scene.create_scene("final-terminal", {
        startOn: "immediate",
        endOn: "last-interaction",
        dialogs: [
            { from: chromicos, to: gato, about: "Piona decifrou os quatro fragmentos. Juntos, eles mostram como concluir a simulação e encontrar a saída." },
            ...(assets.get("have-ben") ? [
                { from: ben, to: gato, about: "Você consertou cada parte do mundo para chegar até aqui. Agora complete o programa no terminal; eu e Chromicos ficaremos ao seu lado." }
            ] : [])
        ],
        afterItDoes: () => {
            assets.save("final-terminal-intro-seen", true);
            document.dispatchEvent(new CustomEvent("kat:challenge-10-ready"));
        },
        disableControls: true
    });
    scene.push("final-terminal");
} else {
    window.setTimeout(() => {
        document.dispatchEvent(new CustomEvent("kat:challenge-10-ready"));
    }, 0);
}

teleportPoints.createStoryPortal({
    direction: "left",
    to: "binary-room.html",
    recoveryTo: "marketplace.html"
});
