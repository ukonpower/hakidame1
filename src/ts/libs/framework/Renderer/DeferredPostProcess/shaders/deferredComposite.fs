#include <common>
#include <packing>
#include <light>
#include <re>

uniform sampler2D sampler0;
uniform sampler2D sampler1;
uniform sampler2D sampler2;
uniform sampler2D sampler3;
uniform sampler2D sampler4;

uniform sampler2D uLightShaftTexture;
uniform sampler2D uSSRTexture;
uniform vec3 cameraPosition;
uniform mat4 viewMatrix;

in vec2 vUv;

layout (location = 0) out vec4 outColor;

void main( void ) {

	vec4 gCol1 = texture( sampler1, vUv );
	vec4 gCol2 = texture( sampler2, vUv );
	vec3 dir = normalize(  cameraPosition - texture( sampler0, vUv ).xyz );

	float d = dot( dir, gCol1.xyz );
	float f = fresnel( d );
	
	vec3 col = texture(sampler4, vUv).xyz;
	col += texture( uLightShaftTexture, vUv ).xyz * 0.3;
	col += texture( uSSRTexture, vUv ).xyz * gCol2.xyz * 0.3 * f;

	outColor = vec4( col, 1.0 );

}