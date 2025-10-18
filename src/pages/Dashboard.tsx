import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Plus, FileText, Download } from "lucide-react";
import { ReportCard } from "@/components/ReportCard";
import { ReportDialog } from "@/components/ReportDialog";
import { ReportDetailDialog } from "@/components/ReportDetailDialog";
import { generateMultipleReportsPDF } from "@/utils/pdfGenerator";
import type { Database } from "@/integrations/supabase/types";

type Report = Database["public"]["Tables"]["reports"]["Row"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchReports();
      
      // Real-time subscription
      const channel = supabase
        .channel('reports-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reports',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchReports();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUser(session.user);
    }
    setLoading(false);
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("report_date", { ascending: false })
        .order("report_time", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat laporan: " + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleView = (report: Report) => {
    setViewingReport(report);
    setDetailDialogOpen(true);
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus laporan ini?")) return;

    try {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Laporan berhasil dihapus");
      fetchReports();
    } catch (error: any) {
      toast.error("Gagal menghapus laporan: " + error.message);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingReport(null);
    fetchReports();
  };

  const handleDownloadAll = () => {
    if (reports.length === 0) {
      toast.error("Tidak ada laporan untuk diunduh");
      return;
    }

    try {
      generateMultipleReportsPDF(reports);
      toast.success("PDF ringkasan berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal mengunduh PDF");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-medium">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Sistem Laporan Jaga</h1>
              <p className="text-sm text-muted-foreground">Selamat datang, {user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Daftar Laporan</h2>
            <p className="text-muted-foreground mt-1">
              Total {reports.length} laporan
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {reports.length > 0 && (
              <Button 
                variant="outline"
                onClick={handleDownloadAll}
                className="flex-1 sm:flex-none"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Semua
              </Button>
            )}
            <Button 
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-accent shadow-medium hover:shadow-strong transition-all flex-1 sm:flex-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Buat Laporan
            </Button>
          </div>
        </div>

        {reports.length === 0 ? (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Belum Ada Laporan</CardTitle>
              <CardDescription>
                Mulai dengan membuat laporan jaga pertama Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Laporan Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <ReportDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        report={editingReport}
      />

      <ReportDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        report={viewingReport}
      />
    </div>
  );
};

export default Dashboard;
