#include <common>

uniform sampler2D sampler0;
uniform vec4 uParams;
uniform float uTime;
uniform mat4 projectionMatrixInverse;

in vec2 vUv;

layout (location = 0) out vec4 outColor;

void main( void ) {

	vec4 col = texture( sampler0, vUv );
	outColor = vec4( col.xyz, 1.0 );

	vec4 depth = projectionMatrixInverse * vec4( vUv * 2.0 - 1.0, texture( sampler0, vUv ).x * 2.0 - 1.0, 1.0 );
	depth.xyz /= depth.w * - 1.0;

    float coc = ( depth.z - (uParams.x + sin( uTime ) * 5.0) ) / depth.z;
	coc = clamp( coc, - uParams.y, uParams.y );

    outColor = vec4( coc );

}