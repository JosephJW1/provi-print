import React from 'react';

export interface ProtectedDesignPreviewProps {
  previewUrl: string;
  altText: string;
  className?: string;
  imgClassName?: string;
  imgStyle?: React.CSSProperties;
  fallbackText?: string;
}

/**
 * Displays a low-resolution watermarked design preview with multi-layered
 * browser interaction guards (right-click block, drag block, user-select disabled,
 * pointer-events disabled on <img>, and an invisible full-coverage shield overlay).
 */
export const ProtectedDesignPreview: React.FC<ProtectedDesignPreviewProps> = ({
  previewUrl,
  altText,
  className = '',
  imgClassName = 'w-full h-full object-cover',
  imgStyle,
  fallbackText,
}) => {
  const preventInteraction = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      onContextMenu={preventInteraction}
      onDragStart={preventInteraction}
    >
      <img
        src={previewUrl}
        alt={altText}
        draggable={false}
        onContextMenu={preventInteraction}
        onDragStart={preventInteraction}
        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          const label = encodeURIComponent(fallbackText || altText || 'Design Preview');
          target.src = `https://placehold.co/600x800/2c3e50/e9c46a?text=${label}`;
        }}
        className={`pointer-events-none select-none block ${imgClassName}`}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          ...imgStyle,
        }}
      />

      {/* Transparent shield overlay that intercepts all mouse/touch events above the <img> */}
      <div
        aria-hidden="true"
        onContextMenu={preventInteraction}
        onDragStart={preventInteraction}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          backgroundColor: 'transparent',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      />
    </div>
  );
};

export default ProtectedDesignPreview;
