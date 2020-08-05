const TEXT_PADDING = 16;
const LINE_SKIP = 6;
const BACKGROUND_STROKE_WIDTH = 16;
const FONT_SIZE = '80px';
const LETTER_FONT_SIZE = '16pt';

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

        this.setColors("#000000", "#ffffff");
    }

    // https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
    pSBC(p, c0, c1, l) {
        let r, g, b, P, f, t, h, i = parseInt,
            m = Math.round,
            a = typeof(c1) == "string";
        if (typeof(p) != "number" || p < -1 || p > 1 || typeof(c0) != "string" || (c0[0] != 'r' && c0[0] != '#') || (c1 && !a)) return null;
        if (!this.pSBCr) this.pSBCr = (d) => {
            let n = d.length,
                x = {};
            if (n > 9) {
                [r, g, b, a] = d = d.split(","), n = d.length;
                if (n < 3 || n > 4) return null;
                x.r = i(r[3] == "a" ? r.slice(5) : r.slice(4)), x.g = i(g), x.b = i(b), x.a = a ? parseFloat(a) : -1
            } else {
                if (n == 8 || n == 6 || n < 4) return null;
                if (n < 6) d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (n > 4 ? d[4] + d[4] : "");
                d = i(d.slice(1), 16);
                if (n == 9 || n == 5) x.r = d >> 24 & 255, x.g = d >> 16 & 255, x.b = d >> 8 & 255, x.a = m((d & 255) / 0.255) / 1000;
                else x.r = d >> 16, x.g = d >> 8 & 255, x.b = d & 255, x.a = -1
            }
            return x
        };
        h = c0.length > 9, h = a ? c1.length > 9 ? true : c1 == "c" ? !h : false : h, f = this.pSBCr(c0), P = p < 0, t = c1 && c1 != "c" ? this.pSBCr(c1) : P ? { r: 0, g: 0, b: 0, a: -1 } : { r: 255, g: 255, b: 255, a: -1 }, p = P ? p * -1 : p, P = 1 - p;
        if (!f || !t) return null;
        if (l) r = m(P * f.r + p * t.r), g = m(P * f.g + p * t.g), b = m(P * f.b + p * t.b);
        else r = m((P * f.r ** 2 + p * t.r ** 2) ** 0.5), g = m((P * f.g ** 2 + p * t.g ** 2) ** 0.5), b = m((P * f.b ** 2 + p * t.b ** 2) ** 0.5);
        a = f.a, t = t.a, f = a >= 0 || t >= 0, a = f ? a < 0 ? t : t < 0 ? a : a * P + t * p : 0;
        if (h) return "rgb" + (f ? "a(" : "(") + r + "," + g + "," + b + (f ? "," + m(a * 1000) / 1000 : "") + ")";
        else return "#" + (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0)).toString(16).slice(1, f ? undefined : -2)
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

    setColors(fgcolor, bgcolor) {
        this.fgcolor = fgcolor;
        this.bgcolor = bgcolor;
        this.bordercolor = fgcolor + '7f';
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
            ctx.strokeStyle = this.bgcolor;
            ctx.lineWidth = BACKGROUND_STROKE_WIDTH;
            ctx.lineJoin = 'round';
            ctx.miterLimit = 3;
            ctx.fillStyle = this.fgcolor;
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
            ctx.strokeStyle = this.bordercolor;
            ctx.lineWidth = BACKGROUND_STROKE_WIDTH;
            ctx.fillStyle = this.bgcolor;
            ctx.lineJoin = 'miter';
        };
        this.withCtx(ctxconfig, ctx => {
            ctx.strokeRect(-1 * padding, -1 * padding, textBB.width + 2 * padding, textBB.height + 2 * padding);
            ctx.fillRect(-1 * padding, -1 * padding, textBB.width + 2 * padding, textBB.height + 2 * padding);
        });
    }

    renderBackgroundLetter(textBB, padding, background) {
        const ctxconfig = ctx => {
            ctx.fillStyle = this.bgcolor;
            ctx.lineJoin = 'miter';
        };
        this.withCtx(ctxconfig, ctx => {
            ctx.fillRect(-1 * padding - 0.5 * BACKGROUND_STROKE_WIDTH, -1 * padding - 0.5 * BACKGROUND_STROKE_WIDTH,
                textBB.width + 2 * padding + BACKGROUND_STROKE_WIDTH, textBB.height + 2 * padding + BACKGROUND_STROKE_WIDTH);
        });

        if (background === 'letter_dirty') {
            // Generate a dirty background by randomly putting down darkened blobs
            const smearctxconfig = ctx => {
                const smearColor = this.pSBC(-0.30, this.bgcolor); // darken by 30%
                ctx.fillStyle = smearColor;
                ctx.lineJoin = 'miter';
                ctx.globalCompositionOperation = 'burn';
                ctx.globalAlpha = 0.1
            }

            const randInt = (max) => Math.floor(Math.random() * Math.floor(max));
            const randomCoord = () => {
                return {
                    x: randInt(textBB.width),
                    y: randInt(textBB.height),
                }
            };
            this.withCtx(smearctxconfig, ctx => {
                const intensity = Math.floor((textBB.width * textBB.height) / 100);
                const maxRadius = Math.min(textBB.width, textBB.height) / 8;
                for (let i = 0; i < intensity; i++) {
                    const center = randomCoord();

                    const radius = Math.max(1, randInt(maxRadius));
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
                    ctx.fill();
                }
            });
        }

    }

    renderBackgroundCircle(textBB, padding) {
        const ctxconfig = ctx => {
            ctx.strokeStyle = this.bordercolor;
            ctx.lineWidth = BACKGROUND_STROKE_WIDTH;
            ctx.fillStyle = this.bgcolor;
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
            case 'letter':
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
                case 'letter_dirty':
                case 'letter_clean':
                    this.renderBackgroundLetter(textDim, TEXT_PADDING, background);
                    break;
            }

            // Useful for debugging, draws the BBox of the text
            // renderTextBBox(textBB); 

            // Finally render the desired label on the background
            this.fillText(lines, font, fontSize, alignment, textDim);
        });
    }

    renderArrow(shaftWidth, arrowLength, fletchWidth, headWidth) {
        const midY = fletchWidth / 2;
        const outerX = fletchWidth / 4;
        const outerXCP = fletchWidth / 4;
        const shaftStartX = fletchWidth / 2 + outerXCP;
        const halfThick = shaftWidth / 2;

        const headLength = (4 / 3) * headWidth

        const shaftStopX = arrowLength - (3 / 4) * headLength;

        const strokeHeight = Math.max(headWidth, fletchWidth);
        const strokeWidth = shaftStopX + (3 / 4) * headLength;
        const startX = BACKGROUND_STROKE_WIDTH / 2;
        const startY = BACKGROUND_STROKE_WIDTH / 2 + Math.max(0, (headWidth - fletchWidth) / 2);

        // Resize the canvas to fit the final image exactly
        this.resize(strokeWidth + BACKGROUND_STROKE_WIDTH, strokeHeight + BACKGROUND_STROKE_WIDTH);

        const ctxconfig = ctx => {
            ctx.translate(startX, startY);
            ctx.strokeStyle = this.bgcolor;
            ctx.lineWidth = BACKGROUND_STROKE_WIDTH;
            ctx.lineJoin = 'round';
            ctx.fillStyle = this.fgcolor;
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
            ctx.lineTo(shaftStopX - (headLength / 4), midY + headWidth / 2);
            ctx.lineTo(shaftStopX + (headLength * (3 / 4)), midY);
            ctx.lineTo(shaftStopX - (headLength / 4), midY - headWidth / 2);


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

    tab() {
        return document.querySelector('.tabs-control-radio:checked').value;
    }

    text() {
        let text = document.getElementById('source').value;
        let lines = text.split('\n');
        return lines.map(line => line.trim());
    }

    letter() {
        let text = document.getElementById('source-letter').value;
        let lines = text.split('\n');
        return lines.map(line => line.trim());
    }

    fgcolor() {
        return document.getElementById('fgcolor').value;
    }

    bgcolor() {
        return document.getElementById('bgcolor').value;
    }

    alignment() {
        return document.querySelector('.radio-alignment:checked').value;
    }

    letteralignment() {
        return document.querySelector('.radio-alignment-letter:checked').value;
    }

    background() {
        return document.querySelector('.radio-background:checked').value;
    }

    font() {
        return document.getElementById('font').value;
    }

    letterfont() {
        return document.getElementById('font-letter').value;
    }

    letterdirtybackground() {
        return document.getElementById('letter-background').checked;
    }

    arrowLength() {
        return parseInt(document.getElementById('arrowLength').value);
    }

    arrowShaftWidth() {
        return parseInt(document.getElementById('arrowWidth').value);
    }

    arrowFletchWidth() {
        return parseInt(document.getElementById('arrowFletchWidth').value);
    }

    arrowHeadWidth() {
        return parseInt(document.getElementById('arrowHeadWidth').value);
    }
    arrowHeadLength() {
        return parseInt(document.getElementById('arrowHeadLength').value);
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

    const updateLetter = () => {
        const background = inputs.letterdirtybackground() ? 'letter_dirty' : 'letter_clean';
        renderer.renderLabel(
            inputs.letter(),
            inputs.letterfont(),
            LETTER_FONT_SIZE,
            inputs.letteralignment(),
            background
        );
    }

    const updateArrow = () => {
        renderer.renderArrow(
            inputs.arrowShaftWidth(),
            inputs.arrowLength(), inputs.arrowFletchWidth(), inputs.arrowHeadWidth());
    }

    const inputUpdateHandler = e => {
        renderer.setColors(inputs.fgcolor(), inputs.bgcolor());
        switch (inputs.tab()) {
            case "label":
                return updateLabel();
            case "letter":
                return updateLetter();
            case "arrow":
                return updateArrow();
        }
    };

    document.querySelectorAll('#input input,#input textarea,#input select').forEach(input => {
        input.addEventListener('input', inputUpdateHandler);
    });


    const onFontChange = () => {
        let fontElements = document.querySelectorAll('.fontselect');
        fontElements.forEach(elem => {
            elem.style.fontFamily = `'${elem.value}'`;
        });
    };
    document.querySelectorAll('.fontselect').forEach(elem => elem.addEventListener('change', onFontChange));

    const updateSliderValue = input => {
        let output = input.parentElement.querySelector('.sliderOutput');
        output.textContent = input.value;
    }

    const onSliderUpdate = e => {
        let input = e.target;
        updateSliderValue(input);
    };

    document.querySelectorAll('.sliderinput input').forEach(slider => {
        slider.addEventListener('input', onSliderUpdate)
        updateSliderValue(slider);
    });


    const filename = () => {
        switch (inputs.tab()) {
            case "arrow":
                let length = inputs.arrowLength();
                return "arrow_" + length + "px.png";

            case "label":
                let lines = inputs.text();
                return lines.join("_") + ".png";
        }
    }

    let link = document.getElementById('download');
    link.addEventListener('click', e => {

        var dataURL = renderer.toDataURL();
        link.href = dataURL;
        link.setAttribute('download', filename());
    });


    onFontChange(); // Init the font picker font.
    inputUpdateHandler();
}


document.addEventListener("DOMContentLoaded", main);