export interface BannerTextConfig {
  content: string;
  font?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface BannerCtaConfig {
  label: string;
  action: 'whatsapp' | 'link' | 'cart' | 'contact';
  href?: string;
  style?: 'solid' | 'outline' | 'ghost';
}

export interface BannerConfig {
  mode: 'image' | 'text' | 'canvas';
  imageUrl?: string;
  text?: BannerTextConfig;
  fadeBottom?: boolean;
  cta?: BannerCtaConfig;
}
