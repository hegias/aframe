THREE.LUTShader = {

    uniforms:
    {
        tDiffuse:   { value: null },
        lutMap:     { value: null },
        lutMapSize: { value: 8.0  },
        lutFactor:  { value: 1.0  },
    },

    // depthWrite: false,
		// depthTest: false,

    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,

    fragmentShader: `
    #include <common>

    uniform sampler2D tDiffuse;
    uniform sampler2D lutMap;
    uniform float lutMapSize;
    uniform float lutFactor;

    varying vec2 vUv;

    vec4 mixFixed(vec4 v1, vec4 v2, float a )
    {
      vec4 result;
      result.x = v1.x * v1.x * (1.0 - a) + v2.x * v2.x * a;
      result.y = v1.y * v1.y  * (1.0 - a) + v2.y * v2.y * a;
      result.z = v1.z * v1.z  * (1.0 - a) + v2.z * v2.z * a;
      result.w = v1.w * v1.w  * (1.0 - a) + v2.w * v2.w * a;

      result.x = sqrt(result.x);
      result.y = sqrt(result.y);
      result.z = sqrt(result.z);
      result.w = sqrt(result.w);
   
      return result;
    }

    vec4 sampleAs3DTexture(sampler2D tex, vec3 texCoord, float size)
    {
      float sliceSize = 1.0 / size;                  // space of 1 slice
      float slicePixelSize = sliceSize / size;       // space of 1 pixel
      float width = size - 1.0;
      float sliceInnerSize = slicePixelSize * width; // space of size pixels
      float zSlice0 = floor( texCoord.z * width);
      float zSlice1 = min( zSlice0 + 1.0, width);
      float xOffset = slicePixelSize * 0.5 + texCoord.x * sliceInnerSize;
      float yRange = (texCoord.y * width + 0.5) / size;
      float s0 = xOffset + (zSlice0 * sliceSize);

      
      float s1 = xOffset + (zSlice1 * sliceSize);
      vec4 slice0Color = texture2D(tex, vec2(s0, yRange));
      vec4 slice1Color = texture2D(tex, vec2(s1, yRange));
      float zOffset = mod(texCoord.z * width, 1.0);
      return mixFixed(slice0Color, slice1Color, zOffset);
      
      //return texture2D(tex, vec2( s0, yRange));
      
    }

    void main() {
      vec4 originalColor = texture2D(tDiffuse, vUv);
      vec4 lutColor = sampleAs3DTexture(lutMap, originalColor.xyz, lutMapSize); 
      gl_FragColor = mix(originalColor, lutColor, lutFactor);
      gl_FragColor.a = originalColor.a;
    }
  `,
}