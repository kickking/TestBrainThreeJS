let renderer;

let sceneScreen, sceneLibra, sceneBrain, sceneBG;
let cameraLibra, cameraBrain, cameraBG;
let controls, controlsBrain, controlBG;

let sssPass;

let libraDepthMaterial, bgMaterial, ssCombineMaterial, ssShowMaterial;
let ssNoiseCombineMaterial, ssNoiseBurntCombineMaterial;

let renderTargetBrain, renderTargetLibra, renderTargetLibraDepth;

let libraModelGroup, brainModelGroup, brainModel;

let stats;

let currentAzimuthalAngle;

let lightHelper, shadowCameraHelper;
let lightHelper1, shadowCameraHelper1;


let loadDone = false, loadBrainDone = false;

let gui;
const cameraPos = new THREE.Vector3(10,6,12);

const modelRotate = 0;
const modelPos = new THREE.Vector3(-3, -3, 3);
const controlTarget = new THREE.Vector3(0,0,0);

const environments = {
    'loft_hall': { filename: 'photo_studio_loft_hall_1k.hdr' },        
    'artist_workshop': { filename: 'artist_workshop_1k.hdr' },
    'christmas': { filename: 'christmas_photo_studio_01_1k.hdr' },
    'cayley_interior': { filename: 'cayley_interior_1k.hdr' },
    
};

let spotLightLibra, spotLightBrain; 

let screeMesh;

let rtSSCombineSwitch = {
    InBuffer: new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
          magFilter: THREE.NearestFilter,
          format: THREE.RGBFormat,
          encoding: THREE.sRGBEncoding,
        } ),
    InDepthBuffer: new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        } ),
    OutBuffer: new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat,
            encoding: THREE.sRGBEncoding,
        } ),
    OutDepthBuffer: new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        } ),
};

let rtBG = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
    { minFilter: THREE.LinearFilter, 
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat,
        encoding: THREE.sRGBEncoding,
    } );

let burntTexture;
let noiseTexture;
let noiseMixParam = {
    offset: -1.0,
    offsetMin: 0.01,
    offsetMax: 0.21,
    duration: 5000,
};

import { TWEEN } from './examples/jsm/libs/tween.module.min.js';

function switchRtSSCombine(){
    let tempBuf = rtSSCombineSwitch.InBuffer;
    rtSSCombineSwitch.InBuffer = rtSSCombineSwitch.OutBuffer;
    rtSSCombineSwitch.OutBuffer = tempBuf;

    tempBuf = rtSSCombineSwitch.InDepthBuffer;
    rtSSCombineSwitch.InDepthBuffer = rtSSCombineSwitch.OutDepthBuffer;
    rtSSCombineSwitch.OutDepthBuffer = tempBuf;
}

function init() {
    const container = document.createElement( 'div' );
	document.body.appendChild( container );

    cameraLibra = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
    cameraLibra.position.set( cameraPos.x, cameraPos.y, cameraPos.z );
    cameraBrain = cameraLibra.clone();

    cameraBG = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 1000 );
    cameraBG.position.set( 0, 0, 0 );
    // cameraBG.lookAt(new THREE.Vector3(0, -1, 0.001))
    // console.log(cameraBG)


    sceneScreen = new THREE.Scene();
    sceneLibra = new THREE.Scene();
    sceneBrain = new THREE.Scene();
    sceneBG = new THREE.Scene();

    spotLightLibra = new THREE.SpotLight( 0xffffff, 1.3 );
    spotLightLibra.angle = Math.PI / 4.3;
    spotLightLibra.penumbra = 0.1;
    spotLightLibra.decay = 2;
    spotLightLibra.distance = 200;

    spotLightLibra.castShadow = true;
    spotLightLibra.shadow.mapSize.width = 512;
    spotLightLibra.shadow.mapSize.height = 512;
    spotLightLibra.shadow.camera.near = 1;
    spotLightLibra.shadow.camera.far = 20;
    spotLightLibra.shadow.focus = 1;

    spotLightBrain = spotLightLibra.clone();


    // lightHelper = new THREE.SpotLightHelper( spotLightLibra );
    // sceneLibra.add( lightHelper );

    // shadowCameraHelper = new THREE.CameraHelper( spotLightLibra.shadow.camera );
    // sceneLibra.add( shadowCameraHelper );

    // lightHelper1 = new THREE.SpotLightHelper( spotLightBrain );
    // sceneBrain.add( lightHelper1 );

    // shadowCameraHelper1 = new THREE.CameraHelper( spotLightBrain.shadow.camera );
    // sceneBrain.add( shadowCameraHelper1 );

    renderTargetBrain = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
          magFilter: THREE.NearestFilter,
          format: THREE.RGBFormat,
          encoding: THREE.sRGBEncoding,
        } );

    renderTargetLibra = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
          magFilter: THREE.NearestFilter,
          format: THREE.RGBFormat,
          encoding: THREE.sRGBEncoding,
        } );

    renderTargetLibraDepth = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        } );

    loadEnvironment( Object.keys( environments )[ 0 ] );


    bgMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.EnvShader.uniforms ),
        vertexShader: THREE.EnvShader.vertexShader,
        fragmentShader: THREE.EnvShader.fragmentShader,
        side: THREE.BackSide,
    });
    bgMaterial.uniforms[ 'Intensity' ].value = 1.0;
    const geometryBG = new THREE.SphereGeometry( 1, 60, 40 );
    const meshBG = new THREE.Mesh( geometryBG, bgMaterial );
    meshBG.position.set(0,0,0);
    sceneBG.add( meshBG );


    const loader = new THREE.TextureLoader();
    const subsurfaceTexture = loader.load( 'models/brain/brain-subsurface-color.png' );
    const normalMap = loader.load( 'models/brain/brain-normal-combine-2.png' );
    noiseTexture = loader.load( 'textures/brain/noise4.png' );
    burntTexture = loader.load( 'textures/brain/burnt-edge4.png' );

    sssPass = new THREE.SSSPass(sceneBrain, cameraBrain, window.innerWidth, window.innerHeight);
    sssPass.setRTMaterialParam({
        map: subsurfaceTexture,
        normalMap: normalMap,
        roughness: 0.3,
        envMapIntensity: 0.1,
    });
    sssPass.noiseTexture = noiseTexture;
    sssPass.sssRadius = 1.0;

    const pos = new THREE.Vector3(modelPos.x, modelPos.y, modelPos.z);
    const angle = modelRotate * Math.PI / 180;


    new THREE.GLTFLoader()
    .setPath( 'models/brain_libra/' )
    .setDRACOLoader( new THREE.DRACOLoader().setDecoderPath( 'models/brain_libra/draco/' ) )
    .load( 'BrainAndBalance9.glb', function ( gltf ) {
        libraModelGroup = gltf.scene;
        libraModelGroup.setRotationFromAxisAngle(new THREE.Vector3(0,1,0), angle);
        gltf.scene.traverse( function ( object ) {
            if(object.isMesh){
                if(object.name === 'table'){
                    object.receiveShadow = true;
                }else{
                    if(object.name === 'bracket'){
                        object.attach(spotLightLibra);
                        spotLightLibra.translateY(10.0);
                        spotLightLibra.target = object;

                    }
                    object.receiveShadow = true;
                    object.castShadow = true;
                    
                }
                object.position.set( pos.x, pos.y, pos.z );
                object.material.envMap = null;
                object.material.envMapIntensity = 0.1;

                object.materialCopy = object.material;
            }
            
		} );
        sceneLibra.add( gltf.scene );

        loadDone = true;
    } );

    new THREE.GLTFLoader()
    .setPath( 'models/brain/' )
    .load( 'Brain.gltf', function ( gltf ) {
        brainModelGroup = gltf.scene;
        brainModelGroup.setRotationFromAxisAngle(new THREE.Vector3(0,1,0), angle);
        gltf.scene.traverse( function ( object ) {
            if(object.isMesh){
                object.castShadow = true;

                if(object.name === 'brain-low'){
                    object.attach(spotLightBrain);
                    spotLightBrain.translateY(10.0);
                    spotLightBrain.target = object;
                }
                object.position.set( pos.x, pos.y, pos.z );
            }
            
		} );
        sssPass.add(gltf.scene);
        loadBrainDone = true;

    } );

    initMaterial();

    screeMesh = new THREE.Mesh(new THREE.PlaneGeometry( 2, 2 ), ssCombineMaterial);
    sceneScreen.add(screeMesh);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.outputEncoding = THREE.sRGBEncoding;
    // renderer.outputEncoding = THREE.LinearEncoding;
    container.appendChild( renderer.domElement );

    const axesHelper = new THREE.AxesHelper(1000);
    sceneScreen.add(axesHelper);

    controls = new THREE.OrbitControls( cameraLibra, container );
    currentAzimuthalAngle = controls.getAzimuthalAngle();
    controls.target.set( controlTarget.x, controlTarget.y, controlTarget.z );
    // controls.enabled = false;
    // controls.update();

    controlsBrain = new THREE.OrbitControls( cameraBrain, container );
    controlsBrain.target.set( controlTarget.x, controlTarget.y, controlTarget.z );
    // controlsBrain.enabled = false;
    // controlsBrain.update();
    
    controlBG = new THREE.OrbitControls( cameraBG, container );
    controlBG.target.set( 0, 0, -0.1 );


    stats = new Stats();
    container.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize );
    window.addEventListener( 'pointerdown', function(event){
        new TWEEN.Tween( noiseMixParam )
        .to( {offset : 1.0}, noiseMixParam.duration )
        .easing( TWEEN.Easing.Linear.None )
        .start();
    });
}

function initMaterial(){
    libraDepthMaterial = new THREE.ShaderMaterial({
        vertexShader: THREE.DepthShader.vertexShader,
        fragmentShader: THREE.DepthShader.fragmentShader,
    });

    ssCombineMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSDepthCombineShader.uniforms ),
        vertexShader: THREE.SSDepthCombineShader.vertexShader,
        fragmentShader: THREE.SSDepthCombineShader.fragmentShader,
        depthWrite: false,
    });

    ssCombineMaterial.uniforms[ 'tScreen0' ].value = renderTargetBrain.texture;
    ssCombineMaterial.uniforms[ 'tDepth0' ].value = sssPass.renderTargetDepth.texture;
    ssCombineMaterial.uniforms[ 'tScreen1' ].value = renderTargetLibra.texture;
    ssCombineMaterial.uniforms[ 'tDepth1' ].value = renderTargetLibraDepth.texture;

    ssShowMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSShowShader.uniforms ),
        vertexShader: THREE.SSShowShader.vertexShader,
        fragmentShader: THREE.SSShowShader.fragmentShader,
        depthWrite: false,
    });
    
    ssNoiseCombineMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSNoiseCombineShader.uniforms ),
        vertexShader: THREE.SSNoiseCombineShader.vertexShader,
        fragmentShader: THREE.SSNoiseCombineShader.fragmentShader,
        depthWrite: false,
    });

    ssNoiseCombineMaterial.uniforms[ 'tNoise' ].value = noiseTexture;

    ssNoiseBurntCombineMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSNoiseBurntCombineShader.uniforms ),
        vertexShader: THREE.SSNoiseBurntCombineShader.vertexShader,
        fragmentShader: THREE.SSNoiseBurntCombineShader.fragmentShader,
        depthWrite: false,
    });

    ssNoiseBurntCombineMaterial.uniforms[ 'tNoise' ].value = noiseTexture;
    ssNoiseBurntCombineMaterial.uniforms[ 'tBurnt' ].value = burntTexture;
    ssNoiseBurntCombineMaterial.uniforms[ 'offsetMin' ].value = noiseMixParam.offsetMin;
    ssNoiseBurntCombineMaterial.uniforms[ 'offsetMax' ].value = noiseMixParam.offsetMax;
    
}

function onWindowResize() {

    cameraLibra.aspect = window.innerWidth / window.innerHeight;
    cameraLibra.updateProjectionMatrix();

    cameraBrain.aspect = window.innerWidth / window.innerHeight;
    cameraBrain.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    controls.update(); // required if damping enabled
    controlsBrain.update(); // required if damping enabled
    controlBG.update();


    // lightHelper.update();
	// shadowCameraHelper.update();
    // lightHelper1.update();
	// shadowCameraHelper1.update();

    stats.update();
    // updateAngle();

    TWEEN.update();

    render();

}

function updateAngle() {
    if(!loadDone || !loadBrainDone) return;
    const angle = controls.getAzimuthalAngle();
    const delta = angle - currentAzimuthalAngle;

    libraModelGroup.rotateOnAxis(new THREE.Vector3(0,1,0), delta);
    brainModelGroup.rotateOnAxis(new THREE.Vector3(0,1,0), delta);
    currentAzimuthalAngle = angle;
}

function render() {
    if(!loadDone || !loadBrainDone) return;

    renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );

    renderer.setRenderTarget( rtBG );
    // renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneBG, cameraBG );

    // sssPass.render(renderer, null);
    sssPass.render(renderer, renderTargetBrain);

    libraModelGroup.traverse( function ( object ) {
        object.material = object.materialCopy;
    } );

    // sceneLibra.background = sceneLibra.environment;
    renderer.setRenderTarget( renderTargetLibra );
    // renderer.setRenderTarget( null );
	renderer.clear();
    renderer.render( sceneLibra, cameraLibra );

    // sceneLibra.background = null;
    libraModelGroup.traverse( function ( object ) {
        object.material = libraDepthMaterial;
    } );
    renderer.setRenderTarget( renderTargetLibraDepth );
    // renderer.setRenderTarget( null );
	renderer.clear();
    renderer.render( sceneLibra, cameraLibra );

    screeMesh.material = ssCombineMaterial;
    // renderer.setRenderTarget( null );
    renderer.setRenderTarget( rtSSCombineSwitch.OutBuffer );
	renderer.clear();
    renderer.render( sceneScreen, cameraLibra );

    // ssShowMaterial.uniforms[ 'tScreen' ].value = rtSSCombineSwitch.OutBuffer.texture;
    // screeMesh.material = ssShowMaterial;
    // renderer.setRenderTarget( null );
	// renderer.clear();
    // renderer.render( sceneScreen, cameraLibra );

    // ssNoiseCombineMaterial.uniforms[ 'tScreen1' ].value = rtBG.texture;
    // ssNoiseCombineMaterial.uniforms[ 'tScreen0' ].value = rtSSCombineSwitch.OutBuffer.texture;
    // ssNoiseCombineMaterial.uniforms[ 'offset' ].value = noiseMixParam.offset;
    // screeMesh.material = ssNoiseCombineMaterial;
    // renderer.setRenderTarget( null );
	// renderer.clear();
    // renderer.render( sceneScreen, cameraLibra );

    
    ssNoiseBurntCombineMaterial.uniforms[ 'tScreen1' ].value = rtBG.texture;
    ssNoiseBurntCombineMaterial.uniforms[ 'tScreen0' ].value = rtSSCombineSwitch.OutBuffer.texture;
    ssNoiseBurntCombineMaterial.uniforms[ 'offset' ].value = noiseMixParam.offset;
    screeMesh.material = ssNoiseBurntCombineMaterial;
    renderer.setRenderTarget( null );
	renderer.clear();
    renderer.render( sceneScreen, cameraLibra );

}

function loadEnvironment( name ) {
    if ( environments[ name ].texture !== undefined ) {

        sceneLibra.environment = environments[ name ].texture;
        sceneBrain.environment = environments[ name ].texture;

        bgMaterial.uniforms[ 'tBackground' ].value = environments[ name ].texture;

        return;

    }

    const filename = environments[ name ].filename;
    new THREE.RGBELoader()
        .setPath( 'textures/equirectangular/' )
        .load( filename, function ( hdrEquirect ) {

            hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;

            bgMaterial.uniforms[ 'tBackground' ].value = hdrEquirect;

            sceneLibra.environment = hdrEquirect;
            sceneBrain.environment = hdrEquirect;

            environments[ name ].texture = hdrEquirect;

        } );
}

function buildGui() {
    const GeneralParams = {

        environment: Object.keys( environments )[ 0 ],
        camearX: cameraPos.x,
        camearY: cameraPos.y,
        camearZ: cameraPos.z,
        modelRotate: modelRotate,
        modelPosX: modelPos.x,
        modelPosY: modelPos.y,
        modelPosZ: modelPos.z,
        controlTargetX: controlTarget.x,
        controlTargetY: controlTarget.y,
        controlTargetZ: controlTarget.z,

    };

    gui = new dat.GUI();

    const folder1 = gui.addFolder( 'General' );
    const folder2 = gui.addFolder( 'SpotLight' );

    folder1.add( GeneralParams, 'environment', Object.keys( environments ) ).onChange( function ( value ) {

        loadEnvironment( value );

    } );
    folder1.add(GeneralParams, 'camearX', -30, 30, 0.1).onChange( function ( value ) {
        cameraLibra.position.x = value;
        cameraBrain.position.x = value;
    } );
    folder1.add(GeneralParams, 'camearY', -30, 30, 0.1).onChange( function ( value ) {
        cameraLibra.position.y = value;
        cameraBrain.position.y = value;
    } );
    folder1.add(GeneralParams, 'camearZ', -30, 30, 0.1).onChange( function ( value ) {
        cameraLibra.position.z = value;
        cameraBrain.position.z = value;
    } );

    folder1.add(GeneralParams, 'modelRotate', -360, 360, 1).onChange( function ( value ) {
        const modelRotateRadian = value * Math.PI / 180;
        libraModelGroup.setRotationFromAxisAngle(new THREE.Vector3(0,1,0), modelRotateRadian);
        brainModelGroup.setRotationFromAxisAngle(new THREE.Vector3(0,1,0), modelRotateRadian);

    } );

    folder1.add(GeneralParams, 'modelPosX', -30, 30, 0.1).onChange( function ( value ) {
        libraModelGroup.traverse( function ( object ) {
            if(object.isMesh){
                object.position.x = value;
            }
		} );
        brainModelGroup.traverse( function ( object ) {
            if(object.isMesh){
                object.position.x = value;
            }
		} );
    } );
    folder1.add(GeneralParams, 'modelPosY', -30, 30, 0.1).onChange( function ( value ) {
        libraModelGroup.traverse( function ( object ) {
            if(object.isMesh){
                object.position.y = value;
            }
		} );
        brainModelGroup.traverse( function ( object ) {
            if(object.isMesh){
                object.position.y = value;
            }
		} );
    } );
    folder1.add(GeneralParams, 'modelPosZ', -30, 30, 0.1).onChange( function ( value ) {
        libraModelGroup.traverse( function ( object ) {
            if(object.isMesh){
                object.position.z = value;
            }
		} );
        brainModelGroup.traverse( function ( object ) {
            if(object.isMesh){
                object.position.z = value;
            }
		} );
    } );

    folder1.add(GeneralParams, 'controlTargetX', -30, 30, 0.1).onChange( function ( value ) {
        controls.target.x = value;
        controlsBrain.target.x = value;
    } );
    folder1.add(GeneralParams, 'controlTargetY', -30, 30, 0.1).onChange( function ( value ) {
        controls.target.y = value;
        controlsBrain.target.y = value;
    } );
    folder1.add(GeneralParams, 'controlTargetZ', -30, 30, 0.1).onChange( function ( value ) {
        controls.target.z = value;
        controlsBrain.target.z = value;
    } );

    const SpotLightParams = {
        'light color': spotLightLibra.color.getHex(),
        intensity: spotLightLibra.intensity,
        distance: spotLightLibra.distance,
        angle: spotLightLibra.angle,
        penumbra: spotLightLibra.penumbra,
        decay: spotLightLibra.decay,
        focus: spotLightLibra.shadow.focus
    };

    folder2.addColor( SpotLightParams, 'light color' ).onChange( function ( val ) {

        spotLightLibra.color.setHex( val );
        render();

    } );

    folder2.add( SpotLightParams, 'intensity', 0, 2 ).onChange( function ( val ) {

        spotLightLibra.intensity = val;
        render();

    } );


    folder2.add( SpotLightParams, 'distance', 50, 200 ).onChange( function ( val ) {

        spotLightLibra.distance = val;
        render();

    } );

    folder2.add( SpotLightParams, 'angle', 0, Math.PI / 3 ).onChange( function ( val ) {

        spotLightLibra.angle = val;
        render();

    } );

    folder2.add( SpotLightParams, 'penumbra', 0, 1 ).onChange( function ( val ) {

        spotLightLibra.penumbra = val;
        render();

    } );

    folder2.add( SpotLightParams, 'decay', 1, 2 ).onChange( function ( val ) {

        spotLightLibra.decay = val;
        render();

    } );

    folder2.add( SpotLightParams, 'focus', 0, 1 ).onChange( function ( val ) {

        spotLightLibra.shadow.focus = val;
        render();

    } );
    // folder1.open();
    // folder2.open();
}

init();
buildGui();
animate();