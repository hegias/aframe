/* global THREE */
var registerEffect = require('../../../core/effect').registerEffect;

require('../../../../vendor/effects/CopyShader');
require('../../../../vendor/effects/ShaderPass');
require('../../../../vendor/effects/LUTPass');
require('../../../../vendor/effects/LUTShader');
/*require('../../../../vendor/effects/LUTMaps/LUT2Strip');
require('../../../../vendor/effects/LUTMaps/LUT3Strip');
require('../../../../vendor/effects/LUTMaps/LUT70s');
require('../../../../vendor/effects/LUTMaps/LUTDrive');
require('../../../../vendor/effects/LUTMaps/LUTFuji3513');
require('../../../../vendor/effects/LUTMaps/LUTGrit');
require('../../../../vendor/effects/LUTMaps/LUTKodak2393');
*/require('../../../../vendor/effects/LUTMaps/LUTM31');/*
require('../../../../vendor/effects/LUTMaps/LUTMadMax');
require('../../../../vendor/effects/LUTMaps/LUTMoonriseKingdom');
require('../../../../vendor/effects/LUTMaps/LUTSummer');
require('../../../../vendor/effects/LUTMaps/LUTThriller');*/
require('../../../../vendor/effects/LUTMaps/LUTTest');

registerEffect('lut', {

  schema: {
    lutmap: {type: 'string', default: 'm31'},
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
