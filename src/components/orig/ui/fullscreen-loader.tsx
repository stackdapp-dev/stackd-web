import Image from "next/image";

export const FullScreenLoader = () => {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <Image src="/logo.png" alt="ArCa Logo" width={91} height={91} />
    </div>
  );
};
