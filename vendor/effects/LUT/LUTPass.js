
THREE.LUTPass = function ( width, height, lutmapIndex ) {

	THREE.Pass.call( this );

	this.width = ( width !== undefined ) ? width : 512;
	this.height = ( height !== undefined ) ? height : 512;
	this.name = "lut";

	this.clear = true;

    this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this.scene = new THREE.Scene();

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

	this.lutTextures = [
		{ name: 'Normal',    	   		size: 32.0,	factor: 0.0, 	url: '../media/LUTMaps/Normal.png' },
		{ name: 'B&WHighContrastOld',	size: 32.0,	factor: 1.0, 	url: '../media/LUTMaps/B&WHighContrastOld.png' },
		{ name: 'BleachBypass',   		size: 32.0,	factor: 0.2, 	url: '../media/LUTMaps/BleachBypass.png' },
		{ name: 'Blockbuster14',     	size: 32.0,	factor: 0.3, 	url: '../media/LUTMaps/Blockbuster14.png' },
		{ name: 'BlueHue',     	   		size: 32.0,	factor: 0.3, 	url: '../media/LUTMaps/BlueHue.png' },
		{ name: 'Color',     	   		size: 32.0,	factor: 0.4, 	url: '../media/LUTMaps/Color.png' },
		{ name: 'DustyOrange',     	   	size: 32.0,	factor: 0.2, 	url: '../media/LUTMaps/DustyOrange.png' },
		{ name: 'Exposure',     	   	size: 32.0,	factor: 0.3, 	url: '../media/LUTMaps/Exposure.png' },
		{ name: 'F2AA3',     	   		size: 32.0,	factor: 0.3, 	url: '../media/LUTMaps/F2AA3.png' },
		{ name: 'GamebobAC',     	   	size: 32.0,	factor: 1.0, 	url: '../media/LUTMaps/GamebobAC.png' },
		{ name: 'Invert',     	   		size: 32.0,	factor: 1.0, 	url: '../media/LUTMaps/Invert.png' },
		{ name: 'Mask',     	   		size: 32.0,	factor: 1.0, 	url: '../media/LUTMaps/Mask.png' },
		{ name: 'Max2',     	   		size: 32.0,	factor: 0.3, 	url: '../media/LUTMaps/Max2.png' },
		{ name: 'RedDawn',     	   		size: 32.0,	factor: 0.4, 	url: '../media/LUTMaps/RedDawn.png' },
		{ name: 'RobotAction',     	   	size: 32.0,	factor: 0.2, 	url: '../media/LUTMaps/RobotAction.png' },
		{ name: 'SettingSun',     	   	size: 32.0,	factor: 0.3, 	url: '../media/LUTMaps/SettingSun.png' },
		{ name: 'SharpWasteland',     	size: 32.0,	factor: 0.2, 	url: '../media/LUTMaps/SharpWasteland.png' },
		{ name: 'Stock5',     	   		size: 32.0,	factor: 0.4, 	url: '../media/LUTMaps/Stock5.png' },
		{ name: 'Toxic',     	   		size: 32.0,	factor: 0.3, 	url: '../media/LUTMaps/Toxic.png' },
		{ name: 'Underwater',     	   	size: 32.0,	factor: 0.3, 	url: '../media/LUTMaps/Underwater.png' },
		{ name: 'Vibrance',     	   	size: 32.0,	factor: 0.3, 	url: '../media/LUTMaps/Vibrance.png' },
		{ name: 'Vibrance2',     	   	size: 32.0,	factor: 0.3, 	url: '../media/LUTMaps/Vibrance2.png' },
		{ name: 'Vintage11',     	   	size: 32.0,	factor: 0.4, 	url: '../media/LUTMaps/Vintage11.png' },
		{ name: 'WarmPurple',     	   	size: 32.0,	factor: 0.3, 	url: '../media/LUTMaps/WarmPurple.png' },
	];

	this.lutTextures.forEach((info) => {
		info.filter = undefined;
		info.texture = this.makeLUTTexture(info);
	});	

	this.setMap(lutmapIndex);

	this.originalClearColor = new THREE.Color();
	
	this.basic = new THREE.MeshBasicMaterial();

	this.enabled = true;
	this.needsSwap = false;

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

	},

	setMap: function( lutMapIndex, correction ) {
		this.lutMaterial.uniforms[ 'lutMap' ].value = this.lutTextures[lutMapIndex].texture;
		this.lutMaterial.uniforms[ 'lutMapSize' ].value = this.lutTextures[lutMapIndex].size;
		this.lutMaterial.uniforms[ 'lutFactor' ].value = this.clamp(this.lutTextures[lutMapIndex].factor + correction, 0.0, 1.0);

		console.log("LUT map " + lutMapIndex + ": " + this.lutTextures[lutMapIndex].name);
		console.log("LUT size: " + this.lutMaterial.uniforms[ 'lutMapSize' ].value);
		console.log("LUT factor: " + this.lutMaterial.uniforms[ 'lutFactor' ].value);
	},

	clamp: function(num, min, max) {
		return num <= min ? min : num >= max ? max : num;
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
		  texture.flipY = true;
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