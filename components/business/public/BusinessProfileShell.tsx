'use client';

import { isProfileBlocksV2Enabled } from '@/lib/business/feature-flags';
import BusinessPublicViewLegacy from '@/components/business/BusinessPublicViewLegacy';
import BusinessProfileShellV2 from './BusinessProfileShellV2';
import type { BusinessProfileShellProps } from './BusinessProfileShell.types';

export type { BusinessProfileShellProps };

export default function BusinessProfileShell(props: BusinessProfileShellProps) {
  if (!isProfileBlocksV2Enabled()) {
    return <BusinessPublicViewLegacy {...props} />;
  }
  return <BusinessProfileShellV2 {...props} />;
}
