import { lazy } from 'react';

/**
 * Polyfill for next/image — renders a plain <img> with attribute mapping.
 */
export function Image(props) {
  const {
    src,
    alt,
    width,
    height,
    className,
    style,
    fill,
    priority,
    loader,
    unoptimized,
    onLoadingComplete,
    children,
    ...rest
  } = props;

  let imgSrc = src;
  if (typeof src === 'object' && src !== null) {
    imgSrc = src.src || src.default || '';
  }

  const imgStyle = fill
    ? { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', ...style }
    : style;

  return (
    <img
      src={imgSrc}
      alt={alt || ''}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      style={imgStyle}
      loading={priority ? 'eager' : 'lazy'}
      {...rest}
    />
  );
}

/**
 * Polyfill for next/dynamic — wraps React.lazy.
 * Since there's no SSR in Vite, the ssr option is a no-op.
 */
export function dynamic(importFn, _options) {
  return lazy(importFn);
}

/**
 * Polyfill for next/script — renders a plain <script> tag.
 */
export function Script(props) {
  const { src, strategy, onLoad, ...rest } = props;
  return <script src={src} {...rest} />;
}
