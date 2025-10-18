import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Report = Database["public"]["Tables"]["reports"]["Row"];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report?: Report | null;
}

export const ReportDialog = ({ open, onOpenChange, report }: ReportDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [reportTime, setReportTime] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  useEffect(() => {
    if (report) {
      setTitle(report.title);
      setDescription(report.description || "");
      setReportDate(report.report_date);
      setReportTime(report.report_time);
    } else {
      resetForm();
    }
  }, [report, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setReportDate(new Date().toISOString().split("T")[0]);
    setReportTime(new Date().toTimeString().slice(0, 5));
    setMediaFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error("Ukuran file terlalu besar. Maksimal 50MB");
        return;
      }
      setMediaFile(file);
    }
  };

  const uploadMedia = async (userId: string) => {
    if (!mediaFile) return null;

    const fileExt = mediaFile.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("report-media")
      .upload(fileName, mediaFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("report-media")
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      type: mediaFile.type.startsWith("image/") ? "image" : "video",
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let mediaUrl = report?.media_url;
      let mediaType = report?.media_type;

      if (mediaFile) {
        const media = await uploadMedia(user.id);
        if (media) {
          mediaUrl = media.url;
          mediaType = media.type;
        }
      }

      const reportData = {
        title,
        description,
        report_date: reportDate,
        report_time: reportTime,
        media_url: mediaUrl,
        media_type: mediaType,
        user_id: user.id,
      };

      if (report) {
        const { error } = await supabase
          .from("reports")
          .update(reportData)
          .eq("id", report.id);

        if (error) throw error;
        toast.success("Laporan berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("reports")
          .insert([reportData]);

        if (error) throw error;
        toast.success("Laporan berhasil dibuat!");
      }

      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error("Gagal menyimpan laporan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{report ? "Edit Laporan" : "Buat Laporan Baru"}</DialogTitle>
          <DialogDescription>
            {report ? "Perbarui informasi laporan jaga" : "Isi detail laporan jaga Anda"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reportDate">Tanggal</Label>
              <Input
                id="reportDate"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportTime">Jam</Label>
              <Input
                id="reportTime"
                type="time"
                value={reportTime}
                onChange={(e) => setReportTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul Laporan</Label>
            <Input
              id="title"
              type="text"
              placeholder="Masukkan judul laporan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Detail laporan jaga..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media">Upload Foto/Video (Opsional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="media"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="flex-1"
              />
              {mediaFile && (
                <span className="text-sm text-muted-foreground">
                  {mediaFile.name}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Format: JPG, PNG, GIF, WebP, MP4, MOV, WebM (Maks. 50MB)
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {report ? "Perbarui" : "Simpan"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
