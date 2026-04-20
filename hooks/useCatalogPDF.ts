'use client';

/**
 * 📄 useCatalogPDF — Catálogo PDF (jsPDF).
 * Título y descripción se dibujan línea a línea con la misma métrica que la altura de la tarjeta
 * para evitar solapes. Imagen contenida en el slot (clip o escala) sin invadir el texto.
 */

import { useState, useCallback } from 'react';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';

interface PDFOptions {
  includeImages?: boolean;
  includeDescription?: boolean;
  productsPerPage?: number;
  orientation?: 'portrait' | 'landscape';
  layoutMode?: 'grid' | 'feed' | 'list';
}

const PLACEHOLDER_IMG_H_MM = 18;
const MAX_FEED_IMAGE_H_MM = 95;
const MAX_GRID_ROW_IMAGE_H_MM = 48;
const GAP_AFTER_IMAGE_MM = 3;
const GAP_BEFORE_DESC_MM = 1.5;
const PRICE_ROW_MM = 7;
const CARD_TOP_PAD_MM = 2;
const CARD_BOTTOM_PAD_MM = 4;

type ProductMeasure = {
  imgData: string | null;
  naturalImgH: number;
  titleLines: string[];
  descLines: string[];
};

function titleLineHeightMm(isFeed: boolean): number {
  return isFeed ? 4.2 : 3.6;
}

function descLineHeightMm(isFeed: boolean): number {
  return isFeed ? 3.6 : 3.1;
}

/** Solo bloque texto (título + descripción + precio), sin hueco bajo la imagen */
function measureTextBodyHeight(
  m: ProductMeasure,
  includeDescription: boolean,
  isFeed: boolean,
  hasPrice: boolean
): number {
  const tLh = titleLineHeightMm(isFeed);
  const dLh = descLineHeightMm(isFeed);
  let h = m.titleLines.length * tLh + GAP_BEFORE_DESC_MM;
  if (includeDescription && m.descLines.length > 0) {
    h += m.descLines.length * dLh;
  }
  h += hasPrice ? PRICE_ROW_MM : 2;
  return h;
}

function computeCardHeight(
  includeImages: boolean,
  imageSlotH: number,
  textBodyH: number
): number {
  const gapUnderImg =
    includeImages && imageSlotH > 0 ? GAP_AFTER_IMAGE_MM : 0;
  return CARD_TOP_PAD_MM + imageSlotH + gapUnderImg + textBodyH + CARD_BOTTOM_PAD_MM;
}

export function useCatalogPDF() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generatePDF = useCallback(async (
    profile: Partial<BusinessProfile>,
    products: Adiso[],
    options: PDFOptions = {}
  ) => {
    const {
      includeImages = true,
      includeDescription = true,
      orientation = 'portrait',
      layoutMode = 'grid',
    } = options;

    setGenerating(true);
    setProgress(5);

    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;

      setProgress(10);

      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      const pageW = orientation === 'portrait' ? 210 : 297;
      const pageH = orientation === 'portrait' ? 297 : 210;
      const margin = 14;
      const contentW = pageW - margin * 2;
      const pageContentBottom = pageH - 24;

      const brandHex = profile.theme_color || '#3c6997';
      const brandRgb = hexToRgb(brandHex) || { r: 60, g: 105, b: 151 };

      doc.setFillColor(brandRgb.r, brandRgb.g, brandRgb.b);
      doc.rect(0, 0, pageW, 55, 'F');

      let logoLoaded = false;
      if (profile.logo_url && includeImages) {
        try {
          const logoData = await loadImageAsBase64(profile.logo_url);
          if (logoData) {
            doc.addImage(logoData, 'JPEG', margin, 8, 35, 35, undefined, 'FAST');
            logoLoaded = true;
          }
        } catch {
          // skip
        }
      }

      const nameX = logoLoaded ? margin + 40 : margin;

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(profile.name || 'Catálogo', nameX, 24);

      if (profile.description) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(profile.description.substring(0, 120), contentW - (logoLoaded ? 40 : 0));
        doc.text(descLines.slice(0, 2), nameX, 33);
      }

      let contactY = 43;
      doc.setFontSize(8);
      if (profile.contact_phone) {
        doc.text(`Tel: ${profile.contact_phone}`, nameX, contactY);
        contactY += 5;
      }
      if (profile.contact_address) {
        doc.text(`Dir: ${profile.contact_address}`, nameX, contactY);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('CATÁLOGO DE PRODUCTOS', pageW - margin, 18, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(220, 230, 255);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, pageW - margin, 25, { align: 'right' });
      doc.text(`${products.length} productos`, pageW - margin, 31, { align: 'right' });

      setProgress(20);

      const isFeedLayout = layoutMode === 'feed';
      const isListMode = layoutMode === 'list';
      const cols = isFeedLayout ? 1 : orientation === 'landscape' ? 4 : 3;
      const cardW = isFeedLayout ? contentW : (contentW - (cols - 1) * 4) / cols;
      const innerW = cardW - 2;

      let currentY = 65;
      let pageNum = 1;

      const drawContinuationHeader = () => {
        doc.setFillColor(brandRgb.r, brandRgb.g, brandRgb.b);
        doc.rect(0, 0, pageW, 14, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(profile.name || 'Catálogo', margin, 9);
        doc.text('CATALOGO', pageW - margin, 9, { align: 'right' });
      };

      const newPage = () => {
        drawPageFooter(doc, pageNum, pageW, pageH, profile.name || '');
        doc.addPage();
        pageNum++;
        currentY = 20;
        drawContinuationHeader();
      };

      const ensureSpace = (needH: number) => {
        while (currentY + needH > pageContentBottom) {
          newPage();
        }
      };

      const measureProduct = async (product: Adiso): Promise<ProductMeasure> => {
        let imgData: string | null = null;
        let naturalImgH = 0;

        if (includeImages) {
          const imgUrl = product.imagenesUrls?.[0] || product.imagenUrl;
          if (imgUrl) {
            try {
              imgData = await loadImageAsBase64(imgUrl);
              if (imgData) {
                naturalImgH = await naturalHeightMmForFullWidth(imgData, innerW);
              } else {
                naturalImgH = PLACEHOLDER_IMG_H_MM;
              }
            } catch {
              naturalImgH = PLACEHOLDER_IMG_H_MM;
            }
          } else {
            naturalImgH = PLACEHOLDER_IMG_H_MM;
          }
        }

        const titleFont = isFeedLayout ? 10 : 7;
        const descFont = isFeedLayout ? 7 : 5.5;
        const maxTitleLines = isFeedLayout ? 3 : 2;
        const maxDescLines = isFeedLayout ? 3 : 2;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(titleFont);
        const titleLines = doc.splitTextToSize(product.titulo || 'Producto sin titulo', innerW - 1).slice(0, maxTitleLines);

        let descLines: string[] = [];
        if (includeDescription && product.descripcion) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(descFont);
          const desc = (product.descripcion || '').replace('Precio:', '').trim().substring(0, isFeedLayout ? 200 : 85);
          descLines = doc.splitTextToSize(desc, innerW - 1).slice(0, maxDescLines);
        }

        return {
          imgData,
          naturalImgH,
          titleLines,
          descLines,
        };
      };

      const drawTextBlocks = (
        product: Adiso,
        textStartY: number,
        cardX: number,
        cardH: number,
        cardY: number,
        m: ProductMeasure
      ): void => {
        const tLh = titleLineHeightMm(isFeedLayout);
        const dLh = descLineHeightMm(isFeedLayout);
        let y = textStartY;

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(isFeedLayout ? 10 : 7);
        for (let li = 0; li < m.titleLines.length; li++) {
          doc.text(m.titleLines[li], cardX + 1.5, y);
          y += tLh;
        }

        y += GAP_BEFORE_DESC_MM;

        if (includeDescription && m.descLines.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(isFeedLayout ? 7 : 5.5);
          doc.setTextColor(100, 116, 139);
          for (let di = 0; di < m.descLines.length; di++) {
            doc.text(m.descLines[di], cardX + 1.5, y);
            y += dLh;
          }
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(isFeedLayout ? 11 : 8.5);
        if (product.precio) {
          doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b);
          const priceY = Math.min(y + 2, cardY + cardH - 2.5);
          doc.text(`S/ ${product.precio}`, cardX + 1.5, priceY);
        }
      };

      const drawProductCard = (
        product: Adiso,
        cardX: number,
        cardY: number,
        m: ProductMeasure,
        imageSlotH: number,
        cardH: number
      ) => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'FD');

        const contentTop = cardY + CARD_TOP_PAD_MM;
        let textStartY = contentTop;

        if (includeImages && imageSlotH > 0) {
          const imgUrl = product.imagenesUrls?.[0] || product.imagenUrl;
          if (m.imgData) {
            addImageInSlotSafe(doc, m.imgData, cardX + 1, contentTop, innerW, imageSlotH, m.naturalImgH);
          } else if (imgUrl) {
            drawNoImagePlaceholder(doc, cardX, contentTop, cardW, imageSlotH);
          } else {
            drawNoImagePlaceholder(doc, cardX, contentTop, cardW, imageSlotH);
          }
          textStartY = contentTop + imageSlotH + GAP_AFTER_IMAGE_MM;
        } else if (includeImages) {
          textStartY = contentTop + GAP_AFTER_IMAGE_MM;
        } else {
          textStartY = contentTop + 1;
        }

        drawTextBlocks(product, textStartY, cardX, cardH, cardY, m);
      };

      if (isListMode) {
        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          const m = await measureProduct(product);
          const slotH = m.naturalImgH;
          const textBody = measureTextBodyHeight(m, includeDescription, isFeedLayout, !!product.precio);
          const cardH = computeCardHeight(includeImages, slotH, textBody);
          ensureSpace(cardH + 3);
          drawProductCard(product, margin, currentY, m, slotH, cardH);
          currentY += cardH + 4;
          setProgress(20 + Math.round((i / products.length) * 70));
        }
      } else if (isFeedLayout) {
        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          const m = await measureProduct(product);
          const textBody = measureTextBodyHeight(m, includeDescription, true, !!product.precio);

          let slotH = Math.min(m.naturalImgH, MAX_FEED_IMAGE_H_MM);
          let cardH = computeCardHeight(includeImages, slotH, textBody);

          const shrinkToFit = () => {
            const avail = pageContentBottom - currentY;
            if (cardH <= avail) return;
            const minImg = 12;
            const gapImg = includeImages ? GAP_AFTER_IMAGE_MM : 0;
            const maxSlot = avail - CARD_TOP_PAD_MM - gapImg - textBody - CARD_BOTTOM_PAD_MM;
            slotH = Math.max(minImg, Math.min(slotH, maxSlot));
            cardH = computeCardHeight(includeImages, slotH, textBody);
          };

          shrinkToFit();
          if (cardH > pageContentBottom - currentY) {
            newPage();
            shrinkToFit();
          }

          ensureSpace(cardH + 3);
          drawProductCard(product, margin, currentY, m, slotH, cardH);
          currentY += cardH + 4;
          setProgress(20 + Math.round((i / products.length) * 70));
        }
      } else {
        for (let i = 0; i < products.length; i += cols) {
          const slice = products.slice(i, i + cols);
          const measures = await Promise.all(slice.map((p) => measureProduct(p)));

          const rawRowImg = Math.max(...measures.map((m) => m.naturalImgH));
          let rowImgSlotH = Math.min(MAX_GRID_ROW_IMAGE_H_MM, rawRowImg);

          const textBodies = measures.map((m, idx) =>
            measureTextBodyHeight(m, includeDescription, false, !!slice[idx]?.precio)
          );

          const rowHeightForSlot = (slot: number) =>
            Math.max(
              ...measures.map((_, idx) =>
                computeCardHeight(includeImages, slot, textBodies[idx])
              )
            );

          let rowH = rowHeightForSlot(rowImgSlotH);
          const spaceAvail = () => pageContentBottom - currentY;

          while (rowH > spaceAvail() && rowImgSlotH > 11) {
            rowImgSlotH -= 2;
            rowH = rowHeightForSlot(rowImgSlotH);
          }

          if (rowH > spaceAvail()) {
            newPage();
            while (rowH > spaceAvail() && rowImgSlotH > 11) {
              rowImgSlotH -= 2;
              rowH = rowHeightForSlot(rowImgSlotH);
            }
          }

          ensureSpace(rowH + 3);

          const cardHeights = measures.map((_, idx) =>
            computeCardHeight(includeImages, rowImgSlotH, textBodies[idx])
          );

          for (let col = 0; col < slice.length; col++) {
            const cardX = margin + col * (cardW + 4);
            drawProductCard(slice[col], cardX, currentY, measures[col], rowImgSlotH, cardHeights[col]);
          }

          currentY += rowH + 4;
          setProgress(20 + Math.round((i / products.length) * 70));
        }
      }

      drawPageFooter(doc, pageNum, pageW, pageH, profile.name || '');

      setProgress(95);

      const filename = `catalogo-${(profile.slug || profile.name || 'negocio').toLowerCase().replace(/\s+/g, '-')}-${new Date().toLocaleDateString('es-PE').replace(/\//g,'-')}.pdf`;
      doc.save(filename);

      setProgress(100);
      setTimeout(() => setProgress(0), 2000);

    } catch (error) {
      console.error('[useCatalogPDF] Error generando PDF:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generatePDF, generating, progress };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawNoImagePlaceholder(doc: any, x: number, y: number, w: number, h: number) {
  doc.setFillColor(241, 245, 249);
  doc.rect(x + 1, y, w - 2, h, 'F');
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('SIN FOTO', x + w / 2, y + h / 2 + 1, { align: 'center' });
}

function drawPageFooter(doc: any, pageNum: number, pageW: number, pageH: number, businessName: string) {
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageH - 10, pageW - 14, pageH - 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`${businessName} • Precios sujetos a cambios sin previo aviso`, 14, pageH - 6);
  doc.text(`Pág. ${pageNum}`, pageW - 14, pageH - 6, { align: 'right' });
}

function getImageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' {
  const mime = dataUrl.split(';')[0].toLowerCase();
  return mime.includes('png') ? 'PNG' : 'JPEG';
}

function getImageDimensionsFromDataUrl(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width || 1, height: img.height || 1 });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = dataUrl;
  });
}

async function naturalHeightMmForFullWidth(dataUrl: string, innerWmm: number): Promise<number> {
  const { width, height } = await getImageDimensionsFromDataUrl(dataUrl);
  if (width <= 0 || height <= 0) return PLACEHOLDER_IMG_H_MM;
  return innerWmm * (height / width);
}

function addImageInSlotSafe(
  doc: any,
  dataUrl: string,
  x: number,
  y: number,
  innerW: number,
  slotH: number,
  naturalHmm: number
) {
  const format = getImageFormatFromDataUrl(dataUrl);

  if (naturalHmm <= slotH + 0.05) {
    doc.addImage(dataUrl, format, x, y, innerW, naturalHmm, undefined, 'FAST');
    return;
  }

  const drawW = innerW;
  const drawH = naturalHmm;
  const offsetY = y - (drawH - slotH) / 2;

  const canClip =
    typeof doc.saveGraphicsState === 'function' &&
    typeof doc.clip === 'function' &&
    typeof doc.restoreGraphicsState === 'function';

  if (canClip) {
    try {
      doc.saveGraphicsState();
      doc.rect(x, y, innerW, slotH);
      doc.clip();
      doc.addImage(dataUrl, format, x, offsetY, drawW, drawH, undefined, 'FAST');
      return;
    } catch {
      // continuar con escala segura
    } finally {
      doc.restoreGraphicsState();
    }
    addImageScaledToSlot(doc, dataUrl, format, x, y, innerW, slotH, naturalHmm);
    return;
  }

  addImageScaledToSlot(doc, dataUrl, format, x, y, innerW, slotH, naturalHmm);
}

/** Escala uniforme para caber en innerW×slotH, alineada arriba (sin deformar). */
function addImageScaledToSlot(
  doc: any,
  dataUrl: string,
  format: 'PNG' | 'JPEG',
  x: number,
  y: number,
  innerW: number,
  slotH: number,
  naturalHmm: number
) {
  let drawW = innerW;
  let drawH = naturalHmm;
  if (drawH > slotH) {
    const s = slotH / drawH;
    drawW *= s;
    drawH = slotH;
  }
  const ox = x + (innerW - drawW) / 2;
  doc.addImage(dataUrl, format, ox, y, drawW, drawH, undefined, 'FAST');
}
