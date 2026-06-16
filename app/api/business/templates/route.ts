import { NextResponse } from 'next/server';
import { PAGE_TEMPLATES } from '@/lib/business/templates/registry';

export async function GET() {
  const templates = PAGE_TEMPLATES.map((t) => ({
    id: t.id,
    label: t.label,
    description: t.description,
    paradigm: t.paradigm,
    heroVariant: t.heroVariant,
    suggestedTheme: t.suggestedTheme,
    industryPack: t.industryPack,
    thumbnailGradient: t.thumbnailGradient,
    filters: t.filters,
  }));
  return NextResponse.json({ templates });
}
