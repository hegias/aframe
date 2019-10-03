THREE.SSAOPass = function (resolution, kernelRadius, minDistance, maxDistance) {

    THREE.Pass.call(this);

    this.kernelRadius = kernelRadius;
    this.minDistance = minDistance;
    this.maxDistance = maxDistance;
    this.resolution = (resolution !== undefined) ? new THREE.Vector2(resolution.x, resolution.y) : new THREE.Vector2(256, 256);

    // Render targets resolution
    var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
    this.renderTargetsHorizontal = [];
    this.renderTargetsVertical = [];
    this.nMips = 5;
    var resx = Math.round(this.resolution.x / 2);
    var resy = Math.round(this.resolution.y / 2);

    // Render targets for depth pass and ao pass
    this.renderTargetDepth = new THREE.WebGLRenderTarget(resx, resy, pars);
    //this.renderTargetAO = new THREE.WebGLRenderTarget( resx, resy, pars );

    // Depth
    var depthShader = THREE.SSAODepthShader;
    this.depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);
    this.depthMaterial = new THREE.ShaderMaterial({ fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: this.depthUniforms });

    // SSAO
    var ssaoShader = THREE.SSAOShader;
    this.ssaoUniforms = THREE.UniformsUtils.clone(ssaoShader.uniforms);
    this.ssaoMaterial = new THREE.ShaderMaterial({ fragmentShader: ssaoShader.fragmentShader, vertexShader: ssaoShader.vertexShader, uniforms: this.ssaoUniforms });

    // Copy material
    if (THREE.CopyShader === undefined) {

        console.error("THREE.SSAOPass relies on THREE.CopyShader");

    }

    var copyShader = THREE.CopyShader;

    this.copyUniforms = THREE.UniformsUtils.clone(copyShader.uniforms);
    this.copyUniforms["opacity"].value = 1.0;

    this.materialCopy = new THREE.ShaderMaterial({
        uniforms: this.copyUniforms,
        vertexShader: copyShader.vertexShader,
        fragmentShader: copyShader.fragmentShader,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        transparent: true
    });

    this.enabled = true;
    this.needsSwap = false;

    this.oldClearColor = new THREE.Color();
    this.oldClearAlpha = 1;

    this.camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    this.scene = new THREE.Scene();

    this.basic = new THREE.MeshBasicMaterial();

    this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
    this.quad.frustumCulled = false; // Avoid getting clipped
    this.scene.add(this.quad);

    THREE.SSAOPass.prototype = Object.assign(Object.create(THREE.Pass.prototype), {

        constructor: THREE.SSAOPass,

        render: function (renderer, writeBuffer, readBuffer, delta, maskActive) {

            // console.log("[SSAO] Render function");

            this.oldClearColor.copy(renderer.getClearColor());
            this.oldClearAlpha = renderer.getClearAlpha();
            var oldAutoClear = renderer.autoClear;
            renderer.autoClear = false;

            renderer.setClearColor(new THREE.Color(0, 0, 0), 0);

            if (maskActive) renderer.context.disable(renderer.context.STENCIL_TEST);

            // Render input to screen
            if (this.renderToScreen) {
                this.quad.material = this.basic;
                this.basic.map = readBuffer.texture;
                renderer.render(this.scene, this.camera, undefined, true);
            }

            // Depth pass
            this.depthUniforms[ "tDepth" ].value = readBuffer.texture;
            this.depthUniforms[ "cameraNear" ].value = this.minDistance;
            this.depthUniforms[ "cameraFar" ].value = this.maxDistance;
            this.quad.material = this.depthMaterial;
            renderer.render( this.scene, this.camera, this.renderTargetDepth, true );

            // SSAO

            if ( this.renderToScreen ) {
                renderer.render( this.scene, this.camera, undefined, false );
            } else {
                renderer.render( this.scene, this.camera, readBuffer, false );
            }

            // Restore renderer settings
            renderer.setClearColor(this.oldClearColor, this.oldClearAlpha);
            renderer.autoClear = oldAutoClear;

        },
    });

}