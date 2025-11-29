declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';

  export interface LucideIconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }

  export type LucideIcon = ComponentType<LucideIconProps>;

  // Export all the icons as LucideIcon components
  export const Globe: LucideIcon;
  export const Copy: LucideIcon;
  export const Check: LucideIcon;
  export const Eye: LucideIcon;
  export const Users: LucideIcon;
  export const AlertCircle: LucideIcon;
}