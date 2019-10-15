/* global THREE */
var registerEffect = require('../../../core/effect').registerEffect;

require('../../../../vendor/effects/CopyShader');
require('../../../../vendor/effects/ShaderPass');
require('../../../../vendor/effects/LUTPass');
require('../../../../vendor/effects/LUTShader');

registerEffect('lut', {

  initPass: function () {
    this.pass = new THREE.LUTPass(window.innerWidth, window.innerHeight);
  },

  update: function () {

    var pass = this.pass;
    if (!pass) { return; }
  }

});
