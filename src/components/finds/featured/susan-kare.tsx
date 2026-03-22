import Image from "next/image";

export default function SusanKareContent() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl overflow-hidden">
        <Image
          src="https://www.cnet.com/a/img/resize/ce8361ffff6ab6e6301e3f82454695589998c025/hub/2011/12/01/e8149075-f0ef-11e2-8c7c-d4ae52e62bcc/Smiling_computer_5x5.jpg?auto=webp&width=1200"
          alt="Happy Mac icon by Susan Kare"
          width={1200}
          height={800}
          className="w-full h-auto"
        />
      </div>
      <div className="rounded-xl overflow-hidden">
        <Image
          src="https://i.pinimg.com/736x/46/69/d6/4669d6c2625202d4fde18a6277bf98c6.jpg"
          alt="Susan Kare's original Macintosh icons"
          width={736}
          height={736}
          className="w-full h-auto"
        />
      </div>
      <div className="rounded-xl overflow-hidden">
        <Image
          src="https://pbs.twimg.com/media/DvrzYndXcAAgmnA.jpg"
          alt="Susan Kare pixel art"
          width={1200}
          height={800}
          className="w-full h-auto"
        />
      </div>
    </div>
  );
}
