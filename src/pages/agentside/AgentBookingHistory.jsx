import React, { useState, useEffect } from "react";
import { Download, Filter } from "lucide-react";
import { Dropdown } from "react-bootstrap";
import { Gear } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import axios from "axios";

/**
 * Shimmer placeholder row for loading state
 */
const ShimmerRow = () => (
  <tr>
    {Array(8)
      .fill(0)
      .map((_, i) => (
        <td key={i}>
          <div className="shimmer-placeholder" />
        </td>
      ))}
  </tr>
);

const BookingHistory = () => {
  // State
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("UMRAH BOOKINGS");

  // Filter states
  const [orderNo, setOrderNo] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const getLoggedInOrgId = () => {
    try {
      const raw = localStorage.getItem("agentOrganization");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.ids && parsed.ids.length > 0) return parsed.ids[0];
      if (parsed?.id) return parsed.id;
      return null;
    } catch (e) {
      return null;
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("agentAccessToken");
      const orgId = getLoggedInOrgId();

      if (!orgId || !token) {
        throw new Error("Missing organization ID or authentication token.");
      }

      const response = await axios.get(
        `http://127.0.0.1:8000/api/bookings/?organization=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(
        err.response?.data?.detail || err.message || "Failed to fetch bookings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusStyle = (status) => {
    const s = (status || '').toString().toLowerCase();
    if (s === 'active' || s === 'approved' || s === 'confirmed') {
      return { color: '#10B981' };
    }
    if (s === 'pending' || s === 'under-process') {
      return { color: '#F59E0B' };
    }
    if (s === 'inactive' || s === 'cancelled') {
      return { color: '#6B7280' };
    }
    return { color: '#6B7280' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).replace(/ /g, '-');
    } catch (e) {
      return dateString;
    }
  };

  const getPassengerNames = (personDetails) => {
    if (!personDetails || !Array.isArray(personDetails) || personDetails.length === 0) {
      return "N/A";
    }
    const firstPerson = personDetails[0];
    const first = firstPerson.first_name || '';
    const last = firstPerson.last_name || '';
    return `${first} ${last}`.trim() || "N/A";
  };

  // Filter bookings by tab
  const filteredByTab = bookings.filter(booking => {
    if (activeTab === "UMRAH BOOKINGS") {
      return booking.category === "Package" || booking.category === "Custom_Umrah_Package";
    }
    if (activeTab === "Groups Tickets") {
      return booking.category === "Ticket_Booking";
    }
    // Add other tab filters as needed
    return true;
  });

  // Apply search filters
  const filteredBookings = filteredByTab.filter(booking => {
    if (orderNo && !booking.booking_number?.toLowerCase().includes(orderNo.toLowerCase())) {
      return false;
    }
    if (fromDate) {
      const bookingDate = new Date(booking.date);
      const from = new Date(fromDate);
      if (bookingDate < from) return false;
    }
    if (toDate) {
      const bookingDate = new Date(booking.date);
      const to = new Date(toDate);
      if (bookingDate > to) return false;
    }
    return true;
  });

  const handleSearch = () => {
    // Search is reactive, no need for explicit action
  };

  // Get date range display
  const getDateRangeDisplay = () => {
    if (filteredBookings.length === 0) return "No bookings";
    const dates = filteredBookings.map(b => new Date(b.date)).sort((a, b) => a - b);
    const earliest = formatDate(dates[0]);
    const latest = formatDate(dates[dates.length - 1]);
    return `${earliest} to ${latest}`;
  };

  return (
    <>
      <style>
        {`
          .shimmer-placeholder {
            background: #f6f7f8;
            background-image: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
            background-repeat: no-repeat;
            background-size: 800px 104px;
            display: inline-block;
            height: 16px;
            border-radius: 4px;
            animation: placeholderShimmer 1s linear infinite forwards;
            width: 100%;
          }
          @keyframes placeholderShimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } }
          
          .tab-button {
            padding: 8px 20px;
            border: none;
            background: #E5E7EB;
            color: #6B7280;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .tab-button.active {
            background: #3B82F6;
            color: white;
          }
          
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            font-weight: 500;
          }
          
          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
        `}
      </style>

      <div
        className="d-flex"
        style={{
          fontFamily: "Poppins, sans-serif",
          background: "#f6f8fb",
          minHeight: "100vh",
        }}
      >
        <AgentSidebar />

        <div className="flex-grow-1" style={{ overflow: "auto" }}>
          <div className="container-fluid p-0">
            <AgentHeader />

            <div className="p-3 p-lg-4">
              {/* Search Filters */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label small text-muted">Order No.</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type Order No."
                        value={orderNo}
                        onChange={(e) => setOrderNo(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small text-muted">From</label>
                      <input
                        type="date"
                        className="form-control"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small text-muted">To</label>
                      <input
                        type="date"
                        className="form-control"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3 d-flex align-items-end">
                      <button
                        className="btn btn-primary w-100"
                        onClick={handleSearch}
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs and Table */}
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  {/* Category Tabs */}
                  <div className="d-flex gap-2 mb-4 flex-wrap">
                    <button
                      className={`tab-button ${activeTab === "Groups Tickets" ? "active" : ""}`}
                      onClick={() => setActiveTab("Groups Tickets")}
                    >
                      Groups Tickets
                    </button>
                    <button
                      className={`tab-button ${activeTab === "UMRAH BOOKINGS" ? "active" : ""}`}
                      onClick={() => setActiveTab("UMRAH BOOKINGS")}
                    >
                      UMRAH BOOKINGS
                    </button>
                    <button
                      className={`tab-button ${activeTab === "Insurance" ? "active" : ""}`}
                      onClick={() => setActiveTab("Insurance")}
                    >
                      Insurance
                    </button>
                    <button
                      className={`tab-button ${activeTab === "Trips" ? "active" : ""}`}
                      onClick={() => setActiveTab("Trips")}
                    >
                      Trips
                    </button>
                    <button
                      className={`tab-button ${activeTab === "VISA" ? "active" : ""}`}
                      onClick={() => setActiveTab("VISA")}
                    >
                      VISA
                    </button>
                  </div>

                  {/* Booking Info Header */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="mb-1 fw-semibold">Booking</h6>
                      <small className="text-muted">{getDateRangeDisplay()}</small>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-secondary btn-sm">
                        <Filter size={16} className="me-1" />
                        Filters
                      </button>
                      <button className="btn btn-outline-secondary btn-sm">
                        <Download size={16} className="me-1" />
                        Export
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead style={{ background: "#F9FAFB" }}>
                        <tr>
                          <th className="text-muted small fw-normal">Booking Date</th>
                          <th className="text-muted small fw-normal">Order No.</th>
                          <th className="text-muted small fw-normal">Pax Name</th>
                          <th className="text-muted small fw-normal">Booking Included</th>
                          <th className="text-muted small fw-normal">Booking Expiry</th>
                          <th className="text-muted small fw-normal">Booking Status</th>
                          <th className="text-muted small fw-normal">Amount</th>
                          <th className="text-muted small fw-normal">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array(5)
                            .fill(0)
                            .map((_, index) => <ShimmerRow key={index} />)
                        ) : error ? (
                          <tr>
                            <td
                              colSpan="8"
                              className="text-center text-danger py-4"
                            >
                              Error: {error}
                            </td>
                          </tr>
                        ) : filteredBookings.length > 0 ? (
                          filteredBookings.map((booking) => (
                            <tr key={booking.id}>
                              <td className="small">{formatDate(booking.date)}</td>
                              <td className="small fw-semibold">{booking.booking_number || "N/A"}</td>
                              <td className="small">{getPassengerNames(booking.person_details)}</td>
                              <td className="small">
                                <Link
                                  to={`/booking/${booking.id}`}
                                  className="text-primary"
                                  style={{
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                  }}
                                >
                                  see
                                </Link>
                              </td>
                              <td className="small">{formatDate(booking.expiry_time)}</td>
                              <td>
                                <span className="status-badge" style={getStatusStyle(booking.status)}>
                                  <span className="status-dot" style={{ background: getStatusStyle(booking.status).color }}></span>
                                  {booking.status || 'N/A'}
                                </span>
                              </td>
                              <td className="small fw-semibold">
                                RS.{booking.total_amount?.toLocaleString() || "0"}/-
                              </td>
                              <td>
                                <Dropdown>
                                  <Dropdown.Toggle
                                    variant="link"
                                    className="text-decoration-none p-0"
                                    style={{ color: "#3B82F6" }}
                                  >
                                    <Gear size={18} />
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu>
                                    <Dropdown.Item
                                      as={Link}
                                      to={`/booking/${booking.id}`}
                                      className="text-primary"
                                    >
                                      See Booking
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                      as={Link}
                                      to={`/booking-history/invoice/${booking.id}`}
                                      className="text-primary"
                                    >
                                      Invoice
                                    </Dropdown.Item>
                                    <Dropdown.Item className="text-primary">
                                      Download Voucher
                                    </Dropdown.Item>
                                    <Dropdown.Item className="text-danger">
                                      Cancel Booking
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              No bookings found for the selected filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingHistory;