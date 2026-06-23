import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const STATUSES = [
  "Applied",
  "OA Scheduled",
  "OA Cleared",
  "Interview Scheduled",
  "Rejected",
  "Offer Received",
];

const emptyForm = {
  company: "",
  role: "",
  status: "Applied",
  appliedDate: "",
  deadline: "",
  link: "",
  notes: "",
};

function Applications() {
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/applications");
      setApplications(res.data.applications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.company.trim() || !form.role.trim()) {
      setError("Company and role are required");
      return;
    }

    try {
      if (editingId) {
        const res = await api.put(`/api/applications/${editingId}`, form);
        setApplications((prev) =>
          prev.map((app) =>
            app._id === editingId ? res.data.application : app
          )
        );
      } else {
        const res = await api.post("/api/applications", form);
        setApplications((prev) => [res.data.application, ...prev]);
      }

      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save application");
    }
  };

  const handleEdit = (app) => {
    setEditingId(app._id);
    setForm({
      company: app.company || "",
      role: app.role || "",
      status: app.status || "Applied",
      appliedDate: app.appliedDate ? app.appliedDate.slice(0, 10) : "",
      deadline: app.deadline ? app.deadline.slice(0, 10) : "",
      link: app.link || "",
      notes: app.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this application?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/applications/${id}`);
      setApplications((prev) => prev.filter((app) => app._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete application");
    }
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        app.company.toLowerCase().includes(search.toLowerCase()) ||
        app.role.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      interviews: applications.filter((app) =>
        app.status.toLowerCase().includes("interview")
      ).length,
      offers: applications.filter((app) => app.status === "Offer Received")
        .length,
      rejections: applications.filter((app) => app.status === "Rejected")
        .length,
    };
  }, [applications]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-primary)]">
          Placement Tracker
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Applications</h1>
        <p className="mt-2 text-sm text-slate-400">
          Track off-campus, internship, and placement applications in one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Total Applications</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{stats.total}</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Interviews</p>
          <h2 className="mt-2 text-3xl font-bold text-white">
            {stats.interviews}
          </h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Offers</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{stats.offers}</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Rejections</p>
          <h2 className="mt-2 text-3xl font-bold text-white">
            {stats.rejections}
          </h2>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <h2 className="text-xl font-semibold text-white">
          {editingId ? "Edit Application" : "Add Application"}
        </h2>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="Company"
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
          />

          <input
            name="role"
            value={form.role}
            onChange={handleChange}
            placeholder="Role"
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
          >
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>

          <input
            name="appliedDate"
            type="date"
            value={form.appliedDate}
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
          />

          <input
            name="deadline"
            type="date"
            value={form.deadline}
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
          />

          <input
            name="link"
            value={form.link}
            onChange={handleChange}
            placeholder="Job link"
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
          />

          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Notes"
            className="md:col-span-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button className="rounded-xl bg-[var(--color-primary)] px-5 py-3 font-semibold text-white">
            {editingId ? "Update Application" : "Add Application"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-white"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-4 md:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company or role..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
        >
          <option>All</option>
          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading applications...</p>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
          No applications found.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredApplications.map((app) => (
            <div
              key={app._id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {app.company}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">{app.role}</p>
                </div>

                <span className="rounded-full bg-[var(--color-primary)]/20 px-3 py-1 text-xs text-[var(--color-primary)]">
                  {app.status}
                </span>
              </div>

              <div className="mt-4 space-y-1 text-sm text-slate-400">
                {app.appliedDate && (
                  <p>
                    Applied:{" "}
                    {new Date(app.appliedDate).toLocaleDateString()}
                  </p>
                )}
                {app.deadline && (
                  <p>Deadline: {new Date(app.deadline).toLocaleDateString()}</p>
                )}
                {app.notes && <p>Notes: {app.notes}</p>}
                {app.link && (
                  <a
                    href={app.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[var(--color-primary)]"
                  >
                    View Job Link
                  </a>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleEdit(app)}
                  className="rounded-lg border border-blue-400/30 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/10"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(app._id)}
                  className="rounded-lg border border-red-400/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Applications;