( function () {
    let SSShowShader = {
        defines: {
            'TONEMAPPING': 0,
        },
        uniforms: {
            'tScreen': {
                value: null
            },
            'toneMapping': {
                value: false
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
        #define saturate( a ) clamp( a, 0.0, 1.0 )

        varying vec2 vUv;
        uniform sampler2D tScreen;
        uniform bool toneMapping;

        #define saturate( a ) clamp( a, 0.0, 1.0 )

        void main() {
            vec2 uvs = vUv;
            vec3 color = texture( tScreen, uvs ).rgb;

            if(toneMapping){
                color = saturate( color / ( vec3( 1.0 ) + color ) );
            }

            gl_FragColor = vec4(color, 1.0);

            gl_FragColor = linearToOutputTexel( gl_FragColor );
        }
        `,
    };

    let SSCombineDepthShader = {
        uniforms: {
            'tDepth0': {
                value: null
            },
            'tDepth1': {
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
        uniform sampler2D tDepth0;
        uniform sampler2D tDepth1;

        void main() {
            vec2 uvs = vUv;
            float depth0 = texture(tDepth0, uvs).r;
            float depth1 = texture(tDepth1, uvs).r;

            vec3 color = depth0 > depth1 ? depth0 : depth1;

            gl_FragColor = vec4(vec3(color), 1.0);
        }
        `,
    };

    let SSFacMixCombineShader = {
        uniforms: {
            'tScreen0': {
                value: null
            },
            'tScreen1': {
                value: null
            },
            'factor': {
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
        uniform sampler2D tScreen0;
        uniform sampler2D tScreen1;
        uniform float factor;

        void main() {
            vec2 uvs = vUv;
            vec3 screen0 = texture( tScreen0, uvs ).rgb;
            vec3 screen1 = texture( tScreen1, uvs ).rgb;
            vec3 fac = vec3(factor);
            vec3 color = mix(screen0, screen1, fac);

            gl_FragColor = vec4(vec3(color), 1.0);
            gl_FragColor = linearToOutputTexel(gl_FragColor);
        }
        `,

    };

    let SSDepthCombineShader = {
        uniforms: {
            'tScreen0': {
                value: null
            },
            'tDepth0': {
                value: null
            },
            'tScreen1': {
                value: null
            },
            'tDepth1': {
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
        uniform sampler2D tScreen0;
        uniform sampler2D tDepth0;
        uniform sampler2D tScreen1;
        uniform sampler2D tDepth1;

        void main() {
            vec2 uvs = vUv;
            vec3 screen0 = texture( tScreen0, uvs ).rgb;
            vec3 screen1 = texture( tScreen1, uvs ).rgb;
            float depth0 = texture(tDepth0, uvs).r;
            float depth1 = texture(tDepth1, uvs).r;

            vec3 color = depth0 > depth1 ? screen0 : screen1;

            gl_FragColor = vec4(vec3(color), 1.0);
        }
        `,

    };

    let SSNoiseCombineShader = {
        uniforms: {
            'tScreen0': {
                value: null
            },
            'tScreen1': {
                value: null
            },
            'tNoise': {
                value: null
            },
            'offset': {
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
        uniform sampler2D tScreen0;
        uniform sampler2D tScreen1;
        uniform sampler2D tNoise;
        uniform float offset;

        void main() {
            vec2 uvs = vUv;
            vec3 screen0 = texture( tScreen0, uvs ).rgb;
            vec3 screen1 = texture( tScreen1, uvs ).rgb;
            float noise = texture( tNoise, uvs).r;

            float a = clamp(noise + offset, 0.0, 1.0);
            vec3 color = a > 0.0 ? screen1 : screen0;

            gl_FragColor = vec4(vec3(color), 1.0);
        }
        `,

    };

    let SSNoiseBurntCombineShader = {
        uniforms: {
            'tScreen0': {
                value: null
            },
            'tScreen1': {
                value: null
            },
            'tBurnt': {
                value: null
            },
            'tNoise': {
                value: null
            },
            'offset': {
                value: null
            },
            'offsetMin': {
                value: null
            },
            'offsetMax': {
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
        uniform sampler2D tScreen0;
        uniform sampler2D tScreen1;
        uniform sampler2D tBurnt;
        uniform sampler2D tNoise;
        uniform float offset;
        uniform float offsetMin;
        uniform float offsetMax;

        void main() {
            vec2 uvs = vUv;
            vec3 screen0 = texture( tScreen0, uvs ).rgb;
            vec3 screen1 = texture( tScreen1, uvs ).rgb;
            float noise = texture( tNoise, uvs).r;

            float a = clamp(noise + offset, 0.0, 1.0);
            vec3 color = a > 0.0 ? screen1 : screen0;
            if(a > offsetMin && a < offsetMax){
                vec2 uvBurnt= vec2(1.0 - (a - offsetMin) / (offsetMax - offsetMin), uvs.y);
                vec4 colorBurnt = texture( tBurnt, uvBurnt ).rgba;
                color = mix(color, colorBurnt.rgb, vec3(colorBurnt.a));
            }

            gl_FragColor = vec4(vec3(color), 1.0);
        }
        `,

    };

    let SSAddCombineShader = {
        uniforms: {
            'tScreen0': {
                value: null
            },
            'tScreen1': {
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
        uniform sampler2D tScreen0;
        uniform sampler2D tScreen1;

        void main() {
            vec2 uvs = vUv;
            vec3 screen0 = texture( tScreen0, uvs ).rgb;
            vec3 screen1 = texture( tScreen1, uvs ).rgb;
            vec3 color = screen0 + screen1;

            gl_FragColor = vec4(color.rgb, 1.0);
            gl_FragColor = linearToOutputTexel(gl_FragColor);
        }
        `,
    };

    let SSMinCombineShader = {
        uniforms: {
            'tScreen0': {
                value: null
            },
            'tScreen1': {
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
        uniform sampler2D tScreen0;
        uniform sampler2D tScreen1;

        void main() {
            vec2 uvs = vUv;
            vec3 screen0 = texture( tScreen0, uvs ).rgb;
            vec3 screen1 = texture( tScreen1, uvs ).rgb;
            vec3 color = min(screen0, screen1);

            gl_FragColor = vec4(color.rgb, 1.0);
            gl_FragColor = linearToOutputTexel(gl_FragColor);
        }
        `,
    };

    THREE.SSShowShader = SSShowShader;
    THREE.SSCombineDepthShader = SSCombineDepthShader;
    THREE.SSFacMixCombineShader = SSFacMixCombineShader;
    THREE.SSDepthCombineShader = SSDepthCombineShader;
    THREE.SSNoiseCombineShader = SSNoiseCombineShader;
    THREE.SSNoiseBurntCombineShader = SSNoiseBurntCombineShader;
    THREE.SSAddCombineShader = SSAddCombineShader;
    THREE.SSMinCombineShader = SSMinCombineShader;
} )();