import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MeetingManager({ userRole }) {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear().toString()]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ date: "", name: "" });
  const [expandedMeetings, setExpandedMeetings] = useState({});

  const token = localStorage.getItem('token');
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchMeetings();
    fetchAvailableYears();
  }, [selectedYear]);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get(`${API}/meetings?year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(response.data);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableYears = async () => {
    try {
      const response = await axios.get(`${API}/admin/available-years`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const years = response.data.years;
      if (!years.includes(selectedYear)) {
        years.push(selectedYear);
      }
      setAvailableYears(years.sort((a, b) => b - a));
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  const handleAddMeeting = async (e) => {
    e.preventDefault();
    if (!newMeeting.date) {
      toast.error("Please select a date");
      return;
    }

    try {
      await axios.post(`${API}/meetings`, newMeeting, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Meeting added successfully");
      setAddDialogOpen(false);
      setNewMeeting({ date: "", name: "" });
      fetchMeetings();
    } catch (error) {
      console.error("Error adding meeting:", error);
      toast.error("Failed to add meeting");
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!confirm("Are you sure you want to delete this meeting? All attendance records will be lost.")) {
      return;
    }

    try {
      await axios.delete(`${API}/meetings/${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Meeting deleted");
      fetchMeetings();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast.error("Failed to delete meeting");
    }
  };

  const openAttendanceDialog = async (meeting) => {
    setSelectedMeeting(meeting);
    setLoadingAttendance(true);
    setAttendanceDialogOpen(true);

    try {
      const response = await axios.get(`${API}/meetings/${meeting.id}/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceData(response.data.attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance");
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleAttendanceChange = async (memberId, newStatus) => {
    // Update local state immediately
    setAttendanceData(prev => prev.map(a => 
      a.member_id === memberId ? { ...a, status: newStatus } : a
    ));

    // Save to server
    try {
      await axios.put(
        `${API}/meetings/${selectedMeeting.id}/attendance/${memberId}?status=${newStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast.error("Failed to update attendance");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAttendanceSummary = (meeting) => {
    // This would require fetching attendance for each meeting
    // For now, show a placeholder
    return null;
  };

  const toggleMeetingExpand = (meetingId) => {
    setExpandedMeetings(prev => ({
      ...prev,
      [meetingId]: !prev[meetingId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading meetings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
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
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-400" />
                Meeting Manager
              </h1>
              <p className="text-slate-400 text-sm">Track weekly meetings and attendance</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Year Selector */}
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-28 bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year} className="text-white hover:bg-slate-700">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {isAdmin && (
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Meeting
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-white">{meetings.length}</div>
              <div className="text-sm text-slate-400">Total Meetings</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{selectedYear}</div>
              <div className="text-sm text-slate-400">Current Year</div>
            </CardContent>
          </Card>
        </div>

        {/* Meetings List */}
        {meetings.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No meetings recorded for {selectedYear}</p>
              {isAdmin && (
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Meeting
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {formatDate(meeting.date)}
                        </div>
                        {meeting.name && (
                          <div className="text-sm text-slate-400">{meeting.name}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => openAttendanceDialog(meeting)}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Attendance
                      </Button>
                      {isAdmin && (
                        <Button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-600/50 text-red-400 hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Meeting Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Add New Meeting
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddMeeting} className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-200">Date <span className="text-red-400">*</span></Label>
              <Input
                type="date"
                value={newMeeting.date}
                onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                required
                className="mt-1 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <Label className="text-slate-200">Meeting Name <span className="text-slate-500">(optional)</span></Label>
              <Input
                value={newMeeting.name}
                onChange={(e) => setNewMeeting({ ...newMeeting, name: e.target.value })}
                placeholder="e.g., Weekly Meeting, Special Event"
                className="mt-1 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Add Meeting
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 w-[95vw] max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Attendance - {selectedMeeting && formatDate(selectedMeeting.date)}
            </DialogTitle>
          </DialogHeader>
          
          {loadingAttendance ? (
            <div className="text-center py-8 text-slate-400">Loading attendance...</div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 mt-4">
              {/* Summary */}
              <div className="flex gap-4 mb-4 text-sm">
                <span className="text-green-400">
                  ✓ {attendanceData.filter(a => a.status === 1).length} Present
                </span>
                <span className="text-orange-400">
                  ⏳ {attendanceData.filter(a => a.status === 2).length} Excused
                </span>
                <span className="text-red-400">
                  ✗ {attendanceData.filter(a => a.status === 0).length} Absent
                </span>
              </div>
              
              {/* Attendance List */}
              {attendanceData.map((member) => (
                <div 
                  key={member.member_id}
                  className="flex items-center justify-between p-3 bg-slate-900 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      member.status === 1 ? 'bg-green-600' :
                      member.status === 2 ? 'bg-orange-500' :
                      'bg-red-600'
                    }`}>
                      {member.status === 1 ? <CheckCircle className="w-4 h-4" /> :
                       member.status === 2 ? <Clock className="w-4 h-4" /> :
                       <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-white">{member.handle}</div>
                      <div className="text-xs text-slate-400">{member.chapter} • {member.name}</div>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAttendanceChange(member.member_id, 1)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          member.status === 1 
                            ? 'bg-green-600 text-white' 
                            : 'bg-slate-700 text-slate-400 hover:bg-green-600 hover:text-white'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(member.member_id, 2)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          member.status === 2 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-slate-700 text-slate-400 hover:bg-orange-500 hover:text-white'
                        }`}
                      >
                        Excused
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(member.member_id, 0)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          member.status === 0 
                            ? 'bg-red-600 text-white' 
                            : 'bg-slate-700 text-slate-400 hover:bg-red-600 hover:text-white'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
