/**
 * @vitest-environment jsdom
 */
/**
 * TDD Tests for SimulatorGauge Component - LTV Marker Spacing
 *
 * Issue #1: LTV percentage markers (75%/80% for XAUT, 70%/80% for WBTC) overlap
 * when markers are close together.
 *
 * Solution:
 * - Orange maxLtv label: BELOW the progress bar, centered on marker (-bottom-5)
 * - Red liquidation label: ABOVE the progress bar, centered on marker (-top-5)
 * - This completely prevents any overlap regardless of marker distance
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SimulatorGauge from "@/components/wallet/SimulatorGauge";

describe("SimulatorGauge - LTV Marker Spacing", () => {
  describe("Marker label positioning", () => {
    it("should position maxLtv label BELOW the progress bar, centered on marker", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={75}
          liquidationRatio={80}
        />
      );

      const maxLtvLabel = screen.getByTestId("ltv-max");
      const maxLtvContainer = maxLtvLabel.closest("div");

      // maxLtv label should be below the bar and centered
      expect(maxLtvContainer).toHaveClass("-bottom-5");
      expect(maxLtvContainer).toHaveClass("-translate-x-1/2");
    });

    it("should position liquidation label ABOVE the progress bar, centered on marker", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={75}
          liquidationRatio={80}
        />
      );

      const liquidationLabel = screen.getByTestId("ltv-liquidation");
      const liquidationContainer = liquidationLabel.closest("div");

      // liquidation label should be above the bar and centered
      expect(liquidationContainer).toHaveClass("-top-5");
      expect(liquidationContainer).toHaveClass("-translate-x-1/2");
    });

    it("should not overlap even when markers are very close (XAUT: 75%/80%)", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={75}
          liquidationRatio={80}
        />
      );

      const maxLtvLabel = screen.getByTestId("ltv-max");
      const liquidationLabel = screen.getByTestId("ltv-liquidation");
      const maxLtvContainer = maxLtvLabel.closest("div");
      const liquidationContainer = liquidationLabel.closest("div");

      // Labels are on opposite sides of the bar, so no overlap possible
      expect(maxLtvContainer).toHaveClass("-bottom-5");
      expect(liquidationContainer).toHaveClass("-top-5");
    });

    it("should not overlap even when markers are at same position", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={80}
          liquidationRatio={80}
        />
      );

      const maxLtvLabel = screen.getByTestId("ltv-max");
      const liquidationLabel = screen.getByTestId("ltv-liquidation");
      const maxLtvContainer = maxLtvLabel.closest("div");
      const liquidationContainer = liquidationLabel.closest("div");

      // Even at same position, labels don't overlap (above vs below)
      expect(maxLtvContainer).toHaveClass("-bottom-5");
      expect(liquidationContainer).toHaveClass("-top-5");
    });
  });

  describe("Marker label text content", () => {
    it("should display correct maxLtv percentage", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={75}
          liquidationRatio={80}
        />
      );

      expect(screen.getByTestId("ltv-max")).toHaveTextContent("75%");
    });

    it("should display correct liquidation percentage", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={75}
          liquidationRatio={80}
        />
      );

      expect(screen.getByTestId("ltv-liquidation")).toHaveTextContent("80%");
    });
  });

  describe("Edge cases", () => {
    it("should handle WBTC scenario (70%/80%)", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={70}
          liquidationRatio={80}
        />
      );

      expect(screen.getByTestId("ltv-max")).toHaveTextContent("70%");
      expect(screen.getByTestId("ltv-liquidation")).toHaveTextContent("80%");
    });

    it("should render without crashing at extreme values", () => {
      render(
        <SimulatorGauge
          currentLtv={0}
          simulatedLtv={100}
          maxLtv={50}
          liquidationRatio={90}
        />
      );

      expect(screen.getByTestId("ltv-max")).toBeInTheDocument();
      expect(screen.getByTestId("ltv-liquidation")).toBeInTheDocument();
    });
  });
});
