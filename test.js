let container, camera, scene, renderer, stats;

init();

function init() {
    container = document.getElementById('container');


    const rotV3 = new THREE.Vector3(1, 0, 0);
    const orgV3 = rotV3.clone();
    const r = 2 * Math.PI * 10 / 360;
    rotV3.applyAxisAngle(new THREE.Vector3(1, 0, 0), r)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), r)
        .applyAxisAngle(new THREE.Vector3(0, 0, 1), r).normalize();
    const d = rotV3.dot(orgV3);
    const a = 180 * Math.acos(d) / Math.PI; // 14.1
    // console.log(a);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8FBCD4);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 25;
    scene.add(camera);

    scene.add(new THREE.AmbientLight(0x8FBCD4, 0.4));

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);

    const point = new THREE.Vector3(5, 5, 0);
    const geometry = new THREE.CircleGeometry(0.5, 10);

    const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide
        // flatShading: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = point.x;
    mesh.position.y = point.y;
    mesh.position.z = point.z;
    scene.add(mesh);

    const m = new THREE.Matrix4();
    const radian = 2 * Math.PI * 90 / 360;
    m.makeRotationX(radian);
   /*  const mesh1 = mesh.clone();
    mesh1.applyMatrix4(m);
    scene.add(mesh1); */

    /* const geometry2 = geometry.clone();
    geometry2.applyMatrix4(m);
    const mesh2 = new THREE.Mesh(geometry2, material);
    mesh2.position.x = point.x;
    mesh2.position.y = point.y;
    mesh2.position.z = point.z;
    scene.add(mesh2); */

    const m1 = new THREE.Matrix4();
    m1.makeTranslation(point.x, point.y, point.z).multiply(new THREE.Matrix4().makeRotationX(radian).multiply(new THREE.Matrix4().makeTranslation(-point.x, -point.y, -point.z)));
    const mesh3 = mesh.clone();
    mesh3.applyMatrix4(m1);
    scene.add(mesh3);


    stats = new Stats();
    container.appendChild(stats.domElement);

    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setAnimationLoop(()=>{

        renderer.render(scene, camera);
        stats.update();

    });

    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}