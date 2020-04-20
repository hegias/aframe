/* global THREE */
var registerEffect = require('../../../core/effect').registerEffect;

require('../../../../vendor/effects/Utility/CopyShader');
require('../../../../vendor/effects/Utility/ShaderPass');
require('../../../../vendor/effects/AA/FXAAShader');
require('../../../../vendor/effects/AA/SMAABlendShader');
require('../../../../vendor/effects/AA/SMAAWeightsShader');
require('../../../../vendor/effects/AA/SMAAEdgesShader');
require('../../../../vendor/effects/AA/AAPass');

registerEffect('aa', {
  schema: {
    mode: {default: 'fxaa'}
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
