const TEXT_PADDING = 15;
const LINE_SKIP = 5;

function updatePreview() {

    renderCanvasText();
}

function changeFont() {
    updatePreview()
    let fonts = document.getElementById('font');
    font.style.fontFamily = `'${fonts.value}'`;
}

function getText() {
    let text = document.getElementById('source').value;
    let lines = text.split('\n');
    return lines.map(line => line.trim());
}

function getAlignment() {
    return document.querySelector('.radio-alignment:checked').value;
}

function getBackground() {
    return document.querySelector('.radio-background:checked').value;
}

function getFont() {
    let fonts = document.getElementById('font');
    return fonts.value
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
    let font = getFont();
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
 * @param {string} line Text to measure the width of on the given rendering context
 */
function textWidth(line) {
    const svgtext = document.getElementById('svgtext');
    svgtext.setAttribute('font-family', getFont())
    svgtext.textContent = line;
    let bbox = svgtext.getBBox();
    let textLength = Math.ceil(svgtext.textLength.baseVal.value);

    let baseX = parseInt(svgtext.getAttribute('x'));

    let overflow = bbox.width - textLength;

    let leadX = Math.abs(baseX - bbox.x);
    let trailX = overflow - leadX;

    return { bbWidth: bbox.width, textLength: textLength, leadX: leadX, trailX: trailX };
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

function textBoundingBox(ctx, lines) {
    let lineHeight = fontLineHeight(ctx);
    let maxTextWidth = 0;
    let totalTextHeight = lines.length * lineHeight + lines.length * LINE_SKIP;
    let maxLeadX = 0;
    let maxTrailX = 0;

    for (let line of lines) {
        let widthObj = textWidth(line);
        maxTextWidth = Math.max(maxTextWidth, widthObj.textLength);
        maxLeadX = Math.max(maxLeadX, widthObj.leadX);
        maxTrailX = Math.max(maxTrailX, widthObj.trailX);
    }
    return { width: maxTextWidth + maxLeadX + maxTrailX, height: totalTextHeight };
}

function getRenderingContext() {
    let renderer = document.getElementById('renderer');
    let ctx = renderer.getContext('2d');
    initTextRender(ctx);
    return ctx;
}

function resizeCanvas(width, height, padding) {
    let renderer = document.getElementById('renderer');
    // resize the output renderer to fit the text
    renderer.setAttribute('width', width + padding);
    renderer.setAttribute('height', height + padding);
    return getRenderingContext();
}

function renderText(ctx, lines, ctxRenderFun) {
    ctx.save();
    initTextRender(ctx);
    let lineHeight = fontLineHeight(ctx);
    let baselineoffset = lineHeight;

    let textYPos = getTextYPos(ctx, lines);

    for (let line of lines) {
        ctxRenderFun.call(ctx, line, textYPos, baselineoffset);
        baselineoffset += lineHeight + LINE_SKIP;
    }
    ctx.restore();
}

function renderBackgroundRectangle(ctx, lines, padding) {
    let textBB = textBoundingBox(ctx, lines);
    ctx.save();
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, textBB.width, textBB.height);
    ctx.restore();
}

function measureTextSideBearing(lines) {

    let leadX = 0;
    let trailX = 0;
    for (line of lines) {
        let widthObj = textWidth(line);
        leadX = Math.max(leadX, widthObj.leadX);
        trailX = Math.max(trailX, widthObj.trailX);
    }
    return { leadX: leadX, trailX: trailX };
}

function getTextYPos(ctx, lines) {
    let textBB = textBoundingBox(ctx, lines);
    let sideBearing = measureTextSideBearing(lines)
    let textYPos = 0;
    switch (getAlignment()) {
        case 'left':
            textYPos = sideBearing.leadX;
            break;
        case 'center':
            textYPos = (textBB.width + sideBearing.leadX - sideBearing.trailX) / 2;
            break;
        case 'right':
            textYPos = textBB.width - sideBearing.trailX;
            break;
    }
    return textYPos;
}


function renderCanvasText() {
    let lines = getText();

    let ctx = getRenderingContext();

    let background = getBackground();
    let padding = TEXT_PADDING;
    if (background === 'circle' || background === 'rectangle') {
        padding += 30;
    }

    let textBB = textBoundingBox(ctx, lines);

    ctx = resizeCanvas(textBB.width, textBB.height, 2 * padding);

    // Adjust all drawing commands
    ctx.translate(padding, padding);
    // Move all drawing commands to take padding into account
    // renderBackgroundRectangle(ctx, lines);
    renderText(ctx, lines, CanvasRenderingContext2D.prototype.strokeText);
    renderText(ctx, lines, CanvasRenderingContext2D.prototype.fillText);
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