let container, stats;
let renderer;
let camera;
let scene;
let model;

init();
animate();

function init() {
    container = document.createElement( 'div' );
	document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 5000 );
	camera.position.set( 0, 300, 400 * 4 );

    scene = new THREE.Scene();

    // Lights
    scene.add( new THREE.AmbientLight( 0x888888 ) );

    const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.03 );
    directionalLight.position.set( 0.0, 0.5, 0.5 ).normalize();
    scene.add( directionalLight );

    const pointLight1 = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), 
    new THREE.MeshBasicMaterial( { color: 0x888888 } ) );
    pointLight1.add( new THREE.PointLight( 0xffffff, 1, 500 ) );
    scene.add( pointLight1 );
    pointLight1.position.x = 0;
    pointLight1.position.y = - 50;
    pointLight1.position.z = 350;

    const pointLight2 = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), 
    new THREE.MeshBasicMaterial( { color: 0x888800 } ) );
    pointLight2.add( new THREE.PointLight( 0xffffff, 1, 500 ) );
    scene.add( pointLight2 );
    pointLight2.position.x = - 100;
    pointLight2.position.y = 20;
    pointLight2.position.z = - 260;

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.setScissorTest( true );
    container.appendChild( renderer.domElement );
    renderer.outputEncoding = THREE.sRGBEncoding;

    //

    stats = new Stats();
    container.appendChild( stats.dom );

    const axesHelper = new THREE.AxesHelper(1000);
    scene.add(axesHelper);


    const controls = new THREE.OrbitControls( camera, container );
    controls.minDistance = 500;
    controls.maxDistance = 3000;

    window.addEventListener( 'resize', onWindowResize );

    initMaterial();
}

function initMaterial(){
    const loader = new THREE.TextureLoader();
    const imgTexture = loader.load( 'models/brain/brain-base-color.png' );
    const subsurfaceTexture = loader.load( 'models/brain/brain-subsurface-color.png' );
    const thicknessTexture = loader.load( 'models/brain/brain-thickness.png' );
    const normalMap = loader.load( 'models/brain/brain-normal-combine-2.png' );

    imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;

    // const shader = THREE.SubsurfaceScatteringPhysicalShader;
    // // const shader = THREE.SubsurfaceScatteringShader;
    // const uniforms = THREE.UniformsUtils.clone( shader.uniforms );

    // uniforms[ 'map' ].value = imgTexture;
    // uniforms[ 'normalMap' ].value = normalMap;

    // // uniforms[ 'diffuse' ].value = new THREE.Vector3( 1.0, 0.2, 0.2 );
    // // uniforms[ 'shininess' ].value = 500;

    // uniforms[ 'roughness' ].value = 0.1;


    // uniforms[ 'thicknessMap' ].value = thicknessTexture;
    // uniforms[ 'thicknessColorMap' ].value = subsurfaceTexture;
    // uniforms[ 'thicknessDistortion' ].value = 0.1;
    // uniforms[ 'thicknessAmbient' ].value = 0.4;
    // uniforms[ 'thicknessAttenuation' ].value = 0.8;
    // uniforms[ 'thicknessPower' ].value = 2.0;
    // uniforms[ 'thicknessScale' ].value = 16.0;

    // const material = new THREE.ShaderMaterial( {
    //     uniforms: uniforms,
    //     vertexShader: shader.vertexShader,
    //     fragmentShader: shader.fragmentShader,
    //     defines: {
	// 		"STANDARD": '',
	// 	},
    //     lights: true,
    // } );
    // // material.map = imgTexture;
    // material.normalMap = normalMap;
    // material.extensions.derivatives = true;

    // // console.log(material.fragmentShader)
    // // const material = new THREE.MeshPhongMaterial({
    // //     map: imgTexture,
    // //     normalMap: normalMap,
    // //     diffuse: new THREE.Vector3( 1.0, 0.2, 0.2 ),
    // // });

    const material = modifyMaterial();
    material.map = imgTexture;
    material.normalMap = normalMap;
    material.roughness = 0.1;

    // const material = new THREE.MeshStandardMaterial({
    //     map: imgTexture,
    //     normalMap: normalMap,
    //     normalScale: new THREE.Vector2( 1, 1 ),
    //     roughness: 0.1,
    // });

    // const material = new THREE.MeshPhysicalMaterial({
    //     normalScale: new THREE.Vector2( 2, 2 ),
    //     roughness: 0.1,
    //     // thickness: 0.1,
    //     // thicknessMap: subsurfaceTexture
    // });
    // material.map = imgTexture;
    // material.normalMap = normalMap;

    // LOADER

	const loaderFBX = new THREE.FBXLoader();
    loaderFBX.load( 'models/brain/brain6.fbx', function ( object ) {

        model = object.children[ 0 ];
        model.position.set( 0, 0, 10 );
        model.scale.setScalar( 80 );
        model.material = material;
        scene.add( model );

    } );
    
    // initGUI( uniforms );
}

function modifyMaterial() {
    const material = new THREE.MeshStandardMaterial();
    material.onBeforeCompile = function(shader){

        // console.log( shader.uniforms );
        // console.log( shader.vertexShader );
        // console.log( shader.fragmentShader );
    };

    return material;
}

function initGUI( uniforms ) {
    const gui = new dat.GUI();

    // const ThicknessControls = function () {

    //     this.distortion = uniforms[ 'thicknessDistortion' ].value;
    //     this.ambient = uniforms[ 'thicknessAmbient' ].value;
    //     this.attenuation = uniforms[ 'thicknessAttenuation' ].value;
    //     this.power = uniforms[ 'thicknessPower' ].value;
    //     this.scale = uniforms[ 'thicknessScale' ].value;

    // };

    // const thicknessControls = new ThicknessControls();
    // const thicknessFolder = gui.addFolder( 'Thickness Control' );

    // thicknessFolder.add( thicknessControls, 'distortion' ).min( 0.01 ).max( 1 ).step( 0.01 ).onChange( function () {

    //     uniforms[ 'thicknessDistortion' ].value = thicknessControls.distortion;

    // } );

    // thicknessFolder.add( thicknessControls, 'ambient' ).min( 0.01 ).max( 5.0 ).step( 0.05 ).onChange( function () {

    //     uniforms[ 'thicknessAmbient' ].value = thicknessControls.ambient;

    // } );

    // thicknessFolder.add( thicknessControls, 'attenuation' ).min( 0.01 ).max( 5.0 ).step( 0.05 ).onChange( function () {

    //     uniforms[ 'thicknessAttenuation' ].value = thicknessControls.attenuation;

    // } );

    // thicknessFolder.add( thicknessControls, 'power' ).min( 0.01 ).max( 16.0 ).step( 0.1 ).onChange( function () {

    //     uniforms[ 'thicknessPower' ].value = thicknessControls.power;

    // } );

    // thicknessFolder.add( thicknessControls, 'scale' ).min( 0.01 ).max( 50.0 ).step( 0.1 ).onChange( function () {

    //     uniforms[ 'thicknessScale' ].value = thicknessControls.scale;

    // } );

    // thicknessFolder.open();
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    requestAnimationFrame( animate );

    render();

    stats.update();

}

function render() {

    // if ( model ) model.rotation.z = performance.now() / 5000;

    renderer.render( scene, camera );
}