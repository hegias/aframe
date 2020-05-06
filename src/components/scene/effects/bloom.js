/* global THREE */
var registerEffect = require('../../../core/effect').registerEffect;

require('../../../../vendor/effects/Utility/CopyShader');
require('../../../../vendor/effects/Utility/ShaderPass');
require('../../../../vendor/effects/Bloom/LuminosityHighPassShader');
require('../../../../vendor/effects/Bloom/UnrealBloomPass');

registerEffect('bloom', {
  schema: {
    strength: {default: 0.6},
    radius: {default: 0.4},
    threshold: {default: 0.6},
    enabled: {default: true}
  },

  initPass: function () {
    this.pass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.4, 0.6);
  },

  update: function () {
    var data = this.data;
    var pass = this.pass;
    if (!pass) { return; }
    pass.strength = data.strength;
    pass.radius = data.radius;
    pass.threshold = data.threshold;
    pass.enabled = data.enabled;
  }
});
