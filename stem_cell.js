import { TWEEN } from './examples/jsm/libs/tween.module.min.js';

let sceneCells, sceneScreen;
let sceneNucleusDepth;
let sceneCSS;
let sceneCellsGeo;

let camera;

let renderer;
let rendererCSS;

let loadBrainDone = false;
let loadCellDone = false;

let membraneNormalMap, membraneNormalMap1, membraneDispMap, membraneDispMap1;
let nucleusBaseColor, nucleusNormalMap, nucleusNormalMap1, nucleusDispMap, nucleusDispMap1;

let nucleusDepthMaterial;
let membraneMaterial, nucleusMaterial;

const membraneList = [];
const membraneHighList = [];
const nucleusList = [];
const nucleusDepthList = [];
const nucleusHighList = [];
const axonPointsList = [];
const objectCSSList = [];
const axonGeoList = [];
const cellList = [];
const cellDepthList = [];
const cellGeoList = [];

const axon = new THREE.Axon({
    AxonCount : 5,
    AxonRootRotAxisAngleMax: 10,
    AxonRadiusMax: 0.12,
    AxonRadiusMin: 0.001,
    AxonSplitRatio: 0.015,
    AxonLayerMaxCount: 80,
    AxonLayerMaxLength: 0.04,
    AxonLayerMinLength: 0.03,
    AxonLayerTotalMaxLength: 3,
    AxonRotAxisMaxAngle:  5,
    AxonSegments: (2 * 4),
    AxonRadiusAttenuationSpeed: 4,
    AxonSizeAttenuationSpeed: 2,
    AxonColorIntensity: 2.0,
});

let ssShowMaterial, ssDarkenMFMaterial;
let ssFacMixCombineMaterial;
let spherePointsMaterial, axonPointsMaterial, axonGeoMaterial;
let brainPointsMaterial;
let axonLightMaterial, axonLightExtractMaterial;
let addCombineMaterial, minCombineMaterial;

let pointTexture;

let noiseTexture;

let renderTargetNucleusDepth;
let renderTargetCell;
let renderTargetCellMF;
let renderTargetCellGeo;
let renderTargetAxonLight;
let renderTargetOnlyLight;
let renderTargetGaussianBlur;
let renderTargetAddCombine;
let renderTargetMinCombine;
let renderTargetShow;

let brainParticleMesh;
let particleMesh;
let screenMesh;

// let controls;

let stats;

let gui;

const environments = {
    
    'dikhololo_night': { filename: 'dikhololo_night_1k.hdr' },
    'quarry': { filename: 'quarry_04_1k.hdr' },
    'loft_hall': { filename: 'photo_studio_loft_hall_1k.hdr' },        
    'artist_workshop': { filename: 'artist_workshop_1k.hdr' },
    'christmas': { filename: 'christmas_photo_studio_01_1k.hdr' },
    'cayley_interior': { filename: 'cayley_interior_1k.hdr' },
    
};

const cameraInitPos = new THREE.Vector3(0,0,5.5);
const cameraInitTarget = new THREE.Vector3(0,0,0);
const cameraCurrentTarget = new THREE.Vector3(0,0,0);
const cameraObject = new THREE.Object3D();
let cameraObjectOrg;


const cellMeshes = {
    membrane: null,
    nucleus: null,
    membraneHigh: null,
    nucleusHigh: null,
};
const cellRadius = 1.33;
const cellScale = 0.2;
const cellParticleCount = 2000;
const cellTxtDisRaduis = cellRadius * cellScale * 1.5;
const cellParticleDisRaduisMin = cellRadius * cellScale;
const cellParticleDisRaduisMax = cellRadius * cellScale * 3;
const cellsGroup = new THREE.Group();
const cellsDepthGroup = new THREE.Group();
const cellsGeoGroup = new THREE.Group();

const axonHeadIndexSets = [];
const axonHeadIndexSetInitArray = [];

const cellCameraFocusDist = cellRadius * cellScale * 8;

const cssScale = 0.01;

const axonLightList = [];
const axonLightCount = 1;
const baseLayerFacAccPS = 10;
const pointLightFadeInOutPS = 1;
const axonLightMaterialIntensityFull = 10;
const axonLightIntensityFull = 2;
let gaussianPass;

function init(){

    sceneCells = new THREE.Scene();
    sceneScreen = new THREE.Scene();
    sceneNucleusDepth = new THREE.Scene();
    sceneCSS = new THREE.Scene();
    sceneCellsGeo = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
    camera.position.set( cameraInitPos.x, cameraInitPos.y, cameraInitPos.z );
    cameraCurrentTarget.copy(cameraInitTarget);
    camera.lookAt(cameraCurrentTarget);
    cameraPYMatrix.copy(camera.clone().matrixWorld);

    initRenderTarget();

    loadTexture();
    
    loadEnvironment( Object.keys( environments )[ 0 ] );

    initMaterial();

    // initSphereParticl();

    initCSSTitle();

    initCameraObject();
    initCSSObjects();

    loadBrainModelAndInit();
    loadCellModelAndInit();

    gaussianPass = new THREE.SSGaussianBlurPass({
        texture: renderTargetMinCombine.texture,
        blurData: [5],
    });

    screenMesh = new THREE.Mesh(new THREE.PlaneGeometry( 2, 2 ), ssDarkenMFMaterial);
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

function initCSSTitle(){
    for(let i = 0; i < cellData.length; i += cellDataUnit){
        const element = document.createElement( 'div' );
        element.className = 'cellTitle';
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
}

function initCameraObject(){
    cameraObject.position.copy(camera.position);
    cameraObject.rotation.copy(camera.rotation);
    cameraObject.updateMatrixWorld();
    cameraObjectOrg = cameraObject.clone();
}


class CellTextObj{
    constructor() {
        this.textELe = null;
        this.cssObj = null;
    }
}

class CellTextParam{
    constructor(param) {
        this.worldPos = param.worldPos;    
        this.axisWorldPos = param.axisWorldPos;
        this.initAngle = param.initAngle;
        this.currentAngle = param.currentAngle;
    }
}

const focusTitleObjR = new CellTextObj();
const focusTitleParamR = new CellTextParam({
    worldPos : new THREE.Vector3(3.5, 0, -5),
    axisWorldPos : new THREE.Vector3(3.5, 0, -5.5),
    initAngle : Math.PI / 3,
    currentAngle: 0,
});

const focusTitleObjL = new CellTextObj();
const focusTitleParamL = new CellTextParam({
    worldPos : new THREE.Vector3(-3.5, 0, -5),
    axisWorldPos : new THREE.Vector3(-3.5, 0, -5.5),
    initAngle : -Math.PI / 3,
    currentAngle: 0,
});

const focusContentObjR = new CellTextObj();
const focusContentParamR = new CellTextParam({
    worldPos : new THREE.Vector3(4.5, 0, -5),
    axisWorldPos : new THREE.Vector3(4.5, 0, -6),
    initAngle : Math.PI / 3,
    currentAngle: 0,
});

const focusContentObjL = new CellTextObj();
const focusContentParamL = new CellTextParam({
    worldPos : new THREE.Vector3(-4.5, 0, -5),
    axisWorldPos : new THREE.Vector3(-4.5, 0, -6),
    initAngle : -Math.PI / 3,
    currentAngle: 0,
});

const returnObj = new CellTextObj();
const returnParam = new CellTextParam({
    worldPos : new THREE.Vector3(0, -4, -5),
    axisWorldPos : new THREE.Vector3(0, 0, 0),
    initAngle : 0,
    currentAngle: 0,
});

function initCSSObjects(){
    initCSSObject(focusTitleObjR, focusTitleParamR, 'cellFocusTitle', 'focusName');
    initCSSObject(focusTitleObjL, focusTitleParamL, 'cellFocusTitle', 'focusName');

    initCSSObject(focusContentObjR, focusContentParamR, 'cellFocusContent', 'focusTxt pre');
    initCSSObject(focusContentObjL, focusContentParamL, 'cellFocusContent', 'focusTxt pre');

    initCSSObject(returnObj, returnParam, 'cellReturn', 'returnTxt txtMoveIn', onReturnClick);

    returnObj.textEle.textContent = '返回';
    returnObj.cssObj.visible = true;
}

function initCSSObject(obj, focusParam, outerClass, innerClass, clickFunc) {
    const element = document.createElement( 'div' );
    element.className = outerClass;
    element.style.backgroundColor = 'rgba(0,0,0,0)';
    if(clickFunc){
        element.addEventListener( 'click', clickFunc );
    }

    obj.textEle = document.createElement( 'div' );
    obj.textEle.className = innerClass;
    // obj.textEle.textContent = '哇哇哇哇';
    element.appendChild( obj.textEle );

    obj.cssObj = new THREE.CSS3DObject( element );
    // obj.cssObj.visible = false;

    let worldPos = focusParam.worldPos.clone();
    let localPos = cameraObject.worldToLocal(worldPos);
    obj.cssObj.position.copy(localPos);


    obj.cssObj.scale.multiplyScalar(cssScale);
    
    cameraObject.add(obj.cssObj);

    sceneCSS.add( cameraObject );

}

// function initSphereParticl(){
//     const particleGeometry = new THREE.BufferGeometry();
//     const particleVertices = [];
//     const particleRadii = [];
//     const particleSphereCoords = [];
//     const particleUVs = [];
//     const particleColors = [];
//     const particleColor = new THREE.Color();
//     const particleColorScalar = 0.3;

//     for ( let i = 0; i < 5000; i ++ ) {
//         const r = 0.0 + 
//         Math.random() * (5.0 - 0.0);
//         const theta = Math.random() * Math.PI; //zenith
//         const phi = Math.random() * Math.PI * 2; //Azimuth
//         const x = r * Math.sin(phi) * Math.cos(theta);
//         const y = r * Math.sin(phi) * Math.sin(theta);
//         const z = r * Math.cos(phi);

//         particleVertices.push( x, y, z );
//         particleRadii.push(r);
//         particleSphereCoords.push(theta, phi);
//         particleUVs.push(Math.random(), Math.random());

//         particleColor.setRGB(Math.random(), Math.random(), Math.random()).multiplyScalar(particleColorScalar);
//         particleColors.push(particleColor.r, particleColor.g, particleColor.b);
                
//     }

//     particleGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( particleVertices, 3 ) );
//     particleGeometry.setAttribute( 'radius', new THREE.Float32BufferAttribute( particleRadii, 1 ) );
//     particleGeometry.setAttribute( 'sphereCoord', new THREE.Float32BufferAttribute( particleSphereCoords, 2 ) );
//     particleGeometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( particleUVs, 2 ) );
//     particleGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( particleColors, 3 ) );
//     particleMesh = new THREE.Points( particleGeometry, spherePointsMaterial );
//     sceneCells.add(particleMesh);
// }

function initBrainParticleMesh(){
    const posArray = brainParticleMesh.geometry.attributes.position.array;
    const particleVertices = [];
    const particleRadii = [];
    const particleSphereCoords = [];
    const particleColors = [];
    const particleColor = new THREE.Color();
    const particleColorScalar = 0.2;

    for(let i = 0; i < posArray.length; i += 3){
        const radius = 0.0 + 
        Math.random() * (5.0 - 0.0);
        const theta = Math.random() * Math.PI; //zenith
        const phi = Math.random() * Math.PI * 2; //Azimuth
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        particleVertices.push( x, y, z );
        particleRadii.push(radius);
        particleSphereCoords.push(theta, phi);

        const r = 0.25 + 0.25 * Math.random();
        const g = 0.18 + 0.18 * Math.random();
        const b = 0.18 + 0.18 * Math.random();

        particleColor.setRGB(r, g, b).multiplyScalar(particleColorScalar);
        particleColors.push(particleColor.r, particleColor.g, particleColor.b);
    }

    brainParticleMesh.geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( particleColors, 3 ) );
    brainParticleMesh.geometry.setAttribute( 'spherePosition', new THREE.Float32BufferAttribute( particleVertices, 3 ) );
    brainParticleMesh.geometry.setAttribute( 'radius', new THREE.Float32BufferAttribute( particleRadii, 1 ) );
    brainParticleMesh.geometry.setAttribute( 'sphereCoord', new THREE.Float32BufferAttribute( particleSphereCoords, 2 ) );

}

function loadBrainModelAndInit(){
    new THREE.GLTFLoader()
    .setPath( 'models/brain/' )
    .load( 'Brain-t3.gltf', function ( gltf ) {
        gltf.scene.traverse( function ( object ) {
            if(object.isMesh){
                if(object.name === 'brain-low-001'){
                    brainParticleMesh = new THREE.Points( object.geometry, brainPointsMaterial );
                    initBrainParticleMesh();
                    initBrainFacAnime();
                }
            }
            
		} );

        sceneCells.add(brainParticleMesh);
        loadBrainDone = true;

    } );
}

function loadCellModelAndInit(){
    
    initAxonHeadIndexSetInitArray();
    new THREE.GLTFLoader()
    .setPath( 'models/stem_cell/' )
    .setDRACOLoader( new THREE.DRACOLoader().setDecoderPath( 'models/stem_cell/draco/' ) )
    .load( 'stem-cell6.glb', function ( gltf ) {
        gltf.scene.traverse( function ( object ) {
            if(object.isMesh){
                if(object.name === 'membrane-disp'){
                    cellMeshes.membrane = object;
                }else if(object.name === 'nucleus-disp'){
                    cellMeshes.nucleus = object;
                }else if(object.name === 'membrane-high-disp'){
                    cellMeshes.membraneHigh = object;
                }else if(object.name === 'nucleus-high-disp'){
                    cellMeshes.nucleusHigh = object;
                }
            }
            
		} );

        initCellMeshes();
        initAxonLights();
        initCellAnime();

        sceneCells.add(cellsGroup);
        sceneNucleusDepth.add(cellsDepthGroup);
        sceneCellsGeo.add(cellsGeoGroup);
        loadCellDone = true;

    } );
}

function initAxonHeadIndexSetInitArray(){
    for(let i = 0; i < axon.AxonCount; i++){
        axonHeadIndexSetInitArray.push(i);
    }
}

const cellInitPos = new THREE.Vector3(0,0,0);
const cellInitScalar = 0;

function initCellMeshes(){
    for(let i = 0; i < cellData.length; i += cellDataUnit){
        const cell = new THREE.Object3D();
        const cellDepth = new THREE.Object3D();
        const cellGeo = new THREE.Object3D();
        cellGeo.name = 'cellGeo';
        
        const membrane = cellMeshes.membrane.clone();
        membrane.material = membraneMaterial.clone();
        membrane.scale.setScalar(cellScale);
        membrane.cellIndex = i / cellDataUnit;

        // const spherical = new THREE.Spherical();
        // spherical.setFromCartesianCoords(cellData[i][0], cellData[i][1], cellData[i][2]);
        membrane.focusColorFac = new THREE.Vector3(1.0, 1.0, 1.0);
        const randsM = [Math.random(), Math.random(), Math.random(), Math.random()];
        membrane.rands = randsM;
        membraneList.push(membrane);

        const nucleus = cellMeshes.nucleus.clone();
        nucleus.material = nucleusMaterial.clone();
        nucleus.scale.setScalar(cellScale);
        axon.makeAxonIndexOnMesh(nucleus);
        axon.makeAxonListHeadsOnMesh(nucleus);
        // axon.addAxonLineFromMesh(cell, nucleus);
        axon.addAxonPointsMaterialFromMesh(cell, nucleus, axonPointsMaterial.clone(), axonPointsList);
        const randsN = [Math.random(), Math.random(), Math.random(), Math.random()];
        nucleus.rands = randsN;
        nucleusList.push(nucleus);


        const membraneHigh = cellMeshes.membraneHigh.clone();
        membraneHigh.material = membraneMaterial.clone();
        membraneHigh.scale.setScalar(cellScale);
        membraneHighList.push(membraneHigh);
        cellGeo.add(membraneHigh);

        const nucleusHigh = cellMeshes.nucleusHigh.clone();
        nucleusHigh.material = nucleusMaterial.clone();
        nucleusHigh.scale.setScalar(cellScale);
        nucleusHighList.push(nucleusHigh);
        cellGeo.add(nucleusHigh);
        axon.makeAxonIndexOnMesh(nucleusHigh);
        axon.makeAxonListHeadsOnMesh(nucleusHigh);
        axon.makeAxonGeometryOnMesh(nucleusHigh);
        // axon.addAxonLineFromMesh(cellGeo, nucleusHigh);
        axon.addAxonGeometryMaterialFromMesh(cellGeo, nucleusHigh, axonGeoMaterial.clone(), axonGeoList);

        cellGeo.position.set(cellData[i][0], cellData[i][1], cellData[i][2]);
        cellsGeoGroup.add(cellGeo);
        cellGeoList.push(cellGeo);

        cell.add(membrane);
        cell.add(nucleus);
        // cell.position.set(cellData[i][0], cellData[i][1], cellData[i][2]);
        cell.position.copy(cellInitPos);
        cell.currentPos = new THREE.Vector3(0, 0, 0); 
        cell.targetPos = new THREE.Vector3(cellData[i][0], cellData[i][1], cellData[i][2]);
        cell.scale.setScalar(cellInitScalar);
        cell.currentScalar = cellInitScalar;


        initCellCameraFocus(cell, cellData[i + 2]);

        cellList.push(cell);
        cellsGroup.add(cell);

        const nucleusDepth = cellMeshes.nucleus.clone();
        nucleusDepth.material = nucleusDepthMaterial.clone();
        nucleusDepth.material.uniforms[ 'displacementMap' ].value = nucleusDispMap;
        nucleusDepth.material.uniforms[ 'displacementMap1' ].value = nucleusDispMap1;
        nucleusDepth.scale.setScalar(cellScale);
        nucleusDepth.rands = randsN;
        nucleusDepthList.push(nucleusDepth);
        cellDepth.add(nucleusDepth);
        // cellDepth.position.set(cellData[i][0], cellData[i][1], cellData[i][2]);
        cellDepth.position.copy(cellInitPos);
        cellDepth.scale.setScalar(cellInitScalar);

        cellDepthList.push(cellDepth);
        cellsDepthGroup.add(cellDepth);


        const axonHeadIndexSet = new Set(axonHeadIndexSetInitArray);
        axonHeadIndexSets.push(axonHeadIndexSet);
    }
}

function initCellCameraFocus(cell, targetLoc){
    const dir = new THREE.Vector3().subVectors(cell.targetPos, new THREE.Vector3(0,0,0)).normalize();
    cell.CameraFocusPos = new THREE.Vector3().copy(cell.targetPos);
    cell.CameraFocusPos.addScaledVector(dir, cellCameraFocusDist);
    const crossDir = (new THREE.Vector3()).crossVectors(dir, camera.up).normalize();
    cell.CameraFocusPosCross = new THREE.Vector3().copy(cell.CameraFocusPos);

    if(targetLoc === 'l'){
        cell.CameraFocusPosCross.addScaledVector(crossDir, -0.65);
    }else if(targetLoc === 'r'){
        cell.CameraFocusPosCross.addScaledVector(crossDir, 0.65);
    }

}

function selectFromAxonHeadIndexSet(setIndex){
    const set = axonHeadIndexSets[setIndex];
    const arr = Array.from(set);
    const len = arr.length;
    let axonIndex = -1;
    if(len > 0){
        const index = getRandomIntBetween(0, arr.length - 1);
        axonIndex = arr[index];
        set.delete(axonIndex);
    }
    
    return axonIndex;
}

function addToAxonHeadIndexSet(setIndex, value){
    const set = axonHeadIndexSets[setIndex];
    set.add(value);
}

function initAxonLights(){
    for(let i = 0; i < cellGeoList.length; i++){
        const axonLights = new THREE.Object3D();

        for(let j = 0; j < axonLightCount; j++){
            const pointLight = new THREE.Object3D();
            initLightMaterialProp(pointLight, i, true);
            axonLights.add(pointLight);
            axonLightList.push(pointLight);
        }
        
        axonLights.position.copy(cellGeoList[i].position);
        cellsGeoGroup.add(axonLights);
    }
}

function initLightMaterialProp(pointLight, cIndex, flag){

    if(flag){
        const lightMaterial = axonLightMaterial.clone();
        // const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        const color = new THREE.Color(0.2, 0.2, 1.0);
        lightMaterial.color.copy(color);
        const pointLightMesh = new THREE.Mesh( new THREE.SphereGeometry( 0.01, 6, 6 ), lightMaterial);
        pointLight.add(pointLightMesh);
        pointLight.pointLightMesh = pointLightMesh;
        const light = new THREE.PointLight( color.getHex(), axonLightIntensityFull, 2 );
        pointLight.add( light );
        pointLight.light = light;
    }

    const cellIndex = (cIndex >= 0) ? cIndex : pointLight.cellIndex;
    pointLight.cellIndex = cellIndex;
    if(pointLight.headIndex && pointLight.headIndex >= 0){
        addToAxonHeadIndexSet(cellIndex, pointLight.headIndex);
    }
    const axonMesh = nucleusHighList[cellIndex];
    const headIndex = selectFromAxonHeadIndexSet(cellIndex);
    const axonIndex = axonMesh.axonIndices[headIndex];
    const rands = axonMesh.axonRands[headIndex];
    const { array : normalArray} = axonMesh.geometry.attributes.normal;
    const { array : uvArray} = axonMesh.geometry.attributes.uv;
    const lightMaterial = pointLight.pointLightMesh.material;
    lightMaterial.rootNormal = new THREE.Vector3(normalArray[axonIndex * 3], 
        normalArray[axonIndex * 3 + 1], normalArray[axonIndex * 3 + 2]);
    lightMaterial.rootUV = new THREE.Vector2(uvArray[axonIndex * 2], uvArray[axonIndex * 2 + 1]);
    lightMaterial.rootRands = new THREE.Vector3(rands[0], rands[1], rands[2]);

    const axonNode = axonMesh.axonListHeads[headIndex];
    const pos = axonNode.position;
    pointLight.position.copy(pos);
    pointLight.headIndex = headIndex;
    pointLight.axonNode = axonNode;

    pointLight.layerFacAccPS = baseLayerFacAccPS * (Math.random() + 0.5) ;
    pointLight.layerFac = 0;
    pointLight.fadeInOutPS = pointLightFadeInOutPS;
    pointLight.fadeInOutFac = 0;
    pointLight.pointLightMesh.material.intensity = axonLightMaterialIntensityFull * pointLight.fadeInOutFac;
    pointLight.light.intensity = axonLightIntensityFull * pointLight.fadeInOutFac;
    
}

let startAnimeFlag = true;

const brainAnimeTimeMS = 4000;
const brainAnimeDelayTimeMS = 3000;

const sphereAnimeTimeMS = 30000;

let brainStartAnime;

function initBrainFacAnime(){
    brainStartAnime = new TWEEN.Tween( brainPointsMaterial )
    .to( {positionFac : 1.0}, brainAnimeTimeMS )
    // .easing( TWEEN.Easing.Linear.None )
    .easing( TWEEN.Easing.Quadratic.Out )
    .delay( brainAnimeDelayTimeMS )
    .onComplete( ()=>{
        brainParticleMesh.material = spherePointsMaterial;

        new TWEEN.Tween( spherePointsMaterial )
        .to( {fac : 1.0}, sphereAnimeTimeMS )
        // .easing( TWEEN.Easing.Linear.None )
        .easing( TWEEN.Easing.Quadratic.In )
        .onComplete( ()=>{
        } ).start();

    } );

}

const cellAnimIntervalTimeMS = 100;
const cellAnimeTimeMS = 1000;
const cellAnimeDelayTimeMS = brainAnimeDelayTimeMS + 500;
const axonAnimeTimeMS = 1000;

const cellScalar = 1;
const cellStartAnimeList = [];

function playCellStartAnime(){
    for(let i = 0; i < cellStartAnimeList.length; i++){
        cellStartAnimeList[i].start();
    }
}

function initCellAnime(){
    for(let i = 0; i < cellList.length; i++){
        const cell = cellList[i];
        const cellDepth = cellDepthList[i];
        const axon = axonPointsList[i];

        const dataIndex = i * cellDataUnit;
        const posAnime = new TWEEN.Tween( cell.currentPos )
        .to( {x : cellData[dataIndex][0], y : cellData[dataIndex][1], z : cellData[dataIndex][2],}, cellAnimeTimeMS )
        .easing( TWEEN.Easing.Quadratic.Out )
        // .easing( TWEEN.Easing.Linear.None )
        .delay( cellAnimeDelayTimeMS + cellAnimIntervalTimeMS * i)
        .onUpdate( ()=>{
            cell.position.copy(cell.currentPos);
            cellDepth.position.copy(cell.currentPos);
        })
        .onComplete( ()=>{
        } );

        cellStartAnimeList.push(posAnime);

        const scaleAnime = new TWEEN.Tween( cell )
        .to( { currentScalar : cellScalar}, cellAnimeTimeMS)
        .easing( TWEEN.Easing.Quadratic.In )
        // .easing( TWEEN.Easing.Linear.None )
        .delay( cellAnimeDelayTimeMS + cellAnimIntervalTimeMS * i)
        .onUpdate( ()=>{
            cell.scale.setScalar(cell.currentScalar);
            cellDepth.scale.setScalar(cell.currentScalar);
        })
        .onComplete( ()=>{
            new TWEEN.Tween( axon.material )
            .to( { layerShow : axon.material.layerMax}, axonAnimeTimeMS)
            // .easing( TWEEN.Easing.Quadratic.In )
            .easing( TWEEN.Easing.Linear.None )
            .delay( cellAnimIntervalTimeMS * (cellList.length - i - 1))
            .onUpdate( ()=>{
                axon.material.needsUpdate = true;
            })
            .onComplete( ()=>{
                startAnimeFlag = false;
            } ).start();

        } );

        cellStartAnimeList.push(scaleAnime);
    }
}

const rtRatio = 2;
let screenOrgAspectRatio = window.innerWidth / window.innerHeight;
let rtWidth_cell = window.innerWidth * rtRatio;
let rtHeight_cell = window.innerHeight * rtRatio;

function initRenderTarget(){
    renderTargetNucleusDepth = new THREE.WebGLRenderTarget( rtWidth_cell, rtHeight_cell, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            type: THREE.FloatType,
        } );

    renderTargetCell = new THREE.WebGLRenderTarget( rtWidth_cell, rtHeight_cell, 
        { minFilter: THREE.LinearFilter, 
          magFilter: THREE.NearestFilter,
          format: THREE.RGBFormat,
        
        } );

    renderTargetCellMF = new THREE.WebGLRenderTarget( rtWidth_cell, rtHeight_cell, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
        } );

    renderTargetCellGeo = new THREE.WebGLRenderTarget( rtWidth_cell, rtHeight_cell, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            type: THREE.FloatType,
        } );

    renderTargetAxonLight = new THREE.WebGLRenderTarget( rtWidth_cell, rtHeight_cell, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            type: THREE.FloatType,
        } );
    
    renderTargetOnlyLight = new THREE.WebGLRenderTarget( rtWidth_cell, rtHeight_cell, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            type: THREE.FloatType,
        } );

    renderTargetGaussianBlur = new THREE.WebGLRenderTarget( rtWidth_cell, rtHeight_cell, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            type: THREE.FloatType,
        } );

    renderTargetAddCombine = new THREE.WebGLRenderTarget( rtWidth_cell, rtHeight_cell, 
    { minFilter: THREE.LinearFilter, 
        magFilter: THREE.NearestFilter,
        type: THREE.FloatType,
    } );

    renderTargetMinCombine = new THREE.WebGLRenderTarget( rtWidth_cell, rtHeight_cell, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            type: THREE.FloatType,
        } );

    renderTargetShow = new THREE.WebGLRenderTarget( rtWidth_cell, rtHeight_cell, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
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
    nucleusNormalMap.wrapS = THREE.RepeatWrapping;
    nucleusNormalMap.wrapT = THREE.RepeatWrapping;

    nucleusNormalMap1 = loader.load( 'models/stem_cell/nucleus-normal1.png' );
    nucleusNormalMap1.flipY = false;
    nucleusNormalMap1.wrapS = THREE.RepeatWrapping;
    nucleusNormalMap1.wrapT = THREE.RepeatWrapping;

    nucleusDispMap = loader.load( 'models/stem_cell/nucleus-displacement.png' );
    nucleusDispMap.flipY = false;
    nucleusDispMap.wrapS = THREE.RepeatWrapping;
    nucleusDispMap.wrapT = THREE.RepeatWrapping;

    nucleusDispMap1 = loader.load( 'models/stem_cell/nucleus-displacement1.png' );
    nucleusDispMap1.flipY = false;
    nucleusDispMap1.wrapS = THREE.RepeatWrapping;
    nucleusDispMap1.wrapT = THREE.RepeatWrapping;

    pointTexture = loader.load( 'textures/brain/test7.png' );
    pointTexture.flipY = false;
    pointTexture.encoding = THREE.sRGBEncoding;    
    pointTexture.premultiplyAlpha = true;
	pointTexture.needsUpdate = true;

    noiseTexture = loader.load( 'textures/stem_cell/point-noise-gaussian.png' );
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
        defines: Object.assign( {}, THREE.SSShowShader.defines ),
        uniforms: THREE.UniformsUtils.clone( THREE.SSShowShader.uniforms ),
        vertexShader: THREE.SSShowShader.vertexShader,
        fragmentShader: THREE.SSShowShader.fragmentShader,
        depthWrite: false,
    });

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
    ssDarkenMFMaterial.uniforms[ 'threshold' ].value = window.innerWidth / 20 * rtRatio;
    ssDarkenMFMaterial.uniforms[ 'falloff' ].value = window.innerWidth / 20 * rtRatio;
    
    ssDarkenMFMaterial.uniforms[ 'resolution' ].value = new THREE.Vector2(window.innerWidth, window.innerHeight);
    ssDarkenMFMaterial.uniforms[ 'devicePixelRatio' ].value = window.devicePixelRatio;

    ssFacMixCombineMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSFacMixCombineShader.uniforms ),
        vertexShader: THREE.SSFacMixCombineShader.vertexShader,
        fragmentShader: THREE.SSFacMixCombineShader.fragmentShader,
        depthWrite: false,
    });
    ssFacMixCombineMaterial.uniforms[ 'tScreen0' ].value = renderTargetCellMF.texture;
    ssFacMixCombineMaterial.uniforms[ 'tScreen1' ].value = renderTargetShow.texture;
    ssFacMixCombineMaterial.uniforms[ 'factor' ].value = 0;

    spherePointsMaterial = new THREE.SpherePointsMaterial({
        size: 0.1, 
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
    spherePointsMaterial.fac = 0;

    brainPointsMaterial = new THREE.BrainPointsMaterial({
        size: 0.1, 
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
    brainPointsMaterial.time = 0;
    brainPointsMaterial.positionFac = 0;

    axonPointsMaterial = new THREE.AxonPointsMaterial({
        size: 0.2, //relate to resolution
        map: pointTexture,
        blending: THREE.CustomBlending, 
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.DstAlphaFactor,
        blendEquation: THREE.AddEquation,
        depthTest: false, 
        transparent: true,
        vertexColors: true,

        rootDisplacementScale: 0.5,
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
    axonPointsMaterial.layerShow = 0;

    axonGeoMaterial = new THREE.AxonGeometryMaterial({
        color: 0xd4e7e0,
        metalness: membraneParam.metalness,
        roughness: membraneParam.roughness,
        ior: membraneParam.ior,
        envMapIntensity: membraneParam.envMapIntensity,
        transmission: 0.9, // use material.transmission for glass materials
        specularIntensity: membraneParam.specularIntensity,
        specularTint: membraneParam.specularTint,
        opacity: 1.0,
        side: THREE.DoubleSide,
        transparent: true,

        // displacementMap: nucleusDispMap,
        // displacementMap1: nucleusDispMap1,
        // displacementScale: 0.03,
        // displacementBias: 0.0,

        // normalMap: nucleusNormalMap,
        // normalMap1: nucleusNormalMap1,

        rootDisplacementScale: 0.5,
        rootDisplacementBias: 0.0,
        rootDisplacementMap: nucleusDispMap,
        rootDisplacementMap1: nucleusDispMap1,
        layerMax: axon.AxonLayerMaxCount,
    });
    axonGeoMaterial.rootDisplacementFac = 0;
    axonGeoMaterial.time = 0;

    // axonGeoMaterial.displacementFac = 0;
    // axonGeoMaterial.normalFac = 0;

    axonLightMaterial = new THREE.AxonPointLightMaterial({
        rootDisplacementScale: 0.5,
        rootDisplacementBias: 0.0,
        rootDisplacementMap: nucleusDispMap,
        rootDisplacementMap1: nucleusDispMap1,
        layerMax: axon.AxonLayerMaxCount,

        color: 0x00ff00,
        // intensity: 10,
    });

    axonLightMaterial.rootDisplacementFac = 0;
    axonLightMaterial.layerFac = 0;
    axonLightMaterial.time = 0;
    axonLightMaterial.intensity = axonLightIntensityFull;

    axonLightExtractMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSExtractBrightnessExceedShader.uniforms ),
        vertexShader: THREE.SSExtractBrightnessExceedShader.vertexShader,
        fragmentShader: THREE.SSExtractBrightnessExceedShader.fragmentShader,
        depthWrite: false,
    });
    axonLightExtractMaterial.uniforms[ 'tScreen' ].value = renderTargetCellGeo.texture;
    axonLightExtractMaterial.uniforms[ 'brightnessThreshold' ].value = 3.0;

    addCombineMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSAddCombineShader.uniforms ),
        vertexShader: THREE.SSAddCombineShader.vertexShader,
        fragmentShader: THREE.SSAddCombineShader.fragmentShader,
        depthWrite: false,
    });

    minCombineMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSMinCombineShader.uniforms ),
        vertexShader: THREE.SSMinCombineShader.vertexShader,
        fragmentShader: THREE.SSMinCombineShader.fragmentShader,
        depthWrite: false,
    });
}

function loadEnvironment( name ) {
    if ( environments[ name ].texture !== undefined ) {
        sceneCells.environment = environments[ name ].texture;
        sceneCellsGeo.environment = environments[ name ].texture;
        return;

    }

    const filename = environments[ name ].filename;
    new THREE.RGBELoader()
        .setPath( 'textures/equirectangular/' )
        .load( filename, function ( hdrEquirect ) {
            hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;

            sceneCells.environment = hdrEquirect;
            sceneCellsGeo.environment = hdrEquirect;
            environments[ name ].texture = hdrEquirect;
        } );
}

let focusFlag = false;
let focusAnimFlag = false;
const cellCameraFocusTimeMS = 2000;
const cellCameraFocusDelayMS = 500;
let mixFac = 0.0;

const focusTxtTimeMS = 1000;
const focusTxtDelayMS = 500;

function addRotateCameraTxtAnim(mat4, obj, param, visible, startAngle, endAngle, html, duration, delay){
    param.currentAngle = startAngle;
    if(visible){
        obj.cssObj.visible = true;
    }
    
    new TWEEN.Tween(param)
    .to( {currentAngle : endAngle}, duration)
    .delay( delay )
    .easing( TWEEN.Easing.Linear.None )
    .onUpdate(() =>{
        if(html){
            obj.textEle.innerHTML = html;
        }
        
        updateObjectTransformMatrix(mat4,
            param.axisWorldPos, 
            new THREE.Vector3(), 
            new THREE.Vector3(0, param.currentAngle, 0), 
            new THREE.Vector3(1,1,1));

        let posWorld = param.worldPos.clone();
        posWorld.applyMatrix4(mat4);
        let posLocal = cameraObjectOrg.worldToLocal(posWorld);
        obj.cssObj.position.copy(posLocal);

        obj.cssObj.rotation.set(0, param.currentAngle, 0);
    })
    .onComplete( ()=>{
        if(!visible){
            obj.cssObj.visible = false;
        }
    } ).start();
}

function resetFocusAnimFlag(fac){
    cameraPYMatrix.copy(camera.clone().matrixWorld);
    mouseMovFac = fac;
    cameraBasePos.set(0,0,0);
    targetCameraX = 0;
    targetCameraY = 0;
    focusAnimFlag = false;
}

function onPointerDown(event) {

    if(CELL_INTERSECTED && !focusFlag){
        TWEEN.removeAll();
        focusFlag = true;
        focusAnimFlag = true;
        for(let i = 0; i < objectCSSList.length; i++){
            objectCSSList[i].element.children[0].className = "cellName txtMoveOut";
        }
        returnObj.cssObj.element.children[0].className = "returnTxt txtMoveOut";

        const cell = cellsGroup.children[CELL_INTERSECTED.cellIndex];
        new TWEEN.Tween( camera.position )
        .to( {x : cell.CameraFocusPos.x, y : cell.CameraFocusPos.y, z : cell.CameraFocusPos.z}, cellCameraFocusTimeMS )
        // .easing( TWEEN.Easing.Linear.None )
        .easing( TWEEN.Easing.Quadratic.In )
        .delay( cellCameraFocusDelayMS )
        .onUpdate(() =>{
        })
        .onComplete( ()=>{
            const mat4 = new THREE.Matrix4();
            const title = cellData[ CELL_INTERSECTED.cellIndex * cellDataUnit + 1 ];
            const content = cellContentData[ CELL_INTERSECTED.cellIndex ];

            if(cellData[CELL_INTERSECTED.cellIndex * cellDataUnit + 2] === 'r'){
                addRotateCameraTxtAnim(mat4, focusTitleObjR, focusTitleParamR, true,
                    focusTitleParamR.initAngle, 0, title, focusTxtTimeMS, focusTxtDelayMS);
                addRotateCameraTxtAnim(mat4, focusContentObjL, focusContentParamL, true,
                    focusContentParamL.initAngle, 0, content, focusTxtTimeMS, focusTxtDelayMS)
            }else{
                addRotateCameraTxtAnim(mat4, focusTitleObjL, focusTitleParamL, true,
                    focusTitleParamL.initAngle, 0, title, focusTxtTimeMS, focusTxtDelayMS);
                addRotateCameraTxtAnim(mat4, focusContentObjR, focusContentParamR, true,
                    focusContentParamR.initAngle, 0, content, focusTxtTimeMS, focusTxtDelayMS);
            }

            isCameraLookAtTarget = false;

            new TWEEN.Tween( camera.position )
            .to( {x : cell.CameraFocusPosCross.x, y : cell.CameraFocusPosCross.y, z : cell.CameraFocusPosCross.z}, cellCameraFocusTimeMS )
            .easing( TWEEN.Easing.Quadratic.Out )
            .onUpdate(() =>{
            })
            .onComplete( ()=>{
                returnObj.cssObj.element.children[0].className = "returnTxt txtMoveIn";
                resetFocusAnimFlag(mouseMovFacFocus);
            } ).start();

        } ).start();

        mixFac = ssFacMixCombineMaterial.uniforms[ 'factor' ];
        new TWEEN.Tween( mixFac )
        .to( {value : 1.0}, cellCameraFocusTimeMS )
        .easing( TWEEN.Easing.Linear.None )
        // .easing( TWEEN.Easing.Quadratic.In )
        .delay( cellCameraFocusDelayMS )
        .onComplete( ()=>{
        } ).start();

    }
    
}

const targetReturnTimeMS = 1000;
const cameraReturnDelayMS = 500;
const cameraReturnTimeMS = 2000;

function onReturnClick(){

    if(focusFlag && !focusAnimFlag && !startAnimeFlag){
        TWEEN.removeAll();
        focusAnimFlag = true;

        const target = camera.position.clone();
        target.addScaledVector(camera.getWorldDirection(new THREE.Vector3()), 1);
        cameraCurrentTarget.copy(target);
        isCameraLookAtTarget = true;
        new TWEEN.Tween( cameraCurrentTarget )
        .to( {x : cameraInitTarget.x, y : cameraInitTarget.y, z : cameraInitTarget.z}, targetReturnTimeMS )
        .easing( TWEEN.Easing.Linear.None )
        .onUpdate(() =>{
        })
        .onComplete( ()=>{

        })
        .start();

        const mat4 = new THREE.Matrix4();

        if(cellData[CELL_INTERSECTED.cellIndex * cellDataUnit + 2] === 'r'){
            addRotateCameraTxtAnim(mat4, focusTitleObjR, focusTitleParamR, false, 
                0, focusTitleParamR.initAngle, null, focusTxtTimeMS, 0);
            addRotateCameraTxtAnim(mat4, focusContentObjL, focusContentParamL, false, 
                0, focusContentParamL.initAngle, null, focusTxtTimeMS, 0)
        }else{
            addRotateCameraTxtAnim(mat4, focusTitleObjL, focusTitleParamL, false, 
                0, focusTitleParamL.initAngle, null, focusTxtTimeMS, 0);
            addRotateCameraTxtAnim(mat4, focusContentObjR, focusContentParamR, false, 
                0, focusContentParamR.initAngle, null, focusTxtTimeMS, 0);
        }

        returnObj.cssObj.element.children[0].className = "returnTxt txtMoveOut";
        new TWEEN.Tween( camera.position )
        .to( {x : cameraInitPos.x, y : cameraInitPos.y, z : cameraInitPos.z}, cameraReturnTimeMS )
        .easing( TWEEN.Easing.Quadratic.InOut )
        .delay( cameraReturnDelayMS )
        .onUpdate(() =>{
        })
        .onComplete( ()=>{
            focusFlag = false;
            resetFocusAnimFlag(mouseMovFacNormal);

            for(let i = 0; i < objectCSSList.length; i++){
                objectCSSList[i].element.children[0].className = "cellName txtMoveIn";
            }
            returnObj.cssObj.element.children[0].className = "returnTxt txtMoveIn";
        })
        .start();

        mixFac = ssFacMixCombineMaterial.uniforms[ 'factor' ];
        new TWEEN.Tween( mixFac )
        .to( {value : 0.0}, cameraReturnTimeMS )
        .easing( TWEEN.Easing.Linear.None )
        .delay( cameraReturnDelayMS )
        .onComplete( ()=>{
        } ).start();

    }

}

const mousePos = new THREE.Vector2(0,0);

let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let cameraBasePos = new THREE.Vector3();
let targetCameraX = 0;
let targetCameraY = 0;
let targetCameraZ = 0;

const mouseMovFacNormal = 0.001;
const mouseMovFacFocus = 0.0002;
let mouseMovFac = mouseMovFacNormal;


let cameraAccFac = 0.01;
let cameraAccMin = 0.0001;
let cameraDis = 0.0001;


function onPointerMove( event ) {

    if ( event.isPrimary === false ) return;

    mousePos.set(event.clientX, event.clientY);

    //add camera follow pointer move
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;

    targetCameraX = mouseX * mouseMovFac;
    targetCameraY = -mouseY * mouseMovFac;

    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

let isCameraLookAtTarget = true;

function updateCamera(){
    if(!focusAnimFlag && !startAnimeFlag){
        updateCameraPitchAndYaw();
    }

    if(isCameraLookAtTarget){
        camera.lookAt( cameraCurrentTarget );
    }
    

    cameraObject.position.copy(camera.position);
    cameraObject.rotation.copy(camera.rotation);
}


const cameraPYMatrix = new THREE.Matrix4();

function updateCameraPitchAndYaw(){
    let accX = Math.abs(cameraBasePos.x - targetCameraX) * cameraAccFac;
    accX = accX > cameraAccMin ? accX : 0;

    let accY = Math.abs(cameraBasePos.y - targetCameraY) * cameraAccFac;
    accY = accY > cameraAccMin ? accY : 0;

    let accZ = Math.abs(cameraBasePos.z - targetCameraZ) * cameraAccFac;
    accZ = accZ > cameraAccMin ? accZ : 0;

    cameraBasePos.x += Math.sign(targetCameraX - cameraBasePos.x) * accX;
    cameraBasePos.y += Math.sign(targetCameraY - cameraBasePos.y) * accY;
    cameraBasePos.z += Math.sign(targetCameraZ - cameraBasePos.z) * accZ;

    const pos = cameraBasePos.clone();
    pos.applyMatrix4(cameraPYMatrix);
    camera.position.copy(pos);

}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    rtWidth_cell = window.innerWidth * rtRatio;
    rtHeight_cell = window.innerHeight * rtRatio;

    renderTargetNucleusDepth.setSize(rtWidth_cell, rtHeight_cell);
    renderTargetCell.setSize(rtWidth_cell, rtHeight_cell);
    renderTargetCellMF.setSize(rtWidth_cell, rtHeight_cell);
    renderTargetCellGeo.setSize(rtWidth_cell, rtHeight_cell);
    renderTargetAxonLight.setSize(rtWidth_cell, rtHeight_cell);
    renderTargetOnlyLight.setSize(rtWidth_cell, rtHeight_cell);
    renderTargetGaussianBlur.setSize(rtWidth_cell, rtHeight_cell);
    renderTargetAddCombine.setSize(rtWidth_cell, rtHeight_cell);
    renderTargetMinCombine.setSize(rtWidth_cell, rtHeight_cell);
    renderTargetShow.setSize(rtWidth_cell, rtHeight_cell);

    updateMaterialRelatedToWindow();

    gaussianPass.setSize(window.innerWidth, window.innerHeight);

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight);

    rendererCSS.setSize( window.innerWidth, window.innerHeight );
}

function updateMaterialRelatedToWindow(){
    const aspectRatio = window.innerWidth / window.innerHeight;
    if(aspectRatio > screenOrgAspectRatio){
        ssDarkenMFMaterial.uniforms[ 'threshold' ].value = window.innerHeight / 20 * rtRatio * screenOrgAspectRatio;
        ssDarkenMFMaterial.uniforms[ 'falloff' ].value = window.innerHeight / 20 * rtRatio * screenOrgAspectRatio;
    }else{
        ssDarkenMFMaterial.uniforms[ 'threshold' ].value = window.innerWidth / 20 * rtRatio;
        ssDarkenMFMaterial.uniforms[ 'falloff' ].value = window.innerWidth / 20 * rtRatio;
    }
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

    folder1.close();
    gui.close();
}

const clock = new THREE.Clock();
let lastElapsedTime;
let elapsedTime;
let deltaTime = 0;

function animate(){
    requestAnimationFrame( animate );

    // controls.update();

    stats.update();

    if(!loadCellDone || !loadBrainDone) return;

    playStartAnime();

    updateTime();
    updateFac(elapsedTime);

    updateCamera();

    updateCssLookAtCamera();

    findPointCell();
    updateFocus();

    updatePointLight();

    updateFramePrint();

    TWEEN.update();
    
    render();
    

}

function playStartAnime(){
    if(!brainStartAnime._isPlaying){
        brainStartAnime.start();
        playCellStartAnime();
    }
}

const framePrintIntervalPS = 0.1;
let framePrintAcc = 0;

function updateFramePrint(){
    framePrintAcc += deltaTime;
    if(framePrintAcc >= framePrintIntervalPS){
        framePrint();
        framePrintAcc = 0;
    }
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

    copyMeshListFacAttr(membraneList, membraneHighList);
    copyMeshListFac(nucleusList, nucleusDepthList);
    copyMeshListFacAttr(nucleusList, nucleusHighList);
    

    // updateAxonListFac(elapsedTime, membraneList, axonPointsList);
    updateAxonListFac(elapsedTime, nucleusList);

    brainParticleMesh.material.time = elapsedTime;
    // particleMesh.material.time = elapsedTime;

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

function copyMeshListFac(srcList, dstList){
    for(let i = 0; i < srcList.length; i++){
        dstList[i].material.uniforms[ 'displacementFac' ].value = srcList[i].material.displacementFac;
    }
    
}

function copyMeshListFacAttr(srcList, dstList){
    for(let i = 0; i < srcList.length; i++){
        dstList[i].material.displacementFac = srcList[i].material.displacementFac;
        dstList[i].material.normalFac = srcList[i].material.normalFac;
    }
    
}

function updateAxonListFac(elapsedTime, list){
    for(let i = 0; i < list.length; i++){
        axonPointsList[i].material.rootDisplacementFac = list[i].material.displacementFac;
        axonPointsList[i].material.time = elapsedTime;

        axonGeoList[i].material.rootDisplacementFac = list[i].material.displacementFac;
        // axonGeoList[i].material.displacementFac = list[i].material.displacementFac;
        // axonGeoList[i].material.normalFac = list[i].material.normalFac;
        axonGeoList[i].material.time = elapsedTime;
    }

    for(let i = 0; i < axonLightList.length; i++){
        axonLightList[i].pointLightMesh.material.rootDisplacementFac = list[axonLightList[i].cellIndex].material.displacementFac;
        axonLightList[i].pointLightMesh.material.time = elapsedTime;
    }
}

function framePrint(){

}

function updateCssLookAtCamera() {
    if(!focusFlag){
        for(let i = 0; i < objectCSSList.length; i++){
            objectCSSList[i].lookAt(camera.position.clone());
        }
    }
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(1.0, 1.0);
let CELL_INTERSECTED = null;

function findPointCell(){
    if(focusFlag || startAnimeFlag) return;
    
    raycaster.setFromCamera( pointer, camera );
    let intersects = raycaster.intersectObjects( membraneList );
    if ( intersects.length > 0 ) {
        if(CELL_INTERSECTED != intersects[ 0 ].object){
            CELL_INTERSECTED = intersects[ 0 ].object;
        }
        
    }else{
        CELL_INTERSECTED = null;
    }

}

let darkenFac = 1.0;
const darkenFacMin = 0.05;
const darkenFacMax = 1.0;
const darkenFacSpeedPS = 2.0;

let focusPos = new THREE.Vector2(0.0, 0.0);
let hasFocus = false;
const focusMoveTimeMS = 300;
const focusFadeTimeMS = 1000;
let pointCellIndex = -1;
let focusColorFac = new THREE.Vector3(0.0,0.0,0.0);
let fadeTween;
let colorTween;

function updateFocus(){
    if(!deltaTime || startAnimeFlag) return;

    if(CELL_INTERSECTED && !focusFlag){
        darkenFac -= darkenFacSpeedPS * deltaTime;
        darkenFac = Math.max(darkenFac, darkenFacMin);

        // const posData = cellData[CELL_INTERSECTED.cellIndex * cellDataUnit];
        // const posNDC = new THREE.Vector3(posData[0], posData[1], posData[2]).project(camera);
        const cell = cellsGroup.children[CELL_INTERSECTED.cellIndex];
        const posNDC = new THREE.Vector3(cell.position.x, cell.position.y, cell.position.z).project(camera);
        const glX = (posNDC.x + 1.0) * 0.5 * rtWidth_cell;
        const glY = (posNDC.y + 1.0) * 0.5 * rtHeight_cell;

        if(!hasFocus){
            focusPos.set(glX, glY);
            focusColorFac.set(CELL_INTERSECTED.focusColorFac.x, 
                CELL_INTERSECTED.focusColorFac.y, CELL_INTERSECTED.focusColorFac.z);
            hasFocus = true;

        }else if(hasFocus && pointCellIndex !== CELL_INTERSECTED.cellIndex){

            new TWEEN.Tween( focusPos )
            .to( {x : glX, y : glY}, focusMoveTimeMS )
            .easing( TWEEN.Easing.Linear.None )
            .start();

            if(fadeTween){
                TWEEN.remove(fadeTween);
                fadeTween = null;
            }
            
            colorTween = new TWEEN.Tween( focusColorFac )
            .to( {x : CELL_INTERSECTED.focusColorFac.x, y : CELL_INTERSECTED.focusColorFac.y, z : CELL_INTERSECTED.focusColorFac.z}, focusMoveTimeMS )
            .easing( TWEEN.Easing.Linear.None )
            .start();

        }
        pointCellIndex = CELL_INTERSECTED.cellIndex;
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

function updatePointLight(){
    if(!deltaTime) return;

    let node, nextNode;
    let pos, nextPos;
    let randBranchIndex;

    for(let i = 0; i < axonLightList.length; i++){
        const pointLight = axonLightList[i];

        let acc = pointLight.layerFac;
        acc += (deltaTime * pointLight.layerFacAccPS);
        const a = Math.min(Math.floor(acc), 1);
        pointLight.layerFac = acc - a;

        if(pointLight.axonNode.branches.length > 0){
            if(pointLight.fadeInOutFac < 1){
                const fac = pointLight.fadeInOutFac + deltaTime * pointLight.fadeInOutPS;
                pointLight.fadeInOutFac = Math.min(fac, 1);
            }
            pointLight.pointLightMesh.material.intensity = axonLightMaterialIntensityFull * pointLight.fadeInOutFac;
            pointLight.light.intensity = axonLightIntensityFull * pointLight.fadeInOutFac;

            if(a === 1){
                randBranchIndex = getRandomIntBetween(0, pointLight.axonNode.branches.length - 1);
                node = pointLight.axonNode.branches[randBranchIndex];
                pos = node.position;
                if(node.branches.length > 0){
                    randBranchIndex = getRandomIntBetween(0, node.branches.length - 1);
                    nextNode = node.branches[randBranchIndex];
                    nextPos = nextNode.position;
                }else{
                    nextNode = node;
                    nextPos = nextNode.position;
                    pointLight.layerFac = 0;
                }
            }else{
                node = pointLight.axonNode;
                pos = node.position;
                randBranchIndex = getRandomIntBetween(0, node.branches.length - 1);
                nextNode = node.branches[randBranchIndex];
                nextPos = nextNode.position;
                
            }
            pointLight.position.lerpVectors(pos, nextPos, pointLight.layerFac);
            pointLight.axonNode = node;
        }else{
            if(pointLight.fadeInOutFac === 0){
                const cellIndex = pointLight.cellIndex;
                initLightMaterialProp(pointLight, cellIndex, false);
                const headIndex = pointLight.headIndex;
                node = nucleusHighList[cellIndex].axonListHeads[headIndex];
                randBranchIndex = getRandomIntBetween(0, node.branches.length - 1);
                nextNode = node.branches[randBranchIndex];
                // pointLight.layerFac = 0;
            }else{
                node = pointLight.axonNode;
                nextNode = node;
                const fac = pointLight.fadeInOutFac - deltaTime * pointLight.fadeInOutPS;
                pointLight.fadeInOutFac = Math.max(fac, 0);
                pointLight.pointLightMesh.material.intensity = axonLightMaterialIntensityFull * pointLight.fadeInOutFac;
                pointLight.light.intensity = axonLightIntensityFull * pointLight.fadeInOutFac;

            }
        }
        pointLight.pointLightMesh.material.layerFac = pointLight.layerFac;
        pointLight.pointLightMesh.material.layer0 = node.layer;
        pointLight.pointLightMesh.material.layer1 = nextNode.layer;
    } 

}

function setChildrenVisibleByName(parent, name, flag){
    parent.traverse((obj) => {
        if(obj.name === name){
           obj.visible = flag;
        }
    });
}

function render(){

    if(!startAnimeFlag){
        rendererCSS.render(sceneCSS, camera);
    }
    

    // renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );

    // cellsGroup.visible = false;
    // cellsGeoGroup.visible = false;

    // renderer.setRenderTarget( null );
    // renderer.clear();
    // renderer.render( sceneCells, camera );

    if(mixFac != 1){
        renderer.setRenderTarget( renderTargetNucleusDepth );
        renderer.clear();
        renderer.render( sceneNucleusDepth, camera );
    
    
        renderer.setRenderTarget( renderTargetCell );
        // renderer.setRenderTarget( null );
        renderer.clear();
        renderer.render( sceneCells, camera );
    
        screenMesh.material = ssDarkenMFMaterial;
        ssDarkenMFMaterial.uniforms[ 'devicePixelRatio' ].value = 1.0;
        renderer.setRenderTarget( renderTargetCellMF );
        // renderer.setRenderTarget( null );
        renderer.clear();
        renderer.render( sceneScreen, camera );
    }
    
    // if(mixFac != 0){
        setChildrenVisibleByName(cellsGeoGroup, 'cellGeo', true);
        renderer.setRenderTarget( renderTargetCellGeo );
        renderer.clear();
        renderer.render( sceneCellsGeo, camera );
    
        gaussianPass.setTexture(renderTargetCellGeo.texture);
        gaussianPass.render(renderer, renderTargetGaussianBlur);
    
        // screenMesh.material = axonLightExtractMaterial;
        // renderer.setRenderTarget( renderTargetAxonLight );
        // renderer.clear();
        // renderer.render( sceneScreen, camera );
    
        // setChildrenVisibleByName(cellsGeoGroup, 'cellGeo', false);
        // renderer.setRenderTarget( renderTargetOnlyLight );
        // renderer.clear();
        // renderer.render( sceneCellsGeo, camera );
    
        // minCombineMaterial.uniforms[ 'tScreen0' ].value = renderTargetCellGeo.texture;
        // minCombineMaterial.uniforms[ 'tScreen1' ].value = renderTargetOnlyLight.texture;
        // screenMesh.material = minCombineMaterial;
        // renderer.setRenderTarget( renderTargetMinCombine );
        // renderer.clear();
        // renderer.render( sceneScreen, camera );
        
        // gaussianPass.setTexture(renderTargetMinCombine.texture);
        // gaussianPass.render(renderer, renderTargetGaussianBlur);
    
        // addCombineMaterial.uniforms[ 'tScreen0' ].value = renderTargetCellGeo.texture;
        // addCombineMaterial.uniforms[ 'tScreen1' ].value = renderTargetGaussianBlur.texture;
        // screenMesh.material = addCombineMaterial;
        // renderer.setRenderTarget( renderTargetAddCombine );
        // renderer.clear();
        // renderer.render( sceneScreen, camera );
    
        screenMesh.material = ssShowMaterial;
        // ssShowMaterial.uniforms[ 'tScreen' ].value = renderTargetCellGeo.texture;
        // ssShowMaterial.uniforms[ 'tScreen' ].value = renderTargetAddCombine.texture;
        ssShowMaterial.uniforms[ 'tScreen' ].value = renderTargetGaussianBlur.texture;
        ssShowMaterial.uniforms[ 'toneMapping' ].value = true;
        renderer.setRenderTarget( renderTargetShow );
        // renderer.setRenderTarget( null );
        renderer.clear();
        renderer.render( sceneScreen, camera );
    // }

    screenMesh.material = ssFacMixCombineMaterial;
    renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneScreen, camera );
}

init();
buildGui();
animate();