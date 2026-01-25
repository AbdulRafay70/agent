import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert, Accordion, Table } from "react-bootstrap";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import {
  Plane, MapPin, Calendar, Users, Search, ArrowRight, Clock, CheckCircle, 
  Briefcase, Coffee, CreditCard, XCircle, Info, ArrowLeft, AlertCircle
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import "./AgentFlightUpdates.css";

// Airport list with IATA codes
const AIRPORTS = [
  // Pakistan
  "Karachi - KHI", "Lahore - LHE", "Islamabad - ISB", "Peshawar - PEW", "Quetta - UET",
  "Multan - MUX", "Faisalabad - LYP", "Sialkot - SKT", "Rahim Yar Khan - RYK", "Bahawalpur - BHV",
  // Saudi Arabia
  "Jeddah - JED", "Riyadh - RUH", "Madinah - MED", "Dammam - DMM",
  // UAE
  "Dubai - DXB", "Abu Dhabi - AUH", "Sharjah - SHJ",
  // Middle East
  "Kuwait - KWI", "Doha - DOH", "Muscat - MCT", "Bahrain - BAH",
  // Europe
  "London - LHR", "Manchester - MAN", "Birmingham - BHX", "Paris - CDG", "Frankfurt - FRA",
  "Amsterdam - AMS", "Istanbul - IST", "Rome - FCO", "Madrid - MAD", "Barcelona - BCN", "Milan - MXP",
  // Asia
  "Bangkok - BKK", "Singapore - SIN", "Kuala Lumpur - KUL", "Hong Kong - HKG", "Tokyo - NRT",
  "Seoul - ICN", "Beijing - PEK", "Shanghai - PVG", "Delhi - DEL", "Mumbai - BOM",
  // Americas
  "New York - JFK", "Los Angeles - LAX", "Toronto - YYZ", "Chicago - ORD", "Miami - MIA",
  // Australia
  "Sydney - SYD", "Melbourne - MEL"
];

// Airport/City names mapping
const AIRPORT_CITIES = {
  'KHI': 'Karachi, Pakistan', 'LHE': 'Lahore, Pakistan', 'ISB': 'Islamabad, Pakistan',
  'PEW': 'Peshawar, Pakistan', 'UET': 'Quetta, Pakistan', 'MUX': 'Multan, Pakistan',
  'LYP': 'Faisalabad, Pakistan', 'SKT': 'Sialkot, Pakistan', 'RYK': 'Rahim Yar Khan, Pakistan',
  'BHV': 'Bahawalpur, Pakistan', 'JED': 'Jeddah, Saudi Arabia', 'RUH': 'Riyadh, Saudi Arabia',
  'MED': 'Madinah, Saudi Arabia', 'DMM': 'Dammam, Saudi Arabia', 'DXB': 'Dubai, UAE',
  'AUH': 'Abu Dhabi, UAE', 'SHJ': 'Sharjah, UAE', 'KWI': 'Kuwait City, Kuwait',
  'DOH': 'Doha, Qatar', 'MCT': 'Muscat, Oman', 'BAH': 'Manama, Bahrain',
  'LHR': 'London, UK', 'MAN': 'Manchester, UK', 'BHX': 'Birmingham, UK',
  'CDG': 'Paris, France', 'FRA': 'Frankfurt, Germany', 'AMS': 'Amsterdam, Netherlands',
  'IST': 'Istanbul, Turkey', 'FCO': 'Rome, Italy', 'MAD': 'Madrid, Spain',
  'BCN': 'Barcelona, Spain', 'MXP': 'Milan, Italy', 'BKK': 'Bangkok, Thailand',
  'SIN': 'Singapore', 'KUL': 'Kuala Lumpur, Malaysia', 'HKG': 'Hong Kong',
  'NRT': 'Tokyo, Japan', 'ICN': 'Seoul, South Korea', 'PEK': 'Beijing, China',
  'PVG': 'Shanghai, China', 'DEL': 'Delhi, India', 'BOM': 'Mumbai, India',
  'JFK': 'New York, USA', 'LAX': 'Los Angeles, USA', 'YYZ': 'Toronto, Canada',
  'ORD': 'Chicago, USA', 'MIA': 'Miami, USA', 'SYD': 'Sydney, Australia',
  'MEL': 'Melbourne, Australia'
};

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

const AgentFlightUpdates = () => {
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
        origin: fromCode,
        destination: toCode,
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

  const getCityName = (code) => {
    return AIRPORT_CITIES[code] || code;
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

  return (
    <div className="d-flex">
      <AgentSidebar />
      <div className="flex-fill">
        <AgentHeader />
        <div className="agent-flight-updates-wrapper">
          <Container fluid className="py-4">
            {!showResults ? (
              // Search Form
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <h4 className="mb-0">
                    <Plane size={24} className="me-2" />
                    Flight Search
                  </h4>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form onSubmit={handleSearch}>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <MapPin size={16} className="me-1" />
                            From (Departure City)
                          </Form.Label>
                          <Form.Select
                            name="from"
                            value={formData.from}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select departure city</option>
                            {AIRPORTS.map(airport => (
                              <option key={airport} value={airport}>{airport}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <MapPin size={16} className="me-1" />
                            To (Arrival City)
                          </Form.Label>
                          <Form.Select
                            name="to"
                            value={formData.to}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select arrival city</option>
                            {AIRPORTS.map(airport => (
                              <option key={airport} value={airport}>{airport}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <Calendar size={16} className="me-1" />
                            Departure Date
                          </Form.Label>
                          <DatePicker
                            selected={formData.departureDate}
                            onChange={handleDateChange}
                            minDate={new Date()}
                            dateFormat="dd-MM-yyyy"
                            className="form-control"
                            placeholderText="Select date"
                            required
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <Briefcase size={16} className="me-1" />
                            Cabin Class
                          </Form.Label>
                          <Form.Select
                            name="cabinClass"
                            value={formData.cabinClass}
                            onChange={handleInputChange}
                          >
                            <option value="Economy">Economy</option>
                            <option value="Premium Economy">Premium Economy</option>
                            <option value="Business">Business</option>
                            <option value="First Class">First Class</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <Users size={16} className="me-1" />
                            Adults
                          </Form.Label>
                          <Form.Control
                            type="number"
                            name="adults"
                            min="1"
                            max="9"
                            value={formData.adults}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={4} className="mb-3">
                        <Form.Group>
                          <Form.Label>Children (2-11 yrs)</Form.Label>
                          <Form.Control
                            type="number"
                            name="children"
                            min="0"
                            max="9"
                            value={formData.children}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={4} className="mb-3">
                        <Form.Group>
                          <Form.Label>Infants (under 2 yrs)</Form.Label>
                          <Form.Control
                            type="number"
                            name="infants"
                            min="0"
                            max="9"
                            value={formData.infants}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="text-center mt-4">
                      <Button type="submit" variant="primary" size="lg" className="px-5">
                        <Search size={20} className="me-2" />
                        Search Flights
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            ) : (
              // Flight Results
              <div className="flight-results">
                {/* Header */}
                <div className="results-header mb-4 p-3 bg-white shadow-sm rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <Button variant="outline-primary" onClick={handleBackToSearch}>
                      <ArrowLeft size={18} className="me-2" />
                      Back to Search
                    </Button>
                    <div className="text-center">
                      <h5 className="mb-0">
                        {formData.from?.split(' - ')[0]} → {formData.to?.split(' - ')[0]}
                      </h5>
                      <small className="text-muted">
                        {formData.departureDate?.toLocaleDateString('en-GB')} • 
                        {formData.adults} Adult{formData.adults > 1 ? 's' : ''}
                        {formData.children > 0 && `, ${formData.children} Child${formData.children > 1 ? 'ren' : ''}`}
                        {formData.infants > 0 && `, ${formData.infants} Infant${formData.infants > 1 ? 's' : ''}`}
                      </small>
                    </div>
                    <div className="text-end">
                      <Badge bg="info">{filteredFlights.length} flights found</Badge>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Searching for flights...</p>
                  </div>
                ) : (
                  <Row>
                    {/* Filters Sidebar */}
                    <Col lg={3} className="mb-4">
                      <Card className="shadow-sm sticky-top" style={{ top: '20px' }}>
                        <Card.Header className="bg-light">
                          <h6 className="mb-0">Filters</h6>
                        </Card.Header>
                        <Card.Body>
                          {/* Sort By */}
                          <div className="mb-4">
                            <label className="form-label fw-bold small">Sort By</label>
                            <Form.Select
                              size="sm"
                              value={filters.sortBy}
                              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            >
                              <option value="price">Price (Low to High)</option>
                              <option value="duration">Duration (Short to Long)</option>
                              <option value="departure">Departure Time</option>
                            </Form.Select>
                          </div>

                          {/* Price Range */}
                          <div className="mb-4">
                            <label className="form-label fw-bold small">Price Range</label>
                            <div className="small text-muted">
                              PKR {filters.priceRange[0].toLocaleString()} - PKR {filters.priceRange[1].toLocaleString()}
                            </div>
                            <input
                              type="range"
                              className="form-range"
                              min="0"
                              max="500000"
                              step="10000"
                              value={filters.priceRange[1]}
                              onChange={(e) => setFilters({ ...filters, priceRange: [0, parseInt(e.target.value)] })}
                            />
                          </div>

                          {/* Stops */}
                          <div className="mb-4">
                            <label className="form-label fw-bold small">Stops</label>
                            {['all', 'nonstop', 'onestop'].map(stop => (
                              <Form.Check
                                key={stop}
                                type="radio"
                                id={`stop-${stop}`}
                                name="stops"
                                label={stop === 'all' ? 'Any' : stop === 'nonstop' ? 'Non-stop' : '1 Stop'}
                                checked={filters.stops === stop}
                                onChange={() => setFilters({ ...filters, stops: stop })}
                              />
                            ))}
                          </div>

                          {/* Departure Time */}
                          <div className="mb-4">
                            <label className="form-label fw-bold small">Departure Time</label>
                            {['all', 'morning', 'afternoon', 'evening', 'night'].map(time => (
                              <Form.Check
                                key={time}
                                type="radio"
                                id={`time-${time}`}
                                name="departureTime"
                                label={time === 'all' ? 'Any Time' : 
                                       time === 'morning' ? 'Morning (6AM-12PM)' :
                                       time === 'afternoon' ? 'Afternoon (12PM-6PM)' :
                                       time === 'evening' ? 'Evening (6PM-12AM)' : 'Night (12AM-6AM)'}
                                checked={filters.departureTime === time}
                                onChange={() => setFilters({ ...filters, departureTime: time })}
                              />
                            ))}
                          </div>

                          {/* Airlines */}
                          {getUniqueAirlines().length > 0 && (
                            <div className="mb-4">
                              <label className="form-label fw-bold small">Airlines</label>
                              {getUniqueAirlines().map(airline => (
                                <Form.Check
                                  key={airline}
                                  type="checkbox"
                                  id={`airline-${airline}`}
                                  label={getAirlineName(airline)}
                                  checked={filters.airlines.includes(airline)}
                                  onChange={() => toggleAirlineFilter(airline)}
                                />
                              ))}
                            </div>
                          )}

                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="w-100"
                            onClick={() => setFilters({
                              priceRange: [0, 500000],
                              stops: 'all',
                              airlines: [],
                              departureTime: 'all',
                              sortBy: 'price'
                            })}
                          >
                            Reset Filters
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Flight Cards */}
                    <Col lg={9}>
                      {filteredFlights.length === 0 ? (
                        <Alert variant="info">
                          <Info size={20} className="me-2" />
                          No flights found for the selected filters. Try adjusting your search criteria.
                        </Alert>
                      ) : (
                        filteredFlights.map((flight, index) => (
                          <Card key={index} className="mb-4 shadow-sm flight-card">
                            <Card.Body>
                              <Row>
                                {/* Flight Details */}
                                <Col md={9}>
                                  {flight.segments?.map((segment, segIdx) => (
                                    <div key={segIdx} className="mb-4">
                                      <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="text-muted mb-0">
                                          Segment {segIdx + 1}
                                          {segment.ond?.issuingAirline && (
                                            <Badge bg="secondary" className="ms-2">
                                              Operated by {getAirlineName(segment.ond.issuingAirline)}
                                            </Badge>
                                          )}
                                        </h6>
                                        <span className="text-muted small">
                                          <Clock size={14} className="me-1" />
                                          Total Duration: {formatDuration(segment.ond?.duration)}
                                        </span>
                                      </div>

                                      {segment.flights?.map((fl, flIdx) => (
                                        <div key={flIdx} className="mb-3 p-3 bg-light rounded">
                                          <Row className="align-items-center">
                                            {/* Airline Logo and Info */}
                                            <Col md={2} className="text-center">
                                              <img
                                                src={getAirlineLogo(fl.airlineCode)}
                                                alt={fl.airlineCode}
                                                style={{ width: '50px', height: '50px' }}
                                                onError={(e) => e.target.style.display = 'none'}
                                              />
                                              <div className="fw-bold mt-2">{getAirlineName(fl.airlineCode)}</div>
                                              <div className="small text-muted">
                                                {fl.airlineCode} {fl.flightNo}
                                              </div>
                                              {fl.operatingAirline && fl.operatingAirline !== fl.airlineCode && (
                                                <div className="small text-warning">
                                                  Operated by {fl.operatingAirline}
                                                </div>
                                              )}
                                            </Col>

                                            {/* Departure */}
                                            <Col md={3}>
                                              <div className="fw-bold fs-4">{formatTime(fl.departureTime)}</div>
                                              <div className="fw-bold">{fl.departureLocation}</div>
                                              <div className="small text-muted">{getCityName(fl.departureLocation)}</div>
                                              {fl.departureTerminal && (
                                                <Badge bg="info" className="mt-1">Terminal {fl.departureTerminal}</Badge>
                                              )}
                                              <div className="small text-muted mt-1">
                                                {fl.departureDate}
                                              </div>
                                            </Col>

                                            {/* Duration and Stops */}
                                            <Col md={2} className="text-center">
                                              <div className="small text-muted mb-1">
                                                <Clock size={14} className="me-1" />
                                                {formatDuration(fl.duration)}
                                              </div>
                                              <div className="position-relative my-2">
                                                <div className="border-bottom border-2 border-primary"></div>
                                                <Plane size={16} className="position-absolute top-50 start-50 translate-middle bg-white text-primary" />
                                              </div>
                                              <div className="small text-muted">
                                                {fl.stops === 0 ? 'Non-stop' : `${fl.stops} Stop(s)`}
                                              </div>
                                              {fl.equipmentType && (
                                                <div className="small text-muted mt-1">
                                                  Aircraft: {fl.equipmentType}
                                                </div>
                                              )}
                                            </Col>

                                            {/* Arrival */}
                                            <Col md={3}>
                                              <div className="fw-bold fs-4">{formatTime(fl.arrivalTime)}</div>
                                              <div className="fw-bold">{fl.arrivalLocation}</div>
                                              <div className="small text-muted">{getCityName(fl.arrivalLocation)}</div>
                                              {fl.arrivalTerminal && (
                                                <Badge bg="info" className="mt-1">Terminal {fl.arrivalTerminal}</Badge>
                                              )}
                                              <div className="small text-muted mt-1">
                                                {fl.arrivalDate}
                                              </div>
                                            </Col>

                                            {/* Baggage and Cabin */}
                                            <Col md={2}>
                                              <div className="small">
                                                {fl.baggage && fl.baggage.length > 0 && (
                                                  <>
                                                    <div className="d-flex align-items-center mb-1">
                                                      <Briefcase size={14} className="me-1 text-primary" />
                                                      <strong>Baggage:</strong>
                                                    </div>
                                                    {fl.baggage.map((bag, bagIdx) => (
                                                      <div key={bagIdx} className="text-muted ms-3">
                                                        {bag.type === 'checkIn' ? '✓' : '✈'} {bag.value} {bag.unit}
                                                        {bag.type === 'checkIn' ? ' Check-in' : ' Cabin'}
                                                      </div>
                                                    ))}
                                                  </>
                                                )}
                                                {fl.cabin && (
                                                  <div className="mt-2">
                                                    <Badge bg="secondary">
                                                      {fl.cabin === 'Y' ? 'Economy' : 
                                                       fl.cabin === 'C' ? 'Business' : 
                                                       fl.cabin === 'F' ? 'First Class' : fl.cabin}
                                                    </Badge>
                                                  </div>
                                                )}
                                                {fl.seatsAvailable && (
                                                  <div className="mt-2 small">
                                                    <Users size={14} className="me-1 text-success" />
                                                    {fl.seatsAvailable} seats left
                                                  </div>
                                                )}
                                              </div>
                                            </Col>
                                          </Row>

                                          {/* Connection Time */}
                                          {flIdx < segment.flights.length - 1 && (
                                            <div className="text-center mt-3 pt-2 border-top">
                                              <small className="text-warning">
                                                <AlertCircle size={14} className="me-1" />
                                                Layover at {fl.arrivalLocation} - Connection time will be displayed
                                              </small>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ))}

                                  {/* Flight Info Badges */}
                                  <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
                                    {flight.refundable && (
                                      <Badge bg="success" className="d-flex align-items-center gap-1">
                                        <CheckCircle size={14} /> Refundable
                                      </Badge>
                                    )}
                                    {!flight.refundable && (
                                      <Badge bg="danger" className="d-flex align-items-center gap-1">
                                        <XCircle size={14} /> Non-Refundable
                                      </Badge>
                                    )}
                                    {flight.instantTicketing && (
                                      <Badge bg="info" className="d-flex align-items-center gap-1">
                                        <CheckCircle size={14} /> Instant Ticketing
                                      </Badge>
                                    )}
                                    {flight.bookOnHold && (
                                      <Badge bg="warning" text="dark" className="d-flex align-items-center gap-1">
                                        <Clock size={14} /> Book on Hold Available
                                      </Badge>
                                    )}
                                    {flight.brandedFareSupported && (
                                      <Badge bg="primary" className="d-flex align-items-center gap-1">
                                        <Info size={14} /> Multiple Fare Options
                                      </Badge>
                                    )}
                                    {flight.fareRuleOffered && (
                                      <Badge bg="secondary" className="d-flex align-items-center gap-1">
                                        <Info size={14} /> Fare Rules Available
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Fare Basis */}
                                  {flight.fareDetails?.fareBreakup && (
                                    <div className="mt-3 pt-3 border-top">
                                      <small className="text-muted">
                                        <strong>Fare Basis:</strong> {flight.fareDetails.fareBreakup.map(fb => fb.fareBasis).join(', ')}
                                      </small>
                                    </div>
                                  )}
                                </Col>

                                {/* Price and Book */}
                                <Col md={3} className="text-center border-start">
                                  <div className="price-section">
                                    <small className="text-muted d-block">Total Price</small>
                                    <h3 className="price-amount mb-1 text-primary">
                                      {formatPrice(flight.fare.total, flight.fare.currency)}
                                    </h3>
                                    <small className="text-muted d-block mb-3">
                                      Base: {formatPrice(flight.fare.baseFare, flight.fare.currency)}<br/>
                                      Tax: {formatPrice(flight.fare.tax, flight.fare.currency)}
                                    </small>

                                    {/* Per Passenger Breakdown */}
                                    {flight.fareDetails?.fareBreakup && (
                                      <div className="mb-3 p-2 bg-light rounded">
                                        <small className="fw-bold d-block mb-2">Per Passenger:</small>
                                        {flight.fareDetails.fareBreakup.map((fb, fbIdx) => (
                                          <div key={fbIdx} className="small text-start">
                                            <strong>
                                              {fb.paxType === 'ADT' ? 'Adult' : 
                                               fb.paxType === 'CHD' ? 'Child' : 
                                               fb.paxType === 'INF' ? 'Infant' : fb.paxType}:
                                            </strong>
                                            <div className="ms-2">
                                              Base: {flight.fare.currency} {parseFloat(fb.baseFare).toLocaleString()}<br/>
                                              Tax: {flight.fare.currency} {parseFloat(fb.tax).toLocaleString()}<br/>
                                              <strong>Total: {flight.fare.currency} {parseFloat(fb.total).toLocaleString()}</strong>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    <Button 
                                      variant="primary" 
                                      size="lg" 
                                      className="w-100"
                                      onClick={() => handleBookFlight(flight)}
                                    >
                                      <CheckCircle size={18} className="me-2" />
                                      Select Flight
                                    </Button>

                                    {flight.fareRuleOffered && (
                                      <Button 
                                        variant="outline-secondary" 
                                        size="sm" 
                                        className="w-100 mt-2"
                                        onClick={() => alert('Fare rules: ' + JSON.stringify(flight.fareDetails, null, 2))}
                                      >
                                        <Info size={14} className="me-1" />
                                        View Fare Rules
                                      </Button>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        ))
                      )}
                    </Col>
                  </Row>
                )}
              </div>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default AgentFlightUpdates;
