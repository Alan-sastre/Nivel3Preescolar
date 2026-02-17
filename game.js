function isMobile() {
  return /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
}

const config = {
  type: Phaser.AUTO, // Intentará usar WebGL primero, lo cual evita problemas de Canvas2D
  scale: {
    mode: Phaser.Scale.FIT,
    parent: "game",
    width: 1000,
    height: 500,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true, // Cambiado a true para evitar jittering de subpíxeles
    clearBeforeRender: true,
    preserveDrawingBuffer: false, // Desactivado para evitar parpadeos de buffer en Chrome/Edge
    batchSize: 2000,
    willReadFrequently: true, // Optimiza getImageData cuando el motor usa Canvas2D
  },
  scene: [
    RobotsPuzzle1Scene,
    RobotsPuzzle2Scene,
    RobotsPuzzle3Scene,
  ],
};

// Crear el contenedor del juego
const gameContainer = document.createElement("div");
gameContainer.id = "game";
document.body.appendChild(gameContainer);

// Crear el juego
var game = new Phaser.Game(config);

// Manejar la orientación en móviles
if (isMobile()) {
  window.addEventListener("resize", function () {
    if (window.innerHeight > window.innerWidth) {
      document.getElementById("turn").style.display = "flex";
    } else {
      document.getElementById("turn").style.display = "none";
    }
  });
}
