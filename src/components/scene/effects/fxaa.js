/* global THREE */
var registerEffect = require('../../../core/effect').registerEffect;

require('../../../../vendor/effects/CopyShader');
require('../../../../vendor/effects/ShaderPass');
require('../../../../vendor/effects/FXAAShader');

registerEffect('fxaa', {
  initPass: function () {
    this.pass = new THREE.ShaderPass(THREE.FXAAShader);
    this.update();
  },

  update: function () {
    if (!this.pass) { return; }
    this.pass.uniforms.resolution.value = new THREE.Vector2(1/window.innerWidth, 1/window.innerHeight);
  }
});