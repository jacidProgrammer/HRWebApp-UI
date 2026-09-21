import { EyeOff } from 'lucide-react';
import { avatarColorIndex, initials } from '../../lib/colors';
import './Avatar.css';

interface AvatarProps {
  name: string;
  /** Anything stable for the person (id or username), so the colour survives a rename. */
  seed?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Anonymous author: a neutral avatar with an icon instead of initials. */
  anonymous?: boolean;
}

/** Initials on a deterministic colour. Decorative: the name is always shown next to it. */
export function Avatar({ name, seed, size = 'md', anonymous = false }: AvatarProps) {
  if (anonymous) {
    return (
      <span className={`avatar avatar--${size} avatar--anonymous`} aria-hidden="true">
        <EyeOff className="avatar__icon" />
      </span>
    );
  }
  return (
    <span className={`avatar avatar--${size} avatar--c${avatarColorIndex(seed ?? name)}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
