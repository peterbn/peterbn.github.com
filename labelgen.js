function updatePreview() {
    let words = document.getElementById('source').value;
    renderCanvasText(words);
}

function changeFont() {
    updatePreview()
    let fonts = document.getElementById('font');
    font.style.fontFamily = `'${fonts.value}'`;
}

function getAlignment() {
    return document.querySelector('.radio-alignment:checked').value;
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
    ctx.textAlign = getAlignment();
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 3;
    ctx.fillStyle = '#000000';
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
    const LINE_SKIP = 5;

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

    let textYPos = TEXT_PADDING;
    switch (getAlignment()) {
        case 'left':
            // Intentionally left blank
            break;
        case 'center':
            textYPos += maxTextWidth / 2;
            break;
        case 'right':
            textYPos += maxTextWidth;
            break;
    }

    for (let line of lines) {
        line = line.trim();
        ctx.strokeText(line, textYPos, baselineoffset);
        ctx.fillText(line, textYPos, baselineoffset);
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

    let alignments = document.getElementsByName('alignment');
    alignments.forEach(radio => {
        radio.addEventListener('change', updatePreview);
    });

    changeFont(); // Init the font picker font.

});