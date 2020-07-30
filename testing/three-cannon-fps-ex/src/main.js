import { VoxelLandscape } from './VoxelLandscape'
import { PointerLockControls } from './PointerLockControls'

var sphereShape, sphereBody, world, physicsMaterial, walls=[], balls=[], ballMeshes=[], boxes=[], boxMeshes=[], voxels, groundBody;

var camera, scene, renderer, light;
var geometry, material, mesh;
var controls,time = Date.now();

var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if ( havePointerLock ) {

    var element = document.body;

    var pointerlockchange = function ( event ) {

        if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

            controls.enabled = true;

            blocker.style.display = 'none';

        } else {

            controls.enabled = false;

            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';

            instructions.style.display = '';

        }

    }

    var pointerlockerror = function ( event ) {
        instructions.style.display = '';
    }

    // Hook pointer lock state change events
    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
    document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

    document.addEventListener( 'pointerlockerror', pointerlockerror, false );
    document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
    document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

    instructions.addEventListener( 'click', function ( event ) {
        instructions.style.display = 'none';

        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

        if ( /Firefox/i.test( navigator.userAgent ) ) {

            var fullscreenchange = function ( event ) {

                if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

                    document.removeEventListener( 'fullscreenchange', fullscreenchange );
                    document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

                    element.requestPointerLock();
                }

            }

            document.addEventListener( 'fullscreenchange', fullscreenchange, false );
            document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

            element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

            element.requestFullscreen();

        } else {

            element.requestPointerLock();

        }

    }, false );

} else {

    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

}

initCannon();
init();
animate();

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
    var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
                                                            physicsMaterial,
                                                            0.0, // friction coefficient
                                                            0.3  // restitution
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

    voxels = new VoxelLandscape(world,nx,ny,nz,sx,sy,sz);

    for(var i=0; i<nx; i++){
        for(var j=0; j<ny; j++){
            for(var k=0; k<nz; k++){
                var filled = true;

                // Insert map constructing logic here
                if(Math.sin(i*0.1)*Math.sin(k*0.1) < j/ny*2-1)
                    filled = false;

                voxels.setFilled(i,j,k,filled);

            }
        }
    }

    voxels.update();
    console.log(voxels.boxes.length+" voxel physics bodies");
}

function init() {

    camera = new THREE.PerspectiveCamera( 130, window.innerWidth / window.innerHeight, 0.1, 1000 );

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 0, 500 );

    var ambient = new THREE.AmbientLight( 0x111111 );
    scene.add( ambient );

    light = new THREE.SpotLight( 0xffffff );
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

    controls = new PointerLockControls( camera , sphereBody );
    scene.add( controls.getObject() );

    // floor
    geometry = new THREE.PlaneGeometry( 300, 300, 50, 50 );
    geometry.applyMatrix4( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

    material = new THREE.MeshLambertMaterial( { color: 0xdddddd } );

    mesh = new THREE.Mesh( geometry, material );

    mesh.position.copy(groundBody.position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add( mesh );

    // voxels
    for(var i=0; i<voxels.boxes.length; i++){
        var b = voxels.boxes[i];
        var voxelGeometry = new THREE.CubeGeometry( voxels.sx*b.nx, voxels.sy*b.ny, voxels.sz*b.nz );
        var voxelMesh = new THREE.Mesh( voxelGeometry, material );
        voxelMesh.castShadow = true;
        voxelMesh.receiveShadow = true;
        scene.add( voxelMesh );
        boxMeshes.push( voxelMesh );
    }


    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( scene.fog.color, 1 );

    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

var dt = 1/60;
function animate() {
    requestAnimationFrame( animate );
    if(controls.enabled){
        world.step(dt);

        // Update ball positions
        for(var i=0; i<balls.length; i++){
            ballMeshes[i].position.copy(balls[i].position);
            ballMeshes[i].quaternion.copy(balls[i].quaternion);
        }

        // Update box positions
        for(var i=0; i<voxels.boxes.length; i++){
            boxMeshes[i].position.copy(voxels.boxes[i].position);
            boxMeshes[i].quaternion.copy(voxels.boxes[i].quaternion);
        }
    }

    controls.update( Date.now() - time );
    renderer.render( scene, camera );
    time = Date.now();

}

var ballShape = new CANNON.Sphere(0.2);
var ballGeometry = new THREE.SphereGeometry(ballShape.radius);
var shootDirection = new THREE.Vector3();
var shootVelo = 15;
function getShootDir(targetVec){
    var vector = targetVec;
    targetVec.set(0,0,1);
    vector.unproject(camera)
    var ray = new THREE.Ray(sphereBody.position, vector.sub(sphereBody.position).normalize() );
    targetVec.x = ray.direction.x;
    targetVec.y = ray.direction.y;
    targetVec.z = ray.direction.z;
}

window.addEventListener("click",function(e){
    if(controls.enabled==true){
        var x = sphereBody.position.x;
        var y = sphereBody.position.y;
        var z = sphereBody.position.z;
        var ballBody = new CANNON.Body({ mass: 1 });
        ballBody.addShape(ballShape);
        var ballMesh = new THREE.Mesh( ballGeometry, material );
        world.addBody(ballBody);
        scene.add(ballMesh);
        ballMesh.castShadow = true;
        ballMesh.receiveShadow = true;
        balls.push(ballBody);
        ballMeshes.push(ballMesh);
        getShootDir(shootDirection);
        ballBody.velocity.set(  shootDirection.x * shootVelo,
                                shootDirection.y * shootVelo,
                                shootDirection.z * shootVelo);

        // Move the ball outside the player sphere
        x += shootDirection.x * (sphereShape.radius*1.02 + ballShape.radius);
        y += shootDirection.y * (sphereShape.radius*1.02 + ballShape.radius);
        z += shootDirection.z * (sphereShape.radius*1.02 + ballShape.radius);
        ballBody.position.set(x,y,z);
        ballMesh.position.set(x,y,z);
    }
});
