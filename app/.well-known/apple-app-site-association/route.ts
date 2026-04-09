import { NextResponse } from 'next/server';

/**
 * Universal Links (iOS). Set APPLE_DEVELOPER_TEAM_ID (10 characters).
 * appID format: {TEAMID}.{bundleId}, e.g. ABCDE12345.com.adisplatforms.buscadis
 */
export async function GET() {
  const teamId = process.env.APPLE_DEVELOPER_TEAM_ID?.trim();
  const bundleId =
    process.env.IOS_APP_BUNDLE_ID?.trim() || 'com.adisplatforms.buscadis';

  const details =
    teamId && teamId.length >= 10
      ? [
          {
            appID: `${teamId}.${bundleId}`,
            paths: ['*'],
          },
        ]
      : [];

  const body = {
    applinks: {
      apps: [],
      details,
    },
  };

  return NextResponse.json(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
