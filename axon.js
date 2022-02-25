(function() {
class Axon {
    constructor(param) {

        Object.assign(this, param);

        function getRandomIntBetween(Min, Max){
            return Math.floor(Math.random() * (Max - Min + 1)) + Min;
        }
        
        function getRandomNumBetween(Min, Max){
            return Math.random() * (Max - Min) + Min;
        }
        
        function rotateV3LimitAngle(V3, Angle){
            const rotV3 = V3.clone();
            const radian = Angle / 360 * Math.PI * 2;
            rotV3.applyAxisAngle(new THREE.Vector3(1, 0, 0), getRandomNumBetween(-radian, radian))
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), getRandomNumBetween(-radian, radian))
            .applyAxisAngle(new THREE.Vector3(0, 0, 1), getRandomNumBetween(-radian, radian));
            return rotV3;
        }
        
        const _AxonCount = this.AxonCount || 1;

        this.makeAxonIndexOnMesh = function(mesh){
            mesh.axonIndices = [];
            mesh.axonRands = [];
            const vertexCount = mesh.geometry.attributes.position.count;
            for(let i = 0; i < _AxonCount; i++){
                const seg = Math.floor(vertexCount / _AxonCount);
                mesh.axonIndices.push(getRandomIntBetween(i * seg, (i + 1) * seg));
                mesh.axonRands.push([Math.random(), Math.random(), Math.random()] );
            }
            mesh.axonIndices = [...new Set(mesh.axonIndices)];
        }
        
        const _AxonRootRotAxisAngleMax = this.AxonRootRotAxisAngleMax || 15;
        const _AxonRadiusMax = this.AxonRadiusMax || 0.15;
        const _AxonRadiusMin = this.AxonRadiusMin || 0.015;
        const _AxonSplitRatio = this.AxonSplitRatio || 0.02;


        const _AxonLayerMaxCount = this.AxonLayerMaxCount || 100;
        const _AxonLayerMaxLength = this.AxonLayerMaxLength || 0.05;
        const _AxonLayerMinLength = this.AxonLayerMinLength || 0.02;
        const _AxonLayerTotalMaxLength = this.AxonLayerTotalMaxLength || 3;
        const _AxonRotAxisMaxAngle =  this.AxonRotAxisMaxAngle || 9;
        const _AxonLayerMaxAngle = _AxonRotAxisMaxAngle * 2 /* calcAxonLayerAngle(_AxonRotAxisMaxAngle) */;
        const _AxonSegments = this.AxonSegments || 18;
        const _AxonRadiusAttenuationSpeed = this.AxonRadiusAttenuationSpeed || 4;
        const _AxonSizeAttenuationSpeed = this.AxonSizeAttenuationSpeed || 3;
        const _AxonColorIntensity = this.AxonColorIntensity || 0.1;

        this.makeAxonListHeadsOnMesh = function(mesh){
            mesh.axonListHeads = [];
        
            for(let j = 0; j < mesh.axonIndices.length; j++){
                const {array : PositionArray} = mesh.geometry.attributes.position;
                const {array : NormalArray} = mesh.geometry.attributes.normal;
        
                const AxonVertex = new THREE.Vector3(PositionArray[mesh.axonIndices[j] * 3], 
                    PositionArray[mesh.axonIndices[j] * 3 + 1], 
                    PositionArray[mesh.axonIndices[j] * 3 + 2]);
        
                const scale = 0.9;
                AxonVertex.multiplyScalar(scale);
                mesh.updateMatrix();
                AxonVertex.applyMatrix4(mesh.matrix);
        
                const AxonNormal = new THREE.Vector3(NormalArray[mesh.axonIndices[j] * 3], 
                    NormalArray[mesh.axonIndices[j] * 3 + 1], 
                    NormalArray[mesh.axonIndices[j] * 3 + 2]);
        
                const RootDirection = rotateV3LimitAngle(AxonNormal, _AxonRootRotAxisAngleMax).normalize();
                const param = {
                    position : AxonVertex,
                    direction : RootDirection /* AxonNormal.normalize() */,
                    layerIndex : 0,
                    layerLength : _AxonLayerMinLength,
                    layerTotalLength : 0,
                    radius : _AxonRadiusMax /* getRandomNumBetween(0.15, 0.3) */,
                    radiusMin : _AxonRadiusMin /* getRandomNumBetween(0.01, 0.02) */,
                    splitRatio : _AxonSplitRatio,
                    pointsMatrix : new THREE.Matrix4(),
                    sizeAttenuation : 1.0,
                };
        
                mesh.axonListHeads.push(makeAxonNested(param, null));
            }
        }
        
        function makeAxonListNodeClass(){
            class AxonListNode{
                constructor(PositionV3, DirectionV3, Radius, sizeAttenuation){
                    this.position = new THREE.Vector3(PositionV3.x, PositionV3.y, PositionV3.z);
                    this.direction = new THREE.Vector3(DirectionV3.x, DirectionV3.y, DirectionV3.z);
                    this.radius = Radius;
                    this.branches = [];
                    this.layer = 0;
                    this.sizeAttenuation = sizeAttenuation;
                }
            }
            return AxonListNode;
        }
        
        function makeAxonNested(Param, PrevNode) {
            const {position, direction, layerIndex, layerLength, layerTotalLength, radius, 
                 radiusMin, splitRatio, pointsMatrix, sizeAttenuation} = Param;
            
            if(layerIndex >= _AxonLayerMaxCount - 1 || layerTotalLength > _AxonLayerTotalMaxLength) {
                return null;
            }

            const AxonListNode = makeAxonListNodeClass();
            const node = new AxonListNode(position, direction, radius, sizeAttenuation);

            if(PrevNode){
                node.layer = PrevNode.layer + 1;
                node.points = makeAxonPoints(PrevNode, pointsMatrix, layerLength);
            }else{
                node.points = makeAxonTube(radius, _AxonSegments, position, direction);
            }

            const branchCount = Math.random() < splitRatio ? 2 : 1;
            for(let i = 0; i < branchCount; i++) {
                const nextPosition = position.clone();
                nextPosition.addScaledVector(direction, layerLength);
                const total = layerTotalLength + layerLength;
                const radiusAttenuation = Math.pow((_AxonLayerTotalMaxLength - total) / _AxonLayerTotalMaxLength, _AxonRadiusAttenuationSpeed ) ;
                const tempRadius = _AxonRadiusMax * radiusAttenuation;
                const nextRadius = tempRadius < radiusMin ? radiusMin : tempRadius;
                const attenuation = Math.pow((_AxonLayerTotalMaxLength - total) / _AxonLayerTotalMaxLength, _AxonSizeAttenuationSpeed ) ;

                const scaleRadio = nextRadius / radius;
                const nextDirection = new THREE.Vector3();
                const nextMatrix = new THREE.Matrix4();
                const dx = nextPosition.x - position.x;
                const dy = nextPosition.y - position.y;
                const dz = nextPosition.z - position.z;

                makeAxonTranform(position, dx, dy, dz, scaleRadio, _AxonRotAxisMaxAngle, 
                    direction, nextDirection, nextMatrix);
                
                //the bigger angel ,the shorter layer length which make axon smooth
                // const angle = 180 * Math.acos(direction.dot(nextDirection)) / Math.PI;
                // let nextLayerLength = _AxonLayerMaxLength * Math.pow((_AxonLayerMaxAngle - angle) / _AxonLayerMaxAngle, 2); 
                // nextLayerLength = (nextLayerLength < _AxonLayerMinLength || layerIndex < 5) ? _AxonLayerMinLength : nextLayerLength;

                let nextLayerLength = _AxonLayerMinLength;

                const nextParam = {
                    position : nextPosition,
                    direction : nextDirection.normalize(),
                    layerIndex : layerIndex + 1,
                    layerLength : nextLayerLength,
                    layerTotalLength : total,
                    radius : nextRadius,
                    radiusMin : radiusMin,
                    splitRatio : splitRatio,
                    pointsMatrix : nextMatrix,
                    sizeAttenuation : attenuation,
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

        function makeAxonTranform(position, dx, dy, dz, scaleRadio, _AxonRotAxisMaxAngle, 
            direction, nextDirection, nextMatrix){

            nextDirection.copy(direction);
            const radian = _AxonRotAxisMaxAngle / 360 * Math.PI * 2;
            const rx = getRandomNumBetween(-radian, radian);
            const ry = getRandomNumBetween(-radian, radian);
            const rz = getRandomNumBetween(-radian, radian);
            nextDirection.applyAxisAngle(new THREE.Vector3(1, 0, 0), rx)
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), ry)
                .applyAxisAngle(new THREE.Vector3(0, 0, 1), rz);
        
            const mr = new THREE.Matrix4();
            const ml = new THREE.Matrix4();
            const m = new THREE.Matrix4();
            
            //translate to origin, scale, rotate XYZ, translate to pos, translate dxyz
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

        this.addAxonLineFromMesh = function(obj, mesh) {
            const pointsV3 = [];
            for(let i = 0; i < mesh.axonListHeads.length; i++){
                combineAxonPositionPointsNested(mesh.axonListHeads[i], pointsV3);
            }
            addAxonLine(obj, pointsV3);

        }

        function combineAxonPositionPointsNested(node, pointsV3){
            for(let i = 0; i < node.branches.length; i++){
                pointsV3.push(node.position);
                pointsV3.push(node.branches[i].position);
                combineAxonPositionPointsNested(node.branches[i], pointsV3);
            }
        }

        const _lineMaterial = new THREE.LineBasicMaterial({color: 0x00ff00, linewidth: 1000});
        function addAxonLine(obj, pointsV3){
            const geometry = new THREE.BufferGeometry().setFromPoints(pointsV3);
            const line = new THREE.LineSegments(geometry, _lineMaterial);
            obj.add(line);
        }



        this.addAxonPointFromMesh = function(obj, mesh) {
            const pointsV3 = [];
            for(let i = 0; i < mesh.axonListHeads.length; i++){
                combineAxonPointsNested(mesh.axonListHeads[i], pointsV3);
            }
            addAxonPoints(obj, pointsV3);
        }

        function combineAxonPointsNested(node, pointsV3){
            pointsV3.push.apply(pointsV3, node.points);
            for(let i = 0; i < node.branches.length; i++){
                combineAxonPointsNested(node.branches[i], pointsV3);
            }
        }

        const _pointsMaterial = new THREE.PointsMaterial( {color: 0x00ff00, size: 0.05, alphaTest: 0.5} );

        function addAxonPoints(obj, pointsV3){
            const pointsGeometry = new THREE.BufferGeometry().setFromPoints(pointsV3);
            const points = new THREE.Points(pointsGeometry, _pointsMaterial);
            obj.add(points);
        }


        this.addAxonPointsMaterialFromMesh = function(obj, mesh, material, list){
            const attr = {
                pointsV3: [],
                rootNormals: [],
                rootUVs: [],
                layers: [],
                rootRands: [],
                sizeAttenuations: [],
                uvs: [],
                colors: [],
            }

            for(let i = 0; i < mesh.axonListHeads.length; i++){
                const axonIndex = mesh.axonIndices[i];
                const rands = mesh.axonRands[i];
                const node = mesh.axonListHeads[i];
                combineAxonPointsAttrNested(mesh, axonIndex, rands, node, attr);
            }

            addAxonPointsMaterial(obj, attr, material, list);
        }

        function combineAxonPointsAttrNested(mesh, axonIndex, rands, node, attr){
            
            attr.pointsV3.push.apply(attr.pointsV3, node.points);
            const { array : normalArray} = mesh.geometry.attributes.normal;
            const { array : uvArray} = mesh.geometry.attributes.uv;

            for(let i = 0; i < node.points.length; i++){
                
                attr.rootNormals.push(normalArray[axonIndex * 3]);
                attr.rootNormals.push(normalArray[axonIndex * 3 + 1]);
                attr.rootNormals.push(normalArray[axonIndex * 3 + 2]);

                attr.rootUVs.push(uvArray[axonIndex * 2]);
                attr.rootUVs.push(uvArray[axonIndex * 2 + 1]);

                attr.layers.push(node.layer);

                attr.rootRands.push.apply(attr.rootRands, rands);

                attr.sizeAttenuations.push(node.sizeAttenuation);

                attr.uvs.push(Math.random());
                attr.uvs.push(Math.random());

                const ratio = node.layer / _AxonLayerMaxCount;
                const r = 0.1 * (1.0 - ratio) + 0.1 * Math.random();
                const g = 0.1;
                const b = 0.5 * ratio + 0.1 * Math.random();

                const color = new THREE.Color();
                color.setRGB(r,g,b);
                color.multiplyScalar(_AxonColorIntensity);
                attr.colors.push(color.r, color.g, color.b);
            }

            for(let i = 0; i < node.branches.length; i++) {
                combineAxonPointsAttrNested(mesh, axonIndex, rands, node.branches[i], attr);
            }
        }

        function addAxonPointsMaterial(obj, attr, material, list){
            const geometry = new THREE.BufferGeometry().setFromPoints(attr.pointsV3);

            geometry.setAttribute( 'rootNormal', new THREE.Float32BufferAttribute( attr.rootNormals, 3 ) );
            geometry.setAttribute( 'rootUv', new THREE.Float32BufferAttribute( attr.rootUVs, 2 ) );
            geometry.setAttribute( 'layer', new THREE.Float32BufferAttribute( attr.layers, 1 ) );
            geometry.setAttribute( 'rootRands', new THREE.Float32BufferAttribute( attr.rootRands, 3 ) );
            geometry.setAttribute( 'sizeAttenuation', new THREE.Float32BufferAttribute( attr.sizeAttenuations, 1 ) );
            geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( attr.uvs, 2 ) );
            geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( attr.colors, 3 ) );

            // console.log(geometry)

            const points = new THREE.Points(geometry, material);
            obj.add(points);
            list.push(points);
        }

    }
    
}

THREE.Axon = Axon;
}) ();