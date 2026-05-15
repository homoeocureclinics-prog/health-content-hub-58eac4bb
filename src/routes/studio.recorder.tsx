import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Square, Pause, Play, Download, RotateCcw, Type, Gauge } from "lucide-react";

export const Route = createFileRoute("/studio/recorder")({
  component: RecorderPage,
  head: () => ({ meta: [{ title: "Teleprompter Recorder — MedSocial AI" }] }),
});

function RecorderPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  const [script, setScript] = useState(
    "Hello, I'm Dr. _____. Today let's talk about why early diagnosis matters for tuberculosis.\n\nTB is curable when caught early. Watch for a cough lasting more than two weeks, low-grade fever, night sweats, or unexplained weight loss.\n\nIf you notice these signs, please visit your nearest health centre — testing is free under the National TB Programme.\n\nStay healthy, and share this with someone who needs to hear it.",
  );
  const [fontSize, setFontSize] = useState(28);
  const [speed, setSpeed] = useState(1.2); // px per frame
  const [mirror, setMirror] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");

  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lastBlobUrl, setLastBlobUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Init camera+mic
  const initCamera = async (face: "user" | "environment") => {
    setErr(null);
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: face, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setReady(true);
    } catch (e: any) {
      setErr(e?.message ?? "Camera/microphone permission was denied.");
      setReady(false);
    }
  };

  useEffect(() => {
    initCamera(facing);
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!recording || paused) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording, paused]);

  // Teleprompter scroll loop
  const tick = () => {
    const el = promptRef.current;
    if (el) el.scrollTop += speed;
    scrollRafRef.current = requestAnimationFrame(tick);
  };
  const startScroll = () => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(tick);
  };
  const stopScroll = () => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  };

  const pickMime = () => {
    const opts = ["video/mp4;codecs=h264,aac", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    return opts.find((m) => (window as any).MediaRecorder?.isTypeSupported?.(m)) ?? "video/webm";
  };

  const startRec = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setLastBlobUrl(null);
    const mime = pickMime();
    const rec = new MediaRecorder(streamRef.current, { mimeType: mime, videoBitsPerSecond: 4_500_000 });
    rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const url = URL.createObjectURL(blob);
      setLastBlobUrl(url);
      // Auto-download
      const ext = mime.includes("mp4") ? "mp4" : "webm";
      const a = document.createElement("a");
      a.href = url;
      a.download = `medsocial-recording-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    rec.start(1000);
    recorderRef.current = rec;
    setRecording(true);
    setPaused(false);
    setElapsed(0);
    if (promptRef.current) promptRef.current.scrollTop = 0;
    startScroll();
  };

  const pauseRec = () => {
    if (!recorderRef.current) return;
    recorderRef.current.pause();
    setPaused(true);
    stopScroll();
  };
  const resumeRec = () => {
    if (!recorderRef.current) return;
    recorderRef.current.resume();
    setPaused(false);
    startScroll();
  };
  const stopRec = () => {
    recorderRef.current?.stop();
    setRecording(false);
    setPaused(false);
    stopScroll();
  };

  const flip = async () => {
    const next = facing === "user" ? "environment" : "user";
    setFacing(next);
    await initCamera(next);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-foreground text-background">
      <header className="flex items-center justify-between px-4 h-14 border-b border-white/10">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <div className="font-display text-lg">Teleprompter</div>
        <div className="text-sm tabular-nums opacity-80">{recording ? fmt(elapsed) : "00:00"}</div>
      </header>

      <main className="grid lg:grid-cols-[1fr_360px] gap-4 p-4">
        {/* Stage */}
        <section className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] sm:aspect-video lg:aspect-[9/16] mx-auto w-full max-w-[480px] lg:max-w-none">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`absolute inset-0 w-full h-full object-cover ${mirror ? "scale-x-[-1]" : ""}`}
          />

          {/* Teleprompter overlay */}
          <div
            ref={promptRef}
            className="absolute inset-x-0 top-0 h-2/3 overflow-hidden px-6 py-10 text-center"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0) 100%)",
              fontSize: `${fontSize}px`,
              lineHeight: 1.4,
              color: "white",
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <div style={{ paddingTop: "30%", paddingBottom: "60vh", whiteSpace: "pre-wrap" }}>{script}</div>
          </div>

          {recording && (
            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-medium">
              <span className="size-2 rounded-full bg-white animate-pulse" />
              REC {fmt(elapsed)}
            </div>
          )}

          {/* Bottom controls */}
          <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent">
            <button
              onClick={flip}
              disabled={recording}
              className="size-11 rounded-full bg-white/15 grid place-items-center disabled:opacity-40"
              aria-label="Flip camera"
            >
              <RotateCcw className="size-5" />
            </button>

            {!recording ? (
              <button
                onClick={startRec}
                disabled={!ready}
                className="size-20 rounded-full bg-red-600 ring-4 ring-white/40 grid place-items-center active:scale-95 disabled:opacity-40"
                aria-label="Record"
              >
                <Camera className="size-8" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {!paused ? (
                  <button onClick={pauseRec} className="size-14 rounded-full bg-white/20 grid place-items-center">
                    <Pause className="size-6" />
                  </button>
                ) : (
                  <button onClick={resumeRec} className="size-14 rounded-full bg-white/20 grid place-items-center">
                    <Play className="size-6" />
                  </button>
                )}
                <button
                  onClick={stopRec}
                  className="size-20 rounded-full bg-white text-black ring-4 ring-white/40 grid place-items-center"
                  aria-label="Stop"
                >
                  <Square className="size-7" />
                </button>
              </div>
            )}

            <button
              onClick={() => setMirror((m) => !m)}
              className="size-11 rounded-full bg-white/15 grid place-items-center"
              aria-label="Mirror"
              title="Mirror preview"
            >
              <Type className="size-5" />
            </button>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-4 text-sm">
          {err && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-200">
              {err}
              <div className="mt-2">
                <Button size="sm" variant="secondary" onClick={() => initCamera(facing)}>Retry</Button>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-white/5 p-4 space-y-3">
            <label className="block text-xs uppercase tracking-widest opacity-70">Script</label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={10}
              className="bg-white/5 text-white border-white/10"
              placeholder="Paste or type your script — it will scroll while you record."
            />
          </div>

          <div className="rounded-xl bg-white/5 p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs opacity-70">
                <span className="flex items-center gap-1.5"><Type className="size-3.5" /> Font size</span>
                <span>{fontSize}px</span>
              </div>
              <input
                type="range" min={16} max={56} value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs opacity-70">
                <span className="flex items-center gap-1.5"><Gauge className="size-3.5" /> Scroll speed</span>
                <span>{speed.toFixed(1)}</span>
              </div>
              <input
                type="range" min={0.2} max={4} step={0.1} value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {lastBlobUrl && (
            <div className="rounded-xl bg-white/5 p-4 space-y-2">
              <div className="text-xs uppercase tracking-widest opacity-70">Last take</div>
              <video src={lastBlobUrl} controls className="w-full rounded-md" />
              <a
                href={lastBlobUrl}
                download={`medsocial-recording-${Date.now()}.webm`}
                className="inline-flex items-center gap-2 text-sm underline"
              >
                <Download className="size-4" /> Download again
              </a>
            </div>
          )}

          <p className="text-xs opacity-60">
            Recording happens entirely on your device. The file is saved to your downloads folder
            automatically when you stop.
          </p>
        </aside>
      </main>
    </div>
  );
}
