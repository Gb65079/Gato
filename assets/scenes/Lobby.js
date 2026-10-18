const gato = new Sprite();
const ancient = new Sprite();

const flower = new Sprite();

gato.register_character("Gato", "gato", false);
ancient.register_character("Robô Ancião", "robo_anciao", true);
flower.register_character("Flor Amigavel", "flower", true);

framer.set_character_main_scene(gato);
framer.set_controls_to_character();
framer.register_characters([
    gato,
    ancient,
    flower
]);

scene.create_scene("welcome", {
    startOn: 'first-interaction',
    endOn: 'last-interaction',
    dialogs: [
        {
        from: ancient,
        to: gato,
        about: "Ahn? oque te busca por essas redondezas?"
    },
        {
        from: gato,
        to: gato,
        about: "Eu que pergunto! onde estou?"
    },
        {
        from: ancient,
        to: gato,
        about: "Você está na extensão de código defeituoso."
    },
        {
        from: gato,
        to: gato,
        about: "como cheguei aqui?"
    },
        {
        from: ancient,
        to: gato,
        about: "Você quem o diga! só soube de uma pessoa que viria... o Messias!"
    },
        {
        from: gato,
        to: gato,
        about: "Messias!? Como assim? eu era apenas um gato emcima do pc!"
    },
        {
        from: ancient,
        to: gato, 
        about: "Messias... esse jogo está incompleto, você é o único capaz de arrumar essa situação! falando no código de máquina, manipulando como a máquina mexe com esse mundo, acredito que você conseguirá sair se fizer o final!"
    },
        {
        from: gato,
        to: gato,
        about: "Já ouvi falar sobre... quem faz isso é um programador, eu era apenas um gato!"
    },
        {
        from: ancient,
        to: gato,
        about: "Messias... procure por Chromicos, o guardião da transpilação, ele fala na lingua das máquinas, ele te ajudará!"
    }
    ],
    sequenceDialogs: true,
    sequenceScene: null, 
    killNPC: false,
    characterStyle: "default",
    afterItPlay: null, 
    disableControls: true 
});


scene.create_scene("insane_flower", {
    startOn: 'first-interaction',
    endOn: 'last-interaction',
    dialogs: [
    {
        from: flower,
        to: gato,
        about: "Olá usuário ${username}, os cabos de fibra óptica estão chorando pixels... O Messias finalmente atravessou o firewall..."
    },
    {
        from: gato,
        to: flower,
        about: "Messias? Do que você tá falando, sua flor? Eu só pulei em cima do teclado do meu dono e acordei presa nessa tela escura cheia de bugs!"
    },
    {
        from: flower,
        to: gato,
        about: "O terminal está frio... as memórias ram evaporaram... mas a lenda binária dizia que o gato sagrado reescreveria as diretrizes corrompidas..."
    },
    {
        from: gato,
        to: flower,
        about: "Olha, você não tá batendo bem da cabeça com esse papo de código. Eu sou só um bicho de quatro patas que gosta de sachê! Como eu desligo esse computador e volto pro meu sofá?"
    },
    {
        from: flower,
        to: gato,
        about: "Não há botão de desligar no fim do mundo virtual... Você precisa compilar a realidade... Vá para o núcleo binário e procure por Chromicos, o mestre que traduz o caos..."
    },
    {
        from: gato,
        to: flower,
        about: "Você... está encima da caixa de texto?"
    },
    {
        from: flower,
        to: gato,
        about: "Este mundo decai como um bite corrompido, não dirige seus elementos como deveria, nos condena a essa bagunça eterna! canalizando corp-",
        finishOn: 500
    }, 
    {
        from: flower,
        to: gato,
        about: "UNEXPECTED: flower npc can't say this.",
        finishOn: 2000
    },
],

    disableControls: true

});

scene.push("insane_flower")
scene.push("welcome");

ancient.set_position(50, 40);
flower.set_position(900, 600);

scene.enable_character_movement()

gato.set_position(5, 300)