import { useState } from "react";
import API from "../api/healthApi";
import "../App.css";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#0d0d1a", border: "1px solid #7c3aed", padding: "8px 12px", borderRadius: 2, fontSize: 12 }}>
        <p style={{ color: "#ec4899", fontFamily: "monospace" }}>{label}</p>
        <p style={{ color: "#a78bfa" }}>{payload[0].name}: <b>{payload[0].value}</b></p>
      </div>
    );
  }
  return null;
};

export default function AllPages() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({
    date: "", steps: "", calories: "", water: "", sleep: "", weight: "", mood: "", notes: ""
  });
  const [editId, setEditId] = useState(null);
  const [view, setView] = useState("dashboard");

  const handleSubmit = async () => {
    try {
      if (isLogin) {
        const res = await API.post("/auth/login", { email, password });
        setUser(res.data);
        fetchMetrics(res.data.userId);
        fetchStats(res.data.userId);
      } else {
        const res = await API.post("/auth/register", { name, email, password });
        alert("Account created! Welcome, " + res.data.name);
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong");
    }
  };

  const fetchMetrics = async (userId) => {
    const res = await API.get(`/metrics?userId=${userId}`);
    setMetrics(res.data);
  };

  const fetchStats = async (userId) => {
    const res = await API.get(`/metrics/stats?userId=${userId}`);
    setStats(res.data);
  };

  const handleLog = async () => {
    try {
      if (editId) {
        await API.put(`/metrics/${editId}`, { ...form, userId: user.userId });
        setEditId(null);
      } else {
        await API.post("/metrics", { ...form, userId: user.userId });
      }
      setForm({ date: "", steps: "", calories: "", water: "", sleep: "", weight: "", mood: "", notes: "" });
      fetchMetrics(user.userId);
      fetchStats(user.userId);
      setView("dashboard");
    } catch (err) {
      alert("Error saving");
    }
  };

  const handleDelete = async (id) => {
    await API.delete(`/metrics/${id}`);
    fetchMetrics(user.userId);
    fetchStats(user.userId);
  };

  const handleEdit = (m) => {
    setForm({
      date: m.date, steps: m.steps, calories: m.calories,
      water: m.water, sleep: m.sleep, weight: m.weight,
      mood: m.mood, notes: m.notes
    });
    setEditId(m._id);
    setView("log");
  };

  const chartData = [...metrics].reverse().map((m) => ({
    date: m.date?.slice(5) || "",
    steps: +m.steps || 0,
    calories: +m.calories || 0,
    sleep: +m.sleep || 0,
    water: +m.water || 0,
  }));

  // AUTH
  if (!user) {
    return (
      <div className="bg">
        <div className="card">
          <div className="title">{isLogin ? "// LOGIN" : "// REGISTER"}</div>
          {!isLogin && <input placeholder="Name" onChange={(e) => setName(e.target.value)} />}
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleSubmit}>{isLogin ? "Access System" : "Create Account"}</button>
          <p className="toggle" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "[ new user? register ]" : "[ back to login ]"}
          </p>
        </div>
      </div>
    );
  }

  // DASHBOARD
  if (view === "dashboard") {
    return (
      <div className="bg" style={{ alignItems: "flex-start", paddingTop: 40 }}>
        <div className="dashboard">
          <p className="neon-text">// {user.name}'s health.exe</p>

          <div className="stat-grid">
            {[
              { icon: "👟", label: "Avg Steps", value: stats?.avgSteps ?? "—" },
              { icon: "🔥", label: "Avg Calories", value: stats?.avgCalories ?? "—" },
              { icon: "💧", label: "Avg Water", value: stats?.avgWater ? `${stats.avgWater}gl` : "—" },
              { icon: "😴", label: "Avg Sleep", value: stats?.avgSleep ? `${stats.avgSleep}h` : "—" },
              { icon: "📁", label: "Total Logs", value: stats?.totalEntries ?? 0 },
            ].map((s) => (
              <div className="stat-box" key={s.label}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="chart-grid">
              <div className="chart-box">
                <h4>// Steps Over Time</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fill: "#4a4a6a", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#4a4a6a", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="steps" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 3 }} name="Steps" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-box">
                <h4>// Calories</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fill: "#4a4a6a", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#4a4a6a", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="calories" fill="#ec4899" radius={[2, 2, 0, 0]} name="Calories" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-box">
                <h4>// Sleep Tracker</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fill: "#4a4a6a", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#4a4a6a", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sleep" fill="#06b6d4" radius={[2, 2, 0, 0]} name="Sleep (hrs)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-box">
                <h4>// Water Intake</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fill: "#4a4a6a", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#4a4a6a", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="water" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", r: 3 }} name="Water (gl)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {chartData.length === 0 && (
            <div style={{ textAlign: "center", color: "#4a4a6a", padding: "40px 0", fontFamily: "monospace", letterSpacing: 2 }}>
              NO DATA FOUND. START LOGGING.
            </div>
          )}

          <div className="btn-row">
            <button onClick={() => setView("log")}>+ Log Today</button>
            <button className="cyan" onClick={() => setView("history")}>History</button>
            <button className="danger" onClick={() => setUser(null)}>Logout</button>
          </div>
        </div>
      </div>
    );
  }

  // LOG
  if (view === "log") {
    return (
      <div className="bg">
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="title">{editId ? "// Edit.log" : "// New.log"}</div>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input placeholder="Steps" value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} />
          <input placeholder="Calories" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
          <input placeholder="Water (glasses)" value={form.water} onChange={(e) => setForm({ ...form, water: e.target.value })} />
          <input placeholder="Sleep (hours)" value={form.sleep} onChange={(e) => setForm({ ...form, sleep: e.target.value })} />
          <input placeholder="Weight (kg)" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          <input placeholder="Mood" value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })} />
          <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={handleLog}>{editId ? "Update" : "Save"}</button>
            <button className="danger" onClick={() => { setView("dashboard"); setEditId(null); }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // HISTORY
  if (view === "history") {
    return (
      <div className="bg" style={{ alignItems: "flex-start", paddingTop: 40 }}>
        <div className="dashboard">
          <p className="neon-text">// history.log</p>
          {metrics.length === 0 && (
            <p style={{ color: "#4a4a6a", fontFamily: "monospace", letterSpacing: 2 }}>NO ENTRIES FOUND.</p>
          )}
          {metrics.map((m) => (
            <div className="history-item" key={m._id}>
              <b>{m.date}</b>
              <span style={{ marginLeft: 12, color: "#a0a0c0" }}>
                👟 {m.steps} &nbsp;🔥 {m.calories} &nbsp;💧 {m.water}gl &nbsp;😴 {m.sleep}h &nbsp;⚖️ {m.weight}kg &nbsp;😊 {m.mood}
              </span>
              {m.notes && <p style={{ color: "#4a4a6a", marginTop: 4, fontSize: 12 }}>// {m.notes}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={{ width: "auto", padding: "6px 16px" }} onClick={() => handleEdit(m)}>Edit</button>
                <button className="danger" style={{ width: "auto", padding: "6px 16px" }} onClick={() => handleDelete(m._id)}>Delete</button>
              </div>
            </div>
          ))}
          <button className="cyan" style={{ marginTop: 16 }} onClick={() => setView("dashboard")}>← Back</button>
        </div>
      </div>
    );
  }
}