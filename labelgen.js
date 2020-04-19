const TEXT_PADDING = 16;
const LINE_SKIP = 6;
const BACKGROUND_STROKE_WIDTH = 16;
const FONT_SIZE = '80px';

/**
 * Helper class to correctly measure text before rendering, using an SVG element
 */
class TextMeasurer {
    constructor() {
        const SVG_NS = "http://www.w3.org/2000/svg";

        this.svg = document.createElementNS(SVG_NS, 'svg');

        this.svg.style.visibility = 'hidden';
        this.svg.setAttribute('xmlns', SVG_NS)
        this.svg.setAttribute('width', 0);
        this.svg.setAttribute('height', 0);

        this.svgtext = document.createElementNS(SVG_NS, 'text');
        this.svg.appendChild(this.svgtext);
        this.svgtext.setAttribute('x', 0);
        this.svgtext.setAttribute('y', 0);

        document.querySelector('body').appendChild(this.svg);
    }

    /**
     * Measure a single line of text, including the bounding box, inner size and lead and trail X
     * @param {string} text Single line of text
     * @param {string} fontFamily Name of font family
     * @param {string} fontSize Font size including units
     */
    measureText(text, fontFamily, fontSize) {
        this.svgtext.setAttribute('font-family', fontFamily);
        this.svgtext.setAttribute('font-size', fontSize);
        this.svgtext.textContent = text;

        let bbox = this.svgtext.getBBox();
        let textLength = this.svgtext.getComputedTextLength();

        // measure the overflow before and after the line caused by font side bearing
        // Rendering should start at X + leadX to have the edge of the text appear at X
        // when rendering left-aligned left-to-right
        let baseX = parseInt(this.svgtext.getAttribute('x'));
        let overflow = bbox.width - textLength;
        let leadX = Math.abs(baseX - bbox.x);
        let trailX = overflow - leadX;

        return {
            bbWidth: bbox.width,
            textLength: textLength,
            leadX: leadX,
            trailX: trailX,
            bbHeight: bbox.height
        };
    }

    /**
     * Measures the Bounding Box height of a line of text with the given font
     * @param {string} fontFamily Rendering context
     * @param {string} fontSize font size with unit
     */
    fontLineHeight(fontFamily, fontSize) {
        const test = 'abcdefghijklmnopqrstuvxyzABCDEFGHIJKLMNOPQRSTUVXYZ'
        let dims = this.measureText(test, fontFamily, fontSize);
        return dims.bbHeight;
    }

    /**
     * Measures the full bounding box of text rendered on the canvas, 
     * as well as any additional dimensions needed for correct rendering.
     * @param {Array<string>} lines List of strings to measure
     * @param {string} fontFamily Name of font family
     * @param {string} fontSize Font size with units
     * @param {string} alignment text alignment
     */
    textDimensions(lines, fontFamily, fontSize, alignment) {
        let lineHeight = this.fontLineHeight(fontFamily, fontSize);
        let totalTextHeight = lines.length * lineHeight + lines.length * LINE_SKIP;

        let maxTextWidth = 0;
        let maxLeadX = 0;
        let maxTrailX = 0;
        for (let line of lines) {
            let widthObj = this.measureText(line, fontFamily, fontSize);
            maxTextWidth = Math.max(maxTextWidth, widthObj.textLength);
            maxLeadX = Math.max(maxLeadX, widthObj.leadX);
            maxTrailX = Math.max(maxTrailX, widthObj.trailX);
        }
        let bbWidth = maxTextWidth + maxLeadX + maxTrailX;

        let textYPos = 0;
        switch (alignment) {
            case 'left':
                textYPos = maxLeadX;
                break;
            case 'center':
                textYPos = (bbWidth + maxLeadX - maxTrailX) / 2;
                break;
            case 'right':
                textYPos = bbWidth - maxTrailX;
                break;
        }

        return {
            width: bbWidth,
            height: totalTextHeight,
            textLength: maxTextWidth,
            leadX: maxLeadX,
            trailX: maxTrailX,
            lineHeight: lineHeight,
            lineSkip: LINE_SKIP,
            textYPos: textYPos
        };
    }
}

/**
 * Wrapper class to control rendering on the canvas.
 */
class Renderer {
    constructor(measurer) {
        this.canvas = document.getElementById('renderer');
        this.measurer = measurer;
    }

    /**
     * Get a data url of the image as PNG
     */
    toDataURL() {
        return this.canvas.toDataURL('image/png');
    }

    /**
     * Resize the renderer. This resets any context
     * @param {number} width new width in px
     * @param {number} height new height in px
     */
    resize(width, height) {
        this.canvas.setAttribute('width', width);
        this.canvas.setAttribute('height', height);
    }

    /**
     * Run the rendering function with the context, after having configured
     * it with the ctxconfig function. 
     * Context state is restored after this function call.
     * @param {function} ctxconfig Context setup function getting the context as arg
     * @param {function} rendering Rendering function getting the context as arg
     */
    withCtx(ctxconfig, rendering) {
        const ctx = renderer.getContext('2d');
        ctx.save();
        ctxconfig(ctx);
        rendering(ctx);
        ctx.restore();
    }

    /**
     * Render text on the canvas.
     * @param {Array} lines List of text lines to render
     * @param {string} font Font family
     * @param {string} fontSize Font size including units
     * @param {string} alignment desired text alignment
     * @param {Object} textDim Text dimensions object from measurer
     * @param {function} ctxRenderFun Reference to either strokeText or fillText on the CanvasRenderingContext2D object prototype
     */
    _renderText(lines, font, fontSize, alignment, textDim, ctxRenderFun) {
        const ctxconfig = ctx => {
            ctx.font = `${fontSize} ${font}`;
            ctx.textBaseline = 'bottom';
            ctx.textAlign = alignment;
            ctx.strokeStyle = 'rgba(255,255,255,1)';
            ctx.lineWidth = BACKGROUND_STROKE_WIDTH;
            ctx.lineJoin = 'round';
            ctx.miterLimit = 3;
            ctx.fillStyle = '#000000';
        };

        this.withCtx(ctxconfig, ctx => {
            let baselineoffset = textDim.lineHeight;

            for (let line of lines) {
                ctxRenderFun.call(ctx, line, textDim.textYPos, baselineoffset);
                baselineoffset += textDim.lineHeight + textDim.lineSkip;
            }
        });
    }

    strokeText(lines, font, fontSize, alignment, textDim) {
        this._renderText(lines, font, fontSize, alignment, textDim, CanvasRenderingContext2D.prototype.strokeText);
    }

    fillText(lines, font, fontSize, alignment, textDim) {
        this._renderText(lines, font, fontSize, alignment, textDim, CanvasRenderingContext2D.prototype.fillText);
    }

    renderTextBBox(textBB) {
        const ctxconfig = ctx => {
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 1;
        };
        this.withCtx(ctxconfig, ctx => {
            ctx.strokeRect(0, 0, textBB.width, textBB.height);
        });
    }

    renderBackgroundRectangle(textBB, padding) {
        const ctxconfig = ctx => {
            ctx.strokeStyle = '#000000aa';
            ctx.lineWidth = BACKGROUND_STROKE_WIDTH;
            ctx.fillStyle = 'white'
            ctx.lineJoin = 'miter';
        };
        this.withCtx(ctxconfig, ctx => {
            ctx.strokeRect(-1 * padding, -1 * padding, textBB.width + 2 * padding, textBB.height + 2 * padding);
            ctx.fillRect(-1 * padding, -1 * padding, textBB.width + 2 * padding, textBB.height + 2 * padding);
        });
    }

    renderBackgroundCircle(textBB, padding) {
        const ctxconfig = ctx => {
            ctx.strokeStyle = '#000000aa';
            ctx.lineWidth = BACKGROUND_STROKE_WIDTH;
            ctx.fillStyle = 'white'
            ctx.lineJoin = 'miter';
        }

        this.withCtx(ctxconfig, ctx => {
            let x = textBB.width / 2;
            let y = textBB.height / 2;

            let radius = 0.5 * Math.sqrt(Math.pow(textBB.width, 2) + Math.pow(textBB.height, 2)) + padding;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    _getPadding(textDim, background) {
        // The base padding is the outside part of the stroke, i.e. half width
        let paddingX = BACKGROUND_STROKE_WIDTH / 2;
        let paddingY = BACKGROUND_STROKE_WIDTH / 2;


        // Figure out the X and Y padding depending on the background type
        switch (background) {
            case 'rectangle':
                paddingX += TEXT_PADDING;
                paddingY += TEXT_PADDING;
                break;
            case 'circle':
                let diam = Math.sqrt(Math.pow(textDim.width, 2) + Math.pow(textDim.height, 2));
                paddingX += TEXT_PADDING + (diam - textDim.width) / 2;
                paddingY += TEXT_PADDING + (diam - textDim.height) / 2;
                break;
        }
        return { x: paddingX, y: paddingY };
    }

    /**
     * Render the desired label on the canvas.
     * @param {Array} lines text lines to render
     * @param {string} font Font family name
     * @param {string} fontSize font size with unit
     * @param {string} alignment text alignment
     * @param {string} background background type to render
     */
    renderLabel(lines, font, fontSize, alignment, background) {
        // Measure the text and required padding
        const textDim = this.measurer.textDimensions(lines, font, fontSize, alignment);
        const padding = this._getPadding(textDim, background);

        // Resize the canvas to fit the final image exactly
        this.resize(textDim.width + 2 * padding.x, textDim.height + 2 * padding.y);

        // Primary context translates to start at the (0,0) for the padding
        const ctxconfig = ctx => {
            ctx.translate(padding.x, padding.y);
        };

        this.withCtx(ctxconfig, ctx => {
            // Draw the text background
            switch (background) {
                case 'outline':
                    this.strokeText(lines, font, fontSize, alignment, textDim);
                    break;
                case 'circle':
                    this.renderBackgroundCircle(textDim, TEXT_PADDING);
                    break;
                case 'rectangle':
                    this.renderBackgroundRectangle(textDim, TEXT_PADDING);
                    break;
            }

            // Useful for debugging, draws the BBox of the text
            // renderTextBBox(textBB); 

            // Finally render the desired label on the background
            this.fillText(lines, font, fontSize, alignment, textDim);
        });
    }

    renderArrow(shaftWidth, shaftLength, fletchWidth, arrowWidth, arrowLength) {
        const midY = fletchWidth / 2;
        const outerX = fletchWidth / 4;
        const outerXCP = fletchWidth / 4;
        const shaftStartX = fletchWidth / 2 + outerXCP;
        const halfThick = shaftWidth / 2;
        const shaftStopX = shaftStartX + shaftLength;

        const strokeHeight = Math.max(arrowWidth, fletchWidth);
        const strokeWidth = shaftStopX + (3 / 4) * arrowLength;
        const startX = BACKGROUND_STROKE_WIDTH / 2;
        const startY = BACKGROUND_STROKE_WIDTH / 2 + Math.max(0, (arrowWidth - fletchWidth) / 2);

        // Resize the canvas to fit the final image exactly
        this.resize(strokeWidth + BACKGROUND_STROKE_WIDTH, strokeHeight + BACKGROUND_STROKE_WIDTH);

        const ctxconfig = ctx => {
            ctx.translate(startX, startY);
            ctx.strokeStyle = 'rgba(255,255,255,1)';
            ctx.lineWidth = BACKGROUND_STROKE_WIDTH;
            ctx.lineJoin = 'round';
            ctx.fillStyle = '#000000';
        };

        this.withCtx(ctxconfig, ctx => {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            // Back and lower fletch
            ctx.quadraticCurveTo(10, midY, outerX, midY);
            ctx.quadraticCurveTo(10, midY, 0, 2 * midY);

            ctx.quadraticCurveTo(outerXCP, midY + halfThick, shaftStartX, midY + halfThick);

            ctx.lineTo(shaftStopX, midY + halfThick);

            //arrow head
            ctx.lineTo(shaftStopX - (arrowLength / 4), midY + arrowWidth / 2);
            ctx.lineTo(shaftStopX + (arrowLength * (3 / 4)), midY);
            ctx.lineTo(shaftStopX - (arrowLength / 4), midY - arrowWidth / 2);


            ctx.lineTo(shaftStopX, midY - halfThick);

            ctx.lineTo(shaftStartX, midY - halfThick);
            ctx.quadraticCurveTo(outerXCP, midY - halfThick, 0, 0);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        });
    }
}

/**
 * Access helper for the input fields.
 */
class Inputs {
    text() {
        let text = document.getElementById('source').value;
        let lines = text.split('\n');
        return lines.map(line => line.trim());
    }

    alignment() {
        return document.querySelector('.radio-alignment:checked').value;
    }

    background() {
        return document.querySelector('.radio-background:checked').value;
    }

    font() {
        return document.getElementById('font').value;
    }
}

/**
 * Main program entry point. Sets up event handlers.
 */
function main() {
    const inputs = new Inputs();
    const measurer = new TextMeasurer();
    const renderer = new Renderer(measurer);

    const updateLabel = () => {
        renderer.renderLabel(
            inputs.text(),
            inputs.font(),
            FONT_SIZE,
            inputs.alignment(),
            inputs.background()
        );
    };

    let source = document.getElementById('source');
    source.addEventListener('keyup', updateLabel);

    let fonts = document.getElementById('font');
    const onFontChange = () => {
        let fonts = document.getElementById('font');
        font.style.fontFamily = `'${inputs.font()}'`;
        updateLabel();
    };
    fonts.addEventListener('change', onFontChange);

    let link = document.getElementById('download');
    link.addEventListener('click', e => {

        var dataURL = renderer.toDataURL();
        link.href = dataURL;

        let words = document.getElementById('source').value;
        link.setAttribute('download', words + '.png');
    });

    let alignments = document.getElementsByName('alignment');
    alignments.forEach(radio => {
        radio.addEventListener('change', updateLabel);
    });

    let backgrounds = document.getElementsByName('background');
    backgrounds.forEach(radio => {
        radio.addEventListener('change', updateLabel);
    });

    onFontChange(); // Init the font picker font.
}


document.addEventListener("DOMContentLoaded", main);