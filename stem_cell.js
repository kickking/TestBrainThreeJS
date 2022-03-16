import { TWEEN } from './examples/jsm/libs/tween.module.min.js';

let sceneCells, sceneScreen;
let sceneNucleusDepth;
let sceneCSS;
let sceneCellsGeo;

let camera;

let renderer;
let rendererCSS;

let loadDone = false;

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
const cellGeoList = [];

const axon = new THREE.Axon({
    AxonCount : 6,
    AxonRootRotAxisAngleMax: 10,
    AxonRadiusMax: 0.12,
    AxonRadiusMin: 0.001,
    AxonSplitRatio: 0.015,
    AxonLayerMaxCount: 60,
    AxonLayerMaxLength: 0.04,
    AxonLayerMinLength: 0.02,
    AxonLayerTotalMaxLength: 3,
    AxonRotAxisMaxAngle:  5,
    AxonSegments: (2 * 8),
    AxonRadiusAttenuationSpeed: 4,
    AxonSizeAttenuationSpeed: 2,
    AxonColorIntensity: 0.2,
});

let ssShowMaterial, ssBlurMaterial, ssBlurMFMaterial, ssDarkenMFMaterial;
let ssFacMixCombineMaterial;
let pointMaterial, spherePointsMaterial, axonPointsMaterial, axonGeoMaterial;
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

let particleMesh;
let screenMesh;

// let controls;

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
    [1.0, 1.0, 1.0], "一字长蛇阵", 'r',
    [0.8, -1.7, -1.6], "二龙出水阵", 'l',
    [-1.0, -0.9, -1.5], "天地三才阵", 'r',
    [-1.2, 1.1, 0.1], "四门兜底阵", 'l',
    [-2.0, 0.3, 2.0], "五虎群羊阵", 'l',
    [1.5, -0.4, 2.3], "六丁六甲阵", 'r',
    [-2.4, -0.9, 0.3], "七星北斗阵", 'l',
    [-0.0, 0.3, 0.8], "八门金锁阵", 'l',
    [4.0, 1.5, -1.8], "九字连环阵", 'r',
];
const cellDataUnit = 3;

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

const cellCameraFacusDist = cellRadius * cellScale * 8;

const cssScale = 0.01;

const axonLightList = [];
const axonLightCount = 1;
const baseLayerFacAccPS = 10;
let gaussianPass;

function init(){

    sceneCells = new THREE.Scene();
    sceneScreen = new THREE.Scene();
    sceneNucleusDepth = new THREE.Scene();
    sceneCSS = new THREE.Scene();
    sceneCellsGeo = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
    camera.position.set( cameraPos.x, cameraPos.y, cameraPos.z );
    camera.lookAt(0,0,0);

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
    const particleColorScalar = 0.1;


    for ( let i = 0; i < 5000; i ++ ) {
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

        particleColor.setRGB(Math.random(), Math.random(), Math.random()).multiplyScalar(particleColorScalar);
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
        membraneHigh: null,
        nucleusHigh: null,
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

    for(let i = 0; i < axon.AxonCount; i++){
        axonHeadIndexSetInitArray.push(i);
    }

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


        for(let i = 0; i < cellData.length; i += cellDataUnit){
            const cell = new THREE.Object3D();
            const cellDepth = new THREE.Object3D();
            const cellGeo = new THREE.Object3D();
            cellGeo.name = 'cellGeo';
            
            const membrane = cellMeshes.membrane.clone();
            membrane.material = membraneMaterial.clone();
            membrane.scale.setScalar(cellScale);
            membrane.cellIndex = i / cellDataUnit;

            const spherical = new THREE.Spherical();
            spherical.setFromCartesianCoords(cellData[i][0], cellData[i][1], cellData[i][2]);
            membrane.focusColorFac = new THREE.Vector3(1.0, 1.0, 1.0);
            const randsM = [Math.random(), Math.random(), Math.random(), Math.random()];
            membrane.rands = randsM;
            membraneList.push(membrane);

            const nucleus = cellMeshes.nucleus.clone();
            nucleus.material = nucleusMaterial.clone();
            nucleus.scale.setScalar(cellScale);
            axon.makeAxonIndexOnMesh(nucleus);
            axon.makeAxonListHeadsOnMesh(nucleus);
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
            cell.position.set(cellData[i][0], cellData[i][1], cellData[i][2]);
            cell.orgPos = new THREE.Vector3(cellData[i][0], cellData[i][1], cellData[i][2]);

            initCellCameraFocus(cell, cellData[i + 2]);

            initCssFocus(cell);

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
            cellDepth.position.set(cellData[i][0], cellData[i][1], cellData[i][2]);
            cellsDepthGroup.add(cellDepth);


            const axonHeadIndexSet = new Set(axonHeadIndexSetInitArray);
            axonHeadIndexSets.push(axonHeadIndexSet);
        }

        for(let i = 0; i < cellGeoList.length; i++){
            const axonLights = new THREE.Object3D();
            // axonLights.name = 'axonLights';

            for(let j = 0; j < axonLightCount; j++){
                const pointLight = new THREE.Object3D();
                initLightMaterialProp(pointLight, i, true);
                axonLights.add(pointLight);
                axonLightList.push(pointLight);
            }
            
            axonLights.position.copy(cellGeoList[i].position);
            cellsGeoGroup.add(axonLights);
        }

        sceneCells.add(cellsGroup);
        sceneNucleusDepth.add(cellsDepthGroup);
        sceneCellsGeo.add(cellsGeoGroup);
        loadDone = true;

    } );

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

function initCellCameraFocus(cell, targetLoc){
    const dir = new THREE.Vector3().subVectors(cell.orgPos, new THREE.Vector3(0,0,0)).normalize();
    cell.CameraFocusPos = new THREE.Vector3().copy(cell.orgPos);
    cell.CameraFocusPos.addScaledVector(dir, cellCameraFacusDist);
    cell.CameraFocusTarget = new THREE.Vector3(0,0,0);

    let mat4;
    if(targetLoc === 'l'){
        mat4 = makeObjectTransformMatrix(cell.CameraFocusPos, 
            new THREE.Vector3(), new THREE.Vector3(0, -Math.PI / 9, 0), new THREE.Vector3(1,1,1));
    }else if(targetLoc === 'r'){
        mat4 = makeObjectTransformMatrix(cell.CameraFocusPos, 
            new THREE.Vector3(), new THREE.Vector3(0, Math.PI / 9, 0), new THREE.Vector3(1,1,1));
    }
    
    cell.CameraFocusTarget.applyMatrix4(mat4);
}

function initCssFocus(cell){
    const dir = new THREE.Vector3().subVectors(cell.orgPos, new THREE.Vector3(0,0,0)).normalize();
    cell.cssFocusPos = new THREE.Vector3().copy(cell.orgPos);
    cell.cssFocusPos.addScaledVector(dir, cellTxtDisRaduis);
    
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

function initLightMaterialProp(pointLight, cIndex, flag){

    if(flag){
        const lightMaterial = axonLightMaterial.clone();
        // const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        const color = new THREE.Color(0.2, 0.2, 1.0);
        lightMaterial.color.copy(color);
        const pointLightMesh = new THREE.Mesh( new THREE.SphereGeometry( 0.01, 6, 6 ), lightMaterial);
        pointLight.add(pointLightMesh);
        pointLight.pointLightMesh = pointLightMesh;
        pointLight.add( new THREE.PointLight( color.getHex(), 2, 2 ) );
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
    // pointTexture.premultiplyAlpha = true;
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

    ssBlurMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone( THREE.SSSimpleBlurShader.uniforms ),
        vertexShader: THREE.SSSimpleBlurShader.vertexShader,
        fragmentShader: THREE.SSSimpleBlurShader.fragmentShader,
        depthWrite: false,
    });
    ssBlurMaterial.defines[ 'KERNEL_SIZE' ] = 9;
    ssBlurMaterial.uniforms[ 'tScreen' ].value = renderTargetCell.texture;

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
    ssBlurMFMaterial.uniforms[ 'resolution' ].value = new THREE.Vector2(window.innerWidth, window.innerHeight);
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
    // ssDarkenMFMaterial.uniforms[ 'threshold' ].value = 80 * rtRatio;
    // ssDarkenMFMaterial.uniforms[ 'falloff' ].value = 80 * rtRatio;
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
    // ssFacMixCombineMaterial.uniforms[ 'tScreen1' ].value = renderTargetCellGeo.texture;
    ssFacMixCombineMaterial.uniforms[ 'tScreen1' ].value = renderTargetShow.texture;
    ssFacMixCombineMaterial.uniforms[ 'factor' ].value = 0;

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

    axonPointsMaterial = new THREE.AxonPointsMaterial({
        size: 0.2, 
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
        // viewPort: new THREE.Vector2(window.innerWidth, window.innerHeight).multiplyScalar(window.devicePixelRatio),

    });
    axonPointsMaterial.rootDisplacementFac = 0;
    axonPointsMaterial.time = 0;


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
        intensity: 10,
    });
    axonLightMaterial.rootDisplacementFac = 0;
    axonLightMaterial.layerFac = 0;
    axonLightMaterial.time = 0;

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

let clickCell = false;
const cellCameraFocusTimeMS = 3000;
let mixFac = 0.0;


function onPointerDown(event) {

    if(CELL_INTERSECTED && !clickCell){
        clickCell = true;
        for(let i = 0; i < objectCSSList.length; i++){
            objectCSSList[i].element.children[0].className = "cellName txtMoveOut";
        }
        
        new TWEEN.Tween( this )
        .to( {}, 500 )
        .onComplete( ()=>{
            objectCSSList[CELL_INTERSECTED.cellIndex].element.children[0].className = "cellName focus";
            objectCSSList[CELL_INTERSECTED.cellIndex].position.copy(cellList[CELL_INTERSECTED.cellIndex].cssFocusPos);
        } ).start();

        const cell = cellsGroup.children[CELL_INTERSECTED.cellIndex];
        new TWEEN.Tween( camera.position )
        .to( {x : cell.CameraFocusPos.x, y : cell.CameraFocusPos.y, z : cell.CameraFocusPos.z}, cellCameraFocusTimeMS )
        // .easing( TWEEN.Easing.Linear.None )
        .easing( TWEEN.Easing.Quadratic.InOut )
        .delay( 500 )
        .onComplete( ()=>{
        } ).start();

        new TWEEN.Tween( cameraTarget )
        .to( {x : cell.CameraFocusTarget.x, y : cell.CameraFocusTarget.y, z : cell.CameraFocusTarget.z}, cellCameraFocusTimeMS )
        // .easing( TWEEN.Easing.Linear.None )
        .easing( TWEEN.Easing.Quadratic.InOut )
        .delay( 500 )
        .onComplete( ()=>{
        } ).start();


        mixFac = ssFacMixCombineMaterial.uniforms[ 'factor' ];
        new TWEEN.Tween( mixFac )
        .to( {value : 1.0}, cellCameraFocusTimeMS )
        .easing( TWEEN.Easing.Linear.None )
        // .easing( TWEEN.Easing.Quadratic.In )
        .delay( 500 )
        .onComplete( ()=>{
        } ).start();

    }
    
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


function onPointerMove( event ) {

    if ( event.isPrimary === false ) return;

    mousePos.set(event.clientX, event.clientY);

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
    if(!clickCell){
        updateCameraPitchAndYaw();
    }
    camera.lookAt( cameraTarget );
}

function updateCameraPitchAndYaw(){
    let accX = Math.abs(camera.position.x - targetCameraX) * cameraAccFac;
    accX = accX > cameraAccMin ? accX : 0;

    let accY = Math.abs(camera.position.y - targetCameraY) * cameraAccFac;
    accY = accY > cameraAccMin ? accY : 0;

    let accZ = Math.abs(camera.position.z - targetCameraZ) * cameraAccFac;
    accZ = accZ > cameraAccMin ? accZ : 0;

    camera.position.x += Math.sign(targetCameraX - camera.position.x) * accX;
    camera.position.y += Math.sign(targetCameraY - camera.position.y) * accY;
    camera.position.z += Math.sign(targetCameraZ - camera.position.z) * accZ;

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

    folder1.open();
}

const clock = new THREE.Clock();
let lastElapsedTime;
let elapsedTime;
let deltaTime = 0;

function animate(){
    requestAnimationFrame( animate );

    // controls.update();

    stats.update();

    if(!loadDone) return;

    updateTime();
    updateFac(elapsedTime);

    updateCamera();

    updateCssLookAtCamera();

    // ssBlurMFMaterial.uniforms[ 'mousePos' ].value = mousePos;

    findPointCell();
    updateFocus();

    updatePointLight();

    updateFramePrint();

    TWEEN.update();
    
    render();
    

}

const framePrintIntervalPS = 1;
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

function updateCssLookAtCamera() {
    for(let i = 0; i < objectCSSList.length; i++){
        objectCSSList[i].lookAt(camera.position.clone());
    }
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(1.0, 1.0);
let CELL_INTERSECTED = null;

function findPointCell(){
    raycaster.setFromCamera( pointer, camera );
    let intersects = raycaster.intersectObjects( membraneList );
    if ( intersects.length > 0 ) {
        if(CELL_INTERSECTED != intersects[ 0 ].object){
            // const index = intersects[ 0 ].object.cellIndex;
            // console.log(cellData[index * 2 + 1]);
            CELL_INTERSECTED = intersects[ 0 ].object;
        }
        
    }else{
        CELL_INTERSECTED = null;
    }

}

let darkenFac = 1.0;
const darkenFacMin = 0.05;
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

    // if(clickCell) return;

    if(CELL_INTERSECTED && !clickCell){
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

function framePrint(){

    // console.log(axonLightList[0].pointLightMesh.material.layer0);
    // console.log(axonLightList[0].pointLightMesh.material.layer1);
    // console.log(axonLightList[0].pointLightMesh.material.layerFac);
    
    
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
            const cellIndex = pointLight.cellIndex;
            initLightMaterialProp(pointLight, cellIndex, false);
            const headIndex = pointLight.headIndex;
            node = nucleusHighList[cellIndex].axonListHeads[headIndex];
            randBranchIndex = getRandomIntBetween(0, node.branches.length - 1);
            nextNode = node.branches[randBranchIndex];
            pointLight.layerFac = 0;
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

    rendererCSS.render(sceneCSS, camera);

    renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );

    if(mixFac != 1){
        renderer.setRenderTarget( renderTargetNucleusDepth );
        renderer.clear();
        renderer.render( sceneNucleusDepth, camera );
    
    
        renderer.setRenderTarget( renderTargetCell );
        renderer.clear();
        renderer.render( sceneCells, camera );
    
        screenMesh.material = ssDarkenMFMaterial;
        ssDarkenMFMaterial.uniforms[ 'devicePixelRatio' ].value = 1.0;
        renderer.setRenderTarget( renderTargetCellMF );
        renderer.clear();
        renderer.render( sceneScreen, camera );
    }
    
    if(mixFac != 0){
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
        // ssShowMaterial.uniforms[ 'tScreen' ].value = renderTargetAddCombine.texture;
        ssShowMaterial.uniforms[ 'tScreen' ].value = renderTargetGaussianBlur.texture;
        ssShowMaterial.uniforms[ 'toneMapping' ].value = true;
        renderer.setRenderTarget( renderTargetShow );
        // renderer.setRenderTarget( null );
        renderer.clear();
        renderer.render( sceneScreen, camera );
    }

    screenMesh.material = ssFacMixCombineMaterial;
    renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneScreen, camera );
}

init();
buildGui();
animate();