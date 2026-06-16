import type { BusinessProfile } from '@/types/business';
import type { Adiso } from '@/types';

export interface BusinessProfileShellProps {
  profile: Partial<BusinessProfile> | null;
  adisos?: Adiso[];
  catalogProducts?: { id: string; updated_at?: string; images?: unknown }[];
  isPreview?: boolean;
  onEditPart?: (part: string) => void;
  editMode?: boolean;
  onUpdate?: (field: keyof BusinessProfile, value: unknown) => void;
  onEditProduct?: (product: Adiso) => void;
  chatbotMinimized?: boolean;
  onToggleChatbot?: () => void;
}
