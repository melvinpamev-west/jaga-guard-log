import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit, Trash2, Image, Video, Download } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { generateReportPDF } from "@/utils/pdfGenerator";
import { toast } from "sonner";

type Report = Database["public"]["Tables"]["reports"]["Row"];

interface ReportCardProps {
  report: Report;
  onEdit: (report: Report) => void;
  onDelete: (id: string) => void;
}

export const ReportCard = ({ report, onEdit, onDelete }: ReportCardProps) => {
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: id });
  };

  const handleDownload = () => {
    try {
      generateReportPDF(report);
      toast.success("PDF berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal mengunduh PDF");
    }
  };

  return (
    <Card className="shadow-medium hover:shadow-strong transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{report.title}</CardTitle>
          {report.media_type && (
            <Badge variant="secondary" className="ml-2 flex-shrink-0">
              {report.media_type === "image" ? (
                <Image className="h-3 w-3" />
              ) : (
                <Video className="h-3 w-3" />
              )}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(report.report_date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{report.report_time}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {report.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {report.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-1" />
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(report)}
          className="flex-1"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(report.id)}
          className="flex-1"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Hapus
        </Button>
      </CardFooter>
    </Card>
  );
};
