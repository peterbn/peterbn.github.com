function getTextWidth() {
    let span = document.getElementById('tspan');
    let textwidth = span.textLength.baseVal.value;
    return textwidth;
}

function updatePreview() {
    let words = document.getElementById('source').value;
    let span = document.getElementById('tspan');
    span.textContent = words;

    let textwidth = getTextWidth();
    let svg = document.getElementById('svg');

    svg.setAttribute("width", textwidth + 20); // text width + 10 margin
    generatePng();
}

function generatePng() {
    let svg = document.getElementById('svg');
    let svgDimensions = svg.getBBox();

    let svgString = new XMLSerializer().serializeToString(svg);

    let canvas = document.getElementById("renderer");
    let textwidth = getTextWidth();

    canvas.setAttribute('width', textwidth + 20);

    let ctx = canvas.getContext("2d");
    let DOMURL = self.URL || self.webkitURL || self;
    let img = new Image();
    var svgUrl = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8"
    });

    let url = DOMURL.createObjectURL(svgUrl);

    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    };
    img.src = url;

}

function prepareDownload() {
    let words = document.getElementById('source').value;
    let link = document.getElementById('download');

    let canvas = document.getElementById("renderer");
    var dataURL = canvas.toDataURL('image/png');

    link.setAttribute('href', dataURL);
    link.setAttribute('download', encodeURIComponent(words) + ".png");
}

function updateFont() {
    let font = document.getElementById('font').value;
    let text = document.getElementById('text');
    text.setAttribute('font-family', font);

    // setTimeout(updatePreview, 0);
    updatePreview();
}

document.addEventListener("DOMContentLoaded", function() {
    let source = document.getElementById('source');
    source.addEventListener('keyup', updatePreview);

    let link = document.getElementById('download');
    link.addEventListener('click', e => {
        let self = this;
        let canvas = document.getElementById("renderer");
        var dataURL = canvas.toDataURL('image/png');
        link.href = dataURL;

        let words = document.getElementById('source').value;
        link.setAttribute('download', words + '.png');
    });

    let fonts = document.getElementById('font');
    fonts.addEventListener('change', updateFont);
});