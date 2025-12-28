import { toast } from "react-toastify";

type ToastVariant = "success" | "error" | "info";

interface CustomToastProps {
  message: string;
  variant?: ToastVariant;
}

export const CustomToast: React.FC<CustomToastProps> = ({
  message,
  variant = "success",
}) => {
  const isError = variant === "error";
  const isInfo = variant === "info";

  // Dark glass style matching app theme
  const containerClasses = [
    "flex",
    "items-center",
    "gap-3",
    "min-w-0",
    "px-4",
    "py-3",
    "max-w-[520px]",
    "min-w-[300px]",
    "rounded-xl",
    "border",
    "backdrop-blur-xl",
    isError
      ? "bg-red-500/10 border-red-500/30"
      : isInfo
        ? "bg-amber-500/10 border-amber-500/30"
        : "bg-emerald-500/10 border-emerald-500/30",
  ].join(" ");

  const textClasses = [
    "text-sm",
    "font-medium",
    "leading-5",
    "flex-1",
    "break-words",
    isError ? "text-red-400" : isInfo ? "text-amber-400" : "text-emerald-400",
  ].join(" ");

  const iconColor = isError ? "#f87171" : isInfo ? "#fbbf24" : "#34d399";

  return (
    <div
      className={containerClasses}
      style={{
        boxShadow: "0px 4px 20px -2px rgba(0, 0, 0, 0.3)",
        background: isError
          ? "rgba(239, 68, 68, 0.1)"
          : isInfo
            ? "rgba(245, 158, 11, 0.1)"
            : "rgba(16, 185, 129, 0.1)",
      }}
    >
      <div className="shrink-0" aria-hidden>
        {isError ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4"
              stroke={iconColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M12 16.5h.01"
              stroke={iconColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M12 3.5l9 16H3l9-16Z"
              stroke={iconColor}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        ) : isInfo ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke={iconColor} strokeWidth="1.5" />
            <path d="M12 8v5" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="16" r="0.5" fill={iconColor} />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M16.6666 5L7.49996 14.1667L3.33329 10"
              stroke={iconColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div className={textClasses}>{message}</div>
    </div>
  );
};

export const showSuccessToast = (message: string) => {
  toast(<CustomToast message={message} variant="success" />, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: false,
    // Remove default toast wrapper look to avoid "toast inside toast"
    closeButton: false,
    icon: false,
    className: "bg-transparent shadow-none p-0 m-0",
    style: {
      background: "transparent",
      boxShadow: "none",
      width: "auto",
      maxWidth: "none"
    },
  });
};

export const showErrorToast = (message: string) => {
  toast(<CustomToast message={message} variant="error" />, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: false,
    closeButton: false,
    icon: false,
    className: "bg-transparent shadow-none p-0 m-0",
    style: {
      background: "transparent",
      boxShadow: "none",
      marginTop: 16,
      width: "auto",
      maxWidth: "none"
    },
  });
};

export const showInfoToast = (message: string) => {
  toast(<CustomToast message={message} variant="info" />, {
    position: "top-center",
    autoClose: 4000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: false,
    closeButton: false,
    icon: false,
    className: "bg-transparent shadow-none p-0 m-0",
    style: {
      background: "transparent",
      boxShadow: "none",
      width: "auto",
      maxWidth: "none"
    },
  });
};

// Backwards compatible default
export const showCustomToast = (message: string) => showSuccessToast(message);

