(function() {
    class SpherePointsMaterial extends THREE.PointsMaterial {
        #shader = null;
        #time = 0;

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

        onBeforeCompile(shader){
            this.#shader = shader;
            shader.uniforms.time = { value: this.#time };
            shader.uniforms.noiseMap = { value: this.noiseMap };

            let token = '#include <common>';
            let insert = /* glsl */`
                uniform sampler2D noiseMap;

                uniform float time;
                
                attribute float radius;
                attribute vec2 sphereCoord;
        `;
            shader.vertexShader = shader.vertexShader.replace(token, token + insert);


            token = '#include <begin_vertex>';
            let replacement = /* glsl */`
                vec2 tUV = uv + time * 0.0003;
                vec4 noise = texture2D( noiseMap, tUV );
                vec4 noise1 = texture2D( noiseMap, tUV * 2.0);

                float dTheta = PI * noise.a * 1.0;
                float theta = sphereCoord.x + dTheta;
                float dPhi = PI2 * noise1.a * 0.1;
                float phi = sphereCoord.y + dPhi;
                float x = radius * sin(phi) * cos(theta);
                float y = radius * sin(phi) * sin(theta);
                float z = radius * cos(phi);

                vec3 transformed = vec3( x, y, z );

        `;
            shader.vertexShader = shader.vertexShader.replace(token, replacement);

        }

        copy(source) {
            super.copy(source);
    
            this.noiseMap = source.noiseMap;

            this.time = source.time;
            
            return this;
        }

    }
    THREE.SpherePointsMaterial = SpherePointsMaterial;
}) ();