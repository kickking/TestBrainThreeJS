let container, stats;
let renderer;
let camera, cameraRT;
let scene, sceneRT, sceneSSS;
let model, modelRT;

let renderTargetIrradiance, renderTargetSpecular, renderTargetSSSAlbedo, renderTargetDepth, renderTargetFirstPass;
// let multiRenderTarget;

let materialBase, materialIrradiance, materialSpecular, materialSSSAlbedo, materialDepth, materialFirstPass, materialSecondPass;

const halfWidth = window.innerWidth / 2;

let loadModelDone = false;

// let supportsExtension = true;
let quad;

let kernel = [
    new THREE.Vector4(0.530605, 0.613514, 0.739601, 0),
    new THREE.Vector4(0.000973794, 1.11862e-005, 9.43437e-007, -3),
    new THREE.Vector4(0.00333804, 7.85443e-005, 1.2945e-005, -2.52083),
    new THREE.Vector4(0.00500364, 0.00020094, 5.28848e-005, -2.08333),
    new THREE.Vector4(0.00700976, 0.00049366, 0.000151938, -1.6875),
    new THREE.Vector4(0.0094389, 0.00139119, 0.000416598, -1.33333),
    new THREE.Vector4(0.0128496, 0.00356329, 0.00132016, -1.02083),
    new THREE.Vector4(0.017924, 0.00711691, 0.00347194, -0.75),
    new THREE.Vector4(0.0263642, 0.0119715, 0.00684598, -0.520833),
    new THREE.Vector4(0.0410172, 0.0199899, 0.0118481, -0.333333),
    new THREE.Vector4(0.0493588, 0.0367726, 0.0219485, -0.1875),
    new THREE.Vector4(0.0402784, 0.0657244, 0.04631, -0.0833333),
    new THREE.Vector4(0.0211412, 0.0459286, 0.0378196, -0.0208333),
    new THREE.Vector4(0.0211412, 0.0459286, 0.0378196, 0.0208333),
    new THREE.Vector4(0.0402784, 0.0657244, 0.04631, 0.0833333),
    new THREE.Vector4(0.0493588, 0.0367726, 0.0219485, 0.1875),
    new THREE.Vector4(0.0410172, 0.0199899, 0.0118481, 0.333333),
    new THREE.Vector4(0.0263642, 0.0119715, 0.00684598, 0.520833),
    new THREE.Vector4(0.017924, 0.00711691, 0.00347194, 0.75),
    new THREE.Vector4(0.0128496, 0.00356329, 0.00132016, 1.02083),
    new THREE.Vector4(0.0094389, 0.00139119, 0.000416598, 1.33333),
    new THREE.Vector4(0.00700976, 0.00049366, 0.000151938, 1.6875),
    new THREE.Vector4(0.00500364, 0.00020094, 5.28848e-005, 2.08333),
    new THREE.Vector4(0.00333804, 7.85443e-005, 1.2945e-005, 2.52083),
    new THREE.Vector4(0.000973794, 1.11862e-005, 9.43437e-007, 3),
];

// let kernel1 = [
//     0.530605, 0.613514, 0.739601, 0,
//     0.000973794, 1.11862e-005, 9.43437e-007, -3,
//     0.00333804, 7.85443e-005, 1.2945e-005, -2.52083,
//     0.00500364, 0.00020094, 5.28848e-005, -2.08333,
//     0.00700976, 0.00049366, 0.000151938, -1.6875,
//     0.0094389, 0.00139119, 0.000416598, -1.33333,
//     0.0128496, 0.00356329, 0.00132016, -1.02083,
//     0.017924, 0.00711691, 0.00347194, -0.75,
//     0.0263642, 0.0119715, 0.00684598, -0.520833,
//     0.0410172, 0.0199899, 0.0118481, -0.333333,
//     0.0493588, 0.0367726, 0.0219485, -0.1875,
//     0.0402784, 0.0657244, 0.04631, -0.0833333,
//     0.0211412, 0.0459286, 0.0378196, -0.0208333,
//     0.0211412, 0.0459286, 0.0378196, 0.0208333,
//     0.0402784, 0.0657244, 0.04631, 0.0833333,
//     0.0493588, 0.0367726, 0.0219485, 0.1875,
//     0.0410172, 0.0199899, 0.0118481, 0.333333,
//     0.0263642, 0.0119715, 0.00684598, 0.520833,
//     0.017924, 0.00711691, 0.00347194, 0.75,
//     0.0128496, 0.00356329, 0.00132016, 1.02083,
//     0.0094389, 0.00139119, 0.000416598, 1.33333,
//     0.00700976, 0.00049366, 0.000151938, 1.6875,
//     0.00500364, 0.00020094, 5.28848e-005, 2.08333,
//     0.00333804, 7.85443e-005, 1.2945e-005, 2.52083,
//     0.000973794, 1.11862e-005, 9.43437e-007, 3,
// ];

const SHD_SUBSURFACE_CUBIC = 1;
const SHD_SUBSURFACE_GAUSSIAN = 2;
const SHD_SUBSURFACE_BURLEY = 3;
const SHD_SUBSURFACE_RANDOM_WALK = 4;

const M_PI = 3.14159265358979323846;
const M_1_PI = 0.318309886183790671538;/* 1/pi */
const SSS_EXPONENT = 2.0; /* Importance sampling exponent */
const MAX_SSS_SAMPLES = 65;

let sss_kernel = [];
let sample_len = 25;
for(let i = 0; i < MAX_SSS_SAMPLES; i++){
    sss_kernel.push(new THREE.Vector4(0.0, 0.0, 0.0, 0.0));
}

let max_radius;
let param = [];
let radii = [1.0, 0.2, 0.1];
let falloff_type = SHD_SUBSURFACE_BURLEY;
let sharpness = 1.0;
let sssJitterThreshold = 0.3;


function MAX2(x, y){
    return x > y ? x : y;
}

function MAX3(a, b, c){
    return ((a > b) ? ((a > c) ? a : c) : ((b > c) ? b : c));
}

function mul_v3_v3fl(r, a, f){
    r[0] = a[0] * f;
    r[1] = a[1] * f;
    r[2] = a[2] * f;
}

function mul_v3_fl(r, f)
{
  r[0] *= f;
  r[1] *= f;
  r[2] *= f;
}

function copy_v3_v3(r, a)
{
    r[0] = a[0];
    r[1] = a[1];
    r[2] = a[2];
}

function copy_v4_Three_v4(r, a)
{
    r[0] = a.x;
    r[1] = a.y;
    r[2] = a.z;
    r[3] = a.w;
}

function copy_Three_v4_Three_v4(r, a)
{
    r.x = a.x;
    r.y = a.y;
    r.z = a.z;
    r.w = a.w;
}

function copy_Three_v4_v4(r, a)
{
    r.x = a[0];
    r.y = a[1];
    r.z = a[2];
    r.w = a[3];
}

function sss_calculate_offsets(count, exponent){
    let step = 2.0 / (count - 1);
    for (let i = 0; i < count; i++) {
        let o = i * step - 1.0;
        let sign = (o < 0.0) ? -1.0 : 1.0;
        let ofs = sign * Math.abs(Math.pow(o, exponent));
        sss_kernel[i].w = ofs;
    }
}

const GAUSS_TRUNCATE = 12.46;
function gaussian_profile(r, radius)
{
  const v = radius * radius * (0.25 * 0.25);
  const Rm = Math.sqrt(v * GAUSS_TRUNCATE);

  if (r >= Rm) {
    return 0.0;
  }
  return Math.exp(-r * r / (2.0 * v)) / (2.0 * M_PI * v);
}

const BURLEY_TRUNCATE = 16.0;
const BURLEY_TRUNCATE_CDF = 0.9963790093708328;  // cdf(BURLEY_TRUNCATE)
function burley_profile(r, d)
{
  let exp_r_3_d = Math.exp(-r / (3.0 * d));
  let exp_r_d = exp_r_3_d * exp_r_3_d * exp_r_3_d;
  return (exp_r_d + exp_r_3_d) / (4.0 * d);
}

function cubic_profile(r, radius, sharpness)
{
  let Rm = radius * (1.0 + sharpness);

  if (r >= Rm) {
    return 0.0;
  }
  /* custom variation with extra sharpness, to match the previous code */
  const y = 1.0 / (1.0 + sharpness);
  let Rmy, ry, ryinv;

  Rmy = Math.pow(Rm, y);
  ry = Math.pow(r, y);
  ryinv = (r > 0.0) ? Math.pow(r, y - 1.0) : 0.0;

  const Rmy5 = (Rmy * Rmy) * (Rmy * Rmy) * Rmy;
  const f = Rmy - ry;
  const num = f * (f * f) * (y * ryinv);

  return (10.0 * num) / (Rmy5 * M_PI);
}

function eval_profile(r, falloff_type, sharpness, param){
    r = Math.abs(r);

    if (falloff_type == SHD_SUBSURFACE_BURLEY || falloff_type == SHD_SUBSURFACE_RANDOM_WALK) {
        return burley_profile(r, param) / BURLEY_TRUNCATE_CDF;
    }

    if (falloff_type == SHD_SUBSURFACE_CUBIC) {
        return cubic_profile(r, param, sharpness);
    }

    return gaussian_profile(r, param);
}

/* Resolution for each sample of the precomputed kernel profile */
const INTEGRAL_RESOLUTION = 32;
function eval_integral(x0, x1, falloff_type, sharpness, param){
    const range = x1 - x0;
    const step = range / INTEGRAL_RESOLUTION;
    let integral = 0.0;

    for (let i = 0; i < INTEGRAL_RESOLUTION; i++) {
        let x = x0 + range * (i + 0.5) / INTEGRAL_RESOLUTION;
        let y = eval_profile(x, falloff_type, sharpness, param);
        integral += y * step;
    }

    return integral;
}

function compute_sss_kernel(){
    let rad = [];
    rad[0] = MAX2(radii[0], 1.0e-15);
    rad[1] = MAX2(radii[1], 1.0e-15);
    rad[2] = MAX2(radii[2], 1.0e-15);

    let l = [];
    let d = [];

    if (falloff_type == SHD_SUBSURFACE_BURLEY || falloff_type == SHD_SUBSURFACE_RANDOM_WALK){
        mul_v3_v3fl(l, rad, 0.25 * M_1_PI);
        const A = 1.0;
        const s = 1.9 - A + 3.5 * (A - 0.8) * (A - 0.8);
        mul_v3_v3fl(d, l, 0.6 / s);
        mul_v3_v3fl(rad, d, BURLEY_TRUNCATE);

        max_radius = MAX3(rad[0], rad[1], rad[2]);
        copy_v3_v3(param, d);
    }else if (falloff_type == SHD_SUBSURFACE_CUBIC) {
        copy_v3_v3(param, rad);
        mul_v3_fl(rad, 1.0 + sharpness);
        max_radius = MAX3(rad[0], rad[1], rad[2]);
    }else {
        max_radius = MAX3(rad[0], rad[1], rad[2]);
        copy_v3_v3(param, rad);
    }
    /* Compute samples locations on the 1d kernel [-1..1] */
    sss_calculate_offsets(sample_len, SSS_EXPONENT);

    /* Weights sum for normalization */
    let sum = [0.0, 0.0, 0.0];

    /* Compute integral of each sample footprint */
    for (let i = 0; i < sample_len; i++) {
        let x0, x1;
        if (i == 0) {
            x0 = sss_kernel[0].w - Math.abs(sss_kernel[0].w - sss_kernel[1].w) / 2.0;
        }else {
            x0 = (sss_kernel[i - 1].w + sss_kernel[i].w) / 2.0;
        }

        if (i == sample_len - 1) {
            x1 = sss_kernel[sample_len - 1].w + 
            Math.abs(sss_kernel[sample_len - 2].w - sss_kernel[sample_len - 1].w) / 2.0;
        }else {
            x1 = (sss_kernel[i].w + sss_kernel[i + 1].w) / 2.0;
        }

        x0 *= max_radius;
        x1 *= max_radius;

        sss_kernel[i].x = eval_integral(x0, x1, falloff_type, sharpness, param[0]);
        sss_kernel[i].y = eval_integral(x0, x1, falloff_type, sharpness, param[1]);
        sss_kernel[i].z = eval_integral(x0, x1, falloff_type, sharpness, param[2]);

        sum[0] += sss_kernel[i].x;
        sum[1] += sss_kernel[i].y;
        sum[2] += sss_kernel[i].z;
    }

    for (let i = 0; i < 3; i++) {
        if (sum[i] > 0.0) {
            /* Normalize */
            for (let j = 0; j < sample_len; j++) {
                let t = sss_kernel[j].getComponent(i) / sum[i];
                sss_kernel[j].setComponent(i, t);
            }
        }else {
            /* Avoid 0 kernel sum. */
            sss_kernel[parseInt(sample_len / 2)].setComponent(i, 1.0);
        }
    }

    /* Put center sample at the start of the array (to sample first) */
    let tmpv = [];
    
    copy_v4_Three_v4(tmpv, sss_kernel[parseInt(sample_len / 2)]);
    for (let i = parseInt(sample_len / 2); i > 0; i--) {
        copy_Three_v4_Three_v4(sss_kernel[i], sss_kernel[i - 1]);
    }
    copy_Three_v4_v4(sss_kernel[0], tmpv);
    
    // console.log(sss_kernel);
    // console.log(param);
    // console.log(max_radius);
}

let projectionMatrix;


function replaceAll( string, find, replace ) {

	return string.split( find ).join( replace );

}

let flag = 0;

init();
animate();

function init() {

    compute_sss_kernel();

    container = document.createElement( 'div' );
	document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 40, halfWidth / window.innerHeight, 1, 5000 );
	camera.position.set( 0, 300, 400 );
    cameraRT = camera.clone();
    projectionMatrix = cameraRT.projectionMatrix;

    scene = new THREE.Scene();
    sceneRT = new THREE.Scene();
    sceneSSS = new THREE.Scene();

    // const sssPass = new THREE.SSSPass(sceneRT, cameraRT);

    // Lights
    const ambientLight = new THREE.AmbientLight( 0x111111 );
    scene.add( ambientLight );
    sceneRT.add( ambientLight.clone() );

    // const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.03 );
    // directionalLight.position.set( 0.0, 0.5, 0.5 ).normalize();
    // scene.add( directionalLight );
    // sceneRT.add( directionalLight.clone() );

    const pointLight1 = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), 
    new THREE.MeshBasicMaterial( { color: 0x888888 } ) );
    pointLight1.add( new THREE.PointLight( 0xffffff, 1.0, 1500 ) );
    scene.add( pointLight1 );
    pointLight1.position.x = 150;
    pointLight1.position.y = 150;
    pointLight1.position.z = 350;
    sceneRT.add( pointLight1.clone() );

    const pointLight2 = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), 
    new THREE.MeshBasicMaterial( { color: 0x888888 } ) );
    pointLight2.add( new THREE.PointLight( 0xffffff, 1.0, 500 ) );
    scene.add( pointLight2 );
    pointLight2.position.x = - 100;
    pointLight2.position.y = 20;
    pointLight2.position.z = - 260;
    sceneRT.add( pointLight2.clone() );

    renderTargetIrradiance = new THREE.WebGLRenderTarget( halfWidth, window.innerHeight, 
        { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter} );
    renderTargetIrradiance.texture.format = THREE.RGBAFormat;
    renderTargetIrradiance.texture.type = THREE.HalfFloatType;

    renderTargetSpecular = new THREE.WebGLRenderTarget( halfWidth, window.innerHeight, 
        { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat } );

    renderTargetSSSAlbedo = new THREE.WebGLRenderTarget( halfWidth, window.innerHeight, 
        { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat } );
    
    renderTargetDepth = new THREE.WebGLRenderTarget( halfWidth, window.innerHeight, 
        { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter } );
    renderTargetDepth.texture.format = THREE.RGBAFormat;
    renderTargetDepth.texture.type = THREE.HalfFloatType;

    renderTargetFirstPass = new THREE.WebGLRenderTarget( halfWidth, window.innerHeight, 
        { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter } );
    renderTargetFirstPass.texture.format = THREE.RGBAFormat;
    renderTargetFirstPass.texture.type = THREE.HalfFloatType;

    // renderTargetDepth.texture.type = THREE.FloatType;
    // renderTargetDepth.texture.generateMipmaps = false;
    // renderTargetDepth.stencilBuffer = false;
    // renderTargetDepth.depthBuffer = true;
    // renderTargetDepth.depthTexture = new THREE.DepthTexture();
    // renderTargetDepth.depthTexture.format = THREE.DepthFormat;
	// renderTargetDepth.depthTexture.type = THREE.UnsignedShortType;

    // multiRenderTarget = new THREE.WebGLMultipleRenderTargets(halfWidth * window.devicePixelRatio, 
    //     window.innerHeight * window.devicePixelRatio, 2);

    // for ( let i = 0, il = multiRenderTarget.texture.length; i < il; i ++ ) {
    //     multiRenderTarget.texture[ i ].minFilter = THREE.NearestFilter;
    //     multiRenderTarget.texture[ i ].magFilter = THREE.NearestFilter;
    //     multiRenderTarget.texture[ i ].type = THREE.FloatType;
    //     // multiRenderTarget.texture[ i ].format = THREE.RGBFormat;
    // }

    // multiRenderTarget.texture[ 0 ].name = 'diffuse';
    // multiRenderTarget.texture[ 1 ].name = 'specular';

    renderer = new THREE.WebGLRenderer( { antialias: true } );

    // if ( renderer.capabilities.isWebGL2 === false && renderer.extensions.has( 'WEBGL_depth_texture' ) === false ) {

    //     supportsExtension = false;
    //     console.log("error");
    //     return;

    // }

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight);
    renderer.setScissorTest( true );
    container.appendChild( renderer.domElement );
    renderer.outputEncoding = THREE.sRGBEncoding;


    stats = new Stats();
    container.appendChild( stats.dom );

    const axesHelper = new THREE.AxesHelper(1000);
    scene.add(axesHelper);
    // sceneRT.add(axesHelper.clone());

    const controlsL = new THREE.OrbitControls( camera, container );
    // controlsL.minDistance = 500;
    // controlsL.maxDistance = 3000;

    const controlsRT1 = new THREE.OrbitControls( cameraRT, container );
    // controlsRT1.minDistance = 500;
    // controlsRT1.maxDistance = 3000;

    window.addEventListener( 'resize', onWindowResize );

    initMaterial();
}

function initMaterial(){
    const loader = new THREE.TextureLoader();
    const baseColorTexture = loader.load( 'models/brain/brain-base-color.png' );
    const subsurfaceTexture = loader.load( 'models/brain/brain-subsurface-color.png' );
    const thicknessTexture = loader.load( 'models/brain/brain-thickness.png' );
    const normalMap = loader.load( 'models/brain/brain-normal-combine-2.png' );
    const noiseTexture = loader.load( 'textures/brain/noise.png' );

    // imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;
    materialBase = new THREE.MeshStandardMaterial();
    materialBase.map = baseColorTexture;
    materialBase.normalMap = normalMap;
    materialBase.normalScale = new THREE.Vector2(1,1);
    materialBase.roughness = 0.1;

    // materialIrradiance = modifymaterialIrradiance();
    materialIrradiance = modifyMaterialDiffuse();
    // materialIrradiance.map = baseColorTexture;
    materialIrradiance.map = subsurfaceTexture;
    materialIrradiance.normalMap = normalMap;
    materialIrradiance.roughness = 0.1;

    materialSpecular = modifyMaterialSpecular();
    materialSpecular.map = subsurfaceTexture;
    materialSpecular.normalMap = normalMap;
    materialSpecular.roughness = 0.1;

    materialSSSAlbedo = new THREE.MeshBasicMaterial();
    materialSSSAlbedo.map = subsurfaceTexture;

    materialDepth = new THREE.ShaderMaterial({
        vertexShader: document.getElementById( 'vertex_shader_depth' ).textContent,
        fragmentShader: document.getElementById( 'fragment_shader_depth' ).textContent,
        
    });

    const sssRadius = 50.0;

    materialFirstPass = new THREE.ShaderMaterial( {

        uniforms: { 
            // tDiffuse: { value: multiRenderTarget.texture[ 0 ] },
            // tSpecular: { value: multiRenderTarget.texture[ 1 ] }, 
            tDiffuse: { value: renderTargetIrradiance.texture },
            tSpecular: { value: renderTargetSpecular.texture }, 
            tDepth: { value: renderTargetDepth.texture },
            tNoise: { value: noiseTexture},
            kernel: {value: sss_kernel},
            Radii_max_radius: {value: max_radius},
            ProjectionMatrix : {value: projectionMatrix},
            Radius: {value: sssRadius},
            Samples: {value: sample_len},
            sssJitterThreshold: {value: sssJitterThreshold},

        },
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragment_shader_first_pass' ).textContent,
        
        depthWrite: false

    } );

    // console.log(materialFirstPass);

    materialSecondPass = new THREE.ShaderMaterial( {

        uniforms: { 
            // tDiffuse: { value: multiRenderTarget.texture[ 0 ] },
            // tSpecular: { value: multiRenderTarget.texture[ 1 ] }, 
            tDiffuse: { value: renderTargetFirstPass.texture },
            tSpecular: { value: renderTargetSpecular.texture }, 
            sssAlbedo: {value: renderTargetSSSAlbedo.texture},
            tDepth: { value: renderTargetDepth.texture },
            tNoise: { value: noiseTexture},
            kernel: {value: sss_kernel},
            Radii_max_radius: {value: max_radius},
            ProjectionMatrix : {value: projectionMatrix},
            Radius: {value: sssRadius},
            Samples: {value: sample_len},
            sssJitterThreshold: {value: sssJitterThreshold},

        },
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragment_shader_second_pass' ).textContent,
        
        depthWrite: false

    } );

    const plane = new THREE.PlaneGeometry( 2, 2 );
    quad = new THREE.Mesh( plane, materialFirstPass );
    // console.log(quad);
    sceneSSS.add( quad );

	const loaderFBX = new THREE.FBXLoader();
    loaderFBX.load( 'models/brain/brain6.fbx', function ( object ) {
        // console.log(object)
        // console.log(object.children)
        // console.log(object.children[0])

        // object.traverse( function ( object ) {
		// 	console.log(object.isGroup)
		// } );


        model = object.children[ 0 ];
        model.position.set( 0, 0, 10 );
        model.scale.setScalar( 80 );
        model.material = materialBase;
        scene.add( model );

        modelRT = model.clone();
        modelRT.material = materialIrradiance;
        sceneRT.add( modelRT );

        loadModelDone = true;

    } );
    
}

function modifymaterialIrradiance() {
    const material = new THREE.MeshStandardMaterial();
    material.onBeforeCompile = function(shader){


        shader.fragmentShader = shader.fragmentShader.slice(0, shader.fragmentShader.indexOf('#include <aomap_fragment>'));
        
        let token = '#include <lights_physical_fragment>';
        let insert = /* glsl */`
        vec3 totalIrradiance = vec3(0.0, 0.0, 0.0);
        float dNL;
        vec3 irr;
    `;

        shader.fragmentShader = shader.fragmentShader.replace(token, token + insert);

        token = 'RE_Direct( directLight, geometry, material, reflectedLight );';
        insert = /* glsl */`
        dNL = saturate( dot( geometry.normal, directLight.direction ) );
        irr = dNL * directLight.color;
        totalIrradiance += irr;
    `;
        let temp = replaceAll(THREE.ShaderChunk['lights_fragment_begin'], token, token + insert);

        shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', temp);

        token = 'RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );';
        insert = /* glsl */`
        totalIrradiance += irradiance;
    `;
        temp = replaceAll(THREE.ShaderChunk['lights_fragment_end'], token, token + insert);
        shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>', temp);

        let output = /* glsl */`
                gl_FragColor = vec4( totalIrradiance, 1.0 );
                }
            `;
        
        shader.fragmentShader = shader.fragmentShader + output;

        // console.log( shader.uniforms );
        // console.log( shader.vertexShader );
        // console.log( shader.fragmentShader );
    };

    return material;
}

function modifyMaterialDiffuse() {
    const material = new THREE.MeshStandardMaterial();
    material.onBeforeCompile = function(shader){
        let fShader = shader.fragmentShader.slice(0, shader.fragmentShader.indexOf('#include <transmission_fragment>'));
        let output = /* glsl */`
                gl_FragColor = vec4( totalDiffuse, 1.0 );
                }
            `;
        
        shader.fragmentShader = fShader + output;
        // console.log( shader.uniforms );
        // console.log( shader.vertexShader );
        // console.log( shader.fragmentShader );
    };

    return material;
}

function modifyMaterialSpecular() {
    const material = new THREE.MeshStandardMaterial();
    material.onBeforeCompile = function(shader){
        let fShader = shader.fragmentShader.slice(0, shader.fragmentShader.indexOf('#include <transmission_fragment>'));
        let output = /* glsl */`
                gl_FragColor = vec4( totalSpecular, 1.0 );
                }
            `;
        
        shader.fragmentShader = fShader + output;
        // console.log( shader.uniforms );
        // console.log( shader.vertexShader );
        // console.log( shader.fragmentShader );
    };

    return material;
}

function onWindowResize() {

    camera.aspect = halfWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    cameraRT.aspect = halfWidth / window.innerHeight;
    cameraRT.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}



function animate() {

    // if ( ! supportsExtension ) return;

    requestAnimationFrame( animate );

    render();

    stats.update();

}

function render() {
    if(!loadModelDone) return;

    renderer.setRenderTarget( null );
	renderer.clear();
    renderer.setViewport( 0, 0, halfWidth, window.innerHeight );
	renderer.setScissor( 0, 0, halfWidth, window.innerHeight );
    renderer.render( scene, camera );

    renderer.setViewport( halfWidth, 0, halfWidth, window.innerHeight);
	renderer.setScissor( halfWidth, 0, halfWidth, window.innerHeight );

    modelRT.material = materialIrradiance;
    renderer.setRenderTarget( renderTargetIrradiance );
    // renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneRT, cameraRT );
    
    modelRT.material = materialSpecular;
    renderer.setRenderTarget( renderTargetSpecular );
    // renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneRT, cameraRT );

    modelRT.material = materialSSSAlbedo;
    renderer.setRenderTarget( renderTargetSSSAlbedo );
    // renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneRT, cameraRT );

    modelRT.material = materialDepth;
    renderer.setRenderTarget( renderTargetDepth );
    // renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneRT, cameraRT );

    quad.material = materialFirstPass;

    renderer.setRenderTarget( renderTargetFirstPass );
    // renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneSSS, camera );

    quad.material = materialSecondPass
    renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( sceneSSS, camera );
}