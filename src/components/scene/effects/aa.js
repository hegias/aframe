/* global THREE */
var registerEffect = require('../../../core/effect').registerEffect;

require('../../../../vendor/effects/CopyShader');
require('../../../../vendor/effects/ShaderPass');
require('../../../../vendor/effects/FXAAShader');
require('../../../../vendor/effects/SMAABlendShader');
require('../../../../vendor/effects/SMAAWeightsShader');
require('../../../../vendor/effects/SMAAEdgesShader');
require('../../../../vendor/effects/AAPass');

registerEffect('aa', {
  schema: {
    mode: {default: "fxaa"}
  },

  initPass: function () {
    this.pass = new THREE.AAPass(window.innerWidth, window.innerHeight, this.data.mode);
    this.update();
  },

  update: function () {
    var data = this.data;
    var pass = this.pass;
    if (!pass) { return; }
    pass.setMode(data.mode);
  }
});