
THREE.LUTPass = function ( width, height, lutmap ) {

	THREE.Pass.call( this );

	this.width = ( width !== undefined ) ? width : 512;
	this.height = ( height !== undefined ) ? height : 512;

	this.clear = true;

    this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this.scene = new THREE.Scene();

	// Basic pass render target
	this.beautyRenderTarget = new THREE.WebGLRenderTarget( this.width, this.height );
	this.beautyRenderTarget.texture.format = THREE.RGBAFormat;
	this.beautyRenderTarget.texture.minFilter = THREE.NearestFilter;
	this.beautyRenderTarget.texture.magFilter = THREE.NearestFilter;
	this.beautyRenderTarget.texture.generateMipmaps = false;
	this.beautyRenderTarget.stencilBuffer = false;
	this.beautyRenderTarget.depthBuffer = false;
	this.beautyRenderTarget.depthTexture = new THREE.DepthTexture();
	this.beautyRenderTarget.depthTexture.type = THREE.UnsignedShortType;

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

	this.lutmaps = new Map();
	//this.lutmaps.set("2strip", THREE.LUT2Strip);
	//this.lutmaps.set("3strip", THREE.LUT3Strip);
	//this.lutmaps.set("70s", THREE.LUT70s);
	//this.lutmaps.set("drive", THREE.LUTDrive);
	//this.lutmaps.set("fuji3513", THREE.LUTFuji3513);
	//this.lutmaps.set("grit", THREE.LUTGrit);
	//this.lutmaps.set("kodak2393", THREE.LUTKodak2393);
	//this.lutmaps.set("m31", THREE.LUTM31);
	//this.lutmaps.set("madmax", THREE.LUTMadMax);
	//this.lutmaps.set("moonrisekingdom", THREE.LUTMoonriseKingdom);
	//this.lutmaps.set("summer", THREE.LUTSummer);
	//this.lutmaps.set("thriller", THREE.LUTThriller);
	this.lutmaps.set("test", THREE.LUTTest);
	
	this.setMap(lutmap);

	this.originalClearColor = new THREE.Color();
	
	this.basic = new THREE.MeshBasicMaterial();

	this.enabled = true;
	this.needsSwap = false;

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
			renderer.clear();
			renderer.render( this.scene, this.camera );
    	} else {
			renderer.setRenderTarget( writeBuffer );
			renderer.clear();
			renderer.render( this.scene, this.camera );
		}
	},

	setSize: function ( width, height ) {

		this.width = width;
		this.height = height;

		this.beautyRenderTarget.setSize( width, height );

	},

	setMap: function( nlutMap ) {
		let selectedMap = this.lutmaps.get(nlutMap);
		if(selectedMap == undefined)
			console.error("LUTmap " + nlutMap + " does not exist");
		console.log(selectedMap.title);
		this.lutMaterial.uniforms[ 'lutMapSize' ].value = selectedMap.size;
		this.lutMaterial.uniforms[ 'lutMap' ].value = this.lutStringToTexture(selectedMap.map, selectedMap.size);
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
		console.log(texture);
		return texture;
	}

} );