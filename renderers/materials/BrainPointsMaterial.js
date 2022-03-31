(function() {
    class BrainPointsMaterial extends THREE.PointsMaterial {
        #shader = null;
        #time = 0;
        #positionFac = 0;

        constructor(parameters) {
            super();

            this.noiseMap = null;

            this.setValues( parameters );
        }

        set time(value){
            this.#time = value;
            if(this.#shader){
                this.#shader.uniforms.time.value = value;
            }
        }

        get positionFac(){
            return this.#positionFac;
        }

        set positionFac(value){
            this.#positionFac = value;
            if(this.#shader){
                this.#shader.uniforms.positionFac.value = value;
            }
        }

        onBeforeCompile(shader){
            this.#shader = shader;
            shader.uniforms.time = { value: this.#time };
            shader.uniforms.noiseMap = { value: this.noiseMap };
            shader.uniforms.positionFac = { value: this.#positionFac };

            let token;
            let insert;
            let replacement;

            token = '#include <common>';
            insert = /* glsl */`
                uniform sampler2D noiseMap;
                uniform float time;
                uniform float positionFac;
                
                attribute vec3 spherePosition;

                varying vec2 vUv;
        `;
            shader.vertexShader = shader.vertexShader.replace(token, token + insert);


            token = '#include <begin_vertex>';
            replacement = /* glsl */`
                vec3 pos = mix(position, spherePosition, vec3(positionFac));
                vec3 transformed = vec3(pos);
        `;
            shader.vertexShader = shader.vertexShader.replace(token, replacement);

        //     token = '#include <morphtarget_vertex>';
        //     insert = /* glsl */`
        //         vUv = uv;
        //         vec2 tUV = vUv * 1.0 + time * 0.1;
        //         vec3 dir = normalize(texture2D( noiseMap, vUv ).rgb);
                
        //         float d = texture2D( noiseMap, tUV ).a;
        //         transformed += dir * (d - 0.5) * 0.1;

        // `;
        //     shader.vertexShader = shader.vertexShader.replace(token, token + insert);

        }

        copy(source) {
            super.copy(source);
    
            this.noiseMap = source.noiseMap;
            this.time = source.time;
            this.positionFac = source.positionFac;
            
            return this;
        }
        

    }
    THREE.BrainPointsMaterial = BrainPointsMaterial;
}) ();