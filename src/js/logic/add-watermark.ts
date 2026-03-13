import { showLoader, hideLoader, showAlert } from '../ui.js';
import {
  downloadFile,
  readFileAsArrayBuffer,
  hexToRgb,
} from '../utils/helpers.js';
import { state, resetState } from '../state.js';

import {
  PDFDocument as PDFLibDocument,
  rgb,
  degrees,
  StandardFonts,
  pushGraphicsState,
  popGraphicsState,
  rotateDegrees,
  translate,
} from 'pdf-lib';

import { drawImageWatermark, drawTextWatermark, renderPdfPreview, setupImageWatermarkLoader, setupImageWatermarkPreview, setupTextWatermarkPreview } from './preview-watermark.js';
import { font } from 'pdfkit';

export function setupWatermarkUI() {
  // 1. Ambil elemen
  const watermarkTypeRadios = document.querySelectorAll<HTMLInputElement>(
    'input[name="watermark-type"]'
  );

  const textOptions = document.getElementById('text-watermark-options');
  const imageOptions = document.getElementById('image-watermark-options');

  if (!textOptions || !imageOptions) return;

  // 2. Toggle Text / Image
  watermarkTypeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.value === 'text') {
        textOptions.classList.remove('hidden');
        imageOptions.classList.add('hidden');
        drawTextWatermark();
      } else {
        textOptions.classList.add('hidden');
        imageOptions.classList.remove('hidden');
        drawImageWatermark();
      }
    });
  });

  // 3. Update slider TEXT
  const opacityText = document.getElementById('opacity-text') as HTMLInputElement;
  const opacityValueText = document.getElementById('opacity-value-text');

  opacityText?.addEventListener('input', () => {
    if (opacityValueText) {
      opacityValueText.textContent = opacityText.value;
    }
  });

  const angleText = document.getElementById('angle-text') as HTMLInputElement;
  const angleValueText = document.getElementById('angle-value-text');

  angleText?.addEventListener('input', () => {
    if (angleValueText) {
      angleValueText.textContent = angleText.value;
    }
  });

  // 4. Update slider IMAGE
  const opacityImage = document.getElementById('opacity-image') as HTMLInputElement;
  const opacityValueImage = document.getElementById('opacity-value-image');

  opacityImage?.addEventListener('input', () => {
    if (opacityValueImage) {
      opacityValueImage.textContent = opacityImage.value;
    }
    drawImageWatermark(); // 🔥 redraw aman
  });

  const sizeImage = document.getElementById('size-image') as HTMLInputElement;
  const sizeValueImage = document.getElementById('size-value-image');

  sizeImage?.addEventListener('input', () => {
    if (sizeValueImage) {
      sizeValueImage.textContent = sizeImage.value;
    }
    drawImageWatermark(); // 🔥 redraw aman
  });


  // 5. Load IMAGE watermark ke STATE (INI PENTING)
  const imageInput = document.getElementById(
    'image-watermark-input'
  ) as HTMLInputElement;

  imageInput?.addEventListener('change', async () => {
    const file = imageInput.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();

    state.watermarkImageBytes = buffer;
    state.watermarkImageType = file.type;

    drawImageWatermark(); // refresh preview
  });


  const processBtn = document.getElementById(
    'process-btn'
  ) as HTMLButtonElement | null;
}


export async function addWatermark() {
  const watermarkType = (
    document.querySelector(
      'input[name="watermark-type"]:checked'
    ) as HTMLInputElement
  ).value;

  showLoader('Adding watermark...');

  try {
    const pages = state.pdfDoc.getPages();
    let watermarkAsset = null;

    if (watermarkType === 'text') {
      watermarkAsset = await state.pdfDoc.embedFont(StandardFonts.Helvetica);
    } else {
      // 'image'

      if (!state.watermarkImageBytes || !state.watermarkImageType) {
        throw new Error('No watermark image loaded.');
      }

      if (state.watermarkImageType === 'image/png') {
        watermarkAsset = await state.pdfDoc.embedPng(
          state.watermarkImageBytes
        );
      } else if (state.watermarkImageType === 'image/jpeg') {
        watermarkAsset = await state.pdfDoc.embedJpg(
          state.watermarkImageBytes
        );
      } else {
        throw new Error('Unsupported image type.');
      }

    }

    for (const page of pages) {
      const { width, height } = page.getSize();

      if (watermarkType === 'text') {
        // @ts-expect-error TS(2339) FIXME: Property 'value' does not exist on type 'HTMLEleme... Remove this comment to see the full error message
        const text = document.getElementById('watermark-text').value;
        if (!text.trim())
          throw new Error('Please enter text for the watermark.');

        const fontSize =
          parseFloat(
            (document.getElementById('font-size') as HTMLInputElement).value
          ) || 72;
        const angle =
          parseFloat(
            (document.getElementById('angle-text') as HTMLInputElement).value
          ) || 0;
        const opacity =
          parseFloat(
            (document.getElementById('opacity-text') as HTMLInputElement).value
          ) || 0.3;
        const colorHex = (
          document.getElementById('text-color') as HTMLInputElement
        ).value;
        const textColor = hexToRgb(colorHex);
        const sizefont = fontSize-20;
        const textWidth = watermarkAsset.widthOfTextAtSize(text, sizefont);
        const textHeight = sizefont;

        page.pushOperators(
          pushGraphicsState(),
          translate(width / 2, height / 2),
          rotateDegrees(angle)
        );

        page.drawText(text, {
          x: -textWidth/2,
          y: -textHeight/4,
          font: watermarkAsset,
          size: sizefont,
          color: rgb(textColor.r, textColor.g, textColor.b),
          opacity,
        });
        page.pushOperators(
          popGraphicsState()
        );

        // console.log(opacity, size, angle);
      } else {
        const opacity =
          parseFloat(
            (document.getElementById('opacity-image') as HTMLInputElement).value
          ) || 0.3;

        const scale = parseFloat(
          (document.getElementById('size-image') as HTMLInputElement).value
        ) || 0.5;

        const ukuranwatermark = scale - 0.1;
        const imgWidth = watermarkAsset.width * ukuranwatermark;
        const imgHeight = watermarkAsset.height * ukuranwatermark;

        page.drawImage(watermarkAsset, {
          x: (width - imgWidth) / 2,
          y: (height - imgHeight) / 2,
          width: imgWidth,
          height: imgHeight,
          opacity: opacity,
        });
      }
    }

    const newPdfBytes = await state.pdfDoc.save();
    downloadFile(
      new Blob([newPdfBytes], { type: 'application/pdf' }),
      'watermarked.pdf'
    );

    const toolid = state.activeTool;
    resetState();
    if (toolid) {
      const element = document.querySelector(
        `[data-tool-id="${toolid}"]`
      ) as HTMLElement;
      if (element) element.click();
    }
  } catch (e) {
    console.error(e);
    showAlert(
      'Error',
      e.message || 'Could not add the watermark. Please check your inputs.'
    );
  } finally {
    hideLoader();
  }
}
