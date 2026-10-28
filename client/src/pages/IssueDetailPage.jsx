import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  MapPin,
  Calendar,
  User,
  CheckCircle,
  AlertTriangle,
  Flag,
  RotateCcw,
  Clock,
  Shield,
  MessageSquare,
  Wrench,
  Send,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button, Badge } from '../components/ui';

const IssueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isStaff } = useAuth();
  const { socket } = useSocket();

  const [report, setReport] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isStaffNote, setIsStaffNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals / forms
  const [reopenModal, setReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [flagModal, setFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  // Admin Assign & Review state
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [assignPriority, setAssignPriority] = useState('medium');

  // Staff Resolution Evidence state
  const [resolveModal, setResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionFiles, setResolutionFiles] = useState([]);

  const fetchReport = async () => {
    try {
      const res = await api.get(`/reports/${id}`);
      if (res?.success) {
        setReport(res.data.report);
        setUserVote(res.data.userVote);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/reports/${id}/comments`);
      if (res?.success) {
        setComments(res.data.comments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStaffList = async () => {
    if (isAdmin) {
      try {
        const res = await api.get('/users?role=staff');
        if (res?.success) {
          setStaffList(res.data.users || []);
          if (res.data.users.length > 0) setSelectedStaff(res.data.users[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchReport();
    fetchComments();
    fetchStaffList();

    if (socket) {
      socket.emit('join_report', id);
      socket.on('report:detail_updated', (updated) => {
        if (updated._id === id) setReport(updated);
      });
      socket.on('comment:new', (comment) => {
        setComments((prev) => [...prev, comment]);
      });
    }

    return () => {
      if (socket) {
        socket.emit('leave_report', id);
        socket.off('report:detail_updated');
        socket.off('comment:new');
      }
    };
  }, [id, socket]);

  // Atomic verification voting
  const handleVote = async (voteType = 'confirm') => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/reports/${id}/verify`, { voteType });
      if (res?.success) {
        setReport(res.data.report);
        setUserVote(res.data.userVote);
      }
    } catch (err) {
      alert(err.message || 'Failed to process verification vote');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Abuse Flag
  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post(`/reports/${id}/verify`, {
        voteType: 'flag',
        reason: flagReason,
      });
      if (res?.success) {
        setReport(res.data.report);
        setUserVote('flag');
        setFlagModal(false);
        setFlagReason('');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post(`/reports/${id}/comments`, {
        content: newComment,
        isStaffNote,
      });
      if (res?.success) {
        setNewComment('');
        setIsStaffNote(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    }
  };

  // Admin Assign
  const handleAssign = async () => {
    if (!selectedStaff) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/reports/${id}/assign`, {
        staffId: selectedStaff,
        priority: assignPriority,
      });
      if (res?.success) {
        setReport(res.data.report);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Staff status transition
  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'resolved') {
      setResolveModal(true);
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/reports/${id}/status`, { status: newStatus });
      if (res?.success) {
        setReport(res.data.report);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Staff submit resolution with evidence
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const data = new FormData();
      data.append('status', 'resolved');
      data.append('note', resolutionNotes);
      resolutionFiles.forEach((file) => {
        data.append('evidenceImages', file);
      });

      const res = await api.post(`/reports/${id}/status`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res?.success) {
        setReport(res.data.report);
        setResolveModal(false);
        setResolutionNotes('');
        setResolutionFiles([]);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Student Reopen
  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (reopenReason.length < 5) {
      alert('Please provide a reason of at least 5 characters');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/reports/${id}/reopen`, { reason: reopenReason });
      if (res?.success) {
        setReport(res.data.report);
        setReopenModal(false);
        setReopenReason('');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Issue Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'This report may have been deleted.'}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/issues')} className="mt-4">
          Back to Public Issues
        </Button>
      </div>
    );
  }

  const isReporter = user?._id === report.reporter?._id;
  const isAssignedStaff = user?._id === report.assignedStaff?._id;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Info */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Badge variant={report.status}>{report.status}</Badge>
            <Badge variant={report.priority}>{report.priority} priority</Badge>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-2 border-l border-slate-200">
              {report.category}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Report ID: #{report._id.slice(-6).toUpperCase()}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-4 leading-tight">
          {report.title}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span>
              <strong>Location:</strong> {report.building} ({report.locationDetail})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span>
              <strong>Reporter:</strong> {report.reporter?.name || 'Anonymous'}{' '}
              <span className="text-slate-400 font-normal">({report.reporter?.department})</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span>
              <strong>Submitted:</strong> {new Date(report.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Verification & Anti-abuse Action Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <Button
              variant={userVote === 'confirm' ? 'success' : 'secondary'}
              size="sm"
              disabled={isReporter || actionLoading}
              onClick={() => handleVote('confirm')}
              className="gap-1.5"
            >
              <CheckCircle className="h-4 w-4" />
              {userVote === 'confirm' ? 'Verified by You' : 'Verify Report'}
              <span className="ml-1 px-1.5 py-0.2 bg-black/10 rounded-full text-xs">
                {report.verificationCount}
              </span>
            </Button>

            <Button
              variant={userVote === 'flag' ? 'danger' : 'ghost'}
              size="sm"
              disabled={isReporter || actionLoading}
              onClick={() => setFlagModal(true)}
              className="gap-1.5 text-xs text-slate-500 hover:text-rose-600"
            >
              <Flag className="h-3.5 w-3.5" />
              {userVote === 'flag' ? 'Flagged as Spam' : 'Report Abuse'}
            </Button>
          </div>

          {/* Reopen Action (If resolved and user wants to dispute repair) */}
          {report.status === 'resolved' && (
            <Button
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-300 hover:bg-orange-50 gap-1.5"
              onClick={() => setReopenModal(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Dispute Repair / Request Reopening
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details & Resolution Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs">
              Issue Description & Evidence
            </h2>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {report.description}
            </p>

            {/* Images */}
            {report.images && report.images.length > 0 && (
              <div className="pt-4">
                <div className="text-xs font-semibold text-slate-600 mb-2">Attached Photographs:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {report.images.map((img, i) => (
                    <a
                      key={i}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative h-36 rounded-xl overflow-hidden border border-slate-200 block"
                    >
                      <img src={img.url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium gap-1">
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resolution Evidence Box (When Resolved) */}
          {report.status === 'resolved' && report.resolutionEvidence && (
            <div className="bg-emerald-50/70 border border-emerald-200 p-6 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Work Resolution Evidence (Completed by Maintenance Staff)
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                {report.resolutionEvidence.notes || 'Repair completed according to safety specifications.'}
              </p>
              {report.resolutionEvidence.completedAt && (
                <div className="text-[11px] text-emerald-700">
                  Completed on {new Date(report.resolutionEvidence.completedAt).toLocaleString()}
                </div>
              )}
              {report.resolutionEvidence.images && report.resolutionEvidence.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {report.resolutionEvidence.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="h-28 rounded-xl overflow-hidden border border-emerald-300 block shadow-2xs"
                    >
                      <img src={img.url} alt="After repair" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discussion & Work Notes */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              Community Discussion & Staff Work Notes ({comments.length})
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto divide-y divide-slate-100">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No comments yet. Start the conversation below.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="pt-3 first:pt-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{c.user?.name}</span>
                        <Badge variant={c.user?.role === 'staff' ? 'assigned' : c.user?.role === 'admin' ? 'critical' : 'default'}>
                          {c.user?.role}
                        </Badge>
                        {c.isStaffNote && (
                          <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-semibold">
                            Official Staff Note
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed pl-1">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="pt-3 border-t border-slate-100 space-y-2">
                <textarea
                  rows={2}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Leave a comment or update..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-between">
                  {(isStaff || isAdmin) && (
                    <label className="flex items-center gap-1.5 text-xs text-purple-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isStaffNote}
                        onChange={(e) => setIsStaffNote(e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      Post as official work note
                    </label>
                  )}
                  <Button type="submit" variant="primary" size="sm" className="ml-auto gap-1">
                    <Send className="h-3.5 w-3.5" />
                    Send Comment
                  </Button>
                </div>
              </form>
            ) : (
              <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
                Please{' '}
                <button onClick={() => navigate('/login')} className="text-indigo-600 font-semibold underline">
                  log in
                </button>{' '}
                to join the discussion.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Controls & Audit Lifecycle */}
        <div className="space-y-6">
          {/* Admin / Staff Workflow Controls */}
          {(isAdmin || isAssignedStaff) && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-indigo-600" />
                Workflow Actions
              </h3>

              {/* Admin Assignment */}
              {isAdmin && (
                <div className="p-3.5 bg-slate-50 rounded-xl space-y-3">
                  <div className="text-xs font-semibold text-slate-700">Assign Maintenance Staff</div>
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">-- Choose Personnel --</option>
                    {staffList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.department})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <select
                      value={assignPriority}
                      onChange={(e) => setAssignPriority(e.target.value)}
                      className="text-xs p-2 rounded-lg border border-slate-200 bg-white flex-1"
                    >
                      <option value="low">Low (72h SLA)</option>
                      <option value="medium">Medium (48h SLA)</option>
                      <option value="high">High (24h SLA)</option>
                      <option value="critical">Critical (12h SLA)</option>
                    </select>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAssign}
                      disabled={!selectedStaff || actionLoading}
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              )}

              {/* Staff Work Progress buttons */}
              {(isAssignedStaff || isAdmin) && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold text-slate-700">Update Work Progress:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {report.status === 'assigned' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => handleStatusChange('fixing')}
                        disabled={actionLoading}
                      >
                        Start Fixing
                      </Button>
                    )}
                    {['assigned', 'fixing', 'reopened'].includes(report.status) && (
                      <Button
                        variant="success"
                        size="sm"
                        className="w-full text-xs col-span-2"
                        onClick={() => handleStatusChange('resolved')}
                        disabled={actionLoading}
                      >
                        Mark as Resolved (Upload Proof)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit Lifecycle History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-500" />
              Audit Trail & Status History
            </h3>

            <div className="relative border-l-2 border-indigo-200 ml-3 space-y-4 py-1">
              {report.history && report.history.map((step, idx) => (
                <div key={idx} className="relative pl-5">
                  <div className="absolute -left-[9px] top-1 h-3.5 w-3.5 rounded-full bg-indigo-600 border-2 border-white"></div>
                  <div className="text-xs font-bold text-slate-800 capitalize">
                    {step.toStatus}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {step.actorName} ({step.actorRole})
                  </div>
                  {step.note && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded mt-1 border border-slate-100">
                      {step.note}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(step.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Evidence Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Upload Resolution Evidence
            </h3>
            <p className="text-xs text-slate-500">
              Please explain the repair work conducted and attach photos of the resolved issue.
            </p>
            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Resolution Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Replaced faulty circuit breaker with 32A MCB, tested current load and secured panel."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Completion Photos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setResolutionFiles(Array.from(e.target.files))}
                  className="text-xs text-slate-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setResolveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="success" size="sm" isLoading={actionLoading}>
                  Confirm & Resolve
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Dispute Modal */}
      {reopenModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              Dispute Resolution & Reopen
            </h3>
            <p className="text-xs text-slate-500">
              Explain why the repair was inadequate so campus staff can address it properly.
            </p>
            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. Water is still leaking from the bottom seam despite tap change."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setReopenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
                  Submit Reopen Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {flagModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Flag className="h-5 w-5 text-rose-600" />
              Flag Issue for Moderation
            </h3>
            <p className="text-xs text-slate-500">
              Report suspected spam, inappropriate language, or fake issues for administrative review.
            </p>
            <form onSubmit={handleFlagSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Describe reason for flagging..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setFlagModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" size="sm" isLoading={actionLoading}>
                  Submit Abuse Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueDetailPage;
