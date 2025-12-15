import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import axios from "axios";
import NavBar from "../../components/NavBar";
import SideBarAdmin from "../../components/SideBarAdmin";
import "../../styles/Admin/DashboardAdmin.css";

const DashboardAdmin = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState("WEEK");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [statusDistribution, setStatusDistribution] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Admin");

  const periodOptions = [
    { value: "WEEK", label: "Last 7 Days" },
    { value: "MONTH", label: "Last 30 Days" },
    { value: "ALL", label: "All Time" },
  ];

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchUserInfo = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (userId) {
        const response = await axios.get(`/api/auth/get-users/${userId}`);
        setUserName(response.data.name || "Admin");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      setUserName("Admin");
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, trendRes, statusRes, userRes] = await Promise.all([
        axios.get(`/api/admin/dashboard/meeting-statistics?period=${period}`),
        axios.get(`/api/admin/dashboard/meeting-trend?period=${period}`),
        axios.get(
          `/api/admin/dashboard/meeting-status-distribution?period=${period}`
        ),
        axios.get(`/api/admin/dashboard/user-statistics`),
      ]);

      setStatistics(statsRes.data.data);

      const trendObj = trendRes.data.data.data;
      const formattedTrendData = Object.entries(trendObj).map(
        ([key, value]) => ({
          name: formatLabel(key, period),
          meetings: value,
        })
      );
      setTrendData(formattedTrendData);

      const statusObj = statusRes.data.data;
      const formattedStatusData = [
        { name: "Scheduled", value: statusObj.SCHEDULED || 0 },
        { name: "Cancelled", value: statusObj.CANCELLED || 0 },
        { name: "Pending", value: statusObj.PENDING_APPROVAL || 0 },
      ].filter((item) => item.value > 0);
      setStatusDistribution(formattedStatusData);

      setUserStats(userRes.data.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatLabel = (label, period) => {
    if (period === "WEEK") {
      return label.substring(0, 3);
    } else if (period === "MONTH") {
      const date = new Date(label);
      return date.getMonth() + 1 + "/" + date.getDate();
    } else {
      return label.substring(0, 7);
    }
  };

  const handleMenuClick = (itemId) => {
    setActiveMenuItem(itemId);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handlePeriodChange = (value) => {
    setPeriod(value);
    setDropdownOpen(false);
  };

  const COLORS = ["#0084ff", "#00d084", "#ffa500"];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">Meetings: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  if (loading && !statistics) {
    return (
      <div className="my-project-container">
        <NavBar onToggleSidebar={toggleSidebar} />
        <div className="main-layout">
          <SideBarAdmin
            activeItem={activeMenuItem}
            onItemClick={handleMenuClick}
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
          <main className="main-content">
            <div className="content-inner">
              <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Loading Dashboard...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="my-project-container">
      <NavBar onToggleSidebar={toggleSidebar} />

      <div className="main-layout">
        <SideBarAdmin
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        <main className="main-content">
          <div className="content-inner-dashboard">
            {/* Dashboard Header */}
            <div className="dashboard-header">
              <div className="header-title">
                <h1 className="page-title">Meeting Management Dashboard</h1>
                <p className="page-subtitle">
                  Welcome back, <span className="user-name">{userName}</span>
                </p>
              </div>
              {/* <div className="header-stats-mini">
                <div className="mini-stat">
                  <span className="mini-label">Total</span>
                  <span className="mini-value">
                    {statistics?.totalMeetings || 0}
                  </span>
                </div>
              </div> */}
            </div>

            {/* Period Dropdown Selector */}
            <div className="period-section">
              <label className="dropdown-label">📅 Select Time Period</label>
              <div className="custom-dropdown">
                <button
                  className="dropdown-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="dropdown-text">
                    {periodOptions.find((opt) => opt.value === period)?.label}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`chevron ${dropdownOpen ? "open" : ""}`}
                  />
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    {periodOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`dropdown-item ${
                          period === option.value ? "active" : ""
                        }`}
                        onClick={() => handlePeriodChange(option.value)}
                      >
                        <span className="dropdown-item-icon">
                          {period === option.value && "✓"}
                        </span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card stat-card-blue">
                <div className="stat-icon">
                  <Calendar size={28} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Total Meetings</p>
                  <h3 className="stat-value">
                    {statistics?.totalMeetings || 0}
                  </h3>
                </div>
                <div className="stat-bg-icon">📊</div>
              </div>

              <div className="stat-card stat-card-green">
                <div className="stat-icon">
                  <TrendingUp size={28} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Scheduled</p>
                  <h3 className="stat-value">
                    {statistics?.scheduledMeetings || 0}
                  </h3>
                </div>
                <div className="stat-bg-icon">✓</div>
              </div>

              <div className="stat-card stat-card-red">
                <div className="stat-icon">
                  <AlertCircle size={28} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Cancelled</p>
                  <h3 className="stat-value">
                    {statistics?.cancelledMeetings || 0}
                  </h3>
                </div>
                <div className="stat-bg-icon">✕</div>
              </div>

              <div className="stat-card stat-card-orange">
                <div className="stat-icon">
                  <AlertCircle size={28} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Pending Approval</p>
                  <h3 className="stat-value">
                    {statistics?.pendingMeetings || 0}
                  </h3>
                </div>
                <div className="stat-bg-icon">⏳</div>
              </div>

              <div className="stat-card stat-card-purple">
                <div className="stat-icon">
                  <Users size={28} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Total Users</p>
                  <h3 className="stat-value">{userStats?.totalUsers || 0}</h3>
                </div>
                <div className="stat-bg-icon">👥</div>
              </div>

              {/* <div className="stat-card stat-card-pink">
                <div className="stat-icon">
                  <TrendingUp size={28} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Active Users</p>
                  <h3 className="stat-value">{userStats?.activeUsers || 0}</h3>
                </div>
                <div className="stat-bg-icon">🔥</div>
              </div> */}
            </div>

            {/* Charts Section */}
            <div className="charts-section">
              <h2 className="section-title">📈 Analytics Overview</h2>

              <div className="charts-container">
                {/* Meeting Trend Chart */}
                <div className="chart-card">
                  <div className="chart-header">
                    <h3 className="chart-title">Meeting Trend</h3>
                    <span className="chart-badge">Line Chart</span>
                  </div>
                  {trendData && trendData.length > 0 ? (
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart
                          data={trendData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorMeetings"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#0084ff"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#0084ff"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="0"
                            stroke="#f0f0f0"
                            vertical={true}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: "#5f6368" }}
                          />
                          <YAxis tick={{ fontSize: 12, fill: "#5f6368" }} />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: "#0084ff", strokeWidth: 2 }}
                          />
                          <Legend wrapperStyle={{ paddingTop: "20px" }} />
                          <Line
                            type="monotone"
                            dataKey="meetings"
                            stroke="#0084ff"
                            strokeWidth={3}
                            dot={{
                              fill: "#0084ff",
                              r: 6,
                              strokeWidth: 2,
                              stroke: "#fff",
                            }}
                            activeDot={{ r: 8, strokeWidth: 2 }}
                            name="Meetings"
                            isAnimationActive={true}
                            animationDuration={800}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="no-data">No data available</p>
                  )}
                </div>

                {/* Meeting Status Distribution */}
                <div className="chart-card">
                  <div className="chart-header">
                    <h3 className="chart-title">Status Distribution</h3>
                    <span className="chart-badge">Pie Chart</span>
                  </div>
                  {statusDistribution && statusDistribution.length > 0 ? (
                    <div className="chart-wrapper pie-wrapper">
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                            animationDuration={800}
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "2px solid #0084ff",
                              borderRadius: "12px",
                              padding: "12px 16px",
                              boxShadow: "0 4px 12px rgba(0, 132, 255, 0.15)",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="no-data">No data available</p>
                  )}
                </div>

                {/* Meeting Trend Bar Chart */}
                <div className="chart-card full-width">
                  <div className="chart-header">
                    <h3 className="chart-title">
                      Meeting Count by Time Period
                    </h3>
                    <span className="chart-badge">Bar Chart</span>
                  </div>
                  {trendData && trendData.length > 0 ? (
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                          data={trendData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorBar"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#0084ff"
                                stopOpacity={1}
                              />
                              <stop
                                offset="100%"
                                stopColor="#0066cc"
                                stopOpacity={0.8}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="0"
                            stroke="#f0f0f0"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: "#5f6368" }}
                          />
                          <YAxis tick={{ fontSize: 12, fill: "#5f6368" }} />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "rgba(0, 132, 255, 0.1)" }}
                          />
                          <Legend wrapperStyle={{ paddingTop: "20px" }} />
                          <Bar
                            dataKey="meetings"
                            fill="url(#colorBar)"
                            radius={[12, 12, 4, 4]}
                            name="Meetings"
                            animationDuration={800}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="no-data">No data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardAdmin;
