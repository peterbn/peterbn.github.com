function updatePreview() {
    let words = document.getElementById('source').value;
    renderCanvasText(words);
}

function changeFont() {
    updatePreview()
    let fonts = document.getElementById('font');
    font.style.fontFamily = `'${fonts.value}'`;
}

function prepareDownload() {
    let words = document.getElementById('source').value;
    let link = document.getElementById('download');

    let canvas = document.getElementById("renderer");
    var dataURL = canvas.toDataURL('image/png');

    link.setAttribute('href', dataURL);
    link.setAttribute('download', encodeURIComponent(words) + ".png");
}

function initTextRender(ctx) {

    let fonts = document.getElementById('font')
    let font = fonts.value;

    ctx.font = `80px ${font}`;
    ctx.textBaseline = 'hanging';
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 6;
    ctx.miterLimit = 4;
    ctx.fillStyle = '#000000'
}

function renderCanvasText(text) {
    const TEXT_PADDING = 15;
    const LINE_SKIP = 5;

    let lines = text.split('\n');

    let renderer = document.getElementById('renderer');
    let ctx = renderer.getContext('2d');
    initTextRender(ctx);

    let maxTextWidth = 0;
    let totalTextHeight = 0;

    for (let line of lines) {
        let dims = ctx.measureText(line);
        let textWidth = Math.ceil(Math.abs(dims.actualBoundingBoxLeft) + Math.abs(dims.actualBoundingBoxRight));
        let textHeight = Math.ceil(Math.abs(dims.actualBoundingBoxAscent) + Math.abs(dims.actualBoundingBoxDescent));
        maxTextWidth = Math.max(maxTextWidth, textWidth);
        totalTextHeight = totalTextHeight + textHeight;
    }

    // add line skip to the text
    totalTextHeight = totalTextHeight + Math.max(0, lines.length - 1) * LINE_SKIP;

    // resize the output renderer to fit the text
    renderer.setAttribute('width', maxTextWidth + 2 * TEXT_PADDING);
    renderer.setAttribute('height', totalTextHeight + 2 * TEXT_PADDING);

    // re-init the context
    initTextRender(ctx);

    let baselineoffset = TEXT_PADDING;
    for (let line of lines) {
        let dims = ctx.measureText(line);
        ctx.strokeText(line, TEXT_PADDING + dims.actualBoundingBoxLeft, baselineoffset + dims.actualBoundingBoxAscent);
        ctx.fillText(line, TEXT_PADDING + dims.actualBoundingBoxLeft, baselineoffset + dims.actualBoundingBoxAscent);

        let textHeight = Math.ceil(Math.abs(dims.actualBoundingBoxAscent) + Math.abs(dims.actualBoundingBoxDescent));
        baselineoffset += textHeight + LINE_SKIP;
    }



}

document.addEventListener("DOMContentLoaded", function() {
    let source = document.getElementById('source');
    source.addEventListener('keyup', updatePreview);

    let fonts = document.getElementById('font');
    fonts.addEventListener('change', changeFont);

    let link = document.getElementById('download');
    link.addEventListener('click', e => {
        let self = this;
        let canvas = document.getElementById("renderer");
        var dataURL = canvas.toDataURL('image/png');
        link.href = dataURL;

        let words = document.getElementById('source').value;
        link.setAttribute('download', words + '.png');
    });

    changeFont(); // Init the font picker font.

});