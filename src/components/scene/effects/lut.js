/* global THREE */
var registerEffect = require('../../../core/effect').registerEffect;

require('../../../../vendor/effects/Utility/CopyShader');
require('../../../../vendor/effects/Utility/ShaderPass');
require('../../../../vendor/effects/LUT/LUTPass');
require('../../../../vendor/effects/LUT/LUTShader');

registerEffect('lut', {

  schema: {
    lutmap: {default: 3},
    enabled: {default: true},
    lutCorrection: {default: 0.0},
  },

  initPass: function () {
    this.pass = new THREE.LUTPass(window.innerWidth, window.innerHeight, this.data.lutmap);
  },

  update: function () {
    var pass = this.pass;
    var data = this.data;
    if (!pass) { return; }
    pass.enabled = data.enabled;
    pass.setMap(data.lutmap, data.lutCorrection);
  }

});
