#include <common>
#include <random>

uniform float uTime;
uniform sampler2D sampler0;
uniform sampler2D sampler1;
uniform vec4 uParams;

in vec2 vUv;

layout (location = 0) out vec4 outColor;

// #define BOKEH_SAMPLE 16
// vec2 poissonDisk[ BOKEH_SAMPLE ];

#define BOKEH_SAMPLE 43
vec2 poissonDisk[ BOKEH_SAMPLE ] = vec2[](
    vec2(0,0),
    vec2(0.36363637,0),
    vec2(0.22672357,0.28430238),
    vec2(-0.08091671,0.35451925),
    vec2(-0.32762504,0.15777594),
    vec2(-0.32762504,-0.15777591),
    vec2(-0.08091656,-0.35451928),
    vec2(0.22672352,-0.2843024),
    vec2(0.6818182,0),
    vec2(0.614297,0.29582983),
    vec2(0.42510667,0.5330669),
    vec2(0.15171885,0.6647236),
    vec2(-0.15171883,0.6647236),
    vec2(-0.4251068,0.53306687),
    vec2(-0.614297,0.29582986),
    vec2(-0.6818182,0),
    vec2(-0.614297,-0.29582983),
    vec2(-0.42510656,-0.53306705),
    vec2(-0.15171856,-0.66472363),
    vec2(0.1517192,-0.6647235),
    vec2(0.4251066,-0.53306705),
    vec2(0.614297,-0.29582983),
    vec2(1,0),
    vec2(0.9555728,0.2947552),
    vec2(0.82623875,0.5633201),
    vec2(0.6234898,0.7818315),
    vec2(0.36534098,0.93087375),
    vec2(0.07473,0.9972038),
    vec2(-0.22252095,0.9749279),
    vec2(-0.50000006,0.8660254),
    vec2(-0.73305196,0.6801727),
    vec2(-0.90096885,0.43388382),
    vec2(-0.98883086,0.14904208),
    vec2(-0.9888308,-0.14904249),
    vec2(-0.90096885,-0.43388376),
    vec2(-0.73305184,-0.6801728),
    vec2(-0.4999999,-0.86602545),
    vec2(-0.222521,-0.9749279),
    vec2(0.07473029,-0.99720377),
    vec2(0.36534148,-0.9308736),
    vec2(0.6234897,-0.7818316),
    vec2(0.8262388,-0.56332),
    vec2(0.9555729,-0.29475483)
);

void initPoissonDisk( float seed ) {

	float r = 0.5;
	float rStep = (r) / float( BOKEH_SAMPLE );

	float ang = 0.0;//random( gl_FragCoord.xy * 0.01 + sin( seed ) ) * TPI * 1.0;
	float angStep = ( ( TPI * 17.0 ) / float( BOKEH_SAMPLE ) );
	
	for( int i = 0; i < BOKEH_SAMPLE; i++ ) {

		poissonDisk[ i ] = vec2(
			sin( ang ),
			cos( ang )
		) * pow( r, 0.5 );

		r += rStep;
		ang += angStep;
	}
	
}


void main( void ) {

	vec2 size = vec2( textureSize(sampler1, 0) );
	vec2 texelSize = 1.0 / size;
	float aspect = size.x / size.y;

	vec3 col = texture( sampler0, vUv ).xyz;
	vec4 coc = texture( sampler1, vUv );

	vec4 bgColor = vec4( 0.0 );
	vec4 fgColor = vec4( 0.0 );

	for( int i = 0; i < BOKEH_SAMPLE; i ++  ) {
			
		vec2 offset = poissonDisk[ i ] * uParams.y;
		offset.y *= aspect;
		float radius = length( offset );
		vec4 offCoc = texture( sampler1, vUv + offset * 0.12 );

		float farCoc = max( 0.0, min( coc.w, offCoc.w ) );
		float nearCoc = -offCoc.w;

		float bgWeight = clamp( farCoc - radius, 0.0, 1.0 );
		bgColor += vec4( offCoc.xyz, 1.0 ) * bgWeight;
		
		float fgWeight = clamp( nearCoc - radius, 0.0, 1.0 );
		fgColor += vec4( offCoc.xyz, 1.0 ) * fgWeight;
		
	}

	if( bgColor.w == 0.0 ) {

		bgColor += vec4( col.xyz, 1.0 );
		
	}

	// if( fgColor.w == 0.0 ) {

		// fgColor += vec4( col.xyz, 1.0 );
		
	// }
	
	bgColor.xyz /= bgColor.w + ( bgColor.w == 0.0 ? 1.0 : 0.0 );
	fgColor.xyz /= fgColor.w + ( fgColor.w == 0.0 ? 1.0 : 0.0 );

	col = mix( bgColor.xyz, fgColor.xyz, fgColor.w );

	outColor = vec4( col, 1.0 );
	// outColor = vec4( vec3( abs( fgColor.w ) * 1.0 ), 1.0 );
	// outColor = vec4( fgColor.xyz, 1.0 );

}