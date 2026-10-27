import Image from "next/image";

export default function AttachmentImage({
  src,
  alt,
  size = 64,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className="rounded-lg object-cover ring-1 ring-white/30"
      style={{ width: size, height: size }}
    />
  );
}