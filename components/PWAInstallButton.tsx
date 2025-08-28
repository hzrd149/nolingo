import { useEffect, useState } from "react";

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Check if already installed
    const checkIfInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches)
        setIsInstallable(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    checkIfInstalled();

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android/Chrome install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    }
  };

  const handleIOSInstall = () => {
    // Show iOS install instructions
    const instructions = [
      "1. Tap the Share button (📤) in your browser",
      '2. Scroll down and tap "Add to Home Screen"',
      '3. Tap "Add" to install the app',
    ];

    alert(`To install Nolingo on your device:\n\n${instructions.join("\n")}`);
  };

  // Don't show if not installable or already installed
  if (!isInstallable) {
    return null;
  }

  return (
    <div className="p-4 border-b border-base-300">
      <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-3">
        Install App
      </h3>
      <button
        onClick={isIOS ? handleIOSInstall : handleInstall}
        className="btn btn-primary w-full"
      >
        {isIOS ? "Install on iOS" : "Install App"}
      </button>
      {isIOS && (
        <p className="text-xs text-base-content/60 mt-2 text-center">
          Tap to see installation steps
        </p>
      )}
    </div>
  );
}
