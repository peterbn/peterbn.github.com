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
    ctx.textBaseline = 'bottom';
    ctx.strokeStyle = 'rgba(255,255,255,1)'
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round'
    ctx.miterLimit = 3;
    ctx.fillStyle = '#000000'
}

/**
 * Returns the bounding box width of the given text
 * @param {2DRenceringContext} ctx Rendering Context
 * @param {string} text Text to measure the width of on the given rendering context
 */
function textWidth(ctx, text) {
    let dims = ctx.measureText(text);
    let textWidth = Math.ceil(Math.abs(dims.actualBoundingBoxLeft) + Math.abs(dims.actualBoundingBoxRight))
    return textWidth;
}

/**
 * Measures the Bounding Box height of a line of text with the given context
 * @param {2DRenderingContext} ctx Rendering context
 */
function fontLineHeight(ctx) {
    const test = 'abcdefghijklmnopqrstuvxyzABCDEFGHIJKLMNOPQRSTUVXYZ'
    let dims = ctx.measureText(test);
    let textHeight = Math.ceil(Math.abs(dims.actualBoundingBoxAscent) + Math.abs(dims.actualBoundingBoxDescent));
    return textHeight;
}

function renderCanvasText(text) {
    const TEXT_PADDING = 15;
    const LINE_SKIP = 0;

    let lines = text.split('\n');

    let renderer = document.getElementById('renderer');
    let ctx = renderer.getContext('2d');
    initTextRender(ctx);

    let lineHeight = fontLineHeight(ctx);
    let maxTextWidth = 0;
    let totalTextHeight = lines.length * lineHeight + Math.max(0, lines.length - 1) * LINE_SKIP;

    for (let line of lines) {
        maxTextWidth = Math.max(maxTextWidth, textWidth(ctx, line));
    }

    // resize the output renderer to fit the text
    renderer.setAttribute('width', maxTextWidth + 2 * TEXT_PADDING);
    renderer.setAttribute('height', totalTextHeight + 2 * TEXT_PADDING);

    // re-init the context after changing canvas size
    initTextRender(ctx);

    let baselineoffset = TEXT_PADDING + lineHeight;
    for (let line of lines) {
        ctx.strokeText(line, TEXT_PADDING, baselineoffset);
        ctx.fillText(line, TEXT_PADDING, baselineoffset);
        baselineoffset += lineHeight + LINE_SKIP;
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