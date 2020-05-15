"use strict";

function toDiv(divId, message) {
    var tdiv = document.getElementById(divId);
    if ((tdiv == undefined) || (tdiv == null)) {
        tdiv = document.createElement("div");
        tdiv.id = divId;
        document.body.appendChild(tdiv);
    }
    tdiv.innerHTML = message;
}

function appendDiv(divId, message) {
    var tdiv = document.getElementById(divId);
    if ((tdiv == undefined) || (tdiv == null)) {
        tdiv = document.createElement("div");
        tdiv.id = divId;
        document.body.appendChild(tdiv);
    }
    tdiv.innerHTML += message;
}

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

function copyKeyVal(srcObj, destObj) {
    for (var akey in srcObj) {
        destObj[akey] = srcObj[akey];
    }
}

function replaceAll(str, searStr, repStr) {
    return str.split(searStr).join(repStr);
}

var GSet = {
    xoff: 0.0,
    yoff: 0.0,
    contrast: 100,
    scale: 100,
    bright: 100,
    rotate: 0,
    recorded: [],
    draw: [],
    currLoc: null,
    lastMouseDown: { x: -10, y: -10 },
    eleId: {
        "jsonEditField": "setEdit",
        "jsonRecordField": "recordedSet",
        "canvasId": "canvas"
    },
    img: null,
    canvas: null,
    context: null
};

function updateControlDispVal(set) {
    toDiv("scaleVal", set.scale.toFixed(2));
    toDiv("xoffVal", set.xoff.toFixed(2));
    toDiv("yoffVal", set.yoff.toFixed(2));
    toDiv("irotateVal", set.rotate.toFixed(1));
    toDiv("contrastVal", set.contrast);
    toDiv("brightVal", set.bright);
}

function setControlVal(set) {
    setFormValue("scale", set.scale);
    setFormValue("xoff", set.xoff);
    setFormValue("yoff", set.yoff);
    setFormValue("irotate", set.rotate);
    setFormValue("contrast", set.contrast);
    setFormValue("brightness", set.bright);
    updateControlDispVal(set);
}

function readControlVal(set) {
    set.scale = parseFloat(getFormValue("scale", 1.0));
    set.xoff = parseFloat(getFormValue("xoff", 0.0));
    set.yoff = parseFloat(getFormValue("yoff", 0.0));
    set.rotate = parseInt(getFormValue("irotate", 0), 10);
    set.contrast = parseInt(getFormValue("contrast", 100), 10);
    set.bright = parseInt(getFormValue("brightness", 100), 10);
}

// draw mounding boxes
function drawSeg(ctx, set) {
    if (set.draw.length > 0) {
        ctx.save();
        var stat = "UP";
        ctx.beginPath();
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 2;
        for (var ndx in set.draw) {
            var loc = set.draw[ndx];
            if (loc.x == -1) {
                stat = "UP";
                continue;
            }
            if (stat == "UP") {
                ctx.moveTo(loc.x, loc.y);
                stat = "DN";
            } else {
                ctx.lineTo(loc.x, loc.y);
                ctx.stroke();
            }
        }
        if ((set.currLoc != null) && (stat == "DN")) {
            ctx.closePath();
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'red';
            ctx.moveTo(loc.x, loc.y);
            ctx.lineTo(set.currLoc.x, set.currLoc.y);
            ctx.stroke();
        }
        ctx.closePath();
        ctx.restore();
    }
}


function drawImage(set) {
    var img = set.img;
    var canvas = set.canvas;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Total Size of Image after scaling scale < 1.0 will shrink the image
    var effWidth = img.width * set.scale;
    var effHeight = img.height * set.scale;

    // Image Cropping offset only needs to change if the image is larger than the canvas
    var imgTopLeftX = 0.0;
    var imgTopLeftY = 0.0;

    // Amount of Image to render can be size of image when image is smaller than canvas
    // otherwise we mathematically slice out a portion of it. 
    var imgWidth = img.width; // how much of image to take
    var imgHeigth = img.height;// how much of image to take

    // Portlet size to render image the canvas can be the size of the canvas unless
    // the image is smaller than the canvas.
    var portWidth = Math.min(canvas.width, effWidth);
    var portHeight = Math.min(canvas.height, effHeight);

    // Where to render the image in the canvas always 0 when image is larger than the 
    // canvas otherwise center.   
    var portOffX = 0.0;
    var portOffY = 0.0;

    if (canvas.width >= effWidth) {
        portOffX = (canvas.width - effWidth) / 2.0;
        portWidth = effWidth;
        imgWidth = img.width;
    } else {
        // compute an effective window and then convert back to image pixels
        portWidth = canvas.width;
        var effWidthRatio = effWidth / canvas.width;
        var effExtraX = effWidth - canvas.width;
        var effWidth = Math.round(effWidth / effWidthRatio);
        var effOffsetX = effExtraX * set.xoff;
        // Convert Effective Pixels to real Image pixels
        imgTopLeftX = effOffsetX / set.scale;
        imgWidth = effWidth / set.scale;
    }

    if (canvas.height >= effHeight) {
        portHeight = effHeight;
        portOffY = (canvas.height - effHeight) / 2.0;
        imgHeigth = imgHeigth;
    } else {
        // compute effective window then convert back to image pixels
        portHeight = canvas.height
        var effHeightRatio = effHeight / canvas.height;
        var effExtraY = effHeight - canvas.height;
        var effHeight = Math.round(effHeight / effHeightRatio);
        var effOffsetY = effExtraY * set.yoff;
        // Convert Effective Pixels to real Image pixels
        imgTopLeftY = effOffsetY / set.scale;
        imgHeigth = effHeight / set.scale;
    }

    if (set.rotate != 0) {
        var radians = set.rotate * Math.PI / 180.0;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
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
    drawSeg(ctx, set);
}


function drawToFit(set) {
    var scale = set.scale = Math.min(set.canvas.width / set.img.width, set.canvas.height / set.img.height);
    drawImage(set);
    setControlVal(set);
    updateControlDispVal(set);
}

// Clear setting to default;
function clearSet(set) {
    set.xoff = 0.0;
    set.yoff = 0.0;
    set.scale = 1.0;
    set.rotate = 0;
    set.contrast = 100;
    set.bright = 100;
}


function loadAndDisplayImage(imgUri, set) {
    set.canvas = document.getElementById(set.eleId.canvasId);
    set.context = canvas.getContext('2d');
    clearSet(set);
    var img = set.img = new Image();
    img.onload = function () {
        drawToFit(set);
        setControlVal(set);
        updateJSONEdit(set);
    };
    img.src = imgUri;
}

function slideChange(set, obj) {
    readControlVal(set);
    updateControlDispVal(set);
    drawImage(set);
    updateJSONEdit(set);
}

function btnRotate45(set, obj) {
    set.rotate += 45;
    if (set.rotate >= 180) {
        set.rotate -= 180;
    }
    setControlVal(set);
    slideChange(set, obj);
}

function zoomInBtn(set, obj) {
    set.scale += set.scale * 0.2;
    setControlVal(set);
    slideChange(set, obj);

}

function zoomOutBtn(set, obj) {
    set.scale -= set.scale * 0.2;
    setControlVal(set);
    slideChange(set, obj);

}

function panModeBtn(set, obj) {

}

function editModeBtn(set, obj) {
    canvasTerminateDraw(set);
}

function resetBtn(set) {
    clearSet(set);
    updateControlDispVal(set);
    setControlVal(set);
    drawToFit(set);
    updateJSONEdit(set);
}

function getJSON(set) {
    var clone = JSON.parse(JSON.stringify(set))
    delete clone.img;
    delete clone.canvas;
    delete clone.context;
    delete clone.recorded;
    delete clone.eleId;
    delete clone.currLoc;
    return clone;
}
function updateJSONEdit(set) {
    var clone = getJSON(set);
    setFormValue(set.eleId.jsonEditField, JSON.stringify(clone, null, ' '));
}

function applySettings(set) {
    updateControlDispVal(set);
    setControlVal(set);
    drawImage(set);
}

function applySettingsBtn(set) {
    var setStr = getFormValue(set.eleId.jsonEditField);
    var tobj = JSON.parse(setStr);
    copyKeyVal(tobj, set);
    applySettings(set);
}

function recordBtn(set) {
    var clone = getJSON(set);
    var vname = getFormValue("viewName").trim();
    if (vname > " ") {
        clone.viewName = vname;
    }
    var jval = replaceAll(JSON.stringify(clone), ",", ", ");
    set.recorded.push(jval);
    var ndx = set.recorded.length - 1;
    var tstr = "<li><b>" + vname + ": <code class='recordedCode' onClick='restoreNum(GSet, "
        + ndx + " )'>" + jval + "</code></li>";
    appendDiv(set.eleId.jsonRecordField, tstr)
}

function restoreNum(set, ndx) {
    var jstr = set.recorded[ndx];
    var tobj = JSON.parse(jstr);
    copyKeyVal(tobj, set);
    updateJSONEdit(set);
    applySettings(set);
}

function canvasCoord(canvas, x, y) {
    var bbox = canvas.getBoundingClientRect();
    return {
        x: Math.round(x - bbox.left * (canvas.width / bbox.width)),
        y: Math.round(y - bbox.top * (canvas.height / bbox.height))
    };
}

function centerOnPoint(set, x, y) {

}

function canvasCoordToScaledCoord() {

}

function canvasCoordToImageCoord() {

}

function isSameLoc(loc1, loc2) {
    if (((loc1.x - loc2.x) <= 2) && ((loc1.y - loc2.y) <= 2)) {
        return true;
    } else {
        return false;
    }

}
function canvasMouseDown(e, set) {
    var loc = canvasCoord(set.canvas, e.clientX, e.clientY);

    if (isSameLoc(loc, set.lastMouseDown)) {
        // Same location for second click so zoom on that point.
        set.scale += set.scale * 0.2;
        // Now center on point clicked

        // If the point used for double click is same as last
        // draw point then remove it from the draw point list.
        if (set.draw.length > 0) {
            var priorDrawPt = set.draw[set.draw.length - 1];
            if (isSameLoc(loc, priorDrawPt)) {
                set.draw.pop();
            }
        }
    } else {
        set.draw.push(loc);
    }
    set.currLoc = set.lastMouseDown = loc;
    drawImage(set);
}

function canvasMouseUp(e, set) {
    var loc = canvasCoord(set.canvas, e.clientX, e.clientY);
}

function canvasMouseMove(e, set) {
    if (set.canvas == null) { return; }
    var loc = canvasCoord(set.canvas, e.clientX, e.clientY);
    set.currLoc = loc;
    if (set.draw.length > 0) {
        drawImage(set);
    }
}

function canvasTerminateDraw(set) {
    set.draw.push({ x: -1, y: -1 });
    drawImage(set);
}

function canvasKeyDown(event, set) {
    // TODO: Check mouse location inside a the canvas and bubble
    // up if not.
    if ((event.key == "Escape") && (set.draw.length > 0)) {
        canvasTerminateDraw(set);
    }
}

function clearDraw(set) {
    set.draw = [];
    drawImage(set);
}

