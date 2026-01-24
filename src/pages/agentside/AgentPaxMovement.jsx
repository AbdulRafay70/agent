import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Form, Button, Badge, Modal, Spinner, Alert } from "react-bootstrap";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import {
  Plane, MapPin, Users, Search, Edit, CheckCircle, XCircle, AlertCircle,
  Clock, Bell, Calendar, Eye
} from "lucide-react";

/**
 * Helper to get logged-in organization ID from localStorage
 */
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

const AgentPaxMovement = () => {
  const [passengers, setPassengers] = useState([]);
  const [filteredPassengers, setFilteredPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [selectedPax, setSelectedPax] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [activeTab, setActiveTab] = useState("all");

  // Status options
  const statusOptions = [
    { value: "in_pakistan", label: "In Pakistan", color: "#6c757d", icon: "🇵🇰" },
    { value: "in_flight", label: "In Flight", color: "#17a2b8", icon: "✈️" },
    { value: "entered_ksa", label: "Entered KSA", color: "#ffc107", icon: "🛬" },
    { value: "in_ksa", label: "In KSA", color: "#0dcaf0", icon: "🕋" },
    { value: "in_makkah", label: "In Makkah", color: "#198754", icon: "🕋" },
    { value: "in_madina", label: "In Madina", color: "#20c997", icon: "🕌" },
    { value: "in_jeddah", label: "In Jeddah", color: "#0d6efd", icon: "🏙️" },
    { value: "exit_pending", label: "Exit Pending", color: "#fd7e14", icon: "⏳" },
    { value: "exited_ksa", label: "Exited KSA", color: "#198754", icon: "✅" },
  ];

  useEffect(() => {
    loadPassengers();
  }, []);

  useEffect(() => {
    filterPassengers();
  }, [passengers, searchQuery, statusFilter, cityFilter, activeTab]);

  const loadPassengers = async () => {
    setLoading(true);
    try {
      const organizationId = getLoggedInOrgId();
      const token = localStorage.getItem("agentAccessToken");

      if (!organizationId) {
        setAlert({ show: true, type: "danger", message: "Organization not found" });
        setLoading(false);
        return;
      }

      if (!token) {
        setAlert({ show: true, type: "danger", message: "Authentication required" });
        setLoading(false);
        return;
      }

      // Fetch all bookings for the agent's organization
      const response = await fetch(
        `http://127.0.0.1:8000/api/bookings/?organization=${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const allBookings = await response.json();

      // Filter for Approved or Delivered bookings
      const bookings = allBookings.filter(b =>
        b.status === 'Approved' || b.status === 'Delivered'
      );

      // Transform bookings data to passenger format
      const transformedPassengers = [];

      // Helper function to determine passenger status (from Admin logic)
      const determinePassengerStatus = (booking, person) => {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Reset to start of day

        let status = "in_pakistan";
        let current_city = "Pakistan";
        let last_updated = booking.updated_at || new Date().toISOString();

        const hotelDetails = booking.hotel_details || [];

        // No hotel info -> In Pakistan
        if (hotelDetails.length === 0) {
          return { status, current_city, last_updated };
        }

        // Sort hotels by check-in date
        const sortedHotels = [...hotelDetails].sort((a, b) => {
          const dateA = a.check_in_date ? new Date(a.check_in_date) : new Date(0);
          const dateB = b.check_in_date ? new Date(b.check_in_date) : new Date(0);
          return dateA - dateB;
        });

        const firstHotel = sortedHotels[0];
        const lastHotel = sortedHotels[sortedHotels.length - 1];

        const firstCheckIn = firstHotel.check_in_date ? new Date(firstHotel.check_in_date) : null;
        const lastCheckOut = lastHotel.check_out_date ? new Date(lastHotel.check_out_date) : null;

        if (firstCheckIn) firstCheckIn.setHours(0, 0, 0, 0);
        if (lastCheckOut) lastCheckOut.setHours(0, 0, 0, 0);

        if (!firstCheckIn) return { status, current_city, last_updated };

        // Exited KSA
        if (lastCheckOut && currentDate > lastCheckOut) {
          return {
            status: "exited_ksa",
            current_city: "Pakistan",
            last_updated: lastHotel.check_out_date
          };
        }

        // Exit Pending (Last day)
        if (lastCheckOut && currentDate.getTime() === lastCheckOut.getTime()) {
          const cityObj = lastHotel.hotel?.city;
          const city = (typeof cityObj === 'string' ? cityObj : cityObj?.name) || "KSA";
          return {
            status: "exit_pending",
            current_city: city,
            last_updated: lastHotel.check_out_date
          };
        }

        // In Flight
        if (firstCheckIn.getTime() === currentDate.getTime()) {
          return {
            status: "in_flight",
            current_city: "In Flight to KSA",
            last_updated: firstHotel.check_in_date
          };
        }

        // Still in Pakistan (Future trip)
        if (currentDate < firstCheckIn) {
          return { status, current_city, last_updated };
        }

        // In KSA - Check which city
        for (const hotel of sortedHotels) {
          const checkIn = hotel.check_in_date ? new Date(hotel.check_in_date) : null;
          const checkOut = hotel.check_out_date ? new Date(hotel.check_out_date) : null;

          if (checkIn) checkIn.setHours(0, 0, 0, 0);
          if (checkOut) checkOut.setHours(0, 0, 0, 0);

          if (checkIn && checkOut && currentDate >= checkIn && currentDate <= checkOut) {
            const hotelName = (hotel.hotel?.name || "").toLowerCase();
            const cityObj = hotel.hotel?.city;
            const hotelCity = (typeof cityObj === 'string' ? cityObj : cityObj?.name || "").toLowerCase();

            last_updated = hotel.check_in_date;

            if (hotelName.includes("makkah") || hotelCity.includes("makkah")) {
              return { status: "in_makkah", current_city: "Makkah", last_updated };
            } else if (hotelName.includes("madinah") || hotelName.includes("madina") || hotelCity.includes("madinah") || hotelCity.includes("madina")) {
              return { status: "in_madina", current_city: "Madina", last_updated };
            } else if (hotelName.includes("jeddah") || hotelCity.includes("jeddah")) {
              return { status: "in_jeddah", current_city: "Jeddah", last_updated };
            } else {
              const city = (typeof cityObj === 'string' ? cityObj : cityObj?.name) || "KSA";
              return { status: "in_ksa", current_city: city, last_updated };
            }
          }
        }

        // Default fallthrough (should capture above, but just in case)
        return { status, current_city, last_updated };
      };

      for (const booking of bookings) {
        if (booking.person_details && booking.person_details.length > 0) {

          for (let index = 0; index < booking.person_details.length; index++) {
            const person = booking.person_details[index];

            // Only process passengers with approved visa status
            if (person.visa_status !== "Approved") continue;

            // Extract flight info
            const flights = [];
            if (booking.ticket_details && booking.ticket_details.length > 0) {
              const ticket = booking.ticket_details[0];
              if (ticket.departure_date) {
                flights.push({
                  flight_no: ticket.flight_number || "N/A",
                  departure_airport: ticket.departure_airport || "Pakistan",
                  arrival_airport: ticket.arrival_airport || "Jeddah (JED)",
                  departure_date: ticket.departure_date,
                  departure_time: ticket.departure_time || "N/A",
                  type: "entry"
                });
              }
              if (ticket.return_date) {
                flights.push({
                  flight_no: ticket.return_flight_number || "N/A",
                  departure_airport: ticket.arrival_airport || "Jeddah (JED)",
                  arrival_airport: ticket.departure_airport || "Pakistan",
                  departure_date: ticket.return_date,
                  departure_time: ticket.return_time || "N/A",
                  type: "exit"
                });
              }
            }

            const { status, current_city, last_updated } = determinePassengerStatus(booking, person);

            transformedPassengers.push({
              id: `${booking.id}_${index}`,
              pax_id: `PAX${booking.booking_number}_${index + 1}`,
              name: `${person.first_name} ${person.last_name}`,
              passport_no: person.passport_number || "N/A",
              booking_number: booking.booking_number,
              status: status,
              current_city: current_city,
              flights: flights,
              last_updated: last_updated,
              visa_status: person.visa_status
            });
          }
        }
      }

      setPassengers(transformedPassengers);
    } catch (error) {
      console.error("Error loading passengers:", error);
      setAlert({ show: true, type: "danger", message: "Failed to load passenger data" });
    } finally {
      setLoading(false);
    }
  };

  const filterPassengers = () => {
    let filtered = [...passengers];

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter(pax => pax.status === activeTab);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pax =>
        pax.name.toLowerCase().includes(query) ||
        pax.passport_no.toLowerCase().includes(query) ||
        pax.pax_id.toLowerCase().includes(query)
      );
    }

    setFilteredPassengers(filtered);
  };

  const getStatusBadge = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    if (!statusObj) return null;
    return (
      <Badge style={{ backgroundColor: statusObj.color, padding: "6px 12px", fontSize: "13px", fontWeight: 500 }}>
        <span className="me-1">{statusObj.icon}</span>
        {statusObj.label}
      </Badge>
    );
  };

  const getStatistics = () => {
    return {
      total: passengers.length,
      in_pakistan: passengers.filter(p => p.status === "in_pakistan").length,
      in_flight: passengers.filter(p => p.status === "in_flight").length,
      in_makkah: passengers.filter(p => p.status === "in_makkah").length,
      in_madina: passengers.filter(p => p.status === "in_madina").length,
      exit_pending: passengers.filter(p => p.status === "exit_pending").length,
    };
  };

  const stats = getStatistics();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        <div className="col-12 col-lg-10">
          <AgentHeader />

          <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1" style={{ fontWeight: 600, color: "#2c3e50" }}>
                  <Plane size={32} className="me-2" style={{ color: "#1B78CE" }} />
                  My Passengers Movement
                </h2>
                <p className="text-muted mb-0">Track your passengers' travel status</p>
              </div>
              <Button onClick={loadPassengers} variant="outline-primary">Refresh Data</Button>
            </div>

            {alert.show && (
              <Alert variant={alert.type} dismissible onClose={() => setAlert({ ...alert, show: false })}>
                {alert.message}
              </Alert>
            )}

            {/* Stats Cards */}
            <Row className="mb-4">
              <Col md={6} lg={3} className="mb-3">
                <Card className="border-0 shadow-sm h-100" style={{ cursor: "pointer" }} onClick={() => setActiveTab("all")}>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Total Passengers</p>
                        <h4 className="mb-0" style={{ fontWeight: 600 }}>{stats.total}</h4>
                      </div>
                      <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "#1B78CE20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Users size={22} style={{ color: "#1B78CE" }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3} className="mb-3">
                <Card className="border-0 shadow-sm h-100" style={{ cursor: "pointer" }} onClick={() => setActiveTab("in_makkah")}>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>In Makkah</p>
                        <h4 className="mb-0" style={{ fontWeight: 600 }}>{stats.in_makkah}</h4>
                      </div>
                      <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "#19875420", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MapPin size={22} style={{ color: "#198754" }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3} className="mb-3">
                <Card className="border-0 shadow-sm h-100" style={{ cursor: "pointer" }} onClick={() => setActiveTab("in_madina")}>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>In Madina</p>
                        <h4 className="mb-0" style={{ fontWeight: 600 }}>{stats.in_madina}</h4>
                      </div>
                      <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "#20c99720", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MapPin size={22} style={{ color: "#20c997" }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3} className="mb-3">
                <Card className="border-0 shadow-sm h-100" style={{ cursor: "pointer" }} onClick={() => setActiveTab("exit_pending")}>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Exit Pending</p>
                        <h4 className="mb-0" style={{ fontWeight: 600 }}>{stats.exit_pending}</h4>
                      </div>
                      <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "#fd7e1420", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Clock size={22} style={{ color: "#fd7e14" }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Filter/Search */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-3">
                <div style={{ position: "relative" }}>
                  <Search size={20} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6c757d" }} />
                  <Form.Control
                    type="text"
                    placeholder="Search by name, passport..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: "40px", borderRadius: "8px" }}
                  />
                </div>
              </Card.Body>
            </Card>

            {/* Data Table */}
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-3">Loading passengers...</p>
                  </div>
                ) : filteredPassengers.length === 0 ? (
                  <div className="text-center py-5">
                    <Users size={64} className="text-muted mb-3" />
                    <h5 className="text-muted">No passengers found</h5>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <Table hover className="mb-0">
                      <thead style={{ backgroundColor: "#f8f9fa" }}>
                        <tr>
                          <th className="p-3">Pax ID</th>
                          <th className="p-3">Name</th>
                          <th className="p-3">Passport</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">City</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPassengers.map(pax => (
                          <tr key={pax.id}>
                            <td className="p-3 text-primary fw-bold">{pax.pax_id}</td>
                            <td className="p-3">{pax.name}</td>
                            <td className="p-3 text-muted">{pax.passport_no}</td>
                            <td className="p-3">{getStatusBadge(pax.status)}</td>
                            <td className="p-3">{pax.current_city}</td>
                            <td className="p-3 text-center">
                              <Button variant="outline-primary" size="sm" onClick={() => { setSelectedPax(pax); setShowDetailsModal(true); }}>
                                <Eye size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Container>

          {/* Details Modal (Read Only) */}
          <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Passenger Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedPax && (
                <div>
                  <Row className="mb-4">
                    <Col md={6} className="mb-3">
                      <p className="text-muted mb-1">Pax ID</p>
                      <p className="fw-medium">{selectedPax.pax_id}</p>
                    </Col>
                    <Col md={6} className="mb-3">
                      <p className="text-muted mb-1">Name</p>
                      <p className="fw-medium">{selectedPax.name}</p>
                    </Col>
                    <Col md={6} className="mb-3">
                      <p className="text-muted mb-1">Passport</p>
                      <p>{selectedPax.passport_no}</p>
                    </Col>
                    <Col md={6} className="mb-3">
                      <p className="text-muted mb-1">Status</p>
                      {getStatusBadge(selectedPax.status)}
                    </Col>
                    <Col md={6} className="mb-3">
                      <p className="text-muted mb-1">Current City</p>
                      <p>{selectedPax.current_city}</p>
                    </Col>
                  </Row>
                  <h6 className="mb-3">Flight Details</h6>
                  {selectedPax.flights.length > 0 ? (
                    selectedPax.flights.map((flight, idx) => (
                      <Card key={idx} className="mb-3 bg-light border-0">
                        <Card.Body>
                          <Badge bg={flight.type === "entry" ? "info" : "warning"} className="mb-2">
                            {flight.type === "entry" ? "Entry Flight" : "Exit Flight"}
                          </Badge>
                          <p className="mb-1"><strong>Flight:</strong> {flight.flight_no}</p>
                          <p className="mb-1"><strong>Route:</strong> {flight.departure_airport} &rarr; {flight.arrival_airport}</p>
                          <p className="mb-0"><strong>Date:</strong> {flight.departure_date} {flight.departure_time}</p>
                        </Card.Body>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted">No flight information available.</p>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Close</Button>
            </Modal.Footer>
          </Modal>

        </div>
      </div>
    </div>
  );
};

export default AgentPaxMovement;
