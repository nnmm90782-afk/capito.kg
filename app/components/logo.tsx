import Image from "next/image";

interface CapitoLogoProps {
  /** Rendered width in px. Height scales automatically (logo is roughly square). */
  size?: number;
  /** Show only the icon portion (cup) without the CAPITO / COFFEE text below */
  iconOnly?: boolean;
}

export function CapitoLogo({ size = 40 }: CapitoLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Capito Coffee"
      width={size}
      height={size}
      priority
      style={{ objectFit: "contain", width: size, height: size }}
    />
  );
}
