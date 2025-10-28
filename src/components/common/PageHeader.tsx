"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";

const PageHeader = ({ title }: { title: string }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector(
        ".overflow-y-auto"
      ) as HTMLElement;
      if (scrollContainer) {
        const scrollTop = scrollContainer.scrollTop;
        setIsScrolled(scrollTop > 10);
      }
    };

    const scrollContainer = document.querySelector(".overflow-y-auto");

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
      handleScroll();

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  return (
    <div
      className={`border-border/20 fixed top-0 left-0 right-0 z-40 flex h-[calc(80px+env(safe-area-inset-top))] w-full md:w-sm md:mx-auto md:left-auto md:right-auto items-center justify-center bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)] transition-all ${
        isScrolled ? "border-b" : ""
      }`}
    >
      <button className="absolute left-4" onClick={() => history.back()}>
        <ArrowLeftIcon className="h-7 w-7" />
      </button>
      <h1 className="text-center text-2xl font-bold">{title}</h1>
    </div>
  );
};

export default PageHeader;
