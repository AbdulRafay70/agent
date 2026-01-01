import React, { useState, useEffect } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import logo from "../../assets/logo.png";
import travel from "../../assets/travel.png";
import code from "../../assets/code.png";
import { ArrowLeft } from "react-bootstrap-icons";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

const AgentHotelVoucher = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const token = localStorage.getItem("agentAccessToken");
        const response = await axios.get(
          `https://api.saer.pk/api/bookings/${id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setBooking(response.data);
        console.log("📊 Booking data:", response.data);
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="alert alert-danger">
          Error loading booking: {error || "Booking not found"}
        </div>
      </div>
    );
  }
  const mutamerData = [
    {
      sno: 1,
      passportNo: "EG196836",
      mutamerName: "Shan Ahmad",
      g: "M",
      pax: "Adult",
      bed: "Yes",
      mohafiz: "",
      ghzpVisa: "9200 TO 9308800",
      pmb: "",
    },
    {
      sno: 2,
      passportNo: "EG196836",
      mutamerName: "Shan Ahmad",
      g: "M",
      pax: "Adult",
      bed: "Yes",
      mohafiz: "",
      ghzpVisa: "9200 TO 9308800",
      pmb: "",
    },
    {
      sno: 3,
      passportNo: "EG196836",
      mutamerName: "Ahmad Ijaz",
      g: "M",
      pax: "Adult",
      bed: "Yes",
      mohafiz: "",
      ghzpVisa: "APT30330",
      pmb: "",
    },
  ];

  const accommodationData = [
    {
      city: "Madinah",
      hotelName: "Adwa Hotel Jawharat al Madinah",
      voucherNo: "90063523",
      value: "Shared",
      meal: "BNS",
      confirm: "OK",
      roomType: "Sharing(Quads)",
      checkIn: "03/07/25",
      checkOut: "09/07/25",
      nights: "8",
    },
    {
      city: "Madinah",
      hotelName: "Adwa Hotel Jawharat al Madinah",
      voucherNo: "90063523",
      value: "Shared",
      meal: "BNS",
      confirm: "OK",
      roomType: "Sharing(Quads)",
      checkIn: "03/07/25",
      checkOut: "09/07/25",
      nights: "7",
    },
    {
      city: "Makkah",
      hotelName: "MAKKAH INN MUWAFAQ Makkah Mukarramah Hotel",
      voucherNo: "90063523",
      value: "Shared",
      meal: "BNS",
      confirm: "OK",
      roomType: "Sharing(Quads)",
      checkIn: "09/07/25",
      checkOut: "09/07/25",
      nights: "5",
    },
  ];

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
              <div className="p-2 ">
                <div className="row">
                  <div className="col-md-12  d-flex justify-content-between">
                    <div>
                      <Link to="/booking-history">
                        <ArrowLeft size={"30px"} />
                      </Link>
                      <strong>Order Number: [Order#]</strong>
                    </div>
                    <div>
                      <button id="btn" className="btn me-1">Print</button>
                      <button id="btn" className="btn me-1">Edit</button>
                      <button id="btn" className="btn">Download</button>
                    </div>
                  </div>
                </div>
              </div>

              {booking && (
                <div className="alert alert-info d-flex justify-content-between align-items-center mb-3 no-print">
                  <div>
                    <strong>Public Link:</strong>{" "}
                    <a
                      href={`${window.location.origin}/public-voucher/${booking.booking_number}?ref=${booking.public_ref}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {`${window.location.origin}/public-voucher/${booking.booking_number}?ref=${booking.public_ref}`}
                    </a>
                  </div>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/public-voucher/${booking.booking_number}?ref=${booking.public_ref}`);
                    alert("Link copied to clipboard!");
                  }}>
                    Copy Link
                  </button>
                </div>
              )}

              <div className="p-3">
                {/* Company Header */}
                <div className="p-3" style={{ background: "#EBEBEB" }}>
                  <div className="row mb-3">
                    <div className="col-12 d-flex justify-content-center">
                      <img src={logo} alt="" style={{ height: "40px", width: "150px" }} />
                    </div>
                    <div className="col-12 mt-2 d-flex justify-content-center">
                      <div className="text-center">
                        <h6>POWERED NY</h6>
                        <h5 className="text-muted">
                          SAER KARO TRAVEL AND TOURS
                        </h5>
                      </div>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-8 d-flex align-items-center gap-2">
                      {booking.agency?.logo ? (
                        <img src={booking.agency.logo} alt="Agency Logo" height={"150px"} style={{ objectFit: "contain" }} />
                      ) : (
                        <img src={travel} alt="Default Logo" height={"150px"} />
                      )}
                      <div>
                        <small>
                          <strong>{booking.agency?.ageny_name || booking.agency?.name || "Agency Name"}</strong>
                        </small>
                        <br />
                        <small>
                          <strong>Voucher Date:</strong> {formatDate(booking.date)}
                        </small>
                        <br />
                        <small>
                          <strong>Package:</strong> {booking.umrah_package?.title || "N/A"}
                        </small>
                      </div>
                    </div>
                    <div className="col-md-4 d-flex align-items-center gap-2">
                      <div>
                        <small>
                          <strong>Booking Number: </strong> {booking.booking_number}
                        </small>
                        <br />
                        <small>
                          <strong>Total Pax:</strong> {booking.total_pax || 0}
                        </small>
                        <br />
                        <small>
                          <strong>Contact:</strong> {booking.agency?.phone_number || "+92 316 6615 6363"}
                        </small>
                        <br />
                        <small>
                          <strong>Voucher Status: </strong> {booking.status}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passenger Details Section */}
                <div className="mb-4">
                  <h5 className="p-2 fw-bold mt-5 mb-3">Passenger Details</h5>

                  <div className="mb-2 text-end">
                    <small>
                      Family Head: <strong>{booking.person_details && booking.person_details.length > 0 ? `${booking.person_details[0].first_name} ${booking.person_details[0].last_name}` : "N/A"}</strong>
                    </small>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered table-sm align-middle">
                      <thead className="table-light">
                        <tr className="text-center">
                          <th style={{ width: "5%" }}>SNO</th>
                          <th style={{ width: "15%" }}>Passport No.</th>
                          <th style={{ width: "25%" }}>Passenger Name</th>
                          <th style={{ width: "8%" }}>Gender</th>
                          <th style={{ width: "12%" }}>Type</th>
                          <th style={{ width: "15%" }}>DOB</th>
                          <th style={{ width: "10%" }}>Visa</th>
                          <th style={{ width: "10%" }}>Ticket</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.person_details && booking.person_details.length > 0 ? (
                          booking.person_details.map((passenger, index) => (
                            <tr key={index}>
                              <td className="text-center">{index + 1}</td>
                              <td className="text-center">{passenger.passport_number || "N/A"}</td>
                              <td>{`${passenger.first_name || ""} ${passenger.last_name || ""}`.trim() || "N/A"}</td>
                              <td className="text-center">{passenger.gender || "N/A"}</td>
                              <td className="text-center">{passenger.age_group || "N/A"}</td>
                              <td className="text-center">{formatDate(passenger.date_of_birth)}</td>
                              <td className="text-center">
                                <span className={passenger.is_visa_included ? "text-success fw-bold" : "text-danger"}>
                                  {passenger.is_visa_included ? "✓" : "✗"}
                                </span>
                              </td>
                              <td className="text-center">
                                <span className={passenger.ticket_included ? "text-success fw-bold" : "text-danger"}>
                                  {passenger.ticket_included ? "✓" : "✗"}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center text-muted py-3">No passenger details available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Accommodation Section */}
                <div className="mb-4">
                  <h5 className="p-2 fw-bold mb-3">Accommodation</h5>
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm align-middle">
                      <thead className="table-light">
                        <tr className="text-center">
                          <th>City</th>
                          <th>Hotel Name</th>
                          <th>Room Type</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                          <th>Nights</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.hotel_details && booking.hotel_details.length > 0 ? (
                          booking.hotel_details.map((hotel, index) => (
                            <tr key={index}>
                              <td className="text-center">{hotel.city_name || "N/A"}</td>
                              <td>{hotel.hotel_name || hotel.self_hotel_name || "N/A"}</td>
                              <td className="text-center">{hotel.room_type || hotel.sharing_type || "N/A"}</td>
                              <td className="text-center">{formatDate(hotel.check_in_date)}</td>
                              <td className="text-center">{formatDate(hotel.check_out_date)}</td>
                              <td className="text-center">{hotel.number_of_nights || 0}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center text-muted py-3">No accommodation details available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-end">
                    <small>
                      <strong>
                        Total Nights: {booking.hotel_details ? booking.hotel_details.reduce((sum, hotel) => sum + (hotel.number_of_nights || 0), 0) : 0}
                      </strong>
                    </small>
                  </div>
                </div>

                {/* Food Details Section */}
                <div className="mb-4">
                  <h5 className="p-2 fw-bold mb-3">Food Details</h5>
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm align-middle">
                      <thead className="table-light">
                        <tr className="text-center">
                          <th>Food Type</th>
                          <th>Adults</th>
                          <th>Children</th>
                          <th>Infants</th>
                          <th>Amount (PKR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.food_details && booking.food_details.length > 0 ? (
                          booking.food_details.map((food, index) => (
                            <tr key={index}>
                              <td>{food.food || "N/A"}</td>
                              <td className="text-center">{food.total_adults || 0}</td>
                              <td className="text-center">{food.total_children || 0}</td>
                              <td className="text-center">{food.total_infants || 0}</td>
                              <td className="text-center">{food.total_price_pkr?.toLocaleString() || "0"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center text-muted py-3">No food details available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-end">
                    <small>
                      <strong>
                        Total Food Amount: PKR {booking.total_food_amount_pkr?.toLocaleString() || "0"}
                      </strong>
                    </small>
                  </div>
                </div>

                {/* Ziyarat Details Section */}
                <div className="mb-4">
                  <h5 className="p-2 fw-bold mb-3">Ziyarat Details</h5>
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm align-middle">
                      <thead className="table-light">
                        <tr className="text-center">
                          <th>Ziyarat Name</th>
                          <th>City</th>
                          <th>Date</th>
                          <th>Adults</th>
                          <th>Children</th>
                          <th>Amount (PKR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.ziyarat_details && booking.ziyarat_details.length > 0 ? (
                          booking.ziyarat_details.map((ziyarat, index) => (
                            <tr key={index}>
                              <td>{ziyarat.ziarat || "N/A"}</td>
                              <td className="text-center">{ziyarat.city || "N/A"}</td>
                              <td className="text-center">{formatDate(ziyarat.date) || "N/A"}</td>
                              <td className="text-center">{ziyarat.total_adults || 0}</td>
                              <td className="text-center">{ziyarat.total_children || 0}</td>
                              <td className="text-center">{ziyarat.total_price_pkr?.toLocaleString() || "0"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center text-muted py-3">No ziyarat details available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-end">
                    <small>
                      <strong>
                        Total Ziyarat Amount: PKR {booking.total_ziyarat_amount_pkr?.toLocaleString() || "0"}
                      </strong>
                    </small>
                  </div>
                </div>


                {/* Transport/Services Section */}
                <div className="mb-4">
                  <h5 className="p-2 fw-bold mb-3">Transport / Services</h5>
                  <div className="row">
                    <div className="col-md-10">
                      <table className="table table-bordered table-sm align-middle">
                        <thead className="table-light">
                          <tr className="text-center">
                            <th>Vehicle Type</th>
                            <th>Description</th>
                            <th>Amount (PKR)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {booking.transport_details && booking.transport_details.length > 0 ? (
                            booking.transport_details.map((transport, index) => (
                              <tr key={index}>
                                <td className="text-center">{transport.vehicle_name || "N/A"}</td>
                                <td>{transport.vehicle_description || "Transport Service"}</td>
                                <td className="text-center">{transport.price_in_pkr?.toLocaleString() || "0"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="text-center text-muted py-3">No transport details available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-2 text-center">
                      <div className="p-3">
                        <div>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/public-voucher/${booking.booking_number}?ref=${booking.public_ref}`)}`}
                            alt="QR Code"
                            style={{
                              width: "100px",
                              height: "100px",
                            }}
                          />
                          <div className="mt-1" style={{ fontSize: '10px' }}>Scan for digital voucher</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flight Information */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h5 className="fw-bold p-2 mb-2">
                      Departure--Pakistan To KSA
                    </h5>
                    <table className="table table-bordered table-sm align-middle">
                      <thead className="table-light">
                        <tr className="text-center">
                          <th>Flight</th>
                          <th>Sector</th>
                          <th>Departure</th>
                          <th>Arrival</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.umrah_package?.ticket_details && booking.umrah_package.ticket_details.length > 0 && booking.umrah_package.ticket_details[0].ticket_info?.trip_details ? (
                          booking.umrah_package.ticket_details[0].ticket_info.trip_details
                            .filter(trip => trip.trip_type === 'departure' || trip.trip_type === 'Departure')
                            .map((trip, index) => (
                              <tr key={index}>
                                <td className="text-center">{trip.flight_number || "N/A"}</td>
                                <td className="text-center">{`${trip.departure_city || ""}-${trip.arrival_city || ""}`}</td>
                                <td className="text-center">{formatDate(trip.departure_date_time)}</td>
                                <td className="text-center">{formatDate(trip.arrival_date_time)}</td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center text-muted py-2">No departure flight details available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h5 className="p-2 fw-bold mb-2">
                      Arrival--KSA To Pakistan
                    </h5>
                    <table className="table table-bordered table-sm align-middle">
                      <thead className="table-light">
                        <tr className="text-center">
                          <th>Flight</th>
                          <th>Sector</th>
                          <th>Departure</th>
                          <th>Arrival</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.umrah_package?.ticket_details && booking.umrah_package.ticket_details.length > 0 && booking.umrah_package.ticket_details[0].ticket_info?.trip_details ? (
                          booking.umrah_package.ticket_details[0].ticket_info.trip_details
                            .filter(trip => trip.trip_type === 'return' || trip.trip_type === 'Return')
                            .map((trip, index) => (
                              <tr key={index}>
                                <td className="text-center">{trip.flight_number || "N/A"}</td>
                                <td className="text-center">{`${trip.departure_city || ""}-${trip.arrival_city || ""}`}</td>
                                <td className="text-center">{formatDate(trip.departure_date_time)}</td>
                                <td className="text-center">{formatDate(trip.arrival_date_time)}</td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center text-muted py-2">No return flight details available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mb-4">
                  <div className="d-flex gap-2 mb-2">
                    <h5>
                      <strong>Notes:</strong>{" "}
                    </h5>
                    <small>{booking.client_note || "PLEASE ACCOMMODATE WITH PRIORITY"}</small>
                  </div>
                  <div className="small border rounded-2 p-3 border-black text-muted">
                    {/* Makkah Hotel Info */}
                    {booking.hotel_details && booking.hotel_details.filter(h => h.city_name?.toLowerCase().includes('makkah') || h.city_name?.toLowerCase().includes('mecca')).length > 0 && (
                      <p>
                        <strong>Makkah Hotel:</strong>{" "}
                        {booking.hotel_details
                          .filter(h => h.city_name?.toLowerCase().includes('makkah') || h.city_name?.toLowerCase().includes('mecca'))
                          .map((h, i) => (
                            <span key={i}>
                              {h.hotel_name || h.self_hotel_name} - {formatDate(h.check_in_date)} to {formatDate(h.check_out_date)} ({h.number_of_nights} nights)
                              {i < booking.hotel_details.filter(h => h.city_name?.toLowerCase().includes('makkah') || h.city_name?.toLowerCase().includes('mecca')).length - 1 ? ', ' : ''}
                            </span>
                          ))}
                      </p>
                    )}

                    {/* Madina Hotel Info */}
                    {booking.hotel_details && booking.hotel_details.filter(h => h.city_name?.toLowerCase().includes('madina') || h.city_name?.toLowerCase().includes('medina')).length > 0 && (
                      <p>
                        <strong>Madina Hotel:</strong>{" "}
                        {booking.hotel_details
                          .filter(h => h.city_name?.toLowerCase().includes('madina') || h.city_name?.toLowerCase().includes('medina'))
                          .map((h, i) => (
                            <span key={i}>
                              {h.hotel_name || h.self_hotel_name} - {formatDate(h.check_in_date)} to {formatDate(h.check_out_date)} ({h.number_of_nights} nights)
                              {i < booking.hotel_details.filter(h => h.city_name?.toLowerCase().includes('madina') || h.city_name?.toLowerCase().includes('medina')).length - 1 ? ', ' : ''}
                            </span>
                          ))}
                      </p>
                    )}

                    {/* Transport Info */}
                    {booking.transport_details && booking.transport_details.length > 0 && (
                      <p>
                        <strong>Transport:</strong>{" "}
                        {booking.transport_details.map((t, i) => (
                          <span key={i}>
                            {t.vehicle_name || "Transport Service"} - PKR {t.price_in_pkr?.toLocaleString() || 0}
                            {i < booking.transport_details.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    )}

                    {/* Show default if no data */}
                    {(!booking.hotel_details || booking.hotel_details.length === 0) && (!booking.transport_details || booking.transport_details.length === 0) && (
                      <p className="text-muted">No additional notes available</p>
                    )}
                  </div>
                </div>

                {/* Rules Section */}
                <div className="mb-4">
                  <h5 className="fw-bold  p-2 mb-2">Rules</h5>
                  <div className="small">
                    <p>
                      <strong>1. Booking Confirmation:</strong> This voucher
                      serves as proof of hotel booking and must be presented at
                      check-in.
                    </p>
                    <p>
                      <strong>2. Check-in and Check-out Time:</strong> Standard
                      check-in time is 14:00 hrs and check out time is 12:00
                      hrs. Entry check-in or late check-out may be available on
                      request and subject to availability.
                    </p>
                    <p>
                      <strong>3. Identification Requirement:</strong> Guests
                      must present a valid passport, visa, and this voucher upon
                      arrival.
                    </p>
                    <p>
                      <strong>4. Hotel Policy:</strong> Each hotel has specific
                      check-in/check-out timings. Alcohol/swimming is prohibited
                      on demand in the booking.
                    </p>
                    <p>
                      <strong>5. No Show & Late Arrival:</strong> Failure to
                      check-in on the specified date without prior notice may
                      result in cancellation without a refund.
                    </p>
                    <p>
                      <strong>6. Amendments & Cancellation:</strong> Any changes
                      or cancellations must be made through the travel agency
                      and are subject to the agency and hotel's terms and
                      conditions.
                    </p>
                  </div>
                </div>

                {/* Footer QR Code */}
                <div className="text-center">
                  <div>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/public-voucher/${booking.booking_number}?ref=${booking.public_ref}`)}`}
                      alt="QR Code"
                      style={{
                        width: "150px",
                        height: "150px",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentHotelVoucher;
