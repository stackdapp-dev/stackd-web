/* eslint-disable @typescript-eslint/no-require-imports */
import {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    CustomToast,
} from "@/components/ui/custom-toast";
import { toast } from "react-toastify";

// Mock react-toastify
jest.mock("react-toastify", () => ({
    toast: jest.fn(),
}));

describe("Custom Toast System", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("showSuccessToast", () => {
        it("should call toast with correct message and top-center position", () => {
            showSuccessToast("Address copied");

            expect(toast).toHaveBeenCalledTimes(1);
            expect(toast).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: true,
                })
            );
        });

        it("should use transparent background style to integrate with custom styling", () => {
            showSuccessToast("Test message");

            const callArgs = (toast as jest.Mock).mock.calls[0][1];
            expect(callArgs.style).toEqual(
                expect.objectContaining({
                    background: "transparent",
                    boxShadow: "none",
                })
            );
        });

        it("should disable closeButton and icon for clean custom appearance", () => {
            showSuccessToast("Test message");

            const callArgs = (toast as jest.Mock).mock.calls[0][1];
            expect(callArgs.closeButton).toBe(false);
            expect(callArgs.icon).toBe(false);
        });
    });

    describe("showErrorToast", () => {
        it("should call toast with error variant", () => {
            showErrorToast("Failed to copy");

            expect(toast).toHaveBeenCalledTimes(1);
            expect(toast).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    position: "top-center",
                })
            );
        });
    });

    describe("showInfoToast", () => {
        it("should call toast with info variant and shorter autoClose", () => {
            showInfoToast("Deposit required");

            expect(toast).toHaveBeenCalledTimes(1);
            expect(toast).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    position: "top-center",
                    autoClose: 4000, // Info toasts have shorter display time
                })
            );
        });
    });

    describe("CustomToast component", () => {
        it("should render with success variant by default", () => {
            const { container } = require("@testing-library/react").render(
                <CustomToast message="Success message" />
            );

            expect(container.textContent).toContain("Success message");
        });

        it("should render with error variant when specified", () => {
            const { container } = require("@testing-library/react").render(
                <CustomToast message="Error message" variant="error" />
            );

            expect(container.textContent).toContain("Error message");
        });

        it("should render with info variant when specified", () => {
            const { container } = require("@testing-library/react").render(
                <CustomToast message="Info message" variant="info" />
            );

            expect(container.textContent).toContain("Info message");
        });
    });

    describe("Regression: Toast visibility", () => {
        it("should not pass z-index in toast style (handled by ToastContainer)", () => {
            // This ensures that the z-index is set at the container level,
            // not individual toast level, ensuring all toasts are visible
            showSuccessToast("Test");

            const callArgs = (toast as jest.Mock).mock.calls[0][1];
            // The style should NOT contain z-index - that's set on the container
            expect(callArgs.style.zIndex).toBeUndefined();
        });
    });
});
