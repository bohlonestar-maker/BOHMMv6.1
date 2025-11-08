import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Trash2, RotateCcw, Download, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ArchivedMembers() {
  const [archivedMembers, setArchivedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArchivedMembers();
  }, []);

  const fetchArchivedMembers = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/archived/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArchivedMembers(response.data);
    } catch (error) {
      toast.error("Failed to load archived members");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to restore ${memberName}?`)) return;

    const token = localStorage.getItem("token");
    try {
      await axios.post(`${API}/archived/members/${memberId}/restore`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Member restored successfully");
      fetchArchivedMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to restore member");
    }
  };

  const handleDeleteArchivedMember = async (memberId, memberName) => {
    if (!window.confirm(`⚠️ PERMANENT DELETION\n\nAre you sure you want to PERMANENTLY delete ${memberName} from archived members?\n\nThis action CANNOT be undone!`)) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API}/archived/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Archived member permanently deleted");
      fetchArchivedMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete archived member");
    }
  };

  const handleExportArchivedMembers = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API}/archived/members/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `archived_members_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("CSV exported successfully");
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const filteredMembers = archivedMembers.filter(member =>
    member.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.chapter?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate("/users")}
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Archived Members</h1>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => navigate("/archived-prospects")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                <Users className="w-4 h-4" />
                View Prospects
              </Button>
              {archivedMembers.length > 0 && (
                <Button
                  onClick={handleExportArchivedMembers}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 flex-1 sm:flex-initial"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <Input
            type="text"
            placeholder="Search by handle, name, chapter, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
          />
        </div>

        {/* Content */}
        <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-slate-300">
              Total: <span className="font-semibold text-white">{filteredMembers.length}</span> archived member(s)
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading archived members...</div>
          ) : filteredMembers.length > 0 ? (
            <div className="space-y-3">
              {filteredMembers.map((member) => {
                const deletedDate = new Date(member.deleted_at);
                const cstDate = new Intl.DateTimeFormat('en-US', {
                  timeZone: 'America/Chicago',
                  dateStyle: 'medium',
                  timeStyle: 'short'
                }).format(deletedDate);
                
                return (
                  <div key={member.id} className="bg-slate-900 border border-slate-700 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1 w-full sm:w-auto">
                        <p className="font-semibold text-white text-sm sm:text-base">{member.handle} - {member.name}</p>
                        <p className="text-xs sm:text-sm text-slate-400">{member.chapter} | {member.title}</p>
                        <p className="text-xs sm:text-sm text-slate-300 mt-2 break-words">
                          <span className="font-medium">Reason:</span> {member.deletion_reason}
                        </p>
                      </div>
                      <div className="flex flex-row sm:flex-row items-center sm:items-start gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                        <div className="text-right text-xs sm:text-sm text-slate-500 hidden sm:block">
                          <p className="text-white">Archived by {member.deleted_by}</p>
                          <p className="text-slate-400">{cstDate} CST</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 border-green-600 min-w-[40px] sm:min-w-[44px]"
                            onClick={() => handleRestoreMember(member.id, member.name)}
                            title="Restore member"
                          >
                            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 border-red-600 min-w-[40px] sm:min-w-[44px]"
                            onClick={() => handleDeleteArchivedMember(member.id, member.name)}
                            title="Permanently delete"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                        <div className="text-left text-xs text-slate-500 sm:hidden w-full mt-2">
                          <p className="text-white">Archived by {member.deleted_by}</p>
                          <p className="text-slate-400">{cstDate} CST</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm sm:text-base">
                {searchTerm ? "No archived members found matching your search" : "No archived members"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
