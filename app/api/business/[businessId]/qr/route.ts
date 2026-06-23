import { NextRequest, NextResponse } from 'next/server';
import { getBusinessProfileBySlug } from '@/lib/business';
import { getQrTargetUrl } from '@/lib/qr/resolve-url';
import { ensureQrCodeForBusiness, getQrByBusinessSlug } from '@/lib/qr/service';
import { generateFreeQrPng, generateFreeQrSvg } from '@/lib/qr/generate-free';
import { generateProQrPng, generateProQrSvg } from '@/lib/qr/generate-pro';
import { canUseProQr } from '@/lib/business/subscription';
import { validateQrContrast, validateQrDecodable } from '@/lib/qr/quality-gate';

/** businessId is the public business slug for this route */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;
  const slug = decodeURIComponent(businessId);
  const profile = await getBusinessProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }

  let qr = await getQrByBusinessSlug(slug);
  if (!qr) {
    qr = await ensureQrCodeForBusiness({
      businessProfileId: profile.id,
      slug: profile.slug,
      themeColor: profile.theme_color,
    });
  }
  if (!qr) {
    return NextResponse.json({ error: 'No se pudo generar el QR' }, { status: 500 });
  }

  const targetUrl = getQrTargetUrl(qr.short_code);
  const format = req.nextUrl.searchParams.get('format') || 'png';
  const tierParam = req.nextUrl.searchParams.get('tier');
  const wantsPro = tierParam === 'pro' || qr.style_tier === 'pro';
  const usePro = wantsPro && canUseProQr(profile);

  const styleConfig = {
    ...(qr.style_config || {}),
    dotsColor: qr.style_config?.dotsColor || profile.theme_color || '#1e293b',
  };

  if (format === 'svg') {
    const svg = usePro
      ? await generateProQrSvg({
          data: targetUrl,
          styleConfig,
          logoUrl: profile.logo_url,
          skipLogo: !canUseProQr(profile),
        })
      : await generateFreeQrSvg({
          data: targetUrl,
          themeColor: profile.theme_color,
          styleConfig,
        });
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  if (format === 'pdf') {
    if (!usePro) {
      return NextResponse.json({ error: 'PDF disponible en plan Pro' }, { status: 403 });
    }
    const png = await generateProQrPng({
      data: targetUrl,
      styleConfig,
      width: 1024,
      logoUrl: profile.logo_url,
    });
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
    const pageW = doc.internal.pageSize.getWidth();
    const qrSize = 80;
    doc.addImage(dataUrl, 'PNG', (pageW - qrSize) / 2, 40, qrSize, qrSize);
    doc.setFontSize(14);
    doc.text(profile.name, pageW / 2, 130, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Escanea para ver nuestro perfil en Buscadis', pageW / 2, 140, { align: 'center' });
    const pdfBuf = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(pdfBuf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${profile.slug}-qr.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }

  const png = usePro
    ? await generateProQrPng({
        data: targetUrl,
        styleConfig,
        width: 512,
        logoUrl: profile.logo_url,
      })
    : await generateFreeQrPng({
        data: targetUrl,
        themeColor: profile.theme_color,
        styleConfig,
        withWatermark: !canUseProQr(profile),
      });

  if (usePro) {
    const contrast = validateQrContrast(
      styleConfig.dotsColor || '#0f172a',
      styleConfig.backgroundColor || '#ffffff'
    );
    if (!contrast.ok) {
      return NextResponse.json({ error: contrast.message }, { status: 422 });
    }
    const decode = await validateQrDecodable(png, targetUrl);
    if (!decode.ok) {
      return NextResponse.json({ error: decode.message }, { status: 422 });
    }
  }

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
