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
 * - Both labels are always centered under their markers (-translate-x-1/2)
 * - When markers are close (< 12% distance), the liquidation label drops down
 *   vertically (-bottom-8) to prevent horizontal text overlap
 * - When markers are far apart, both stay at the same vertical position (-bottom-5)
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SimulatorGauge from "@/components/wallet/SimulatorGauge";

describe("SimulatorGauge - LTV Marker Spacing", () => {
  describe("Marker label centering", () => {
    it("should center maxLtv label under its marker", () => {
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

      // maxLtv label should always be centered under its marker
      expect(maxLtvContainer).toHaveClass("-translate-x-1/2");
    });

    it("should center liquidation label under its marker", () => {
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

      // liquidation label should always be centered under its marker
      expect(liquidationContainer).toHaveClass("-translate-x-1/2");
    });
  });

  describe("Vertical offset when markers are close", () => {
    it("should vertically offset liquidation label when markers are close (< 12% apart)", () => {
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

      // When markers are close, liquidation label drops down to -bottom-8
      expect(liquidationContainer).toHaveClass("-bottom-8");
    });

    it("should NOT vertically offset liquidation label when markers are far apart (>= 12%)", () => {
      // Far apart scenario: maxLtv=50%, liquidation=80% (30% apart)
      render(
        <SimulatorGauge
          currentLtv={30}
          simulatedLtv={30}
          maxLtv={50}
          liquidationRatio={80}
        />
      );

      const liquidationLabel = screen.getByTestId("ltv-liquidation");
      const liquidationContainer = liquidationLabel.closest("div");

      // When markers are far apart, liquidation label stays at -bottom-5
      expect(liquidationContainer).toHaveClass("-bottom-5");
      expect(liquidationContainer).not.toHaveClass("-bottom-8");
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

      const liquidationLabel = screen.getByTestId("ltv-liquidation");
      const liquidationContainer = liquidationLabel.closest("div");

      // 10% apart is still < 12%, so should drop down
      expect(liquidationContainer).toHaveClass("-bottom-8");
    });

    it("should NOT vertically offset when markers are exactly 12% apart (boundary)", () => {
      // Boundary case: exactly 12% apart should NOT drop down
      render(
        <SimulatorGauge
          currentLtv={30}
          simulatedLtv={30}
          maxLtv={68}
          liquidationRatio={80}
        />
      );

      const liquidationLabel = screen.getByTestId("ltv-liquidation");
      const liquidationContainer = liquidationLabel.closest("div");

      // At exactly 12%, should stay at -bottom-5
      expect(liquidationContainer).toHaveClass("-bottom-5");
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

    it("should vertically offset when markers are very close (1% apart)", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={79}
          liquidationRatio={80}
        />
      );

      const liquidationLabel = screen.getByTestId("ltv-liquidation");
      const liquidationContainer = liquidationLabel.closest("div");

      // Very close markers should definitely drop down
      expect(liquidationContainer).toHaveClass("-bottom-8");
    });
  });
});
