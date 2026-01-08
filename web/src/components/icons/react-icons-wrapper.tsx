/**
 * Wrapper component for react-icons to ensure consistent sizing with PatternFly icons
 */
import * as React from 'react';
import { IconBaseProps, IconType } from 'react-icons';

export interface IconWrapperProps extends Omit<IconBaseProps, 'size'> {
  icon: IconType;
  size?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wrapper component that ensures react-icons match PatternFly icon sizing
 * PatternFly icons default to 1em, so we maintain that for consistency
 */
export const IconWrapper: React.FC<IconWrapperProps> = ({ icon: Icon, size = '1em', className, style, ...props }) => {
  // IconType from react-icons is compatible but TypeScript needs explicit casting
  const IconComponent = Icon as React.ComponentType<IconBaseProps>;
  return <IconComponent size={size} className={className} style={style} {...props} />;
};
