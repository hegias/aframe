/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.EffectComposer = function ( renderer, renderTarget ) {

  this.renderer = renderer;
  window.addEventListener( 'vrdisplaypresentchange' , this.resize.bind(this) );
  window.addEventListener( 'resize' , this.resize.bind(this) );

  if ( renderTarget === undefined ) {

    var parameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false
    };

    var size = new THREE.Vector2();
    renderer.getDrawingBufferSize(size);
    renderTarget = new THREE.WebGLRenderTarget( size.width, size.height, parameters );
    renderTarget.texture.name = 'EffectComposer.rt1';

  }

  this.renderTarget1 = renderTarget;
  this.renderTarget1.depthBuffer = true;
  this.renderTarget1.depthTexture = new THREE.DepthTexture();
  this.renderTarget2 = renderTarget.clone();
  this.renderTarget2.depthBuffer = true;
  this.renderTarget2.depthTexture = new THREE.DepthTexture();
  this.renderTarget2.texture.name = 'EffectComposer.rt2';

  
  this.bloomRenderTarget = renderTarget.clone();
  this.lutRenderTarget  = renderTarget.clone();

  this.writeBuffer = this.renderTarget1;
  this.readBuffer = this.renderTarget2;

  this.passes = [];
  this.maskActive = false;

  // dependencies

  if ( THREE.CopyShader === undefined ) {

    console.error( 'THREE.EffectComposer relies on THREE.CopyShader' );

  }

  if ( THREE.ShaderPass === undefined ) {

    console.error( 'THREE.EffectComposer relies on THREE.ShaderPass' );

  }

  this.copyPass = new THREE.ShaderPass( THREE.CopyShader );

  
  this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
  this.scene = new THREE.Scene();

  this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
  this.quad.frustumCulled = false; // Avoid getting clipped
  this.scene.add( this.quad );

};

Object.assign( THREE.EffectComposer.prototype, {

  swapBuffers: function ( pass ) {

    if ( pass.needsSwap ) {

      if ( this.maskActive ) {

        var context = this.renderer.context;

        context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );

        this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, delta );

        context.stencilFunc( context.EQUAL, 1, 0xffffffff );

      }

      var tmp = this.readBuffer;
      this.readBuffer = this.writeBuffer;
      this.writeBuffer = tmp;

    }

    if ( THREE.MaskPass !== undefined ) {

      if ( pass instanceof THREE.MaskPass ) {

        this.maskActive = true;

      } else if ( pass instanceof THREE.ClearMaskPass ) {

        this.maskActive = false;

      }

    }

  },

  addPass: function ( pass ) {

    // Makes certain that only the last added pass will be rendered to screen
    this.passes.forEach(function (iteratePass) {
      if (iteratePass == null) { return; }
      iteratePass.needsSwap = true;
    });
    
    // Makes certain that only the last added pass will be rendered to screen
    this.passes.forEach(function (iteratePass) {
      if (iteratePass == null) { return; }
      iteratePass.renderToScreen = false;
    });
    
    pass.renderToScreen = true;
    pass.needsSwap = false;

    this.passes.push( pass );

    var size = new THREE.Vector2();
    this.renderer.getDrawingBufferSize(size);
    pass.setSize( size.width, size.height );

  },

  removePass: function ( pass ) {

    var index = this.passes.indexOf(pass);

    if ( index === -1 ) { return; }

    this.passes.splice( this.passes.indexOf(pass), 1 );

    this.passes[this.passes.length - 1].renderToScreen = true;

    this.resize();

  },

  insertPass: function ( pass, index ) {

    this.passes.splice( index, 0, pass );

  },

  render: function ( delta, starti ) {

    var maskActive = this.maskActive;

    var pass, i, il = this.passes.length;

    var scope = this;

    var currentOnAfterRender;

    for ( i = starti || 0; i < il; i ++ ) {

      pass = this.passes[ i ];
      
      if ( pass.enabled === false ) continue;

      // If VR mode is enabled and rendering the whole scene is required.
      // The pass renders the scene and and postprocessing is resumed before
      // submitting the frame to the headset by using the onAfterRender callback.
      if ( this.renderer.vr.enabled && pass.scene ) {

        currentOnAfterRender = pass.scene.onAfterRender;

        pass.scene.onAfterRender = function () {

          // Disable stereo rendering when doing postprocessing
          // on a render target.
          scope.renderer.vr.enabled = false;

          scope.render( delta, i + 1, maskActive );

          // Renable vr mode.
          scope.renderer.vr.enabled = true;
        }

        pass.render( this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive );
        
        // Restore onAfterRender
        pass.scene.onAfterRender = currentOnAfterRender;

        this.swapBuffers( pass );

        return;
      }

      pass.render( this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive );

      this.swapBuffers(pass);

    }

  },

  reset: function ( renderTarget ) {

    if ( renderTarget === undefined ) {

      var size = new THREE.Vector2();
      this.renderer.getDrawingBufferSize(size);

      renderTarget = this.renderTarget1.clone();
      renderTarget.setSize( size.width, size.height );

    }

    this.renderTarget1.dispose();
    this.renderTarget2.dispose();
    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();

    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;

  },

  setSize: function ( width, height ) {

    this.renderTarget1.setSize( width, height );
    this.renderTarget2.setSize( width, height );

    for ( var i = 0; i < this.passes.length; i ++ ) {

      this.passes[ i ].setSize( width, height );

    }

  },

  resize: function ( ) {

    var size = new THREE.Vector2();
    this.renderer.getDrawingBufferSize(size);
    this.setSize( size.width, size.height );

  },

} );


THREE.Pass = function () {

  // if set to true, the pass is processed by the composer
  this.enabled = true;

  // if set to true, the pass indicates to swap read and write buffer after rendering
  this.needsSwap = true;

  // if set to true, the pass clears its buffer before rendering
  this.clear = false;

  // if set to true, the result of the pass is rendered to screen
  this.renderToScreen = false;

};

Object.assign( THREE.Pass.prototype, {

  setSize: function ( width, height ) {},

  render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

    console.error( 'THREE.Pass: .render() must be implemented in derived pass.' );

  }

} );
