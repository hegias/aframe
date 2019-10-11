
THREE.LUTPass = function ( width, height ) {

	THREE.Pass.call( this );

	this.width = ( width !== undefined ) ? width : 512;
	this.height = ( height !== undefined ) ? height : 512;

	this.clear = true;

    this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
    this.scene = new THREE.Scene();

	// Basic pass render target
	this.beautyRenderTarget = new THREE.WebGLRenderTarget( this.width, this.height );
	this.beautyRenderTarget.texture.format = THREE.RGBFormat;
	this.beautyRenderTarget.texture.minFilter = THREE.NearestFilter;
	this.beautyRenderTarget.texture.magFilter = THREE.NearestFilter;
	this.beautyRenderTarget.texture.generateMipmaps = false;
	this.beautyRenderTarget.stencilBuffer = false;
	this.beautyRenderTarget.depthBuffer = true;
	this.beautyRenderTarget.depthTexture = new THREE.DepthTexture();
	this.beautyRenderTarget.depthTexture.type = THREE.UnsignedShortType;
	console.log(this.beautyRenderTarget);

	if ( THREE.LUTShader === undefined ) {

		console.error( 'THREE.LUTPass: The pass relies on LUTShader.' );

	}

	this.lutMaterial = new THREE.ShaderMaterial( {
		defines: Object.assign( {}, THREE.LUTShader.defines ),
		uniforms: THREE.UniformsUtils.clone( THREE.LUTShader.uniforms ),
		vertexShader: THREE.LUTShader.vertexShader,
		fragmentShader: THREE.LUTShader.fragmentShader,
		blending: THREE.NoBlending
	} );

	//this.ssaoMaterial.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.texture;
	//this.ssaoMaterial.uniforms[ 'tNormal' ].value = this.normalRenderTarget.texture;
	//this.ssaoMaterial.uniforms[ 'tDepth' ].value = this.beautyRenderTarget.depthTexture;
	//this.ssaoMaterial.uniforms[ 'tNoise' ].value = this.noiseTexture;
	//this.ssaoMaterial.uniforms[ 'kernel' ].value = this.kernel;
	//this.ssaoMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
	//this.ssaoMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;
	//this.ssaoMaterial.uniforms[ 'resolution' ].value.set( this.width, this.height );
	//this.ssaoMaterial.uniforms[ 'cameraProjectionMatrix' ].value.copy( this.camera.projectionMatrix );
	//this.ssaoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.getInverse( this.camera.projectionMatrix );

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

THREE.LUTPass.prototype = Object.assign( Object.create( THREE.Pass.prototype ), {

	constructor: THREE.LUTPass,

	dispose: function () {

		// dispose render targets
		this.beautyRenderTarget.dispose();

		// dispose geometry
		this.quad.geometry.dispose();

		// dispose materials
		this.copyMaterial.dispose();

	},

	render: function ( renderer, writeBuffer , readBuffer, deltaTime, maskActive ) {

		// render beauty and depth

		this.quad.material = this.basic;
		this.basic.map = readBuffer.texture;
		//renderer.setRenderTarget( this.beautyRenderTarget );
		renderer.setRenderTarget( null );
		renderer.clear();
		renderer.render( this.scene, this.camera );

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

	setSize: function ( width, height ) {

		this.width = width;
		this.height = height;

		this.beautyRenderTarget.setSize( width, height );

		//this.ssaoMaterial.uniforms[ 'resolution' ].value.set( width, height );
		//this.ssaoMaterial.uniforms[ 'cameraProjectionMatrix' ].value.copy( this.camera.projectionMatrix );
		//this.ssaoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.getInverse( this.camera.projectionMatrix );

	},

} );