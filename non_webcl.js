// JavaScript Document

/* OpenCL Raytracing Kernel
 * For SE195B Project by:
 *	Cameron Brown
 *  Mark Becker
 */

var tracedepth = 5;
var MAX_RAY_COUNT = 64;

// Intersection method return values
var HIT =  1;		// Ray hit primitive
var MISS =  0;		// Ray missed primitive
var INPRIM = -1;		// Ray started inside primitive

var ORIGIN = 0;
var REFLECTED = 1;
var REFRACTED = 2;

var PLANE = 0;
var SPHERE = 1;

var EPSILON = 0.001;

var X_M_COLOR_0 = 0;
var X_M_COLOR_1 = 1;
var X_M_COLOR_2 = 2;
var X_M_COLOR_3 = 3; //ALWAYS EMPTY
var X_M_REFL = 4 ;
var X_M_DIFF = 5;
var X_M_REFR = 6;
var X_M_REFR_INDEX = 7;
var X_M_SPEC = 8;
var X_DUMMY_3 = 9;
var X_TYPE = 10;
var X_IS_LIGHT = 11;
var X_NORMAL_0 = 12;
var X_NORMAL_1 = 13;
var X_NORMAL_2 = 14;
var X_NORMAL_3 = 15; //ALWAYS EMPTY
var X_CENTER_0 = 16;
var X_CENTER_1 = 17;
var X_CENTER_2 = 18;
var X_CENTER_3 = 19; //ALWAYS EMPTY
var X_DEPTH = 20;
var X_RADIUS = 21;
var X_SQ_RADIUS = 22;
var X_R_RADIUS = 23;	
var ROW_W = 24;	

var prim_list = prim_list_float32View;
var prim_cnt = n_primitives;

function soft_normalize(vec){ //float4 arg, float4 return
	var ret = new Array(vec[0], vec[1], vec[2], 0);
	var s = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
	var l = 1/s;
	ret[0] *= l; 
	ret[1] *= l; 
	ret[2] *= l;
	return ret;
}

function soft_dot(vec_a, vec_b){//float4 arg, float return
	var ret = vec_a[0] * vec_b[0] + vec_a[1] * vec_b[1] + vec_a[2] * vec_b[2];
	return ret;
}

function soft_length(vec){//float4 arg, float return
	var ret = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
	return ret;
}
// ray queue to simulate recursion

//function PUSH_RAY(q, r, c, n){
//	if (c >= MAX_RAY_COUNT)
//		c = 0;
//	q[c++] = r; 
//	n++; 
//}

//function POP_RAY(q, r, c, n) {
//	if (c >= MAX_RAY_COUNT) 
//		c = 0;
//	r = q[c++]; 
//	n--;
//}


//float4 origin; float4 direction; float weight; float depth; int origin_primitive; ray_type type; float r_index; Color transparency;
function Ray(origin, direction, weight, depth, origin_primitive, type, r_index, transparency){
	this.origin = origin;
	this.direction = direction;
	this.weight = weight;
	this.depth = depth;
	this.origin_primitive = origin_primitive;
	this.type = type;
	this.r_index = r_index;
	this.transparency = transparency;
}

// functions
function plane_intersect(prim_index, ray, cumu_distArr ){ // local Primitive * p, Ray * ray, float * cumu_dist 
	var ret = MISS;
	var tempArr = new Array(prim_list[prim_index * ROW_W + X_NORMAL_0], 
							prim_list[prim_index * ROW_W + X_NORMAL_1], 
							prim_list[prim_index * ROW_W + X_NORMAL_2]);
	var d = soft_dot( tempArr, ray.direction);
	if ( d != 0 ){
		var dist = - ( soft_dot( tempArr, ray.origin ) + prim_list[prim_index * ROW_W + X_DEPTH] ) / d;
		if (dist > 0 && dist < cumu_distArr[0]){
			cumu_distArr[0] = dist;
			ret = HIT;
		}
	}
	return ret;
}

function sphere_intersect(prim_index, ray, cumu_distArr ){// local Primitive * p, Ray * ray, float * cumu_dist
	var v = new Array(ray.origin[0] - prim_list[prim_index * ROW_W + X_CENTER_0], 
					  ray.origin[1] - prim_list[prim_index * ROW_W + X_CENTER_1], 
					  ray.origin[2] - prim_list[prim_index * ROW_W + X_CENTER_2]);	
	var b = -soft_dot( v, ray.direction );
	var softV = soft_dot(v, v);
	var det = (b * b) - softV + prim_list[prim_index * ROW_W + X_SQ_RADIUS];
	var retval = MISS;
	if (det > 0){
		det = Math.sqrt(det);
		var i1 = b - det;
		var i2 = b + det;
		if (i2 > 0){
			if (i1 < 0){
				if (i2 < cumu_distArr[0]){
					cumu_distArr[0] = i2;
					retval = INPRIM;
				}
			}else{
				if (i1 < cumu_distArr[0]){
					cumu_distArr[0] = i1;
					retval = HIT;
				}
			}
		}
	}
	return retval;
}

function intersect(prim_index, ray, cumu_distArr ){ // local Primitive * p, Ray * ray, float * cumu_dist	
	var ret = MISS;
	if(prim_list[prim_index * ROW_W + X_TYPE] == 0){
		ret = plane_intersect(prim_index, ray, cumu_distArr);
	}else if(prim_list[prim_index * ROW_W + X_TYPE] == 1){
		ret = sphere_intersect(prim_index, ray, cumu_distArr);	
	}
	return ret;
}

function get_normal(prim_index, point){ //local Primitive * p, float4 point
	var ret = new Array(0, 0, 0, 0);
	if(prim_list[prim_index * ROW_W + X_TYPE]==0.0){
		ret[0] = prim_list[prim_index * ROW_W + X_NORMAL_0];
		ret[1] = prim_list[prim_index * ROW_W + X_NORMAL_1];
		ret[2] = prim_list[prim_index * ROW_W + X_NORMAL_2];
	}else if(prim_list[prim_index * ROW_W + X_TYPE]==1.0){
		ret[0] = (point[0] - prim_list[prim_index * ROW_W + X_CENTER_0]) * prim_list[prim_index * ROW_W + X_R_RADIUS];
		ret[1] = (point[1] - prim_list[prim_index * ROW_W + X_CENTER_1]) * prim_list[prim_index * ROW_W + X_R_RADIUS];
		ret[2] = (point[2] - prim_list[prim_index * ROW_W + X_CENTER_2]) * prim_list[prim_index * ROW_W + X_R_RADIUS];
	}
	return ret;
}

//Ray * a_ray, Color * a_acc, float * a_dist, float4 * point_intersect, int * result, local Primitive * primitives, int n_primitives
function raytrace(a_ray, a_acc, a_distArr, point_intersect, resultArr){
	//a_distArr = new Array();
	a_distArr[0] = 900719925474099.0;
	var prim_index = -1;

	// find nearest intersection
	for ( var s = 0; s < prim_cnt; s++ ){
		var res;
		res = intersect(s, a_ray, a_distArr);
		if (res != MISS){			
			prim_index = s;
			resultArr[0] = res;	
		}	
	}
	// no hit
	if (prim_index == -1) return -1;
	// handle hit
	if (prim_list[prim_index * ROW_W + X_IS_LIGHT] == 1.0){
		a_acc[0] = prim_list[prim_index * ROW_W + X_M_COLOR_0];
		a_acc[1] = prim_list[prim_index * ROW_W + X_M_COLOR_1];
		a_acc[2] = prim_list[prim_index * ROW_W + X_M_COLOR_2];
	}else{	
		point_intersect[0] = a_ray.origin[0] + (a_ray.direction[0] * a_distArr[0]);
		point_intersect[1] = a_ray.origin[1] + (a_ray.direction[1] * a_distArr[0]);
		point_intersect[2] = a_ray.origin[2] + (a_ray.direction[2] * a_distArr[0]);
		// trace lights
		for (var l = 0; l < prim_cnt; l++){
			if (prim_list[l * ROW_W + X_IS_LIGHT] == 1.0)	{
				// point light source shadows
				var shade = 1.0;
				var tempArr = new Array();
				tempArr[0] = prim_list[l * ROW_W + X_CENTER_0] - point_intersect[0];
				tempArr[1] = prim_list[l * ROW_W + X_CENTER_1] - point_intersect[1];
				tempArr[2] = prim_list[l * ROW_W + X_CENTER_2] - point_intersect[2];
				var L_LENArr = new Array();
				L_LENArr[0] = soft_length(tempArr);
				var L = new Array();
				L = soft_normalize(tempArr);
				if (prim_list[l * ROW_W + X_TYPE] == 1.0){
					var tempOrig = new Array(0, 0, 0, 0);
					var tempDir = new Array(0, 0, 0, 0);
					var tempTrans = new Array(0, 0, 0);
					var r = new Ray(tempOrig, tempDir, 0.0, 0.0, 0, 0, 0.0, tempTrans);
					r.origin[0] = point_intersect[0] + L[0] * EPSILON;
					r.origin[1] = point_intersect[1] + L[1] * EPSILON;
					r.origin[2] = point_intersect[2] + L[2] * EPSILON;
					r.direction[0] = L[0];
					r.direction[1] = L[1];
					r.direction[2] = L[2];
					var s = 0;
					while ( s < prim_cnt ){
						if ((s != l) && !(prim_list[s * ROW_W + X_IS_LIGHT] == 1.0) && 
													(intersect(s, r, L_LENArr) != MISS)){
							shade = 0;
						}
						s++;
					}
				}
				// Calculate diffuse shading
				var N = new Array();
				N = get_normal(prim_index, point_intersect);
				if (prim_list[prim_index * ROW_W + X_M_DIFF] > 0){
					var dot_prod = soft_dot( N, L );
					if (dot_prod > 0){
						var diff = dot_prod * prim_list[prim_index * ROW_W + X_M_DIFF] * shade;
						a_acc[0] += diff * prim_list[prim_index * ROW_W + X_M_COLOR_0] * prim_list[l * ROW_W + X_M_COLOR_0];
						a_acc[1] += diff * prim_list[prim_index * ROW_W + X_M_COLOR_1] * prim_list[l * ROW_W + X_M_COLOR_1];
						a_acc[2] += diff * prim_list[prim_index * ROW_W + X_M_COLOR_2] * prim_list[l * ROW_W + X_M_COLOR_2];
					}
				}
				// Calculate specular shading
				if (prim_list[prim_index * ROW_W + X_M_SPEC] > 0){
					var V = new Array(a_ray.direction[0], a_ray.direction[1], a_ray.direction[2]);
					var dot_temp = soft_dot( L, N );
					var R = new Array(L[0] - 1.5 * dot_temp * N[0], L[1] - 1.5 * dot_temp * N[1],	L[2] - 1.5 * dot_temp * N[2]);
					var dot_prod = soft_dot( V, R );
					if (dot_prod > 0){
						var spec = Math.pow( dot_prod, 20 ) * prim_list[prim_index * ROW_W + X_M_SPEC] * shade;
						a_acc[0] += spec * prim_list[l * ROW_W + X_M_COLOR_0];
						a_acc[1] += spec * prim_list[l * ROW_W + X_M_COLOR_1];
						a_acc[2] += spec * prim_list[l * ROW_W + X_M_COLOR_2];
					}
				}
			}
		}
	}	
	return prim_index;
}

function non_webcl_raytracer(x_pos, y_pos, pixels_data, td){
	
	prim_list = prim_list_float32View;
	prim_cnt = n_primitives;
	tracedepth = parseInt(td);
	if(tracedepth < 0){
		tracedepth = 0;
	}else if(tracedepth > 5){		
		tracedepth = 5;
	}
	
	// Determine this thread's pixel
	var x = x_pos;
	var y = y_pos;
	var c = y * screenWidth + x;

	// Out of bounds guard
	if (x >= screenWidth || y >= screenHeight)
		return;
			
	// Our viewport size can be different than the image size. This lets us calculate
	// the stepping within the viewport relative to the stepping within the image.
	// IE with a viewport width of 6.0f and an image width of 800, each pixel is 1/800 of 6.0f 
	// or 0.0075f. 
	// x stepping, left -> right
	var dx = viewport_x / screenWidth;
	// y stepping, top -> bottom
	var dy = -viewport_y / screenHeight; 
	// this pixel's viewport x
	var sx = -(viewport_x / 2.0) + x * dx; 
	// this pixel's viewport y
	var sy = (viewport_y / 2.0) + y * dy; 

	// Initializes the ray queue. OpenCL has no support for recursion, so recursive ray tracing calls
	// were replaced by a queue of rays that is processed in sequence. Since the recursive calls were
	// additive, this works.
	var queue = new Array(); // of Ray objects
	var rays_in_queue = 0;
	var front_ray_ptr = 0;
	var back_ray_ptr = 0;

	var camera = new Array( camera_x, camera_y, camera_z, 0 ); // float4
	var acc = new Array( 0, 0, 0, 0 ); // float4	
	
	// We use 3x supersampling to smooth out the edges in the image. This means each pixel actually
	// fires 9 initial rays, plus the recursion and refraction.
	for (var tx = -1; tx < 2; tx++ ){
		for (var ty = -1; ty < 2; ty++ ){
			// Create initial ray.
			//float4 dir = NORMALIZE( (float4)(sx + dx * (tx / 2.0f), sy + dy * (ty / 2.0f), 0, 0) - camera);
			var dir = new Array();
			dir[0] = (sx + dx * (tx / 2.0)) - camera[0];
			dir[1] = (sy + dy * (ty / 2.0)) - camera[1];
			dir[2] = 0 - camera[2];
			dir[3] = 0;
			var tempDir = soft_normalize(dir);
			//Ray r;
			//r.origin = camera;
			//r.direction = dir;
			//r.weight = 1.0f;
			//r.depth = 0;
			//r.origin_primitive = -1;
			//r.type = ORIGIN;
			//r.r_index = 1.0f;
			//r.transparency = (Color) (1, 1, 1, 0);
			var tempTrans = new Array(1,1,1,0)
			var r = new Ray(camera, tempDir, 1.0, 0, -1, 0, 1.0, tempTrans)
			// Populate queue and start the processing loop.
			//PUSH_RAY(queue, r, back_ray_ptr, rays_in_queue)
			if (back_ray_ptr >= MAX_RAY_COUNT){
				back_ray_ptr = 0;
			}
			queue[back_ray_ptr++] = r; 
			rays_in_queue++;
			
			while (rays_in_queue > 0){
				var distArr = new Array(); // float
				distArr[0] = 0.0;
				//Ray cur_ray;
				var tempOrig = new Array(0,0,0,0);
				var tempDir = new Array(0,0,0,0);
				var tempTrans = new Array(0,0,0,0);
				var cur_ray = new Ray(tempOrig, tempDir, 1.0, 0.0, 0, 0, 1.0, tempTrans);
				//POP_RAY(queue, cur_ray, front_ray_ptr, rays_in_queue)
				if (front_ray_ptr >= MAX_RAY_COUNT){ 
					front_ray_ptr = 0;
				}
				cur_ray = queue[front_ray_ptr++]; 
				rays_in_queue--;
				
				var ray_col = new Array( 0, 0, 0, 0 ); //Color ray_col = (Color)( 0, 0, 0, 0 );
				var point_intersect = new Array( 0, 0, 0, 0 ); //float4 point_intersect;
				var resultArr = new Array();
				resultArr[0] = 0;
				// raytrace performs the actual tracing and returns useful information
				var prim_index = raytrace( cur_ray, ray_col, distArr, point_intersect, resultArr);
				// reflected/refracted rays have different modifiers on the color of the object
				if(cur_ray.type == ORIGIN){ // 0
					acc[0] += ray_col[0] * cur_ray.weight;
					acc[1] += ray_col[1] * cur_ray.weight;
					acc[2] += ray_col[2] * cur_ray.weight;
				}else if(cur_ray.type == REFLECTED){// 1
					acc[0] += ray_col[0] * cur_ray.weight * prim_list[cur_ray.origin_primitive * ROW_W + X_M_COLOR_0] * cur_ray.transparency[0];
					acc[1] += ray_col[1] * cur_ray.weight * prim_list[cur_ray.origin_primitive * ROW_W + X_M_COLOR_1] * cur_ray.transparency[1];
					acc[2] += ray_col[2] * cur_ray.weight * prim_list[cur_ray.origin_primitive * ROW_W + X_M_COLOR_2] * cur_ray.transparency[2];
				}else if(cur_ray.type == REFRACTED){//  2
					acc[0] += ray_col[0] * cur_ray.weight * cur_ray.transparency[0];
					acc[1] += ray_col[1] * cur_ray.weight * cur_ray.transparency[1];
					acc[2] += ray_col[2] * cur_ray.weight * cur_ray.transparency[2];
				}	
				
				// handle reflection & refraction
				if (cur_ray.depth < tracedepth){
					// reflection
					var refl = prim_list[prim_index * ROW_W + X_M_REFL];
					if (refl > 0.0){
						var N = get_normal(prim_index, point_intersect); // float4
						//float4 R = cur_ray.direction - 2.0 * DOT( cur_ray.direction, N ) * N; // float4
						var R = new Array();
						var dotTemp = soft_dot( cur_ray.direction, N );
						R[0] = cur_ray.direction[0] - 2.0 * dotTemp * N[0];
						R[1] = cur_ray.direction[1] - 2.0 * dotTemp * N[1];
						R[2] = cur_ray.direction[2] - 2.0 * dotTemp * N[2];
						
						//Ray new_ray;
						var tempOrig = new Array(0,0,0,0);
						var tempDir = new Array(0,0,0,0);
						var tempTrans = new Array(0,0,0,0);
						var new_ray = new Ray(tempOrig, tempDir, 1.0, 0.0, 0, 0, 1.0, tempTrans);	
						new_ray.origin[0] = point_intersect[0] + R[0] * EPSILON;
						new_ray.origin[1] = point_intersect[1] + R[1] * EPSILON;
						new_ray.origin[2] = point_intersect[2] + R[2] * EPSILON;					
						new_ray.direction = R;				
						new_ray.depth = cur_ray.depth + 1;
						new_ray.weight = refl * cur_ray.weight;
						new_ray.type = REFLECTED;
						new_ray.origin_primitive = prim_index;
						new_ray.r_index = cur_ray.r_index;
						new_ray.transparency = cur_ray.transparency;
						
						//PUSH_RAY(queue, new_ray, back_ray_ptr, rays_in_queue)
						if (back_ray_ptr >= MAX_RAY_COUNT){
							back_ray_ptr = 0;
						}
						queue[back_ray_ptr++] = new_ray;
						rays_in_queue++;
					}
					// refraction
					var refr = prim_list[prim_index * ROW_W + X_M_REFR];
					if (refr > 0.0){
						var m_rindex = prim_list[prim_index * ROW_W + X_M_REFR_INDEX];
						var n = cur_ray.r_index / m_rindex;
						//float4 N = get_normal(&primitives[prim_index], point_intersect) * (float) result;
						var N = get_normal(prim_index, point_intersect);
						N[0] *= resultArr[0];
						N[1] *= resultArr[0];
						N[2] *= resultArr[0];
						var cosI = - soft_dot( N, cur_ray.direction );
						var cosT2 = 1.0 - n * n * (1.0 - cosI * cosI);
						if (cosT2 > 0.0){
							//float4 T = (n * cur_ray.direction) + (n * cosI - SQRT( cosT2 )) * N;
							var T = new Array();
							T[0] = (n * cur_ray.direction[0]) + (n * cosI - Math.sqrt( cosT2 )) * N[0];
							T[1] = (n * cur_ray.direction[1]) + (n * cosI - Math.sqrt( cosT2 )) * N[1];
							T[2] = (n * cur_ray.direction[2]) + (n * cosI - Math.sqrt( cosT2 )) * N[2];
																									 
							//Ray new_ray;
							var tempOrig = new Array(0,0,0,0);
							var tempDir = new Array(0,0,0,0);
							var tempTrans = new Array(0,0,0,0);
							var new_ray = new Ray(tempOrig, tempDir, 0.0, 0.0, 0, 0, 0.0, tempTrans);						
							new_ray.origin[0] = point_intersect[0] + T[0] * EPSILON;
							new_ray.origin[1] = point_intersect[1] + T[1] * EPSILON;
							new_ray.origin[2] = point_intersect[2] + T[2] * EPSILON;
							new_ray.direction = T;
							new_ray.depth = cur_ray.depth + 1;
							new_ray.weight = cur_ray.weight;
							new_ray.type = REFRACTED;
							new_ray.origin_primitive = prim_index;
							new_ray.r_index = m_rindex;
							new_ray.transparency[0] = cur_ray.transparency[0] * (Math.exp(prim_list[prim_index * ROW_W + X_M_COLOR_0] * 0.15 * (-distArr[0])));
							new_ray.transparency[1] = cur_ray.transparency[1] * (Math.exp(prim_list[prim_index * ROW_W + X_M_COLOR_1] * 0.15 * (-distArr[0])));
							new_ray.transparency[2] = cur_ray.transparency[2] * (Math.exp(prim_list[prim_index * ROW_W + X_M_COLOR_2] * 0.15 * (-distArr[0])));

							//PUSH_RAY(queue, new_ray, back_ray_ptr, rays_in_queue)
							if (back_ray_ptr >= MAX_RAY_COUNT){
								back_ray_ptr = 0;
							}
							queue[back_ray_ptr++] = new_ray; 
							rays_in_queue++; 
						}
					}
				}				
			}
		}
	}	
	// Since we supersample 3x, we have to divide the total color by 9 to average it.
	var red = acc[0] * (256 / 9);
	if(red > 255) red = 255;
	if(red < 0) red = 0;
	var green = acc[1] * (256 / 9);
	if(green > 255) green = 255;
	if(green < 0) green = 0;
	var blue = acc[2] * (256 / 9);
	if(blue > 255) blue = 255;
	if(blue < 0) blue = 0;
	
	pixels_data[c*4] = red;
	pixels_data[c*4+1] = green;
	pixels_data[c*4+2] = blue;
	pixels_data[c*4+3] = 255;
	return 1;
}