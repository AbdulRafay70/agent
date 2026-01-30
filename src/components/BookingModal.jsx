import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { User, Mail, Phone, CreditCard, Calendar, Globe } from 'lucide-react';
import axios from 'axios';

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan', phoneCode: '92' },
  { code: 'AE', name: 'UAE', phoneCode: '971' },
  { code: 'SA', name: 'Saudi Arabia', phoneCode: '966' },
  { code: 'US', name: 'United States', phoneCode: '1' },
  { code: 'GB', name: 'United Kingdom', phoneCode: '44' },
  { code: 'IN', name: 'India', phoneCode: '91' }
];

const BookingModal = ({ show, onHide, flight, onBookingSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passengers, setPassengers] = useState([{
    paxType: 'ADT',
    salutation: 'Mr',
    gender: 'Male',
    givenName: '',
    surName: '',
    birthDate: '',
    docID: '',
    docIssueCountry: 'PK',
    expiryDate: '',
    nationality: 'PK',
    email: '',
    phone: '',
    phoneCode: '92',
    countryCode: 'PK'
  }]);

  const handlePassengerChange = (index, field, value) => {
    const newPassengers = [...passengers];
    newPassengers[index][field] = value;

    // Auto-update gender based on salutation
    if (field === 'salutation') {
      if (value === 'Mr' || value === 'Master') {
        newPassengers[index].gender = 'Male';
      } else if (value === 'Ms' || value === 'Mrs' || value === 'Miss') {
        newPassengers[index].gender = 'Female';
      }
    }

    // Auto-update phone code when country changes
    if (field === 'countryCode') {
      const country = COUNTRIES.find(c => c.code === value);
      if (country) {
        newPassengers[index].phoneCode = country.phoneCode;
      }
    }

    setPassengers(newPassengers);
  };

  const formatDateForAPI = (dateString) => {
    // Convert YYYY-MM-DD to DD-MM-YYYY
    if (!dateString) return '';
    const parts = dateString.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Format passengers first
      const formattedPassengers = passengers.map(pax => ({
        ...pax,
        birthDate: formatDateForAPI(pax.birthDate),
        expiryDate: formatDateForAPI(pax.expiryDate),
        docType: '1'
      }));

      // Extract origin and destination from flight segments
      const origin = flight.segments?.[0]?.flights?.[0]?.departureLocation || '';
      const destination = flight.segments?.[flight.segments.length - 1]?.flights?.[flight.segments[flight.segments.length - 1].flights.length - 1]?.arrivalLocation || '';

      // Step 2: Validate fare - Send complete flight structure with supplierSpecific
      const validatePayload = {
        flightData: {
          segments: flight.segments,
          fare: flight.fare,
          brandId: flight.brandId,  // Include brandId for branded fares
          supplierSpecific: flight.supplierSpecific,
          supplierCodes: [flight.supplierCode || 11],
          origin,
          destination,
          adt: formattedPassengers.filter(p => p.paxType === 'ADT').length,
          chd: formattedPassengers.filter(p => p.paxType === 'CHD').length,
          inf: formattedPassengers.filter(p => p.paxType === 'INF').length,
          tripType: flight.tripType || 'O'
        }
      };

      console.log('Sending validate request:', validatePayload);

      const validateResponse = await axios.post('http://127.0.0.1:8000/api/flights/validate/', validatePayload);

      const validatedData = validateResponse.data.response.content;
      const sealed = validatedData.validateFareResponse?.sealed;

      if (!sealed) {
        throw new Error('Failed to get sealed token from validation');
      }

      // Step 3: Create booking
      const bookingPayload = {
        flightData: {
          tripType: flight.tripType || 'O',
          adt: formattedPassengers.filter(p => p.paxType === 'ADT').length,
          chd: formattedPassengers.filter(p => p.paxType === 'CHD').length,
          inf: formattedPassengers.filter(p => p.paxType === 'INF').length,
          supplierSpecific: validatedData.supplierSpecific || flight.supplierSpecific || {},
          fare: validatedData.validateFareResponse?.fare || flight.fare,
          ondPairs: flight.ondPairs || flight.segments?.map(seg => ({
            duration: seg.ond?.duration || '0',
            originCity: seg.flights?.[0]?.departureLocation || '',
            destinationCity: seg.flights?.[seg.flights.length - 1]?.arrivalLocation || '',
            segments: seg.flights?.map(f => ({
              depDate: f.departureDate,
              depTime: f.departureTime,
              arrDate: f.arrivalDate,
              arrTime: f.arrivalTime,
              depAirport: f.departureLocation,
              arrAirport: f.arrivalLocation,
              mktgAirline: f.airlineCode,
              operAirline: f.operatingAirline || f.airlineCode,
              issuingAirline: seg.ond?.issuingAirline || f.airlineCode,
              flightNo: f.flightNo,
              cabin: f.cabin || 'Y',
              rbd: f.rbd || 'Y',
              arrTerminal: f.arrivalTerminal || '',
              depTerminal: f.departureTerminal || '',
              eqpType: f.equipmentType || '',
              stopQuantity: f.stops || 0,
              baggageAllowance: f.baggage || []
            })) || []
          })) || [],
          supplierCodes: Array.isArray(flight.supplierCodes) ? flight.supplierCodes : [flight.supplierCode || 11]
        },
        passengers: formattedPassengers,
        sealed: sealed
      };

      const bookingResponse = await axios.post('http://127.0.0.1:8000/api/flights/book/', bookingPayload);

      // Extract booking details from response
      const bookingResult = bookingResponse.data?.response?.content?.bookFlightResult;

      if (bookingResult && bookingResult.success && bookingResult.pnr) {
        // Create ticket object to save
        const ticketData = {
          pnr: bookingResult.pnr,
          bookingRefId: bookingResult.bookingRefId,
          status: bookingResult.status || 'HK',
          airlineLocator: bookingResult.airlineReservation?.[0]?.airlineLocator || '',
          airline: bookingResult.airlineReservation?.[0]?.airlineCode || '',
          passengerName: `${passengers[0].givenName} ${passengers[0].surName}`,
          passengerEmail: passengers[0].email,
          passengerPhone: `+${passengers[0].phoneCode}${passengers[0].phone}`,
          nationality: passengers[0].nationality,
          passportNumber: passengers[0].docID,
          dateOfBirth: passengers[0].birthDate,
          origin: flight.ondPairs?.[0]?.segments?.[0]?.depAirport || flight.segments?.[0]?.flights?.[0]?.departureLocation || '',
          destination: flight.ondPairs?.[0]?.segments?.[flight.ondPairs[0].segments.length - 1]?.arrAirport || flight.segments?.[0]?.flights?.[flight.segments[0].flights.length - 1]?.arrivalLocation || '',
          originCity: flight.ondPairs?.[0]?.originCity || '',
          destinationCity: flight.ondPairs?.[0]?.destinationCity || '',
          departureDate: flight.ondPairs?.[0]?.segments?.[0]?.depDate || flight.segments?.[0]?.flights?.[0]?.departureDate || '',
          arrivalDate: flight.ondPairs?.[0]?.segments?.[flight.ondPairs[0].segments.length - 1]?.arrDate || '',
          flightNumber: flight.ondPairs?.[0]?.segments?.[0]?.flightNo || '',
          cabin: flight.ondPairs?.[0]?.segments?.[0]?.cabin || 'Economy',
          baseFare: validatedData.validateFareResponse?.fare?.baseFare || flight.fare?.baseFare || '0',
          tax: validatedData.validateFareResponse?.fare?.tax || flight.fare?.tax || '0',
          totalFare: validatedData.validateFareResponse?.fare?.total || flight.fare?.total || '0',
          currency: validatedData.validateFareResponse?.fare?.currency || flight.fare?.currency || 'PKR',
          bookingDate: new Date().toISOString(),
          segments: flight.ondPairs?.[0]?.segments || [],
          supplierCode: bookingResponse.data?.response?.supplierCode || flight.supplierCode || ''
        };

        // Save to database via API
        try {
          const token = localStorage.getItem('agentAccessToken');
          const headers = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const saveResponse = await axios.post(
            'http://127.0.0.1:8000/api/flights/bookings/save/',
            ticketData,
            { headers }
          );
          console.log('✅ Booking saved to database:', saveResponse.data);
        } catch (saveError) {
          console.error('⚠️ Failed to save booking to database:', saveError);
          console.error('Save error response:', saveError.response?.data);
          // Continue anyway - booking was successful on AIQS
        }

        // Show success message
        alert(`🎉 Congratulations! Your booking is confirmed!\n\nPNR: ${bookingResult.pnr}\nBooking Ref: ${bookingResult.bookingRefId}\nStatus: ${bookingResult.status}`);

        // Success callback
        if (onBookingSuccess) {
          onBookingSuccess({
            ...bookingResponse.data,
            ticketData
          });
        }
      }

      onHide();
    } catch (err) {
      console.error('Booking error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Flight data being sent:', flight);
      setError(
        err.response?.data?.details ||
        err.response?.data?.error ||
        JSON.stringify(err.response?.data) ||
        err.message ||
        'Booking failed'
      );
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no flight selected
  if (!flight) {
    return null;
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Complete Your Booking</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {passengers.map((passenger, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <h6 className="mb-3 text-primary">
                <User size={18} className="me-2" />
                Passenger {index + 1} Details
              </h6>

              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Title *</Form.Label>
                    <Form.Select
                      value={passenger.salutation}
                      onChange={(e) => handlePassengerChange(index, 'salutation', e.target.value)}
                      required
                    >
                      <option value="Mr">Mr</option>
                      <option value="Ms">Ms</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Master">Master</option>
                      <option value="Miss">Miss</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={passenger.givenName}
                      onChange={(e) => handlePassengerChange(index, 'givenName', e.target.value)}
                      required
                      placeholder="As per passport"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={passenger.surName}
                      onChange={(e) => handlePassengerChange(index, 'surName', e.target.value)}
                      required
                      placeholder="As per passport"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <Calendar size={16} className="me-1" />
                      Date of Birth *
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={passenger.birthDate}
                      onChange={(e) => handlePassengerChange(index, 'birthDate', e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <Globe size={16} className="me-1" />
                      Nationality *
                    </Form.Label>
                    <Form.Select
                      value={passenger.nationality}
                      onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)}
                      required
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <CreditCard size={16} className="me-1" />
                      Passport Number *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={passenger.docID}
                      onChange={(e) => handlePassengerChange(index, 'docID', e.target.value.toUpperCase())}
                      required
                      placeholder="AB1234567"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Passport Expiry Date *</Form.Label>
                    <Form.Control
                      type="date"
                      value={passenger.expiryDate}
                      onChange={(e) => handlePassengerChange(index, 'expiryDate', e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Passport Issued Country *</Form.Label>
                    <Form.Select
                      value={passenger.docIssueCountry}
                      onChange={(e) => handlePassengerChange(index, 'docIssueCountry', e.target.value)}
                      required
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {index === 0 && (
                  <>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <Mail size={16} className="me-1" />
                          Email *
                        </Form.Label>
                        <Form.Control
                          type="email"
                          value={passenger.email}
                          onChange={(e) => handlePassengerChange(index, 'email', e.target.value)}
                          required
                          placeholder="your@email.com"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Country *</Form.Label>
                        <Form.Select
                          value={passenger.countryCode}
                          onChange={(e) => handlePassengerChange(index, 'countryCode', e.target.value)}
                          required
                        >
                          {COUNTRIES.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <Phone size={16} className="me-1" />
                          Phone Number *
                        </Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="text"
                            value={`+${passenger.phoneCode}`}
                            disabled
                            style={{ width: '80px' }}
                          />
                          <Form.Control
                            type="tel"
                            value={passenger.phone}
                            onChange={(e) => handlePassengerChange(index, 'phone', e.target.value.replace(/[^0-9]/g, ''))}
                            required
                            placeholder="3001234567"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </>
                )}
              </Row>
            </div>
          ))}

          <div className="d-flex justify-content-between align-items-center mt-4">
            <div>
              <strong>Total Amount:</strong>
              <span className="ms-2 text-primary fs-5">
                {flight?.fare?.currency || 'PKR'} {flight?.fare?.total?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={onHide} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default BookingModal;
