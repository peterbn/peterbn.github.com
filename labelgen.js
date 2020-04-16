const TEXT_PADDING = 16;
const LINE_SKIP = 6;
const BACKGROUND_STROKE_WIDTH = 16;

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
    ctx.lineWidth = BACKGROUND_STROKE_WIDTH;
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
    let textLength = svgtext.textLength.baseVal.value;

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
    let bbWidth = maxTextWidth + maxLeadX + maxTrailX
    return {
        width: bbWidth,
        height: totalTextHeight
    };
}

function getRenderingContext() {
    let renderer = document.getElementById('renderer');
    let ctx = renderer.getContext('2d');
    initTextRender(ctx);
    return ctx;
}

function resizeCanvas(width, height) {
    let renderer = document.getElementById('renderer');
    // resize the output renderer to fit the text
    renderer.setAttribute('width', width);
    renderer.setAttribute('height', height);
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

function renderTextBBox(ctx, textBB) {
    ctx.save();
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, textBB.width, textBB.height);
    ctx.restore();
}

function renderBackgroundRectangle(ctx, textBB, padding) {
    ctx.save();
    ctx.strokeStyle = '#000000aa';
    ctx.lineWidth = BACKGROUND_STROKE_WIDTH;

    ctx.fillStyle = 'white'
    ctx.lineJoin = 'miter';

    ctx.strokeRect(-1 * padding, -1 * padding, textBB.width + 2 * padding, textBB.height + 2 * padding);
    ctx.fillRect(-1 * padding, -1 * padding, textBB.width + 2 * padding, textBB.height + 2 * padding);
    ctx.restore();
}

function renderBackgroundCircle(ctx, textBB, padding) {
    ctx.save();
    ctx.strokeStyle = '#000000aa';
    ctx.lineWidth = BACKGROUND_STROKE_WIDTH;

    ctx.fillStyle = 'white'
    ctx.lineJoin = 'miter';

    let x = textBB.width / 2;
    let y = textBB.height / 2;

    let radius = 0.5 * Math.sqrt(Math.pow(textBB.width, 2) + Math.pow(textBB.height, 2)) + padding;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
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
    let paddingX = BACKGROUND_STROKE_WIDTH / 2;
    let paddingY = BACKGROUND_STROKE_WIDTH / 2;

    let textBB = textBoundingBox(ctx, lines);

    // Figure out the X and Y padding depending on the background type
    switch (background) {
        case 'rectangle':
            paddingX += TEXT_PADDING;
            paddingY += TEXT_PADDING;
            break;
        case 'circle':
            let diam = Math.sqrt(Math.pow(textBB.width, 2) + Math.pow(textBB.height, 2));
            paddingX += TEXT_PADDING + (diam - textBB.width) / 2;
            paddingY += TEXT_PADDING + (diam - textBB.height) / 2;
            break;
    }

    ctx = resizeCanvas(textBB.width + 2 * paddingX, textBB.height + 2 * paddingY);

    // Move all drawing commands to take padding into account
    ctx.translate(paddingX, paddingY);

    // Draw the text background
    switch (background) {
        case 'outline':
            renderText(ctx, lines, CanvasRenderingContext2D.prototype.strokeText);
            break;
        case 'circle':
            renderBackgroundCircle(ctx, textBB, TEXT_PADDING);
            break;
        case 'rectangle':
            renderBackgroundRectangle(ctx, textBB, TEXT_PADDING);
            break;
    }

    // renderTextBBox(ctx, textBB); // Useful for debugging, draws the BBox of the text

    // Render the desired label
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

    let backgrounds = document.getElementsByName('background');
    backgrounds.forEach(radio => {
        radio.addEventListener('change', updatePreview);
    });

    changeFont(); // Init the font picker font.

});