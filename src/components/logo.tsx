import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const Logo = () => {
  const logoImage = PlaceHolderImages.find((img) => img.id === 'logo');

  return (
    <div className="flex items-center gap-2">
      {logoImage && (
        <Image
          src={logoImage.imageUrl}
          alt={logoImage.description}
          width={32}
          height={32}
          data-ai-hint={logoImage.imageHint}
          className="rounded-md"
        />
      )}
      <span className="text-xl font-bold text-sidebar-foreground">
        Donezo
      </span>
    </div>
  );
};

export default Logo;
