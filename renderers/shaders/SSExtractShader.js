( function () {
    let SSExtractBrightnessExceedShader = {
        uniforms: {
            'tScreen': {
                value: null
            },
            'brightnessThreshold': {
                value: 1.0
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
        uniform float brightnessThreshold;

        void main() {
            vec2 uvs = vUv;

            vec3 color =  vec3(texture(tScreen, uvs));

            float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));

            vec3 outColor = vec3(0.0, 0.0, 0.0);
            if(brightness > brightnessThreshold){
                outColor = color;
            }

            gl_FragColor = vec4(outColor, 1.0);
            gl_FragColor = linearToOutputTexel(gl_FragColor);
        }
        `,
    };

    THREE.SSExtractBrightnessExceedShader = SSExtractBrightnessExceedShader;
} )();