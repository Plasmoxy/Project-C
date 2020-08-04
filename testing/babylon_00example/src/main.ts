import * as BABYLON from 'babylonjs'

class Game {
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private scene!: BABYLON.Scene;
  private camera!: BABYLON.FreeCamera;
  private light!: BABYLON.Light;

  constructor(canvasElement : string) {
      // Create canvas and engine.
      this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
      this.engine = new BABYLON.Engine(this.canvas, true);
  }

  createScene() : void {
      // Create a basic BJS Scene object.
      this.scene = new BABYLON.Scene(this.engine);
      this.scene.collisionsEnabled = true
      this.scene.gravity = new BABYLON.Vector3(0, -9.81, 0)

      // Create a FreeCamera, and set its position to (x:0, y:5, z:-10).
      this.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 5, -10), this.scene)
      this.camera.applyGravity = true
      this.camera.speed = 0.5
      this.camera.keysDown = [83]
      this.camera.keysUp = [87]
      this.camera.keysLeft = [65]
      this.camera.keysRight = [68]

      // Target the camera to scene origin.
      this.camera.setTarget(BABYLON.Vector3.Zero());

      // Attach the camera to the canvas.
      this.camera.attachControl(this.canvas, false);

      // Create a basic light, aiming 0,1,0 - meaning, to the sky.
      this.light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), this.scene);

      // Create a built-in "sphere" shape; with 16 segments and diameter of 2.
      let sphere = BABYLON.MeshBuilder.CreateSphere('sphere1',
                              {segments: 16, diameter: 2}, this.scene);

      // Move the sphere upward 1/2 of its height.
      sphere.position.y = 1;

      // Create a built-in "ground" shape.
      let ground = BABYLON.MeshBuilder.CreateGround('ground1',
                              {width: 6, height: 6, subdivisions: 2}, this.scene);
  }

  doRender() : void {
    console.log("Render")
    
    // Run the render loop.
    this.engine.runRenderLoop(() => {
        this.scene.render();
    });

    // The canvas/window resize event handler.
    window.addEventListener('resize', () => {
        this.engine.resize();
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
    
  // Create the game using the 'renderCanvas'.
  let game = new Game('renderCanvas');

  // Create the scene.
  game.createScene();

  // Start render loop.
  game.doRender();
});