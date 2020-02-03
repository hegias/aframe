
THREE.LUTPass = function ( width, height, lutmapIndex ) {

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

	if ( THREE.MKLUTShader === undefined ) {

		console.error( 'THREE.LUTPass: The pass relies on LUTShader.' );

	}

	this.lutMaterial = new THREE.ShaderMaterial( {
		defines: Object.assign( {}, THREE.MKLUTShader.defines ),
		uniforms: THREE.UniformsUtils.clone( THREE.MKLUTShader.uniforms ),
		vertexShader: THREE.MKLUTShader.vertexShader,
		fragmentShader: THREE.MKLUTShader.fragmentShader,
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

	this.lutTextures = [
		{ name: 'identity',        size: 2.0},
		{ name: 'monochrome',      size: 8.0,	url: '../../../vendor/effects/LUTMaps/monochrome.png' },
		{ name: 'sepia',           size: 8.0,	url: '../../../vendor/effects/LUTMaps/sepia.png' },
		{ name: 'saturated',       size: 8.0,	url: '../../../vendor/effects/LUTMaps/saturated.png', },
		{ name: 'posterize-3-rgb', size: 8.0,	url: '../../../vendor/effects/LUTMaps/posterize-3-rgb.png', },
		{ name: 'posterize-3-lab', size: 8.0,	url: '../../../vendor/effects/LUTMaps/posterize-3-lab.png', },
		{ name: 'posterize-4-lab', size: 8.0,	url: '../../../vendor/effects/LUTMaps/posterize-4-lab.png', },
		{ name: 'inverse',         size: 8.0,	url: '../../../vendor/effects/LUTMaps/inverse.png', },
		{ name: 'color negative',  size: 8.0,	url: '../../../vendor/effects/LUTMaps/color-negative.png', },
		{ name: 'high contrast',   size: 8.0,	url: '../../../vendor/effects/LUTMaps/high-contrast-bw.png', },
		{ name: 'funky contrast',  size: 8.0,	url: '../../../vendor/effects/LUTMaps/funky-contrast.png', },
		{ name: 'nightvision',     size: 8.0,	url: '../../../vendor/effects/LUTMaps/nightvision.png', },
		{ name: 'thermal',         size: 8.0,	url: '../../../vendor/effects/LUTMaps/thermal.png', },
		{ name: 'b/w',             size: 8.0,	url: '../../../vendor/effects/LUTMaps/black-white.png', },
		{ name: 'hue +60',         size: 8.0,	url: '../../../vendor/effects/LUTMaps/hue-plus-60.png', },
		{ name: 'hue +180',        size: 8.0,	url: '../../../vendor/effects/LUTMaps/hue-plus-180.png', },
		{ name: 'hue -60',         size: 8.0,	url: '../../../vendor/effects/LUTMaps/hue-minus-60.png', },
		{ name: 'red to cyan',     size: 8.0,	url: '../../../vendor/effects/LUTMaps/red-to-cyan.png' },
		{ name: 'blues',           size: 8.0,	url: '../../../vendor/effects/LUTMaps/blues.png' },
		{ name: 'infrared',        size: 8.0,	url: '../../../vendor/effects/LUTMaps/infrared.png' },
		{ name: 'radioactive',     size: 8.0,	url: '../../../vendor/effects/LUTMaps/radioactive.png' },
		{ name: 'goolgey',         size: 8.0,	url: '../../../vendor/effects/LUTMaps/googley.png' },
		{ name: 'bgy',             size: 8.0,	url: '../../../vendor/effects/LUTMaps/bgy.png' },
	];

	this.lutTextures.forEach((info) => {
		info.filter = undefined;
		info.texture = this.makeLUTTexture(info);
	});	

	console.log(lutmapIndex);
	this.setMap(lutmapIndex);

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

	setMap: function( lutMapIndex ) {
		//let selectedMap = this.lutmaps.get(nlutMap);
		//if(selectedMap == undefined)
		//	console.error("LUTmap " + nlutMap + " does not exist");
		//console.log(selectedMap.title);
		//this.lutMaterial.uniforms[ 'lutMapSize' ].value = selectedMap.size;
		//this.lutMaterial.uniforms[ 'lutMap' ].value = this.lutStringToTexture(selectedMap.map, selectedMap.size);
		console.log(this.lutTextures[lutMapIndex].name);
		this.lutMaterial.uniforms[ 'lutMap' ].value = this.lutTextures[lutMapIndex].texture;
		this.lutMaterial.uniforms[ 'lutMapSize' ].value = this.lutTextures[lutMapIndex].size;
		console.log(this.lutMaterial.uniforms[ 'lutMapSize' ].value);
	},

	makeIdentityLutTexture: function() {
		const identityLUT = new Uint8Array([
			0,   0,   0, 255,  // black
		  255,   0,   0, 255,  // red
			0,   0, 255, 255,  // blue
		  255,   0, 255, 255,  // magenta
			0, 255,   0, 255,  // green
		  255, 255,   0, 255,  // yellow
			0, 255, 255, 255,  // cyan
		  255, 255, 255, 255,  // white
		]);
	
		return function(filter) {
		  const texture = new THREE.DataTexture(identityLUT, 4, 2, THREE.RGBAFormat);
		  texture.minFilter = filter;
		  texture.magFilter = filter;
		  texture.needsUpdate = true;
		  texture.flipY = false;
		  return texture;
		};
	  }(),

	makeLUTTexture: function() {
		const imgLoader = new THREE.ImageLoader();
		const ctx = document.createElement('canvas').getContext('2d');
	   
		return function(info) {
		  const texture = this.makeIdentityLutTexture(
		  info.filter ? THREE.LinearFilter : THREE.NearestFilter);
	   
		  if (info.url) {
			const lutSize = info.size;
	   
			// set the size to 2 (the identity size). We'll restore it when the
			// image has loaded. This way the code using the lut doesn't have to
			// care if the image has loaded or not
			info.size = 2;
	   
			imgLoader.load(info.url, function(image) {
			  const width = lutSize * lutSize;
			  const height = lutSize;
			  info.size = lutSize;
			  ctx.canvas.width = width;
			  ctx.canvas.height = height;
			  ctx.drawImage(image, 0, 0);
			  const imageData = ctx.getImageData(0, 0, width, height);

			  texture.image.data = new Uint8Array(imageData.data.buffer);
			  texture.image.width = width;
			  texture.image.height = height;
			  texture.needsUpdate = true;
			});
		  }
	   
		  return texture;
		};
	}(),

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