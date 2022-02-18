( function () {
    let EnvShader = {
        uniforms: {
            'tBackground': {
                value: null
            },
            'Intensity': {
                value: 1.0
            },
            
        },

        vertexShader:
        /* glsl */
        `
        varying vec2 vUv;

        void main() {

            vUv = uv;
            gl_Position = (projectionMatrix * modelViewMatrix * vec4( position, 1.0 )).xyww;

        }
        `,

        fragmentShader:
        /* glsl */
        `
        #define saturate( a ) clamp( a, 0.0, 1.0 )

        varying vec2 vUv;
        uniform sampler2D tBackground;
        uniform float Intensity;

        void main() {
            vec2 uvs = vUv;
            vec3 color = texture( tBackground, uvs ).rgb;
            color = color * clamp(Intensity, 0.0, 1.0);
            gl_FragColor = vec4(vec3(color), 1.0);
            gl_FragColor.rgb = saturate( gl_FragColor.rgb / ( vec3( 1.0 ) + gl_FragColor.rgb ) );
            gl_FragColor = linearToOutputTexel( gl_FragColor );
        }
        `,

    };
    THREE.EnvShader = EnvShader;
} )();