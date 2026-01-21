/**
 * @vitest-environment jsdom
 */
/**
 * TDD Tests for SimulatorGauge Component - LTV Marker Spacing
 *
 * Issue #1: LTV percentage markers overlap when close together.
 *
 * Solution:
 * - Orange % text (maxLtv): inside the bar, to the LEFT of the orange marker
 * - Red % text (liquidation): inside the bar, to the RIGHT of the red marker
 * - "Max LTV" label: below the bar, to the left of the orange marker
 * - "Liquidation" label: below the bar, to the right of the red marker
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SimulatorGauge from "@/components/wallet/SimulatorGauge";

describe("SimulatorGauge - LTV Marker Spacing", () => {
  describe("Marker percentage labels", () => {
    it("should display maxLtv percentage to the LEFT of the orange marker", () => {
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

      // maxLtv percentage should be positioned to the right (which puts text to LEFT of marker)
      expect(maxLtvContainer).toHaveClass("right-1");
    });

    it("should display liquidation percentage to the RIGHT of the red marker", () => {
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

      // liquidation percentage should be positioned to the left (which puts text to RIGHT of marker)
      expect(liquidationContainer).toHaveClass("left-1");
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

    it("should display 'Max LTV' label text", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={75}
          liquidationRatio={80}
        />
      );

      expect(screen.getByText("Max LTV")).toBeInTheDocument();
    });

    it("should display 'Liquidation' label text", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={75}
          liquidationRatio={80}
        />
      );

      expect(screen.getByText("Liquidation")).toBeInTheDocument();
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

    it("should handle XAUT scenario (75%/80%)", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={75}
          liquidationRatio={80}
        />
      );

      expect(screen.getByTestId("ltv-max")).toHaveTextContent("75%");
      expect(screen.getByTestId("ltv-liquidation")).toHaveTextContent("80%");
    });

    it("should render without crashing when markers are at same position", () => {
      render(
        <SimulatorGauge
          currentLtv={50}
          simulatedLtv={50}
          maxLtv={80}
          liquidationRatio={80}
        />
      );

      expect(screen.getByTestId("ltv-max")).toBeInTheDocument();
      expect(screen.getByTestId("ltv-liquidation")).toBeInTheDocument();
    });
  });
});
