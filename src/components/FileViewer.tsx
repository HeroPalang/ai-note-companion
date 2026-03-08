import { useState } from "react";
import { FileText, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileViewerProps {
  url: string;
}

const getFileType = (url: string): "image" | "pdf" | "video" | "audio" | "other" => {
  const clean = url.split("?")[0].toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(clean)) return "image";
  if (/\.pdf$/.test(clean)) return "pdf";
  if (/\.(mp4|webm|ogg)$/.test(clean)) return "video";
  if (/\.(mp3|wav|m4a|ogg|flac)$/.test(clean)) return "audio";
  return "other";
};

const FileViewer = ({ url }: FileViewerProps) => {
  const type = getFileType(url);
  const [imgError, setImgError] = useState(false);
  const [zoom, setZoom] = useState(1);

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

  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border p-4">
      <FileText className="w-8 h-8 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body text-foreground truncate">Attached file</p>
        <p className="text-xs text-muted-foreground">Preview not available for this file type</p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <a href={url} download className="no-underline">
          <Download className="w-4 h-4 mr-1" /> Download
        </a>
      </Button>
    </div>
  );
};

export default FileViewer;
