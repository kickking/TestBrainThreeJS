(function() {
    class AxonGeometryMaterial extends THREE.MeshPhysicalMaterial{
        #shader = null;
        #rootDisplacementFac = 0;
        #time = 0;

        // #displacementFac = 0;
        // #normalFac = 0;

        constructor(parameters) {
            super();

            this.rootDisplacementScale = 1.0;
            this.rootDisplacementBias = 0.0;
            this.rootDisplacementMap = null;
            this.rootDisplacementMap1 = null;
            this.layerMax = 1.0;

            // this.displacementMap1 = null;
            // this.normalMap1 = null;

            this.setValues( parameters );
        }

        set rootDisplacementFac(value){
            this.#rootDisplacementFac = value;
            if(this.#shader){
                this.#shader.uniforms.rootDisplacementFac.value = value;
            }
        }

        get rootDisplacementFac() {
            return this.#rootDisplacementFac;
        }

        set time(value){
            this.#time = value;
            if(this.#shader){
                this.#shader.uniforms.time.value = value;
            }
        }

        // set displacementFac(value){
        //     this.#displacementFac = value;
        //     if(this.#shader){
        //         this.#shader.uniforms.displacementFac.value = value;
        //     }
        // }
    
        // get displacementFac() {
        //     return this.#displacementFac;
        // }

        // set normalFac(value){
        //     this.#normalFac = value;
        //     if(this.#shader){
        //         this.#shader.uniforms.normalFac.value = value;
        //     }
        // }

        // get normalFac() {
        //     return this.#normalFac;
        // }

        onBeforeCompile(shader){
            this.#shader = shader;
            shader.uniforms.rootDisplacementScale = { value: this.rootDisplacementScale };
            shader.uniforms.rootDisplacementBias = { value: this.rootDisplacementBias };
            shader.uniforms.rootDisplacementMap = { value: this.rootDisplacementMap };
            shader.uniforms.rootDisplacementMap1 = { value: this.rootDisplacementMap1 };
            shader.uniforms.rootDisplacementFac = { value: this.#rootDisplacementFac };
            shader.uniforms.layerMax = {value: this.layerMax};
            shader.uniforms.time = { value: this.#time };

            // shader.uniforms.displacementMap1 = { value: this.displacementMap1 };
            // shader.uniforms.displacementFac = { value: this.#displacementFac };
            // shader.uniforms.normalMap1 = { value: this.normalMap1 };
            // shader.uniforms.normalFac = { value: this.#normalFac };

            let token = '#include <common>';
            let insert = /* glsl */`
                uniform float rootDisplacementScale;
                uniform float rootDisplacementBias;
                uniform sampler2D rootDisplacementMap;
                uniform sampler2D rootDisplacementMap1;
                uniform float layerMax;

                uniform float rootDisplacementFac;
                uniform float time;
                
                attribute vec3 rootNormal;
                attribute vec2 rootUv;
                attribute float layer;
                attribute vec3 rootRands;

                // varying vec2 vUv;

        `;
            shader.vertexShader = shader.vertexShader.replace(token, token + insert);

        //     token = '#include <displacementmap_pars_vertex>';
        //     let replacement = /* glsl */`
        //     #ifdef USE_DISPLACEMENTMAP
        //         uniform sampler2D displacementMap;
        //         uniform sampler2D displacementMap1;
        //         uniform float displacementScale;
        //         uniform float displacementBias;
        //         uniform float displacementFac;
        //     #endif
        // `;
        //     shader.vertexShader = shader.vertexShader.replace(token, replacement);

            token = '#include <displacementmap_vertex>';
            insert = /* glsl */`
                float rootDispValue = mix(texture2D( rootDisplacementMap, rootUv ).x, texture2D( rootDisplacementMap1, rootUv ).x, rootDisplacementFac);
                float phase = PI2 * layer * 1.0 / layerMax;
                float offset = rootDispValue * rootRands.z * (sin(phase + time * rootRands.x) + cos(phase + time * rootRands.y));
                vec3 rN = normalize(rootNormal * rootRands);
                float ratio = 1.0 - exp(-layer / 50.0);
                transformed += rN * (offset * rootDisplacementScale * ratio + rootDisplacementBias);
                // vUv = uv;

        `;
            shader.vertexShader = shader.vertexShader.replace(token, token + insert);


        //     token = /* glsl */`uniform sampler2D normalMap;`;
        //     let replacement = /* glsl */`
        //     uniform sampler2D normalMap;
        //     uniform sampler2D normalMap1;
        //     uniform float normalFac;
        // `;
        //     let newChunk = THREE.ShaderChunk['normalmap_pars_fragment'].replace(token, replacement);
        //     shader.fragmentShader = shader.fragmentShader.replace('#include <normalmap_pars_fragment>', newChunk);
    
        //     token = /* glsl */`normal = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;`;
        //     replacement = /* glsl */`
        //     vec3 normalValue = mix(texture2D( normalMap, vUv ).xyz, texture2D( normalMap1, vUv ).xyz, vec3(normalFac));
        //     normal = normalValue * 2.0 - 1.0;
        // `;
        //     newChunk = THREE.ShaderChunk['normal_fragment_maps'].replace(token, replacement);
    
        //     token = /* glsl */`vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;`;
        //     replacement = /* glsl */`
        //     vec3 normalValue = mix(texture2D( normalMap, vUv ).xyz, texture2D( normalMap1, vUv ).xyz, vec3(normalFac));
        //     vec3 mapN = normalValue * 2.0 - 1.0;
        // `;
        //     newChunk = newChunk.replace(token, replacement);
        //     shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', newChunk);
        }

        copy(source) {
            super.copy(source);
    
            this.rootDisplacementScale = source.rootDisplacementScale;
            this.rootDisplacementBias = source.rootDisplacementBias;
            this.rootDisplacementMap = source.rootDisplacementMap;
            this.rootDisplacementMap1 = source.rootDisplacementMap1;
            this.layerMax = source.layerMax;
            this.rootDisplacementFac = source.rootDisplacementFac;
            this.time = source.time;

            // this.displacementMap1 = source.displacementMap1;
            // this.displacementFac = source.displacementFac;

            // this.normalMap1 = source.normalMap1;
            // this.normalFac = source.normalFac;
            
            return this;
        }

    }
    THREE.AxonGeometryMaterial = AxonGeometryMaterial;
}) ();