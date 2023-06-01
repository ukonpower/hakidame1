#include <common>
#include <packing>
#include <frag_h>

#include <sdf>
#include <noise>
#include <rotate>

uniform vec3 cameraPosition;
uniform mat4 modelMatrixInverse;
uniform float uTime;
uniform float uTimeSeq;

vec2 D( vec3 p ) {

	float n = fbm(p * 1.0 + fbm3(p * 1.0 + uTime * 0.03) * 10.0) * 0.5 + 0.5;
	p.y -= n * 0.005;

	vec2 d = vec2( sdBox( p, vec3( 1.0 ) ), 1.0 );

	return d;

}

vec3 N( vec3 pos, float delta ){

    return normalize( vec3(
		D( pos ).x - D( vec3( pos.x - delta, pos.y, pos.z ) ).x,
		D( pos ).x - D( vec3( pos.x, pos.y - delta, pos.z ) ).x,
		D( pos ).x - D( vec3( pos.x, pos.y, pos.z - delta ) ).x
	) );
	
}

void main( void ) {

	#include <frag_in>

	vec3 rayPos = ( modelMatrixInverse * vec4( vPos, 1.0 ) ).xyz;
	vec3 rayDir = normalize( ( modelMatrixInverse * vec4( normalize( vPos - cameraPosition ), 0.0 ) ).xyz );
	vec2 dist = vec2( 0.0 );
	bool hit = false;

	vec3 normal;
	
	for( int i = 0; i < 16; i++ ) { 

		dist = D( rayPos );		
		rayPos += dist.x * rayDir;

		if( dist.x < 0.01 ) {

			normal = N( rayPos, 0.0001 );

			hit = true;
			break;

		}

		if( dist.x < -1.0 ) break;
		
	}

	if( !hit ) discard;

	// if( dist.y == 1.0 ) {
		
		outRoughness = 0.2;
		outMetalic = 0.0;

		outColor.xyz = vec3( 1.0, 1.0, 1.0 );
		
	// }
		
	outNormal = normalize(modelMatrix * vec4( normal, 0.0 )).xyz;
	outPos = ( modelMatrix * vec4( rayPos, 1.0 ) ).xyz;

	#include <frag_out>

}