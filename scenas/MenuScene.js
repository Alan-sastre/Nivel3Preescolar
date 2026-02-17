class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create() {
    this.width = this.cameras.main.width;
    this.height = this.cameras.main.height;

    this.createAnimatedBackground();
    this.createRobotDecor();

    const titleBgWidth = Math.min(this.width * 0.8, 700);
    const titleBg = this.add
      .rectangle(
        this.width / 2,
        this.height / 3,
        titleBgWidth,
        110,
        0x000000,
        0.35,
      )
      .setStrokeStyle(2, 0x00ffff, 0.2);
    const title = this.add
      .text(this.width / 2, this.height / 3, "¡ACTIVA AL ROBOT!", {
        fontFamily: "Orbitron",
        fontSize: "68px",
        color: "#ffffff",
        stroke: "#003366",
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    title.setShadow(0, 0, "#000000", 12);

    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.03 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: title,
      alpha: { from: 0.98, to: 1 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const startBtn = this.add.container(this.width / 2, this.height * 0.65);
    const btnRect = this.add
      .rectangle(0, 0, 280, 90, 0x00ffcc)
      .setStrokeStyle(6, 0x0055ff);
    const btnText = this.add
      .text(0, 0, "¡JUGAR!", {
        fontFamily: "Rajdhani",
        fontSize: "44px",
        color: "#001532",
        fontWeight: "bold",
      })
      .setOrigin(0.5);
    startBtn.add([btnRect, btnText]);
    btnRect.setInteractive({ useHandCursor: true });

    btnRect.on("pointerover", () => {
      btnRect.setFillStyle(0xffffff);
      btnText.setColor("#00ffcc");
      this.tweens.add({ targets: startBtn, scale: 1.08, duration: 180 });
      const ripple = this.add.circle(0, 0, 10, 0x00ffff, 0.2);
      startBtn.add(ripple);
      this.tweens.add({
        targets: ripple,
        scale: 3,
        alpha: 0,
        duration: 600,
        onComplete: () => ripple.destroy(),
      });
    });

    btnRect.on("pointerout", () => {
      btnRect.setFillStyle(0x00ffcc);
      btnText.setColor("#001532");
      this.tweens.add({ targets: startBtn, scale: 1.0, duration: 180 });
    });

    btnRect.on("pointerdown", () => {
      this.cameras.main.flash(200, 0, 255, 255);
      this.cameras.main.fade(500, 0, 21, 50);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Nivel2Scene");
      });
    });
  }

  createAnimatedBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x001532, 0x001532, 0x003366, 0x003366, 1);
    bg.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, this.width);
      const y = Phaser.Math.Between(0, this.height);
      const radius = Phaser.Math.Between(5, 20);
      const bubble = this.add.circle(x, y, radius, 0x00aaff, 0.3);

      this.tweens.add({
        targets: bubble,
        y: y - 100,
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 5000),
        onRepeat: () => {
          bubble.y = this.height + 50;
          bubble.alpha = 0.3;
        },
      });
    }

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x00ffff, 0.08);
    for (let gx = 0; gx <= this.width; gx += 80) {
      grid.lineBetween(gx, 0, gx, this.height);
    }
    for (let gy = 0; gy <= this.height; gy += 80) {
      grid.lineBetween(0, gy, this.width, gy);
    }
    this.tweens.add({
      targets: grid,
      alpha: 0.16,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, this.width);
      const y = Phaser.Math.Between(0, this.height);
      const star = this.add.circle(x, y, 2, 0x00ffff, 0.6);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.9 },
        duration: Phaser.Math.Between(800, 1500),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: Phaser.Math.Between(0, 1200),
      });
    }
  }

  createRobotDecor() {
    const gear1 = this.add.container(90, this.height * 0.28).setDepth(5);
    const g1Base = this.add
      .circle(0, 0, 40, 0x7f8c8d)
      .setStrokeStyle(3, 0x2c3e50);
    const g1Center = this.add.circle(0, 0, 10, 0x2c3e50);
    gear1.add([g1Base, g1Center]);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = Math.cos(a) * 34;
      const y = Math.sin(a) * 34;
      const spoke = this.add
        .rectangle(x, y, 18, 6, 0x95a5a6)
        .setStrokeStyle(1, 0x2c3e50);
      spoke.setAngle((a * 180) / Math.PI);
      gear1.add(spoke);
    }
    this.tweens.add({
      targets: gear1,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: "Linear",
    });

    const gear2 = this.add
      .container(this.width - 90, this.height * 0.76)
      .setDepth(5);
    const g2Base = this.add
      .circle(0, 0, 50, 0x95a5a6)
      .setStrokeStyle(3, 0x2c3e50);
    const g2Center = this.add.circle(0, 0, 12, 0x2c3e50);
    gear2.add([g2Base, g2Center]);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const x = Math.cos(a) * 42;
      const y = Math.sin(a) * 42;
      const spoke = this.add
        .rectangle(x, y, 20, 6, 0x7f8c8d)
        .setStrokeStyle(1, 0x2c3e50);
      spoke.setAngle((a * 180) / Math.PI);
      gear2.add(spoke);
    }
    this.tweens.add({
      targets: gear2,
      angle: -360,
      duration: 10000,
      repeat: -1,
      ease: "Linear",
    });

    const heartCore = this.add
      .star(this.width * 0.8, this.height * 0.26, 5, 18, 40, 0x00ffff, 0.25)
      .setStrokeStyle(3, 0x0055ff)
      .setDepth(6);
    this.tweens.add({
      targets: heartCore,
      scale: { from: 0.95, to: 1.05 },
      alpha: { from: 0.2, to: 0.35 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const arm = this.add
      .container(this.width * 0.2, this.height * 0.62)
      .setDepth(5);
    const shoulder = this.add
      .circle(0, 0, 20, 0x7f8c8d)
      .setStrokeStyle(2, 0x2c3e50);
    const upperArm = this.add
      .rectangle(28, 0, 45, 18, 0xbdc3c7)
      .setStrokeStyle(3, 0x2c3e50);
    const elbow = this.add
      .circle(52, 0, 12, 0x7f8c8d)
      .setStrokeStyle(2, 0x2c3e50);
    const forearm = this.add
      .rectangle(82, 0, 55, 16, 0xbdc3c7)
      .setStrokeStyle(3, 0x2c3e50);
    const hand = this.add
      .rectangle(112, 0, 24, 20, 0x34495e)
      .setStrokeStyle(2, 0x2c3e50);
    arm.add([shoulder, upperArm, elbow, forearm, hand]);
    this.tweens.add({
      targets: arm,
      angle: { from: -4, to: 4 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    for (let i = 0; i < 6; i++) {
      const x = Phaser.Math.Between(40, this.width - 40);
      const y = Phaser.Math.Between(60, this.height - 60);
      const bolt = this.add
        .circle(x, y, 6, 0x7f8c8d)
        .setStrokeStyle(2, 0x2c3e50)
        .setDepth(4);
      this.tweens.add({
        targets: bolt,
        alpha: { from: 0.4, to: 0.8 },
        duration: Phaser.Math.Between(800, 1400),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: Phaser.Math.Between(0, 600),
      });
    }
  }
}
