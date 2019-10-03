require('../../vendor/effects/EffectComposer');
require('../../vendor/effects/RenderPass');

var registerComponent = require('./component').registerComponent;
var THREE = require('../lib/three');
var warn = require('../utils/').debug('components:effect:warn');

var lastEffectInitialized;

var effectOrder = ['render', 'aa', 'ssao', 'bloom', 'sepia'/*'color_grading'*/];
var passes = {};

var proto = {
  schema: {},
  init: function () {
    var sceneEl = this.el;

    if (!this.el.isScene) {
      warn('Effect components can only be applied to <a-scene>');
      return;
    }

    if (!sceneEl.camera) {
      sceneEl.addEventListener('camera-set-active', this.init.bind(this));
      return;
    }
    sceneEl.effectComposer || this.initEffectComposer();
    this.initPass();
    this.update();
    lastEffectInitialized.renderToScreen = false;
    this.pass.renderToScreen = true;
    lastEffectInitialized = this.pass;
    passes[this.effectName] = this.pass;
    this.rebuild();
  },

  rebuild: function () {
    var effectComposer = this.el.effectComposer;
    effectComposer.passes = [];
    effectOrder.forEach(function (effect) {
      if (!passes[effect]) { return; }
      effectComposer.addPass(passes[effect]);
      //console.log("[Effects] pass added: " + effect);
    });
  },

  remove: function () {
    this.el.effectComposer.removePass(this.pass);
    passes[this.effectName] = undefined;
  },

  initEffectComposer: function () {
    var sceneEl = this.el;
    var effectComposer = sceneEl.effectComposer = new THREE.EffectComposer(sceneEl.renderer);
    var renderPass = new THREE.RenderPass(sceneEl.object3D, sceneEl.camera);
    effectComposer.addPass(renderPass);
    lastEffectInitialized = renderPass;
    renderPass.renderToScreen = true;
    passes.render = renderPass;
    setTimeout(function () { effectComposer.resize(); }, 0);
    return effectComposer;
  }
};

/**
 * Registers an effect to A-Frame.
 *
 * @param {string} name - Effect name.
 * @param {object} definition - Effect property and methods.
 */
module.exports.registerEffect = function (name, definition) {
  Object.keys(definition).forEach(function (key) {
    proto[key] = definition[key];
  });

  proto.effectName = name;
  //console.log("[Effects] " + name + " registered");
  registerComponent('effect-' + name, proto);
};
