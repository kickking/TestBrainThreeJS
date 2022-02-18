let sceneCells, sceneScreen;
let sceneNucleusDepth;

let camera;

let renderer;

let loadDone = false;

let membraneNormalMap, membraneNormalMap1, membraneDispMap, membraneDispMap1;
let nucleusBaseColor, nucleusNormalMap, nucleusNormalMap1, nucleusDispMap, nucleusDispMap1;

let nucleusDepthMaterial;
let membraneMaterial, nucleusMaterial;

const membraneList = [];
const nucleusList = [];
const nucleusDepthList = [];
const axonPointsList = [];

const axon = new THREE.Axon({
    AxonCount : 8,
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

let ssShowMaterial, ssBlurMaterial, ssBlurMFMaterial;
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
    'loft_hall': { filename: 'photo_studio_loft_hall_1k.hdr' },        
    'artist_workshop': { filename: 'artist_workshop_1k.hdr' },
    'christmas': { filename: 'christmas_photo_studio_01_1k.hdr' },
    'cayley_interior': { filename: 'cayley_interior_1k.hdr' },
    
};

function init(){
    const container = document.createElement( 'div' );
	document.body.appendChild( container );

    sceneCells = new THREE.Scene();

    sceneScreen = new THREE.Scene();

    sceneNucleusDepth = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
    camera.position.set( 0, 0, 5.5 );

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


    const cellData = [
        [1.0, 1.0, 1.0],
        [1.1, -1.4, -1.5],
        [-1.0, -0.9, -1.5],
        [-1.2, 1.1, 0.1],
        [-2.0, 0.3, 2.0],
        [1.3, -0.4, 2.7],
        [-2.4, -0.9, 0.3],
        [-0.0, 0.3, 0.0],
        [4.5, 1.5, -2.9],
    ];

    const cellMeshes = {
        membrane: null,
        nucleus: null,
    };

    const cellScale = 0.2;
    const cellParticleCount = 2000;
    const cellParticleDisRaduisMin = 1.33 * cellScale;
    const cellParticleDisRaduisMax = 1.33 * cellScale * 3;
    const cellsGroup = new THREE.Group();
    const cellsDepthGroup = new THREE.Group();

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

        for(let i = 0; i < cellData.length; i++){
            const cell = new THREE.Object3D();
            const cellDepth = new THREE.Object3D();

            const membrane = cellMeshes.membrane.clone();
            membrane.material = membraneMaterial.clone();
            membrane.scale.setScalar(cellScale);
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

    // screenMesh = new THREE.Mesh(new THREE.PlaneGeometry( 2, 2 ), ssBlurMFMaterial);
    screenMesh = new THREE.Mesh(new THREE.PlaneGeometry( 2, 2 ), ssShowMaterial);
    sceneScreen.add(screenMesh);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );

    const axesHelper = new THREE.AxesHelper(1000);
    sceneScreen.add(axesHelper);

    controls = new THREE.OrbitControls( camera, container );

    stats = new Stats();
    container.appendChild( stats.dom );

    document.body.style.touchAction = 'none';
    document.body.addEventListener( 'pointermove', onPointerMove );

    window.addEventListener( 'resize', onWindowResize );

}

function initRenderTarget(){
    renderTargetNucleusDepth = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
        { minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            encoding: THREE.LinearEncoding,
            type: THREE.FloatType,
        } );

    renderTargetCell = new THREE.WebGLRenderTarget( window.innerWidth * 2, window.innerHeight * 2, 
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
    nucleusDispMap1.flipY = false;

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

    pointMaterial = new THREE.PointsMaterial( {   
        size: 0.1, 
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
        // color: 0xffffff, 
        map: pointTexture,
        blending: THREE.CustomBlending, 
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.DstAlphaFactor,
        blendEquation: THREE.AddEquation,
        depthTest: false, 
        transparent: true,
        vertexColors: true,
        // alphaTest: 0.001,
        // premultipliedAlpha: true, 
        noiseMap: noiseTexture,
    });
    spherePointsMaterial.time = 0;

    axonPointsMaterial = new THREE.AxonPointsMaterial({
        size: 0.15, 
        // color: 0xffffff, 
        map: pointTexture,
        blending: THREE.CustomBlending, 
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.DstAlphaFactor,
        blendEquation: THREE.AddEquation,
        depthTest: false, 
        transparent: true,
        vertexColors: true,
        // alphaTest: 0.001,

        rootDisplacementScale: 0.3,
        rootDisplacementBias: 0.0,
        rootDisplacementMap: nucleusDispMap,
        rootDisplacementMap1: nucleusDispMap1,
        noiseMap: noiseTexture,
        depthMap: renderTargetNucleusDepth.texture,
        layerMax: axon.AxonLayerMaxCount,
        viewPort: new THREE.Vector2(window.innerWidth, window.innerHeight),
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

function onPointerMove( event ) {

    if ( event.isPrimary === false ) return;

    mousePos.set(event.clientX, event.clientY);

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
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

function animate(){
    requestAnimationFrame( animate );

    controls.update();

    stats.update();

    if(!loadDone) return;
    
    updateFac();

    render();
}

let flag = 0;

function updateFac(){
    const elapsedTime = clock.getElapsedTime();
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

function render(){

    renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );

    renderer.setRenderTarget( renderTargetNucleusDepth );
    // renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneNucleusDepth, camera );

    renderer.setRenderTarget( renderTargetCell );
    renderer.clear();
    renderer.render( sceneCells, camera );

    // ssBlurMFMaterial.uniforms[ 'mousePos' ].value = mousePos;
    renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneScreen, camera );
}

init();
buildGui();
animate();