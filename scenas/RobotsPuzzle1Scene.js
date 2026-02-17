class RobotsPuzzle1Scene extends Phaser.Scene {
  constructor() {
    super({ key: "RobotsPuzzle1Scene" });
  }

  preload() {
    this.load.audio("musica1", "musica1.mp3");
  }

  create() {
    console.log("RobotsPuzzle1Scene: Reiniciando desde cero - Versión Robusta");

    // Inicializar Música
    this.audioManager = new AudioManager(this, "musica1");

    // 1. Configuración Inicial
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    // Generar texturas necesarias
    this.createTextures();

    // 2. Fondo (Museo de Robots)
    this.createBackground(width, height);

    // 3. (Títulos Eliminados a petición del usuario para una experiencia puramente visual)

    // 4. Crear Zonas (Pedestales)
    this.createDropZones(width, height);

    // 5. Crear Robots (Piezas Móviles)
    this.createRobots(width, height);

    // 6. Configurar Eventos Drag & Drop
    this.input.on("dragstart", (pointer, gameObject) => {
      this.children.bringToTop(gameObject);
      gameObject.setScale(1.1);
      // Feedback visual
      gameObject.alpha = 0.8;
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on("drop", (pointer, gameObject, dropZone) => {
      if (!dropZone) {
        this.returnToOrigin(gameObject);
        return;
      }

      // Verificar si hay otro robot YA COLOCADO en esta zona
      // Nota: Ya no filtramos por "placed" porque todos inician como placed=true
      const occupantRobot = this.robotsList.find(
        (r) => r !== gameObject && Math.abs(r.x - dropZone.x) < 40, // Aumentamos margen de detección
      );

      // Si hay un ocupante, lo mandamos al origen del robot que estamos soltando (INTERCAMBIO)
      if (occupantRobot) {
        const oldOriginX = gameObject.getData("originX");
        const oldOriginY = gameObject.getData("originY");

        // Encontrar la zona correspondiente al origen antiguo para validar
        const swapTargetZone = this.children.list.find(
          (child) =>
            child.type === "Zone" && Math.abs(child.x - oldOriginX) < 40,
        );

        if (swapTargetZone) {
          const isSwapCorrect =
            occupantRobot.getData("id") === swapTargetZone.getData("era");
          // Mover el ocupante con animación
          this.placeRobotInZone(
            occupantRobot,
            swapTargetZone,
            isSwapCorrect,
            true,
          );
        }
      }

      const robotEra = gameObject.getData("era");
      const zoneEra = dropZone.getData("era");

      // Colocar el robot arrastrado (sin animación de desplazamiento, solo snap)
      const isCorrect = robotEra === zoneEra;
      this.placeRobotInZone(gameObject, dropZone, isCorrect, false);
    });

    this.input.on("dragend", (pointer, gameObject, dropped) => {
      gameObject.setScale(1);
      gameObject.alpha = 1;
      if (!dropped) {
        this.returnToOrigin(gameObject);
      }
    });
  }

  // Nueva función unificada para colocar robots
  placeRobotInZone(robot, zone, isCorrect, animateMove = false) {
    if (animateMove) {
      // Animación de traslado (para swaps)
      this.tweens.add({
        targets: robot,
        x: zone.x,
        y: zone.y,
        duration: 500,
        ease: "Cubic.out",
        onComplete: () => {
          this.finalizePlacement(robot, zone, isCorrect);
        },
      });
    } else {
      // Colocación inmediata
      robot.x = zone.x;
      robot.y = zone.y;
      this.finalizePlacement(robot, zone, isCorrect);
    }
  }

  finalizePlacement(robot, zone, isCorrect) {
    robot.setData("originX", zone.x);
    robot.setData("originY", zone.y);

    robot.setData("placed", true);
    robot.setData("isCorrectPos", isCorrect);

    // Animación de "asentamiento" (pequeño rebote)
    this.tweens.add({
      targets: robot,
      scale: { from: 1.1, to: 1 },
      duration: 200,
      ease: "Back.out",
    });

    if (isCorrect) {
      // Feedback de éxito (Partículas y Efecto Visual)
      const particles = this.add.particles("spark");
      const emitter = particles.createEmitter({
        x: zone.x,
        y: zone.y,
        speed: 100,
        scale: { start: 1, end: 0 },
        blendMode: "ADD",
        lifespan: 500,
      });
      emitter.explode(20);
      this.time.delayedCall(1000, () => particles.destroy());

      // Animación de "Correcto" (Flash verde y rebote)
      this.tweens.add({
        targets: robot,
        scale: { from: 1.3, to: 1 }, // Rebote más pronunciado
        duration: 400,
        ease: "Bounce.out",
      });

      // EFECTO VISUAL: Anillo de éxito (Reemplaza al setTint que no afecta a Graphics complejos)
      const successRing = this.add.graphics();
      successRing.lineStyle(5, 0x00ff00, 1);
      successRing.strokeCircle(0, 0, 60);
      successRing.x = zone.x;
      successRing.y = zone.y;
      successRing.setScale(0.5);

      this.tweens.add({
        targets: successRing,
        scale: 1.5,
        alpha: 0,
        duration: 800,
        onComplete: () => successRing.destroy(),
      });

      // EMOJI DE ÉXITO
      const checkMark = this.add
        .text(zone.x, zone.y - 50, "✅", { fontSize: "40px" })
        .setOrigin(0.5);
      this.tweens.add({
        targets: checkMark,
        y: zone.y - 100,
        alpha: 0,
        duration: 1000,
        onComplete: () => checkMark.destroy(),
      });

      // Reiniciar tutorial para el siguiente robot si no se ha ganado
      if (this.tutorialHand) {
        this.tweens.killTweensOf(this.tutorialHand);
        this.tutorialHand.destroy();
        this.tutorialHand = null;
      }
      // Esperar un poco antes de mostrar la siguiente ayuda
      this.time.delayedCall(1000, () => this.showTutorialHint());
    } else {
      // Feedback de error leve (vibración)
      this.tweens.add({
        targets: robot,
        x: "+=5",
        duration: 50,
        yoyo: true,
        repeat: 3,
      });
    }

    // Verificar Victoria GLOBAL
    this.checkVictoryCondition();
  }

  checkVictoryCondition() {
    const allCorrect = this.robotsList.every(
      (r) => r.getData("isCorrectPos") === true,
    );
    if (allCorrect) {
      this.time.delayedCall(500, () => this.showVictory());
    }
  }

  // --- Helpers de Creación ---

  createTextures() {
    // Textura para partículas 'spark'
    if (!this.textures.exists("spark")) {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0xffd700, 1);
      graphics.fillCircle(5, 5, 5);
      graphics.generateTexture("spark", 10, 10);
    }
  }

  createBackground(width, height) {
    const bg = this.add.graphics();

    // 1. Pared de fondo (Panelado metálico con profundidad)
    bg.fillGradientStyle(0x1a252f, 0x1a252f, 0x2c3e50, 0x2c3e50, 1);
    bg.fillRect(0, 0, width, height);

    // Patrón de paneles hexagonales sutiles
    bg.lineStyle(2, 0x34495e, 0.3);
    for (let y = 0; y < height; y += 100) {
      for (let x = 0; x < width; x += 100) {
        // Dibujar hexágonos simplificados
        bg.strokeRect(x, y, 90, 90);
        bg.fillStyle(0x000000, 0.2);
        bg.fillCircle(x + 90, y + 90, 5); // Remaches en esquinas
      }
    }

    // 2. Iluminación Ambiental (Spotlights Animados)
    const spot1 = this.add.circle(
      width * 0.2,
      height * 0.4,
      150,
      0xffffff,
      0.05,
    );
    const spot2 = this.add.circle(
      width * 0.5,
      height * 0.4,
      150,
      0xffffff,
      0.05,
    );
    const spot3 = this.add.circle(
      width * 0.8,
      height * 0.4,
      150,
      0xffffff,
      0.05,
    );

    // Animación de luces (respiración)
    this.tweens.add({
      targets: [spot1, spot2, spot3],
      alpha: 0.1,
      scale: 1.1,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Partículas de polvo flotante (Ambiente)
    if (!this.textures.exists("dust")) {
      const d = this.make.graphics({ x: 0, y: 0, add: false });
      d.fillStyle(0xffffff);
      d.fillCircle(2, 2, 2);
      d.generateTexture("dust", 4, 4);
    }
    const dustParticles = this.add.particles("dust");
    dustParticles.createEmitter({
      x: { min: 0, max: width },
      y: height,
      speedY: { min: -10, max: -30 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 5000,
      frequency: 100,
    });

    // 3. Suelo (Plataforma reflectante)
    const floorY = height - 120;
    bg.fillGradientStyle(0x7f8c8d, 0x95a5a6, 0x2c3e50, 0x34495e, 1);
    bg.fillRect(0, floorY, width, 120);

    // Borde del suelo (Neon según la zona)
    bg.fillGradientStyle(0x8b4513, 0xf1c40f, 0x00ffff, 0x00ffff, 1); // Degradado tricolor
    bg.fillRect(0, floorY, width, 5);

    // Reflejo en el suelo (Líneas de perspectiva)
    bg.lineStyle(4, 0xffffff, 0.1);
    for (let x = 0; x <= width; x += 200) {
      bg.lineBetween(x, floorY, x + (x - width / 2) * 0.5, height);
    }
  }

  createDropZones(width, height) {
    const zonesData = [
      {
        id: "antiguo",
        label: "1920",
        x: width * 0.2,
        color: 0x8b4513,
        accent: 0xd4af37,
      },
      {
        id: "moderno",
        label: "2025",
        x: width * 0.5,
        color: 0x2c3e50,
        accent: 0xf1c40f,
      },
      {
        id: "futuro",
        label: "3000",
        x: width * 0.8,
        color: 0xffffff,
        accent: 0x00ffff,
      },
    ];

    zonesData.forEach((data) => {
      const zoneX = data.x;
      const zoneY = height - 160;

      // --- PEDESTAL 3D REALISTA ---
      const graphics = this.add.graphics();

      // 1. Base del Cilindro (Sombra)
      graphics.fillStyle(0x000000, 0.5);
      graphics.fillEllipse(0, 100, 120, 40);

      // 2. Columna (Cuerpo del pedestal)
      if (data.id === "antiguo") {
        // Madera y Latón
        graphics.fillGradientStyle(0x5a3a22, 0x8b4513, 0x5a3a22, 0x8b4513, 1);
        graphics.fillRect(-50, 0, 100, 100);
        // Decoración Art Deco
        graphics.lineStyle(4, data.accent);
        graphics.strokeRect(-40, 10, 80, 80);
        graphics.lineBetween(-40, 50, 40, 50);
      } else if (data.id === "moderno") {
        // Metal Industrial y Peligro
        graphics.fillGradientStyle(0x34495e, 0x2c3e50, 0x34495e, 0x2c3e50, 1);
        graphics.fillRect(-50, 0, 100, 100);
        // Placa de metal remachada
        graphics.fillStyle(0x95a5a6);
        graphics.fillRoundedRect(-40, 20, 80, 60, 5);
        graphics.fillStyle(0x000000); // Remaches
        graphics.fillCircle(-30, 30, 3);
        graphics.fillCircle(30, 30, 3);
        graphics.fillCircle(-30, 70, 3);
        graphics.fillCircle(30, 70, 3);
      } else if (data.id === "futuro") {
        // Columna Flotante / Holográfica
        graphics.fillGradientStyle(0x000000, 0x111111, 0x00ffff, 0x000000, 0.8);
        graphics.beginPath();
        graphics.moveTo(-40, 100);
        graphics.lineTo(40, 100);
        graphics.lineTo(60, 0);
        graphics.lineTo(-60, 0);
        graphics.fillPath();
        // Líneas de neón
        graphics.lineStyle(2, 0x00ffff);
        graphics.strokePath();
      }

      // 3. Plataforma Superior (Superficie donde cae el robot)
      graphics.fillGradientStyle(
        data.accent,
        data.accent,
        0xffffff,
        0xffffff,
        1,
      );
      graphics.fillEllipse(0, 0, 120, 30); // Borde brillante
      graphics.fillStyle(data.color);
      graphics.fillEllipse(0, -2, 110, 25); // Superficie interior

      // Añadir gráfico al contenedor
      const pedestalContainer = this.add.container(zoneX, zoneY);
      pedestalContainer.add(graphics);

      // RESTAURADO: Etiquetas de Año (Necesarias para resolver el puzzle)
      const textStyle = {
        fontSize: "36px",
        fontFamily:
          data.id === "antiguo"
            ? "Courier New"
            : data.id === "futuro"
              ? "Orbitron"
              : "Arial Black",
        fill: data.id === "futuro" ? "#00ffff" : "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      };

      // Solo añadir sombra si es necesario
      if (data.id === "futuro") {
        textStyle.shadow = { blur: 10, color: "#00ffff", fill: true };
      }

      const labelText = this.add
        .text(0, 130, data.label, textStyle)
        .setOrigin(0.5);
      pedestalContainer.add(labelText);

      // 2. Zona Interactiva Invisible (Ajustada a la nueva altura)
      const zone = this.add
        .zone(zoneX, zoneY - 50, 140, 200)
        .setRectangleDropZone(140, 200);
      zone.setData("era", data.id);
      zone.setData("centerX", zoneX); // Guardar centro para la mano guía
      zone.setData("centerY", zoneY - 50);
    });
  }

  // --- Sistema de Tutorial (Mano Guía) ---

  showTutorialHint() {
    // Verificar si la escena sigue activa y el sistema existe
    if (!this.sys || !this.sys.isActive()) return;

    // Si ya hay una mano o el usuario está interactuando, no hacer nada
    if (this.tutorialHand || this.isDragging) return;

    // Buscar el primer robot que NO esté en su posición correcta
    if (!this.robotsList) return;
    const activeRobot = this.robotsList.find((r) => !r.getData("isCorrectPos"));
    if (!activeRobot) return;

    // Buscar su zona correcta
    const targetZoneId = activeRobot.getData("id");
    // Necesitamos encontrar la zona correcta.
    if (!this.children || !this.children.list) return;

    const zones = this.children.list.filter(
      (child) => child.type === "Zone" && child.getData("era") === targetZoneId,
    );
    // Verificación defensiva extra para evitar errores de 'length' en null
    if (!zones || !Array.isArray(zones) || zones.length === 0) return;
    const targetZone = zones[0];

    // Crear la mano si no existe (EMOJI)
    this.tutorialHand = this.add
      .text(0, 0, "👆", {
        fontSize: "60px",
        padding: { x: 20, y: 20 }, // Padding para evitar recorte del emoji
      })
      .setOrigin(0.5);
    this.tutorialHand.setDepth(1000); // Siempre visible encima de todo

    // Posición inicial (debajo del robot para apuntar hacia él)
    this.tutorialHand.x = activeRobot.x;
    this.tutorialHand.y = activeRobot.y + 60;
    this.tutorialHand.alpha = 0;

    // Secuencia de animación: Aparecer -> Mover -> Presionar -> Arrastrar -> Soltar -> Desaparecer
    this.tweens.add({
      targets: this.tutorialHand,
      alpha: 1,
      y: activeRobot.y + 40, // Subir un poco para "tocar"
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        // 1. Simular Click (Escala abajo)
        this.tweens.add({
          targets: this.tutorialHand,
          scale: 0.8,
          duration: 300,
          yoyo: true,
          onComplete: () => {
            // 2. Arrastrar a la zona
            this.tweens.add({
              targets: this.tutorialHand,
              x: targetZone.getData("centerX"),
              y: targetZone.getData("centerY") + 40, // Ajuste para que el dedo apunte al centro
              duration: 1500,
              ease: "Power2",
              onComplete: () => {
                // 3. Soltar (Escala arriba) y Desaparecer
                this.tweens.add({
                  targets: this.tutorialHand,
                  scale: 1.2,
                  alpha: 0,
                  duration: 500,
                  delay: 200,
                  onComplete: () => {
                    // Reiniciar el ciclo si aún no se ha interactuado
                    if (!this.isDragging) {
                      this.tutorialHand.destroy();
                      this.tutorialHand = null;
                      this.time.delayedCall(1000, () =>
                        this.showTutorialHint(),
                      );
                    }
                  },
                });
              },
            });
          },
        });
      },
    });
  }

  // Helper de mano eliminado (ahora usamos emoji)

  handleDragStart(pointer, gameObject) {
    this.isDragging = true;
    // Detener y destruir el tutorial inmediatamente
    if (this.tutorialHand) {
      this.tweens.killTweensOf(this.tutorialHand);
      this.tutorialHand.destroy();
      this.tutorialHand = null;
    }
    // ... resto del código existente
    this.children.bringToTop(gameObject);
    gameObject.setScale(1.1); // Efecto visual al agarrar
  }

  handleDragEnd(pointer, gameObject) {
    this.isDragging = false;
    gameObject.setScale(1); // Restaurar escala

    // Si no se soltó en una zona válida, volver al inicio
    if (!gameObject.getData("dropped")) {
      this.tweens.add({
        targets: gameObject,
        x: gameObject.getData("originX"),
        y: gameObject.getData("originY"),
        duration: 500,
        ease: "Back.out",
        onComplete: () => {
          // Si el usuario soltó mal, reactivar tutorial tras un momento
          this.time.delayedCall(2000, () => this.showTutorialHint());
        },
      });
    }
  }

  createRobots(width, height) {
    this.robotsList = []; // Lista para rastrear robots activos

    // Posiciones X base (donde están los pedestales)
    const baseX = [width * 0.2, width * 0.5, width * 0.8];

    // Generar posiciones desordenadas (Derangement) para asegurar que NINGUNO esté en su sitio
    // Opción A: Desplazar a la derecha [1, 2, 0]
    // Opción B: Desplazar a la izquierda [2, 0, 1]
    const shift = Math.random() > 0.5 ? 1 : 2;
    const shuffledX = [
      baseX[(0 + shift) % 3],
      baseX[(1 + shift) % 3],
      baseX[(2 + shift) % 3],
    ];

    const robotsConfig = [
      { id: "antiguo", x: shuffledX[0] },
      { id: "moderno", x: shuffledX[1] },
      { id: "futuro", x: shuffledX[2] },
    ];

    robotsConfig.forEach((data) => {
      // Usar la posición desordenada
      const robotContainer = this.add.container(data.x, height * 0.45);
      robotContainer.setSize(80, 80);
      robotContainer.setData("id", data.id);
      robotContainer.setData("era", data.id); // IMPORTANTE: Clave usada para validación
      robotContainer.setData("originX", data.x);
      robotContainer.setData("originY", height * 0.45);
      robotContainer.setData("placed", true); // Inicializar como colocado (están en pedestales)
      robotContainer.setData("isCorrectPos", false); // Asumimos incorrecto por el desorden

      // Gráfico del Robot
      const graphics = this.add.graphics();
      this.drawRobot(graphics, data.id);
      robotContainer.add(graphics);

      // Interactividad
      robotContainer.setInteractive();
      this.input.setDraggable(robotContainer);
      robotContainer.input.dropZone = false; // Asegurar que no actúen como zonas de drop

      // Añadir efecto de flotación
      this.tweens.add({
        targets: robotContainer,
        y: height * 0.45 + 10,
        duration: 1500 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.robotsList.push(robotContainer);
    });

    // Iniciar tutorial después de un breve momento
    this.time.delayedCall(1000, () => this.showTutorialHint());
  }

  // --- Lógica del Juego ---

  handleCorrectDrop(robot, zone) {
    // Posicionar en el pedestal
    robot.x = zone.x;
    robot.y = zone.y; // Ajuste visual

    // Desactivar interacción
    robot.input.enabled = false;
    robot.setData("placed", true);

    // Animación de éxito
    this.tweens.add({
      targets: robot,
      scale: { from: 1.2, to: 1 },
      duration: 300,
      ease: "Back.out",
    });

    // Partículas (Compatible Phaser 3.55)
    const particles = this.add.particles("spark");
    const emitter = particles.createEmitter({
      x: zone.x,
      y: zone.y,
      speed: 100,
      scale: { start: 1, end: 0 },
      blendMode: "ADD",
      lifespan: 500,
    });
    emitter.explode(20);

    // Limpieza automática de partículas
    this.time.delayedCall(1000, () => {
      particles.destroy();
    });

    // Verificar Victoria
    const allPlaced = this.robotsList.every((r) => r.getData("placed"));
    if (allPlaced) {
      this.time.delayedCall(500, () => this.showVictory());
    }
  }

  returnToOrigin(robot) {
    this.tweens.add({
      targets: robot,
      x: robot.getData("originX"),
      y: robot.getData("originY"),
      duration: 500,
      ease: "Cubic.out",
    });
  }

  showVictory() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    // Fondo oscuro
    this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setDepth(100);

    // Texto
    const victoryText = this.add
      .text(width / 2, height / 2 - 50, "¡EXCELENTE!", {
        fontSize: "60px",
        fontFamily: "Arial Black",
        fill: "#2ecc71",
        stroke: "#ffffff",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setScale(0);

    this.tweens.add({
      targets: victoryText,
      scale: 1,
      duration: 500,
      ease: "Back.out",
    });

    // --- CONFETI ---
    if (!this.textures.exists("confetti")) {
      const c = this.make.graphics({ x: 0, y: 0, add: false });
      c.fillStyle(0xffffff);
      c.fillRect(0, 0, 10, 10);
      c.generateTexture("confetti", 10, 10);
    }
    const confettiParticles = this.add.particles("confetti");
    const confettiEmitter = confettiParticles.createEmitter({
      x: { min: 0, max: width },
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

    // Transición Automática
    this.time.delayedCall(4000, () => {
      // Efecto de salida
      this.cameras.main.fade(1000, 0, 0, 0);
      this.time.delayedCall(1000, () => {
        this.scene.start("RobotsPuzzle2Scene");
      });
    });
  }

  // --- Dibujado de Robots (Hyper-Realista con Gráficos Procedurales) ---

  drawRobot(g, type) {
    g.clear();

    if (type === "antiguo") {
      // === 1920: STEAMPUNK REALISTA ===
      // Materiales: Cobre, Latón, Cuero, Vidrio

      // 1. Rueda (Uniciclo) con neumático y radios
      // Neumático (Caucho oscuro con brillo)
      g.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x000000, 0x000000, 1);
      g.fillCircle(0, 60, 25);
      g.lineStyle(2, 0x333333);
      g.strokeCircle(0, 60, 25);
      // Radios (Latón)
      g.lineStyle(2, 0xb8860b);
      g.lineBetween(0, 60, 0, 35);
      g.lineBetween(0, 60, 0, 85);
      g.lineBetween(0, 60, -25, 60);
      g.lineBetween(0, 60, 25, 60);

      // 2. Piernas/Soportes (Pistones hidráulicos de latón)
      g.fillGradientStyle(0xcd853f, 0x8b4513, 0xcd853f, 0x8b4513, 1);
      g.fillRect(-25, 10, 10, 50);
      g.fillRect(15, 10, 10, 50);
      // Detalles de remaches
      g.fillStyle(0xffd700);
      g.fillCircle(-20, 15, 2);
      g.fillCircle(20, 15, 2);
      g.fillCircle(-20, 55, 2);
      g.fillCircle(20, 55, 2);

      // 3. Cuerpo (Esfera de Cobre con volumen 3D)
      // Base oscura
      g.fillStyle(0x8b4500);
      g.fillCircle(0, -10, 45);
      // Degradado simulado (Luz arriba-izq)
      g.fillStyle(0xd2691e);
      g.fillCircle(-10, -20, 35);
      g.fillStyle(0xffa07a);
      g.fillCircle(-20, -30, 15); // Brillo especular

      // 4. Panel de pecho (Medidor de presión)
      g.fillStyle(0xffffff);
      g.fillCircle(0, -10, 15); // Vidrio
      g.lineStyle(2, 0x8b4513);
      g.strokeCircle(0, -10, 15);
      g.lineStyle(2, 0xff0000);
      g.lineBetween(0, -10, 10, -20); // Aguja
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(-5, -15, 5); // Reflejo vidrio

      // 5. Cabeza (Cilindro de Latón)
      g.fillGradientStyle(0xdaa520, 0xb8860b, 0xdaa520, 0xb8860b, 1);
      g.fillRoundedRect(-25, -70, 50, 40, 5);
      // Rejilla de voz
      g.lineStyle(1, 0x000000, 0.5);
      g.lineBetween(-10, -40, 10, -40);
      g.lineBetween(-10, -35, 10, -35);

      // 6. Ojos (Goggles de cuero y vidrio)
      g.fillStyle(0x8b4513); // Cuero
      g.fillCircle(-15, -60, 12);
      g.fillCircle(15, -60, 12);
      g.fillStyle(0x00ffff); // Vidrio azulado
      g.fillCircle(-15, -60, 8);
      g.fillCircle(15, -60, 8);
      g.fillStyle(0xffffff, 0.8); // Brillo
      g.fillCircle(-18, -63, 3);
      g.fillCircle(12, -63, 3);

      // 7. Sombrero de Copa (Elegancia 1920)
      g.fillStyle(0x1a1a1a);
      g.fillRect(-35, -75, 70, 5); // Ala
      g.fillGradientStyle(0x333333, 0x000000, 0x333333, 0x000000, 1);
      g.fillRect(-25, -110, 50, 35); // Copa
      g.fillStyle(0xff0000);
      g.fillRect(-25, -80, 50, 5); // Cinta roja
    } else if (type === "moderno") {
      // === 2025: INDUSTRIAL ROBUSTO ===
      // Materiales: Acero cepillado, Caucho, Pintura de seguridad, LEDs

      // 1. Orugas (Tanque)
      g.fillGradientStyle(0x2c3e50, 0x000000, 0x2c3e50, 0x000000, 1);
      g.fillRoundedRect(-45, 50, 35, 25, 5);
      g.fillRoundedRect(10, 50, 35, 25, 5);
      // Ruedas internas
      g.fillStyle(0x7f8c8d);
      g.fillCircle(-28, 62, 8);
      g.fillCircle(28, 62, 8);

      // 2. Cuerpo (Caja blindada con textura de acero)
      g.fillGradientStyle(0xbdc3c7, 0x7f8c8d, 0xbdc3c7, 0x7f8c8d, 1);
      g.fillRect(-40, -40, 80, 80);
      // Bordes reforzados
      g.lineStyle(3, 0x555555);
      g.strokeRect(-40, -40, 80, 80);

      // 3. Franjas de Seguridad (Amarillo/Negro)
      g.fillStyle(0xf1c40f);
      g.fillRect(-40, -30, 80, 15);
      g.fillStyle(0x000000);
      for (let i = -40; i < 40; i += 20) {
        g.beginPath();
        g.moveTo(i, -30);
        g.lineTo(i + 10, -30);
        g.lineTo(i - 5, -15);
        g.lineTo(i - 15, -15);
        g.fillPath();
      }

      // 4. Pantalla CRT (Pecho)
      g.fillStyle(0x000000);
      g.fillRoundedRect(-25, -5, 50, 30, 2);
      // Texto terminal verde
      g.fillStyle(0x00ff00);
      g.fillRect(-20, 5, 20, 2);
      g.fillRect(-20, 12, 30, 2);

      // 5. Cabeza (Sensor Lidar/Cámara)
      g.fillGradientStyle(0x34495e, 0x2c3e50, 0x34495e, 0x2c3e50, 1);
      g.fillRect(-30, -70, 60, 30);
      // Lente de cámara realista
      g.fillStyle(0x000000);
      g.fillCircle(0, -55, 12);
      g.fillStyle(0xe74c3c);
      g.fillCircle(0, -55, 8); // Lente rojo (HAL 9000 vibe)
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(-3, -58, 3); // Reflejo

      // 6. Brazos (Pinzas hidráulicas)
      g.lineStyle(6, 0xf39c12); // Amarillo industrial
      g.lineBetween(-40, -20, -70, 10);
      g.lineBetween(40, -20, 70, 10);
      // Pinzas metálicas
      g.lineStyle(3, 0x95a5a6);
      g.strokeRect(-80, 5, 15, 15);
      g.strokeRect(65, 5, 15, 15);
    } else if (type === "futuro") {
      // === 3000: ETEREO SCI-FI ===
      // Materiales: Polímero blanco, Luz sólida, Campos de energía

      // 1. Aura de Energía (Glow)
      g.fillStyle(0x00ffff, 0.1);
      g.fillCircle(0, 0, 70);
      g.fillStyle(0x00ffff, 0.2);
      g.fillCircle(0, 0, 60);

      // 2. Propulsor Anti-Gravedad
      g.fillStyle(0xffffff);
      g.fillEllipse(0, 60, 40, 15);
      g.fillStyle(0x00ffff); // Luz motor
      g.fillEllipse(0, 65, 25, 8);

      // 3. Cuerpo (Huevo flotante de cerámica blanca)
      // Sombreado suave para volumen esférico
      g.fillGradientStyle(0xffffff, 0xdcdcdc, 0xffffff, 0xdcdcdc, 1);
      g.fillRoundedRect(-35, -50, 70, 90, 35);

      // 4. Núcleo de Energía (Corazón)
      g.fillStyle(0x000000);
      g.fillCircle(0, 0, 15);
      g.fillStyle(0x00ffff);
      g.fillCircle(0, 0, 10);
      g.fillStyle(0xffffff);
      g.fillCircle(0, 0, 5); // Centro brillante

      // 5. Cabeza (Integrada, Visor Holográfico)
      g.fillStyle(0x111111);
      g.fillRoundedRect(-25, -40, 50, 20, 10);
      // Ojos digitales (Puntos flotantes)
      g.fillStyle(0x00ffff);
      g.fillCircle(-10, -30, 2);
      g.fillCircle(10, -30, 2);
      g.lineStyle(1, 0x00ffff, 0.5);
      g.lineBetween(-10, -30, 10, -30);

      // 6. Brazos (Levitación Magnética - Esferas separadas)
      g.fillStyle(0xffffff);
      g.fillCircle(-50, -10, 12);
      g.fillCircle(50, -10, 12); // Hombros
      g.fillCircle(-60, 20, 8);
      g.fillCircle(60, 20, 8); // Manos
      // Rayos de conexión
      g.lineStyle(1, 0x00ffff, 0.3);
      g.lineBetween(-35, -10, -50, -10);
      g.lineBetween(-50, -10, -60, 20);
      g.lineBetween(35, -10, 50, -10);
      g.lineBetween(50, -10, 60, 20);
    }
  }
}
