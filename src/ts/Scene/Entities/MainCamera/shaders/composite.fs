#include <common>
#include <packing>
#include <light>
#include <re>
#include <random>

uniform sampler2D sampler0;
uniform sampler2D sampler1;
uniform sampler2D sampler4;
uniform sampler2D uBloomTexture[4];
uniform sampler2D uLightShaftTexture;
uniform sampler2D uSSRTexture;

uniform vec3 cameraPosition;
uniform float cameraNear;
uniform float cameraFar;

in vec2 vUv;

layout (location = 0) out vec4 outColor;

vec2 lens_distortion(vec2 r, float alpha) {
    return r * (1.0 - alpha * dot(r, r));
}

// https://github.com/dmnsgn/glsl-tone-map/blob/main/filmic.glsl

vec3 filmic(vec3 x) {
  vec3 X = max(vec3(0.0), x - 0.004);
  vec3 result = (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);
  return pow(result, vec3(2.2));
}

void main( void ) {

	vec4 gCol0 = texture( sampler0, vUv );
	vec4 gCol1 = texture( sampler1, vUv );
	vec3 dir = normalize( cameraPosition - gCol0.xyz );
	float f = fresnel( dot( dir, gCol1.xyz ) );

	vec3 col = vec3( 0.0, 0.0, 0.0 );
	vec2 uv = vUv;

	vec2 cuv = uv - 0.5;
	float len = length(cuv);
	float w = 0.035;

	float d;

	#pragma loop_start 8
		d = -float( LOOP_INDEX ) / 8.0 * w;
        col.x += texture( sampler4, (lens_distortion( cuv, d ) * 0.98 + 0.5) + vec2( (float( LOOP_INDEX ) / 8.0 - 0.5 ) * 0.003, 0.0 )).x;
        col.y += texture( sampler4, lens_distortion( cuv, d * 2.0 ) * 0.98 + 0.5 ).y;
        col.z += texture( sampler4, lens_distortion( cuv, d * 3.0) * 0.98 + 0.5 ).z;
	#pragma loop_end
	col.xyz /= 8.0;

	#pragma loop_start 4
		col += texture( uBloomTexture[ LOOP_INDEX ], uv ).xyz * ( 0.5 + float(LOOP_INDEX) * 0.5 ) * 0.2;
	#pragma loop_end

	col *= smoothstep( 0.9, 0.3, len );

	outColor = vec4( col, 1.0 );
	outColor += texture( uLightShaftTexture, vUv ) * 0.3;
	outColor += texture( uSSRTexture, vUv ) * 0.3 * f;

}