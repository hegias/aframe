/* global THREE */
var registerEffect = require('../../../core/effect').registerEffect;

require('../../../../vendor/effects/CopyShader');
require('../../../../vendor/effects/ShaderPass');
require('../../../../vendor/effects/LUTPass');
require('../../../../vendor/effects/LUTShader');
require('../../../../vendor/effects/MKLUTShader');

registerEffect('lut', {

  schema: {
    lutmap: {default: 0},
    enabled: {default: true}
  },

  initPass: function () {
    this.pass = new THREE.LUTPass(window.innerWidth, window.innerHeight, this.data.lutmap);
  },

  update: function () {
    var pass = this.pass;
    var data = this.data;
    if (!pass) { return; }
    pass.enabled = data.enabled;
    pass.setMap(data.lutmap);
  },

});
