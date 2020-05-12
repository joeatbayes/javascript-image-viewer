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

function toFixed(aVal, numDec) {
    var tnum = aVal;
    if (isString(tnum)) tnum = parseFloat(tnum.trim());
    tnum = tnum.toFixed(numDec);
    tnum = numberWithCommas(tnum);
    return tnum;
  }