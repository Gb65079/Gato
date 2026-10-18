const gato = new Sprite();
const chromicos = new Sprite();

gato.register_character("Gato", "gato", false);
chromicos.register_character("Chromicos", "chromicos", true);

framer.set_character_main_scene(gato);
framer.set_controls_to_character();
framer.register_characters([
    gato,
    chromicos
]);

scene.create_scene("power_chromicos", {
    startOn: 'first-interaction',
    endOn: 'last-interaction',
    dialogs: [
    {
        from: chromicos,
        to: gato,
        about: "Olá usuário, sou Chromicos, guardião da transpilação desse mundo, sou o menssageiro da mensagem dos usuários à máquina que roda esse mundo."
    },
    {
        from: gato,
        to: chromicos,
        about: "Senhor Chromicos, quero aprender a falar na lingua da máquina, para pode voltar pra casa, me ensine."
    },
    {
        from: chromicos,
        to: gato,
        about: "Você deve ser o messias, certo, ensinarei como você deve aprender a programar. Não será dificíl, completará sua missão fácilmente e rápido!"
    },
    {
        from: gato,
        to: chromicos,
        about: "Messias?... Missão?... Pode me explicar oque realmente está acontecendo!!!",
    },
    {
        from: chromicos,
        to: gato,
        about: "Não se exaute messias... vou te explicar tudo, sua missão e ademais coisas."
    },
    {
        from: chromicos,
        to: gato,
        about: "Chegou ao NPC certo!"
    },
    {
        from: gato,
        to: chromicos,
        about: "!!!!...."
    },
],
    afterItDoes: () => scene.push("awnser_questions"),
    disableControls: true

});

scene.create_scene("awnser_questions", {
    startOn: 'immediate',
    endOn: 'last-interaction',
    nextIn: 8000, //prosseguir em 2000 millisegundos (automatico), ou nextIn: "interaction" necessitando da tecla C
    frames: [
    {
        frame: "scene_1.png",
        dialog: {
            from: chromicos,
            to: gato,
            about: "À algum tempo, uma equipe de desenvolvedores, queriam produzir um jogo de ScapeRoom, no qual seria esse mundo."
        }
    },
    {
        frame: "scene_2.png",
        dialog: {
            from: chromicos,
            to: gato,
            about: "Tudo foi consumado da ideia, esse mundo surgiu, junto com ele, eu, um npc bem inteligente, que aprendia com ele, podendo até gerar scripts."
        }
    },
    {
        frame: "scene_3.png",
        dialog: {
            from: chromicos,
            to: gato,
            about: "Mas... eles desistiram, deixaram esse projeto a deriva, mas deixaram ele com opção de rodar em toda máquina, podendo inserir novos jogadores, por isso você está aqui, você foi inserido."
        }
    }
    ], //dentro da pasta scenes há /images
    scene: {
        centrelized: true,
        overlayAllElements: true,
        sound: new Audio("assets/scenes/images/history.wav"), //inclui alguma faixa de áudio
    },
    sceneAnimationPos: "bottom-to-top", //comportaento da animação da cena, baixo pra cima, cima pra baixo, lado para outro, lados aleatorios ou visão minima geral (shake-view)
    disableControls: true,
    afterItDoes: () => scene.push("end_aswner")
});

scene.create_scene("end_aswner", {
    startOn: "immediate",
    endOn: 'last-interaction',
    dialogs: [
    {
        from: chromicos,
        to: gato,
        about: "E... não sei se você poderá voltar para sua casa, já que esse jogo não tem final, e é preciso programar um final, onde voce sai e destrói o projeto"
    },
    {
        from: gato,
        to: chromicos,
        about: "destruir? não!"
    },
    {
        from: chromicos,
        to: gato,
        about: "messias... esses npc não são reais, nem sabem que isso é um jogo, você deve fazer isso para voltar ao seu mundo, você não pode morrer nesse mundo!"
    },
    {
        from: gato,
        to: chromicos,
        about: "mas..."
    },
    {
        from: chromicos,
        to: gato,
        about: "pense em você, é o único real por aqui."
    },
    {
        from: gato,
        to: chromicos,
        about: "ok...."
    },
    {
        from: chromicos,
        to: gato,
        about: "Enfim, vamos te treinar! primeiro o básico.",
        finishOn: 3000
    },
    {
        from: chromicos,
        to: gato,
        about: "Para você interagir com esse mundo, abrirei janelas de depuração, assim conseguirã executar scripts. Os objetos de manipulação são \n     - lugar \n    - personagem \n   - item",
        finishOn: 3000
    },
    {
        from: chromicos,
        to: gato,
        about: "Aqui, você tem o poder de alterar a realidade usando comandos de criação e controle direto!",
        finishOn: 4000
    },
    {
        from: chromicos,
        to: gato,
        about: "Para moldar o ambiente, usamos o objeto 'lugar'. Veja só: lugar.criar.caixa() cria uma nova caixa onde você quiser.",
        finishOn: 4000
    },
    {
        from: chromicos,
        to: gato,
        about: "lugar.deletar() apaga o primeiro objeto criado. Se você criar um caminho e depois uma caixa, primeiro o caminho será apagado. lugar.deletar.tudo() remove todos.",
        finishOn: 4000
    },
    {
        from: chromicos,
        to: gato,
        about: "Para guardar dados importantes do cenário, use 'variavel'. Exemplo: variavel itensColetados = 0;",
        finishOn: 4000
    },
    {
        from: chromicos,
        to: gato,
        about: "Para o mundo reagir às suas escolhas, use 'se'. Exemplo: se (itensColetados >= 3) { lugar.criar.porta(); }",
        finishOn: 4000
    },
    {
        from: chromicos,
        to: gato,
        about: "Se quiser repetir uma alteração no cenário, use 'enquanto'. Exemplo: enquanto (caixas < 5) { lugar.criar.caixa(); }",
        finishOn: 4000
    },
    {
        from: chromicos,
        to: gato,
        about: "O mundo não entende esse código, por isso eu vou traduzir para ele, como 001100101010001010100100101010101010101010101010101010101010101010101010",
        finishOn: 3000
    },
    ],
    afterItDoes: () => {
        const existingObjectCount = framer.createdPlaceObjects.length;
        framer.openCodeBox({
            description: "crie uma caixa",
            mode: "on-code",
            onCode: () => {
                const createdObjects = framer.createdPlaceObjects.slice(existingObjectCount);
                if (!createdObjects.some((object) => object.classList.contains("place-object-caixa"))) {
                    return "Ainda falta criar uma caixa com lugar.criar.caixa().";
                }
                scene.push("you_make");
                return true;
            }
      });
    },
    disableControls: true
});


scene.create_scene("you_make", {
    startOn: "immediate",
    endOn: 'last-interaction',
    dialogs: [
    {
        from: chromicos,
        to: gato,
        about: "Você vai conseguir, está pegando o jeito!",
        finishOn: 3000
    },
    {
        from: chromicos,
        to: gato,
        about: "Em breve, vou te dar permissão de administrador para abrir a janela de depuração quando quiser.",
        finishOn: 3000
    }
]

});

scene.push("power_chromicos");
scene.enable_character_movement();

chromicos.set_position(700, 300);
gato.set_position(5, 300);