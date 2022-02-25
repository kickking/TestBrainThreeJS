import { TWEEN } from './examples/jsm/libs/tween.module.min.js';

let sceneCells, sceneScreen;
let sceneNucleusDepth;
let sceneCSS;

let camera;

let renderer;
let rendererCSS;

let loadDone = false;

let membraneNormalMap, membraneNormalMap1, membraneDispMap, membraneDispMap1;
let nucleusBaseColor, nucleusNormalMap, nucleusNormalMap1, nucleusDispMap, nucleusDispMap1;

let nucleusDepthMaterial;
let membraneMaterial, nucleusMaterial;

const membraneList = [];
const nucleusList = [];
const nucleusDepthList = [];
const axonPointsList = [];
const objectCSSList = [];

const axon = new THREE.Axon({
    AxonCount : 12,
    AxonRootRotAxisAngleMax: 10,
    AxonRadiusMax: 0.15,
    AxonRadiusMin: 0.003,
    AxonSplitRatio: 0.02,
    AxonLayerMaxCount: 100,
    AxonLayerMaxLength: 0.03,
    AxonLayerMinLength: 0.014,
    AxonLayerTotalMaxLength: 3,
    AxonRotAxisMaxAngle:  5,
    AxonSegments: 18,
    AxonRadiusAttenuationSpeed: 4,
    AxonSizeAttenuationSpeed: 2,
    AxonColorIntensity: 0.2,
});

let ssShowMaterial, ssBlurMaterial, ssBlurMFMaterial, ssDarkenMFMaterial;
let pointMaterial, spherePointsMaterial, axonPointsMaterial;

let pointTexture;

let noiseTexture;

let renderTargetNucleusDepth;
let renderTargetCell;

let particleMesh;
let screenMesh;

let controls;

let stats;

let gui;

const environments = {
    // 'loft_hall': { filename: 'photo_studio_loft_hall_1k.hdr' },        
    // 'artist_workshop': { filename: 'artist_workshop_1k.hdr' },
    // 'christmas': { filename: 'christmas_photo_studio_01_1k.hdr' },
    // 'cayley_interior': { filename: 'cayley_interior_1k.hdr' },
    'dikhololo_night': { filename: 'dikhololo_night_1k.hdr' },
    'quarry': { filename: 'quarry_04_1k.hdr' },
    
};

const cameraPos = new THREE.Vector3(0,0,5.5);
const cameraTarget = new THREE.Vector3(0,-0.0,0);

const cellData = [
    [1.0, 1.0, 1.0], "一字长蛇阵",
    [0.8, -1.7, -1.6], "二龙出水阵",
    [-1.0, -0.9, -1.5], "天地三才阵",
    [-1.2, 1.1, 0.1], "四门兜底阵",
    [-2.0, 0.3, 2.0], "五虎群羊阵",
    [1.5, -0.4, 2.3], "六丁六甲阵",
    [-2.4, -0.9, 0.3], "七星北斗阵",
    [-0.0, 0.3, 0.0], "八门金锁阵",
    [4.0, 1.5, -1.8], "九字连环阵",
];
const cellDataUnit = 2;

const cellScale = 0.2;
const cellParticleCount = 2000;
const cellTxtDisRaduis = 1.33 * cellScale * 1.5;
const cellParticleDisRaduisMin = 1.33 * cellScale;
const cellParticleDisRaduisMax = 1.33 * cellScale * 3;
const cellsGroup = new THREE.Group();
const cellsDepthGroup = new THREE.Group();

const cssScale = 0.01;

function init(){

    sceneCells = new THREE.Scene();
    sceneScreen = new THREE.Scene();
    sceneNucleusDepth = new THREE.Scene();
    sceneCSS = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
    camera.position.set( cameraPos.x, cameraPos.y, cameraPos.z );

    initRenderTarget();

    loadTexture();
    
    loadEnvironment( Object.keys( environments )[ 0 ] );

    initMaterial();


    const particleGeometry = new THREE.BufferGeometry();
    const particleVertices = [];
    const particleRadii = [];
    const particleSphereCoords = [];
    const particleUVs = [];
    const particleColors = [];
    const particleColor = new THREE.Color();

    for ( let i = 0; i < 3000; i ++ ) {
        const r = 0.0 + 
        Math.random() * (5.0 - 0.0);
        const theta = Math.random() * Math.PI; //zenith
        const phi = Math.random() * Math.PI * 2; //Azimuth
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        particleVertices.push( x, y, z );
        particleRadii.push(r);
        particleSphereCoords.push(theta, phi);
        particleUVs.push(Math.random(), Math.random());

        particleColor.setRGB(Math.random(), Math.random(), Math.random());
        particleColors.push(particleColor.r, particleColor.g, particleColor.b);
        
                
    }
    particleGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( particleVertices, 3 ) );
    particleGeometry.setAttribute( 'radius', new THREE.Float32BufferAttribute( particleRadii, 1 ) );
    particleGeometry.setAttribute( 'sphereCoord', new THREE.Float32BufferAttribute( particleSphereCoords, 2 ) );
    particleGeometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( particleUVs, 2 ) );
    particleGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( particleColors, 3 ) );
    particleMesh = new THREE.Points( particleGeometry, spherePointsMaterial );
    sceneCells.add(particleMesh);

    const cellMeshes = {
        membrane: null,
        nucleus: null,
    };


    for(let i = 0; i < cellData.length; i += cellDataUnit){
        const element = document.createElement( 'div' );
        element.className = 'cellElement';
        // element.style.backgroundColor = 'rgba(0,127,127,' + ( Math.random() * 0.5 + 0.25 ) + ')';
        element.style.backgroundColor = 'rgba(0,0,0,0)';


        const name = document.createElement( 'div' );
        name.className = 'cellName txtMoveIn';
        name.textContent = cellData[ i + 1 ];
        element.appendChild( name );

        const objectCSS = new THREE.CSS3DObject( element );
        const cellPos = new THREE.Vector3(cellData[i][0], cellData[i][1], cellData[i][2]);
        const dir = new THREE.Vector3().subVectors(camera.position, cellPos).normalize();
        const txtPos = cellPos.addScaledVector(dir, cellTxtDisRaduis);
        objectCSS.position.copy(txtPos);
        objectCSS.scale.multiplyScalar(cssScale);
        objectCSS.lookAt(camera.position.clone());
        sceneCSS.add( objectCSS );
        objectCSSList.push(objectCSS);
    }    

    new THREE.GLTFLoader()
    .setPath( 'models/stem_cell/' )
    .setDRACOLoader( new THREE.DRACOLoader().setDecoderPath( 'models/stem_cell/draco/' ) )
    .load( 'stem-cell5.glb', function ( gltf ) {
        gltf.scene.traverse( function ( object ) {
            if(object.isMesh){
                if(object.name === 'membrane-disp'){
                    cellMeshes.membrane = object;
                }else if(object.name === 'nucleus-disp'){
                    cellMeshes.nucleus = object;
                }
            }
            
		} );

        for(let i = 0; i < cellData.length; i += cellDataUnit){
            const cell = new THREE.Object3D();
            const cellDepth = new THREE.Object3D();

            const membrane = cellMeshes.membrane.clone();
            membrane.material = membraneMaterial.clone();
            membrane.scale.setScalar(cellScale);
            membrane.cellIndex = i / cellDataUnit;

            const spherical = new THREE.Spherical();
            spherical.setFromCartesianCoords(cellData[i][0], cellData[i][1], cellData[i][2]);
            const color = new THREE.Color();

            // const h = 0.5 + 0.5 * (spherical.theta + Math.PI) / (2 * Math.PI);
            // const s = 0.3 + 0.7 * spherical.phi / Math.PI;
            // const l = 0.4;
            // color.setHSL(h,s,l);

            const r = 0.5 + 0.5 * (spherical.theta + Math.PI) / (2 * Math.PI);
            const g = 0.3 + 0.3 * spherical.phi / Math.PI;
            const b = 0.2;
            color.setRGB(r,g,b);

            // membrane.focusColorFac = new THREE.Vector3(color.r, color.g, color.b);
            membrane.focusColorFac = new THREE.Vector3(1.0, 1.0, 1.0);

            // axon.makeAxonIndexOnMesh(membrane);
            // axon.makeAxonListHeadsOnMesh(membrane);
            // axon.addAxonPointsMaterialFromMesh(cell, membrane, axonPointsMaterial.clone(), axonPointsList);
            const randsM = [Math.random(), Math.random(), Math.random(), Math.random()];
            membrane.rands = randsM;
            membraneList.push(membrane);

            const nucleus = cellMeshes.nucleus.clone();
            nucleus.material = nucleusMaterial.clone();
            nucleus.scale.setScalar(cellScale);
            axon.makeAxonIndexOnMesh(nucleus);
            axon.makeAxonListHeadsOnMesh(nucleus);
            // axon.addAxonPointsMaterialFromMesh(cell, nucleus, axonPointsMaterial.clone(), axonPointsList);
            axon.addAxonPointsMaterialFromMesh(cell, nucleus, axonPointsMaterial.clone(), axonPointsList);
            const randsN = [Math.random(), Math.random(), Math.random(), Math.random()];
            nucleus.rands = randsN;
            nucleusList.push(nucleus);

            cell.add(membrane);
            cell.add(nucleus);
            cell.position.set(cellData[i][0], cellData[i][1], cellData[i][2]);
            // cell.matrixWorldNeedsUpdate = true;
            // membrane.matrixWorldNeedsUpdate = true;

            // const geometry = new THREE.BufferGeometry();
            // const vertices = [];
            // for ( let i = 0; i < cellParticleCount; i ++ ) {
            //     const r = cellParticleDisRaduisMin + 
            //     Math.random() * (cellParticleDisRaduisMax - cellParticleDisRaduisMin);
            //     const theta = Math.random() * Math.PI;
            //     const phi = Math.random() * Math.PI * 2;
            //     const x = r * Math.sin(phi) * Math.cos(theta);
            //     const y = r * Math.sin(phi) * Math.sin(theta);
            //     const z = r * Math.cos(phi);
        
            //     vertices.push( x, y, z );
            // }
            // geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
            // const particles = new THREE.Points( geometry, pointMaterial );
            // cell.add(particles);

            cellsGroup.add(cell);

            const nucleusDepth = cellMeshes.nucleus.clone();
            nucleusDepth.material = nucleusDepthMaterial.clone();
            nucleusDepth.material.uniforms[ 'displacementMap' ].value = nucleusDispMap;
            nucleusDepth.material.uniforms[ 'displacementMap1' ].value = nucleusDispMap1;
            nucleusDepth.scale.setScalar(cellScale);
            nucleusDepth.rands = randsN;
            nucleusDepthList.push(nucleusDepth);
            cellDepth.add(nucleusDepth);
            cellDepth.position.set(cellData[i][0], cellData[i][1], cellData[i][2]);
            cellsDepthGroup.add(cellDepth);
        }

        sceneCells.add(cellsGroup);
        sceneNucleusDepth.add(cellsDepthGroup);
        loadDone = true;

    } );

    screenMesh = new THREE.Mesh(new THREE.PlaneGeometry( 2, 2 ), ssDarkenMFMaterial);
    // screenMesh = new THREE.Mesh(new THREE.PlaneGeometry( 2, 2 ), ssBlurMFMaterial);
    // screenMesh = new THREE.Mesh(new THREE.PlaneGeometry( 2, 2 ), ssShowMaterial);
    sceneScreen.add(screenMesh);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.getElementById('container').appendChild( renderer.domElement );

    rendererCSS = new THREE.CSS3DRenderer();
    rendererCSS.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('txt-container').appendChild( rendererCSS.domElement );

    const axesHelper = new THREE.AxesHelper(1000);
    sceneScreen.add(axesHelper);

    // controls = new THREE.OrbitControls( camera, container );

    stats = new Stats();
    container.appendChild( stats.dom );

    document.body.style.touchAction = 'none';
    document.body.addEventListener( 'pointermove', onPointerMove );
    document.body.addEventListener( 'pointerdown', onPointerDown );

    window.addEventListener( 'resize', onWindowResize );

}

let rtWidth_cell = window.innerWidth * 2;
let rtHeight_cell = window.innerHeight * 2;

function initRenderTarget(){
    renderTargetNucleusDepth = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            encoding: THREE.LinearEncoding,
            type: THREE.FloatType,
        } );

    renderTargetCell = new THREE.WebGLRenderTarget( rtWidth_cell, rtHeight_cell, 
        { minFilter: THREE.LinearFilter, 
          magFilter: THREE.NearestFilter,
          format: THREE.RGBFormat,
          encoding: THREE.sRGBEncoding,
        } );
}

function loadTexture(){
    const loader = new THREE.TextureLoader();
    membraneNormalMap = loader.load( 'models/stem_cell/membrane-normal.png' );
    membraneNormalMap.flipY = false;

    membraneNormalMap1 = loader.load( 'models/stem_cell/membrane-normal1.png' );
    membraneNormalMap1.flipY = false;

    membraneDispMap = loader.load( 'models/stem_cell/membrane-displacement.png' );
    membraneDispMap.flipY = false;

    membraneDispMap1 = loader.load( 'models/stem_cell/membrane-displacement1.png' );
    membraneDispMap1.flipY = false;


    nucleusBaseColor = loader.load( 'models/stem_cell/nucleus-color.png' );
    nucleusBaseColor.flipY = false;
    nucleusBaseColor.encoding = THREE.sRGBEncoding;

    nucleusNormalMap = loader.load( 'models/stem_cell/nucleus-normal.png' );
    nucleusNormalMap.flipY = false;

    nucleusNormalMap1 = loader.load( 'models/stem_cell/nucleus-normal1.png' );
    nucleusNormalMap1.flipY = false;

    nucleusDispMap = loader.load( 'models/stem_cell/nucleus-displacement.png' );
    nucleusDispMap.flipY = false;

    nucleusDispMap1 = loader.load( 'models/stem_cell/nucleus-displacement1.png' );
    nucleusDispMap1.flipY = false;

    pointTexture = loader.load( 'textures/brain/test7.png' );
    pointTexture.flipY = false;
    pointTexture.encoding = THREE.sRGBEncoding;    
    pointTexture.premultiplyAlpha = true;
	pointTexture.needsUpdate = true;

    noiseTexture = loader.load( 'textures/stem_cell/point-noise.png' );
    noiseTexture.flipY = false;
    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;

}

const membraneParam = {
    color: 0xd4e7e0,
    transmission: 1,
    opacity: 1,
    metalness: 0,
    roughness: 0,
    ior: 1.5,
    thickness: 0.01,
    specularIntensity: 1,
    specularTint: 0xffffff,
    envMapIntensity: 1,
    lightIntensity: 1,
    exposure: 1
};

const nucleusParam = {
    transmission: 0,
    opacity: 0,
    metalness: 0,
    roughness: 0.343,
    ior: 1.5,
    thickness: 0.01,
    specularIntensity: 1,
    specularTint: 0xffffff,
    envMapIntensity: 1,
    lightIntensity: 1,
    exposure: 1
};

function initMaterial(){
    nucleusDepthMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.MixDispDepthShader.uniforms ),
        vertexShader: THREE.MixDispDepthShader.vertexShader,
        fragmentShader: THREE.MixDispDepthShader.fragmentShader,
    });
    nucleusDepthMaterial.uniforms[ 'displacementScale' ].value = 0.5;
    nucleusDepthMaterial.uniforms[ 'displacementBias' ].value = 0.0;
    nucleusDepthMaterial.uniforms[ 'displacementMap' ].value = nucleusDispMap;
    nucleusDepthMaterial.uniforms[ 'displacementMap1' ].value = nucleusDispMap1;

    membraneMaterial = new THREE.MixDispNormMaterial({
        color: membraneParam.color,
        normalMap: membraneNormalMap,
        displacementMap: membraneDispMap,
        displacementScale: 0.5,
        displacementBias: 0.0,
        metalness: membraneParam.metalness,
        roughness: membraneParam.roughness,
        ior: membraneParam.ior,
        envMapIntensity: membraneParam.envMapIntensity,
        transmission: membraneParam.transmission, // use material.transmission for glass materials
        specularIntensity: membraneParam.specularIntensity,
        specularTint: membraneParam.specularTint,
        opacity: membraneParam.opacity,
        side: THREE.DoubleSide,
        transparent: true,
        displacementMap1: membraneDispMap1,
        normalMap1: membraneNormalMap1,
    });
    membraneMaterial.displacementFac = 0;
    membraneMaterial.normalFac = 0;

    nucleusMaterial = new THREE.MixDispNormMaterial({
        map: nucleusBaseColor,
        normalMap: nucleusNormalMap,
        displacementMap: nucleusDispMap,
        displacementScale: 0.5,
        displacementBias: 0.0,
        metalness: nucleusParam.metalness,
        roughness: nucleusParam.roughness,
        ior: nucleusParam.ior,
        envMapIntensity: nucleusParam.envMapIntensity,
        transmission: nucleusParam.transmission, // use material.transmission for glass materials
        specularIntensity: nucleusParam.specularIntensity,
        specularTint: nucleusParam.specularTint,
        opacity: nucleusParam.opacity,
        side: THREE.DoubleSide,
        transparent: false,
        displacementMap1: nucleusDispMap1,
        normalMap1: nucleusNormalMap1,
    });
    nucleusMaterial.displacementFac = 0;
    nucleusMaterial.normalFac = 0;

    ssShowMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSShowShader.uniforms ),
        vertexShader: THREE.SSShowShader.vertexShader,
        fragmentShader: THREE.SSShowShader.fragmentShader,
        depthWrite: false,
    });
    ssShowMaterial.uniforms[ 'tScreen' ].value = renderTargetCell.texture;

    // ssBlurMaterial = new THREE.ShaderMaterial({
    //     uniforms: THREE.UniformsUtils.clone( THREE.SSSimpleBlurShader.uniforms ),
    //     vertexShader: THREE.SSSimpleBlurShader.vertexShader,
    //     fragmentShader: THREE.SSSimpleBlurShader.fragmentShader,
    //     depthWrite: false,
    // });
    // ssBlurMaterial.defines[ 'KERNEL_SIZE' ] = 9;
    // ssBlurMaterial.uniforms[ 'tScreen' ].value = renderTargetCell.texture;

    ssBlurMFMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSSimpleBlurMFShader.uniforms ),
        vertexShader: THREE.SSSimpleBlurMFShader.vertexShader,
        fragmentShader: THREE.SSSimpleBlurMFShader.fragmentShader,
        depthWrite: false,
    });

    ssBlurMFMaterial.defines[ 'KERNEL_SIZE' ] = 9;
    ssBlurMFMaterial.uniforms[ 'tScreen' ].value = renderTargetCell.texture;
    ssBlurMFMaterial.uniforms[ 'threshold' ].value = 70;
    ssBlurMFMaterial.uniforms[ 'falloff' ].value = 70;
    ssBlurMFMaterial.uniforms[ 'resolution' ].value = new THREE.Vector2(window.innerWidth , window.innerHeight);
    ssBlurMFMaterial.uniforms[ 'devicePixelRatio' ].value = window.devicePixelRatio;

    ssDarkenMFMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSDarkenMFShader.uniforms ),
        vertexShader: THREE.SSDarkenMFShader.vertexShader,
        fragmentShader: THREE.SSDarkenMFShader.fragmentShader,
        depthWrite: false,
    });

    ssDarkenMFMaterial.uniforms[ 'tScreen' ].value = renderTargetCell.texture;
    ssDarkenMFMaterial.uniforms[ 'darkenFac' ].value = 1.0;
    ssDarkenMFMaterial.uniforms[ 'focusColorFac' ].value = new THREE.Vector3(1.0, 0.5, 1.0);
    ssDarkenMFMaterial.uniforms[ 'focusPos' ].value = new THREE.Vector2(0.0, 0.0);
    ssDarkenMFMaterial.uniforms[ 'threshold' ].value = 80;
    ssDarkenMFMaterial.uniforms[ 'falloff' ].value = 80;
    ssDarkenMFMaterial.uniforms[ 'resolution' ].value = new THREE.Vector2(window.innerWidth, window.innerHeight);
    ssDarkenMFMaterial.uniforms[ 'devicePixelRatio' ].value = window.devicePixelRatio;

    pointMaterial = new THREE.PointsMaterial( {   
        size: 0.15, 
        // color: 0xff0000, 
        map: pointTexture,
        blending: THREE.CustomBlending, 
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.DstAlphaFactor,
        blendEquation: THREE.AddEquation,
        depthTest: false, 
        transparent: true
    });

    spherePointsMaterial = new THREE.SpherePointsMaterial({
        size: 0.15, 
        map: pointTexture,
        blending: THREE.CustomBlending, 
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.DstAlphaFactor,
        blendEquation: THREE.AddEquation,
        depthTest: false, 
        transparent: true,
        vertexColors: true,
        noiseMap: noiseTexture,
    });
    spherePointsMaterial.time = 0;

    axonPointsMaterial = new THREE.AxonPointsMaterial({
        size: 0.15, 
        map: pointTexture,
        blending: THREE.CustomBlending, 
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.DstAlphaFactor,
        blendEquation: THREE.AddEquation,
        depthTest: false, 
        transparent: true,
        vertexColors: true,

        rootDisplacementScale: 0.3,
        rootDisplacementBias: 0.0,
        rootDisplacementMap: nucleusDispMap,
        rootDisplacementMap1: nucleusDispMap1,
        noiseMap: noiseTexture,
        depthMap: renderTargetNucleusDepth.texture,
        layerMax: axon.AxonLayerMaxCount,
        viewPort: new THREE.Vector2(rtWidth_cell, rtHeight_cell),
    });
    axonPointsMaterial.rootDisplacementFac = 0;
    axonPointsMaterial.time = 0;


}

function loadEnvironment( name ) {
    if ( environments[ name ].texture !== undefined ) {
        sceneCells.environment = environments[ name ].texture;
        return;

    }

    const filename = environments[ name ].filename;
    new THREE.RGBELoader()
        .setPath( 'textures/equirectangular/' )
        .load( filename, function ( hdrEquirect ) {
            hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;

            sceneCells.environment = hdrEquirect;
            environments[ name ].texture = hdrEquirect;
        } );
}

const mousePos = new THREE.Vector2(0,0);

let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let targetCameraX = cameraPos.x;
let targetCameraY = cameraPos.y;
let targetCameraZ = cameraPos.z;
const mouseMovFac = 0.001;

let cameraAccFac = 0.01;
let cameraAccMin = 0.0001;
let cameraDis = 0.0001;

function onPointerDown(event) {

    for(let i = 0; i < objectCSSList.length; i++){
        objectCSSList[i].element.children[0].className = "cellName txtMoveOut";
    }
    
}

function onPointerMove( event ) {

    if ( event.isPrimary === false ) return;

    mousePos.set(event.clientX, event.clientY);

    // console.log(event.clientX + '***' + event.clientY);

    //add camera follow pointer move
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;

    targetCameraX = cameraPos.x + mouseX * mouseMovFac;
    targetCameraY = cameraPos.y - mouseY * mouseMovFac;
    // targetCameraZ = cameraPos.z + mouseY * mouseMovFac;

    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function updateCamera(){
    let accX = Math.abs(camera.position.x - targetCameraX) * cameraAccFac;
    accX = accX > cameraAccMin ? accX : 0;

    let accY = Math.abs(camera.position.y - targetCameraY) * cameraAccFac;
    accY = accY > cameraAccMin ? accY : 0;

    let accZ = Math.abs(camera.position.z - targetCameraZ) * cameraAccFac;
    accZ = accZ > cameraAccMin ? accZ : 0;

    camera.position.x += Math.sign(targetCameraX - camera.position.x) * accX;
    camera.position.y += Math.sign(targetCameraY - camera.position.y) * accY;
    camera.position.z += Math.sign(targetCameraZ - camera.position.z) * accZ;

    camera.lookAt( cameraTarget );

}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    rtWidth_cell = window.innerWidth * 2;
    rtHeight_cell = window.innerHeight * 2;

    renderTargetNucleusDepth.setSize(rtWidth_cell, rtHeight_cell);
    renderTargetCell.setSize(rtWidth_cell, rtHeight_cell);

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight);

    rendererCSS.setSize( window.innerWidth, window.innerHeight );
}

function buildGui(){
    const GeneralParams = {
        environment: Object.keys( environments )[ 0 ],
    };

    gui = new dat.GUI();

    const folder1 = gui.addFolder( 'General' );

    folder1.add( GeneralParams, 'environment', Object.keys( environments ) ).onChange( function ( value ) {
        loadEnvironment( value );
    } );

    folder1.open();
}

const clock = new THREE.Clock();
let lastElapsedTime;
let elapsedTime;
let deltaTime;

function animate(){
    requestAnimationFrame( animate );

    // controls.update();

    stats.update();

    if(!loadDone) return;

    updateTime();
    updateFac(elapsedTime);
    updateCamera();
    updateCssPos();

    findPointCell();
    updateFocus();

    TWEEN.update();

    render();

}

let flag = 0;

function updateTime(){
    elapsedTime = clock.getElapsedTime();
    if(lastElapsedTime){
        deltaTime = elapsedTime - lastElapsedTime;
    }
    lastElapsedTime = elapsedTime;
}

function updateFac(elapsedTime){
    
    updateMeshListFac(elapsedTime, membraneList);
    updateMeshListFac(elapsedTime, nucleusList);
    updateDepthMeshListFac(nucleusList, nucleusDepthList);

    // updateAxonListFac(elapsedTime, membraneList, axonPointsList);
    updateAxonListFac(elapsedTime, nucleusList, axonPointsList);

    particleMesh.material.time = elapsedTime;
    
}

function getRandBetween(rand, Min, Max){
    return rand * (Max - Min) + Min;
}

const facRandMin = 1;
const facRandMax = 4;

function updateMeshListFac(elapsedTime, list){
    for(let i = 0; i < list.length; i++){
        const rands = list[i].rands;
        let dispFac = Math.sin(elapsedTime * Math.PI / getRandBetween(rands[0], facRandMin, facRandMax)) 
        + Math.cos(elapsedTime * Math.PI / getRandBetween(rands[1], facRandMin, facRandMax));
        dispFac = (dispFac + 2) / 4;
        let normalFac = Math.sin(elapsedTime * Math.PI / getRandBetween(rands[2], facRandMin, facRandMax)) 
        + Math.cos(elapsedTime * Math.PI / getRandBetween(rands[3], facRandMin, facRandMax));
        normalFac = (normalFac + 2) / 4;

        list[i].material.displacementFac = dispFac;
        list[i].material.normalFac = normalFac;
        
    }
    
}

function updateDepthMeshListFac(list, DepthList){
    for(let i = 0; i < list.length; i++){
        DepthList[i].material.uniforms[ 'displacementFac' ].value = list[i].material.displacementFac;
    }
    
}

function updateAxonListFac(elapsedTime, list, axonPointsList){
    for(let i = 0; i < list.length; i++){
        axonPointsList[i].material.rootDisplacementFac = list[i].material.displacementFac;
        axonPointsList[i].material.time = elapsedTime;
    }
}

function updateCssPos() {
    for(let i = 0; i < objectCSSList.length; i++){
        objectCSSList[i].lookAt(camera.position.clone());
    }
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(1.0, 1.0);
let INTERSECTED = null;

function findPointCell(){
    raycaster.setFromCamera( pointer, camera );
    const intersects = raycaster.intersectObjects( membraneList );
    if ( intersects.length > 0 ) {
        if(INTERSECTED != intersects[ 0 ].object){
            // const index = intersects[ 0 ].object.cellIndex;
            // console.log(cellData[index * 2 + 1]);
            INTERSECTED = intersects[ 0 ].object;
        }
        
    }else{
        INTERSECTED = null;
    }
}

let darkenFac = 1.0;
const darkenFacMin = 0.2;
const darkenFacMax = 1.0;
const darkenFacSpeedPS = 1.0;

let focusPos = new THREE.Vector2(0.0, 0.0);
let hasFocus = false;
const focusMoveTimeMS = 300;
const focusFadeTimeMS = 1000;
let pointCellIndex = -1;
let focusColorFac = new THREE.Vector3(0.0,0.0,0.0);
let fadeTween;
let colorTween;

function updateFocus(){
    if(!deltaTime) return;

    if(INTERSECTED){
        darkenFac -= darkenFacSpeedPS * deltaTime;
        darkenFac = Math.max(darkenFac, darkenFacMin);

        const posData = cellData[INTERSECTED.cellIndex * 2];
        const posNDC = new THREE.Vector3(posData[0], posData[1], posData[2]).project(camera);
        const glX = (posNDC.x + 1.0) * 0.5 * window.innerWidth;
        const glY = (posNDC.y + 1.0) * 0.5 * window.innerHeight;

        if(!hasFocus){
            
            focusPos.set(glX, glY);
            focusColorFac.set(INTERSECTED.focusColorFac.x, INTERSECTED.focusColorFac.y, INTERSECTED.focusColorFac.z);
            hasFocus = true;

        }else if(hasFocus && pointCellIndex !== INTERSECTED.cellIndex){

            new TWEEN.Tween( focusPos )
            .to( {x : glX, y : glY}, focusMoveTimeMS )
            .easing( TWEEN.Easing.Linear.None )
            .start();

            if(fadeTween){
                TWEEN.remove(fadeTween);
                fadeTween = null;
            }
            
            colorTween = new TWEEN.Tween( focusColorFac )
            .to( {x : INTERSECTED.focusColorFac.x, y : INTERSECTED.focusColorFac.y, z : INTERSECTED.focusColorFac.z}, focusMoveTimeMS )
            .easing( TWEEN.Easing.Linear.None )
            .start();

            

        }
        pointCellIndex = INTERSECTED.cellIndex;
    }else{
        darkenFac += darkenFacSpeedPS * deltaTime;
        darkenFac = Math.min(darkenFac, darkenFacMax);
        if(hasFocus && pointCellIndex !== -1){
            if(colorTween){
                TWEEN.remove(colorTween);
                colorTween = null;
            }
            
            fadeTween = new TWEEN.Tween( focusColorFac )
            .to( {x : 1.0, y : 1.0, z : 1.0}, focusFadeTimeMS )
            .easing( TWEEN.Easing.Linear.None )
            .onComplete( ()=>{
                hasFocus = false;
            } ).start();
        }
        pointCellIndex = -1;
    }

    ssDarkenMFMaterial.uniforms[ 'darkenFac' ].value = darkenFac;
    ssDarkenMFMaterial.uniforms[ 'focusColorFac' ].value.set(focusColorFac.x, focusColorFac.y, focusColorFac.z);
    ssDarkenMFMaterial.uniforms[ 'focusPos' ].value.set(focusPos.x, focusPos.y);
}


function render(){

    rendererCSS.render(sceneCSS, camera);

    renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );

    renderer.setRenderTarget( renderTargetNucleusDepth );
    // renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneNucleusDepth, camera );

    renderer.setRenderTarget( renderTargetCell );
    // renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneCells, camera );

    

    ssBlurMFMaterial.uniforms[ 'mousePos' ].value = mousePos;
    renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneScreen, camera );
}

init();
buildGui();
animate();