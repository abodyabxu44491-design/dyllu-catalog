// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
// Native BarcodeDetector (Chrome on Android) when available, ZXing everywhere else (iPhone Safari, desktop)
type Detector = { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorCtor = { new (o: { formats: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> };
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code"];
export default function BarcodeScanner({ onResult, onClose }: { onResult: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null),
    [err, setErr] = useState(""),
    [ready, setReady] = useState(false),
    [torch, setTorch] = useState<null | boolean>(null),
    track = useRef<MediaStreamTrack | null>(null),
    done = useRef(false),
    cb = useRef(onResult);
  cb.current = onResult;
  useEffect(() => {
    let stream: MediaStream | null = null,
      stopZx: (() => void) | null = null,
      timer = 0,
      alive = true;
    const finish = (code: string) => {
      if (done.current || !code) return;
      done.current = true;
      navigator.vibrate?.(60);
      cb.current(code.trim());
    };
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia)
        return setErr("المتصفح لا يدعم الكاميرا. افتح الرابط في Safari أو Chrome، أو اكتب الرقم يدويًا");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (e) {
        const n = (e as Error).name;
        return setErr(
          n === "NotAllowedError"
            ? "لم يُسمح باستخدام الكاميرا. اسمح بها من إعدادات المتصفح ثم حاول مرة أخرى، أو اكتب الرقم يدويًا"
            : n === "NotFoundError" || n === "OverconstrainedError"
              ? "لا توجد كاميرا في هذا الجهاز. اكتب الرقم يدويًا"
              : "تعذر فتح الكاميرا. أغلق أي تطبيق يستخدمها وحاول مرة أخرى",
        );
      }
      if (!alive || !video.current) return stream.getTracks().forEach((t) => t.stop());
      const v = video.current;
      v.srcObject = stream;
      await v.play().catch(() => {});
      track.current = stream.getVideoTracks()[0] ?? null;
      const caps = (track.current?.getCapabilities?.() ?? {}) as { torch?: boolean };
      if (caps.torch) setTorch(false);
      setReady(true);
      const BD = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
      const supported = BD ? await BD.getSupportedFormats?.().catch(() => []) : [];
      if (BD && supported?.includes("ean_13")) {
        const det = new BD({ formats: FORMATS.filter((f) => supported.includes(f)) });
        const tick = async () => {
          if (!alive || done.current) return;
          if (v.readyState >= 2) {
            const r = await det.detect(v).catch(() => []);
            if (r[0]?.rawValue) return finish(r[0].rawValue);
          }
          timer = window.setTimeout(tick, 120);
        };
        tick();
        return;
      }
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ]);
      if (!alive) return;
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.ITF,
        BarcodeFormat.QR_CODE,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 100 });
      const controls = await reader.decodeFromStream(stream, v, (res) => res && finish(res.getText()));
      stopZx = () => controls.stop();
      if (!alive) stopZx();
    })();
    return () => {
      alive = false;
      clearTimeout(timer);
      stopZx?.();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  async function toggleTorch() {
    const on = !torch;
    await track.current?.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }).catch(() => {});
    setTorch(on);
  }
  return (
    <div className="fixed inset-0 z-[70] bg-black text-white flex flex-col" role="dialog" aria-label="مسح الباركود">
      <div className="relative flex-1 overflow-hidden">
        <video ref={video} playsInline muted autoPlay className="absolute inset-0 w-full h-full object-cover" />
        {!err && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="relative w-[78%] max-w-sm aspect-[16/10] rounded-3xl shadow-[0_0_0_100vmax_rgba(0,0,0,.55)]">
              {[
                "top-0 start-0 border-t-4 border-s-4 rounded-ss-3xl",
                "top-0 end-0 border-t-4 border-e-4 rounded-se-3xl",
                "bottom-0 start-0 border-b-4 border-s-4 rounded-es-3xl",
                "bottom-0 end-0 border-b-4 border-e-4 rounded-ee-3xl",
              ].map((c) => (
                <i key={c} className={`absolute w-10 h-10 border-lime ${c}`} />
              ))}
              {ready && (
                <i className="absolute inset-x-6 top-1/2 h-0.5 bg-accent/90 shadow-[0_0_12px_2px_rgba(255,105,0,.7)] animate-pulse" />
              )}
            </div>
          </div>
        )}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button onClick={onClose} aria-label="إغلاق" className="btn-icon w-11 h-11 bg-black/50 backdrop-blur text-white">
            <Icon n="close" s={22} />
          </button>
          {torch !== null && (
            <button
              onClick={toggleTorch}
              aria-label="الفلاش"
              className={`btn-icon w-11 h-11 backdrop-blur ${torch ? "bg-lime text-ink" : "bg-black/50 text-white"}`}
            >
              <Icon n="bolt" s={20} />
            </button>
          )}
        </div>
        {err && (
          <div className="absolute inset-0 grid place-items-center p-6">
            <div className="max-w-sm text-center space-y-4">
              <span className="w-14 h-14 rounded-2xl bg-white/10 grid place-items-center mx-auto">
                <Icon n="alert" s={28} className="text-lime" />
              </span>
              <p className="leading-7">{err}</p>
              <button onClick={onClose} className="btn btn-lg btn-lime">
                رجوع
              </button>
            </div>
          </div>
        )}
      </div>
      {!err && (
        <p className="text-center text-sm text-white/80 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {ready ? "وجّه الكاميرا إلى الباركود داخل الإطار" : "جارٍ فتح الكاميرا…"}
        </p>
      )}
    </div>
  );
}
