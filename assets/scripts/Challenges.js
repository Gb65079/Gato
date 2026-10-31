(() => {
    const challengeData = [
        {
            title: "NPC inválido",
            concept: "Sequência e variáveis",
            intro: "O NPC que está com o arquivo se corrompeu. Guarde o nome do alvo em uma variável e complete a sequência de comandos para reiniciá-lo e mostrá-lo.",
            feedback: "Boa! Você guardou o alvo e executou os comandos na ordem certa.",
            mode: "fill",
            template: [
                "INICIO",
                { label: "alvo <- ", answer: "\"NPC\"", options: ["\"NPC\"", "\"GATO\"", "\"BEN\""] },
                { label: "REINICIAR(", answer: "alvo", suffix: ")", options: ["GATO", "alvo", "BEN"] },
                { label: "MOSTRAR(", answer: "alvo", suffix: ")", options: ["BEN", "alvo", "GATO"] },
                "FIM"
            ],
            effect: "O NPC apareceu! O arquivo pode ser pego.",
            hint: "Guarde \"NPC\" em alvo e use essa variável nos dois comandos, na ordem REINICIAR e depois MOSTRAR.",
            launcher: "Tela de código do Ben",
            readyEvent: "kat:challenge-1-ready",
            collectAdminFile: true,
            nextPage: "refuge.html"
        },
        {
            title: "A ferramenta do Célio",
            concept: "Aritmética e parâmetros",
            intro: "Célio oferece um script para liberar a ferramenta de reparo. Calcule a força necessária e passe a porta e a força como parâmetros do comando.",
            feedback: "Certo! Você calculou o parâmetro e passou os valores na ordem que o comando espera.",
            mode: "fill",
            template: [
                "INICIO",
                "forca_base <- 3",
                "bonus <- 2",
                { label: "forca_total <- forca_base ", answer: "+", suffix: " bonus", options: ["+", "-", "*"] },
                { label: "ABRIR(", answer: "PORTA, forca_total", suffix: ")", options: ["PORTA, forca_total", "forca_total, PORTA", "LUZ, forca_base"] },
                "FIM"
            ],
            effect: "Célio restaurou a ferramenta!",
            hint: "Some a força base ao bônus e chame ABRIR com PORTA primeiro e forca_total depois.",
            readyEvent: "kat:challenge-2-ready",
            nextPage: "garden.html"
        },
        {
            title: "Limpar os glitches do Jardim",
            concept: "Operadores aritméticos e lógicos",
            intro: "Os glitches corromperam o Jardim. Calcule quantos ainda restam com -, depois use E para combinar a condição dos glitches com a energia. Só então o script poderá removê-los.",
            feedback: "Boa! A subtração calculou o que falta e E exigiu que as duas condições fossem verdadeiras.",
            mode: "fill",
            template: [
                "SCRIPT DO JARDIM",
                "total_glitches <- 8",
                "glitches_removidos <- 5",
                { label: "glitches_pendentes <- ", answer: "total_glitches - glitches_removidos", options: ["total_glitches + glitches_removidos", "total_glitches - glitches_removidos", "total_glitches / glitches_removidos"] },
                "energia <- 3",
                { label: "SE glitches_pendentes > 0 ", answer: "E", suffix: " energia >= 1 ENTÃO", options: ["E", "OU", "NÃO"] },
                { label: "    energia <- energia ", answer: "-", suffix: " 1", options: ["+", "-", "*"] },
                { label: "    EXECUTAR(", answer: "REMOVER_GLITCHS", suffix: ")", options: ["REPARAR_PONTE", "REMOVER_GLITCHS", "ATIVAR_PORTAL"] },
                "FIM_SE"
            ],
            effect: "Os glitches sumiram e o primeiro arquivo ficou visível.",
            hint: "Subtraia os glitches já removidos do total. Na condição, E só é verdadeiro se ainda houver glitches e energia suficiente; depois, subtraia 1 da energia.",
            runLabel: "EXECUTAR SCRIPT",
            launcher: "Executar script do Jardim",
            readyEvent: "kat:challenge-3-ready",
            collectFragment: true,
            nextPage: "deepstrech.html"
        },
        {
            title: "A regra da Piona",
            concept: "Operador lógico OU",
            intro: "Piona pode abrir o portal se o fragmento foi encontrado ou se Ben trouxe uma autorização. Complete a condição para que qualquer uma dessas opções seja suficiente.",
            feedback: "Isso! Com OU, basta uma das duas condições ser verdadeira.",
            effect: "Fragmento confirmado. O portal para o Refúgio foi liberado.",
            hint: "Use OU: o portal deve abrir quando o fragmento foi encontrado ou quando Ben está autorizado.",
            mode: "fill",
            template: [
                "fragmento_1_coletado <- VERDADEIRO",
                "ben_autorizado <- FALSO",
                { label: "SE fragmento_1_coletado == VERDADEIRO ", answer: "OU", suffix: " ben_autorizado == VERDADEIRO ENTÃO", options: ["E", "OU", "NÃO"] },
                { label: "    ", answer: "LIBERAR_PORTAL", options: ["LIBERAR_PORTAL", "OCULTAR_PORTAL", "EXECUTAR_SAIDA"] },
                "FIM_SE"
            ],
            readyEvent: "kat:challenge-4-ready",
            nextPage: "refuge.html"
        },
        {
            title: "O objeto invisível",
            concept: "Depuração e atribuição",
            intro: "No Refúgio, Ben encontra uma atribuição incorreta que mantém o arquivo oculto. Corrija o valor da variável e execute o comando que o revela, sem adicionar uma condição.",
            feedback: "Encontrou o erro! Corrigiu o valor e executou a ação necessária.",
            mode: "fill",
            template: [
                "INICIO",
                "arquivo_visivel <- FALSO",
                { label: "arquivo_visivel <- ", answer: "VERDADEIRO", options: ["FALSO", "VERDADEIRO", "VAZIO"] },
                { label: "    ", answer: "MOSTRAR_ARQUIVO()", options: ["OCULTAR_ARQUIVO()", "MOSTRAR_ARQUIVO()", "APAGAR_ARQUIVO()"] },
                "FIM"
            ],
            effect: "O objeto escondido apareceu!",
            hint: "Altere arquivo_visivel para VERDADEIRO e use MOSTRAR_ARQUIVO() para revelar o arquivo.",
            readyEvent: "kat:challenge-5-ready",
            collectFragment: true,
            nextPage: "laboratorio.html"
        },
        {
            title: "O teletransporte repetitivo",
            concept: "Laços e contadores",
            intro: "Ben encontra a extensão de teletransporte. Use um laço ENQUANTO com quatro iterações e atualize o contador a cada passagem.",
            feedback: "Certo! O laço controla quantas vezes a ação é repetida.",
            mode: "fill",
            template: [
                "INICIO",
                "contador <- 0",
                "ENQUANTO contador < 4 FACA",
                "    TELETRANSPORTAR",
                { label: "    contador <- contador ", answer: "+ 1", options: ["+ 1", "- 1", "* 1"] },
                "FIM_ENQUANTO",
                "FIM"
            ],
            effect: "O teletransporte foi ajustado!",
            hint: "O laço precisa chegar a 4 e somar 1 ao contador em cada repetição.",
            readyEvent: "kat:challenge-6-ready",
            collectFragment: true,
            nextPage: "teleport.html"
        },
        {
            title: "O sinal correto",
            concept: "Resto da divisão",
            intro: "A extensão está funcionando. As plataformas são numeradas pelo resto da energia dividida por 3; calcule o resto e use o resultado para selecionar a plataforma.",
            feedback: "Correto! MOD calculou o resto e a extensão recebeu o número da plataforma.",
            mode: "fill",
            template: [
                "energia <- 10",
                { label: "plataforma <- MOD(energia, ", answer: "3", suffix: ")", options: ["2", "3", "4"] },
                { label: "TELETRANSPORTAR(", answer: "plataforma", suffix: ")", options: ["energia", "plataforma", "3"] }
            ],
            effect: "A plataforma verde foi ativada!",
            hint: "MOD(10, 3) resulta em 1. Passe a variável plataforma para TELETRANSPORTAR.",
            readyEvent: "kat:challenge-7-ready",
            collectFragment: true,
            nextPage: "deepstrech.html"
        },
        {
            title: "Os quatro fragmentos",
            concept: "Vetores, laços e validação",
            intro: "Você trouxe os quatro arquivos criptografados para Piona. Percorra o vetor de fragmentos, insira apenas os que não estão vazios e execute o programa depois do laço.",
            feedback: "Os fragmentos foram percorridos e validados na ordem correta.",
            mode: "fill",
            template: [
                "INICIO",
                "LIGAR_TERMINAL",
                "PARA indice DE 1 ATE 4 FACA",
                { label: "    ", answer: "INSERIR_CODIGO(fragmentos[indice])", options: ["INSERIR_CODIGO(fragmentos[indice])", "APAGAR_CODIGO(fragmentos[indice])", "EXECUTAR_PROGRAMA()"] },
                "FIM_PARA",
                "EXECUTAR_PROGRAMA()",
                "FIM"
            ],
            effect: "Os quatro fragmentos formaram o programa!",
            hint: "Como os quatro arquivos já foram coletados, percorra as posições de 1 a 4 e insira cada fragmento antes de executar o programa.",
            requiresAllFiles: true,
            readyEvent: "kat:challenge-8-ready",
            nextPage: "binary-room.html"
        },
        {
            title: "O último erro",
            concept: "Condições compostas e retorno lógico",
            intro: "De volta à Sala Binária, Chromicos encontra uma falha na validação. Só valide com os quatro arquivos e o código pronto; execute a saída apenas se a validação retornar verdadeiro.",
            feedback: "Algoritmo corrigido! A saída só executa quando as duas verificações passam.",
            mode: "fill",
            template: [
                "codigo_pronto <- VERDADEIRO",
                "arquivos_validos <- 4",
                { label: "SE codigo_pronto == VERDADEIRO ", answer: "E", suffix: " arquivos_validos == 4 ENTÃO", options: ["E", "OU", "NÃO"] },
                "    validacao_ok <- VALIDAR_CODIGO()",
                { label: "    SE validacao_ok == ", answer: "VERDADEIRO", suffix: " ENTÃO", options: ["VERDADEIRO", "FALSO", "VAZIO"] },
                "        EXECUTAR_SAIDA",
                "    FIM_SE",
                "FIM_SE"
            ],
            effect: "O acesso ao terminal final foi liberado!",
            hint: "Use E para exigir código pronto e quatro arquivos; depois, teste se validacao_ok é VERDADEIRO.",
            readyEvent: "kat:challenge-9-ready",
            nextPage: "final-commit.html"
        },
        {
            title: "FINALCOMMIT",
            concept: "Algoritmo completo: lógica, laços e validação",
            intro: "Chromicos abre o terminal. Complete o algoritmo final: combine os pré-requisitos, repare o caminho duas vezes e só execute a saída após validar o código.",
            feedback: "Código correto! A saída foi ativada.",
            mode: "fill",
            template: [
                "INICIO",
                "LIGAR_TERMINAL",
                "sinal <- VERDE",
                "energia <- 2",
                { label: "SE sinal == VERDE ", answer: "E", suffix: " energia >= 2 ENTÃO", options: ["E", "OU", "NÃO"] },
                "    REPETIR 2 VEZES:",
                { label: "        ", answer: "REPARAR_CAMINHO", options: ["REPARAR_CAMINHO", "EXECUTAR_SAIDA", "MOSTRAR_DICA"] },
                "    FIM_REPETIR",
                "    codigo_ok <- VALIDAR_CODIGO()",
                { label: "    SE codigo_ok == ", answer: "VERDADEIRO", suffix: " ENTÃO", options: ["VERDADEIRO", "FALSO", "VAZIO"] },
                "        EXECUTAR_SAIDA",
                "    SENÃO",
                "        MOSTRAR_DICA",
                "    FIM_SE",
                "SENÃO",
                "    MOSTRAR_DICA",
                "FIM_SE",
                "FIM"
            ],
            effect: "O terminal abriu a saída!",
            hint: "Use E nos dois pré-requisitos, repare dentro do laço e execute a saída somente quando codigo_ok for VERDADEIRO.",
            requiresAllFiles: true,
            readyEvent: "kat:challenge-10-ready",
            ending: true
        }
    ];

    const pages = [
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

    let assetState = JSON.parse(localStorage.getItem("assets") || "{}");
    const completed = Array.isArray(assetState.completedChallenges)
        ? assetState.completedChallenges.filter((id) => Number.isInteger(id) && id >= 1 && id <= 10)
        : [];
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const currentChallengeId = completed.length + 1;
    const currentChallenge = challengeData[currentChallengeId - 1];
    if (!currentChallenge || pages[currentChallengeId - 1] !== currentPage) {
        return;
    }
    let adminRecoveryRequired = assetState["admin-access-lost"] === true;
    let challengeReady = false;
    let failurePending = false;
    if (currentChallenge.requiresAllFiles && !window.encryptedFiles.allCollected()) {
        return;
    }

    const launcher = document.createElement("button");
    launcher.className = "challenge-launcher";
    launcher.type = "button";
    launcher.textContent = currentChallenge.launcher || `Desafio ${currentChallengeId}/10`;
    launcher.setAttribute("aria-haspopup", "dialog");
    launcher.hidden = Boolean(currentChallenge.readyEvent);
    document.body.appendChild(launcher);

    const overlay = document.createElement("section");
    overlay.className = "challenge-overlay";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "challenge-title");
    overlay.innerHTML = `
        <div class="challenge-panel">
            <header class="challenge-header">
                <div>
                    <p class="challenge-kicker">DESAFIO ${currentChallengeId} DE 10 · ${currentChallenge.concept}</p>
                    <h1 id="challenge-title"></h1>
                </div>
                <button class="challenge-close" type="button" aria-label="Fechar desafio">×</button>
            </header>
            <p class="challenge-intro"></p>
            <p class="challenge-instructions"></p>
            <div class="challenge-stage"></div>
            <p class="challenge-feedback" aria-live="polite"></p>
            <footer class="challenge-footer">
                <span class="challenge-progress"></span>
            </footer>
        </div>`;
    document.body.appendChild(overlay);

    const panel = overlay.querySelector(".challenge-panel");
    const title = overlay.querySelector("#challenge-title");
    const intro = overlay.querySelector(".challenge-intro");
    const instructions = overlay.querySelector(".challenge-instructions");
    const stage = overlay.querySelector(".challenge-stage");
    const feedback = overlay.querySelector(".challenge-feedback");
    const progress = overlay.querySelector(".challenge-progress");
    const closeButton = overlay.querySelector(".challenge-close");

    title.textContent = currentChallenge.title;
    intro.textContent = currentChallenge.intro;
    progress.textContent = `${completed.length} de 10 desafios concluídos`;

    function openChallenge() {
        if (adminRecoveryRequired || failurePending || completed.includes(currentChallengeId)) {
            return;
        }
        overlay.hidden = false;
        closeButton.focus();
    }

    function closeChallenge() {
        overlay.hidden = true;
        if (!launcher.hidden) {
            launcher.focus();
        }
    }

    function showError(message) {
        feedback.textContent = message;
        feedback.className = "challenge-feedback is-error";
    }

    function loseAdminAccess() {
        const latestState = JSON.parse(localStorage.getItem("assets") || "{}");
        if (!latestState["have-admin-file"]) {
            return false;
        }

        latestState["have-admin-file"] = false;
        latestState["admin-access-lost"] = true;
        localStorage.setItem("assets", JSON.stringify(latestState));
        assetState = latestState;
        document.dispatchEvent(new CustomEvent("kat:admin-access-lost", {
            detail: { challengeId: currentChallengeId }
        }));
        return true;
    }

    function handleWrongAnswer() {
        if (window.katSound) {
            window.katSound.play("error");
        }
        if (!loseAdminAccess()) {
            return false;
        }

        failurePending = true;
        launcher.hidden = true;
        closeChallenge();
        const benCharacter = typeof ben === "undefined" ? framer.character_main_scene : ben;
        const gatoCharacter = typeof gato === "undefined" ? framer.character_main_scene : gato;
        if (!scene.scenes.has("admin-access-lost-dialog")) {
            scene.create_scene("admin-access-lost-dialog", {
                startOn: "immediate",
                endOn: "last-interaction",
                dialogs: [
                    {
                        from: benCharacter,
                        to: gatoCharacter,
                        about: "A permissão ADM foi perdida. Vamos ao Bazar Oculto falar com Célio para restaurá-la."
                    }
                ],
                disableControls: true
            });
        }
        scene.push("admin-access-lost-dialog");
        return true;
    }

    function markComplete() {
        if (completed.includes(currentChallengeId)) {
            return;
        }
        completed.push(currentChallengeId);
        const latestState = JSON.parse(localStorage.getItem("assets") || "{}");
        latestState.completedChallenges = completed;
        if (currentChallengeId === 2) {
            latestState["have-repair-tool"] = true;
        }
        assetState.completedChallenges = completed;
        localStorage.setItem("assets", JSON.stringify(latestState));
        document.dispatchEvent(new CustomEvent("kat:challenge-complete", {
            detail: { id: currentChallengeId }
        }));
        if (window.katSound) {
            window.katSound.play("success");
        }
        feedback.textContent = currentChallenge.feedback;
        feedback.className = "challenge-feedback is-success";
        const worldEffect = document.createElement("p");
        worldEffect.className = "challenge-world-effect";
        worldEffect.textContent = currentChallenge.effect;
        stage.appendChild(worldEffect);
        progress.textContent = `${completed.length} de 10 desafios concluídos`;
        launcher.hidden = true;
        panel.classList.add("challenge-complete");
        stage.querySelectorAll("button, input").forEach((button) => {
            button.disabled = true;
        });
        if (currentChallenge.ending) {
            if (!window.finalTerminal || typeof window.finalTerminal.run !== "function") {
                throw new Error("The final program terminal is not available.");
            }
            overlay.hidden = true;
            window.finalTerminal.run([
                "INICIO",
                "LIGAR_TERMINAL",
                "sinal <- VERDE",
                "energia <- 2",
                "SE sinal == VERDE E energia >= 2 ENTÃO",
                "    REPETIR 2 VEZES:",
                "        REPARAR_CAMINHO",
                "    FIM_REPETIR",
                "    codigo_ok <- VALIDAR_CODIGO()",
                "    SE codigo_ok == VERDADEIRO ENTÃO",
                "        EXECUTAR_SAIDA",
                "    SENÃO",
                "        MOSTRAR_DICA",
                "    FIM_SE",
                    "SENÃO",
                "    MOSTRAR_DICA",
                "FIM_SE",
                "FIM"
            ]).then(showEnding).catch((error) => {
                console.error("Failed to execute the final program.", error);
            });
            return;
        }
        window.setTimeout(closeChallenge, 1100);
    }
function showEnding() {
        overlay.hidden = true;
        const ending = document.createElement("section");
        ending.className = "game-ending";
        ending.setAttribute("role", "dialog");
        ending.setAttribute("aria-modal", "true");
        ending.setAttribute("aria-live", "polite");
        ending.innerHTML = `
            <div class="game-ending-scene">
                <p class="game-ending-kicker">programa executado.</p>
                <div class="game-ending-visual">
                    <img class="game-ending-portrait" alt="" hidden>
                    <video class="game-ending-video" playsinline muted preload="auto" hidden>
                        <source src="assets/sprites/SpriteSheets/KAT_bye.mp4" type="video/mp4">
                    </video>
                    <p class="game-ending-dialog" aria-live="polite" hidden></p>
                </div>
                <button class="game-ending-video-play" type="button" hidden>Reproduzir vídeo</button>
                <div class="terminal-container" style="display: none;">
                    <p class="game-ending-message terminal-text"></p>
                </div>
                <section class="game-ending-credits" aria-label="Créditos" style="display: none;">
                    <h2>Desenvolvedores</h2>
                    <ul class="game-ending-developers"></ul>
                    <button class="game-ending-music" type="button" hidden>Tocar música final</button>
                </section>
                <button class="game-ending-restart" type="button" style="display: none;">Jogar novamente</button>
            </div>`;
        document.body.appendChild(ending);

        const dialog = ending.querySelector(".game-ending-dialog");
        const portrait = ending.querySelector(".game-ending-portrait");
        const video = ending.querySelector(".game-ending-video");
        const videoPlayButton = ending.querySelector(".game-ending-video-play");
        const terminalContainer = ending.querySelector(".terminal-container");
        const message = ending.querySelector(".game-ending-message");
        const credits = ending.querySelector(".game-ending-credits");
        const developers = ending.querySelector(".game-ending-developers");
        const musicButton = ending.querySelector(".game-ending-music");
        const restart = ending.querySelector(".game-ending-restart");
        const characters = document.querySelectorAll(".character, .npc");
        
        const developerNames = [
            "EZEQUIEL",
            "YASMIN",
            "LETICIA",
            "GABRIEL"
        ];
        developerNames.forEach((name) => {
            const developer = document.createElement("li");
            developer.textContent = "> " + name;
            developers.appendChild(developer);
        });

        // Música original do código mantida
        const endingMusic = new Audio("assets/effects/game_end.mp3");
        endingMusic.preload = "auto";
        endingMusic.volume = 0.65;
        const playEndingMusic = () => {
            const playback = endingMusic.play();
            if (playback && typeof playback.catch === "function") {
                playback.catch((error) => {
                    console.error("Failed to play the ending music.", error);
                    musicButton.hidden = false;
                });
            }
        };
        musicButton.addEventListener("click", () => {
            const playback = endingMusic.play();
            if (playback && typeof playback.then === "function") {
                playback.then(() => {
                    musicButton.hidden = true;
                }).catch((error) => {
                    console.error("Failed to play the ending music after user interaction.", error);
                });
            }
        });
        playEndingMusic();

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

        characters.forEach((character) => character.classList.add("game-ending-depart"));
        ending.classList.add("is-visible", "is-white");
        window.setTimeout(() => {
            characters.forEach((character) => character.classList.add("game-ending-disappear"));
        }, reducedMotion ? 0 : 700);

        const showFarewell = (text) => {
            dialog.hidden = false;
            dialog.textContent = text;
            dialog.classList.remove("is-speaking");
            requestAnimationFrame(() => dialog.classList.add("is-speaking"));
        };

        const showPortrait = async (source, alt, text, duration) => {
            portrait.src = source;
            portrait.alt = alt;
            portrait.hidden = false;
            portrait.classList.remove("is-visible");
            showFarewell(text);
            await new Promise((resolve) => requestAnimationFrame(resolve));
            portrait.classList.add("is-visible");
            await wait(reducedMotion ? 300 : duration);
            portrait.classList.remove("is-visible");
            await wait(reducedMotion ? 0 : 500);
            portrait.hidden = true;
        };

        const typeTerminalText = (element, text, speed = 50) => {
            return new Promise((resolve) => {
                terminalContainer.style.display = "flex";
                element.textContent = "";
                let index = 0;
                function type() {
                    if (index < text.length) {
                        element.textContent += text.charAt(index);
                        index++;
                        setTimeout(type, speed);
                    } else {
                        resolve();
                    }
                }
                type();
            });
        };

        void (async () => {
            // 1ª Cena: Chromicos
            await showPortrait(
                "assets/sprites/SpriteSheets/Chromicos_bye.png",
                "Chromicos se despedindo de KAT",
                "Chromicos: Você conseguiu, siga sua jornada.",
                7000
            );

            // 2ª Cena: Ben
            await showPortrait(
                "assets/sprites/SpriteSheets/Ben_bye.png",
                "Ben se despedindo de KAT",
                "Ben: Foi ótimo te acompanhar, Gato.",
                7000
            );

            dialog.hidden = true;
            
            // 3ª Cena: Vídeo original do código (KAT_bye.mp4)
            video.hidden = false;
            video.currentTime = 0;
            videoPlayButton.addEventListener("click", () => {
                if (video.dataset.failed === "true") {
                    startTerminalSequence();
                    return;
                }
                videoPlayButton.hidden = true;
                video.play().catch((error) => {
                    console.error("Failed to play the KAT farewell video.", error);
                    video.controls = true;
                    videoPlayButton.hidden = false;
                });
            });

            video.addEventListener("ended", () => {
                window.setTimeout(startTerminalSequence, reducedMotion ? 0 : 1000);
            }, { once: true });
            
            video.addEventListener("error", () => {
                console.error("Failed to load the KAT farewell video.");
                video.dataset.failed = "true";
                video.controls = false;
                videoPlayButton.textContent = "Continuar";
                videoPlayButton.hidden = false;
            }, { once: true });

            video.play().catch((error) => {
                console.error("Autoplay was blocked for the KAT farewell video.", error);
                video.controls = true;
                videoPlayButton.hidden = false;
            });
        })().catch((error) => {
            console.error("Failed to play the ending cutscene.", error);
        });

        // 4ª e 5ª Cenas: Transição para o terminal e créditos
        function startTerminalSequence() {
            if (ending.classList.contains("is-terminal-mode")) {
                return;
            }
            video.pause();
            video.hidden = true;
            videoPlayButton.hidden = true;
            dialog.hidden = true;
            
            const visualContainer = ending.querySelector(".game-ending-visual");
            const kicker = ending.querySelector(".game-ending-kicker");
            if (visualContainer) visualContainer.style.display = "none";
            if (kicker) kicker.hidden = true;
            
            // Ativa o modo de tela preta total (estilo terminal)
            ending.classList.add("is-terminal-mode");

            // 4ª Cena: Frase digitada no terminal
            typeTerminalText(message, "Simulação executada por: KAT", 45).then(() => {
                // 5ª Cena: Revela os créditos e a caixinha com os devs logo abaixo
                window.setTimeout(() => {
                    credits.style.display = "block";
                    restart.style.display = "inline-block";
                    restart.focus();
                }, 1000);
            });
        }

        restart.addEventListener("click", () => {
            const reset = { ...assetState, completedChallenges: [] };
            localStorage.setItem("assets", JSON.stringify(reset));
            window.location.assign("index.html");
        });
    }

    function renderFill() {
        stage.replaceChildren();
        const steps = document.createElement("ol");
        steps.className = "challenge-how-to";
        [
            "Escolha uma opção para cada lacuna.",
            "Confira o programa preenchido.",
            "Clique em EXECUTAR para testar."
        ].forEach((instruction) => {
            const step = document.createElement("li");
            step.textContent = instruction;
            steps.appendChild(step);
        });
        stage.appendChild(steps);

        const legend = document.createElement("div");
        legend.className = "challenge-code-legend";
        [
            ["token-keyword", "Regra"],
            ["token-action", "Comando"],
            ["token-value", "Valor"],
            ["token-operator", "Operador"]
        ].forEach(([tokenClass, label]) => {
            const item = document.createElement("span");
            item.className = "challenge-code-legend-item";
            const sample = document.createElement("code");
            sample.className = tokenClass;
            sample.textContent = label;
            item.appendChild(sample);
            legend.appendChild(item);
        });
        stage.appendChild(legend);

        const code = document.createElement("div");
        code.className = "challenge-fill-code";
        const gaps = [];
        currentChallenge.template.forEach((line) => {
            const row = document.createElement("div");
            row.className = "challenge-fill-line";
            if (typeof line === "string") {
                window.katCodeHighlighter.render(row, line);
            } else {
                const label = document.createElement("span");
                window.katCodeHighlighter.render(label, line.label);
                const gap = document.createElement("span");
                gap.className = "challenge-code-gap";
                window.katCodeHighlighter.render(gap, "ESCOLHA UMA OPÇÃO");
                gap.setAttribute("aria-live", "polite");
                const selection = { line, value: "", gap };
                gaps.push(selection);
                const suffix = document.createElement("span");
                window.katCodeHighlighter.render(suffix, line.suffix || "");
                row.append(label, gap, suffix);

                const group = document.createElement("fieldset");
                group.className = "challenge-choice-group";
                const legend = document.createElement("legend");
                legend.textContent = `Etapa ${gaps.length}: escolha uma opção`;
                group.appendChild(legend);
                const choices = document.createElement("div");
                choices.className = "challenge-choice-list";
                line.options.forEach((option, index) => {
                    const choiceLabel = document.createElement("label");
                    choiceLabel.className = "challenge-choice";
                    const input = document.createElement("input");
                    input.type = "radio";
                    input.name = `challenge-${currentChallengeId}-gap-${gaps.length}`;
                    input.value = option;
                    input.addEventListener("change", () => {
                        selection.value = option;
                        window.katCodeHighlighter.render(gap, option);
                        gap.classList.remove("is-empty", "is-wrong");
                        feedback.textContent = "";
                        feedback.className = "challenge-feedback";
                        choiceLabel.parentElement.querySelectorAll(".challenge-choice")
                            .forEach((choice) => choice.classList.remove("is-selected"));
                        choiceLabel.classList.add("is-selected");
                    });
                    const choiceText = document.createElement("span");
                    choiceText.textContent = option;
                    choiceLabel.append(input, choiceText);
                    choices.appendChild(choiceLabel);
                });
                group.appendChild(choices);
                stage.appendChild(group);
            }
            code.appendChild(row);
        });
        stage.insertBefore(code, steps.nextSibling);
        const runButton = document.createElement("button");
        runButton.type = "button";
        runButton.className = "challenge-action";
        runButton.textContent = currentChallenge.runLabel || "EXECUTAR PROGRAMA";
        runButton.addEventListener("click", () => {
            const allFilled = gaps.every(({ value }) => value !== "");
            const correct = gaps.every(({ line, value }) => value === line.answer);
            if (allFilled && correct) {
                markComplete();
                return;
            }
            showError(allFilled
                    ? (currentChallenge.hint || "Há um comando incompatível. Confira a ordem e tente de novo.")
                : "Escolha uma opção para cada lacuna antes de executar.");
            const hasIncorrectAnswer = gaps.some(({ line, value }) =>
                value !== "" && value !== line.answer
            );
            if (hasIncorrectAnswer) {
                handleWrongAnswer();
            }
            gaps.forEach(({ line, value, gap }) => {
                gap.classList.toggle("is-wrong", value !== "" && value !== line.answer);
                gap.classList.toggle("is-empty", value === "");
            });
        });
        stage.appendChild(runButton);
    }

    instructions.textContent = "Complete somente as lacunas do código e execute.";
    renderFill();

    launcher.addEventListener("click", openChallenge);
    if (currentChallenge.readyEvent) {
        document.addEventListener(currentChallenge.readyEvent, () => {
            challengeReady = true;
            if (adminRecoveryRequired || completed.includes(currentChallengeId)) {
                return;
            }
            launcher.hidden = false;
            openChallenge();
        }, { once: true });
    }
    document.addEventListener("kat:admin-access-lost", () => {
        adminRecoveryRequired = true;
    });
    document.addEventListener("kat:admin-access-restored", () => {
        adminRecoveryRequired = false;
        failurePending = false;
        if (challengeReady && !completed.includes(currentChallengeId)) {
            launcher.hidden = false;
            openChallenge();
        }
    });
    closeButton.addEventListener("click", closeChallenge);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeChallenge();
        }
    });
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !overlay.hidden && !currentChallenge.ending) {
            closeChallenge();
        }
    });
})();
