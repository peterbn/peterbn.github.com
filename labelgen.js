function updatePreview() {
    let words = document.getElementById('source').value;
    renderCanvasText(words);

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
    ctx.textBaseline = 'top';
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 6;
    ctx.miterLimit = 4;
    ctx.fillStyle = '#000000'
}

function renderCanvasText(text) {
    const TEXT_PADDING = 15;
    let renderer = document.getElementById('renderer');
    let ctx = renderer.getContext('2d');
    initTextRender(ctx);
    let dims = ctx.measureText(text);
    let textWidth = Math.ceil(Math.abs(dims.actualBoundingBoxLeft) + Math.abs(dims.actualBoundingBoxRight));
    let textHeight = Math.ceil(Math.abs(dims.actualBoundingBoxAscent) + Math.abs(dims.actualBoundingBoxDescent));

    // resize the output renderer to fit the text
    renderer.setAttribute('width', textWidth + 2 * TEXT_PADDING);
    renderer.setAttribute('height', textHeight + 2 * TEXT_PADDING);

    // re-init the context
    initTextRender(ctx);

    ctx.strokeText(text, TEXT_PADDING + dims.actualBoundingBoxLeft, TEXT_PADDING + dims.actualBoundingBoxAscent);
    ctx.fillText(text, TEXT_PADDING + dims.actualBoundingBoxLeft, TEXT_PADDING + dims.actualBoundingBoxAscent);

}

document.addEventListener("DOMContentLoaded", function() {
    let source = document.getElementById('source');
    source.addEventListener('keyup', updatePreview);

    let fonts = document.getElementById('font');
    fonts.addEventListener('change', updatePreview);

    let link = document.getElementById('download');
    link.addEventListener('click', e => {
        let self = this;
        let canvas = document.getElementById("renderer");
        var dataURL = canvas.toDataURL('image/png');
        link.href = dataURL;

        let words = document.getElementById('source').value;
        link.setAttribute('download', words + '.png');
    });

});