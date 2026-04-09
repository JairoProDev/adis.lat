import { NextResponse } from 'next/server';

/**
 * Android App Links verification.
 * Set ANDROID_APP_LINKS_SHA256 to one or more SHA-256 fingerprints (comma-separated),
 * e.g. from Play Console → App signing → App signing key certificate.
 */
export async function GET() {
  const raw = process.env.ANDROID_APP_LINKS_SHA256 ?? '';
  const sha256_cert_fingerprints = raw
    .split(',')
    .map((s) => s.trim().replace(/\s+/g, ''))
    .filter(Boolean);

  const body = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: process.env.ANDROID_APP_PACKAGE_NAME || 'com.adisplatforms.buscadis',
        sha256_cert_fingerprints,
      },
    },
  ];

  return NextResponse.json(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
