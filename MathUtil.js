function updateObjectTransformMatrix(mat4, objPos, transV3, rotateV3, scaleV3){
    const mr = new THREE.Matrix4();
    const ml = new THREE.Matrix4();
    const m = new THREE.Matrix4();
    
    mr.makeTranslation(-objPos.x, -objPos.y, -objPos.z);
    ml.makeScale(scaleV3.x, scaleV3.y, scaleV3.z);
    m.multiplyMatrices(ml, mr);
    mr.copy(m);

    ml.makeRotationX(rotateV3.x);
    m.multiplyMatrices(ml, mr);
    mr.copy(m);

    ml.makeRotationY(rotateV3.y);
    m.multiplyMatrices(ml, mr);
    mr.copy(m);

    ml.makeRotationZ(rotateV3.z);
    m.multiplyMatrices(ml, mr);
    mr.copy(m);

    ml.makeTranslation(objPos.x, objPos.y, objPos.z);
    m.multiplyMatrices(ml, mr);
    mr.copy(m);

    ml.makeTranslation(transV3.x, transV3.y, transV3.z);
    m.multiplyMatrices(ml, mr);

    mat4.copy(m);
}

function makeObjectTransformMatrix(objPos, transV3, rotateV3, scaleV3){

    const mat4 = new THREE.Matrix4();
    updateObjectTransformMatrix(mat4, objPos, transV3, rotateV3, scaleV3);

    // const mr = new THREE.Matrix4();
    // const ml = new THREE.Matrix4();
    // const m = new THREE.Matrix4();
    
    // mr.makeTranslation(-objPos.x, -objPos.y, -objPos.z);
    // ml.makeScale(scaleV3.x, scaleV3.y, scaleV3.z);
    // m.multiplyMatrices(ml, mr);
    // mr.copy(m);

    // ml.makeRotationX(rotateV3.x);
    // m.multiplyMatrices(ml, mr);
    // mr.copy(m);

    // ml.makeRotationY(rotateV3.y);
    // m.multiplyMatrices(ml, mr);
    // mr.copy(m);

    // ml.makeRotationZ(rotateV3.z);
    // m.multiplyMatrices(ml, mr);
    // mr.copy(m);

    // ml.makeTranslation(objPos.x, objPos.y, objPos.z);
    // m.multiplyMatrices(ml, mr);
    // mr.copy(m);

    // ml.makeTranslation(transV3.x, transV3.y, transV3.z);
    // m.multiplyMatrices(ml, mr);

    // mat4.copy(m);

    return mat4;
}

function getRandomIntBetween(Min, Max){
    return Math.floor(Math.random() * (Max - Min + 1)) + Min;
}