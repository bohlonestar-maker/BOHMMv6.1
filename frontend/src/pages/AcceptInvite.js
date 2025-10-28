import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid invitation link");
      navigate("/login");
      return;
    }

    fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      const response = await axios.get(`${API}/invites/${token}`);
      setInviteData(response.data);
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid or expired invitation");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(`${API}/invites/accept`, {
        token,
        username,
        password
      });

      toast.success("Account created successfully!");
      
      // Auto-login
      const { token: authToken, username: user, role } = response.data;
      localStorage.setItem('token', authToken);
      localStorage.setItem('username', user);
      localStorage.setItem('role', role);
      
      setTimeout(() => navigate("/"), 1000);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create account");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-slate-600">Loading invitation...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="bg-slate-800 p-4 rounded-xl">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-2 text-slate-900">
            You're Invited!
          </h1>
          <p className="text-center text-slate-600 mb-2">
            Brothers of the Highway Member Directory
          </p>
          <p className="text-center text-sm text-slate-500 mb-8">
            Role: <span className="font-medium">{inviteData?.role}</span> • Email: <span className="font-medium">{inviteData?.email}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                data-testid="invite-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                data-testid="invite-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
                required
                minLength={6}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                data-testid="invite-confirm-password-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={6}
                className="mt-1.5"
              />
            </div>

            <Button
              type="submit"
              data-testid="create-account-button"
              disabled={submitting}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-6 rounded-lg font-medium text-base"
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
