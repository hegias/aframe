
THREE.SSAOPass = function ( width, height ) {

	THREE.Pass.call( this );

	this.width = ( width !== undefined ) ? width : 512;
	this.height = ( height !== undefined ) ? height : 512;

	this.clear = true;

    this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
    this.scene = new THREE.Scene();

	this.kernelRadius = 8;
	this.kernelSize = 32;
	this.kernel = [];
	this.noiseTexture = null;
	this.output = 0;

	this.minDistance = 0.005;
	this.maxDistance = 0.1;

    // Generate sample Kernel
    for ( var i = 0; i < this.kernelSize; i ++ ) {
		var sample = new THREE.Vector3();
        sample.x = (Math.random() * 2 ) - 1;
		sample.y = (Math.random() * 2 ) - 1;
		sample.z = Math.random();
    
        sample.normalize();

		var scale = i / this.kernelSize;
		scale = THREE.Math.lerp( 0.1, 1, scale * scale );
		sample.multiplyScalar( scale );

		this.kernel.push( sample );
    };

    // Generate random kernel rotation
    var _width = 4, _height = 4;
    var size = _width * _height;
    var data = new Float32Array( size * 4 );
    for ( var i = 0; i < size; i ++ ) {
        var stride = i * 4;
        var x = ( Math.random() * 2 ) - 1;
        var y = ( Math.random() * 2 ) - 1;
        var z = 0;
        data[ stride ] = x;
        data[ stride + 1 ] = y;
        data[ stride + 2 ] = z;
        data[ stride + 3 ] = 1;
    }
    this.noiseTexture = new THREE.DataTexture( data, _width, _height, THREE.RGBAFormat, THREE.FloatType );
    this.noiseTexture.wrapS = THREE.RepeatWrapping;
    this.noiseTexture.wrapT = THREE.RepeatWrapping;
    this.noiseTexture.needsUpdate = true;

	// beauty render target with depth buffer

	var depthTexture = new THREE.DepthTexture();
	depthTexture.type = THREE.UnsignedShortType;
	depthTexture.minFilter = THREE.NearestFilter;
	depthTexture.maxFilter = THREE.NearestFilter;

	/*this.beautyRenderTarget = new THREE.WebGLRenderTarget( this.width, this.height, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		depthTexture: depthTexture,
		depthBuffer: true
	} );*/
	this.beautyRenderTarget = new THREE.WebGLRenderTarget( this.width, this.height );
	this.beautyRenderTarget.texture.format = THREE.RGBFormat;
	this.beautyRenderTarget.texture.minFilter = THREE.NearestFilter;
	this.beautyRenderTarget.texture.magFilter = THREE.NearestFilter;
	this.beautyRenderTarget.texture.generateMipmaps = false;
	this.beautyRenderTarget.stencilBuffer = false;
	this.beautyRenderTarget.depthBuffer = true;
	this.beautyRenderTarget.depthTexture = new THREE.DepthTexture();
	this.beautyRenderTarget.depthTexture.type = THREE.UnsignedShortType;

	// normal render target

	this.normalRenderTarget = new THREE.WebGLRenderTarget( this.width, this.height, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat
	} );
	this.depthRenderTarget = this.normalRenderTarget.clone();

	// ssao render target

	this.ssaoRenderTarget = new THREE.WebGLRenderTarget( this.width, this.height, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat
	} );

	this.blurRenderTarget = this.ssaoRenderTarget.clone();

	// ssao material

	if ( THREE.SSAOShader === undefined ) {

		console.error( 'THREE.SSAOPass: The pass relies on SSAOShader.' );

	}

	this.ssaoMaterial = new THREE.ShaderMaterial( {
		defines: Object.assign( {}, THREE.SSAOShader.defines ),
		uniforms: THREE.UniformsUtils.clone( THREE.SSAOShader.uniforms ),
		vertexShader: THREE.SSAOShader.vertexShader,
		fragmentShader: THREE.SSAOShader.fragmentShader,
		blending: THREE.NoBlending
	} );

	this.ssaoMaterial.uniforms[ 'tNoise' ].value = this.noiseTexture;
	this.ssaoMaterial.uniforms[ 'kernel' ].value = this.kernel;
	this.ssaoMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
	this.ssaoMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;
	this.ssaoMaterial.uniforms[ 'resolution' ].value.set( this.width, this.height );
	this.ssaoMaterial.uniforms[ 'cameraProjectionMatrix' ].value.copy( this.camera.projectionMatrix );
	this.ssaoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.getInverse( this.camera.projectionMatrix );

	// normal material

	this.normalMaterial = new THREE.MeshNormalMaterial();
	this.normalMaterial.blending = THREE.NoBlending;

	// blur material

	this.blurMaterial = new THREE.ShaderMaterial( {
		defines: Object.assign( {}, THREE.SSAOBlurShader.defines ),
		uniforms: THREE.UniformsUtils.clone( THREE.SSAOBlurShader.uniforms ),
		vertexShader: THREE.SSAOBlurShader.vertexShader,
		fragmentShader: THREE.SSAOBlurShader.fragmentShader
	} );
	this.blurMaterial.uniforms[ 'tDiffuse' ].value = this.ssaoRenderTarget.texture;
	this.blurMaterial.uniforms[ 'resolution' ].value.set( this.width, this.height );

	// material for rendering the depth

	this.depthRenderMaterial = new THREE.ShaderMaterial( {
		defines: Object.assign( {}, THREE.SSAODepthShader.defines ),
		uniforms: THREE.UniformsUtils.clone( THREE.SSAODepthShader.uniforms ),
		vertexShader: THREE.SSAODepthShader.vertexShader,
		fragmentShader: THREE.SSAODepthShader.fragmentShader,
		blending: THREE.NoBlending
	} );
	this.depthRenderMaterial.uniforms[ 'tDepth' ].value = this.beautyRenderTarget.depthTexture;
	this.depthRenderMaterial.uniforms[ 'cameraNear' ].value = 0.1;
	this.depthRenderMaterial.uniforms[ 'cameraFar' ].value = 2000;

	// material for rendering the content of a render target

	this.copyMaterial = new THREE.ShaderMaterial( {
		uniforms: THREE.UniformsUtils.clone( THREE.CopyShader.uniforms ),
		vertexShader: THREE.CopyShader.vertexShader,
		fragmentShader: THREE.CopyShader.fragmentShader,
		transparent: true,
		depthTest: false,
		depthWrite: false,
		blendSrc: THREE.DstColorFactor,
		blendDst: THREE.ZeroFactor,
		blendEquation: THREE.AddEquation,
		blendSrcAlpha: THREE.DstAlphaFactor,
		blendDstAlpha: THREE.ZeroFactor,
		blendEquationAlpha: THREE.AddEquation
	} );

	this.originalClearColor = new THREE.Color();
	
	this.basic = new THREE.MeshBasicMaterial();

	this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
	this.quad.frustumCulled = false; // Avoid getting clipped
	this.scene.add( this.quad );

};

THREE.SSAOPass.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

	constructor: THREE.SSAOPass,

	dispose: function () {

		// dispose render targets

		this.beautyRenderTarget.dispose();
		this.normalRenderTarget.dispose();
		this.ssaoRenderTarget.dispose();
		this.blurRenderTarget.dispose();

		// dispose geometry

		this.quad.geometry.dispose();

		// dispose materials

		this.normalMaterial.dispose();
		this.blurMaterial.dispose();
		this.copyMaterial.dispose();
		this.depthRenderMaterial.dispose();

	},

	render: function ( renderer, writeBuffer , readBuffer, deltaTime, maskActive, normalRenderTarget ) {

		// render beauty and depth

		this.quad.material = this.basic;
		this.basic.map = readBuffer.texture;
		//renderer.setRenderTarget( this.beautyRenderTarget );

		this.ssaoMaterial.uniforms[ 'tDiffuse' ].value = readBuffer.texture;
		this.ssaoMaterial.uniforms[ 'tDepth' ].value = readBuffer.depthTexture;
		this.ssaoMaterial.uniforms[ 'tNormal' ].value = normalRenderTarget.texture;

		this.quad.material = this.ssaoMaterial;
		
		if ( this.renderToScreen ) {
      
			renderer.setRenderTarget( null );
			renderer.clear();
			renderer.render( this.scene, this.camera );

    } else {

			renderer.setRenderTarget( writeBuffer );
			renderer.clear();
			renderer.render( this.scene, this.camera );

    }
		/*
		// render normals

		this.renderOverride( renderer, this.normalMaterial, this.normalRenderTarget, 0x7777ff, 1.0 );

		// render SSAO

		this.ssaoMaterial.uniforms[ 'kernelRadius' ].value = this.kernelRadius;
		this.ssaoMaterial.uniforms[ 'minDistance' ].value = this.minDistance;
		this.ssaoMaterial.uniforms[ 'maxDistance' ].value = this.maxDistance;
		this.renderPass( renderer, this.ssaoMaterial, this.ssaoRenderTarget );

		// render blur

		this.renderPass( renderer, this.blurMaterial, this.blurRenderTarget );

		// output result to screen

		this.renderPass( renderer, this.depthRenderMaterial, this.renderToScreen ? null : writeBuffer );
		//this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.texture;
		//this.copyMaterial.blending = THREE.NoBlending;
		//this.renderPass( renderer, this.copyMaterial, this.renderToScreen ? null : writeBuffer );

		//this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.blurRenderTarget.texture;
		//this.copyMaterial.blending = THREE.CustomBlending;
		//this.renderPass( renderer, this.copyMaterial, this.renderToScreen ? null : writeBuffer );
		*/
	},

	renderPass: function ( renderer, passMaterial, renderTarget, clearColor, clearAlpha ) {

		// save original state
		this.originalClearColor.copy( renderer.getClearColor() );
		var originalClearAlpha = renderer.getClearAlpha();
		var originalAutoClear = renderer.autoClear;

		renderer.setRenderTarget( renderTarget );

		// setup pass state
		renderer.autoClear = false;
		if ( ( clearColor !== undefined ) && ( clearColor !== null ) ) {

			renderer.setClearColor( clearColor );
			renderer.setClearAlpha( clearAlpha || 0.0 );
			renderer.clear();

		}

		this.quad.material = passMaterial;
		renderer.render( this.scene, this.camera );

		// restore original state
		renderer.autoClear = originalAutoClear;
		renderer.setClearColor( this.originalClearColor );
		renderer.setClearAlpha( originalClearAlpha );


	},

	renderOverride: function ( renderer, overrideMaterial, renderTarget, clearColor, clearAlpha ) {

		this.originalClearColor.copy( renderer.getClearColor() );
		var originalClearAlpha = renderer.getClearAlpha();
		var originalAutoClear = renderer.autoClear;

		renderer.setRenderTarget( renderTarget );
		renderer.autoClear = false;

		clearColor = overrideMaterial.clearColor || clearColor;
		clearAlpha = overrideMaterial.clearAlpha || clearAlpha;

		if ( ( clearColor !== undefined ) && ( clearColor !== null ) ) {

			renderer.setClearColor( clearColor );
			renderer.setClearAlpha( clearAlpha || 0.0 );
			renderer.clear();

		}

		this.scene.overrideMaterial = overrideMaterial;
		renderer.render( this.scene, this.camera );
		this.scene.overrideMaterial = null;

		// restore original state

		renderer.autoClear = originalAutoClear;
		renderer.setClearColor( this.originalClearColor );
		renderer.setClearAlpha( originalClearAlpha );

	},

	setSize: function ( width, height ) {

		this.width = width;
		this.height = height;

		this.beautyRenderTarget.setSize( width, height );
		this.ssaoRenderTarget.setSize( width, height );
		this.normalRenderTarget.setSize( width, height );
		this.blurRenderTarget.setSize( width, height );

		this.ssaoMaterial.uniforms[ 'resolution' ].value.set( width, height );
		this.ssaoMaterial.uniforms[ 'cameraProjectionMatrix' ].value.copy( this.camera.projectionMatrix );
		this.ssaoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.getInverse( this.camera.projectionMatrix );

		this.blurMaterial.uniforms[ 'resolution' ].value.set( width, height );

	},

} );