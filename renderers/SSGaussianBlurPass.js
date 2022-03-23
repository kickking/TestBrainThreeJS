(function() {
    class SSGaussianBlurPass {
        constructor(params) {
            let _width = params.width ? params.width : window.innerWidth;
            let _height = params.height ? params.height : window.innerHeight;
            let _texture = params.texture ? params.texture : null;
            let _blurData = params.blurData ? params.blurData : [1];

            let _camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100 );

            this.setSize = function(width, height){
                _width = width;
                _height = height;
                resetRenderTargets();
            }

            function resetRenderTargets(){
                for(let i = 0; i < _ppRenderTargets.length; i++){
                    _ppRenderTargets[i].setSize(_width * 2, _height * 2);
                }
            }

            this.setTexture = function(value){
                _texture = value;
            }

            this.setBlurData = function(data){
                _blurData = data;
            }

            let _ppRenderTargets = [];
            function initRenderTargets(){
                for(let i = 0; i < 2; i++){
                    const rt = new THREE.WebGLRenderTarget( _width * 2, _height * 2,
                        { 
                            minFilter: THREE.LinearFilter, 
                            magFilter: THREE.NearestFilter, 
                            type: THREE.FloatType,
                        });
    
                        _ppRenderTargets.push(rt);
                }
            }
            initRenderTargets();

            const _blurMaterialH = new THREE.ShaderMaterial({
                defines: Object.assign( {}, THREE.SSGaussianBlurShader.defines ),
                uniforms: THREE.UniformsUtils.clone( THREE.SSGaussianBlurShader.uniforms ),
                vertexShader: THREE.SSGaussianBlurShader.vertexShader,
                fragmentShader: THREE.SSGaussianBlurShader.fragmentShader,
                depthWrite: false,
            });
            _blurMaterialH.defines[ 'HORIZONTAL' ] = 1;

            const _blurMaterialV = new THREE.ShaderMaterial({
                defines: Object.assign( {}, THREE.SSGaussianBlurShader.defines ),
                uniforms: THREE.UniformsUtils.clone( THREE.SSGaussianBlurShader.uniforms ),
                vertexShader: THREE.SSGaussianBlurShader.vertexShader,
                fragmentShader: THREE.SSGaussianBlurShader.fragmentShader,
                depthWrite: false,
            });
            _blurMaterialV.defines[ 'HORIZONTAL' ] = 0;
            
            const _blurScene = new THREE.Scene();
            const _quad = new THREE.Mesh(new THREE.PlaneGeometry( 2, 2 ), _blurMaterialH);
            _blurScene.add(_quad);

            let horizontal = 1;

            this.render = function(renderer, writeBuffer){

                _blurMaterialH.uniforms[ 'tScreen' ].value = _texture;

                for(let i = 0; i < _blurData.length; i++){
                    _blurMaterialH.uniforms[ 'offset' ].value = _blurData[i];
                    _blurMaterialV.uniforms[ 'offset' ].value = _blurData[i];

                    horizontal = 1;
                    _quad.material = _blurMaterialH;
                    renderer.setRenderTarget( _ppRenderTargets[horizontal] );
                    // renderer.setRenderTarget( null );
                    renderer.clear();
                    renderer.render( _blurScene, _camera );
                    _blurMaterialV.uniforms[ 'tScreen' ].value = _ppRenderTargets[horizontal].texture;

                    if(i < (_blurData.length - 1)){
                        horizontal = 0;
                        _quad.material = _blurMaterialV;
                        renderer.setRenderTarget( _ppRenderTargets[horizontal] );
                        renderer.clear();
                        renderer.render( _blurScene, _camera );
                        _blurMaterialH.uniforms[ 'tScreen' ].value = _ppRenderTargets[horizontal].texture;
                    }else{
                        horizontal = 0;
                        _quad.material = _blurMaterialV;
                        renderer.setRenderTarget( writeBuffer );
                        // renderer.setRenderTarget( null );
                        renderer.clear();
                        renderer.render( _blurScene, _camera );
                    }

                }

            }

        }
    }

    THREE.SSGaussianBlurPass = SSGaussianBlurPass;
}) ();