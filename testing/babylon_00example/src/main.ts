import * as BABYLON from 'babylonjs'
import * as CANNON from 'cannon'
import { Vector3, CannonJSPlugin, OimoJSPlugin, PhysicsImpostor, PhysicsViewer, MeshBuilder, StandardMaterial } from 'babylonjs'

// extend window type for adding debug stuff
declare global {
  interface Window {
    [x: string]: any
  }
  
  interface Document {
    mozPointerLockElement?: HTMLElement
    webkitPointerLockElement?: HTMLElement
    msPointerLockElement?: HTMLElement
  }
}

class Game {
  canvas: HTMLCanvasElement;
  engine: BABYLON.Engine;
  scene!: BABYLON.Scene;
  camera!: BABYLON.FreeCamera;
  sphere!: BABYLON.Mesh;
  light!: BABYLON.Light;
  
  isPointerLocked = false

  constructor(canvasElement : string) {
      // Create canvas and engine.
      this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
      this.engine = new BABYLON.Engine(this.canvas, true);
  }

  createScene() : void {
    
      // ============ SCENE SETUP ============
    
      // Create a basic BJS Scene object.
      this.scene = new BABYLON.Scene(this.engine);
      
      this.scene.debugLayer.show()
      this.scene.collisionsEnabled = false
      this.scene.enablePhysics(new Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin(undefined, undefined, CANNON))
      
      // ============= CAMERA ================
      
      // Create a FreeCamera, and set its position to (x:0, y:5, z:-10).
      this.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 3, -3), this.scene)
      this.camera.ellipsoid = new Vector3(1, 1, 1)
      this.camera.speed = 0.1

      // Target the camera to scene origin.
      this.camera.setTarget(BABYLON.Vector3.Zero());

      // Attach the camera to the canvas.
      this.camera.inputs.clear()
      this.camera.inputs.addMouse()
      this.camera.inertia = 0
      this.camera.angularSensibility = 500
      
      // ============= POINTER LOCKING ====================
      
      const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement
      this.scene.onPointerDown = (e) => {
          if (document.pointerLockElement !== canvas) {
            console.log('Was Already locked: ', document.pointerLockElement === canvas);

            if (!this.isPointerLocked) {
                canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock || false;
                if (canvas.requestPointerLock) {
                    canvas.requestPointerLock();
                }
            }
        }

        //continue with shooting requests or whatever :P
        //evt === 0 (left mouse click)
        //evt === 1 (mouse wheel click (not scrolling))
        //evt === 2 (right mouse click)
      }
      
      // Event listener when the pointerlock is updated (or removed by pressing ESC for example).
      const pointerlockchange = () => {
        var controlEnabled = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement || false;

        // If the user is already locked
        if (!controlEnabled) {
            this.camera.detachControl(canvas);
            this.isPointerLocked = false;
        } else {
            this.camera.attachControl(canvas);
            this.isPointerLocked = true
        }
      };

      // Attach events to the document
      document.addEventListener("pointerlockchange", pointerlockchange, false);
      document.addEventListener("mspointerlockchange", pointerlockchange, false);
      document.addEventListener("mozpointerlockchange", pointerlockchange, false);
      document.addEventListener("webkitpointerlockchange", pointerlockchange, false);

      

      // Create a basic light, aiming 0,1,0 - meaning, to the sky.
      this.light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), this.scene);
      this.light.intensity = 0.5

      // Create a built-in "sphere" shape; with 16 segments and diameter of 2.
      this.sphere = BABYLON.MeshBuilder.CreateSphere('sphere1',
                              {segments: 16, diameter: 2}, this.scene);
      window.sphere = this.sphere

      // Move the sphere upward 1/2 of its height.
      this.sphere.position.y = 5;
      this.sphere.physicsImpostor = new PhysicsImpostor(this.sphere, PhysicsImpostor.SphereImpostor, {mass: 1}, this.scene)
      this.camera.parent = this.sphere
      
      let redmat = new StandardMaterial("red", this.scene)
      redmat.emissiveColor.set(255, 0, 0)
      redmat.diffuseColor.set(0, 0, 0)
      
      let box = MeshBuilder.CreateBox('box1', {width: 1, height: 1}, this.scene)
      box.physicsImpostor = new PhysicsImpostor(box, PhysicsImpostor.SphereImpostor, {mass: 1}, this.scene)
      box.material = this.scene.getMaterialByName("red")
      box.position.x = 0.5

      // Create a built-in "ground" shape.
      let ground = BABYLON.MeshBuilder.CreateGround('ground1',
                              {width: 6, height: 6, subdivisions: 2}, this.scene);
      ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.PlaneImpostor, {mass: 0}, this.scene)
      
      // const physicsViewer = new PhysicsViewer(this.scene)
      
      // physicsViewer.showImpostor(this.sphere.physicsImpostor)
      this.sphere.physicsImpostor.executeNativeFunction((w: CANNON.World, b: CANNON.Body) => {
        b.angularDamping = 1 // disable angular friction ~ rotation
      })
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
  window.game = game

  // Create the scene.
  game.createScene();

  // Start render loop.
  game.doRender();
});