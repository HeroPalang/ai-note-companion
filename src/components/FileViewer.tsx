import { useState } from "react";
import { ExternalLink, FileText, Download } from "lucide-react";
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

  if (type === "image" && !imgError) {
    return (
      <div className="space-y-2">
        <img
          src={url}
          alt="Attachment"
          className="w-full max-h-80 object-contain rounded-lg border border-border bg-muted/30"
          onError={() => setImgError(true)}
        />
        <OpenLink url={url} />
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div className="space-y-2">
        <iframe
          src={url}
          title="PDF viewer"
          className="w-full h-[400px] rounded-lg border border-border bg-muted/30"
        />
        <OpenLink url={url} />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="space-y-2">
        <video controls className="w-full max-h-80 rounded-lg border border-border bg-muted/30">
          <source src={url} />
        </video>
        <OpenLink url={url} />
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="space-y-2">
        <audio controls className="w-full">
          <source src={url} />
        </audio>
        <OpenLink url={url} />
      </div>
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
        <a href={url} target="_blank" rel="noreferrer">
          <Download className="w-4 h-4 mr-1" /> Download
        </a>
      </Button>
    </div>
  );
};

const OpenLink = ({ url }: { url: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1 text-xs font-body text-primary hover:underline"
  >
    <ExternalLink className="w-3 h-3" /> Open in new tab
  </a>
);

export default FileViewer;
