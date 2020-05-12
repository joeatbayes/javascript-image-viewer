function toDiv(divId, message) {
    var tdiv = document.getElementById(divId);
    if ((tdiv == undefined) || (tdiv == null)) {
        tdiv = document.createElement("div");
        tdiv.id = divId;
        document.body.appendChild(tdiv);
    }
    tdiv.innerHTML = message;
}
set_div_contents = toDiv;
to_div = toDiv;

function getFormValue(divId, defVal) {
    var tdiv = document.getElementById(divId);
    if ((tdiv !== undefined) && (tdiv !== null)) {
        return tdiv.value;
    }
    return defVal;
}


function setFormValue(divId, value) {
    var tdiv = document.getElementById(divId);
    if ((tdiv !== undefined) && (tdiv !== null) && (undefined !== value)) {
        tdiv.value = value;
        return tdiv;
    }
    return undefined;
}

"use strict";
   
var GSet =  {
   xoff: 0.0,
   yoff: 0.0,
   contrast: 100,   
   scale: 100,
   bright: 100,
   rotate: 0,
   img: null,
   canvas: null,
   context: null
};


 function updateControlDispVal(set) {
     toDiv("scaleVal", set.scale.toFixed(2));
     toDiv("xoffVal", set.xoff.toFixed(2));
     toDiv("yoffVal", set.yoff.toFixed(2));
     toDiv("rotateVal", set.rotate.toFixed(1));
     toDiv("contrastVal", set.contrast);
     toDiv("brightVal", set.bright);
 }

 function setControlVal(set) {
     setFormValue("scale", set.scale);
     setFormValue("xoff", set.xoff);
     setFormValue("yoff", set.yoff);
     setFormValue("rotate", set.rotate);
     setFormValue("contrast", set.contrast);
     setFormValue("brightness", set.bright);
     updateControlDispVal(set);
 }

 function readControlVal(set) {
     set.scale = parseFloat(getFormValue("scale", 1.0));
     set.xoff = parseFloat(getFormValue("xoff", 0.0));
     set.yoff = parseFloat(getFormValue("yoff", 0.0));
     set.rotate = parseInt(getFormValue("rotate", 0),10);
     set.contrast = parseInt(getFormValue("contrast", 100),10);
     set.bright = parseInt(getFormValue("brightness", 100),10);
 }


 function drawImage(set) {
     var img = set.img;
     var canvas = set.canvas;
     var ctx = canvas.getContext('2d');
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     ctx.save();

     // Total Size of Image after scaling 
     // scale < 1.0 will shrink the image
     var effWidth = img.width * set.scale;
     var effHeight = img.height * set.scale;

     // Image Cropping offset only needs to change
     // if the image is larger than the canvas
     var imgTopLeftX = 0.0;
     var imgTopLeftY = 0.0;

     // Amount of Image to render can be size of image 
     // when image is smaller than canvas otherwise
     // we mathematically slice out a portion of it. 
     var imgWidth =  img.width; // how much of image to take
     var imgHeigth = img.height;// how much of image to take

     // Portlet size to render image the canvas can be 
     // the size of the canvas unless the image is smaller
     // than the canvas.
     var portWidth =  Math.min(canvas.width, effWidth);
     var portHeight = Math.min(canvas.height, effHeight);
     
     // Where to render the image in the canvas
     // always 0 when image is larger than the 
     // canvas otherwise center.   
     var portOffX = 0.0;
     var portOffY = 0.0;

     if (canvas.width >= effWidth) {
         portOffX = (canvas.width - effWidth) / 2.0;
         portWidth = effWidth;
         imgWidth = img.width;
     } else  {
         // compute an effective window and then convert back to image pixels
         portWidth = canvas.width;
         var effWidthRatio = effWidth / canvas.width;
         var effWidth = Math.round(effWidth / effWidthRatio);
         var effExtraX = effWidth - canvas.width;
         var effOffsetX = effExtraX * set.xoff;          
         // Convert Effective Pixels to real Image pixels
         imgTopLeftX = effOffsetX / set.scale;
         imgWidth = effWidth  / set.scale;
     }


     if (canvas.height >= effHeight) {
         portHeight = effHeight;
         portOffY = (canvas.height - effHeight) / 2.0;            
         imgHeigth = imgHeigth;
     } else {
         // compute effective window then convert back to image pixels
         portHeight = canvas.height
         var effHeightRatio = effHeight /  canvas.width;
         var effHeight = Math.round(effHeight / effHeightRatio);
         var effExtraY = effHeight - canvas.height;
         var effOffsetY = effExtraY * set.yoff;
         // Convert Effective Pixels to real Image pixels
         imgTopLeftY = effOffsetY / set.scale;
         imgHeigth = effHeight / set.scale;
     }

     
     if (set.rotate != 0) {
       //var shapeCenterX = (imgTopLeftX + imgWidth) / 2.0;
       //var shapeCenterY = (imgTopLeftY + imgHeigth) / 2.0;
       //var shapeCenterX = (portOffX + portWidth) / 2.0;
       //var shapeCenterY = (portOffY + portHeight) / 2.0;
       //ctx.translate(shapeCenterX, shapeCenterY);
       var radians = set.rotate * Math.PI / 180.0;
       ctx.translate(canvas.width / 2, canvas.height / 2);
       ctx.rotate( radians);
       ctx.translate(-canvas.width / 2, -canvas.height / 2);
       //ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
     }
     var filtStrs = [];
     if (set.contrast != 100) {
       filtStrs.push("contrast(" + set.contrast + "%)");
     }
     if (set.bright != 100) {
       filtStrs.push("brightness(" + set.bright + "%)");
     }
     if (filtStrs.length > 0) {
       ctx.filter = filtStrs.join(" ");
     }
     ctx.drawImage(img, imgTopLeftX, imgTopLeftY, imgWidth, imgHeigth, portOffX, portOffY, portWidth, portHeight);
     ctx.restore();
 }


 function drawToFit(set) {
   var scale =  set.scale = Math.min(set.canvas.width / set.img.width, set.canvas.height / set.img.height);
   drawImage(set);
 }

 // Clear setting to default;
 function clearSet(set) {
    set.xoff = 0.0;
    set.yoff = 0.0;
    set.scale = 1.0;
    set.rotate=0;
    set.contrast = 100;
    set.bright=100;    
 }

 function loadAndDisplayImage(canvId, imgUri, set) {
    set.canvas = document.getElementById(canvId); 
    set.context = canvas.getContext('2d'); 
    clearSet(set);
    var img = set.img = new Image();
    img.onload = function() {
      drawToFit(set);
      setControlVal(set);
 
    };
    img.src = imgUri;
 }


 function slideChange(set, obj) {
     readControlVal(set);
     updateControlDispVal(set);
     drawImage(set)
 }

 function getSetJSON(set) {
     var clone = JSON.parse(JSON.stringify(set))
     delete clone.img;
     delete clone.canvas;
     delete clone.context;
     toDiv("JSON_SET", JSON.stringify(clone, 2));
 }
