let camera, scene, renderer, controls, clock, mixer;

init();
animate();

function init() {

    const container = document.createElement( 'div' );
	document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
	camera.position.set( 15, 15, 0 );

    scene = new THREE.Scene();

    const environments = {

        'christmas': { filename: 'christmas_photo_studio_05_1k.hdr' },
        'loft_hall': { filename: 'photo_studio_loft_hall_1k.hdr' }

    };

    function loadEnvironment( name ) {
        if ( environments[ name ].texture !== undefined ) {

            scene.background = environments[ name ].texture;
            scene.environment = environments[ name ].texture;
            return;

        }

        const filename = environments[ name ].filename;
        new THREE.RGBELoader()
            .setPath( 'textures/equirectangular/' )
            .load( filename, function ( hdrEquirect ) {

                hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;

                scene.background = hdrEquirect;
                scene.environment = hdrEquirect;
                environments[ name ].texture = hdrEquirect;

            } );
    }

    const params = {

        environment: Object.keys( environments )[ 0 ]

    };
    loadEnvironment( params.environment );

    const gui = new dat.GUI();
    gui.add( params, 'environment', Object.keys( environments ) ).onChange( function ( value ) {

        loadEnvironment( value );

    } );
    gui.open();

    // model

    new THREE.GLTFLoader()
    .setPath( 'models/brain_libra/' )
    .setDRACOLoader( new THREE.DRACOLoader().setDecoderPath( 'models/brain_libra/draco/' ) )
    .load( 'BrainAndBalance8.glb', function ( gltf ) {
        // console.log(gltf);
        // console.log(gltf.scene);
        // console.log(gltf.scene.children);
        // gltf.scene.traverse( function ( object ) {
		// 	console.log(object)
		// } );

        scene.add( gltf.scene );

    } );

    // new THREE.RGBELoader()
    //     .setPath( 'textures/equirectangular/' )
    //     .load( 'photo_studio_loft_hall_1k.hdr', function ( texture ) {

    //         texture.mapping = THREE.EquirectangularReflectionMapping;

    //         scene.background = texture;
    //         scene.environment = texture;

    //     } );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    // controls.enableDamping = true;
    // controls.minDistance = 0.5;
    // controls.maxDistance = 1;
    controls.target.set( 0, 0.1, 0 );
    controls.update();

    // const axesHelper = new THREE.AxesHelper(1000);
    // scene.add(axesHelper);

    window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    controls.update(); // required if damping enabled

    render();

}

function render() {

    renderer.render( scene, camera );

}