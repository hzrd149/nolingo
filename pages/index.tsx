import Drawer from "@/components/Drawer";
import Image from "next/image";

export default function Home() {
  return (
    <Drawer>
      <div className="hero min-h-[calc(100vh-2rem)] bg-base-100">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <Image
              className="dark:invert mx-auto mb-8"
              src="/next.svg"
              alt="Next.js logo"
              width={180}
              height={38}
              priority
            />
            <h1 className="text-5xl font-bold">Welcome to Nolingo</h1>
            <p className="py-6">
              Your platform for learning languages through community-driven
              content and translations.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="btn btn-primary">Get Started</button>
              <button className="btn btn-outline">Learn More</button>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
