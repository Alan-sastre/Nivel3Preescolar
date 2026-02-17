class ContextoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ContextoScene' });
    }
    create() {
        this.scene.start('Nivel2Scene');
    }
}
