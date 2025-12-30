"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PnLOverviewCard } from "@/components/wallet/pnl/PnLOverviewCard";
import { PnLByAssetCard } from "@/components/wallet/pnl/PnLByAssetCard";
import { PnLBySourceCard } from "@/components/wallet/pnl/PnLBySourceCard";

interface PnLCarouselProps {
  initialIndex?: number;
  onSlideChange?: (index: number) => void;
}

const SWIPE_THRESHOLD = 50;
const TOTAL_SLIDES = 3;

export function PnLCarousel({ initialIndex = 0, onSlideChange }: PnLCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [dragStartX, setDragStartX] = useState(0);

  const goToSlide = useCallback((index: number) => {
    const newIndex = ((index % TOTAL_SLIDES) + TOTAL_SLIDES) % TOTAL_SLIDES;
    setActiveIndex(newIndex);
    onSlideChange?.(newIndex);
  }, [onSlideChange]);

  const goNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      goNext();
    } else if (e.key === "ArrowLeft") {
      goPrev();
    }
  }, [goNext, goPrev]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragStartX(e.clientX);
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const delta = e.clientX - dragStartX;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      if (delta < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  }, [dragStartX, goNext, goPrev]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setDragStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - dragStartX;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      if (delta < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  }, [dragStartX, goNext, goPrev]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="px-4">
      <div
        data-testid="pnl-carousel"
        data-active-index={activeIndex}
        role="region"
        aria-label="PnL breakdown carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        {/* Screen reader announcement */}
        <div role="status" className="sr-only">
          Slide {activeIndex + 1} of {TOTAL_SLIDES}
        </div>

        {/* Cards container */}
        <div className="relative min-h-[200px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeIndex}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              {activeIndex === 0 && <PnLOverviewCard />}
              {activeIndex === 1 && <PnLByAssetCard />}
              {activeIndex === 2 && <PnLBySourceCard />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <button
          data-testid="carousel-prev"
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/40 transition-all z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          data-testid="carousel-next"
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/40 transition-all z-10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-3">
        {Array.from({ length: TOTAL_SLIDES }).map((_, index) => (
          <button
            key={index}
            data-testid="carousel-dot"
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex
                ? "bg-amber-500 w-4"
                : "bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === activeIndex ? "true" : "false"}
          />
        ))}
      </div>
    </div>
  );
}
