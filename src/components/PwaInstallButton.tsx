import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "sonner";

const PwaInstallButton = () => {
  const { installed, canInstall, isIos, promptInstall } = usePwaInstall();

  if (installed) return null;

  const onClick = async () => {
    if (canInstall) {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        toast.success("Install started.");
      } else if (outcome === "dismissed") {
        toast.message("Install prompt dismissed.");
      } else {
        toast.message("Install prompt is not ready yet.");
      }
      return;
    }

    if (isIos) {
      toast.message("On iPhone/iPad: Share > Add to Home Screen.");
      return;
    }

    toast.message("Install option appears when opened in Chrome/Edge on HTTPS.");
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="h-12 px-8 rounded-xl font-body font-semibold text-base border-border hover:bg-accent"
    >
      <Download className="w-4 h-4 mr-2" />
      Install App
    </Button>
  );
};

export default PwaInstallButton;

