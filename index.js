//"use strict"

let container, camera, scene, renderer, stats;

const AxonLayerMaxCount = 50;
const AxonLayerMaxLength = 0.4;
const AxonLayerMinLength = 0.2;
const AxonLayerTotalMaxLength = 15;
const AxonRotAxisMaxAngle =  9;
const AxonLayerMaxAngle = AxonRotAxisMaxAngle * 2 /* calcAxonLayerAngle(AxonRotAxisMaxAngle) */;
const AxonSegments = 5;
init();

function init() {
    container = document.getElementById('container');

    scene = new THREE.Scene();
    // scene.background = new THREE.Color(0x8FBCD4);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 40;
    scene.add(camera);

    scene.add(new THREE.AmbientLight(0x8FBCD4, 0.4));

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);

    const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        // flatShading: true
    });

    const materialWireframe = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true
    });
    
    const loader = new THREE.TextureLoader();
    const pointTexture = loader.load( 'textures/brain/test7.png' );
    pointTexture.flipY = false;
    pointTexture.encoding = THREE.sRGBEncoding;    
    pointTexture.premultiplyAlpha = true;
	pointTexture.needsUpdate = true;

    const pointMaterial = new THREE.PointsMaterial( {   
        size: 0.2, 
        // color: 0xff0000, 
        map: pointTexture,
        blending: THREE.CustomBlending, 
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.DstAlphaFactor,
        blendEquation: THREE.AddEquation,
        depthTest: false, 
        transparent: true
    });

    const refMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        opacity: 0.8,
        depthTest: false,
        transparent: true
    });

    const axonMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        opacity: 0.5,
        transparent: true
    });

    /* generate random whole numbers within a range 
        Math.floor(Math.random() * (Max - Min + 1)) + Min
    */

    const SphereCount = 16;
    const SphereRadiusBase = 0.6;
    const meshes = [];
    let count = 0;
    // const countBase = 2;
    // let exp = 0;
    const axonCountMax = 5;
    const axonCountMin = 4;

    let phi;
    let theta;

    for(let i = 0; i < SphereCount; i++, count++){
        
        const geometry = new THREE.SphereGeometry(SphereRadiusBase + SphereRadiusBase * Math.random() * 0.2, 
        16, 16);
        // console.log(geometry)
        geometry.attributes.originalPosition = geometry.attributes.position.clone();
        geometry.rand = Math.random();
        geometry.axonIndices = [];
        const vertexCount = geometry.attributes.position.count;
        const axonCount = getRandomIntBetween(axonCountMin, axonCountMax);
        for(let j = 0; j < axonCount; j++){
            const a = Math.floor(vertexCount / axonCount);
            geometry.axonIndices.push(getRandomIntBetween(j * a, (j + 1) * a));
        }
        geometry.axonIndices = [...new Set(geometry.axonIndices)];

        const mesh = new THREE.Mesh(geometry, refMaterial);

        const base = Math.floor(Math.sqrt(count));

        
        if(!phi){
            phi = Math.PI * 2 * Math.random();
        }else{
            phi = (Math.PI + phi) + (Math.random() * 2 - 1) * Math.PI / 2;
        }

        if(!theta){
            theta = Math.PI * Math.random();
        }else{
            theta = (Math.PI / 2 + theta) + (Math.random() * 2 - 1) * Math.PI / 4;
        }


        const times = 5;

        mesh.position.x = Math.sqrt(count) * times * Math.sin(theta) * Math.cos(phi);
        mesh.position.y = Math.sqrt(count) * times * Math.sin(theta) * Math.sin(phi);
        mesh.position.z = Math.sqrt(count) * times * Math.cos(theta);

        meshes.push(mesh);
        scene.add(mesh);

    }
    
    const AxonRootRotAxisAngleMax = 15;

    for(let i = 0; i < meshes.length; i++){
        meshes[i].geometry.axonListHeads = [];
        for(let j = 0; j < meshes[i].geometry.axonIndices.length; j++){
            const {array : PositionArray} = meshes[i].geometry.attributes.position;
            const {array : NormalArray} = meshes[i].geometry.attributes.normal;
            const AxonVertex = new THREE.Vector3(PositionArray[meshes[i].geometry.axonIndices[j] * 3], 
                PositionArray[meshes[i].geometry.axonIndices[j] * 3 + 1], 
                PositionArray[meshes[i].geometry.axonIndices[j] * 3 + 2]);

            // const sphereRadius = meshes[i].geometry.parameters.radius;
            AxonVertex.multiplyScalar(0.9);
            meshes[i].updateMatrix();
            AxonVertex.applyMatrix4(meshes[i].matrix);

            const AxonNormal = new THREE.Vector3(NormalArray[meshes[i].geometry.axonIndices[j] * 3], 
                NormalArray[meshes[i].geometry.axonIndices[j] * 3 + 1], 
                NormalArray[meshes[i].geometry.axonIndices[j] * 3 + 2]);

            const RootDirection = rotateV3LimitAngle(AxonNormal, AxonRootRotAxisAngleMax).normalize();
            
            const param = {
                position : AxonVertex,
                direction : RootDirection /* AxonNormal.normalize() */,
                layerIndex : 0,
                layerLength : AxonLayerMinLength,
                layerTotalLength : 0,
                radius : getRandomNumBetween(0.15, 0.3),
                radiusExpBase : 1 / getRandomIntBetween(2, 10),
                radiusMin : getRandomNumBetween(0.01, 0.02),
                splitRatio : 0.02,
                pointsMatrix : new THREE.Matrix4()
            };
            meshes[i].geometry.axonListHeads.push(makeAxonNested(param, null));
            

        }
    }

    //draw axon
    for(let i = 0; i < meshes.length; i++){
        for(let j = 0; j < meshes[i].geometry.axonListHeads.length; j++){
            // drawAxonLineNested(meshes[i].geometry.axonListHeads[j]);
            // drawAxonPointsNested(meshes[i].geometry.axonListHeads[j]);
        }
    }

    

    for(let i = 0; i < meshes.length; i++){
        adjustAxonMesh(meshes[i]);
        makeAxonGeometry(meshes[i].geometry);
        // console.log(meshes[i].geometry);
        for(let j = 0; j < meshes[i].geometry.axonListGeometrys.length; j++){
            const geometry = meshes[i].geometry.axonListGeometrys[j];
            // const mesh = new THREE.Points( geometry, pointMaterial );
            // const mesh = new THREE.Mesh(geometry, materialWireframe);
            const mesh = new THREE.Mesh(geometry, axonMaterial);
            
            // mesh.material.side = THREE.DoubleSide;

            // const helper = new THREE.VertexNormalsHelper( mesh, 0.2, 0x00ff00, 1 );
            // scene.add(helper);

            scene.add(mesh);
        }
            
    }


    stats = new Stats();
    container.appendChild(stats.domElement);

    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;

    const clock = new THREE.Clock();

    renderer.setAnimationLoop(()=>{

        const elapsedTime = clock.getElapsedTime();
        renderer.render(scene, camera);
        stats.update();

        for(let i = 0; i < meshes.length; i++){
            const { array : originalPositionArray} = meshes[i].geometry.attributes.originalPosition;
            const { array : positionArray} = meshes[i].geometry.attributes.position;
            const { array : normalArray} = meshes[i].geometry.attributes.normal;
            const rand = meshes[i].geometry.rand * 2 - 1;

            const {axonIndices} = meshes[i].geometry;
            const s = new Set(axonIndices);
            meshes[i].geometry.axonAnimParams = [];

            for(let j = 0; j < positionArray.length; j += 3){
                const vertex = new THREE.Vector3(originalPositionArray[j], 
                    originalPositionArray[j + 1], originalPositionArray[j + 2]);
                const normal = new THREE.Vector3(normalArray[j], normalArray[j + 1], normalArray[j + 2]);
                normal.normalize();
                const a = 5 * Math.acos(normal.dot(new THREE.Vector3(1, 0, 0)));
                const b = 5 * Math.acos(normal.dot(new THREE.Vector3(0, 1, 0)));
                const c = 5 * Math.acos(normal.dot(new THREE.Vector3(0, 0, 1)));
                const phase = (a + b + c) / 3 * rand;
                vertex.addScaledVector(normal, 
                    .1 * (1 + rand * 0.5) * Math.sin(phase + elapsedTime * 2 * (1 + rand * 0.5)));
                positionArray[j] = vertex.x;
                positionArray[j + 1] = vertex.y;
                positionArray[j + 2] = vertex.z;

                if(s.has(j / 3)){
                    meshes[i].geometry.axonAnimParams.push({normal : normal, phase : phase});
                }
            }
            meshes[i].geometry.attributes.position.needsUpdate = true;

            for(let m = 0; m < axonIndices.length; m++){
                const geometry = meshes[i].geometry.axonListGeometrys[m];
                const { array : axonOriginalPositionArray} = geometry.attributes.originalPosition;
                const { array : axonPositionArray} = geometry.attributes.position;
                const animParams = meshes[i].geometry.axonAnimParams[m];
                const layers = meshes[i].geometry.axonListVertexLayers[m];
                const offsetArr = [];

                for(let n = 0; n < axonPositionArray.length; n += 3){
                    const vertex = new THREE.Vector3(axonOriginalPositionArray[n], 
                        axonOriginalPositionArray[n + 1], axonOriginalPositionArray[n + 2]);

                    const layer = layers[n / 3];
                    
                    if(offsetArr[layer]){
                        vertex.addScaledVector(animParams.normal, offsetArr[layer]);
                    }else{
                        const p = 2 * Math.PI * layer * 4 / AxonLayerMaxCount;
                        offsetArr[layer] = .1 * (1 + rand * 0.5) * Math.sin(p + animParams.phase + elapsedTime * 2 * (1 + rand * 0.5));
                        vertex.addScaledVector(animParams.normal, offsetArr[layer]);
                    }
                    
                    axonPositionArray[n] = vertex.x;
                    axonPositionArray[n + 1] = vertex.y;
                    axonPositionArray[n + 2] = vertex.z;
                }
                geometry.attributes.position.needsUpdate = true;
            }

        }

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

function getRandomIntBetween(Min, Max){
    return Math.floor(Math.random() * (Max - Min + 1)) + Min;
}

function getRandomNumBetween(Min, Max){
    return Math.random() * (Max - Min) + Min;
}

function makeAxonListNodeClass(){
    class AxonListNode{
        constructor(PositionV3, DirectionV3, Radius){
            this.position = new THREE.Vector3(PositionV3.x, PositionV3.y, PositionV3.z);
            this.direction = new THREE.Vector3(DirectionV3.x, DirectionV3.y, DirectionV3.z);
            this.radius = Radius;
            this.branches = [];
            this.layer = 0;
        }
    }
    return AxonListNode;
}

/* const param = {
    position : AxonVertex,
    direction : RootDirection,
    layerIndex : 0,
    layerLength : AxonLayerMaxLength,
    layerTotalLength : 0,
    radius : getRandomNumBetween(0.1, 0.3),
    radiusExpBase : 1 / getRandomIntBetween(2, 10),
    radiusMin : getRandomNumBetween(0.03, 0.07),
    splitRatio : 0.01,
    pointsMatrix : new THREE.Matrix4()
}; */


function makeAxonNested(Param, PrevNode){
    const {position, direction, layerIndex, layerLength, layerTotalLength, radius, 
        radiusExpBase, radiusMin, splitRatio, pointsMatrix} = Param;
    
    if(layerIndex >= AxonLayerMaxCount - 1 || layerTotalLength > AxonLayerTotalMaxLength) {
        return null;
    }
    
    const AxonListNode = makeAxonListNodeClass();
    const node = new AxonListNode(position, direction, radius);

    if(PrevNode){
        node.layer = PrevNode.layer + 1;
        node.points = makeAxonPoints(PrevNode, pointsMatrix, layerLength);
       
    }else{
        node.points = makeAxonTube(radius, AxonSegments, position, direction);
    }

    const branchCount = Math.random() < splitRatio ? 2 : 1;
    for(let i = 0; i < branchCount; i++){
        const nextPosition = position.clone();
        nextPosition.addScaledVector(direction, layerLength);
        const total = layerTotalLength + layerLength;
        const tempRadius = radius * Math.pow(radiusExpBase, total / 150);
        const nextRadius = tempRadius < radiusMin ? radiusMin : tempRadius;
        // const nextRadius = tempRadius;
        const scaleRadio = nextRadius / radius;
        const nextDirection = new THREE.Vector3();
        const nextMatrix = new THREE.Matrix4();
        const dx = nextPosition.x - position.x;
        const dy = nextPosition.y - position.y;
        const dz = nextPosition.z - position.z;

        makeAxonTranform(position, dx, dy, dz, scaleRadio, AxonRotAxisMaxAngle, 
            direction, nextDirection, nextMatrix);

        const angle = 180 * Math.acos(direction.dot(nextDirection)) / Math.PI;
        let nextLayerLength = AxonLayerMaxLength * Math.pow((AxonLayerMaxAngle - angle) / AxonLayerMaxAngle, 2); 
        nextLayerLength = (nextLayerLength < AxonLayerMinLength || layerIndex < 5) ? AxonLayerMinLength : nextLayerLength;

        const nextParam = {
            position : nextPosition,
            direction : nextDirection.normalize(),
            layerIndex : layerIndex + 1,
            layerLength : nextLayerLength,
            layerTotalLength : total,
            radius : nextRadius,
            radiusExpBase : radiusExpBase,
            radiusMin : radiusMin,
            splitRatio : splitRatio,
            pointsMatrix : nextMatrix
        };
        const next = makeAxonNested(nextParam, node);
        next && node.branches.push(next);
    }
    return node;
}

function makeAxonPoints({points : prevPoints, direction}, m, layerLength){
    const points = [];
    for(let i = 0; i < prevPoints.length; i++){
        if(m){
            const point = prevPoints[i].clone();
            point.applyMatrix4(m);
            points.push(point);
        }else{
            const point1 = prevPoints[i].clone();
            point1.addScaledVector(direction, layerLength);
            points.push(point1);
        }
        
    }
    return points;
}

function makeAxonTranform(position, dx, dy, dz, scaleRadio, AxonRotAxisMaxAngle, direction, nextDirection, nextMatrix){

    nextDirection.copy(direction);
    const radian = AxonRotAxisMaxAngle / 360 * Math.PI * 2;
    const rx = getRandomNumBetween(-radian, radian);
    const ry = getRandomNumBetween(-radian, radian);
    const rz = getRandomNumBetween(-radian, radian);
    nextDirection.applyAxisAngle(new THREE.Vector3(1, 0, 0), rx)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), ry)
        .applyAxisAngle(new THREE.Vector3(0, 0, 1), rz);

    const mr = new THREE.Matrix4();
    const ml = new THREE.Matrix4();
    const m = new THREE.Matrix4();

    mr.makeTranslation(-position.x, -position.y, -position.z);
    ml.makeScale(scaleRadio, scaleRadio, scaleRadio);
    m.multiplyMatrices(ml, mr);
    mr.copy(m);

    ml.makeRotationX(rx);
    m.multiplyMatrices(ml, mr);
    mr.copy(m);

    ml.makeRotationY(ry);
    m.multiplyMatrices(ml, mr);
    mr.copy(m);

    ml.makeRotationZ(rz);
    m.multiplyMatrices(ml, mr);
    mr.copy(m);

    ml.makeTranslation(position.x, position.y, position.z);
    m.multiplyMatrices(ml, mr);
    mr.copy(m);

    ml.makeTranslation(dx, dy, dz);
    m.multiplyMatrices(ml, mr);

    nextMatrix.copy(m);

}

function makeAxonTube(radius, segments, center, direction){
    let ux, uy, uz;
    const qx = direction.x;
    const qy = direction.y;
    const qz = direction.z;
    if(qx !== 0){
        ux = -qy / qx;
        uy = 1;
        uz = 0;
    }else if(qy !== 0){
        ux = 0;
        uy = -qz / qy;
        uz = 1;
    }else{
        ux = 1;
        uy = 0;
        uz = -qx / qz;
    }
    const U = new THREE.Vector3(ux, uy, uz);
    const V = new THREE.Vector3();
    V.crossVectors(direction, U);
    U.normalize();
    V.normalize();

    const points = [];
    for(let i = 0; i < segments; i++){
        const theta = 2 * Math.PI * i / segments;
        const dx = radius * (Math.cos(theta) * U.x + Math.sin(theta) * V.x);
        const dy = radius * (Math.cos(theta) * U.y + Math.sin(theta) * V.y);
        const dz = radius * (Math.cos(theta) * U.z + Math.sin(theta) * V.z);
        points.push(new THREE.Vector3(center.x + dx, center.y + dy, center.z + dz));
    }
    return points;
}

function drawAxonLineNested(node){
    const lineMaterial = new THREE.LineBasicMaterial({color: 0x00ff00, linewidth: 50});
    for(let i = 0; i < node.branches.length; i++){
        const points = [];
        points.push(node.position);
        points.push(node.branches[i].position);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        scene.add(line);
        drawAxonLineNested(node.branches[i]);
    }
}

function drawAxonPointsNested(node){
    const pointsMaterial = new THREE.PointsMaterial( {
        color: 0x0000ff,
        size: 0.1,
        alphaTest: 0.5
    } );
    const pointsGeometry = new THREE.BufferGeometry().setFromPoints(node.points);
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);

    for(let i = 0; i < node.branches.length; i++){
        drawAxonPointsNested(node.branches[i]);
    }
}

function rotateV3LimitAngle(V3, Angle){
    const rotV3 = V3.clone();
    const radian = Angle / 360 * Math.PI * 2;
    rotV3.applyAxisAngle(new THREE.Vector3(1, 0, 0), getRandomNumBetween(-radian, radian))
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), getRandomNumBetween(-radian, radian))
    .applyAxisAngle(new THREE.Vector3(0, 0, 1), getRandomNumBetween(-radian, radian));
    return rotV3;
}

function calcAxonLayerAngle(Angle){
    const rotV3 = new THREE.Vector3(1, 0, 0);
    const orgV3 = rotV3.clone();
    const r = 2 * Math.PI * Angle / 360;
    rotV3.applyAxisAngle(new THREE.Vector3(1, 0, 0), r)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), r)
        .applyAxisAngle(new THREE.Vector3(0, 0, 1), r).normalize();
    const d = rotV3.dot(orgV3);
    const a = 180 * Math.acos(d) / Math.PI;
    return a;
}

function makeAxonGeometry(Obj){
    Obj.axonListGeometrys = [];
    Obj.axonListVertexLayers = [];
    for(let i = 0; i < Obj.axonListHeads.length; i++){
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const normals = [];
        const uvs = [];

        const layers = [];

        let node = Obj.axonListHeads[i];
        makeAxonGeometryAttrNested(node, positions, normals, uvs, layers);
        function disposeArray() {
            this.array = null;
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

        geometry.attributes.originalPosition = geometry.attributes.position.clone();

        // geometry.computeBoundingSphere();
        Obj.axonListGeometrys.push(geometry);
        Obj.axonListVertexLayers.push(layers);
    }
    
}

function makeAxonGeometryAttrNested(node, positions, normals, uvs, layers){
    const len = node.points.length;
    for(let i = 0; i < node.branches.length; i++){
        const next = node.branches[i];
        for(let j = 0; j < len; j++){
            const a = (j + len - 1) % len;
            const b = (j + 1) % len;
            positions.push(node.points[j].x, node.points[j].y, node.points[j].z);layers.push(node.layer);
            positions.push(next.points[j].x, next.points[j].y, next.points[j].z);layers.push(next.layer);
            positions.push(next.points[a].x, next.points[a].y, next.points[a].z);layers.push(next.layer);
            positions.push(node.points[j].x, node.points[j].y, node.points[j].z);layers.push(node.layer);
            positions.push(node.points[b].x, node.points[b].y, node.points[b].z);layers.push(node.layer);
            positions.push(next.points[j].x, next.points[j].y, next.points[j].z);layers.push(next.layer);
            
            const n1 = new THREE.Vector3().subVectors(node.points[j], node.position).normalize();
            const n2 = new THREE.Vector3().subVectors(next.points[a], next.position).normalize();
            const n3 = new THREE.Vector3().subVectors(next.points[j], next.position).normalize();
            const n4 = new THREE.Vector3().subVectors(node.points[b], node.position).normalize();
            
            normals.push(n1.x, n1.y, n1.z);
            normals.push(n3.x, n3.y, n3.z);
            normals.push(n2.x, n2.y, n2.z);
            normals.push(n1.x, n1.y, n1.z);
            normals.push(n4.x, n4.y, n4.z);
            normals.push(n3.x, n3.y, n3.z);
            

            const c1 = j === 0 ? len : 0;
            const c2 = j + 1;
            uvs.push(c1 / len, 0);
            uvs.push(c1 / len, 1);
            uvs.push(a / len, 1);
            uvs.push(j / len, 0);
            uvs.push(c2 / len, 0);
            uvs.push(j / len, 1);
            
        }
        makeAxonGeometryAttrNested(next, positions, normals, uvs, layers);
    }
}

function adjustAxonMesh({geometry, position}){
    const radius = geometry.parameters.radius;
    for(let i = 0; i < geometry.axonListHeads.length; i++){
        adjustAxonGeometryRoot(geometry.axonListHeads[i], position, radius);
    }
}

function adjustAxonGeometryRoot(node, position, radius){
    for(let i = 0; i < node.points.length; i++){
        node.points[i] = intersectSphereByPointAndCenter(node.points[i], position, radius);
    }
}

function intersectSphereByPointAndCenter(point, center, radius){
    const v3 = new THREE.Vector3();
    v3.subVectors(point, center).normalize();
    const intersection = center.clone();
    intersection.addScaledVector(v3, radius);
    return intersection;
}

