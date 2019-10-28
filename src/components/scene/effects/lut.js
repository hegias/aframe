/* global THREE */
var registerEffect = require('../../../core/effect').registerEffect;

require('../../../../vendor/effects/CopyShader');
require('../../../../vendor/effects/ShaderPass');
require('../../../../vendor/effects/LUTPass');
require('../../../../vendor/effects/LUTShader');

registerEffect('lut', {

  schema: {
    lutmap: {type: 'string', default: 'CineWarm'}
  },

  initPass: function () {
    this.pass = new THREE.LUTPass(window.innerWidth, window.innerHeight, this.data.lutmap);
  },

  update: function () {
    var pass = this.pass;
    if (!pass) { return; }
    pass.setMap(this.data.lutmap);
  },

});
