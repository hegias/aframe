/* global THREE */
var registerEffect = require('../../../core/effect').registerEffect;

require('../../../../vendor/effects/CopyShader');
require('../../../../vendor/effects/SSAODepthShader');
require('../../../../vendor/effects/SSAOBlurShader');
require('../../../../vendor/effects/ShaderPass');
require('../../../../vendor/effects/SSAOShader');
require('../../../../vendor/effects/SSAOPass');

registerEffect('ssao', {
  schema: {
    kernelRadius: { default: 8 },
    minDistance: { default: 0.005 },
    maxDistance: { default: 0.05 }
  },

  initPass: function () {
    // this.pass = new THREE.SSAOPass(THREE.SSAOPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 8, 0.005, 0.05));
    console.log('[SSAO] initPass');
    this.pass = new THREE.SSAOPass(THREE.SSAOPass(window.innerWidth, window.innerHeight));
  },

  update: function () {
    var pass = this.pass;
    if (!pass) { return; }
    pass.kernelRadius = this.data.kernelRadius;
    pass.minDistance = this.data.minDistance;
    pass.maxDistance = this.data.maxDistance;
  }
});
