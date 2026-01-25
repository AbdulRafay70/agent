import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert } from "react-bootstrap";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import {
  Plane, MapPin, Calendar, Users, Search, ArrowRight, Clock, CheckCircle, 
  Briefcase, Coffee, CreditCard, XCircle, Info
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";

// Airport list with IATA codes
const AIRPORTS = [
  // Pakistan
  "Karachi - KHI",
  "Lahore - LHE",
  "Islamabad - ISB",
  "Peshawar - PEW",
  "Quetta - UET",
  "Multan - MUX",
  "Faisalabad - LYP",
  "Sialkot - SKT",
  "Rahim Yar Khan - RYK",
  "Bahawalpur - BHV",
  // Saudi Arabia
  "Jeddah - JED",
  "Riyadh - RUH",
  "Madinah - MED",
  "Dammam - DMM",
  // UAE
  "Dubai - DXB",
  "Abu Dhabi - AUH",
  "Sharjah - SHJ",
  // Middle East
  "Kuwait - KWI",
  "Doha - DOH",
  "Muscat - MCT",
  "Bahrain - BAH",
  // Europe
  "London - LHR",
  "Manchester - MAN",
  "Birmingham - BHX",
  "Paris - CDG",
  "Frankfurt - FRA",
  "Amsterdam - AMS",
  "Istanbul - IST",
  "Rome - FCO",
  "Madrid - MAD",
  "Barcelona - BCN",
  "Milan - MXP",
  // Asia
  "Bangkok - BKK",
  "Singapore - SIN",
  "Kuala Lumpur - KUL",
  "Hong Kong - HKG",
  "Tokyo - NRT",
  "Seoul - ICN",
  "Beijing - PEK",
  "Shanghai - PVG",
  "Delhi - DEL",
  "Mumbai - BOM",
  // Americas
  "New York - JFK",
  "Los Angeles - LAX",
  "Toronto - YYZ",
  "Chicago - ORD",
  "Miami - MIA",
  // Australia
  "Sydney - SYD",
  "Melbourne - MEL"
];

];

// Airline names mapping
const AIRLINE_NAMES = {
  '9P': 'Air Arabia Pakistan', 'PK': 'Pakistan International Airlines', 'PA': 'Airblue',
  'ER': 'Serene Air', 'G9': 'Air Arabia', 'FZ': 'flydubai', 'EK': 'Emirates',
  'QR': 'Qatar Airways', 'TK': 'Turkish Airlines', 'EY': 'Etihad Airways',
  'GF': 'Gulf Air', 'KU': 'Kuwait Airways', 'WY': 'Oman Air', 'SV': 'Saudia',
  'J9': 'Jazeera Airways', 'AI': 'Air India', '6E': 'IndiGo', 'UK': 'Vistara',
  'SG': 'SpiceJet', 'BA': 'British Airways', 'LH': 'Lufthansa', 'AF': 'Air France',
  'KL': 'KLM', 'AZ': 'ITA Airways', 'OS': 'Austrian Airlines', 'LX': 'Swiss International',
  'TG': 'Thai Airways', 'SQ': 'Singapore Airlines', 'MH': 'Malaysia Airlines',
  'CX': 'Cathay Pacific', 'NH': 'All Nippon Airways', 'JL': 'Japan Airlines',
  'KE': 'Korean Air', 'OZ': 'Asiana Airlines', 'CA': 'Air China'
};

const AgentPaxMovement = () => {
  // Search form state
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    departureDate: null,
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: "Economy"
  });

  // Flight results state
  const [flights, setFlights] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    priceRange: [0, 500000],
    stops: 'all',
    airlines: [],
    departureTime: 'all',
    sortBy: 'price'
  });

  useEffect(() => {
    if (flights.length > 0) {
      applyFilters();
    }
  }, [filters, flights]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, departureDate: date });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.from || !formData.to) {
      setError("Please select departure and arrival cities");
      return;
    }
    if (!formData.departureDate) {
      setError("Please select departure date");
      return;
    }

    // Extract airport codes
    const fromCode = formData.from.match(/- ([A-Z]{3})$/)?.[1];
    const toCode = formData.to.match(/- ([A-Z]{3})$/)?.[1];

    if (!fromCode || !toCode) {
      setError("Invalid airport selection");
      return;
    }

    // Format date to DD-MM-YYYY
    const day = String(formData.departureDate.getDate()).padStart(2, '0');
    const month = String(formData.departureDate.getMonth() + 1).padStart(2, '0');
    const year = formData.departureDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    setLoading(true);
    setError(null);
    setShowResults(true);

    try {
      const searchParams = {
        from: fromCode,
        to: toCode,
        departureDate: formattedDate,
        adults: parseInt(formData.adults) || 1,
        children: parseInt(formData.children) || 0,
        infants: parseInt(formData.infants) || 0,
        cabinClass: getCabinCode(formData.cabinClass)
      };

      const response = await axios.post(
        'http://localhost:8000/api/flights/search/',
        searchParams,
        {
          timeout: 45000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.flights) {
        setFlights(response.data.flights);
        setFilteredFlights(response.data.flights);
      } else {
        setFlights([]);
        setFilteredFlights([]);
      }
    } catch (err) {
      console.error('Flight search error:', err);
      setError(
        err.response?.data?.error || 
        err.message || 
        'Failed to search flights. Please try again.'
      );
      setFlights([]);
      setFilteredFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const getCabinCode = (className) => {
    const cabinMap = {
      'Economy': 'Y',
      'Premium Economy': 'W',
      'Business': 'C',
      'First Class': 'F'
    };
    return cabinMap[className] || 'Y';
  };

  const applyFilters = () => {
    let filtered = [...flights];

    // Price filter
    filtered = filtered.filter(f => 
      f.fare.total >= filters.priceRange[0] && f.fare.total <= filters.priceRange[1]
    );

    // Stops filter
    if (filters.stops !== 'all') {
      filtered = filtered.filter(f => {
        const totalFlights = f.segments?.reduce((sum, seg) => sum + (seg.flights?.length || 0), 0) || 0;
        const stops = totalFlights - 1;
        if (filters.stops === 'nonstop') return stops === 0;
        if (filters.stops === 'onestop') return stops === 1;
        return true;
      });
    }

    // Airline filter
    if (filters.airlines.length > 0) {
      filtered = filtered.filter(f => {
        const flightAirlines = f.segments?.flatMap(seg => 
          seg.flights?.map(fl => fl.airlineCode) || []
        ) || [];
        return filters.airlines.some(airline => flightAirlines.includes(airline));
      });
    }

    // Departure time filter
    if (filters.departureTime !== 'all') {
      filtered = filtered.filter(f => {
        const firstFlight = f.segments?.[0]?.flights?.[0];
        if (!firstFlight) return false;
        const hour = parseInt(firstFlight.departureTime?.slice(0, 2) || '0');
        if (filters.departureTime === 'morning') return hour >= 6 && hour < 12;
        if (filters.departureTime === 'afternoon') return hour >= 12 && hour < 18;
        if (filters.departureTime === 'evening') return hour >= 18 && hour < 24;
        if (filters.departureTime === 'night') return hour >= 0 && hour < 6;
        return true;
      });
    }

    // Sort
    if (filters.sortBy === 'price') {
      filtered.sort((a, b) => a.fare.total - b.fare.total);
    } else if (filters.sortBy === 'duration') {
      filtered.sort((a, b) => {
        const durationA = a.segments?.[0]?.ond?.duration || 999999;
        const durationB = b.segments?.[0]?.ond?.duration || 999999;
        return durationA - durationB;
      });
    }

    setFilteredFlights(filtered);
  };

  const getUniqueAirlines = () => {
    const airlines = new Set();
    flights.forEach(flight => {
      flight.segments?.forEach(segment => {
        segment.flights?.forEach(f => {
          if (f.airlineCode) airlines.add(f.airlineCode);
        });
      });
    });
    return Array.from(airlines);
  };

  const toggleAirlineFilter = (airline) => {
    setFilters(prev => ({
      ...prev,
      airlines: prev.airlines.includes(airline)
        ? prev.airlines.filter(a => a !== airline)
        : [...prev.airlines, airline]
    }));
  };

  const getAirlineLogo = (code) => {
    return `https://images.kiwi.com/airlines/64x64/${code}.png`;
  };

  const getAirlineName = (code) => {
    return AIRLINE_NAMES[code] || code;
  };

  const formatTime = (time) => {
    if (!time) return '';
    if (time.includes(':')) return time;
    return `${time.slice(0, 2)}:${time.slice(2)}`;
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatPrice = (price, currency) => {
    return `${currency} ${parseFloat(price || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const handleBookFlight = (flight) => {
    localStorage.setItem('selectedFlight', JSON.stringify(flight));
    console.log('Selected flight:', flight);
    alert('Flight selected! Booking functionality coming soon...');
  };

  const handleBackToSearch = () => {
    setShowResults(false);
    setFlights([]);
    setFilteredFlights([]);
    setError(null);
  };
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
