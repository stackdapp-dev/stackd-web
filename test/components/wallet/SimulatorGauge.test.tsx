/**
 * @vitest-environment jsdom
 */
/**
 * TDD Tests for SimulatorGauge Component - LTV Marker Spacing
 *
 * Issue #1: LTV percentage markers (75%/80% for XAUT, 70%/80% for WBTC) overlap
 * when markers are close together because they use fixed `-translate-x-1/2` centering.
 *
 * Solution:
 * - When markers are close (< 12% distance), offset labels to prevent overlap:
 *   - Left marker (maxLtv): align right edge to marker
 *   - Right marker (liquidation): align left edge to marker
 * - When markers are far apart, continue using centered `-translate-x-1/2`
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import SimulatorGauge from "@/components/wallet/SimulatorGauge";

describe("SimulatorGauge - LTV Marker Spacing", () => {
  describe("Marker label positioning when thresholds are close", () => {
    it("should offset maxLtv label to the left when markers are close (< 12% apart)", () => {
      // XAUT scenario: maxLtv=75%, liquidation=80% (5% apart)
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

      // When markers are close, the maxLtv label should NOT use -translate-x-1/2 (centered)
      // Instead it should align right edge to marker (translate-x-0 or similar)
      expect(maxLtvContainer).not.toHaveClass("-translate-x-1/2");
    });

    it("should offset liquidation label to the right when markers are close (< 12% apart)", () => {
      // XAUT scenario: maxLtv=75%, liquidation=80% (5% apart)
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

      // When markers are close, the liquidation label should NOT use -translate-x-1/2 (centered)
      // Instead it should align left edge to marker (-translate-x-full or similar)
      expect(liquidationContainer).not.toHaveClass("-translate-x-1/2");
    });

    it("should handle WBTC scenario with close markers (70%/80%)", () => {
      // WBTC scenario: maxLtv=70%, liquidation=80% (10% apart, still < 12%)
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={70}
          liquidationRatio={80}
        />
      );

      const maxLtvLabel = screen.getByTestId("ltv-max");
      const liquidationLabel = screen.getByTestId("ltv-liquidation");
      const maxLtvContainer = maxLtvLabel.closest("div");
      const liquidationContainer = liquidationLabel.closest("div");

      // Both should not be centered when close together
      expect(maxLtvContainer).not.toHaveClass("-translate-x-1/2");
      expect(liquidationContainer).not.toHaveClass("-translate-x-1/2");
    });
  });

  describe("Marker label positioning when thresholds are far apart", () => {
    it("should center both labels when markers are far apart (>= 12%)", () => {
      // Hypothetical scenario: maxLtv=50%, liquidation=80% (30% apart)
      render(
        <SimulatorGauge
          currentLtv={30}
          simulatedLtv={30}
          maxLtv={50}
          liquidationRatio={80}
        />
      );

      const maxLtvLabel = screen.getByTestId("ltv-max");
      const liquidationLabel = screen.getByTestId("ltv-liquidation");
      const maxLtvContainer = maxLtvLabel.closest("div");
      const liquidationContainer = liquidationLabel.closest("div");

      // When markers are far apart, both should use centered positioning
      expect(maxLtvContainer).toHaveClass("-translate-x-1/2");
      expect(liquidationContainer).toHaveClass("-translate-x-1/2");
    });

    it("should center labels when markers are exactly 12% apart (boundary)", () => {
      // Boundary case: exactly 12% apart should use centered positioning
      render(
        <SimulatorGauge
          currentLtv={30}
          simulatedLtv={30}
          maxLtv={68}
          liquidationRatio={80}
        />
      );

      const maxLtvLabel = screen.getByTestId("ltv-max");
      const liquidationLabel = screen.getByTestId("ltv-liquidation");
      const maxLtvContainer = maxLtvLabel.closest("div");
      const liquidationContainer = liquidationLabel.closest("div");

      // At exactly 12%, should use centered positioning
      expect(maxLtvContainer).toHaveClass("-translate-x-1/2");
      expect(liquidationContainer).toHaveClass("-translate-x-1/2");
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
    it("should handle markers at same position gracefully", () => {
      // Edge case: maxLtv equals liquidationRatio
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

      // Both should render without crashing
      expect(maxLtvLabel).toBeInTheDocument();
      expect(liquidationLabel).toBeInTheDocument();
    });

    it("should handle very close markers (1% apart)", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={79}
          liquidationRatio={80}
        />
      );

      const maxLtvLabel = screen.getByTestId("ltv-max");
      const liquidationLabel = screen.getByTestId("ltv-liquidation");
      const maxLtvContainer = maxLtvLabel.closest("div");
      const liquidationContainer = liquidationLabel.closest("div");

      // Very close markers should definitely use offset positioning
      expect(maxLtvContainer).not.toHaveClass("-translate-x-1/2");
      expect(liquidationContainer).not.toHaveClass("-translate-x-1/2");
    });

    it("should apply correct offset classes for close markers", () => {
      // XAUT scenario: maxLtv=75%, liquidation=80%
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

      // maxLtv label should have right-aligned offset (translate-x-0 means no left shift)
      // This aligns the right edge of the label with the marker
      expect(maxLtvContainer).toHaveClass("translate-x-0");

      // liquidation label should have left-aligned offset (-translate-x-full)
      // This aligns the left edge of the label with the marker
      expect(liquidationContainer).toHaveClass("-translate-x-full");
    });
  });
});
