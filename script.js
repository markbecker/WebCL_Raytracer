// JavaScript Document

var imageNameArr = ["WebCL_Logo.jpg", "scene1.jpg", "scene2.jpg", "scene3.jpg"];
var imageArr = new Array();
var arrSize = imageNameArr.length;
var prim_list_raw = new Array();
var prim_list_buffer; //ArrayBuffer
var prim_list_float32View;
var sceneFileName = "scene1.txt";
var builtInFuncStr = "";

var n_primitives = 0;

// default settings
var platformChosen = 0;
var deviceChosen = 0;
var camera_x = 0.0;
var camera_y = 0.0;
var camera_z = -7.0;
var viewport_x = 6.0;
var viewport_y = 4.5;
var screenWidth = 800;
var screenHeight = 600;
var workItemSize = [16,8];
var traceDepth = 5;
var runCount = 1;

function setupGUI(){
	setupImageRadios();
	setupDeviceRadios();
	// default radio button chosen
	document.chooseImage.image1.checked = true;
	document.chooseDevice.device0_0.checked = true;
}

function setupImageRadios(){		
	var imageStr = "<form name='chooseImage'><span class='header'>Choose&nbsp;Image:</span><br/><br/>";
	// jump to index 1 b/c logo is image 0
	for(var i = 1; i < arrSize; i++){
		imageStr += "<input type='radio' value='" + i + "' name='images' id='image" + i + "'>"
					+ i + ". "+ imageNameArr[i].replace('.jpg','');
		imageStr += "&nbsp;<canvas id='canvasRadioImg" + i + "' width=20 height=20 style='vertical-align: middle;'></canvas>";
		(i < arrSize-1)? imageStr += "<br /><br />" : imageStr += "<br />";			
	}		
	// String deviceRadioStr is printed out to div element output
	var divImageRadios = document.getElementById ("divImageRadios");
	divImageRadios.innerHTML = imageStr + "</form>";
	
	for(var i = 0; i < arrSize; i++){	
		imageArr[i] = new Image();
		if(i==0)
			imageArr[i].onload = function(){};//setImagesToCanvas(this, "canvasImg");};
		else		
			imageArr[i].onload = function(){setImagesToCanvas(this, "canvasRadioImg");};
		imageArr[i].src = imageNameArr[i];		
	}
}

function setupDeviceRadios(){
	var deviceRadioStr = "<form name='chooseDevice'><span class='header'>Choose&nbsp;Device:</span><br/><br/>";
	try {			
		if (checkWebCL()==false) {
			return false;
		}
		
	var platforms = WebCL.getPlatformIDs ();
	for (var i in platforms) {
		var plat = platforms[i];
		var platformName = plat.getPlatformInfo (WebCL.CL_PLATFORM_NAME);
		deviceRadioStr += "<b>"+ i +".&nbsp;"+ platformName + "</b><br>";
		
			var devices = plat.getDeviceIDs (WebCL.CL_DEVICE_TYPE_ALL);
			for (var j in devices) {
				var dev = devices[j];
				var deviceName = dev.getDeviceInfo(WebCL.CL_DEVICE_NAME);
				deviceRadioStr += "&nbsp;<input type='radio' value='"
					+ i + "_" + j +	"' name='device' id='device"+ i + "_" + j +"'>"+j+". "+ deviceName +"<br/>";
			}
			//deviceRadioStr += "<br/>";
		}
	} catch(e) {
		var output = document.getElementById ("output");
		output.innerHTML += "<b>Error:</b> <pre style='color:red;'>"+e.toString()+"</pre>";
		throw e;
	}      
	// String deviceRadioStr is printed out to div element output
	var divDeviceRadios = document.getElementById ("divDeviceRadios");
	divDeviceRadios.innerHTML = deviceRadioStr + "</form>";		
}

function setImagesToCanvas(img, canName){
	try {
		if(canName == "canvasRadioImg"){
			var indexOfImg = imageArr.indexOf(img);
			var can = document.getElementById(canName + indexOfImg);
			var ctx = can.getContext("2d");
			var longestSide = 50;
			var scale = scaleWidth = scaleHeight = scaledW = scaledH = 0;
			scaleWidth = longestSide / img.width;
			scaleHeight = longestSide / img.height;
			(scaleWidth > scaleHeight)? scale = scaleHeight : scale = scaleWidth;
			scaledW = img.width * scale;
			scaledH = img.height * scale;
			can.width = scaledW;
			can.height = scaledH;			
			ctx.drawImage(img , 0, 0, scaledW, scaledH);
		}else{
			var can = document.getElementById(canName);
			var ctx = can.getContext("2d");
			can.width = img.width;
			can.height = img.height;
			ctx.drawImage (img, 0, 0, (img.width), (img.height));				
		}
	} catch(e) {
		document.getElementById("output").innerHTML += "<h3>ERROR:</h3><pre style=\"color:red;\">" + e.message + "</pre>";
		throw e;
	}
}

function checkWebCL(){
	if (window.WebCL == undefined) {
		alert("Unfortunately your system does not support WebCL. " +
				"Make sure that you have both the OpenCL driver " +
				"and the WebCL browser extension installed.");
		return false;
	}
	return true;
}

function getDeviceType(dev){
	var retStr = "";
	switch(dev){
		case WebCL.CL_DEVICE_TYPE_CPU:
			retStr = "CPU";
			break;
		case WebCL.CL_DEVICE_TYPE_GPU:
			retStr = "GPU";
			break;
		case WebCL.CL_DEVICE_TYPE_ACCELERATOR:
			retStr = "APU";
			break;
		default:
			retStr = "???";
			break;
	}
	return retStr;
}

function createPrimList(){
	var lines = new Array();
	var mHttpReq = new XMLHttpRequest();
	mHttpReq.open("GET", sceneFileName, false);
	mHttpReq.send(null);
	allText = mHttpReq.responseText; 
	lines = allText.split("\n");
	n_primitives = parseInt(lines[0]);
	// create Buffer Array for entire prim_list arr
	
	prim_list_buffer = new ArrayBuffer( n_primitives * 96 );
	// Create a new view that divides buffer to 32 bit float
	prim_list_float32View = new Float32Array(prim_list_buffer);
	prim_list_raw = new Array();
	for(var i = 0; i < n_primitives; i++){
		var a = lines[i+1].split(",");
		prim_list_raw.push({ type: parseInt(a[0]), 
							m_color_r: parseFloat(a[1]), 
							m_color_g: parseFloat(a[2]), 
							m_color_b: parseFloat(a[3]),
							m_refl: parseFloat(a[4]), 
							m_refr: parseFloat(a[5]),
							m_refr_index: parseFloat(a[6]), 
							m_diff: parseFloat(a[7]), 
							m_spec: parseFloat(a[8]), 
							light: parseInt(a[9]), 
							center_normal_x: parseFloat(a[10]), 
							center_normal_y: parseFloat(a[11]), 
							center_normal_z: parseFloat(a[12]), 
							radius_depth: parseFloat(a[13]), 
							name: a[14]});			
	}		
	for(var i = 0; i < n_primitives; i++){
		var m_color = [0.0,0.0,0.0,0.0]; //Color m_color;
		var m_refl = 0.0; //float m_refl;
		var m_diff = 0.0; //float m_diff;
		var m_refr = 0.0; //float m_refr;
		var m_refr_index = 0.0; //float m_refr_index;
		var m_spec = 0.0; //float m_spec;
		var dummy_3 = 0.0; //float dummy_3;
		var type = 0.0; //prim_type type;
		var is_light = 0.0; //bool is_light;
		var normal = [0.0,0.0,0.0,0.0]; //float4 normal;
		var center = [0.0,0.0,0.0,0.0]; //float4 center;
		var depth = 0.0; //float depth;
		var radius = 0.0; //float radius;
		var sq_radius = 0.0; //float sq_radius;
		var r_radius = 0.0; //float r_radius;
		
		m_color[0] = prim_list_raw[i].m_color_r;
		m_color[1] = prim_list_raw[i].m_color_g;
		m_color[2] = prim_list_raw[i].m_color_b;
		m_refl = prim_list_raw[i].m_refl;
		m_diff = prim_list_raw[i].m_diff;
		m_refr = prim_list_raw[i].m_refr;
		m_refr_index = prim_list_raw[i].m_refr_index;
		m_spec = prim_list_raw[i].m_spec;			
		
		if(prim_list_raw[i].light == 1)
			is_light = 1.0;
		
		type = prim_list_raw[i].type;	
		if(type == 0){
			normal[0] = prim_list_raw[i].center_normal_x;
			normal[1] = prim_list_raw[i].center_normal_y;
			normal[2] = prim_list_raw[i].center_normal_z;
			depth = prim_list_raw[i].radius_depth;
		}else{				
			center[0] = prim_list_raw[i].center_normal_x;
			center[1] = prim_list_raw[i].center_normal_y;
			center[2] = prim_list_raw[i].center_normal_z;
			radius = prim_list_raw[i].radius_depth;
			sq_radius = radius * radius;
			r_radius = (1.0 / prim_list_raw[i].radius_depth);
		}
		
		var x = 0;
		var y = i * 24;
		prim_list_float32View[y + x] = m_color[0]; x++;		// 0
		prim_list_float32View[y + x] = m_color[1]; x++;		// 1
		prim_list_float32View[y + x] = m_color[2]; x++;		// 2
		prim_list_float32View[y + x] = m_color[3]; x++;		// 3 always empty
		prim_list_float32View[y + x] = m_refl; x++;			// 4
		prim_list_float32View[y + x] = m_diff; x++;			// 5
		prim_list_float32View[y + x] = m_refr; x++;			// 6
		prim_list_float32View[y + x] = m_refr_index; x++;	// 7
		prim_list_float32View[y + x] = m_spec; x++;			// 8
		prim_list_float32View[y + x] = dummy_3; x++;		// 9
		prim_list_float32View[y + x] = type; x++;			// 10
		prim_list_float32View[y + x] = is_light; x++;		// 11
		prim_list_float32View[y + x] = normal[0]; x++;		// 12
		prim_list_float32View[y + x] = normal[1]; x++;		// 13
		prim_list_float32View[y + x] = normal[2]; x++;		// 14
		prim_list_float32View[y + x] = normal[3]; x++;		// 15 always empty
		prim_list_float32View[y + x] = center[0]; x++;		// 16
		prim_list_float32View[y + x] = center[1]; x++;		// 17
		prim_list_float32View[y + x] = center[2]; x++;		// 18
		prim_list_float32View[y + x] = center[3]; x++;		// 19 always empty
		prim_list_float32View[y + x] = depth; x++;			// 20
		prim_list_float32View[y + x] = radius; x++;			// 21
		prim_list_float32View[y + x] = sq_radius; x++;		// 22
		prim_list_float32View[y + x] = r_radius; x++;		// 23		
	}
	//alert("Yes " + prim_list_float32View[25]);
}

function moveScene(dir){
	var y = 0;
	if(dir=='Forward'){
		for(var i = 0; i < n_primitives; i++){
			y = i * 24;
			if(prim_list_float32View[y + 10] > 0){ // any sphere
				prim_list_float32View[y + 18] -= 5;
			}else if(prim_list_float32View[y + 14] != 0){ //front or back plane
				prim_list_float32View[y + 20] -= 5;
			}
		}	
	}
	if(dir=='Back'){
		for(var i = 0; i < n_primitives; i++){
			y = i * 24;
			if(prim_list_float32View[y + 10] > 0){ // 0=Plane, 1=Sphere
				prim_list_float32View[y + 18] += 5;
			}else if(prim_list_float32View[y + 14] != 0){ //front or back plane			
				prim_list_float32View[y + 20] += 5;
			}
		}	
	}
	if(dir=='Up'){
		for(var i = 0; i < n_primitives; i++){
			y = i * 24;
			if(prim_list_float32View[y + 10] > 0){ // 0=Plane, 1=Sphere
				prim_list_float32View[y + 17] -= 2;
			}else if(prim_list_float32View[y + 13] == -1){ //top plane			
				prim_list_float32View[y + 20] -= 2;
			}else if(prim_list_float32View[y + 13] == 1){ //floor plane			
				prim_list_float32View[y + 20] += 2;
			}
		}	
	}
	if(dir=='Down'){
		for(var i = 0; i < n_primitives; i++){
			y = i * 24;
			if(prim_list_float32View[y + 10] > 0){ // 0=Plane, 1=Sphere
				prim_list_float32View[y + 17] += 2;
			}else if(prim_list_float32View[y + 13] == -1){ //top plane			
				prim_list_float32View[y + 20] += 2;
			}else if(prim_list_float32View[y + 13] == 1){ //floor plane			
				prim_list_float32View[y + 20] -= 2;
			}
		}	
	}
	if(dir=='Left'){
		for(var i = 0; i < n_primitives; i++){
			y = i * 24;
			if(prim_list_float32View[y + 10] > 0){ // 0=Plane, 1=Sphere
				prim_list_float32View[y + 16] += 2;
			}else if(prim_list_float32View[y + 12] == -1){ //left plane			
				prim_list_float32View[y + 20] += 2;
			}else if(prim_list_float32View[y + 12] == 1){ //right plane			
				prim_list_float32View[y + 20] -= 2;
			}
		}	
	}
	if(dir=='Right'){
		for(var i = 0; i < n_primitives; i++){
			y = i * 24;
			if(prim_list_float32View[y + 10] > 0){ // 0=Plane, 1=Sphere
				prim_list_float32View[y + 16] -= 2;
			}else if(prim_list_float32View[y + 12] == -1){ //left plane			
				prim_list_float32View[y + 20] -= 2;
			}else if(prim_list_float32View[y + 12] == 1){ //right plane			
				prim_list_float32View[y + 20] += 2;
			}
		}
	}
	CL_ratrace(0); //will not load prims
}

function moveView(dir){	
	if(dir=='Up' && camera_y > -5.0){
		camera_y -= 1;
		CL_ratrace(0); //will NOT load prims
	}
	if(dir=='Down' && camera_y < 5.0){
		camera_y += 1;
		CL_ratrace(0); //will NOT load prims
	}
	if(dir=='Left' && camera_x < 5.0){
		camera_x += 1;
		CL_ratrace(0); //will NOT load prims
	}
	if(dir=='Right' && camera_x > -5.0){
		camera_x -= 1;
		CL_ratrace(0); //will NOT load prims
	}
	if(dir=='ZoomIn' && camera_z > -15.0){
		camera_z -= 2;
		CL_ratrace(0); //will NOT load prims
	}
	if(dir=='ZoomOut' && camera_z < 1.0){
		camera_z += 2;
		CL_ratrace(0); //will NOT load prims
	}
	if(dir=='Reset'){
		camera_x = 0;
		camera_y = 0;
		camera_z = -7.0;
		CL_ratrace(1); //WILL load prims
	}
}

function loadKernel(id){
	var kernelElement = document.getElementById(id);
	var kernelSource = kernelElement.text;
	if (kernelElement.src != "") {
		var mHttpReq = new XMLHttpRequest();
		mHttpReq.open("GET", kernelElement.src, false);
		mHttpReq.send(null);
		kernelSource = mHttpReq.responseText;
	} 
	return kernelSource;
}

function checkImagRadioBtns(){
	// Collect chosen image or return alert box		
	var imgRadioBtn = document.chooseImage.images;
	var imgRadioBtnCnt = imgRadioBtn.length;
	var imgRadVal = -1;
	for (var i=0; i < imgRadioBtnCnt; i++){
		if (imgRadioBtn[i].checked){
			imgRadVal = parseInt(imgRadioBtn[i].value);
   		}
	}
	if(imgRadVal <= -1){
		alert("Please choose a 'image'"); 
		return false;
	}
	//setImagesToCanvas(imageArr[imgRadVal], "canvasImg"); 
	sceneFileName = "scene"+ imgRadVal + ".txt";
	return true;
}

function checkDevRadioBtns(){	
	// Collect chosen device selected
	// or return alert box
	var devRadioBtn = document.chooseDevice.device;
	var devRadioBtnCnt = devRadioBtn.length;
	var devRadVal = "";
	for (var i=0; i < devRadioBtnCnt; i++){
		if (devRadioBtn[i].checked){
			devRadVal = devRadioBtn[i].value;
		}
	}
	if(!(devRadVal.length > 0)){
		alert("Please choose a 'device'"); 
		return false;
	}
	var devRadValArr = devRadVal.split("_");
	platformChosen = parseInt(devRadValArr[0]);
	deviceChosen = parseInt(devRadValArr[1]);
	return true;
}

function checkAdjustRunValues(){
	//Check the "Adjust Run" values
	// Create error string	
	var wasError = false;
	var errorStr = "Error:\n";
	var baseColor = "#AEE";
	var errorTextColor = "#F66";
	
	var AdjustRunTF = document.getElementById("Width");
	screenWidth = parseInt(AdjustRunTF.value);
	AdjustRunTF = document.getElementById("Height");
	screenHeight = parseInt(AdjustRunTF.value);
	var labelElem = document.getElementById("divScreenSizeLabel");
	labelElem.style.color = baseColor;
	if((!(screenWidth >= 100 && screenWidth <= 1600)) || (!(screenHeight >= 100 && screenHeight <= 1600))){
		errorStr += "Please set Screen Width and Height to integer value of 100 to 1600\n";	
		labelElem.style.color = errorTextColor;
		wasError = true;
	}
	
	AdjustRunTF = document.getElementById("WorkItem0");
	workItemSize[0] = parseInt(AdjustRunTF.value);
	AdjustRunTF = document.getElementById("WorkItem1");
	workItemSize[1] = parseInt(AdjustRunTF.value);	
	labelElem = document.getElementById("divWorkItemSizeLabel");
	labelElem.style.color = baseColor;	
	if((!(workItemSize[0] >= 2 && workItemSize[0] <= 64)) || (!(workItemSize[1] >= 2 && workItemSize[1] <= 64))){
		errorStr += "Please set Work Item [0] and Work Item [1] to integer value of 2 to 64\n"; 	
		labelElem.style.color = errorTextColor;
		wasError = true;
	}
	
	labelElem = document.getElementById("divWorkItemSizeLabel");
	labelElem.style.color = baseColor;	
	if((screenWidth % workItemSize[0] != 0) || (screenHeight % workItemSize[1] != 0)){
		errorStr += "Please set Screen Size to be a multiple of Work Items\n"; 
		labelElem.style.color = errorTextColor;
		wasError = true;
	}
		
	AdjustRunTF = document.getElementById("TraceDepth");
	traceDepth = parseInt(AdjustRunTF.value);
	labelElem = document.getElementById("divTraceDepthLabel");
	labelElem.style.color = baseColor;	
	if(!(traceDepth >= 0 && traceDepth <= 5)){
		errorStr += "Please set Trace Depth to integer value of 0 to 5\n"; 
		labelElem.style.color = errorTextColor;
		wasError = true;
	}else{
		switch(traceDepth)
		{
		case 5:
			builtInFuncStr += "-DD_TRACEDEPTH_5 ";
			break;
		case 4:
			builtInFuncStr += "-DD_TRACEDEPTH_4 ";
			break;
		case 3:
			builtInFuncStr += "-DD_TRACEDEPTH_3 ";
			break;
		case 2:
			builtInFuncStr += "-DD_TRACEDEPTH_2 ";
			break;
		case 1:
			builtInFuncStr += "-DD_TRACEDEPTH_1 ";
			break;
		case 0:
			builtInFuncStr += "-DD_TRACEDEPTH_0 ";
			break;
		default:
			builtInFuncStr += "-DD_TRACEDEPTH_5 ";
			break;
		}
	}
	
	AdjustRunTF = document.getElementById("RunCount")
	runCount = parseInt(AdjustRunTF.value);
	labelElem = document.getElementById("divRunCountLabel");
	labelElem.style.color = baseColor;	
	if(!(runCount >= 1 && runCount <= 20)){
		errorStr += "Please set Number of Runs to integer value of 1 to 20\n"; 
		labelElem.style.color = errorTextColor;
		wasError = true;
	}
	
	if(wasError){
		alert(errorStr);
		return false;		
	}else{
		return true;
	}
}

function checkBuiltInFunctionValue(){
	// Collect chosen device selected
	// or return alert box
	var form = document.builtInFunc;
	if(form.BuiltInNormalize.checked || form.FastNormalize.checked){
		(form.BuiltInNormalize.checked)?builtInFuncStr += "-DD_BUILTIN_NORMALIZE ":builtInFuncStr += "-DD_FAST_NORMALIZE ";
	}
	if(form.BuiltInDotProduct.checked){builtInFuncStr += "-DD_BUILTIN_DOT ";}
	if(form.NativeSqrt.checked){builtInFuncStr += "-DD_NATIVE_SQRT ";}
	if(form.BuiltInLength.checked){builtInFuncStr += "-DD_BUILTIN_LEN ";}
}

function CL_ratrace (loadPrims) {	
	builtInFuncStr = "";	
	platformChosen = 0;
	deviceChosen = 0;
	camera_x = 0.0;
	camera_y = 0.0;
	camera_z = -7.0;
	viewport_x = 6.0;
	viewport_y = 4.5;
	screenWidth = 800;
	screenHeight = 600;
	workItemSize = [16,8];
	traceDepth = 5;
	runCount = 1;
	
	// All output is written to element by id "output"
	var output = document.getElementById("outputtextarea");
	output.innerHTML = "Running";	
	var outputStr = "";
	
	if(!checkImagRadioBtns()){ 
		output.innerHTML = "Error: checkImagRadioBtns()"; 
		return;
	}
	if(!checkDevRadioBtns()){ 
		output.innerHTML = "Error: checkDevRadioBtns()"; 
		return;
	}
	if(!checkAdjustRunValues()){ 
		output.innerHTML = "Error: checkAdjustRunValues()"; 
		return;
	}	
	
	checkBuiltInFunctionValue();
	
	if(loadPrims==1){createPrimList();}	// load prims from file
	
	try {
		// Get pixel data from canvas
		var canvasImg = document.getElementById("canvasImg");
		canvasImg.width = screenWidth;
		canvasImg.height = screenHeight;
		var canvasImgCtx = canvasImg.getContext("2d");
		var pixels = canvasImgCtx.getImageData(0, 0, screenWidth, screenHeight);
		// Dimm the existing canvas to highlight any errors we might get.
		// This does not affect the already retrieved pixel data.
		canvasImgCtx.fillStyle = "rgba(0,0,0,1)";
		canvasImgCtx.fillRect(0, 0, screenWidth, screenHeight);
                 
		// Setup WebCL context using the default device of the first available platform
		var platforms = WebCL.getPlatformIDs();
		//var ctx = WebCL.createContextFromType ([WebCL.CL_CONTEXT_PLATFORM, platforms[platformChosen]], WebCL.CL_DEVICE_TYPE_DEFAULT);
		var ctx = WebCL.createContextFromType ([WebCL.CL_CONTEXT_PLATFORM, platforms[platformChosen]], WebCL.CL_DEVICE_TYPE_ALL);
		// Setup buffers
		var imgSize = screenWidth * screenHeight;
		outputStr += "Image size: " + imgSize + " pixels ("	+ screenWidth + " x " + screenHeight + ")";
	
		// "bufSizeImage = image * 4" broken down
		// image = (w * h)
		// 4 = number of chars
		// implicitly * 1 because char size = 1 * byte
		var bufSizeImage = imgSize * 4; // size in bytes
		
		// m_color = [0.0,0.0,0.0,0.0];	 	16 bytes
		// m_refl = 0.0; 					4 bytes
		// m_diff = 0.0; 					4 bytes
		// m_refr = 0.0; 					4 bytes
		// m_refr_index = 0.0; 				4 bytes
		// m_spec = 0.0; 					4 bytes
		// dummy_3 = 0.0; 					4 bytes
		// type = 0; 						4 bytes
		// is_light = false; 				4 bytes change from 1 byte 
		// normal = [0.0,0.0,0.0,0.0];	 	16 bytes
		// center = [0.0,0.0,0.0,0.0];	 	16 bytes
		// depth = 0.0; 					4 bytes
		// radius = 0.0; 					4 bytes
		// sq_radius = 0.0; 				4 bytes
		// r_radius = 0.0; 					4 bytes
		// 3 @ 16bytes, 12 @ 4bytes = 96bytes			
		//var bufSizeGlobalPrims = n_primitives * ((3 * 16) + (11 * 4) + (1 * 1));			
		var bufSizeGlobalPrims = n_primitives * 96;
		//alert(n_primitives);			
		
		outputStr += "\nBuffer size: " + bufSizeImage + " bytes";
                 
		var bufIn = ctx.createBuffer (WebCL.CL_MEM_READ_ONLY, bufSizeImage);
		var bufOut = ctx.createBuffer (WebCL.CL_MEM_WRITE_ONLY, bufSizeImage);
		var bufGlobalPrims = ctx.createBuffer (WebCL.CL_MEM_READ_ONLY, bufSizeGlobalPrims);
		//var bufLocalPrims = ctx.createBuffer (WebCL.CL_MEM_READ_WRITE, bufSizeGlobalPrims);
		// Create and build program
		var kernelSrc = loadKernel("clProgramRaytrace");
		var program = ctx.createProgramWithSource(kernelSrc);
		var devices = ctx.getContextInfo(WebCL.CL_CONTEXT_DEVICES);
		try {
			program.buildProgram ([devices[deviceChosen]], builtInFuncStr);
		} catch(e) {
			alert ("Failed to build WebCL program. Error "
					+ program.getProgramBuildInfo (devices[deviceChosen], WebCL.CL_PROGRAM_BUILD_STATUS)
					+ ":  " + program.getProgramBuildInfo (devices[deviceChosen], WebCL.CL_PROGRAM_BUILD_LOG));
			throw e;
		}
		// Create kernel and set arguments
		var kernel = program.createKernel ("raytracer_kernel");
		kernel.setKernelArg (0, bufIn);
		kernel.setKernelArg (1, bufOut);
		kernel.setKernelArg (2, screenWidth, WebCL.types.UINT);
		kernel.setKernelArg (3, screenHeight, WebCL.types.UINT);
		kernel.setKernelArg (4, parseFloat(camera_x), WebCL.types.FLOAT);
		kernel.setKernelArg (5, parseFloat(camera_y), WebCL.types.FLOAT);
		kernel.setKernelArg (6, parseFloat(camera_z), WebCL.types.FLOAT);
		kernel.setKernelArg (7, parseFloat(viewport_x), WebCL.types.FLOAT);
		kernel.setKernelArg (8, parseFloat(viewport_y), WebCL.types.FLOAT);
		kernel.setKernelArg (9, bufGlobalPrims);			
		kernel.setKernelArg (10, n_primitives, WebCL.types.INT);
		kernel.setKernelArgLocal (11, bufSizeGlobalPrims);	// requires the size for the local buffer ?	! ?	
		// Create command queue using the first available device
		var cmdQueue = ctx.createCommandQueue (devices[deviceChosen], 0);
		// Write the buffer to OpenCL device memory
		cmdQueue.enqueueWriteBuffer (bufIn, false, 0, bufSizeImage, pixels.data, []);
		// added
		cmdQueue.enqueueWriteBuffer (bufGlobalPrims, false, 0, bufSizeGlobalPrims, prim_list_float32View, []);
		// Init ND-range 
		var localWS = [workItemSize[0],workItemSize[1]];  
		var globalWS = [Math.ceil (screenWidth / localWS[0]) * localWS[0], 
						Math.ceil (screenHeight / localWS[1]) * localWS[1]];
                 
		outputStr += "\nWork group dimensions: " + globalWS.length;
		for (var i = 0; i < globalWS.length; ++i)
			outputStr += "\nGlobal work item size[" + i + "]: " + globalWS[i];
		for (var i = 0; i < localWS.length; ++i)
			outputStr += "\nLocal work item size[" + i + "]: " + localWS[i];				
			
		var dev = devices[deviceChosen];
		var platName = "Platform: " +
						dev.getDeviceInfo(WebCL.CL_DEVICE_PLATFORM).getPlatformInfo(WebCL.CL_PLATFORM_NAME);			
		platName = platName.replace(/ +/g, " ");
		var devName = "Device: " + dev.getDeviceInfo(WebCL.CL_DEVICE_NAME);			
		devName = devName.replace(/ +/g, " ");			
		
		outputStr =  "Scene File: " + sceneFileName + "\n" + platName + "\n" + devName + "\n" + 
			"Device Type: " + getDeviceType(dev.getDeviceInfo(WebCL.CL_DEVICE_TYPE)) + "\n\n" +
			"Max Work Group Size: " + dev.getDeviceInfo(WebCL.CL_DEVICE_MAX_WORK_GROUP_SIZE) + "\n" +
			"Compute Units: " + dev.getDeviceInfo(WebCL.CL_DEVICE_MAX_COMPUTE_UNITS) + "\n" +
			"Global Mem Size: " + ((dev.getDeviceInfo(WebCL.CL_DEVICE_GLOBAL_MEM_SIZE)/1024)/1024) + " MB\n" +
			"Local Mem Size: " + (dev.getDeviceInfo(WebCL.CL_DEVICE_LOCAL_MEM_SIZE)/1024) + " KB\n\n" +
			outputStr;		
                 
		var startTime = Date.now();
		// Execute (enqueue) kernel
		for(var i = 0; i < runCount; i++){
			cmdQueue.enqueueNDRangeKernel(kernel, globalWS.length, [], globalWS, localWS, []);
		}
		// Read the result buffer from OpenCL device
		cmdQueue.enqueueReadBuffer (bufOut, false, 0, bufSizeImage, pixels.data, []);
		cmdQueue.finish (); //Finish all the operations
		var endTime = Date.now();
		var runTime = (endTime - startTime)/1000;
		runTime /= runCount;
		canvasImgCtx.putImageData(pixels, 0, 0);
		outputStr += "\nRun Time: " + runTime.toFixed(3) + " seconds (avg of " + runCount + " runs)\nDone.";
		output.innerHTML = outputStr;
	} catch(e) {
		document.getElementById("output").innerHTML += "<h3>ERROR:</h3><pre style=\"color:red;\">" + e.message + "</pre>";
		throw e;
	}
}