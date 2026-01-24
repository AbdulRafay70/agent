import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { ArrowLeft, Printer, Download, Plane } from "lucide-react";
import travel from "../../assets/travel.png";
import { Dropdown } from "react-bootstrap";

const AgentGroupTicketsInvoice = () => {
  const { id } = useParams();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPrintingWithoutFare, setIsPrintingWithoutFare] = useState(false);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("agentAccessToken");

        const response = await axios.get(
          `http://127.0.0.1:8000/api/bookings/${id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        setBookingData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("Failed to load booking data");
        setLoading(false);
      }
    };

    if (id) {
      fetchBookingData();
    }
  }, [id]);

  const handlePrint = (withFare) => {
    if (!withFare) {
      setIsPrintingWithoutFare(true);
      setTimeout(() => {
        window.print();
        setTimeout(() => setIsPrintingWithoutFare(false), 500);
      }, 100);
    } else {
      setIsPrintingWithoutFare(false);
      setTimeout(() => {
        window.print();
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="alert alert-danger">{error || "Booking not found"}</div>
      </div>
    );
  }

  // Get ticket details
  const ticketDetails = bookingData.ticket_details?.[0] || {};
  const personDetails = bookingData.person_details || [];

  // Calculate totals
  const totalAmount = bookingData.total_amount || 0;

  // Check if booking is paid based on status
  // User specified: Confirmed is NOT paid, Approved IS paid
  const isPaidStatus = ['approved', 'paid', 'completed'].includes(
    (bookingData.status || '').toLowerCase()
  );

  // If status indicates paid but paid_amount is 0 or invalid, treat as fully paid
  let paidAmount = parseFloat(bookingData.paid_amount || 0);

  // If status is paid/approved but paidAmount is 0, override it with totalAmount
  if (isPaidStatus && paidAmount <= 0) {
    paidAmount = totalAmount;
  }

  const pendingAmount = totalAmount - paidAmount;

  // Calculate discounted fare
  const totalDiscount = parseFloat(bookingData.total_discount || 0);
  const totalPax = personDetails.length || 1;
  const discountPerPax = totalDiscount / totalPax;

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
              <div className="mb-5 d-flex justify-content-between align-items-center">
                <Link to="/booking-history">
                  <ArrowLeft />
                </Link>
                <div>
                  <Dropdown>
                    <Dropdown.Toggle id="dropdown-basic" className="btn btn-primary d-flex align-items-center gap-2">
                      <Download size={18} /> Download / Print
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handlePrint(true)}>
                        <Printer size={16} className="me-2" /> Download with Fare
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handlePrint(false)}>
                        <Printer size={16} className="me-2" /> Download without Fare
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>

              <div className="row mb-2">
                <div className="col-md-4">
                  {bookingData.agency?.logo ? (
                    <img
                      src={bookingData.agency.logo}
                      alt="Agency Logo"
                      style={{ maxHeight: "100px", maxWidth: "100%" }}
                    />
                  ) : (
                    <img src={travel} alt="Default Logo" />
                  )}
                </div>
                <div className="col-md-8 mt-3">
                  <div className="row d-flex align-items-center justify-content-end">
                    <div className="col-md-3">
                      <h6 className="fw-bold">Name:</h6>
                      <h6>{bookingData.agency?.name || "N/A"}</h6>
                    </div>
                    {/* Replaced 'Agent Name' which seemed redundant with Agency Code/Name context, but keeping if requested. 
                        User asked: "disply agncy code and ageny name ok and change code in to booking number ok and disply contact number ok"
                    */}
                    <div className="col-md-3">
                      <h6 className="fw-bold">Agency Code:</h6>
                      <h6>{bookingData.agency?.agency_code || "N/A"}</h6>
                    </div>
                    <div className="col-md-3">
                      <h6 className="fw-bold">Contact:</h6>
                      <h6>{bookingData.agency?.phone_number || bookingData.agency?.contacts?.[0]?.phone_number || "N/A"}</h6>
                    </div>
                    <div className="col-md-3">
                      <h6 className="fw-bold">Booking No:</h6>
                      <h6>{bookingData.booking_number || "N/A"}</h6>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <h5 className="fw-bold">Tickets Detail</h5>
              <div className="card border-0 mb-4">
                <div className="card-body">
                  {/* Flight Information */}
                  <div
                    className="container p-4 rounded-4"
                    style={{ background: "#E5F2FF" }}
                  >
                    <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mb-4">
                      {/* Flight Route Section */}
                      <div className="d-flex align-items-center gap-4 flex-wrap">
                        {/* 
                           MAPPING LOGIC:
                           The payload shows `ticket_details` array. 
                           Inside that, `trip_details` is an array with legs (Departure, Return, etc.).
                           We should show the first leg by default or iterate if complex.
                           For simplicity matching the UI, we take the FIRST leg (Departure) details.
                        */}
                        {(() => {
                          const firstLeg = ticketDetails.trip_details?.[0] || {};

                          return (
                            <>
                              {/* Departure */}
                              <div className="text-center">
                                <h5 className="fw-bold">Depart</h5>
                                <h2 className="fw-bold">
                                  {firstLeg.departure_date_time
                                    ? new Date(firstLeg.departure_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                                    : "20:15"}
                                </h2>
                                <p className="mb-1">
                                  {firstLeg.departure_date_time
                                    ? new Date(firstLeg.departure_date_time).toLocaleDateString()
                                    : new Date(bookingData.date).toLocaleDateString()}
                                </p>
                                <p className="fw-bold">
                                  {firstLeg.departure_city || "City"} ({firstLeg.departure_city_code || "Code"})
                                </p>
                              </div>

                              {/* Simple arrow or divider */}
                              <div className="d-none d-sm-block" style={{ borderLeft: "2px dashed rgba(0,0,0,0.3)", height: "80px", margin: "0 20px" }}></div>

                              {/* Arrival */}
                              <div className="text-center">
                                <h5 className="fw-bold">Arrival</h5>
                                <h2 className="fw-bold">
                                  {firstLeg.arrival_date_time
                                    ? new Date(firstLeg.arrival_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                                    : "02:15"}
                                </h2>
                                <p className="mb-1">
                                  {firstLeg.arrival_date_time
                                    ? new Date(firstLeg.arrival_date_time).toLocaleDateString()
                                    : new Date(bookingData.date).toLocaleDateString()}
                                </p>
                                <p className="fw-bold">
                                  {firstLeg.arrival_city || "City"} ({firstLeg.arrival_city_code || "Code"})
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <div
                        className="d-none d-sm-block"
                        style={{
                          borderLeft: "2px dashed rgba(0, 0, 0, 0.3)",
                          height: "140px",
                        }}
                      ></div>

                      {/* Status and Class Info */}
                      <div className="d-flex flex-column flex-md-row gap-5 text-center">
                        <div>
                          <div>
                            <h6 className="fw-bold mb-1">{bookingData.status || "Confirm"}</h6>
                            <div className="small">Status</div>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-1">
                              {(() => {
                                const firstLeg = ticketDetails.trip_details?.[0] || {};
                                return firstLeg.airline || "Airline";
                              })()}
                            </h6>
                            <div className="small">Airline</div>
                          </div>
                        </div>
                        <div>
                          <div>
                            <h6 className="fw-bold mb-1">{ticketDetails.pnr || "95LAHD"}</h6>
                            <div className="small">PNR</div>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-1">
                              {(() => {
                                const firstLeg = ticketDetails.trip_details?.[0] || {};
                                return firstLeg.flight_number || "N/A";
                              })()}
                            </h6>
                            <div className="small">Flight No</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Historical Ticket Details */}
                  {ticketDetails.history && ticketDetails.history.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">Previous Ticket Timings</h6>
                      <div className="d-flex flex-column gap-3">
                        {ticketDetails.history.map((historyItem, index) => {
                          // Fallback logic: Use main ticket details if history has "N/A"
                          const firstLeg = ticketDetails.trip_details?.[0] || {};

                          const origin = (historyItem.origin && historyItem.origin !== "N/A")
                            ? historyItem.origin
                            : (firstLeg.departure_city || "City");

                          const originCode = (historyItem.origin_code && historyItem.origin_code !== "")
                            ? historyItem.origin_code
                            : (firstLeg.departure_city_code || "Code");

                          const destination = (historyItem.destination && historyItem.destination !== "N/A")
                            ? historyItem.destination
                            : (firstLeg.arrival_city || "City");

                          const destinationCode = (historyItem.destination_code && historyItem.destination_code !== "")
                            ? historyItem.destination_code
                            : (firstLeg.arrival_city_code || "Code");

                          const airline = (historyItem.airline && historyItem.airline !== "N/A")
                            ? historyItem.airline
                            : (firstLeg.airline || "Airline");

                          const flightNo = (historyItem.flight_number && historyItem.flight_number !== "N/A")
                            ? historyItem.flight_number
                            : (firstLeg.flight_number || "N/A");

                          const pnr = (historyItem.pnr && historyItem.pnr !== "N/A")
                            ? historyItem.pnr
                            : (ticketDetails.pnr || "N/A");

                          return (
                            <div key={index}>
                              <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                                <small className="text-muted fst-italic">
                                  Updated on: {historyItem.archived_at ? new Date(historyItem.archived_at).toLocaleString() : 'N/A'}
                                </small>
                                <span className="badge bg-secondary text-white">Previous Version</span>
                              </div>

                              <div
                                className="container p-4 rounded-4"
                                style={{ background: "#E5F2FF", opacity: 0.9 }}
                              >
                                <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mb-4">
                                  {/* Flight Route Section */}
                                  <div className="d-flex align-items-center gap-4 flex-wrap">
                                    {/* Departure */}
                                    <div className="text-center">
                                      <h5 className="fw-bold">Depart</h5>
                                      <h2 className="fw-bold">
                                        {historyItem.departure_time ? historyItem.departure_time.slice(0, 5) : "00:00"}
                                      </h2>
                                      <p className="mb-1">
                                        {historyItem.departure_date ? historyItem.departure_date : 'N/A'}
                                      </p>
                                      <p className="fw-bold">
                                        {origin} ({originCode})
                                      </p>
                                    </div>

                                    {/* Simple arrow or divider */}
                                    <div className="d-none d-sm-block" style={{ borderLeft: "2px dashed rgba(0,0,0,0.3)", height: "80px", margin: "0 20px" }}></div>

                                    {/* Arrival */}
                                    <div className="text-center">
                                      <h5 className="fw-bold">Arrival</h5>
                                      <h2 className="fw-bold">
                                        {historyItem.arrival_time ? historyItem.arrival_time.slice(0, 5) : "00:00"}
                                      </h2>
                                      <p className="mb-1">
                                        {historyItem.arrival_date ? historyItem.arrival_date : 'N/A'}
                                      </p>
                                      <p className="fw-bold">
                                        {destination} ({destinationCode})
                                      </p>
                                    </div>
                                  </div>
                                  <div
                                    className="d-none d-sm-block"
                                    style={{
                                      borderLeft: "2px dashed rgba(0, 0, 0, 0.3)",
                                      height: "140px",
                                    }}
                                  ></div>

                                  {/* Status and Class Info - History Context */}
                                  <div className="d-flex flex-column flex-md-row gap-5 text-center">
                                    <div>
                                      <div>
                                        <h6 className="fw-bold mb-1">Previous</h6>
                                        <div className="small">Status</div>
                                      </div>
                                      <div>
                                        <h6 className="fw-bold mb-1">{airline}</h6>
                                        <div className="small">Airline</div>
                                      </div>
                                    </div>
                                    <div>
                                      <div>
                                        <h6 className="fw-bold mb-1">{pnr}</h6>
                                        <div className="small">PNR</div>
                                      </div>
                                      <div>
                                        <h6 className="fw-bold mb-1">{flightNo}</h6>
                                        <div className="small">Flight No</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Passenger Details Tables */}
                  <div className="mb-4 mt-5">
                    <h5 className="fw-bold mb-3">Passenger Details</h5>
                    {personDetails.length > 0 ? (
                      personDetails.map((person, index) => {
                        const originalFare = parseFloat(person.ticket_price || ticketDetails.adult_price || 120000);
                        const discountedFare = originalFare - discountPerPax;

                        return (
                          <div key={index} className="table-responsive mb-3">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th className="fw-normal">Pax NO</th>
                                  <th className="fw-normal">Traveler Name</th>
                                  <th className="fw-normal">Agency PNR</th>
                                  {!isPrintingWithoutFare && <th className="fw-normal">Fare</th>}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="fw-bold">
                                    <strong>{String(index + 1).padStart(2, "0")}</strong>
                                  </td>
                                  <td className="fw-bold">
                                    {person.first_name && person.last_name
                                      ? `${person.first_name} ${person.last_name}`.toUpperCase()
                                      : person.full_name?.toUpperCase() || "N/A"}
                                  </td>
                                  <td className="fw-bold">{ticketDetails.pnr || "95LAHD"}</td>
                                  {!isPrintingWithoutFare && (
                                    <td className="fw-bold">
                                      Rs {discountedFare.toLocaleString()}/
                                    </td>
                                  )}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted">No passenger details available</p>
                    )}
                  </div>

                  {/* Total Balance Section - Hide entirely if printing without fare */}
                  {!isPrintingWithoutFare && (
                    <div className="row mb-4">
                      <div
                        className="col-md-6 p-4 rounded-4"
                        style={{ background: "#E5F2FF" }}
                      >
                        <h6 className="fw-bold mb-3">Total Balance</h6>

                        <div className="d-flex justify-content-end mb-2">
                          <h6 className="mb-0 fw-bold">Sub Total =</h6>
                          <h6 className="mb-0">Rs {totalAmount.toLocaleString()}/-</h6>
                        </div>

                        <div className="d-flex justify-content-end mb-2">
                          <h6 className="mb-0 fw-bold">Paid =</h6>
                          <h6 className="mb-0 text-primary">Rs {paidAmount.toLocaleString()}/-</h6>
                        </div>

                        <div className="d-flex justify-content-end">
                          <h6 className="mb-0 fw-bold">Pending =</h6>
                          <h6 className="mb-0">Rs {pendingAmount.toLocaleString()}/-</h6>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-end mt-5">
                    <h6>Booking Date: {new Date(bookingData.created_at || bookingData.date).toLocaleDateString()}</h6>
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

export default AgentGroupTicketsInvoice;
