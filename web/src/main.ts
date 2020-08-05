import 'regenerator-runtime/runtime'
import {Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh, PlaneGeometry, Matrix4, MeshLambertMaterial, SpotLight, AmbientLight} from 'three'
import * as CANNON from 'cannon';
import { PointerLockControls } from './engine/PointerLockControls'

const scene = new Scene();
const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new BoxGeometry();
const material = new MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new Mesh( geometry, material );
scene.add( cube );

let world, physicsMaterial, sphereShape, sphereBody, groundBody: any
let light: SpotLight

function initCannon(){
  // Setup our world
  world = new CANNON.World();
  world.quatNormalizeSkip = 0;
  world.quatNormalizeFast = false;

  var solver = new CANNON.GSSolver();

  world.defaultContactMaterial.contactEquationStiffness = 1e9;
  world.defaultContactMaterial.contactEquationRelaxation = 4;

  solver.iterations = 7;
  solver.tolerance = 0.1;
  var split = true;
  if(split)
      world.solver = new CANNON.SplitSolver(solver);
  else
      world.solver = solver;

  world.gravity.set(0,-20,0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.broadphase.useBoundingBoxes = true;

  // Create a slippery material (friction coefficient = 0.0)
  physicsMaterial = new CANNON.Material("slipperyMaterial");
  var physicsContactMaterial = new CANNON.ContactMaterial(
    physicsMaterial,
    physicsMaterial,
    {
      
    }
  );
  // We must add the contact materials to the world
  world.addContactMaterial(physicsContactMaterial);

  var nx = 50,
      ny = 8,
      nz = 50,
      sx = 0.5,
      sy = 0.5,
      sz = 0.5;

  // Create a sphere
  var mass = 5, radius = 1.3;
  sphereShape = new CANNON.Sphere(radius);
  sphereBody = new CANNON.Body({ mass: mass, material: physicsMaterial });
  sphereBody.addShape(sphereShape);
  sphereBody.position.set(nx*sx*0.5,ny*sy+radius*2,nz*sz*0.5);
  sphereBody.linearDamping = 0.9;
  world.addBody(sphereBody);

  // Create a plane
  var groundShape = new CANNON.Plane();
  groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
  groundBody.addShape(groundShape);
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
  groundBody.position.set(0,0,0);
  world.addBody(groundBody);
}


async function main() {
  initCannon()
  
  let controls = new PointerLockControls(camera, sphereBody)
  scene.add(controls.getObject())
  
  // pointer locking
  document.body.addEventListener('click', (e) => {
    document.body.requestPointerLock();
  })
  
  document.addEventListener('pointerlockchange', (e) => {
    controls.enabled = document.pointerLockElement === document.body
  });
  
  // testing lights
  let ambient = new AmbientLight( 0x111111 );
  scene.add( ambient );

  light = new SpotLight( 0xffffff, 0.2 );
  light.position.set( 10, 30, 20 );
  light.target.position.set( 0, 0, 0 );
  if(true){
      light.castShadow = false;

      light.shadow.camera.near = 20;
      light.shadow.camera.far = 50;//camera.far;
      light.shadow.camera.fov = 40;
      light.shadow.mapSize.width = 8*512;
      light.shadow.mapSize.height = 8*512;

      //light.shadowCameraVisible = true;
  }
  scene.add( light );
  
  // plane
  let planeGeometry = new PlaneGeometry( 300, 300, 50, 50 );
  planeGeometry.applyMatrix4( new Matrix4().makeRotationX( - Math.PI / 2 ) )

  let planeMaterial = new MeshLambertMaterial( { color: 0xdddddd } );
  let mesh = new Mesh( planeGeometry, planeMaterial );
  mesh.position.copy(groundBody.position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add( mesh );
  
  
  let dt = 1/60
  let time = Date.now()
  function animate() {
    requestAnimationFrame( animate );
    world.step(dt)
  
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  
    controls.update( Date.now() - time );
    renderer.render( scene, camera );
    time = Date.now();
  };
  
  animate();
}

main().catch(e => console.log(e))