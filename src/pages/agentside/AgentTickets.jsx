import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert, Form, InputGroup } from "react-bootstrap";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Plane, Calendar, MapPin, Users, CheckCircle, Search, Eye, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AgentTickets.css";

const AgentTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterStatus, tickets]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      // Fetch tickets from API
      const token = localStorage.getItem('agentAccessToken');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get('http://127.0.0.1:8000/api/flights/bookings/', { headers });
      console.log('📥 Loaded tickets from API:', response.data);

      if (response.data && Array.isArray(response.data)) {
        // Transform API response to match frontend format
        const transformedTickets = response.data.map(booking => ({
          id: booking.id,
          pnr: booking.pnr,
          bookingRefId: booking.booking_ref_id,
          status: booking.status,
          airlineLocator: booking.airline_locator,
          airline: booking.airline_code,
          passengerName: booking.passenger_name,
          passengerEmail: booking.passenger_email,
          passengerPhone: booking.passenger_phone,
          nationality: booking.nationality,
          passportNumber: booking.passport_number,
          dateOfBirth: booking.date_of_birth,
          origin: booking.origin,
          destination: booking.destination,
          originCity: booking.origin_city,
          destinationCity: booking.destination_city,
          departureDate: booking.departure_date,
          arrivalDate: booking.arrival_date,
          flightNumber: booking.flight_number,
          cabin: booking.cabin_class,
          baseFare: booking.base_fare,
          tax: booking.tax,
          totalFare: booking.total_fare,
          currency: booking.currency,
          segments: booking.segments,
          bookingDate: booking.booking_date
        }));

        setTickets(transformedTickets);
        setFilteredTickets(transformedTickets);
        console.log('✅ Tickets loaded successfully:', transformedTickets.length);
      }
    } catch (error) {
      console.error('❌ Error loading tickets:', error);
      console.error('Error response:', error.response?.data);
      // Fallback to localStorage if API fails
      try {
        const savedTickets = localStorage.getItem('agentBookings');
        if (savedTickets) {
          const parsedTickets = JSON.parse(savedTickets);
          setTickets(parsedTickets);
          setFilteredTickets(parsedTickets);
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.pnr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.bookingRefId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.passengerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(ticket => ticket.status === filterStatus);
    }

    setFilteredTickets(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'HK': { variant: 'success', text: 'Confirmed' },
      'UC': { variant: 'warning', text: 'Pending' },
      'XX': { variant: 'danger', text: 'Cancelled' }
    };
    const statusInfo = statusMap[status] || { variant: 'secondary', text: status || 'Unknown' };
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const handleViewDetails = (ticket) => {
    navigate(`/ticket-details/${ticket.bookingRefId}`, { state: { ticket } });
  };

  return (
    <div className="d-flex">
      <AgentSidebar />
      <div className="flex-fill">
        <AgentHeader />
        <div className="agent-tickets-wrapper">
          <Container fluid className="py-4">
            {/* Page Header */}
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <Row className="align-items-center">
                  <Col md={6}>
                    <h3 className="mb-0">
                      <CheckCircle size={28} className="me-2 text-success" />
                      My Tickets
                    </h3>
                    <p className="text-muted mb-0 mt-2">View all your confirmed flight bookings</p>
                  </Col>
                  <Col md={6} className="text-end">
                    <Badge bg="primary" className="fs-6 px-3 py-2">
                      Total Bookings: {tickets.length}
                    </Badge>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Search and Filters */}
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <Row>
                  <Col md={8}>
                    <InputGroup>
                      <InputGroup.Text>
                        <Search size={18} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search by PNR, Booking Reference, or Passenger Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={4}>
                    <InputGroup>
                      <InputGroup.Text>
                        <Filter size={18} />
                      </InputGroup.Text>
                      <Form.Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="HK">Confirmed</option>
                        <option value="UC">Pending</option>
                        <option value="XX">Cancelled</option>
                      </Form.Select>
                    </InputGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Tickets List */}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <Alert variant="info" className="text-center">
                <Plane size={48} className="mb-3" />
                <h5>No Tickets Found</h5>
                <p className="mb-0">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filters"
                    : "You haven't made any bookings yet. Start by searching for flights!"}
                </p>
              </Alert>
            ) : (
              <Row>
                {filteredTickets.map((ticket, index) => (
                  <Col lg={12} key={ticket.bookingRefId || index} className="mb-3">
                    <Card className="shadow-sm border-0 ticket-card hover-shadow">
                      <Card.Body>
                        <Row className="align-items-center">
                          {/* PNR and Status */}
                          <Col md={2} className="text-center border-end">
                            <div className="mb-2">
                              {getStatusBadge(ticket.status)}
                            </div>
                            <h4 className="text-primary mb-1">{ticket.pnr}</h4>
                            <small className="text-muted">PNR</small>
                            <div className="mt-2 small text-muted">
                              Ref: {ticket.bookingRefId}
                            </div>
                          </Col>

                          {/* Flight Route */}
                          <Col md={4} className="border-end">
                            <div className="d-flex align-items-center justify-content-between">
                              <div>
                                <h5 className="mb-0">{ticket.origin}</h5>
                                <small className="text-muted">{ticket.originCity || 'Departure'}</small>
                              </div>
                              <div className="text-center mx-3">
                                <Plane size={24} className="text-primary" />
                              </div>
                              <div className="text-end">
                                <h5 className="mb-0">{ticket.destination}</h5>
                                <small className="text-muted">{ticket.destinationCity || 'Arrival'}</small>
                              </div>
                            </div>
                          </Col>

                          {/* Passenger and Date Info */}
                          <Col md={3} className="border-end">
                            <div className="mb-2">
                              <Users size={16} className="me-2 text-primary" />
                              <strong>{ticket.passengerName || 'Passenger'}</strong>
                            </div>
                            <div className="mb-2">
                              <Calendar size={16} className="me-2 text-primary" />
                              {formatDate(ticket.departureDate)}
                            </div>
                            <div>
                              <Badge bg="secondary">{ticket.airline}</Badge>
                              {ticket.airlineLocator && (
                                <Badge bg="info" className="ms-2">Airline: {ticket.airlineLocator}</Badge>
                              )}
                            </div>
                          </Col>

                          {/* Fare and Action */}
                          <Col md={3} className="text-center">
                            <div className="mb-2">
                              <small className="text-muted d-block">Total Fare</small>
                              <h4 className="text-success mb-0">
                                {ticket.currency} {parseFloat(ticket.totalFare || 0).toLocaleString()}
                              </h4>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              className="mt-2 w-100"
                              onClick={() => handleViewDetails(ticket)}
                            >
                              <Eye size={16} className="me-2" />
                              View Details
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default AgentTickets;
