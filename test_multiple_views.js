let container, camera, scene, renderer, stats;

init();

function init() {
    container = document.getElementById('container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8FBCD4);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 100;
    scene.add(camera);

    // console.log(scene);

    scene.add(new THREE.AmbientLight(0x8FBCD4, 0.4));

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);


    for(let i = 0; i < 20; i++){
        const geometry = new THREE.SphereGeometry(2, 10, 10);
        const material = new THREE.MeshPhongMaterial({
            // color: 0xff0000,
            // flatShading: true
        });
        material.color = new THREE.Color(Math.random(), Math.random(), Math.random());
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = (Math.random() * 2 - 1) * 50;
        mesh.position.y = (Math.random() * 2 - 1) * 50;
        mesh.position.z = (Math.random() * 2 - 1) * 50;

        scene.add(mesh);
    }



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