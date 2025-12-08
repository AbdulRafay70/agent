import React, { useState } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
// import { Link, useLocation } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { CloudUpload, Search, Utensils } from "lucide-react";
import { Bag } from "react-bootstrap-icons";
import { Link, useNavigate } from "react-router-dom";

const BookingReview = () => {
  const [currentStep] = useState(2);
  const [showModal, setShowModal] = useState(false);
  const [currentPassport, setCurrentPassport] = useState(null);
  const [packageData, setPackageData] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [manualFamilies, setManualFamilies] = useState([]);
  const navigate = useNavigate();

  // Load data from sessionStorage on mount
  React.useEffect(() => {
    // Load package data
    const packageStorage = sessionStorage.getItem('umrah_booknow_v1');
    if (packageStorage) {
      try {
        const parsed = JSON.parse(packageStorage);
        setPackageData(parsed.value || null);
      } catch (e) {
        console.error('Error parsing package data:', e);
      }
    }

    // Load passenger data
    const passengerStorage = sessionStorage.getItem('umrah_passengers_v1');
    if (passengerStorage) {
      try {
        const parsed = JSON.parse(passengerStorage);
        setPassengers(parsed.value?.passengers || []);
        setManualFamilies(parsed.value?.manualFamilies || []);
      } catch (e) {
        console.error('Error parsing passenger data:', e);
      }
    }
  }, []);

  const handleBackToEdit = () => {
    const draftId = `draft-${Date.now()}`;
    navigate(`/packages/custom-umrah/detail/${draftId}`);
  };

  // Calculate total price
  const totalPrice = React.useMemo(() => {
    if (!packageData) return 0;
    
    let total = 0;
    const adults = packageData.total_adaults || 0;
    const children = packageData.total_children || 0;
    const infants = packageData.total_infants || 0;

    // Hotel prices
    packageData.hotel_details?.forEach(hotel => {
      total += hotel.price || 0;
    });

    // Transport prices
    packageData.transport_details?.forEach(transport => {
      const adultPrice = transport.transport_sector_info?.adault_price || 0;
      const childPrice = transport.transport_sector_info?.child_price || 0;
      const infantPrice = transport.transport_sector_info?.infant_price || 0;
      total += (adultPrice * adults) + (childPrice * children) + (infantPrice * infants);
    });

    // Flight prices
    packageData.ticket_details?.forEach(ticket => {
      const adultPrice = ticket.ticket_info?.adult_price || 0;
      const childPrice = ticket.ticket_info?.child_price || 0;
      const infantPrice = ticket.ticket_info?.infant_price || 0;
      total += (adultPrice * adults) + (childPrice * children) + (infantPrice * infants);
    });

    // Food prices (per pax)
    packageData.food_details?.forEach(food => {
      const price = food.food_info?.price || food.food_info?.selling_price || food.price || 0;
      const pax = (adults + children + infants) || 0;
      total += price * pax;
    });

    // Ziarat prices (per pax by type)
    packageData.ziarat_details?.forEach(ziarat => {
      const adultPrice = ziarat.ziarat_info?.adult_price || 0;
      const childPrice = ziarat.ziarat_info?.child_price || 0;
      const infantPrice = ziarat.ziarat_info?.infant_price || 0;
      total += (adultPrice * adults) + (childPrice * children) + (infantPrice * infants);
    });

    // Visa prices (if present)
    packageData.visa_details?.forEach(visa => {
      const adultPrice = visa?.adult_price || visa?.visa_info?.adult_price || 0;
      const childPrice = visa?.child_price || visa?.visa_info?.child_price || 0;
      const infantPrice = visa?.infant_price || visa?.visa_info?.infant_price || 0;
      total += (adultPrice * adults) + (childPrice * children) + (infantPrice * infants);
    });

    return total;
  }, [packageData]);

  if (!packageData) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h4>No package data found</h4>
          <Link to="/packages/umrah-calculater" className="btn btn-primary mt-3">
            Go to Calculator
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const safeText = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'string' || typeof val === 'number') return val;
    if (typeof val === 'object') {
      // prefer name, then code, then id
      return val.name || val.code || val.id || JSON.stringify(val);
    }
    return String(val);
  };

  const handleShowPassport = (passportFile) => {
    setCurrentPassport(passportFile);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentPassport(null);
  };

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <AgentHeader />
            <div className="px-3 mt-3 px-lg-4">
              {/* Step Progress */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex align-items-center flex-wrap">
                    {/* Step 1 */}
                    <div className="d-flex align-items-center me-4">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        1
                      </div>
                      <span className="ms-2 text-primary fw-bold">
                        Booking Detail
                      </span>
                    </div>

                    {/* Line 1 (active) */}
                    <div
                      className="flex-grow-1"
                      style={{ height: "2px", backgroundColor: "#0d6efd" }}
                    ></div>

                    {/* Step 2 (now marked complete) */}
                    <div className="d-flex align-items-center mx-4">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        2
                      </div>
                      <span className="ms-2 text-primary fw-bold">
                        Booking Review
                      </span>
                    </div>

                    {/* Line 2 (inactive) */}
                    <div
                      className="flex-grow-1"
                      style={{ height: "2px", backgroundColor: "#dee2e6" }}
                    ></div>

                    {/* Step 3 (still upcoming) */}
                    <div className="d-flex align-items-center">
                      <div
                        className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center border"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        3
                      </div>
                      <span className="ms-2 text-muted">Payment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Details Card */}
              <div className="card mb-4">
                <div className="card-body" style={{ background: "#F2F9FF" }}>
                  <div className="row">
                    <div className="col-md-8">
                      <h4 className="mb-3 fw-bold">Custom Umrah Package</h4>

                      {/* Hotel Details */}
                      <div className="mb-2">
                        <strong>Hotels:</strong>
                        {packageData.hotel_details.map((hotel, index) => (
                          <div key={index} className="small text-muted">
                            {hotel.number_of_nights} Nights at {hotel.hotel_info?.name} ({hotel.room_type}) -
                            Check-in: {formatDate(hotel.check_in_time)},
                            Check-out: {formatDate(hotel.check_out_time)}
                          </div>
                        ))}
                      </div>

                      {/* Visa Details */}
                      <div className="mb-2">
                        <strong>Visa:</strong>
                        <div className="small text-muted">
                          Adults: {packageData.total_adaults} |
                          Children: {packageData.total_children} |
                          Infants: {packageData.total_infants}
                        </div>
                      </div>

                      {/* Transport Details */}
                      <div className="mb-2">
                        <strong>Transport:</strong>
                        {packageData.transport_details.map((transport, index) => (
                          <div key={index} className="small text-muted">
                            {transport.vehicle_type} -
                            Adult: SAR {transport.transport_sector_info?.adault_price} |
                            Child: SAR {transport.transport_sector_info?.child_price} |
                            Infant: SAR {transport.transport_sector_info?.infant_price}
                          </div>
                        ))}
                      </div>

                      {/* Flight Details */}
                      <div className="mb-2">
                        <strong>Flight:</strong>
                        {packageData.ticket_details.map((ticket, index) => (
                          <React.Fragment key={index}>
                            {ticket.ticket_info?.trip_details?.map((trip, tripIndex) => (
                              <div key={tripIndex} className="small text-muted">
                                {trip.trip_type === "Departure" ? "Travel Date" : "Return Date"}: {safeText(trip.departure_city)} to {safeText(trip.arrival_city)} -
                                {formatDate(trip.departure_date_time)} to {formatDate(trip.arrival_date_time)}
                              </div>
                            ))}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Food Details */}
                      {packageData.food_details?.length > 0 && (
                        <div className="mb-2">
                          <strong>Food:</strong>
                          {packageData.food_details.map((food, idx) => (
                            <div key={idx} className="small text-muted">
                              {food.food_info?.title || food.title || 'Food'} - {safeText(food.food_info?.description) || ''}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ziarat Details */}
                      {packageData.ziarat_details?.length > 0 && (
                        <div className="mb-2">
                          <strong>Ziarat:</strong>
                          {packageData.ziarat_details.map((z, idx) => (
                            <div key={idx} className="small text-muted">
                              {z.ziarat_info?.ziarat_title || z.title || 'Ziarat'} - {safeText(z.ziarat_info?.description) || ''}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="col-md-4">
                      <h4 className="mb-3">Prices Summary</h4>

                      {/* Hotel Prices */}
                      <div className="mb-2">
                        <div className="small text-muted">Hotel Prices:</div>
                        {packageData.hotel_details.map((hotel, index) => (
                          <div key={index} className="small">
                            {hotel.hotel_info?.name} ({hotel.room_type}): SAR {hotel.price} for {hotel.number_of_nights} nights
                          </div>
                        ))}
                      </div>

                      {/* Transport Prices */}
                      <div className="mb-2">
                        <div className="small text-muted">Transport:</div>
                        <div className="small">
                          SAR {packageData.transport_details[0]?.transport_sector_info?.adault_price}/Adult |
                          SAR {packageData.transport_details[0]?.transport_sector_info?.child_price}/Child |
                          SAR {packageData.transport_details[0]?.transport_sector_info?.infant_price}/Infant
                        </div>
                      </div>

                      {/* Flight Prices */}
                      <div className="mb-2">
                        <div className="small text-muted">Flight:</div>
                        <div className="small">
                          SAR {packageData.ticket_details[0]?.ticket_info?.adult_price}/Adult |
                          SAR {packageData.ticket_details[0]?.ticket_info?.child_price}/Child |
                          SAR {packageData.ticket_details[0]?.ticket_info?.infant_price}/Infant
                        </div>
                      </div>

                      {/* Food Prices */}
                      {packageData.food_details?.length > 0 && (
                        <div className="mb-2">
                          <div className="small text-muted">Food:</div>
                          <div className="small">
                            {packageData.food_details.map((food, idx) => {
                              const price = food.food_info?.price || food.food_info?.selling_price || food.price || 0;
                              return (
                                <div key={idx}>SAR {price} per pax</div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Ziarat Prices */}
                      {packageData.ziarat_details?.length > 0 && (
                        <div className="mb-2">
                          <div className="small text-muted">Ziarat:</div>
                          <div className="small">
                            {packageData.ziarat_details.map((z, idx) => (
                              <div key={idx}>
                                SAR {z.ziarat_info?.adult_price || 0}/Adult |
                                SAR {z.ziarat_info?.child_price || 0}/Child |
                                SAR {z.ziarat_info?.infant_price || 0}/Infant
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Total Price */}
                      <div className="mt-3 pt-2 border-top">
                        <h5 className="fw-bold">Total Price: SAR {totalPrice.toFixed(2)}</h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Table */}
              <div className="bg-white rounded p-4 mb-4 shadow-sm">
                <h5 className="mb-3 fw-bold">Passengers Passport Detail</h5>
                <div className="table-responsive">
                  <table className="table mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Type</th>
                        <th>Title</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Passport No</th>
                        <th>Passport Expiry</th>
                        <th>Country</th>
                        <th>Family</th>
                        <th>Passport Copy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((passenger, index) => {
                        const family = manualFamilies[passenger.familyIndex];
                        return (
                          <tr key={index}>
                            <td>{passenger.type}</td>
                            <td>{passenger.title}</td>
                            <td>
                              {passenger.name}
                              {passenger.isHead && (
                                <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>
                                  Head of Family
                                </span>
                              )}
                            </td>
                            <td>{passenger.lName}</td>
                            <td>{passenger.passportNumber}</td>
                            <td>{formatDate(passenger.passportExpiry)}</td>
                            <td>{passenger.country}</td>
                            <td>
                              {family ? family.name : 'N/A'}
                            </td>
                            <td>
                              {passenger.passportFile ? (
                                <Button
                                  variant="link"
                                  onClick={() => handleShowPassport(passenger.passportFile)}
                                  className="p-0"
                                >
                                  View Passport
                                </Button>
                              ) : (
                                "Not Provided"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Passport View Modal */}
              <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>Passport Copy</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                  {currentPassport ? (
                    typeof currentPassport === "string" ? (
                      // If it's a URL string
                      <img
                        src={currentPassport}
                        alt="Passport"
                        style={{ maxWidth: "100%", maxHeight: "70vh" }}
                      />
                    ) : (
                      // If it's a File object
                      <img
                        src={URL.createObjectURL(currentPassport)}
                        alt="Passport"
                        style={{ maxWidth: "100%", maxHeight: "70vh" }}
                      />
                    )
                  ) : (
                    <div>No passport image available</div>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-3">
                <button
                  onClick={handleBackToEdit}
                  className="btn btn-secondary px-4"
                >
                  Back To Edit
                </button>
                <Link
                  to="/packages/custom-umrah/pay"
                  className="btn px-4"
                  id="btn"
                >
                  Make Booking
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingReview;