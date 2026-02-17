class Nivel2Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel2Scene" });
  }

  preload() {
    this.load.audio("bgm_nivel2", "musica1.mp3");
  }

  create() {
    this.width = this.cameras.main.width;
    this.height = this.cameras.main.height;
    this.currentPuzzle = 1;
    this.selectedColor = null;

    // Background
    this.createBackground();

    this.audioManager = new AudioManager(this, "bgm_nivel2");

    // Robot Container
    this.robot = new Robot(this, this.width / 2, this.height / 2 + 30);

    // Indicador de progreso
    this.createProgressIndicator();

    // Paleta de colores
    this.createColorPalette();

    // Puzzle inicial
    this.setupPuzzle1();
  }

  createColorPalette() {
    const colors = [0xff4b2b, 0x12c2e9, 0x00ff00, 0xff00ff, 0xffff00, 0xff8c00];
    this.paletteButtons = [];
    const startX = 80;
    const startY = this.height / 2 - colors.length * 35;

    // Fondo para la paleta
    const paletteBg = this.add
      .rectangle(
        startX,
        this.height / 2,
        100,
        colors.length * 75 + 40,
        0x000000,
        0.4,
      )
      .setStrokeStyle(4, 0x00ffff, 0.5);

    colors.forEach((color, i) => {
      const container = this.add.container(startX, startY + i * 75);

      const bg = this.add
        .circle(0, 0, 30, 0x333333)
        .setStrokeStyle(3, 0xffffff);
      const orb = this.add.circle(0, 0, 25, color);

      // Brillo en el orbe
      const shine = this.add.circle(-8, -8, 8, 0xffffff, 0.4);

      container.add([bg, orb, shine]);
      container.setInteractive(
        new Phaser.Geom.Circle(0, 0, 30),
        Phaser.Geom.Circle.Contains,
      );

      container.on("pointerover", () => {
        this.tweens.add({ targets: container, scale: 1.2, duration: 200 });
      });

      container.on("pointerout", () => {
        if (this.selectedColor !== color) {
          this.tweens.add({ targets: container, scale: 1, duration: 200 });
        }
      });

      container.on("pointerdown", () => {
        this.selectedColor = color;
        // Feedback visual de selección
        this.paletteButtons.forEach((btn) => {
          btn.list[0].setStrokeStyle(3, 0xffffff);
          this.tweens.add({ targets: btn, scale: 1, duration: 200 });
        });
        bg.setStrokeStyle(6, 0x00ff00);
        this.tweens.add({ targets: container, scale: 1.3, duration: 200 });

        // Efecto de partículas visual
        this.createExplosion(container.x, container.y, color, 10);

        // Actualizar la guía visual
        this.updateVisualGuide();
      });

      this.paletteButtons.push(container);
    });

    // Guía visual dinámica (Mano y Texto)
    this.guideHand = this.add
      .text(startX + 60, startY, "👈", { fontSize: "60px" })
      .setOrigin(0, 0.5)
      .setDepth(100);

    this.guideText = this.add
      .text(this.width / 2, 50, "", {
        fontSize: "45px",
        fontFamily: "Arial Black",
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.handTween = this.tweens.add({
      targets: this.guideHand,
      x: "+=25",
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  updateVisualGuide(partName = null) {
    if (partName) this.currentPartToPaint = partName;
    const part = this.currentPartToPaint;

    if (!this.guideHand || !this.guideText) return;

    // Detener tweens anteriores para evitar saltos y parpadeos
    this.tweens.killTweensOf([this.guideHand, this.guideText]);

    let targetX = 140;
    let targetY = this.height / 2;
    let newText = "";
    let handText = "👈";

    if (!this.selectedColor) {
      targetY = this.height / 2 - 6 * 35;
      newText = "¡ESCOGE UN COLOR!";
      handText = "👈";
    } else {
      handText = "👉";
      targetX = this.width / 2;
      targetY = this.height / 2;

      if (part === "head") {
        targetX = this.width / 2 - 120;
        targetY = this.height / 2 - 120;
        newText = "PINTA LA CABEZA";
      } else if (part === "body") {
        targetX = this.width / 2 - 130; // Posicionado a la izquierda del cuerpo
        targetY = this.height / 2 + 20; // Centrado verticalmente respecto al tronco
        newText = "PINTA EL CUERPO";
      } else if (part === "arms") {
        targetX = this.width / 2 - 180;
        targetY = this.height / 2 + 20;
        newText = "PINTA LOS BRAZOS";
      } else if (part === "legs") {
        targetX = this.width / 2 - 120;
        targetY = this.height / 2 + 150;
        newText = "PINTA LAS PIERNAS";
      } else if (part === "heart") {
        targetX = this.width / 2 - 120;
        targetY = this.height / 2 - 25;
        newText = "¡ACTIVA EL CORAZÓN!";
      }
    }

    // Transición suave en lugar de cambio instantáneo
    this.tweens.add({
      targets: this.guideHand,
      x: targetX,
      y: targetY,
      alpha: 1,
      duration: 300,
      ease: "Power2.easeOut",
      onStart: () => {
        this.guideHand.setText(handText);
      },
      onComplete: () => {
        // Reiniciar animación de señalización
        this.tweens.add({
          targets: this.guideHand,
          x: this.guideHand.x + (this.selectedColor ? 20 : -20),
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });

    // Cambio de texto con pequeño fade para evitar parpadeo brusco
    if (this.guideText.text !== newText) {
      this.tweens.add({
        targets: this.guideText,
        alpha: 0,
        duration: 150,
        onComplete: () => {
          this.guideText.setText(newText);
          this.tweens.add({
            targets: this.guideText,
            alpha: 1,
            duration: 150,
          });
        },
      });
    }
  }

  highlightPart(partName) {
    let targets = [];
    if (partName === "head") targets = [this.robot.parts.headMain];
    if (partName === "body") targets = [this.robot.parts.bodyMain];
    if (partName === "arms")
      targets = [this.robot.parts.armL, this.robot.parts.armR];
    if (partName === "legs")
      targets = [
        this.robot.parts.legL,
        this.robot.parts.legR,
        this.robot.parts.thighL,
        this.robot.parts.thighR,
      ];
    if (partName === "heart") targets = [this.robot.parts.heart];

    targets.forEach((target) => {
      this.tweens.add({
        targets: target,
        alpha: 0.5,
        scale: 1.05,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
      // Añadir un contorno blanco intermitente
      target.setStrokeStyle(6, 0xffffff);
    });
  }

  stopHighlight(partName) {
    let targets = [];
    if (partName === "head") targets = [this.robot.parts.headMain];
    if (partName === "body") targets = [this.robot.parts.bodyMain];
    if (partName === "arms")
      targets = [this.robot.parts.armL, this.robot.parts.armR];
    if (partName === "legs")
      targets = [
        this.robot.parts.legL,
        this.robot.parts.legR,
        this.robot.parts.thighL,
        this.robot.parts.thighR,
      ];
    if (partName === "heart") targets = [this.robot.parts.heart];

    targets.forEach((target) => {
      this.tweens.killTweensOf(target);
      target.setAlpha(1);
      target.setScale(1);
      target.setStrokeStyle(4, 0x2c3e50);
    });
  }

  setupPuzzle1() {
    this.clearUI();
    this.selectedColor = null;
    this.updateVisualGuide("head");

    this.highlightPart("head");
    this.robot.setInteractivePart(
      "head",
      () => {
        this.stopHighlight("head");
        this.handleSuccess(1);
      },
      () => this.selectedColor,
    );
  }

  setupPuzzle2() {
    this.clearUI();
    this.selectedColor = null;
    this.updateVisualGuide("body");

    this.highlightPart("body");
    this.robot.setInteractivePart(
      "body",
      () => {
        this.stopHighlight("body");
        this.handleSuccess(2);
      },
      () => this.selectedColor,
    );
  }

  setupPuzzle3() {
    this.clearUI();
    this.selectedColor = null;
    this.updateVisualGuide("arms"); // Iniciar guiando a los brazos

    this.highlightPart("arms");
    this.highlightPart("legs");

    let armsPainted = false;
    let legsPainted = false;

    const checkPuzzleComplete = () => {
      if (armsPainted && legsPainted) {
        this.handleSuccess(3);
      }
    };

    this.robot.setInteractivePart(
      "arms",
      () => {
        if (!this.selectedColor) {
          this.handleFailure(this.guideHand);
          return;
        }
        this.stopHighlight("arms");
        armsPainted = true;

        // Si ya pintamos brazos pero no piernas, cambiar la guía a piernas
        if (!legsPainted) {
          this.updateVisualGuide("legs");
        }

        checkPuzzleComplete();
      },
      () => this.selectedColor,
      false,
    );

    this.robot.setInteractivePart(
      "legs",
      () => {
        if (!this.selectedColor) {
          this.handleFailure(this.guideHand);
          return;
        }
        this.stopHighlight("legs");
        legsPainted = true;

        // Si ya pintamos piernas pero no brazos, cambiar la guía a brazos
        if (!armsPainted) {
          this.updateVisualGuide("arms");
        }

        checkPuzzleComplete();
      },
      () => this.selectedColor,
      false,
    );
  }

  setupPuzzle4() {
    this.clearUI();
    this.selectedColor = null;
    this.updateVisualGuide("heart");

    // Aparecer el corazón con animación
    this.robot.parts.heart.setAlpha(1);
    this.tweens.add({
      targets: this.robot.parts.heart,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
    });

    this.highlightPart("heart");
    this.robot.setInteractivePart(
      "heart",
      () => {
        this.stopHighlight("heart");
        this.handleSuccess(4);
      },
      () => this.selectedColor,
    );
  }

  createProgressIndicator() {
    const dots = 4;
    this.progressDots = [];
    const startX = this.width / 2 - (dots - 1) * 25;

    // Fondo para el indicador
    this.add
      .rectangle(this.width / 2, this.height - 40, dots * 60, 45, 0x000000, 0.4)
      .setStrokeStyle(2, 0x00ffff, 0.5)
      .setDepth(90);

    for (let i = 0; i < dots; i++) {
      const dot = this.add
        .circle(startX + i * 50, this.height - 40, 12, 0x333333)
        .setStrokeStyle(2, 0xffffff)
        .setDepth(100);
      this.progressDots.push(dot);
    }
  }

  updateProgress(step) {
    this.progressDots.forEach((dot, i) => {
      if (i < step) {
        dot.setFillStyle(0x00ff00);
        dot.setStrokeStyle(3, 0xffffff);
        this.tweens.add({
          targets: dot,
          scale: 1.4,
          duration: 300,
          yoyo: true,
        });
      }
    });
  }

  createBackground() {
    this.width = this.cameras.main.width;
    this.height = this.cameras.main.height;

    // Fondo azul profundo con gradiente
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x001532, 0x001532, 0x003399, 0x003399, 1);
    graphics.fillRect(0, 0, this.width, this.height);

    // Burbujas animadas
    for (let i = 0; i < 25; i++) {
      const x = Phaser.Math.Between(0, this.width);
      const y = Phaser.Math.Between(0, this.height);
      const radius = Phaser.Math.Between(10, 30);
      const bubble = this.add.circle(x, y, radius, 0x00ccff, 0.2);
      bubble.setStrokeStyle(2, 0x00ffff, 0.4);

      this.tweens.add({
        targets: bubble,
        y: y - 50,
        x: x + Phaser.Math.Between(-20, 20),
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Algunos detalles tecnológicos suaves en el fondo
    const techGraphics = this.add.graphics();
    techGraphics.lineStyle(2, 0x00ffff, 0.1);
    for (let i = 0; i < 5; i++) {
      techGraphics.strokeRect(
        Phaser.Math.Between(0, this.width),
        Phaser.Math.Between(0, this.height),
        Phaser.Math.Between(100, 300),
        Phaser.Math.Between(100, 300),
      );
    }
  }

  handleSuccess(puzzleNum) {
    // Detener la guía temporalmente durante el éxito para evitar parpadeos
    if (this.guideHand) this.guideHand.setAlpha(0);
    if (this.guideText) {
      this.guideText.setText("¡GENIAL!");
      this.tweens.add({
        targets: this.guideText,
        scale: 1.5,
        duration: 300,
        yoyo: true,
      });
    }

    this.updateProgress(puzzleNum);

    if (puzzleNum === 4) {
      this.robot.playFinalActivation();
    } else {
      this.robot.playSuccessAnimation();
    }

    this.createExplosion(this.width / 2, this.height / 2);

    // Feedback visual sin texto (usando emojis grandes o iconos)
    const feedbackIcon = puzzleNum === 4 ? "🤖✨" : "✅";
    const wellDone = this.add
      .text(this.width / 2, this.height / 2, feedbackIcon, {
        fontSize: puzzleNum === 4 ? "120px" : "150px",
      })
      .setOrigin(0.5)
      .setScale(0)
      .setDepth(100);

    this.tweens.add({
      targets: wellDone,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          this.tweens.add({
            targets: wellDone,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => {
              wellDone.destroy();
              if (puzzleNum === 1) {
                this.transitionToPuzzle(() => this.setupPuzzle2());
              } else if (puzzleNum === 2) {
                this.transitionToPuzzle(() => this.setupPuzzle3());
              } else if (puzzleNum === 3) {
                this.transitionToPuzzle(() => this.setupPuzzle4());
              } else {
                // Esperar un poco más para que el niño vea la animación de activación antes del final
                this.time.delayedCall(3000, () => {
                  this.showFinishScreen();
                });
              }
            },
          });
        });
      },
    });
  }

  transitionToPuzzle(setupNextPuzzle) {
    // Cortina de transición
    const curtain = this.add.graphics();
    curtain.fillStyle(0x000000, 0);
    curtain.fillRect(0, 0, this.width, this.height);
    curtain.setDepth(200);

    // Animación del robot durante la transición
    this.tweens.add({
      targets: this.robot.container,
      y: this.height + 200,
      duration: 600,
      ease: "Power2.easeIn",
      onComplete: () => {
        this.clearUI();
        setupNextPuzzle();
        if (this.guideHand) this.guideHand.setAlpha(1);

        // El robot vuelve a entrar
        this.robot.container.y = this.height + 200;
        this.tweens.add({
          targets: this.robot.container,
          y: this.height / 2 + 30,
          duration: 800,
          ease: "Back.easeOut",
          delay: 200,
        });
      },
    });

    // Efecto de fade
    this.tweens.add({
      targets: curtain,
      alpha: 1,
      duration: 500,
      yoyo: true,
      hold: 500,
      onYoyo: () => {
        curtain.fillStyle(0x000000, 1);
        curtain.fillRect(0, 0, this.width, this.height);
      },
      onComplete: () => curtain.destroy(),
    });
  }

  handleFailure(element) {
    this.cameras.main.shake(100, 0.01);
    this.tweens.add({
      targets: element,
      x: element.x + 10,
      duration: 50,
      yoyo: true,
      repeat: 2,
    });
  }

  createExplosion(x, y) {
    for (let i = 0; i < 30; i++) {
      const particle = this.add.circle(
        x,
        y,
        Phaser.Math.Between(5, 10),
        0xffffff,
      );
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(100, 300);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.tweens.add({
        targets: particle,
        x: x + vx,
        y: y + vy,
        alpha: 0,
        scale: 0,
        duration: 800,
        onComplete: () => particle.destroy(),
      });
    }
  }

  clearUI() {
    if (this.titleText) this.titleText.destroy();
    if (this.targetVisual) this.targetVisual.destroy();
    if (this.colorButtons) this.colorButtons.forEach((b) => b.destroy());
    if (this.patternUI) this.patternUI.destroy();
    if (this.arrow) this.arrow.destroy();
    this.robot.clearInteractions();
  }

  showFinishScreen() {
    this.clearUI();
    if (this.guideText) this.guideText.setText("¡ROBOT ACTIVADO!");

    const finishUI = this.add.container(0, 0).setDepth(1000);

    const overlay = this.add
      .rectangle(
        this.width / 2,
        this.height / 2,
        this.width,
        this.height,
        0x000000,
        0.7,
      )
      .setDepth(0);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x001b2f, 0.95);
    panelBg.fillRoundedRect(
      this.width / 2 - 230,
      this.height / 2 - 170,
      460,
      320,
      26,
    );
    panelBg.lineStyle(4, 0x00ffff, 0.8);
    panelBg.strokeRoundedRect(
      this.width / 2 - 230,
      this.height / 2 - 170,
      460,
      320,
      26,
    );

    const panelGlow = this.add
      .ellipse(this.width / 2, this.height / 2 + 40, 380, 160, 0x00ffff, 0.08)
      .setStrokeStyle(2, 0x00ffff, 0.2);

    const trophyGlow = this.add
      .circle(this.width / 2, this.height / 2 - 60, 70, 0x00ffff, 0.15)
      .setStrokeStyle(2, 0x00ffff, 0.5);

    const trophy = this.add
      .text(this.width / 2, this.height / 2 - 70, "🏆", { fontSize: "120px" })
      .setOrigin(0.5);

    const congratsText = this.add
      .text(this.width / 2, this.height / 2 + 40, "¡LO LOGRASTE!", {
        fontSize: "45px",
        fontFamily: "Arial Black",
        fill: "#eaf6ff",
        stroke: "#00334d",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const replayContainer = this.add
      .container(this.width / 2, this.height / 2 + 125)
      .setDepth(10);
    const replayBtn = this.add
      .rectangle(0, 0, 280, 72, 0x00e0c0, 1)
      .setStrokeStyle(4, 0x005b7f);
    const replayIcon = this.add.text(-78, 0, "", {
      fontSize: "32px",
    });
    replayIcon.setOrigin(0.5);
    const replayText = this.add.text(22, 0, "VOLVER A JUGAR", {
      fontSize: "26px",
      fontFamily: "Arial Black",
      fill: "#00334d",
    });
    replayText.setOrigin(0.5);
    replayContainer.add([replayBtn, replayIcon, replayText]);

    replayBtn.setInteractive({ useHandCursor: true });
    replayBtn.on("pointerover", () => {
      this.tweens.add({
        targets: replayContainer,
        scale: 1.06,
        duration: 140,
        ease: "Back.easeOut",
      });
      replayBtn.setFillStyle(0xffffff);
      replayText.setColor("#007a66");
    });
    replayBtn.on("pointerout", () => {
      this.tweens.add({
        targets: replayContainer,
        scale: 1,
        duration: 160,
        ease: "Back.easeOut",
      });
      replayBtn.setFillStyle(0x00e0c0);
      replayText.setColor("#00334d");
    });
    replayBtn.on("pointerdown", () => {
      this.cameras.main.flash(200, 0, 255, 255);
      this.scene.restart();
    });

    finishUI.add([
      overlay,
      panelBg,
      panelGlow,
      trophyGlow,
      trophy,
      congratsText,
      replayContainer,
    ]);

    // Animación de entrada
    finishUI.setAlpha(0).setScale(0.8);
    this.tweens.add({
      targets: finishUI,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
    });

    // Partículas de celebración continuas
    this.time.addEvent({
      delay: 500,
      callback: () =>
        this.createExplosion(
          Phaser.Math.Between(100, this.width - 100),
          Phaser.Math.Between(100, this.height - 100),
        ),
      loop: true,
    });
  }
}

class Robot {
  constructor(scene, x, y) {
    this.scene = scene;
    this.container = scene.add.container(x, y);

    this.baseColor = 0xbdc3c7; // Gris metálico base
    this.parts = {};

    this.createRobot();
  }

  createRobot() {
    // Sombra en el suelo con gradiente radial
    const shadow = this.scene.add.ellipse(0, 160, 160, 40, 0x000000, 0.3);
    this.container.add(shadow);

    // PIERNAS Y PIES
    const createLeg = (x, side) => {
      const legContainer = this.scene.add.container(x, 100);

      // Muslo (Thigh) con gradiente simulado por rectángulos
      const thigh = this.scene.add
        .rectangle(0, -10, 30, 40, this.baseColor)
        .setStrokeStyle(3, 0x2c3e50);
      const thighShine = this.scene.add.rectangle(
        -8,
        -10,
        4,
        30,
        0xffffff,
        0.2,
      );

      // Articulación Rodilla
      const knee = this.scene.add
        .circle(0, 15, 14, 0x7f8c8d)
        .setStrokeStyle(2, 0x2c3e50);
      const kneeDetail = this.scene.add.circle(0, 15, 8, 0x95a5a6);
      const kneeBolt = this.scene.add.circle(0, 15, 3, 0x2c3e50);

      // Espinilla (Shin)
      const shin = this.scene.add
        .rectangle(0, 40, 24, 50, this.baseColor)
        .setStrokeStyle(3, 0x2c3e50);
      const shinDetail = this.scene.add.rectangle(0, 40, 12, 30, 0x000000, 0.1);

      // Pie con diseño más complejo
      const foot = this.scene.add.container(0, 65);
      const footBase = this.scene.add
        .rectangle(0, 5, 45, 18, 0x34495e)
        .setStrokeStyle(2, 0x2c3e50);
      const footTop = this.scene.add.rectangle(0, -2, 35, 12, 0x2c3e50);
      const footGlow = this.scene.add.rectangle(0, 8, 30, 2, 0x00ffff, 0.5);
      foot.add([footBase, footTop, footGlow]);

      legContainer.add([
        thigh,
        thighShine,
        knee,
        kneeDetail,
        kneeBolt,
        shin,
        shinDetail,
        foot,
      ]);
      return { container: legContainer, main: shin, thigh: thigh };
    };

    const legL = createLeg(-40, -1);
    const legR = createLeg(40, 1);
    this.parts.legL = legL.main;
    this.parts.legR = legR.main;
    this.parts.thighL = legL.thigh;
    this.parts.thighR = legR.thigh;

    // CUERPO (Tronco)
    this.parts.bodyContainer = this.scene.add.container(0, 0);

    // Armadura principal con bordes biselados visuales
    const bodyRect = this.scene.add
      .rectangle(0, 0, 130, 170, this.baseColor)
      .setStrokeStyle(4, 0x2c3e50);

    // Detalles de la armadura (placas laterales)
    const plateL = this.scene.add.rectangle(-55, 0, 10, 140, 0x000000, 0.1);
    const plateR = this.scene.add.rectangle(55, 0, 10, 140, 0x000000, 0.1);

    // Panel central con gradiente simulado
    const centralPanel = this.scene.add.rectangle(
      0,
      0,
      100,
      140,
      0x000000,
      0.05,
    );

    // Pantalla en el pecho mejorada
    const screenFrame = this.scene.add
      .rectangle(0, -25, 90, 70, 0x34495e)
      .setStrokeStyle(3, 0x95a5a6);
    const screen = this.scene.add.rectangle(0, -25, 80, 60, 0x1a1a1a);

    // Gráficos de pulso en pantalla
    const pulseGraphics = this.scene.add.graphics();
    pulseGraphics.lineStyle(2, 0x00ff00, 0.5);
    pulseGraphics.beginPath();
    pulseGraphics.moveTo(-35, -25);
    for (let i = 0; i < 8; i++) {
      pulseGraphics.lineTo(-35 + i * 10, -25 + (i % 2 == 0 ? 15 : -15));
    }
    pulseGraphics.strokePath();

    // Luces de estado con brillo
    const lights = [];
    const lightGlows = [];
    for (let i = 0; i < 3; i++) {
      const l = this.scene.add
        .circle(-30 + i * 30, 45, 8, 0x333333)
        .setStrokeStyle(2, 0x000000);
      const glow = this.scene.add.circle(-30 + i * 30, 45, 12, 0xffffff, 0);
      lights.push(l);
      lightGlows.push(glow);
    }
    this.parts.bodyLights = lights;
    this.parts.lightGlows = lightGlows;

    // Engranaje visible en el abdomen
    const gear = this.scene.add
      .circle(0, 80, 20, 0x7f8c8d)
      .setStrokeStyle(2, 0x2c3e50);
    const gearCenter = this.scene.add.circle(0, 80, 8, 0x2c3e50);
    this.parts.gear = gear;

    // CORAZÓN / NÚCLEO (Nuevo elemento para el puzzle 4)
    // Se crea oculto y con un área de colisión MUCHO mayor
    const heart = this.scene.add
      .star(0, -25, 5, 25, 50, 0x333333)
      .setStrokeStyle(4, 0x000000)
      .setDepth(50) // Máxima profundidad para asegurar clics
      .setAlpha(0)
      .setScale(0.5);

    // Área de colisión gigante (círculo de radio 80) para que sea imposible fallar
    heart.setInteractive(
      new Phaser.Geom.Circle(0, 0, 80),
      Phaser.Geom.Circle.Contains,
    );

    this.parts.heart = heart;

    this.parts.bodyContainer.add([
      bodyRect,
      plateL,
      plateR,
      centralPanel,
      screenFrame,
      screen,
      pulseGraphics,
      gear,
      gearCenter,
      heart,
      ...lights,
      ...lightGlows,
    ]);
    this.parts.bodyMain = bodyRect;

    // BRAZOS Y MANOS (Pinzas articuladas)
    const createArm = (x, side) => {
      const armContainer = this.scene.add.container(x, -35);

      // Hombro (Shoulder) con detalle mecánico
      const shoulder = this.scene.add
        .circle(0, 0, 22, 0x7f8c8d)
        .setStrokeStyle(2, 0x2c3e50);
      const shoulderInner = this.scene.add
        .circle(0, 0, 15, 0x95a5a6)
        .setStrokeStyle(1, 0x2c3e50);
      const shoulderBolt = this.scene.add.circle(0, 0, 5, 0x2c3e50);

      // Brazo superior con brillo
      const upperArm = this.scene.add
        .rectangle(side * 25, 0, 45, 24, this.baseColor)
        .setStrokeStyle(3, 0x2c3e50);
      const upperArmShine = this.scene.add.rectangle(
        side * 25,
        -6,
        35,
        4,
        0xffffff,
        0.2,
      );

      // Codo (Elbow)
      const elbow = this.scene.add
        .circle(side * 50, 0, 14, 0x7f8c8d)
        .setStrokeStyle(2, 0x2c3e50);

      // Antebrazo con detalle
      const forearm = this.scene.add
        .rectangle(side * 80, 0, 55, 20, this.baseColor)
        .setStrokeStyle(3, 0x2c3e50);
      const forearmDetail = this.scene.add.rectangle(
        side * 80,
        0,
        30,
        8,
        0x000000,
        0.1,
      );

      // Mano (Pinza robótica)
      const hand = this.scene.add.container(side * 115, 0);
      const wrist = this.scene.add
        .rectangle(0, 0, 18, 28, 0x34495e)
        .setStrokeStyle(1, 0x000000);
      const fingerTop = this.scene.add
        .rectangle(side * 12, -10, 24, 8, 0x2c3e50)
        .setStrokeStyle(1, 0x000000);
      const fingerBot = this.scene.add
        .rectangle(side * 12, 10, 24, 8, 0x2c3e50)
        .setStrokeStyle(1, 0x000000);
      hand.add([wrist, fingerTop, fingerBot]);

      armContainer.add([
        shoulder,
        shoulderInner,
        shoulderBolt,
        upperArm,
        upperArmShine,
        elbow,
        forearm,
        forearmDetail,
        hand,
      ]);
      return { container: armContainer, main: forearm, upper: upperArm };
    };

    const armL = createArm(-70, -1);
    const armR = createArm(70, 1);
    this.parts.armL = armL.main;
    this.parts.armR = armR.main;
    this.parts.upperArmL = armL.upper;
    this.parts.upperArmR = armR.upper;

    // CUELLO (Hidráulico con cables)
    const neckBase = this.scene.add.rectangle(0, -80, 45, 12, 0x34495e);
    const neckPiston = this.scene.add
      .rectangle(0, -92, 22, 28, 0x95a5a6)
      .setStrokeStyle(2, 0x2c3e50);
    const cableL = this.scene.add
      .line(-15, -92, 0, 0, 0, 20, 0x2c3e50)
      .setLineWidth(2);
    const cableR = this.scene.add
      .line(15, -92, 0, 0, 0, 20, 0x2c3e50)
      .setLineWidth(2);

    // CABEZA (Diseño futurista redondeado)
    this.parts.headContainer = this.scene.add.container(0, -125);
    const headRect = this.scene.add
      .rectangle(0, 0, 105, 95, this.baseColor)
      .setStrokeStyle(4, 0x2c3e50);

    // Detalle superior de la cabeza
    const headTop = this.scene.add.rectangle(0, -40, 80, 10, 0x000000, 0.1);

    // Visor de los ojos con gradiente
    const visor = this.scene.add
      .rectangle(0, -5, 90, 45, 0x2c3e50, 0.9)
      .setStrokeStyle(2, 0x000000);

    const createEye = (x) => {
      const eyeBase = this.scene.add.circle(x, -5, 18, 0x1a1a1a);
      const eyeIris = this.scene.add.circle(x, -5, 11, 0x00ccff);
      const eyeGlow = this.scene.add.circle(x - 4, -9, 4, 0xffffff, 0.8);
      return [eyeBase, eyeIris, eyeGlow];
    };

    const eyeL = createEye(-25);
    const eyeR = createEye(25);
    this.parts.eyes = [...eyeL, ...eyeR];

    // Antenas / Sensores laterales
    const sensorL = this.scene.add
      .rectangle(-58, 0, 14, 45, 0x34495e)
      .setStrokeStyle(2, 0x2c3e50);
    const sensorR = this.scene.add
      .rectangle(58, 0, 14, 45, 0x34495e)
      .setStrokeStyle(2, 0x2c3e50);

    // Antena superior mejorada con luz intermitente
    const antBase = this.scene.add
      .circle(0, -48, 12, 0x7f8c8d)
      .setStrokeStyle(2, 0x2c3e50);
    const antStem = this.scene.add
      .line(0, -60, 0, 0, 0, -35, 0x2c3e50)
      .setLineWidth(5);
    const antTip = this.scene.add
      .circle(0, -95, 12, 0x333333)
      .setStrokeStyle(2, 0x000000);
    const antGlow = this.scene.add.circle(0, -95, 16, 0xff0000, 0);
    this.parts.antTip = antTip;
    this.parts.antGlow = antGlow;

    this.parts.headContainer.add([
      headRect,
      headTop,
      visor,
      ...eyeL,
      ...eyeR,
      sensorL,
      sensorR,
      antBase,
      antStem,
      antTip,
      antGlow,
    ]);
    this.parts.headMain = headRect;

    // AGREGAR TODO AL CONTENEDOR PRINCIPAL
    this.container.add([
      legL.container,
      legR.container,
      neckBase,
      neckPiston,
      cableL,
      cableR,
      armL.container,
      armR.container,
      this.parts.bodyContainer,
      this.parts.headContainer,
    ]);

    this.setupAnimations();
  }

  setupAnimations() {
    // Flotar suavemente
    this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 15,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Parpadeo de ojos (efecto robótico)
    this.scene.time.addEvent({
      delay: 4000,
      callback: () => {
        this.parts.eyes.forEach((e) => {
          if (e.type === "Arc") {
            this.scene.tweens.add({
              targets: e,
              scaleY: 0,
              duration: 100,
              yoyo: true,
            });
          }
        });
      },
      loop: true,
    });

    // Rotación suave del engranaje
    this.scene.tweens.add({
      targets: this.parts.gear,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: "Linear",
    });

    // Movimiento de antenas y luz intermitente
    this.scene.tweens.add({
      targets: this.parts.antTip,
      x: 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.scene.tweens.add({
      targets: this.parts.antGlow,
      alpha: 0.6,
      scale: 1.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  playSuccessAnimation() {
    // Salto de alegría
    this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 50,
      duration: 300,
      yoyo: true,
      ease: "Power2.easeOut",
    });

    // Rotación del cuerpo
    this.scene.tweens.add({
      targets: this.parts.bodyContainer,
      angle: { from: -5, to: 5 },
      duration: 100,
      yoyo: true,
      repeat: 5,
    });

    // Las luces del cuerpo brillan intensamente
    this.parts.lightGlows.forEach((glow) => {
      this.scene.tweens.add({
        targets: glow,
        alpha: 0.8,
        scale: 2,
        duration: 200,
        yoyo: true,
        repeat: 3,
      });
    });
  }

  playFinalActivation() {
    // Animación épica final
    this.scene.cameras.main.flash(1000, 255, 255, 255);

    // Todas las luces al máximo y cambiando de color (Efecto Disco)
    const discoColors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00, 0xffffff];
    this.parts.lightGlows.forEach((glow, i) => {
      this.scene.tweens.add({
        targets: glow,
        alpha: 1,
        scale: 4,
        duration: 200,
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (Math.random() > 0.7) {
            glow.setFillStyle(Phaser.Utils.Array.GetRandom(discoColors));
          }
        },
      });
    });

    // Ojos brillantes con energía pulsante
    this.parts.eyes.forEach((eye) => {
      if (eye.fillColor !== 0xffffff) {
        // No afectar el brillo blanco
        this.scene.tweens.add({
          targets: eye,
          scale: 1.4,
          alpha: 1,
          duration: 150,
          yoyo: true,
          repeat: -1,
        });
      }
    });

    // El robot levita más alto y vibra con energía
    this.scene.tweens.add({
      targets: this.container,
      y: this.scene.height / 2 - 80,
      duration: 1500,
      ease: "Cubic.easeInOut",
      onUpdate: () => {
        // Vibración intensa
        this.container.x += (Math.random() - 0.5) * 4;
        this.container.y += (Math.random() - 0.5) * 4;
      },
    });

    // Partículas de energía constantes desde el centro
    this.activationParticles = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        const p = this.scene.add.circle(
          this.container.x + (Math.random() - 0.5) * 100,
          this.container.y + (Math.random() - 0.5) * 100,
          Phaser.Math.Between(4, 12),
          Phaser.Utils.Array.GetRandom(discoColors),
          0.8,
        );
        p.setDepth(200);
        this.scene.tweens.add({
          targets: p,
          x: p.x + (Math.random() - 0.5) * 400,
          y: p.y + (Math.random() - 0.5) * 400,
          alpha: 0,
          scale: 0,
          duration: 1200,
          ease: "Power2.easeOut",
          onComplete: () => p.destroy(),
        });
      },
      loop: true,
    });

    // Rayos de luz giratorios (Efecto Aura)
    const rays = this.scene.add.graphics();
    rays.setDepth(-1);
    this.container.add(rays);

    this.scene.tweens.add({
      targets: rays,
      alpha: { from: 0, to: 1 },
      duration: 1000,
      onUpdate: () => {
        rays.clear();
        const time = this.scene.time.now * 0.008;
        for (let i = 0; i < 24; i++) {
          const angle = (i / 24) * Math.PI * 2 + time;
          const color = discoColors[i % discoColors.length];
          rays.lineStyle(6, color, 0.4);
          rays.lineBetween(
            0,
            0,
            Math.cos(angle) * 1000,
            Math.sin(angle) * 1000,
          );
        }
      },
    });
  }

  setPartColor(partName, color) {
    // Si color es una función (como () => this.selectedColor), ejecutarla
    const finalColor = typeof color === "function" ? color() : color;
    if (!finalColor) return;

    let targets = [];
    if (partName === "head") {
      targets = [this.parts.headMain, this.parts.visor, this.parts.antTip];
    }
    if (partName === "body") {
      targets = [this.parts.bodyMain, this.parts.gear];
    }
    if (partName === "arms") {
      targets = [
        this.parts.armL,
        this.parts.armR,
        this.parts.upperArmL,
        this.parts.upperArmR,
      ];
    }
    if (partName === "legs") {
      targets = [
        this.parts.legL,
        this.parts.legR,
        this.parts.thighL,
        this.parts.thighR,
      ];
    }
    if (partName === "heart") {
      targets = [this.parts.heart];
    }

    targets.forEach((target) => {
      if (!target) return;
      this.scene.tweens.addCounter({
        from: 0,
        to: 100,
        duration: 800,
        onUpdate: (tween) => {
          const value = tween.getValue();
          const startColor = Phaser.Display.Color.ValueToColor(
            target.fillColor || 0xbdc3c7,
          );
          const endColor = Phaser.Display.Color.ValueToColor(finalColor);
          const interpolated = Phaser.Display.Color.Interpolate.ColorWithColor(
            startColor,
            endColor,
            100,
            value,
          );
          target.setFillStyle(
            Phaser.Display.Color.GetColor(
              interpolated.r,
              interpolated.g,
              interpolated.b,
            ),
          );
        },
      });
    });

    // Si es el cuerpo, activar luces
    if (partName === "body") {
      this.parts.bodyLights.forEach((l, i) => {
        this.scene.time.delayedCall(i * 200, () => {
          l.setFillStyle([0xff0000, 0x00ff00, 0xffff00][i]);
          this.scene.tweens.add({
            targets: l,
            alpha: 0.5,
            duration: 400,
            yoyo: true,
            repeat: -1,
          });
        });
      });
    }
  }

  setInteractivePart(partName, callback, targetColor, clearOthers = true) {
    let targets = [];
    if (partName === "head") targets = [this.parts.headMain];
    if (partName === "body") targets = [this.parts.bodyMain];
    if (partName === "arms") targets = [this.parts.armL, this.parts.armR];
    if (partName === "legs")
      targets = [
        this.parts.legL,
        this.parts.legR,
        this.parts.thighL,
        this.parts.thighR,
      ];
    if (partName === "heart") {
      targets = [this.parts.heart];
    }

    targets.forEach((target) => {
      // Si es el corazón, ya tiene un hitArea manual definido en createRobot
      if (partName !== "heart") {
        target.setInteractive({ useHandCursor: true });
      } else {
        target.input.cursor = "pointer";
      }

      target.on("pointerdown", () => {
        const color =
          typeof targetColor === "function" ? targetColor() : targetColor;
        if (!color) {
          // Si no hay color seleccionado, el callback (que maneja el error) se encarga
          callback();
          return;
        }

        if (clearOthers) {
          this.clearInteractions(); // Desactivar todos mientras se pinta
        } else {
          // Desactivar solo este grupo de partes una vez pintadas
          targets.forEach((t) => {
            t.disableInteractive();
            t.removeAllListeners();
            t.setStrokeStyle(4, 0x2c3e50);
          });
        }

        this.setPartColor(partName, color);
        this.scene.time.delayedCall(850, callback);
      });

      target.on("pointerover", () => target.setStrokeStyle(6, 0xffffff));
      target.on("pointerout", () => target.setStrokeStyle(4, 0x2c3e50));
    });
  }

  clearInteractions() {
    const all = [
      this.parts.headMain,
      this.parts.bodyMain,
      this.parts.armL,
      this.parts.armR,
      this.parts.legL,
      this.parts.legR,
    ];
    all.forEach((t) => {
      t.disableInteractive();
      t.removeAllListeners();
      t.setStrokeStyle(4, 0x2c3e50);
    });
  }

  playSuccessAnimation() {
    this.scene.tweens.add({
      targets: this.container,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      ease: "Back.easeOut",
    });

    this.parts.antTip.setFillStyle(0x00ff00);
  }

  resetColors() {
    // No hacer nada para persistir colores, o solo llamar al inicio
  }
}
