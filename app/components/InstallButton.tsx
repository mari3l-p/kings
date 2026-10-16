"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Props = {
  className?: string; // classes for the button itself
  wrapperClassName?: string; // classes for the centering wrapper
  label?: string;
};

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block h-4 w-4 align-text-bottom"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

export default function InstallAppButton({
  className = "",
  wrapperClassName = "",
  label = "Descargar app",
}: Props) {
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // Detect if already installed + capture the Android/Chrome install prompt
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(isStandalone);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Close with Esc + lock body scroll while the modal is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const handleClick = async () => {
    // Android / Chrome: native install prompt
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    // iPhone / Safari (and anything else): show the instructions
    setOpen(true);
  };

  if (installed) return null;

  return (
    <>
      {/* Centering wrapper */}
      <div className={`flex w-full justify-center ${wrapperClassName}`}>
        <button
          type="button"
          onClick={handleClick}
          className={
            className ||
            "inline-flex items-center justify-center gap-2.5 rounded-full bg-[#c4006e] px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 active:scale-95"
          }
        >
          <DownloadIcon />
          <span>{label}</span>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-modal-title"
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 text-neutral-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 id="install-modal-title" className="text-xl font-semibold">
                Instalar app
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="-mr-1 -mt-1 rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="h-6 w-6"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <p className="mt-3 text-neutral-500">
              Sigue estos pasos para agregar el menú de The Vape Kings a tu
              pantalla de inicio:
            </p>

            <ol className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                  1
                </span>
                <p>
                  Toca el botón <strong>Compartir</strong> <ShareIcon /> en la
                  barra de Safari (abajo o arriba según tu iPhone)
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                  2
                </span>
                <p>
                  Desplázate y toca{" "}
                  <strong>&quot;Agregar a pantalla de inicio&quot;</strong>
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                  3
                </span>
                <p>
                  Toca <strong>Agregar</strong> — ¡listo!
                </p>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-full bg-black py-3.5 font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.98]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}