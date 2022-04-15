import { TWEEN } from './examples/jsm/libs/tween.module.min.js';

let renderer;

let sceneScreen, sceneLibra, sceneBrain, sceneLogo;
let cameraLibra, cameraBrain, cameraLogo;
let controls, controlsBrain, controlLogo;

let sssPass;

let depthMaterial, bgMaterial, ssCombineMaterial, ssShowMaterial;
let ssNoiseCombineMaterial, ssNoiseBurntCombineMaterial;
let magnifyingGlassMaterial;

let renderTargetBrain, renderTargetLibra, renderTargetLibraDepth;

let libraModelGroup, brainModelGroup, brainModel, logoModelGroup;

let stats;

let currentAzimuthalAngle;

let lightHelper, shadowCameraHelper;
let lightHelper1, shadowCameraHelper1;


let modelLibraLoadDone = false, modelLogoLoadDone = false;

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
    InBuffer: null,
    InDepthBuffer: null,
    OutBuffer: null,
    OutDepthBuffer: null,
}

let rtBG = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
    { minFilter: THREE.LinearFilter, 
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat,
        encoding: THREE.sRGBEncoding,
    } );


let subsurfaceTexture;
let normalMap;

let burntTexture;
let noiseTexture;
let noiseMixParam = {
    offset: -1.0,
    offsetMin: 0.01,
    offsetMax: 0.21,
    duration: 5000,
};

function init() {

    cameraLibra = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
    cameraLibra.position.set( cameraPos.x, cameraPos.y, cameraPos.z );
    cameraBrain = cameraLibra.clone();

    cameraLogo = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
    cameraLogo.position.set( 0, 0, 12 );

    sceneScreen = new THREE.Scene();
    sceneLibra = new THREE.Scene();
    sceneBrain = new THREE.Scene();
    sceneLogo = new THREE.Scene();


    initSpotLight();

    initRenderTarget();
    loadEnvironment( Object.keys( environments )[ 0 ] );

    loadTexture();

    initSSS();
    loadLibraModelAndInit();
    loadLogoModelAndInit();
    
    initMaterial();

    screeMesh = new THREE.Mesh(new THREE.PlaneGeometry( 2, 2 ), ssCombineMaterial);
    sceneScreen.add(screeMesh);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1;
    document.getElementById('container').appendChild( renderer.domElement );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.outputEncoding = THREE.sRGBEncoding;
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
    
    controlLogo = new THREE.OrbitControls( cameraLogo, container );
    controlLogo.target.set( 0, 0, -0.1 );


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

function initSpotLight(){
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

    /* lightHelper = new THREE.SpotLightHelper( spotLightLibra );
    sceneLibra.add( lightHelper );

    shadowCameraHelper = new THREE.CameraHelper( spotLightLibra.shadow.camera );
    sceneLibra.add( shadowCameraHelper );

    lightHelper1 = new THREE.SpotLightHelper( spotLightBrain );
    sceneBrain.add( lightHelper1 );

    shadowCameraHelper1 = new THREE.CameraHelper( spotLightBrain.shadow.camera );
    sceneBrain.add( shadowCameraHelper1 ); */
}

function switchRtSSCombine(){
    let tempBuf = rtSSCombineSwitch.InBuffer;
    rtSSCombineSwitch.InBuffer = rtSSCombineSwitch.OutBuffer;
    rtSSCombineSwitch.OutBuffer = tempBuf;

    tempBuf = rtSSCombineSwitch.InDepthBuffer;
    rtSSCombineSwitch.InDepthBuffer = rtSSCombineSwitch.OutDepthBuffer;
    rtSSCombineSwitch.OutDepthBuffer = tempBuf;
}

function initSwitchBuffer(){
    rtSSCombineSwitch.InBuffer = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
          magFilter: THREE.NearestFilter,
          format: THREE.RGBFormat,
        } );
    
    rtSSCombineSwitch.InDepthBuffer = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        } );

    rtSSCombineSwitch.OutBuffer = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat,
        } );

    rtSSCombineSwitch.OutDepthBuffer = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        } );

}

function initRenderTarget(){
    initSwitchBuffer();

    renderTargetBrain = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
          magFilter: THREE.NearestFilter,
          format: THREE.RGBFormat,
        } );

    renderTargetLibra = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
          magFilter: THREE.NearestFilter,
          format: THREE.RGBFormat,
        } );

    renderTargetLibraDepth = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        } );
}

function loadEnvironment( name ) {
    if ( environments[ name ].texture !== undefined ) {
        sceneLibra.environment = environments[ name ].texture;
        sceneBrain.environment = environments[ name ].texture;
        sceneLogo.environment = environments[ name ].texture;
        return;

    }

    const filename = environments[ name ].filename;
    new THREE.RGBELoader()
        .setPath( 'textures/equirectangular/' )
        .load( filename, function ( hdrEquirect ) {
            hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
            sceneLibra.environment = hdrEquirect;
            sceneBrain.environment = hdrEquirect;
            sceneLogo.environment = hdrEquirect;
            environments[ name ].texture = hdrEquirect;
        } );
}

function loadTexture(){
    const loader = new THREE.TextureLoader();
    subsurfaceTexture = loader.load( 'models/brain/brain-subsurface-color-1k.png' );
    normalMap = loader.load( 'models/brain/brain-normal-combine-2.png' );
    noiseTexture = loader.load( 'textures/brain/noise4.png' );
    burntTexture = loader.load( 'textures/brain/burnt-edge4.png' );
}

function initSSS(){
    sssPass = new THREE.SSSPass(sceneBrain, cameraBrain, window.innerWidth, window.innerHeight);
    sssPass.setRTMaterialParam({
        map: subsurfaceTexture,
        normalMap: normalMap,
        roughness: 0.3,
        envMapIntensity: 0.1,
    });
    sssPass.noiseTexture = noiseTexture;
    sssPass.sssRadius = 1.0;
}

let Root;
let mixer;

function loadLibraModelAndInit(){
    new THREE.GLTFLoader()
    .setPath( 'models/brain_libra/' )
    .setDRACOLoader( new THREE.DRACOLoader().setDecoderPath( 'models/brain_libra/draco/' ) )
    .load( 'BrainAndBalance20.glb', function ( gltf ) {
        libraModelGroup = gltf.scene;
        mixer = new THREE.AnimationMixer( libraModelGroup );
	    mixer.clipAction( gltf.animations[ 0 ] ).play();

        gltf.scene.traverse( function ( object ) {
            if(object.isMesh){
                if(object.name === 'table'){
                    object.receiveShadow = true;
                    object.position.set( modelPos.x, modelPos.y, modelPos.z );
                }else{
                    if(object.name === 'Brain'){
                        object.attach(spotLightBrain);
                        spotLightBrain.translateY(10.0);
                        spotLightBrain.target = object;

                        object.position.set( modelPos.x, modelPos.y, modelPos.z );

                        brainModel = object;
                    }

                    object.receiveShadow = true;
                    object.castShadow = true;
                }
                object.material.envMap = null;
                object.material.envMapIntensity = 0.1;
                object.materialCopy = object.material;
            }else if(object.isBone){
                if(object.name === 'Root'){
                    Root = object;
                    object.attach(spotLightLibra);
                    spotLightLibra.translateY(10.0);
                    spotLightLibra.target = object;
                    object.position.set( modelPos.x, modelPos.y, modelPos.z );
                }
            }
		} );

        brainModelGroup = new THREE.Group();
        brainModelGroup.add(brainModel);
        sssPass.add(brainModelGroup);

        sceneLibra.add( gltf.scene );
        modelLibraLoadDone = true;
    } );
}

function loadLogoModelAndInit(){
    new THREE.GLTFLoader()
    .setPath( 'models/logo/' )
    .setDRACOLoader( new THREE.DRACOLoader().setDecoderPath( 'models/logo/draco/' ) )
    .load( 'logo1.glb', function ( gltf ) {
        logoModelGroup = gltf.scene;
        gltf.scene.traverse( function ( object ) {
            if(object.isMesh) {
                if(object.name === 'Logo'){
                    // const obj = new THREE.Object3D();
                    // obj.position.copy(cameraLibra.position);
                    // obj.rotation.copy(cameraLibra.rotation);
                    // obj.updateMatrixWorld();

                    // let localPos = new THREE.Vector3(5,3,-10);
                    // object.position.set( localPos.x, localPos.y, localPos.z );
                    // object.applyMatrix4(obj.matrixWorld)
                    // object.scale.setScalar(0.5);

                }
                object.material.envMap = null;
                object.material.envMapIntensity = 0.3;
                object.materialCopy = object.material;
            }
        });

        // sceneLogo.add(gltf.scene);
        sceneLibra.add( gltf.scene );
        modelLogoLoadDone = true;

    } );
}

function initMaterial(){
    depthMaterial = new THREE.ShaderMaterial({
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

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame( animate );

    if(!modelLibraLoadDone || !modelLogoLoadDone) return;

    controls.update(); // required if damping enabled
    controlsBrain.update(); // required if damping enabled
    controlLogo.update();


    // lightHelper.update();
	// shadowCameraHelper.update();
    // lightHelper1.update();
	// shadowCameraHelper1.update();

    stats.update();

    const delta = clock.getDelta();
    mixer.update( delta );

    TWEEN.update();

    render();

}

function render() {

    renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );

    // renderer.setRenderTarget( null );
	// renderer.clear();
    // renderer.render( sceneLogo, cameraLogo );

    sssPass.render(renderer, renderTargetBrain);

    libraModelGroup.traverse( function ( object ) {
        object.material = object.materialCopy;
    } );
    logoModelGroup.traverse( function ( object ) {
        object.material = object.materialCopy;
    } );

    // sceneLibra.background = sceneLibra.environment;
    renderer.setRenderTarget( renderTargetLibra );
    // renderer.setRenderTarget( null );
	renderer.clear();
    renderer.render( sceneLibra, cameraLibra );

    // sceneLibra.background = null;
    libraModelGroup.traverse( function ( object ) {
        object.material = depthMaterial;
    } );
    logoModelGroup.traverse( function ( object ) {
        object.material = depthMaterial;
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

    ssShowMaterial.uniforms[ 'tScreen' ].value = rtSSCombineSwitch.OutBuffer.texture;
    screeMesh.material = ssShowMaterial;
    renderer.setRenderTarget( null );
	renderer.clear();
    renderer.render( sceneScreen, cameraLibra );

    // ssNoiseCombineMaterial.uniforms[ 'tScreen1' ].value = rtBG.texture;
    // ssNoiseCombineMaterial.uniforms[ 'tScreen0' ].value = rtSSCombineSwitch.OutBuffer.texture;
    // ssNoiseCombineMaterial.uniforms[ 'offset' ].value = noiseMixParam.offset;
    // screeMesh.material = ssNoiseCombineMaterial;
    // renderer.setRenderTarget( null );
	// renderer.clear();
    // renderer.render( sceneScreen, cameraLibra );

    
    // ssNoiseBurntCombineMaterial.uniforms[ 'tScreen1' ].value = rtBG.texture;
    // ssNoiseBurntCombineMaterial.uniforms[ 'tScreen0' ].value = rtSSCombineSwitch.OutBuffer.texture;
    // ssNoiseBurntCombineMaterial.uniforms[ 'offset' ].value = noiseMixParam.offset;
    // screeMesh.material = ssNoiseBurntCombineMaterial;
    // renderer.setRenderTarget( null );
	// renderer.clear();
    // renderer.render( sceneScreen, cameraLibra );

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

        Root.position.setX(value);
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
        Root.position.setY(value);
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
        Root.position.setZ(value);
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
    gui.close();
}

init();
buildGui();
animate();