let renderer;

let sceneBrain;
let cameraBrain;
let controlsBrain;

let brainPointsMaterial;

let brainModelGroup;

let brainParticles;

let brainPointTexture;

let stats;

let loadDone = false, loadBrainDone = false;

let gui;
const cameraPos = new THREE.Vector3(3,3,0);
const modelRotate = 0;
const modelPos = new THREE.Vector3(-3, -3, 3);
const controlTarget = new THREE.Vector3(0,-0.3,0);
const cameraTarget = new THREE.Vector3(0,-0.3,0);

let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let targetCameraX = cameraPos.z;
let targetCameraY = cameraPos.y; 
let targetCameraZ = cameraPos.z;
const mouseMovFac = 0.0005;

let cameraAccFac = 0.01;
let cameraAccMin = 0.0001;
let cameraDis = 0.0001;

function init(){
    const container = document.createElement( 'div' );
	document.body.appendChild( container );

    cameraBrain = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
    cameraBrain.position.set( cameraPos.x, cameraPos.y, cameraPos.z );
    

    sceneBrain = new THREE.Scene();


    loadTexture();
    initMaterial();

    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for ( let i = 0; i < 50000; i ++ ) {
        // const r = Math.pow(Math.random(), 2);
        const r = Math.random() * 4;
        const theta = Math.random() * Math.PI;
        const phi = Math.random() * Math.PI * 2;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        vertices.push( x, y, z );

    }

    console.log(vertices)
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    const particles = new THREE.Points( geometry, brainPointsMaterial );

    sceneBrain.add( particles );

    // const pos = new THREE.Vector3(modelPos.x, modelPos.y, modelPos.z);
    // const angle = modelRotate * Math.PI / 180;

    new THREE.GLTFLoader()
    .setPath( 'models/brain/' )
    .load( 'Brain-t3.gltf', function ( gltf ) {
        brainModelGroup = gltf.scene;
        // brainModelGroup.setRotationFromAxisAngle(new THREE.Vector3(0,1,0), angle);
        gltf.scene.traverse( function ( object ) {
            if(object.isMesh){
                if(object.name === 'brain-low-001'){
                    brainParticles = new THREE.Points( object.geometry, brainPointsMaterial );
                }
            }
            
		} );

        sceneBrain.add(brainParticles);
        loadBrainDone = true;

    } );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.autoClear = false;
    container.appendChild( renderer.domElement );

    const axesHelper = new THREE.AxesHelper(1000);
    sceneBrain.add(axesHelper);

    controlsBrain = new THREE.OrbitControls( cameraBrain, container );
    controlsBrain.target.set( controlTarget.x, controlTarget.y, controlTarget.z );

    stats = new Stats();
    container.appendChild( stats.dom );

    document.body.style.touchAction = 'none';
    document.body.addEventListener( 'pointermove', onPointerMove );

    window.addEventListener( 'resize', onWindowResize );

}

function loadTexture(){
    const loader = new THREE.TextureLoader();

    brainPointTexture = loader.load( 'textures/brain/test7.png' );
    brainPointTexture.flipY = false;
    brainPointTexture.encoding = THREE.sRGBEncoding;    
    brainPointTexture.premultiplyAlpha = true;
	brainPointTexture.needsUpdate = true;

}

function initMaterial(){
    brainPointsMaterial = new THREE.PointsMaterial( {   
        size: 0.1, 
        // color: 0xff0000 , 
        map: brainPointTexture,
        blending: THREE.CustomBlending, 
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.DstAlphaFactor,
        blendEquation: THREE.AddEquation,
        depthTest: false, 
        transparent: true
    });



}

function onWindowResize() {

    cameraBrain.aspect = window.innerWidth / window.innerHeight;
    cameraBrain.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onPointerMove( event ) {

    if ( event.isPrimary === false ) return;

    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;

    targetCameraZ = cameraPos.z - mouseX * mouseMovFac;
    targetCameraY = cameraPos.y - mouseY * mouseMovFac;
    targetCameraX = cameraPos.x + mouseY * mouseMovFac;

}

function animate() {

    requestAnimationFrame( animate );

    controlsBrain.update(); // required if damping enabled

    stats.update();

    // updateCamera();

    render();

}

function updateCamera(){
    let accX = Math.abs(cameraBrain.position.x - targetCameraX) * cameraAccFac;
    accX = accX > cameraAccMin ? accX : 0;

    let accY = Math.abs(cameraBrain.position.y - targetCameraY) * cameraAccFac;
    accY = accY > cameraAccMin ? accY : 0;

    let accZ = Math.abs(cameraBrain.position.z - targetCameraZ) * cameraAccFac;
    accZ = accZ > cameraAccMin ? accZ : 0;

    cameraBrain.position.x += Math.sign(targetCameraX - cameraBrain.position.x) * accX;
    cameraBrain.position.y += Math.sign(targetCameraY - cameraBrain.position.y) * accY;
    cameraBrain.position.z += Math.sign(targetCameraZ - cameraBrain.position.z) * accZ;

    cameraBrain.lookAt( cameraTarget );

}

function render() {
    if(!loadBrainDone) return;

    renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );

    renderer.setRenderTarget( null );
    renderer.render( sceneBrain, cameraBrain );

}

init();
animate();