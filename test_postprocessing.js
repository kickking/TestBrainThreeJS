
let sceneScreen;

let camera;

let renderer;

let screenMesh;

let ssTestBlurMFMaterial;

function init(){
    const container = document.createElement( 'div' );
	document.body.appendChild( container );

    sceneScreen = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
    camera.position.set( 0, 0, 5 );

    initMaterial();

    screenMesh = new THREE.Mesh(new THREE.PlaneGeometry( 2, 2 ), ssTestBlurMFMaterial);
    sceneScreen.add(screenMesh);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );

    document.body.style.touchAction = 'none';
    document.body.addEventListener( 'pointermove', onPointerMove );

    window.addEventListener( 'resize', onWindowResize );

}

function initMaterial(){

    ssTestBlurMFMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSTestBlurMFShader.uniforms ),
        vertexShader: THREE.SSTestBlurMFShader.vertexShader,
        fragmentShader: THREE.SSTestBlurMFShader.fragmentShader,
        depthWrite: false,
    });

    ssTestBlurMFMaterial.uniforms[ 'resolution' ].value = new THREE.Vector2(window.innerWidth , window.innerHeight);
    ssTestBlurMFMaterial.uniforms[ 'devicePixelRatio' ].value = window.devicePixelRatio;
}

const mousePos = new THREE.Vector2(0,0);

function onPointerMove( event ) {

    if ( event.isPrimary === false ) return;

    mousePos.set(event.clientX, event.clientY);

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate(){
    requestAnimationFrame( animate );

    render();
}

function render(){

    renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );

    ssTestBlurMFMaterial.uniforms[ 'mousePos' ].value = mousePos;
    renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneScreen, camera );
}

init();
animate();