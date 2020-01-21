/* global THREE */
var registerEffect = require('../../../core/effect').registerEffect;

require('../../../../vendor/effects/CopyShader');
require('../../../../vendor/effects/ShaderPass');
require('../../../../vendor/effects/LUTPass');
require('../../../../vendor/effects/LUTShader');
require('../../../../vendor/effects/LUTMaps/LUTBasic');
require('../../../../vendor/effects/LUTMaps/LUTBright');
require('../../../../vendor/effects/LUTMaps/LUTCold');
require('../../../../vendor/effects/LUTMaps/LUTDrama');
require('../../../../vendor/effects/LUTMaps/LUTTealOrange1');
require('../../../../vendor/effects/LUTMaps/LUTTealOrange2');
require('../../../../vendor/effects/LUTMaps/LUTVibrant');
require('../../../../vendor/effects/LUTMaps/LUTWarm');

registerEffect('lut', {

  schema: {
    lutmap: {type: 'string', default: 'basic'},
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
