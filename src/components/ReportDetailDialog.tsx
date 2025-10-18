import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Image as ImageIcon, Video } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";

type Report = Database["public"]["Tables"]["reports"]["Row"];

interface ReportDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report | null;
}

export const ReportDetailDialog = ({ open, onOpenChange, report }: ReportDetailDialogProps) => {
  if (!report) return null;

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{report.title}</DialogTitle>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(report.report_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{report.report_time}</span>
            </div>
            {report.media_type && (
              <Badge variant="secondary">
                {report.media_type === "image" ? (
                  <>
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Foto
                  </>
                ) : (
                  <>
                    <Video className="h-3 w-3 mr-1" />
                    Video
                  </>
                )}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {report.media_url && (
            <div className="rounded-lg overflow-hidden bg-muted">
              {report.media_type === "image" ? (
                <img
                  src={report.media_url}
                  alt={report.title}
                  className="w-full h-auto object-contain max-h-[500px]"
                />
              ) : (
                <video
                  src={report.media_url}
                  controls
                  className="w-full h-auto max-h-[500px]"
                  preload="metadata"
                >
                  Browser Anda tidak mendukung video player.
                </video>
              )}
            </div>
          )}

          {report.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Deskripsi Laporan</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {report.description}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
