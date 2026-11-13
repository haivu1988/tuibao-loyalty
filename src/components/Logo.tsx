/* eslint-disable @next/next/no-img-element */

// Logo mèo TUIBAO (ảnh trong /public). size = chiều cao px.
export default function Logo({
  size = 40,
  withText = false,
  className = "",
}: {
  size?: number;
  withText?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/tuibao-logo.png"
        alt="TUIBAO"
        height={size}
        style={{ height: size, width: "auto" }}
        className="select-none drop-shadow-sm"
        draggable={false}
      />
      {withText && (
        <span className="text-lg font-black tracking-tight text-carrot-600">
          TUIBAO
        </span>
      )}
    </span>
  );
}
