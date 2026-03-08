import { useState, useEffect } from "react";
import { FileText, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileViewerProps {
  url: string;
}

type FileType = "image" | "pdf" | "video" | "audio" | "document" | "other";

const EXT_MAP: Record<string, FileType> = {
  jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image", svg: "image", bmp: "image",
  pdf: "pdf",
  mp4: "video", webm: "video", ogg: "video", mov: "video",
  mp3: "audio", wav: "audio", m4a: "audio", flac: "audio",
  doc: "document", docx: "document", pptx: "document", ppt: "document",
  xlsx: "document", xls: "document", csv: "document", txt: "document",
};

const getFileType = (url: string): FileType => {
  const clean = url.split("?")[0].toLowerCase();
  const ext = clean.split(".").pop() || "";
  return EXT_MAP[ext] || "other";
};

const FileViewer = ({ url }: FileViewerProps) => {
  const [type, setType] = useState<FileType>(() => getFileType(url));
  const [imgError, setImgError] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Fallback: if extension detection returned "other", probe content-type
  useEffect(() => {
    if (type !== "other") return;
    fetch(url, { method: "HEAD" })
      .then((res) => {
        const ct = res.headers.get("content-type")?.toLowerCase() || "";
        if (ct.startsWith("image/")) setType("image");
        else if (ct === "application/pdf") setType("pdf");
        else if (ct.startsWith("video/")) setType("video");
        else if (ct.startsWith("audio/")) setType("audio");
        else if (ct.includes("document") || ct.includes("sheet") || ct.includes("presentation") || ct === "text/plain" || ct === "text/csv")
          setType("document");
      })
      .catch(() => {});
  }, [url, type]);

  if (type === "image" && !imgError) {
    return (
      <div className="space-y-2">
        <div className="relative overflow-auto rounded-lg border border-border bg-muted/30 max-h-[50vh]">
          <img
            src={url}
            alt="Attachment"
            className="w-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
            onError={() => setImgError(true)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground font-body">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <iframe
        src={url}
        title="PDF viewer"
        className="w-full h-[50vh] rounded-lg border border-border bg-muted/30"
      />
    );
  }

  if (type === "video") {
    return (
      <video controls className="w-full max-h-[50vh] rounded-lg border border-border bg-muted/30">
        <source src={url} />
      </video>
    );
  }

  if (type === "audio") {
    return (
      <audio controls className="w-full">
        <source src={url} />
      </audio>
    );
  }

  // For docs (docx, pptx, xlsx, txt, csv) and unknown — use Google Docs Viewer
  if (type === "document") {
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    return (
      <iframe
        src={viewerUrl}
        title="Document viewer"
        className="w-full h-[50vh] rounded-lg border border-border bg-muted/30"
      />
    );
  }

  // Truly unknown — try Google Docs Viewer as last resort
  return (
    <div className="space-y-3">
      <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
        title="File viewer"
        className="w-full h-[50vh] rounded-lg border border-border bg-muted/30"
      />
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
        <FileText className="w-4 h-4 text-primary" />
        If the preview doesn't load, the file type may not be supported for inline viewing.
      </div>
    </div>
  );
};

export default FileViewer;
