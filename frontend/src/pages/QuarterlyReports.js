import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Download, FileSpreadsheet, Users, DollarSign, UserCheck, Printer, Eye, Calendar } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CHAPTERS = ["All", "National", "AD", "HA", "HS"];
const QUARTERS = [
  { value: "all", label: "Full Year" },
  { value: "1", label: "Q1 (Jan-Mar)" },
  { value: "2", label: "Q2 (Apr-Jun)" },
  { value: "3", label: "Q3 (Jul-Sep)" },
  { value: "4", label: "Q4 (Oct-Dec)" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function QuarterlyReports() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter.toString());
  const [selectedChapter, setSelectedChapter] = useState("All");
  const [loading, setLoading] = useState(false);
  
  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewType, setPreviewType] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const token = localStorage.getItem('token');
  
  // Generate year options (current year and 10 years back)
  const years = Array.from({ length: 11 }, (_, i) => (currentYear - i).toString());

  // Get months for selected quarter
  const getQuarterMonths = () => {
    if (selectedQuarter === "all") return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const q = parseInt(selectedQuarter);
    const start = (q - 1) * 3;
    return [start, start + 1, start + 2];
  };

  const downloadReport = async (reportType) => {
    setLoading(true);
    try {
      let url = "";
      let filename = "";
      const quarterParam = selectedQuarter === "all" ? "all" : selectedQuarter;
      
      switch (reportType) {
        case "attendance":
          url = `${API}/reports/attendance/quarterly?year=${selectedYear}&quarter=${quarterParam}&chapter=${selectedChapter}`;
          filename = selectedQuarter === "all" 
            ? `attendance_${selectedYear}${selectedChapter !== 'All' ? `_${selectedChapter}` : ''}.csv`
            : `attendance_Q${selectedQuarter}_${selectedYear}${selectedChapter !== 'All' ? `_${selectedChapter}` : ''}.csv`;
          break;
        case "dues":
          url = `${API}/reports/dues/quarterly?year=${selectedYear}&quarter=${quarterParam}&chapter=${selectedChapter}`;
          filename = selectedQuarter === "all"
            ? `dues_${selectedYear}${selectedChapter !== 'All' ? `_${selectedChapter}` : ''}.csv`
            : `dues_Q${selectedQuarter}_${selectedYear}${selectedChapter !== 'All' ? `_${selectedChapter}` : ''}.csv`;
          break;
        case "prospects":
          url = `${API}/reports/prospects/attendance/quarterly?year=${selectedYear}&quarter=${quarterParam}`;
          filename = selectedQuarter === "all"
            ? `prospects_attendance_${selectedYear}.csv`
            : `prospects_attendance_Q${selectedQuarter}_${selectedYear}.csv`;
          break;
        default:
          return;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report downloaded`);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const previewDuesReport = async () => {
    setPreviewLoading(true);
    setPreviewType("dues");
    try {
      const response = await axios.get(`${API}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let members = response.data;
      
      // Filter by chapter if not "All"
      if (selectedChapter !== "All") {
        members = members.filter(m => m.chapter === selectedChapter);
      }
      
      // Sort by chapter order and then by title
      const chapterOrder = { "National": 0, "AD": 1, "HA": 2, "HS": 3 };
      members.sort((a, b) => {
        const chapterDiff = (chapterOrder[a.chapter] || 99) - (chapterOrder[b.chapter] || 99);
        if (chapterDiff !== 0) return chapterDiff;
        return (a.handle || '').localeCompare(b.handle || '');
      });
      
      setPreviewData(members);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('dues-preview-table');
    if (!printContent) return;
    
    const quarterLabel = selectedQuarter === "all" 
      ? `Full Year ${selectedYear}` 
      : `${QUARTERS.find(q => q.value === selectedQuarter)?.label} ${selectedYear}`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Dues Report - ${quarterLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 5px; }
            h2 { font-size: 14px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #333; padding: 4px 6px; text-align: center; }
            th { background-color: #1e293b; color: white; }
            .member-info { text-align: left; }
            .paid { background-color: #dcfce7; color: #166534; }
            .late { background-color: #fef3c7; color: #92400e; }
            .unpaid { background-color: #fee2e2; color: #991b1b; }
            @media print {
              body { padding: 10px; }
              table { font-size: 9px; }
            }
          </style>
        </head>
        <body>
          <h1>Brothers of the Highway - Dues Report</h1>
          <h2>${quarterLabel} ${selectedChapter !== 'All' ? '- ' + selectedChapter + ' Chapter' : '- All Chapters'}</h2>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getDuesStatus = (member, monthIndex) => {
    const yearData = member.dues?.[selectedYear];
    if (!yearData || !yearData[monthIndex]) return "unpaid";
    
    const monthData = yearData[monthIndex];
    if (typeof monthData === 'object') {
      return monthData.status || "unpaid";
    }
    return monthData ? "paid" : "unpaid";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid": return "✓";
      case "late": return "L";
      default: return "✗";
    }
  };

  const quarterMonths = getQuarterMonths();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Members
          </Button>
          
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-green-400" />
            Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Download or print meeting attendance and dues reports by quarter, year, and chapter
          </p>
        </div>

        {/* Filter Controls */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Year Select */}
              <div>
                <Label className="text-slate-300 text-sm">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="mt-1 bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {years.map(year => (
                      <SelectItem key={year} value={year} className="text-white hover:bg-slate-700">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quarter Select */}
              <div>
                <Label className="text-slate-300 text-sm">Period</Label>
                <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                  <SelectTrigger className="mt-1 bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {QUARTERS.map(q => (
                      <SelectItem key={q.value} value={q.value} className="text-white hover:bg-slate-700">
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chapter Select */}
              <div>
                <Label className="text-slate-300 text-sm">Chapter</Label>
                <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                  <SelectTrigger className="mt-1 bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {CHAPTERS.map(ch => (
                      <SelectItem key={ch} value={ch} className="text-white hover:bg-slate-700">
                        {ch === "All" ? "All Chapters" : ch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Member Attendance Report */}
          <Card className="bg-slate-800 border-slate-700 hover:border-green-500/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                Member Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Meeting attendance by chapter for {QUARTERS.find(q => q.value === selectedQuarter)?.label} {selectedYear}
              </p>
              <Button
                onClick={() => downloadReport('attendance')}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </CardContent>
          </Card>

          {/* Dues Report */}
          <Card className="bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                Member Dues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Dues payment status by chapter for {QUARTERS.find(q => q.value === selectedQuarter)?.label} {selectedYear}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={previewDuesReport}
                  disabled={loading || previewLoading}
                  variant="outline"
                  className="flex-1 border-blue-600 text-blue-400 hover:bg-blue-900/30"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  onClick={() => downloadReport('dues')}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Prospects Attendance Report */}
          <Card className="bg-slate-800 border-slate-700 hover:border-orange-500/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-orange-400" />
                Prospect Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Prospect meeting attendance for {QUARTERS.find(q => q.value === selectedQuarter)?.label} {selectedYear}
              </p>
              <Button
                onClick={() => downloadReport('prospects')}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Report Details</h3>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• <strong>Full Year:</strong> Select &quot;Full Year&quot; to get all 12 months in one report</li>
            <li>• <strong>Member Attendance:</strong> Shows meeting count, present/excused/absent stats per member</li>
            <li>• <strong>Member Dues:</strong> Shows paid/late/unpaid status for each month - use Preview to see and Print</li>
            <li>• <strong>Prospect Attendance:</strong> Shows prospect meeting attendance (chapter filter not applicable)</li>
            <li>• Reports are sorted by chapter (National → AD → HA → HS) and then by handle</li>
          </ul>
        </div>
      </div>

      {/* Dues Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                Dues Report - {QUARTERS.find(q => q.value === selectedQuarter)?.label} {selectedYear}
                {selectedChapter !== 'All' && ` - ${selectedChapter}`}
              </span>
              <Button
                onClick={handlePrint}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[70vh]">
            <Table id="dues-preview-table" className="text-sm">
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-white bg-slate-800 sticky left-0 z-10">Member</TableHead>
                  <TableHead className="text-white bg-slate-800">Chapter</TableHead>
                  {quarterMonths.map(monthIndex => (
                    <TableHead key={monthIndex} className="text-white bg-slate-800 text-center px-2">
                      {MONTHS[monthIndex]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((member, idx) => (
                  <TableRow key={member.id || idx} className="border-slate-700">
                    <TableCell className="text-white font-medium sticky left-0 bg-slate-900 z-10 member-info">
                      {member.handle || member.name}
                    </TableCell>
                    <TableCell className="text-slate-300">{member.chapter}</TableCell>
                    {quarterMonths.map(monthIndex => {
                      const status = getDuesStatus(member, monthIndex);
                      return (
                        <TableCell 
                          key={monthIndex} 
                          className={`text-center px-2 ${
                            status === 'paid' ? 'bg-green-900/50 text-green-400 paid' :
                            status === 'late' ? 'bg-yellow-900/50 text-yellow-400 late' :
                            'bg-red-900/50 text-red-400 unpaid'
                          }`}
                        >
                          {getStatusIcon(status)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {previewData.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No members found for the selected filters
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <div className="text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 mr-4">
                <span className="w-3 h-3 bg-green-600 rounded"></span> Paid
              </span>
              <span className="inline-flex items-center gap-1 mr-4">
                <span className="w-3 h-3 bg-yellow-600 rounded"></span> Late
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 bg-red-600 rounded"></span> Unpaid
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {previewData.length} members
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
