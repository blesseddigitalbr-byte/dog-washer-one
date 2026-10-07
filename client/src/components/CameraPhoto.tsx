import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** Camera is requested only on an explicit click; tracks stop on close/unmount. */
export function CameraPhoto({ onCapture, disabled = false }: { onCapture: (file: File, preview: string) => void; disabled?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const stop = () => {
    generation.current++;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  };
  useEffect(() => () => stop(), []);
  useEffect(() => { if (open && video.current && stream.current) video.current.srcObject = stream.current; }, [open]);
  const close = () => { stop(); setOpen(false); setReady(false); };
  const start = async () => {
    setError("");
    const request = ++generation.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
      const camera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      if (request !== generation.current) { camera.getTracks().forEach(track => track.stop()); return; }
      stream.current = camera;
      setOpen(true);
    } catch {
      if (request === generation.current) setError("Não foi possível abrir a câmera. Verifique a permissão do navegador ou use o upload.");
    }
  };
  const capture = () => {
    const source = video.current;
    if (!source?.videoWidth || !source.videoHeight) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / Math.max(source.videoWidth, source.videoHeight));
    canvas.width = Math.round(source.videoWidth * scale);
    canvas.height = Math.round(source.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const preview = canvas.toDataURL("image/jpeg", 0.85);
    const request = generation.current;
    canvas.toBlob(blob => {
      if (!blob || request !== generation.current) return;
      onCapture(new File([blob], "foto-camera.jpg", { type: "image/jpeg" }), preview);
      close();
    }, "image/jpeg", 0.85);
  };
  return <div className="space-y-2">
    {!open && <Button type="button" variant="outline" disabled={disabled} onClick={start}>Tirar foto com câmera</Button>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {open && <div className="rounded-lg border border-slate-400 bg-white p-3 space-y-3">
      <video ref={video} autoPlay muted playsInline onLoadedData={() => setReady(true)} aria-label="Prévia da câmera" className="w-full max-h-64 rounded-lg object-contain" />
      <p className="text-sm text-muted-foreground">A foto será salva no cadastro somente ao salvar o formulário.</p>
      <div className="flex gap-2"><Button type="button" disabled={!ready || disabled} onClick={capture}>Capturar foto</Button><Button type="button" variant="outline" onClick={close}>Fechar câmera</Button></div>
    </div>}
  </div>;
}
