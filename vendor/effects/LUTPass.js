
THREE.LUTPass = function ( width, height, lutmap ) {

	THREE.Pass.call( this );

	this.width = ( width !== undefined ) ? width : 512;
	this.height = ( height !== undefined ) ? height : 512;
	//console.log("[LUT] Width: " + this.width);
	//console.log("[LUT] Height: " + this.height);

	this.clear = true;

    this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this.scene = new THREE.Scene();
	
	// Identity LUT map
	this.LUTarray = [new THREE.TextureLoader().load("../../../vendor/effects/LUTMaps/color-negative.png"),
					new THREE.TextureLoader().load("../../../vendor/effects/LUTMaps/thermal.png"),
					new THREE.TextureLoader().load("../../../vendor/effects/LUTMaps/black-white.png"),
					new THREE.TextureLoader().load("../../../vendor/effects/LUTMaps/nightvision.png")]; 

	// Basic pass render target
	this.beautyRenderTarget = new THREE.WebGLRenderTarget( this.width, this.height );
	this.beautyRenderTarget.texture.format = THREE.RGBAFormat;
	//this.beautyRenderTarget.texture.minFilter = THREE.NearestFilter;
	//this.beautyRenderTarget.texture.magFilter = THREE.NearestFilter;
	this.beautyRenderTarget.texture.generateMipmaps = false;
	this.beautyRenderTarget.stencilBuffer = false;
	this.beautyRenderTarget.depthBuffer = false;
	//this.beautyRenderTarget.depthTexture = new THREE.DepthTexture();
	//this.beautyRenderTarget.depthTexture.type = THREE.UnsignedShortType;
	//console.log(this.beautyRenderTarget);

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

	this.lutMaterial.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.texture;
	this.setMap(lutmap);
	this.lutMaterial.uniforms[ 'lutMapSize' ].value = 25.0;

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
	this.i = 0;

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
		
		this.lutMaterial.uniforms[ 'tDiffuse' ].value = readBuffer.texture;
		
		this.quad.material = this.lutMaterial;

		if ( this.renderToScreen ) {
			renderer.setRenderTarget( null );
			//renderer.clear();
			renderer.render( this.scene, this.camera );
    	} else {
			renderer.setRenderTarget( writeBuffer );
			//renderer.clear();
			renderer.render( this.scene, this.camera );
		}
	},

	setSize: function ( width, height ) {

		this.width = width;
		this.height = height;

		this.beautyRenderTarget.setSize( width, height );

	},

	setMap: function( nlutMap ) {
		fetch("../../../vendor/effects/LUTMaps/FG" + nlutMap + ".cube")
  			.then(response => response.text())
  			.then(text => this.lutMaterial.uniforms[ 'lutMap' ].value = this.lutStringToTexture(text, 25));
	},

	lutStringToTexture: function( lutString, lutSize ) {
		var totalNumberOfComponents = lutSize * lutSize * lutSize * 4;
		var floatsIdx = 0;
	
		var floatArray = lutString
				.split( '\n' )
				.map( function ( line ) {
					return line.split( ' ' );
				})
				.filter( function ( components ) {
					return components.length === 3;
				})
				.reduce( function ( floats, components, index ) {
					components.forEach( function ( v, idx ) { 
						floats[ floatsIdx++ ] = v;
						if ( idx===2 ) {
							floats[ floatsIdx++ ] = 1.0;
						}
					});
					return floats;
				}, new Float32Array( totalNumberOfComponents ) );
	
		var texture = new THREE.DataTexture( floatArray, lutSize * lutSize, lutSize );
		texture.type = THREE.FloatType;
		texture.format = THREE.RGBAFormat;
		return texture;
	}

} );