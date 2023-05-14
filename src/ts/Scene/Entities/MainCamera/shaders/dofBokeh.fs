#include <common>

uniform sampler2D sampler1;

in vec2 vUv;

layout (location = 0) out vec4 outColor;

void main( void ) {

	vec4 col = texture( sampler1, vUv );
	outColor = vec4( col.xyz, 1.0 );

}