class RobotsPuzzle3Scene extends Phaser.Scene {
  constructor() {
    super({ key: "RobotsPuzzle3Scene" });
    this.score = 0;
    this.totalItems = 8; // Total de objetos a clasificar
  }

  preload() {
    this.load.audio("musica1", "musica1.mp3");
  }

  create() {
    // Inicializar Música
    this.audioManager = new AudioManager(this, "musica1");

    this.width = this.sys.game.config.width;
    this.height = this.sys.game.config.height;
    this.score = 0;

    // Generar texturas necesarias si no existen
    this.createFallbackTextures();

    // Inicializar la bandera del tutorial si no existe
    if (this.sys.game.tutorialPuzzle3Completed === undefined) {
      this.sys.game.tutorialPuzzle3Completed = false;
    }

    // 1. Fondo Dividido (Pasado vs Futuro)
    this.createBackground();

    // 3. Zonas de Clasificación (Cajas)
    this.createDropZones();

    // 4. Generar Objetos
    this.createItems();

    // 5. Botón Salir
    this.createBackButton();

    // Iniciar sistema de tutorial (ayuda continua)
    this.startHintLoop();

    // Gestionar interacciones con el tutorial
    this.input.on("dragstart", (pointer, gameObject) => {
      gameObject.setData("isDragging", true);
      // Si estamos arrastrando el objeto que tiene la manita, ocultar manita inmediatamente
      if (
        this.tutorialHand &&
        this.tutorialHand.getData("targetItem") === gameObject
      ) {
        this.hideHint();
        // Reiniciar loop pronto para sugerir otro item si es posible
        this.time.delayedCall(500, () => this.startHintLoop());
      }
    });

    this.input.on("dragend", (pointer, gameObject) => {
      gameObject.setData("isDragging", false);
    });

    // Texto de puntuación eliminado a petición
  }

  createFallbackTextures() {
    // 1. Mano de tutorial (Ya no se usa textura, se usa Emoji)
    // if (!this.textures.exists("tutorialHand")) { ... } removed

    // 2. Chispa (Spark)
    if (!this.textures.exists("spark")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffff00);
      g.fillCircle(5, 5, 5);
      g.generateTexture("spark", 10, 10);
    }

    // 3. Destello (Flare) - si no existe
    if (!this.textures.exists("flare")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff);
      g.fillCircle(4, 4, 4);
      g.generateTexture("flare", 8, 8);
    }
  }

  startHintLoop() {
    this.showHint();
  }

  hideHint() {
    if (this.tutorialHand) {
      this.tweens.killTweensOf(this.tutorialHand);
      this.tutorialHand.destroy();
      this.tutorialHand = null;
    }
  }

  showHint() {
    // Si ya hay una mano o ya ganamos, no hacer nada
    if (this.tutorialHand || this.score >= this.totalItems) return;

    // Buscar items activos que NO se estén arrastrando
    // Con el nuevo sistema spawnNextItem, debería haber solo UNO o NINGUNO visible
    const items = this.children.list.filter(
      (child) =>
        child.getData("type") &&
        child.input &&
        child.input.enabled &&
        child.visible && // Asegurar que sea visible
        child.alpha > 0 && // Asegurar que no esté desvaneciéndose
        !child.getData("isDragging"),
    );

    if (items.length === 0) {
      // No hay items activos, esperar
      return;
    }

    // Tomar el primer item disponible (debería ser el único)
    const item = items[0];
    const itemType = item.getData("type");

    // Encontrar la zona correcta basándose estrictamente en el tipo
    const zone = this.dropZones.find((z) => z.getData("type") === itemType);

    if (!item || !zone) {
      console.warn(
        "RobotsPuzzle3Scene: No se pudo emparejar item con zona para el tutorial",
        item,
        zone,
      );
      return;
    }

    // Crear mano (Emoji) - Posicionada debajo del objeto para no taparlo
    this.tutorialHand = this.add
      .text(item.x, item.y + 60, "👆", {
        fontSize: "50px",
        padding: { x: 20, y: 20 },
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setAlpha(0);

    // Guardar referencia al item objetivo para validaciones
    this.tutorialHand.setData("targetItem", item);

    // Animación (Nested Tweens para compatibilidad)
    this.tweens.add({
      targets: this.tutorialHand,
      alpha: 1,
      y: item.y + 50, // Pequeño movimiento hacia arriba al aparecer
      duration: 300,
      ease: "Power1",
      onComplete: () => {
        if (!this.tutorialHand) return;

        // Verificar si el item sigue existiendo y es válido antes de continuar
        if (!item.active || !item.visible) {
          this.hideHint();
          return;
        }

        this.tutorialHand.x = item.x;
        this.tutorialHand.y = item.y + 50;

        // Simular pulsación
        this.tweens.add({
          targets: this.tutorialHand,
          scale: 0.8,
          duration: 200,
          yoyo: true,
          onComplete: () => {
            if (!this.tutorialHand) return;

            // Doble verificación
            if (!item.active || !item.visible) {
              this.hideHint();
              return;
            }

            // Mover hacia la zona
            this.tweens.add({
              targets: this.tutorialHand,
              x: zone.x,
              y: zone.y + 50, // Apuntar al centro de la zona (desde abajo)
              duration: 1500,
              ease: "Sine.easeInOut",
              onComplete: () => {
                if (!this.tutorialHand) return;
                this.tweens.add({
                  targets: this.tutorialHand,
                  alpha: 0,
                  duration: 300,
                  delay: 200,
                  ease: "Power1",
                  onComplete: () => {
                    this.hideHint();
                    // Reiniciar el loop solo si el item sigue ahí
                    if (
                      item.active &&
                      item.visible &&
                      !item.getData("isDragging")
                    ) {
                      this.time.delayedCall(100, () => this.startHintLoop());
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

  createBackground() {
    this.bgGroup = this.add.group();

    // --- LADO IZQUIERDO: PASADO (Steampunk/Madera) ---
    const bgLeft = this.add.graphics();
    bgLeft.fillGradientStyle(0x3e2723, 0x4e342e, 0x5d4037, 0x3e2723, 1);
    bgLeft.fillRect(0, 0, this.width / 2, this.height);
    this.bgGroup.add(bgLeft);

    // Decoración: Engranajes giratorios de fondo
    for (let i = 0; i < 6; i++) {
      const x = Phaser.Math.Between(50, this.width / 2 - 50);
      const y = Phaser.Math.Between(50, this.height - 50);
      const radius = Phaser.Math.Between(30, 80);
      const color = 0x8d6e63;

      const gear = this.add.graphics({ x: x, y: y });
      gear.fillStyle(color, 0.3); // Semitransparente

      // Dibujar engranaje simple
      const teeth = 8;
      const innerRadius = radius * 0.8;
      const outerRadius = radius;

      gear.beginPath();
      for (let t = 0; t < teeth * 2; t++) {
        const angle = (t / (teeth * 2)) * Math.PI * 2;
        const r = t % 2 === 0 ? outerRadius : innerRadius;
        gear.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      gear.closePath();
      gear.fillPath();

      // Eje central
      gear.fillStyle(0x3e2723, 0.5);
      gear.fillCircle(0, 0, radius * 0.3);

      this.bgGroup.add(gear);

      // Animación rotación infinita
      this.tweens.add({
        targets: gear,
        angle: 360 * (i % 2 === 0 ? 1 : -1), // Alternar dirección
        duration: 10000 + Math.random() * 5000,
        repeat: -1,
        ease: "Linear",
      });
    }

    // Partículas de polvo (Dust) en el lado antiguo
    if (!this.textures.exists("dust")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(2, 2, 2);
      g.generateTexture("dust", 4, 4);
    }
    const dustParticles = this.add.particles("dust");
    const dustEmitter = dustParticles.createEmitter({
      x: { min: 0, max: this.width / 2 },
      y: this.height,
      speedY: { min: -10, max: -30 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 6000,
      frequency: 200,
    });

    // --- LADO DERECHO: FUTURO (Cyberpunk/Neón) ---
    const bgRight = this.add.graphics();
    bgRight.fillGradientStyle(0x000428, 0x004e92, 0x000428, 0x004e92, 1);
    bgRight.fillRect(this.width / 2, 0, this.width / 2, this.height);
    this.bgGroup.add(bgRight);

    // Decoración: Grid en movimiento (Perspectiva simple)
    const gridContainer = this.add.container(
      this.width * 0.75,
      this.height / 2,
    );
    const grid = this.add.graphics();
    grid.lineStyle(2, 0x00ffff, 0.2);

    // Dibujar grid estático que se moverá
    const gridSize = 50;
    const gridWidth = this.width / 2;
    const gridHeight = this.height;

    // Líneas verticales
    for (let x = -gridWidth / 2; x <= gridWidth / 2; x += gridSize) {
      grid.moveTo(x, -gridHeight / 2);
      grid.lineTo(x, gridHeight / 2);
    }
    // Líneas horizontales
    for (let y = -gridHeight / 2; y <= gridHeight / 2; y += gridSize) {
      grid.moveTo(-gridWidth / 2, y);
      grid.lineTo(gridWidth / 2, y);
    }
    grid.strokePath();
    gridContainer.add(grid);
    this.bgGroup.add(gridContainer);

    // Animación del grid (Zoom suave pulsante)
    this.tweens.add({
      targets: gridContainer,
      scale: { from: 1, to: 1.1 },
      alpha: { from: 0.5, to: 0.8 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Decoración: Lluvia Digital (Bits cayendo)
    if (!this.textures.exists("bit")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x00ff00);
      g.fillRect(0, 0, 4, 12);
      g.generateTexture("bit", 4, 12);
    }

    const bitParticles = this.add.particles("bit");
    const bitEmitter = bitParticles.createEmitter({
      x: { min: this.width / 2, max: this.width },
      y: -20,
      speedY: { min: 100, max: 200 },
      scale: { start: 1, end: 0.5 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 4000,
      frequency: 100,
      blendMode: "ADD",
    });

    // --- LÍNEA DIVISORIA (Rayo de energía) ---
    const divider = this.add.graphics();
    this.bgGroup.add(divider);

    // Animación de la línea divisoria (Vibración eléctrica)
    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (!this.scene.isActive()) return; // Evitar errores si se cambia de escena

        divider.clear();

        // Núcleo blanco brillante
        divider.lineStyle(4, 0xffffff, 1);
        divider.beginPath();
        divider.moveTo(this.width / 2, 0);

        let currentY = 0;
        while (currentY < this.height) {
          currentY += Phaser.Math.Between(20, 50);
          const offset = Phaser.Math.Between(-3, 3); // Pequeña vibración
          divider.lineTo(this.width / 2 + offset, currentY);
        }
        divider.strokePath();

        // Resplandor Azul/Cyan
        divider.lineStyle(10, 0x00ffff, 0.3);
        divider.strokePath();
      },
    });
  }

  createDropZones() {
    // --- ZONA ANTIGUA ---
    const oldZoneX = this.width * 0.25;
    const oldZoneY = this.height * 0.6;

    // Gráfico de Caja de Madera más realista
    const oldBox = this.add.container(oldZoneX, oldZoneY);
    const gOld = this.add.graphics();

    const woodColorLight = 0x8d6e63; // Color madera claro
    const woodColorDark = 0x5d4037; // Color madera oscuro
    const woodColorMedium = 0x795548; // Color madera medio

    // Fondo de la caja con gradiente para profundidad
    gOld.fillGradientStyle(
      woodColorDark,
      woodColorMedium,
      woodColorMedium,
      woodColorDark,
      1,
    );
    gOld.fillRect(-100, -80, 200, 160);

    // Bordes de la caja (simulando tablas)
    gOld.lineStyle(6, woodColorLight, 1); // Borde exterior más grueso
    gOld.strokeRect(-100, -80, 200, 160);

    // Detalles de las tablas internas y vetas de madera
    gOld.lineStyle(2, woodColorDark, 1);
    gOld.lineBetween(-100, -30, 100, -30);
    gOld.lineBetween(-100, 30, 100, 30);
    gOld.lineBetween(0, -80, 0, 80); // Cruzado

    // Vetass de madera sutiles
    gOld.lineStyle(1, woodColorMedium, 0.7);
    gOld.lineBetween(-90, -60, 90, -55);
    gOld.lineBetween(-80, -40, 80, -38);
    gOld.lineBetween(-95, 10, 95, 12);
    gOld.lineBetween(-70, 50, 70, 53);

    // Clavos o remaches (pequeños círculos oscuros con brillo)
    gOld.lineStyle(1, 0x5d4037, 1); // Borde para el remache
    gOld.fillStyle(0x3e2723);
    gOld.fillCircle(-90, -70, 3);
    gOld.strokeCircle(-90, -70, 3);
    gOld.fillCircle(90, -70, 3);
    gOld.strokeCircle(90, -70, 3);
    gOld.fillCircle(-90, 70, 3);
    gOld.strokeCircle(-90, 70, 3);
    gOld.fillCircle(90, 70, 3);
    gOld.strokeCircle(90, 70, 3);

    // Brillo en los remaches
    gOld.fillStyle(0x8d6e63, 0.8);
    gOld.fillCircle(-91, -71, 1);
    gOld.fillCircle(89, -71, 1);
    gOld.fillCircle(-91, 69, 1);
    gOld.fillCircle(89, 69, 1);

    // Etiqueta
    const oldText = this.add
      .text(0, 0, "ANTIGUO", {
        fontFamily: "Courier New",
        fontSize: "32px",
        fontWeight: "bold",
        fill: "#d7ccc8",
        stroke: "#3e2723", // Sombra para el texto
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    oldBox.add([gOld, oldText]);

    // Zona interactiva
    const oldZone = this.add
      .zone(oldZoneX, oldZoneY, 200, 200)
      .setRectangleDropZone(200, 200);
    oldZone.setData("type", "old");

    // Animación suave
    this.tweens.add({
      targets: oldBox,
      angle: 2,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // --- ZONA MODERNA ---
    const newZoneX = this.width * 0.75;
    const newZoneY = this.height * 0.6;

    // Gráfico de Contenedor Futuista
    const newBox = this.add.container(newZoneX, newZoneY);
    const gNew = this.add.graphics();

    // Colores para el gradiente holográfico
    const modernColorDark = 0x000033; // Azul muy oscuro
    const modernColorMedium = 0x000066; // Azul oscuro
    const modernColorLight = 0x0033ff; // Azul brillante
    const modernColorAccent = 0x33ccff; // Azul cian

    // Interior caja (Holográfico con gradiente más complejo)
    gNew.fillGradientStyle(
      modernColorDark,
      modernColorMedium,
      modernColorLight,
      modernColorAccent,
      0.8,
    );
    gNew.fillRect(-100, -80, 200, 160);

    // Bordes Neón mejorados
    gNew.lineStyle(6, 0x00ffff, 1); // Borde exterior más grueso y brillante
    gNew.strokeRoundedRect(-100, -80, 200, 160, 15); // Bordes más redondeados

    // Detalles de líneas internas (simulando circuitos o rejilla energética)
    gNew.lineStyle(1, 0x00ffff, 0.4); // Líneas más finas y semitransparentes
    for (let i = -90; i <= 90; i += 20) {
      gNew.lineBetween(-90, i, 90, i); // Líneas horizontales
      gNew.lineBetween(i, -70, i, 70); // Líneas verticales
    }

    // Pequeños detalles luminosos en las esquinas
    gNew.fillStyle(0x00ffff, 0.7);
    gNew.fillCircle(-95, -75, 3);
    gNew.fillCircle(95, -75, 3);
    gNew.fillCircle(-95, 75, 3);
    gNew.fillCircle(95, 75, 3);

    // Etiqueta
    const newText = this.add
      .text(0, 0, "MODERNO", {
        fontFamily: "Orbitron", // Fuente más futurista
        fontSize: "36px",
        fontWeight: "bold",
        fill: "#00ffff",
        stroke: "#000000", // Sombra para el texto
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    newBox.add([gNew, newText]);

    // Zona interactiva
    const newZone = this.add
      .zone(newZoneX, newZoneY, 200, 200)
      .setRectangleDropZone(200, 200);
    newZone.setData("type", "new");

    // Animación flotante
    this.tweens.add({
      targets: newBox,
      y: newZoneY - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.dropZones = [oldZone, newZone];
  }

  createItems() {
    // Definir tipos de objetos
    const itemTypes = [
      { id: "gear", type: "old", color: 0xcd7f32 }, // Engranaje (Bronce)
      { id: "key", type: "old", color: 0xffd700 }, // Llave de cuerda (Oro)
      { id: "oil", type: "old", color: 0x3e2723 }, // Aceitera
      { id: "bulb", type: "old", color: 0xffffcc }, // Bombilla vieja
      { id: "chip", type: "new", color: 0x2ecc71 }, // Microchip (Verde)
      { id: "battery", type: "new", color: 0x3498db }, // Batería (Azul)
      { id: "wifi", type: "new", color: 0xffffff }, // Señal Wifi
      { id: "robot_head", type: "new", color: 0xe74c3c }, // Cabeza moderna
    ];

    // Barajar y guardar en cola para que aparezcan uno por uno
    this.pendingItems = Phaser.Utils.Array.Shuffle(itemTypes);

    // Eventos Drag & Drop
    this.input.on("dragstart", (pointer, gameObject) => {
      this.children.bringToTop(gameObject);
      gameObject.setScale(1.2);
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on("drop", (pointer, gameObject, dropZone) => {
      const itemType = gameObject.getData("type");
      const zoneType = dropZone.getData("type");

      if (itemType === zoneType) {
        // Correcto
        this.handleCorrectDrop(gameObject, dropZone);
      } else {
        // Incorrecto
        this.handleWrongDrop(gameObject);
      }
    });

    this.input.on("dragend", (pointer, gameObject, dropped) => {
      gameObject.setScale(1);
      if (!dropped) {
        this.returnToOrigin(gameObject);
      }
    });

    // Iniciar mostrando el primer item
    this.spawnNextItem();
  }

  spawnNextItem() {
    if (this.pendingItems.length === 0) return;

    const data = this.pendingItems.pop();

    // Posición inicial (Centro inferior)
    const x = this.width / 2;
    const y = this.height - 100;

    const item = this.createItemGraphic(x, y, data);

    // Hacer draggable
    item.setInteractive({ useHandCursor: true });
    this.input.setDraggable(item);

    // Guardar datos
    item.setData("type", data.type);
    item.setData("originalX", x);
    item.setData("originalY", y);

    // Animación de aparición (Pop)
    item.setScale(0);
    this.tweens.add({
      targets: item,
      scale: 1,
      duration: 500,
      ease: "Back.out",
    });
  }

  createItemGraphic(x, y, data) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();

    // Fondo burbuja para facilitar agarre
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(0, 0, 45);

    // Dibujar icono según ID
    switch (data.id) {
      case "gear": // Engranaje más realista
        const gearColor = data.color;
        const baseColorObject = Phaser.Display.Color.ValueToColor(gearColor);
        const darkColor = baseColorObject.darken(20).color;
        const lightColor = baseColorObject.lighten(20).color;

        // Cuerpo principal del engranaje con gradiente
        g.fillGradientStyle(darkColor, gearColor, gearColor, darkColor, 1);
        g.fillCircle(0, 0, 30);

        // Borde exterior para darle volumen
        g.lineStyle(2, lightColor, 1);
        g.strokeCircle(0, 0, 30);

        // Agujero central
        g.fillStyle(0x000000);
        g.fillCircle(0, 0, 10);
        g.lineStyle(1, 0x555555, 1);
        g.strokeCircle(0, 0, 10);

        // Dientes del engranaje
        const numTeeth = 12; // Más dientes para mayor realismo
        const toothWidthAngle = (Math.PI * 2) / numTeeth / 3; // Ancho del diente
        const toothGapAngle = (Math.PI * 2) / numTeeth / 3; // Espacio entre dientes
        const radius = 30;
        const outerRadius = 40; // Radio exterior de los dientes

        g.fillStyle(gearColor);
        for (let i = 0; i < numTeeth; i++) {
          const startAngle = (i * Math.PI * 2) / numTeeth - toothWidthAngle / 2;
          const endAngle = startAngle + toothWidthAngle;

          g.beginPath();
          g.arc(0, 0, radius, startAngle, endAngle);
          g.lineTo(
            outerRadius * Math.cos(endAngle),
            outerRadius * Math.sin(endAngle),
          );
          g.arc(0, 0, outerRadius, endAngle, startAngle, true); // Dibuja el arco exterior en sentido contrario
          g.lineTo(
            radius * Math.cos(startAngle),
            radius * Math.sin(startAngle),
          );
          g.closePath();
          g.fillPath();

          // Sombreado sutil para los dientes
          g.lineStyle(1, darkColor, 0.5);
          g.strokePath();
        }
        break;
      case "key": // Llave antigua más realista
        const keyColor = data.color;
        const baseKeyColorObject = Phaser.Display.Color.ValueToColor(keyColor);
        const darkKeyColor = baseKeyColorObject.darken(25).color;
        const lightKeyColor = baseKeyColorObject.lighten(25).color;

        // Mango de la llave (parte superior circular con detalles)
        g.fillGradientStyle(darkKeyColor, keyColor, keyColor, darkKeyColor, 1);
        g.fillCircle(0, -15, 20); // Círculo principal del mango
        g.lineStyle(2, lightKeyColor, 1);
        g.strokeCircle(0, -15, 20);

        // Agujero en el mango
        g.fillStyle(0x000000);
        g.fillCircle(0, -15, 8);
        g.lineStyle(1, 0x555555, 1);
        g.strokeCircle(0, -15, 8);

        // Conexión del mango al vástago
        g.fillGradientStyle(darkKeyColor, keyColor, keyColor, darkKeyColor, 1);
        g.fillRect(-5, 0, 10, 10); // Pequeño rectángulo de conexión
        g.lineStyle(2, lightKeyColor, 1);
        g.strokeRect(-5, 0, 10, 10);

        // Vástago (palo) de la llave
        g.fillGradientStyle(darkKeyColor, keyColor, keyColor, darkKeyColor, 1);
        g.fillRect(-3, 10, 6, 30); // Vástago principal
        g.lineStyle(2, lightKeyColor, 1);
        g.strokeRect(-3, 10, 6, 30);

        // Dientes de la llave (parte inferior)
        g.fillGradientStyle(darkKeyColor, keyColor, keyColor, darkKeyColor, 1);
        g.fillRect(-10, 30, 15, 8); // Base de los dientes
        g.fillRect(-10, 38, 5, 5); // Diente 1
        g.fillRect(0, 38, 5, 5); // Diente 2
        g.lineStyle(2, lightKeyColor, 1);
        g.strokeRect(-10, 30, 15, 8);
        g.strokeRect(-10, 38, 5, 5);
        g.strokeRect(0, 38, 5, 5);
        break;
      case "oil": // Aceitera más realista
        const oilColor = data.color;
        const baseOilColorObject = Phaser.Display.Color.ValueToColor(oilColor);
        const darkOilColor = baseOilColorObject.darken(20).color;
        const lightOilColor = baseOilColorObject.lighten(20).color;

        // Base de la aceitera
        g.fillGradientStyle(darkOilColor, oilColor, oilColor, darkOilColor, 1);
        g.fillRect(-25, 25, 50, 10); // Base rectangular
        g.lineStyle(2, lightOilColor, 1);
        g.strokeRect(-25, 25, 50, 10);

        // Cuerpo principal de la aceitera (forma de gota o cilindro)
        g.fillGradientStyle(darkOilColor, oilColor, oilColor, darkOilColor, 1);
        g.beginPath();
        g.moveTo(-20, 25);
        g.lineTo(20, 25);
        g.lineTo(15, -10);
        g.lineTo(-15, -10);
        g.closePath();
        g.fillPath();
        g.lineStyle(2, lightOilColor, 1);
        g.strokePath();

        // Parte superior del cuerpo
        g.fillGradientStyle(darkOilColor, oilColor, oilColor, darkOilColor, 1);
        g.fillEllipse(0, -10, 30, 15);
        g.lineStyle(2, lightOilColor, 1);
        g.strokeEllipse(0, -10, 30, 15);

        // Pico de la aceitera
        g.fillGradientStyle(darkOilColor, oilColor, oilColor, darkOilColor, 1);
        g.beginPath();
        g.moveTo(10, -15);
        g.lineTo(25, -30);
        g.lineTo(20, -35);
        g.lineTo(5, -20);
        g.closePath();
        g.fillPath();
        g.lineStyle(2, lightOilColor, 1);
        g.strokePath();

        // Detalle en el pico
        g.fillStyle(0x000000);
        g.fillCircle(22, -32, 2);
        break;
      case "bulb": // Bombilla antigua más realista
        const bulbColor = data.color; // Color general de la bombilla (amarillento)
        const baseColor = 0x888888; // Color base metálico
        const baseBaseColorObject =
          Phaser.Display.Color.ValueToColor(baseColor);
        const darkBaseColor = baseBaseColorObject.darken(20).color;
        const lightBaseColor = baseBaseColorObject.lighten(20).color;

        // Bulbo de cristal (transparente con gradiente)
        g.fillGradientStyle(0xffffff, bulbColor, bulbColor, 0xffffff, 0.6); // Gradiente de blanco a color de bombilla
        g.fillEllipse(0, -15, 40, 50); // Forma elíptica del bulbo
        g.lineStyle(2, 0xcccccc, 0.8); // Borde sutil para el cristal
        g.strokeEllipse(0, -15, 40, 50);

        // Filamento (dentro del bulbo)
        g.lineStyle(2, 0xffff00, 1); // Color amarillo brillante para el filamento
        g.beginPath();
        g.moveTo(-10, -20);
        g.lineTo(10, -20);
        g.lineTo(5, -10);
        g.lineTo(-5, -10);
        g.closePath();
        g.strokePath();
        g.fillCircle(0, -25, 2); // Punto de conexión superior

        // Base metálica (rosca)
        g.fillGradientStyle(
          darkBaseColor,
          baseColor,
          baseColor,
          darkBaseColor,
          1,
        );
        g.fillRect(-15, 10, 30, 15); // Parte principal de la base
        g.lineStyle(2, lightBaseColor, 1);
        g.strokeRect(-15, 10, 30, 15);

        // Detalles de la rosca
        g.lineStyle(1, darkBaseColor, 1);
        g.lineBetween(-15, 13, 15, 13);
        g.lineBetween(-15, 17, 15, 17);
        g.lineBetween(-15, 21, 15, 21);

        // Contacto inferior
        g.fillStyle(lightBaseColor);
        g.fillCircle(0, 28, 5);
        g.lineStyle(1, darkBaseColor, 1);
        g.strokeCircle(0, 28, 5);
        break;
      case "chip": // Microchip más realista
        const chipColor = data.color;
        const baseChipColorObject =
          Phaser.Display.Color.ValueToColor(chipColor);
        const darkChipColor = baseChipColorObject.darken(15).color;
        const lightChipColor = baseChipColorObject.lighten(15).color;
        const pinColor = 0xc0c0c0; // Color plata para los pines
        const basePinColorObject = Phaser.Display.Color.ValueToColor(pinColor);
        const darkPinColor = basePinColorObject.darken(10).color;
        const lightPinColor = basePinColorObject.lighten(10).color;

        // Cuerpo principal del chip
        g.fillGradientStyle(
          darkChipColor,
          chipColor,
          chipColor,
          darkChipColor,
          1,
        );
        g.fillRoundedRect(-25, -25, 50, 50, 5);
        g.lineStyle(2, lightChipColor, 1);
        g.strokeRoundedRect(-25, -25, 50, 50, 5);

        // Detalles internos (circuito)
        g.fillStyle(0x000000, 0.8);
        g.fillRect(-18, -18, 36, 36);
        g.lineStyle(1, lightChipColor, 0.5);
        for (let i = -15; i <= 15; i += 7) {
          g.lineBetween(-18, i, 18, i);
          g.lineBetween(i, -18, i, 18);
        }

        // Pines (patitas)
        for (let i = -20; i <= 20; i += 10) {
          // Pines izquierdos
          g.fillGradientStyle(
            darkPinColor,
            pinColor,
            pinColor,
            darkPinColor,
            1,
          );
          g.fillRect(-30, i - 2, 5, 4);
          g.lineStyle(1, lightPinColor, 1);
          g.strokeRect(-30, i - 2, 5, 4);

          // Pines derechos
          g.fillGradientStyle(
            darkPinColor,
            pinColor,
            pinColor,
            darkPinColor,
            1,
          );
          g.fillRect(25, i - 2, 5, 4);
          g.lineStyle(1, lightPinColor, 1);
          g.strokeRect(25, i - 2, 5, 4);
        }
        break;
      case "battery": // Batería más realista
        const batteryColor = data.color;
        const baseBatteryColorObject =
          Phaser.Display.Color.ValueToColor(batteryColor);
        const darkBatteryColor = baseBatteryColorObject.darken(15).color;
        const lightBatteryColor = baseBatteryColorObject.lighten(15).color;
        const terminalColor = 0xcccccc; // Color para los terminales
        const baseTerminalColorObject =
          Phaser.Display.Color.ValueToColor(terminalColor);
        const darkTerminalColor = baseTerminalColorObject.darken(10).color;
        const lightTerminalColor = baseTerminalColorObject.lighten(10).color;

        // Cuerpo principal de la batería (cilíndrico con bordes redondeados)
        g.fillGradientStyle(
          darkBatteryColor,
          batteryColor,
          batteryColor,
          darkBatteryColor,
          1,
        );
        g.fillRoundedRect(-15, -25, 30, 50, 8);
        g.lineStyle(2, lightBatteryColor, 1);
        g.strokeRoundedRect(-15, -25, 30, 50, 8);

        // Terminal positivo (+)
        g.fillGradientStyle(
          darkTerminalColor,
          terminalColor,
          terminalColor,
          darkTerminalColor,
          1,
        );
        g.fillRect(-10, -30, 20, 5);
        g.lineStyle(2, lightTerminalColor, 1);
        g.strokeRect(-10, -30, 20, 5);

        // Terminal negativo (-) (base)
        g.fillGradientStyle(
          darkTerminalColor,
          terminalColor,
          terminalColor,
          darkTerminalColor,
          1,
        );
        g.fillRect(-10, 25, 20, 5);
        g.lineStyle(2, lightTerminalColor, 1);
        g.strokeRect(-10, 25, 20, 5);

        // Etiqueta o símbolo de poder
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(-8, -5, 16, 10);
        g.fillStyle(0x000000);
        g.fillRect(-4, -3, 8, 6); // Símbolo de rayo simplificado
        break;
      case "wifi": // Señal Wifi más realista
        const wifiColor = data.color;
        const baseWifiColorObject =
          Phaser.Display.Color.ValueToColor(wifiColor);
        const darkWifiColor = baseWifiColorObject.darken(10).color;
        const lightWifiColor = baseWifiColorObject.lighten(10).color;

        // Punto central
        g.fillGradientStyle(
          darkWifiColor,
          wifiColor,
          wifiColor,
          darkWifiColor,
          1,
        );
        g.fillCircle(0, 15, 6);
        g.lineStyle(2, lightWifiColor, 1);
        g.strokeCircle(0, 15, 6);

        // Arcos de señal
        const arcThickness = 5;
        const arcAlpha = 0.8;

        // Primer arco
        g.lineStyle(arcThickness, wifiColor, arcAlpha);
        g.beginPath();
        g.arc(0, 15, 15, Math.PI * 0.7, Math.PI * 0.3, true); // Ajustar ángulos para un arco más abierto
        g.strokePath();

        // Segundo arco
        g.lineStyle(arcThickness, wifiColor, arcAlpha);
        g.beginPath();
        g.arc(0, 15, 25, Math.PI * 0.7, Math.PI * 0.3, true);
        g.strokePath();

        // Tercer arco
        g.lineStyle(arcThickness, wifiColor, arcAlpha);
        g.beginPath();
        g.arc(0, 15, 35, Math.PI * 0.7, Math.PI * 0.3, true);
        g.strokePath();
        break;
      case "robot_head": // Cabeza de robot más realista
        const headColor = data.color;
        const baseHeadColorObject =
          Phaser.Display.Color.ValueToColor(headColor);
        const darkHeadColor = baseHeadColorObject.darken(15).color;
        const lightHeadColor = baseHeadColorObject.lighten(15).color;
        const visorColor = 0x00ffff; // Color del visor
        const baseVisorColorObject =
          Phaser.Display.Color.ValueToColor(visorColor);
        const darkVisorColor = baseVisorColorObject.darken(10).color;
        const lightVisorColor = baseVisorColorObject.lighten(10).color;

        // Cuerpo principal de la cabeza
        g.fillGradientStyle(
          darkHeadColor,
          headColor,
          headColor,
          darkHeadColor,
          1,
        );
        g.fillRoundedRect(-25, -25, 50, 50, 10); // Forma base de la cabeza
        g.lineStyle(2, lightHeadColor, 1);
        g.strokeRoundedRect(-25, -25, 50, 50, 10);

        // Visor
        g.fillGradientStyle(
          darkVisorColor,
          visorColor,
          visorColor,
          darkVisorColor,
          1,
        );
        g.fillRoundedRect(-18, -8, 36, 16, 5); // Visor más prominente
        g.lineStyle(2, lightVisorColor, 1);
        g.strokeRoundedRect(-18, -8, 36, 16, 5);

        // Antenas
        g.lineStyle(3, lightHeadColor, 1);
        g.lineBetween(-15, -25, -10, -35); // Antena izquierda
        g.lineBetween(15, -25, 10, -35); // Antena derecha
        g.fillStyle(lightHeadColor);
        g.fillCircle(-10, -35, 3);
        g.fillCircle(10, -35, 3);

        // Cuello/Conexión
        g.fillGradientStyle(
          darkHeadColor,
          headColor,
          headColor,
          darkHeadColor,
          1,
        );
        g.fillRect(-10, 25, 20, 5);
        g.lineStyle(2, lightHeadColor, 1);
        g.strokeRect(-10, 25, 20, 5);
        break;
    }

    container.add(g);
    container.setSize(90, 90);
    return container;
  }

  handleCorrectDrop(gameObject, dropZone) {
    // Detener tutorial INMEDIATAMENTE
    this.hideHint();

    // Posicionar en el centro de la zona
    gameObject.x = dropZone.x;
    gameObject.y = dropZone.y;
    gameObject.input.enabled = false;

    // Desactivar item para que el tutorial no lo detecte
    gameObject.setVisible(false);
    gameObject.setActive(false);

    // Efecto de Partículas
    const color = dropZone.getData("type") === "old" ? 0xd4af37 : 0x00ffff; // Dorado u Holo
    this.createSuccessParticles(dropZone.x, dropZone.y, color);

    this.score++;
    // this.updateScoreText(); // Eliminado

    // Destruir objeto original
    gameObject.destroy();

    this.tweens.add({
      targets: dropZone,
      scale: 1.2,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        if (this.score >= this.totalItems) {
          this.showVictory();
        } else {
          // Siguiente item
          // Esperar un poco para dar tiempo al feedback visual, luego spawnear
          this.time.delayedCall(500, () => {
            this.spawnNextItem();
            // Iniciar tutorial para el NUEVO item
            this.time.delayedCall(100, () => this.startHintLoop());
          });
        }
      },
    });
  }

  handleWrongDrop(item) {
    // Feedback visual de error
    const feedback = this.add
      .text(item.x, item.y - 50, "¡Ese no va ahí!", {
        fontFamily: "Arial Black",
        fontSize: "20px",
        fill: "#e74c3c",
        stroke: "#fff",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: feedback,
      y: item.y - 80,
      alpha: 0,
      duration: 1000,
      onComplete: () => feedback.destroy(),
    });

    this.returnToOrigin(item);
  }

  returnToOrigin(gameObject) {
    this.tweens.add({
      targets: gameObject,
      x: gameObject.getData("originalX"),
      y: gameObject.getData("originalY"),
      duration: 500,
      ease: "Power2",
    });
  }

  createSuccessParticles(x, y, color) {
    const particles = this.add.particles("spark"); // Asegúrate de tener una imagen 'spark' cargada
    const emitter = particles.createEmitter({
      x: x,
      y: y,
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      gravityY: 300,
      scale: { start: 0.5, end: 0 },
      lifespan: 1000,
      blendMode: "ADD",
      tint: color,
      quantity: 15,
      emitZone: { type: "random", source: new Phaser.Geom.Circle(0, 0, 20) },
    });

    // Detener la emisión después de un breve periodo
    this.time.delayedCall(500, () => {
      emitter.stop();
      // Destruir el sistema de partículas después de que las partículas vivas desaparezcan
      this.time.delayedCall(1000, () => {
        particles.destroy();
      });
    });
  }

  createSuccessEffect(x, y) {
    const circle = this.add.circle(x, y, 10, 0xffd700, 0); // Círculo dorado, transparente
    this.tweens.add({
      targets: circle,
      radius: 50,
      alpha: 1,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        this.tweens.add({
          targets: circle,
          alpha: 0,
          duration: 200,
          ease: "Power2",
          onComplete: () => {
            circle.destroy();
          },
        });
      },
    });
  }

  showVictory() {
    // Detener timer de ayuda
    this.hideHint();

    // Fondo semitransparente
    const overlay = this.add.rectangle(
      this.width / 2,
      this.height / 2,
      this.width,
      this.height,
      0x000000,
      0.8,
    );
    overlay.alpha = 0;
    this.tweens.add({ targets: overlay, alpha: 0.8, duration: 500 });

    // Texto Felicitaciones
    const congrats = this.add
      .text(this.width / 2, this.height / 2 - 100, "¡FELICITACIONES!", {
        fontFamily: "Arial Black",
        fontSize: "50px",
        fill: "#e74c3c",
        stroke: "#ffffff",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScale(0);

    // Texto Victoria
    const title = this.add
      .text(this.width / 2, this.height / 2, "¡HISTORIADOR ROBOT!", {
        fontFamily: "Arial Black",
        fontSize: "40px",
        fill: "#f1c40f",
        stroke: "#ffffff",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScale(0);

    const subtitle = this.add
      .text(
        this.width / 2,
        this.height / 2 + 60,
        "Has clasificado todas las piezas",
        {
          fontFamily: "Arial",
          fontSize: "24px",
          fill: "#ffffff",
        },
      )
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: congrats,
      scale: 1,
      duration: 1000,
      ease: "Back.out",
    });

    this.tweens.add({
      targets: title,
      scale: 1,
      delay: 500,
      duration: 1000,
      ease: "Back.out",
    });

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      delay: 1000,
      duration: 1000,
    });

    // Botón Reiniciar
    const btn = this.add.container(this.width / 2, this.height / 2 + 150);
    const btnBg = this.add
      .rectangle(0, 0, 260, 60, 0x2ecc71, 1)
      .setInteractive({ useHandCursor: true });
    const btnTxt = this.add
      .text(0, 0, "VOLVER A JUGAR", {
        fontSize: "24px",
        fontFamily: "Arial Black",
      })
      .setOrigin(0.5);
    btn.add([btnBg, btnTxt]);

    // Reiniciar todo el minijuego
    btnBg.on("pointerdown", () => {
      // Resetear estado global si es necesario
      this.sys.game.tutorialPuzzle3Completed = false;
      this.scene.start("RobotsPuzzle1Scene");
    });

    // Confeti final
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
    const particles = this.add.particles("flare");

    const emitter = particles.createEmitter({
      x: { min: 0, max: this.width },
      y: -50,
      speedY: { min: 200, max: 400 },
      lifespan: 3000,
      scale: { start: 0.5, end: 0 },
      tint: colors,
      frequency: 100,
    });
  }

  createBackButton() {
    const btn = this.add.container(60, 40);
    const bg = this.add
      .circle(0, 0, 25, 0xe74c3c)
      .setInteractive({ useHandCursor: true });
    const txt = this.add
      .text(0, 0, "<", { fontSize: "30px", fontFamily: "Arial Black" })
      .setOrigin(0.5);

    btn.add([bg, txt]);

    bg.on("pointerdown", () => {
      // Regresar a la escena 1 o menú
      this.scene.start("RobotsPuzzle1Scene");
    });
  }
}
