"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BarcodeDetector } from "barcode-detector/ponyfill";
import { ArrowLeft, Camera, ScanBarcode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { checkEanExists } from "@/lib/api/products";
import { cn } from "@/lib/utils";

type ScanState =
  | "idle"
  | "starting"
  | "scanning"
  | "found"
  | "checking"
  | "error"
  | "denied"
  | "unsupported";

const MESSAGES: Record<ScanState, string> = {
  idle: "Aponte a câmera para o código de barras do produto.",
  starting: "Iniciando a câmera...",
  scanning: "Aponte a câmera para o código de barras do produto.",
  found: "Código lido com sucesso.",
  checking: "Verificando produto...",
  error: "Não foi possível verificar o produto. Tente de novo.",
  denied:
    "Precisamos da câmera para ler o código. Você também pode digitar o EAN abaixo.",
  unsupported:
    "Seu navegador não expõe a câmera aqui. Digite o EAN abaixo para continuar.",
};

const FRAME_COLOR: Record<ScanState, string> = {
  idle: "rgba(255,255,255,0.35)",
  starting: "rgba(255,255,255,0.35)",
  scanning: "rgba(255,255,255,0.9)",
  found: "var(--trust-fresh)",
  checking: "var(--trust-fresh)",
  error: "var(--destructive)",
  denied: "var(--destructive)",
  unsupported: "var(--destructive)",
};

export default function EscanearPage() {
  const router = useRouter();
  const { isReady } = useRequireAuth("/scan");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  // Trava: loop de detecção, botão "Capturar" e Enter no input podem disparar
  // juntos — só a primeira leitura segue para a verificação/navegação.
  const handledRef = useRef(false);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [eanInput, setEanInput] = useState("");

  async function goToResult(ean: string) {
    setScanState("checking");
    try {
      const result = await checkEanExists(ean);
      const known = result.exists && result.approved;
      router.push(known ? `/confirm-price?ean=${ean}` : `/new-product?ean=${ean}`);
    } catch {
      handledRef.current = false;
      setScanState("error");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function onDetected(ean: string) {
    if (handledRef.current) return;
    handledRef.current = true;
    setScanState("found");
    timerRef.current = setTimeout(() => {
      stopCamera();
      void goToResult(ean);
    }, 600);
  }

  function getDetector() {
    if (!detectorRef.current) {
      detectorRef.current = new BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "code_128"],
      });
    }
    return detectorRef.current;
  }

  async function detectOnce() {
    if (!videoRef.current) return false;
    try {
      const codes = await getDetector().detect(videoRef.current);
      if (codes.length > 0) {
        onDetected(codes[0].rawValue);
        return true;
      }
    } catch {
      // frame not ready yet, keep trying
    }
    return false;
  }

  function detectLoop() {
    const tick = async () => {
      if (!activeRef.current) return;
      const found = await detectOnce();
      if (!found) timerRef.current = setTimeout(tick, 350);
    };
    void tick();
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanState("unsupported");
      return;
    }
    setScanState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanState("scanning");
      detectLoop();
    } catch {
      setScanState("denied");
    }
  }

  useEffect(() => {
    if (!isReady) return;
    activeRef.current = true;
    const startId = setTimeout(() => void startCamera(), 0);
    return () => {
      activeRef.current = false;
      clearTimeout(startId);
      clearTimeout(timerRef.current);
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  function submitEan() {
    const value = eanInput.trim();
    if (value.length >= 8) onDetected(value);
  }

  if (!isReady) return null;

  return (
    <div className="flex min-h-screen flex-col bg-primary text-primary-foreground">
      <div className="flex items-center gap-3 p-5">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5.5" />
        </button>
        <span className="text-[15px] font-medium">
          Escanear código de barras
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 p-5">
        <div className="relative aspect-4/3 w-full max-w-105 overflow-hidden rounded-xl bg-background/10">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="size-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="h-[42%] w-[78%] rounded-xl border-[3px] transition-colors"
              style={{ borderColor: FRAME_COLOR[scanState] }}
            />
          </div>
        </div>

        <p className="max-w-105 text-center text-sm text-primary-foreground/80">
          {MESSAGES[scanState]}
        </p>

        {scanState === "denied" && (
          <Button variant="secondary" onClick={startCamera}>
            Permitir câmera
          </Button>
        )}
        {scanState === "error" && (
          <Button variant="secondary" onClick={startCamera}>
            Tentar de novo
          </Button>
        )}
        {scanState === "scanning" && (
          <Button variant="secondary" onClick={() => void detectOnce()}>
            <Camera className="size-4" />
            Capturar código
          </Button>
        )}
      </div>

      <div className="flex justify-center p-5 pb-7">
        <div className="flex h-10 w-full max-w-105 items-center gap-2 rounded-lg border border-primary-foreground/15 px-3">
          <ScanBarcode className="size-4 shrink-0 opacity-60" />
          <Input
            value={eanInput}
            onChange={(e) => setEanInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitEan()}
            placeholder="Digitar EAN manualmente"
            inputMode="numeric"
            className={cn(
              "h-full min-w-0 flex-1 border-none bg-transparent px-0 text-primary-foreground shadow-none placeholder:text-primary-foreground/50 focus-visible:ring-0"
            )}
          />
          <Button size="sm" variant="secondary" onClick={submitEan}>
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
