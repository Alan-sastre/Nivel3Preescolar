class RobotsPuzzle2Scene extends Phaser.Scene {
  constructor() {
    super({ key: "RobotsPuzzle2Scene" });
  }

  preload() {
    this.load.audio("musica1", "musica1.mp3");
  }

  create() {
    // Inicializar Música
    this.audioManager = new AudioManager(this, "musica1");

    this.width = this.sys.game.config.width;
    this.height = this.sys.game.config.height;

    // 1. Fondo (Suelo de rejilla tecnológica)
    this.createBackground();

    // 2. Configuración del Laberinto
    // 0: Camino, 1: Pared, 2: Inicio, 3: Meta (Batería)
    this.gridSize = 80; // Tamaño de celda
    this.mazeMap = [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 1, 0, 3, 1], // Start at (1,1)
      [1, 0, 0, 0, 1, 0, 1, 1], // Changed (2,1) and (2,2) to 0 to allow Down path
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ];

    // Calcular offsets para centrar el laberinto
    this.rows = this.mazeMap.length;
    this.cols = this.mazeMap[0].length;
    this.mazeOffsetX = (this.width - this.cols * this.gridSize) / 2;
    this.mazeOffsetY = (this.height - this.rows * this.gridSize) / 2 - 50; // Un poco arriba para dejar espacio a controles

    // Dibujar Laberinto
    this.drawMaze();

    // 3. Jugador (Robot)
    this.createPlayer();

    // 4. Meta (Batería)
    this.createGoal();

    // 5. Controles (Flechas)
    this.createControls();

    // 6. Título (Eliminado)

    // Estado
    this.isMoving = false;
    this.gameWon = false;

    // Crear texturas para partículas si no existen
    this.createParticleTextures();

    // Tutorial
    this.time.delayedCall(500, () => this.showTutorial());
  }

  createParticleTextures() {
    if (!this.textures.exists("trail")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x00ffff, 0.8);
      g.fillCircle(4, 4, 4);
      g.generateTexture("trail", 8, 8);
    }
    if (!this.textures.exists("impact")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xff0000, 1);
      g.fillCircle(3, 3, 3);
      g.generateTexture("impact", 6, 6);
    }
    if (!this.textures.exists("confetti")) {
      const c = this.make.graphics({ x: 0, y: 0, add: false });
      c.fillStyle(0xffffff);
      c.fillRect(0, 0, 10, 10);
      c.generateTexture("confetti", 10, 10);
    }
  }

  createBackground() {
    const bg = this.add.graphics();
    // Fondo oscuro cybernético
    bg.fillGradientStyle(0x0f0c29, 0x0f0c29, 0x302b63, 0x24243e, 1);
    bg.fillRect(0, 0, this.width, this.height);

    // Grid de fondo animado (perspectiva simplificada)
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x00ffff, 0.1);

    // Líneas verticales
    for (let x = 0; x <= this.width; x += 50) {
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, this.height);
    }
    // Líneas horizontales
    for (let y = 0; y <= this.height; y += 50) {
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(this.width, y);
    }
    gridGraphics.strokePath();

    // Estrellas/Datos flotantes
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = Math.random() * 2;
      const star = this.add.rectangle(x, y, size, size, 0x00ffff);
      this.tweens.add({
        targets: star,
        alpha: 0,
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 1000,
      });
    }
  }

  drawMaze() {
    this.walls = this.add.group();

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = this.mazeOffsetX + c * this.gridSize + this.gridSize / 2;
        const y = this.mazeOffsetY + r * this.gridSize + this.gridSize / 2;

        const cellType = this.mazeMap[r][c];

        // Suelo (Placa de circuito)
        const floor = this.add.rectangle(
          x,
          y,
          this.gridSize - 4,
          this.gridSize - 4,
          0x1a252f,
        );
        floor.setStrokeStyle(2, 0x2c3e50);

        // Detalle de circuito en el suelo
        if (Math.random() > 0.5) {
          const circuit = this.add.graphics();
          circuit.lineStyle(2, 0x34495e, 0.5);
          circuit.beginPath();
          circuit.moveTo(x - 20, y);
          circuit.lineTo(x, y);
          circuit.lineTo(x, y + 20);
          circuit.strokePath();
          circuit.fillStyle(0x34495e, 0.5);
          circuit.fillCircle(x + 5, y + 20, 3);
        }

        if (cellType === 1) {
          // Pared (Bloque Neon)
          const wall = this.add.rectangle(
            x,
            y,
            this.gridSize - 2,
            this.gridSize - 2,
            0x2c3e50, // Base oscura
          );
          wall.setStrokeStyle(2, 0x00ffff); // Borde Neon Cyan

          // Efecto de brillo interior (falso)
          const innerWall = this.add.rectangle(
            x,
            y,
            this.gridSize * 0.7,
            this.gridSize * 0.7,
            0x34495e,
          );

          // Decoración superior
          const topDeco = this.add.rectangle(
            x,
            y - 10,
            this.gridSize * 0.5,
            5,
            0x00ffff,
          );

          this.walls.add(wall);
        } else if (cellType === 2) {
          // Inicio (Base holográfica)
          this.startPos = { r, c, x, y };
          const startBase = this.add.circle(x, y, 30, 0x3498db, 0.3);
          this.tweens.add({
            targets: startBase,
            scale: 1.2,
            alpha: 0,
            duration: 1500,
            repeat: -1,
          });
          this.add.circle(x, y, 10, 0x3498db);
        } else if (cellType === 3) {
          // Meta (Base de carga)
          this.goalPos = { r, c, x, y };
          const goalBase = this.add.circle(x, y, 30, 0x2ecc71, 0.3);
          this.tweens.add({
            targets: goalBase,
            scale: 1.2,
            alpha: 0,
            duration: 1000,
            repeat: -1,
          });
        }
      }
    }
  }

  createPlayer() {
    this.playerContainer = this.add.container(this.startPos.x, this.startPos.y);

    // Glow effect
    const glow = this.add.circle(0, 0, 40, 0x3498db, 0.4);
    this.tweens.add({
      targets: glow,
      scale: 1.2,
      alpha: 0.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    const g = this.add.graphics();

    // --- ROBOT DISEÑO MEJORADO ---

    // 1. Orugas (Treads)
    g.fillStyle(0x2c3e50);
    g.fillRoundedRect(-30, -25, 15, 50, 5); // Izquierda
    g.fillRoundedRect(15, -25, 15, 50, 5); // Derecha

    // Detalles de orugas
    g.fillStyle(0x7f8c8d);
    for (let i = -20; i < 25; i += 10) {
      g.fillRect(-30, i, 15, 2);
      g.fillRect(15, i, 15, 2);
    }

    // 2. Cuerpo Central
    g.fillStyle(0x3498db); // Azul principal
    g.fillRoundedRect(-20, -20, 40, 40, 5);
    g.lineStyle(2, 0x2980b9);
    g.strokeRoundedRect(-20, -20, 40, 40, 5);

    // Panel frontal
    g.fillStyle(0xecf0f1);
    g.fillRect(-12, -5, 24, 15);

    // Botones panel
    g.fillStyle(0xe74c3c);
    g.fillCircle(-5, 2, 2);
    g.fillStyle(0xf1c40f);
    g.fillCircle(5, 2, 2);

    // 3. Cabeza
    g.fillStyle(0x95a5a6);
    g.fillCircle(0, -15, 12);
    g.lineStyle(1, 0x7f8c8d);
    g.strokeCircle(0, -15, 12);

    // 4. Ojos / Visor
    g.fillStyle(0x2ecc71); // Ojos verdes brillantes
    g.fillEllipse(-4, -15, 4, 6);
    g.fillEllipse(4, -15, 4, 6);

    // 5. Antena
    g.lineStyle(2, 0xbdc3c7);
    g.lineBetween(0, -25, 0, -35);
    g.fillStyle(0xe74c3c);
    g.fillCircle(0, -35, 3);

    // Animación de parpadeo de antena
    this.tweens.add({
      targets: glow, // Usamos el glow existente para no complicar, pero podríamos animar la antena aparte
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.playerContainer.add([glow, g]);

    // Posición lógica en la rejilla
    this.playerGridPos = { r: this.startPos.r, c: this.startPos.c };

    // Estela de partículas
    this.trailEmitter = this.add.particles("trail").createEmitter({
      speed: 50,
      scale: { start: 1, end: 0 },
      blendMode: "ADD",
      lifespan: 200,
      on: false, // Solo activo al mover
    });
    this.trailEmitter.startFollow(this.playerContainer);
  }

  createGoal() {
    this.goalContainer = this.add.container(this.goalPos.x, this.goalPos.y);

    const g = this.add.graphics();

    // --- BATERÍA DISEÑO MEJORADO ---

    // Sombra base
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(0, 25, 40, 15);

    // 1. Cuerpo Cilíndrico (Perspectiva)
    // Cuerpo principal
    g.fillStyle(0x27ae60); // Verde batería
    g.fillRect(-15, -20, 30, 40);

    // Brillo cilíndrico
    g.fillStyle(0x2ecc71);
    g.fillRect(-10, -20, 5, 40);

    // Parte inferior (elipse)
    g.fillStyle(0x27ae60);
    g.fillEllipse(0, 20, 30, 10);

    // Parte superior (elipse) - Borde metálico
    g.fillStyle(0xbdc3c7); // Plata
    g.fillEllipse(0, -20, 30, 10);

    // 2. Polo Positivo (Nub)
    g.fillStyle(0xbdc3c7);
    g.fillRect(-6, -28, 12, 8);
    g.fillEllipse(0, -28, 12, 4); // Top del polo

    // 3. Icono de Rayo en el cuerpo
    const bolt = this.add.graphics();
    bolt.fillStyle(0xf1c40f); // Amarillo eléctrico
    bolt.beginPath();
    bolt.moveTo(-2, -5);
    bolt.lineTo(6, -5);
    bolt.lineTo(-2, 5);
    bolt.lineTo(6, 5);
    bolt.lineTo(0, 15);
    bolt.lineTo(2, 2);
    bolt.lineTo(-6, 2);
    bolt.fillPath();

    // Centrar el rayo en la batería
    bolt.x = -2;
    bolt.y = 0;

    // 4. Indicador de carga (Barras)
    g.fillStyle(0x00ff00); // Luz pura
    g.fillRect(-8, 5, 16, 3);
    g.fillRect(-8, 10, 16, 3);
    g.fillRect(-8, 15, 16, 3);

    this.goalContainer.add(g);
    this.goalContainer.add(bolt);

    // Animación de flotación y rayo
    this.tweens.add({
      targets: this.goalContainer,
      y: this.goalPos.y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: bolt,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
  }

  createControls() {
    const baseX = this.width - 150;
    const baseY = this.height - 150;
    const size = 70;
    const gap = 15; // Increased gap slightly

    // Botones: Arriba, Abajo, Izquierda, Derecha
    this.createBtn(baseX, baseY - size - gap, -1, 0, "up"); // UP
    this.createBtn(baseX, baseY + size + gap, 1, 0, "down"); // DOWN
    this.createBtn(baseX - size - gap, baseY, 0, -1, "left"); // LEFT
    this.createBtn(baseX + size + gap, baseY, 0, 1, "right"); // RIGHT
  }

  createBtn(x, y, dr, dc, type) {
    const btn = this.add.container(x, y);
    btn.setData("id", type);

    // Fondo botón (estilo cyber)
    const bg = this.add.graphics();
    bg.fillStyle(0x1a252f, 0.8);
    bg.lineStyle(2, 0x3498db);
    bg.fillCircle(0, 0, 35);
    bg.strokeCircle(0, 0, 35);

    // Flecha Gráfica Neon
    const arrow = this.add.graphics();
    arrow.fillStyle(0x00ffff);

    if (type === "up") {
      arrow.fillTriangle(0, -15, 15, 10, -15, 10);
    } else if (type === "down") {
      arrow.fillTriangle(0, 15, 15, -10, -15, -10);
    } else if (type === "left") {
      arrow.fillTriangle(-15, 0, 10, -15, 10, 15);
    } else if (type === "right") {
      arrow.fillTriangle(15, 0, -10, -15, -10, 15);
    }

    btn.add([bg, arrow]);
    btn.setSize(70, 70);
    btn.setInteractive({ useHandCursor: true });

    btn.on("pointerdown", () => {
      bg.clear();
      bg.fillStyle(0x3498db, 1); // Highlight
      bg.lineStyle(2, 0xffffff);
      bg.fillCircle(0, 0, 35);
      bg.strokeCircle(0, 0, 35);

      this.movePlayer(dr, dc);

      // Destruir tutorial al interactuar
      if (this.tutorialHand) {
        this.tutorialHand.destroy();
        this.tutorialHand = null;
      }
    });

    btn.on("pointerup", () => {
      bg.clear();
      bg.fillStyle(0x1a252f, 0.8);
      bg.lineStyle(2, 0x3498db);
      bg.fillCircle(0, 0, 35);
      bg.strokeCircle(0, 0, 35);
    });

    btn.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x1a252f, 0.8);
      bg.lineStyle(2, 0x3498db);
      bg.fillCircle(0, 0, 35);
      bg.strokeCircle(0, 0, 35);
    });
  }

  movePlayer(dr, dc) {
    if (this.isMoving || this.gameWon) return;

    const newR = this.playerGridPos.r + dr;
    const newC = this.playerGridPos.c + dc;

    // Verificar límites y paredes
    if (
      newR >= 0 &&
      newR < this.rows &&
      newC >= 0 &&
      newC < this.cols &&
      this.mazeMap[newR][newC] !== 1
    ) {
      // Movimiento válido
      this.isMoving = true;
      this.playerGridPos = { r: newR, c: newC };

      // Activar estela
      this.trailEmitter.start();

      const targetX =
        this.mazeOffsetX + newC * this.gridSize + this.gridSize / 2;
      const targetY =
        this.mazeOffsetY + newR * this.gridSize + this.gridSize / 2;

      this.tweens.add({
        targets: this.playerContainer,
        x: targetX,
        y: targetY,
        duration: 200,
        ease: "Power1",
        onComplete: () => {
          this.isMoving = false;
          this.trailEmitter.stop(); // Desactivar estela
          this.checkWin();
        },
      });
    } else {
      // Choque visual (Shake)
      this.cameras.main.shake(100, 0.005);

      // Partículas de choque en la dirección intentada
      const impactX = this.playerContainer.x + dr * 40;
      const impactY = this.playerContainer.y + dc * 40;

      const impactParticles = this.add.particles("impact");
      impactParticles
        .createEmitter({
          x: impactX,
          y: impactY,
          speed: 100,
          scale: { start: 1, end: 0 },
          blendMode: "ADD",
          lifespan: 300,
          quantity: 10,
        })
        .explode();

      // Sonido visual (Flash rojo leve)
      this.cameras.main.flash(50, 255, 0, 0, 0.3);
    }
  }

  checkWin() {
    if (
      this.playerGridPos.r === this.goalPos.r &&
      this.playerGridPos.c === this.goalPos.c
    ) {
      this.gameWon = true;
      this.showVictory();
    }
  }

  showVictory() {
    // Efecto de carga
    this.add
      .circle(this.goalContainer.x, this.goalContainer.y, 100, 0xffff00, 0.5)
      .setScale(0)
      .setDepth(10)
      .setBlendMode("ADD");

    // Partículas
    if (!this.textures.exists("spark")) {
      const s = this.make.graphics({ x: 0, y: 0, add: false });
      s.fillStyle(0xffff00);
      s.fillCircle(2, 2, 2);
      s.generateTexture("spark", 4, 4);
    }
    const particles = this.add.particles("spark");
    const emitter = particles.createEmitter({
      x: this.goalContainer.x,
      y: this.goalContainer.y,
      speed: 200,
      scale: { start: 2, end: 0 },
      blendMode: "ADD",
      lifespan: 1000,
    });
    emitter.explode(50);

    // Icono Victoria (Cohete Despegando)
    const trophy = this.add.graphics();

    // 1. Cuerpo Principal
    trophy.fillStyle(0xecf0f1); // Blanco
    trophy.fillRoundedRect(-25, -50, 50, 90, 10);

    // 2. Punta
    trophy.fillStyle(0xe74c3c); // Rojo
    trophy.beginPath();
    trophy.moveTo(-25, -50);
    // Reemplazo de quadraticBezierTo por lineTo para compatibilidad
    trophy.lineTo(0, -90); // Punta del cohete
    trophy.lineTo(25, -50);
    trophy.fillPath();

    // 3. Aletas Laterales
    trophy.fillStyle(0x3498db); // Azul
    trophy.beginPath();
    trophy.moveTo(-25, 10);
    trophy.lineTo(-50, 40);
    trophy.lineTo(-25, 30);
    trophy.fillPath();

    trophy.beginPath();
    trophy.moveTo(25, 10);
    trophy.lineTo(50, 40);
    trophy.lineTo(25, 30);
    trophy.fillPath();

    // 4. Aleta Central (Visión frontal)
    trophy.fillStyle(0x2980b9);
    trophy.fillRect(-5, 10, 10, 30);

    // 5. Ventana
    trophy.fillStyle(0x2ecc71); // Vidrio verde
    trophy.fillCircle(0, -20, 15);
    trophy.lineStyle(3, 0xbdc3c7);
    trophy.strokeCircle(0, -20, 15);
    trophy.fillStyle(0xffffff, 0.6);
    trophy.fillCircle(-5, -25, 4); // Brillo

    // 6. Fuego de propulsión
    const flame = this.add.graphics();
    flame.fillStyle(0xf1c40f); // Amarillo
    flame.beginPath();
    flame.moveTo(-15, 40);
    flame.lineTo(0, 80);
    flame.lineTo(15, 40);
    flame.fillPath();
    flame.fillStyle(0xe67e22); // Naranja centro
    flame.beginPath();
    flame.moveTo(-8, 40);
    flame.lineTo(0, 70);
    flame.lineTo(8, 40);
    flame.fillPath();

    // Animación de fuego
    this.tweens.add({
      targets: flame,
      scaleY: { from: 1, to: 1.5 },
      scaleX: { from: 1, to: 0.8 },
      y: { from: 0, to: 10 },
      alpha: { from: 1, to: 0.8 },
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    const checkContainer = this.add.container(this.width / 2, this.height / 2);
    checkContainer.add([flame, trophy]); // Agregar llama y cohete
    checkContainer.setDepth(100);
    checkContainer.setScale(0);

    // Animación de aparición (Despegue)
    this.tweens.add({
      targets: checkContainer,
      scale: 1.5,
      y: { from: this.height, to: this.height / 2 }, // Sube desde abajo
      duration: 1000,
      ease: "Back.out",
    });

    // Animación de flotación
    this.tweens.add({
      targets: checkContainer,
      y: "-=20",
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // --- CONFETI ---
    const confettiParticles = this.add.particles("confetti");
    const confettiEmitter = confettiParticles.createEmitter({
      x: { min: 0, max: this.width },
      y: -10,
      speedY: { min: 100, max: 300 },
      speedX: { min: -50, max: 50 },
      rotate: { min: 0, max: 360 },
      scale: { start: 1, end: 0.5 },
      lifespan: 3000,
      quantity: 5,
      tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff],
    });
    confettiParticles.setDepth(102);

    // Siguiente nivel
    this.time.delayedCall(3000, () => {
      this.cameras.main.fade(1000, 0, 0, 0);
      this.time.delayedCall(1000, () => {
        this.scene.start("RobotsPuzzle3Scene");
      });
    });
  }

  showTutorial() {
    // Encontrar botón derecha
    const rightBtn = this.children.list.find(
      (c) => c.type === "Container" && c.getData("id") === "right",
    );
    if (!rightBtn) return;

    // Mano/Flecha indicadora (Emoji)
    this.tutorialHand = this.add
      .text(rightBtn.x - 100, rightBtn.y, "👆", {
        fontSize: "60px",
        padding: { x: 20, y: 20 },
      })
      .setOrigin(0.5)
      .setDepth(1000);

    // Animación de señalar
    this.tweens.add({
      targets: this.tutorialHand,
      x: rightBtn.x - 60,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
