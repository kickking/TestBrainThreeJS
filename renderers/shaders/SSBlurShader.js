( function () {
    let SSSimpleBlurShader = {
        defines: {
            'KERNEL_SIZE': 9
        },
        uniforms: {
            'tScreen': {
                value: null
            },
        },
        vertexShader:
        /* glsl */
        `
        varying vec2 vUv;

        void main() {

            vUv = uv;
            gl_Position =  vec4( position, 1.0 );

        }
        `,
        fragmentShader:
        /* glsl */
        `
        varying vec2 vUv;
        uniform sampler2D tScreen;

        const float offset = 1.0 / 300.0;

        vec2 offsets[9] = vec2[](
            vec2(-offset,  offset), // top-left
            vec2( 0.0f,    offset), // top-center
            vec2( offset,  offset), // top-right
            vec2(-offset,  0.0f),   // center-left
            vec2( 0.0f,    0.0f),   // center-center
            vec2( offset,  0.0f),   // center-right
            vec2(-offset, -offset), // bottom-left
            vec2( 0.0f,   -offset), // bottom-center
            vec2( offset, -offset)  // bottom-right    
        );

        float kernel[9] = float[](
            1.0, 2.0, 1.0,
            2.0,  4.0, 2.0,
            1.0, 2.0, 1.0
        );

        void main() {
            vec2 uvs = vUv;

            vec3 sampleTex[9];
            for(int i = 0; i < 9; i++)
            {
                sampleTex[i] = vec3(texture(tScreen, uvs + offsets[i]));
            }

            vec3 color = vec3(0.0);
            for(int i = 0; i < 9; i++){
                color += sampleTex[i] * kernel[i];
            }
            color /= 16.0;
            
            gl_FragColor = vec4(color, 1.0);
        }
        `,
    };

    /* SSSimpleBlurMouseFocusShader */
    let SSSimpleBlurMFShader = {
        defines: {
            'KERNEL_SIZE': 9
        },
        uniforms: {
            'tScreen': {
                value: null
            },
            'threshold': {
                value: null
            },
            'falloff': {
                value: null
            },
            'mousePos': {
                value: null
            },
            'resolution': {
                value: null
            },
            'devicePixelRatio': {
                value: null
            },
        },
        vertexShader:
        /* glsl */
        `
        varying vec2 vUv;

        void main() {

            vUv = uv;
            gl_Position =  vec4( position, 1.0 );

        }
        `,
        fragmentShader:
        /* glsl */
        `
        varying vec2 vUv;
        uniform sampler2D tScreen;
        uniform float threshold;
        uniform float falloff;
        uniform vec2 mousePos;
        uniform vec2 resolution;
        uniform float devicePixelRatio;

        const float offset = 1.0 / 300.0;

        vec2 offsets[9] = vec2[](
            vec2(-offset,  offset), // top-left
            vec2( 0.0f,    offset), // top-center
            vec2( offset,  offset), // top-right
            vec2(-offset,  0.0f),   // center-left
            vec2( 0.0f,    0.0f),   // center-center
            vec2( offset,  0.0f),   // center-right
            vec2(-offset, -offset), // bottom-left
            vec2( 0.0f,   -offset), // bottom-center
            vec2( offset, -offset)  // bottom-right    
        );

        float kernel[9] = float[](
            1.0, 2.0, 1.0,
            2.0,  4.0, 2.0,
            1.0, 2.0, 1.0
        );

        void main() {
            vec2 uvs = vUv;

            vec3 sampleTex[9];
            for(int i = 0; i < 9; i++)
            {
                sampleTex[i] = vec3(texture(tScreen, uvs + offsets[i]));
            }

            vec3 color = vec3(0.0);
            for(int i = 0; i < 9; i++){
                color += sampleTex[i] * kernel[i];
            }
            color /= 16.0;

            vec2 coord = gl_FragCoord.xy / devicePixelRatio;
            vec2 mouse = mousePos;
            mouse = vec2(mouse.x, resolution.y - mouse.y);
            float dist = distance(coord, mouse);
            float fac =  clamp( max(dist - threshold, 0.0) / falloff, 0.0, 1.0 );
            color = mix(sampleTex[4], color, vec3(fac));
            
            // vec3 red = vec3(1.0, 0.0, 0.0);
            // color = mix(red, color, vec3(fac));

            gl_FragColor = vec4(color, 1.0);
        }
        `,

    };

    let SSTestBlurMFShader = {
        uniforms: {
            'mousePos': {
                value: null
            },
            'resolution': {
                value: null
            },
            'devicePixelRatio': {
                value: null
            },

        },

        vertexShader:
        /* glsl */
        `
        varying vec2 vUv;

        void main() {

            vUv = uv;
            gl_Position =  vec4( position, 1.0 );

        }
        `,
        fragmentShader:
        /* glsl */
        `
        varying vec2 vUv;
        uniform vec2 mousePos;
        uniform vec2 resolution;
        uniform float devicePixelRatio;

        void main() {
            vec2 uvs = vUv;
            vec2 coord = gl_FragCoord.xy / devicePixelRatio;
            vec2 mouse = mousePos;
            mouse = vec2(mouse.x, resolution.y - mouse.y);
            float dist = distance(coord, mouse);
            float fac = max(dist - 20.0, 0.0);
            vec3 color;
            if(fac == 0.0){
                color = vec3(1.0,0.0,0.0);
            }else{
                color = vec3(0.0,0.0,0.0);
            }

            gl_FragColor = vec4(color, 1.0);
        }
        `,


    };

    THREE.SSSimpleBlurShader = SSSimpleBlurShader;
    THREE.SSSimpleBlurMFShader = SSSimpleBlurMFShader;
    THREE.SSTestBlurMFShader = SSTestBlurMFShader;

} )();