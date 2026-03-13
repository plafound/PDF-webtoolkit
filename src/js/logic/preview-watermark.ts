import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
import { state } from '../state.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function renderPdfPreview(pdfBytes: ArrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const page = await pdf.getPage(1);

  const scale = 1.3;
  const viewport = page.getViewport({ scale });

  const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const wmCanvas = document.getElementById('watermark-canvas') as HTMLCanvasElement;
  wmCanvas.width = viewport.width;
  wmCanvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
}

export function drawTextWatermark() {
  const wmCanvas = document.getElementById(
    'watermark-canvas'
  ) as HTMLCanvasElement;

  const ctx = wmCanvas.getContext('2d');
  if (!ctx) return;

  const text = (
    document.getElementById('watermark-text') as HTMLInputElement
  )?.value || 'PREVIEW';

  const fontSize = Number(
    (document.getElementById('font-size') as HTMLInputElement)?.value || 72
  );

  const color = (
    document.getElementById('text-color') as HTMLInputElement
  )?.value || '#000000';

  const opacity = Number(
    (document.getElementById('opacity-text') as HTMLInputElement)?.value || 0.3
  );

  const angle = Number(
    (document.getElementById('angle-text') as HTMLInputElement)?.value || 0
  );

  // 1️⃣ bersihkan canvas
  ctx.clearRect(0, 0, wmCanvas.width, wmCanvas.height);

  // 2️⃣ SET FONT SEBELUM measureText
  ctx.font = `${fontSize}px Arial`;

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight =
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  // 3️⃣ transform
  ctx.save();
  ctx.translate(wmCanvas.width / 2, wmCanvas.height / 2);
  ctx.rotate((-angle * Math.PI) / 180);

  // 4️⃣ style
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;

  // 5️⃣ draw text (center manual)
  ctx.fillText(text, -textWidth / 2, textHeight / 2);

  ctx.restore();
}

export function drawImageWatermark() {
  const wmCanvas = document.getElementById('watermark-canvas') as HTMLCanvasElement;
  const ctx = wmCanvas?.getContext('2d');
  if (!ctx) return;

  const img = state.watermarkImageElement;
  if (!img) return;

  const opacity =
    parseFloat(
      (document.getElementById('opacity-image') as HTMLInputElement)?.value
    ) || 0.3;

  const scale =
    parseFloat(
      (document.getElementById('size-image') as HTMLInputElement)?.value
    ) || 0.5;

  ctx.clearRect(0, 0, wmCanvas.width, wmCanvas.height);

  const imgW = img.width * scale;
  const imgH = img.height * scale;

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.drawImage(
    img,
    (wmCanvas.width - imgW) / 2,
    (wmCanvas.height - imgH) / 2,
    imgW,
    imgH
  );

  ctx.restore();
}




export function setupTextWatermarkPreview() {
  const inputs = [
    'watermark-text',
    'font-size',
    'text-color',
    'opacity-text',
    'angle-text',
  ];

  inputs.forEach((id) => {
    const el = document.getElementById(id);
    el?.addEventListener('input', drawTextWatermark);
  });

  // render awal
  drawTextWatermark();
}

export function setupImageWatermarkPreview() {
  ['opacity-image', 'size-image'].forEach((id) => {
    document
      .getElementById(id)
      ?.addEventListener('input', drawImageWatermark);
  });
}

export function setupImageWatermarkLoader() {
  const input = document.getElementById(
    'image-watermark-input'
  ) as HTMLInputElement;

  input?.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      state.watermarkImageElement = img;
      drawImageWatermark(); // render awal
    };

    img.src = URL.createObjectURL(file);
  });
}
