import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import logo from "../../assets/logo.png";
import travel from "../../assets/travel.png";
import { ArrowLeft } from "react-bootstrap-icons";
import { Link } from "react-router-dom";

const AgentBookingInvoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [agencyData, setAgencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get booking number from location state
  const bookingNumber = location.state?.bookingNumber;

  useEffect(() => {
    if (!bookingNumber) {
      setError("No booking number provided");
      setLoading(false);
      return;
    }

    const fetchBookingData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("agentAccessToken");
        const orgData = JSON.parse(localStorage.getItem("agentOrganization"));
        const organizationId = orgData?.ids?.[0] || orgData?.id;

        // Fetch booking data
        const bookingResponse = await axios.get(
          `https://b2bapi.saer.pk/api/bookings/`,
          {
            params: {
              booking_number: bookingNumber,
              organization: organizationId,
            },
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const booking = Array.isArray(bookingResponse.data)
          ? bookingResponse.data[0]
          : bookingResponse.data.results?.[0] || bookingResponse.data;

        setBookingData(booking);

        // Fetch agency/organization data for helpline number
        try {
          const agencyResponse = await axios.get(
            `https://b2bapi.saer.pk/api/agencies/${organizationId}/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log('Agency Data:', agencyResponse.data);
          console.log('Agency Keys:', Object.keys(agencyResponse.data));
          setAgencyData(agencyResponse.data);
        } catch (agencyErr) {
          console.error("Error fetching agency data:", agencyErr);
          console.log("Agency API URL:", `https://b2bapi.saer.pk/api/agencies/${organizationId}/`);
          // Continue even if agency fetch fails
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("Failed to load booking data");
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingNumber]);

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

  // Calculate totals
  const totalHotel = bookingData.total_hotel_amount_pkr || 0;
  const totalTransport = bookingData.total_transport_amount_pkr || 0;
  const totalFood = bookingData.total_food_amount_pkr || 0;
  const totalZiyarat = bookingData.total_ziyarat_amount_pkr || 0;
  const totalVisa = bookingData.total_visa_amount_pkr || 0;
  const totalTicket = bookingData.total_ticket_amount_pkr || 0;
  const grandTotal = bookingData.total_amount || 0;

  // DEBUG: Log booking data to see available fields
  console.log('Booking Data:', bookingData);
  console.log('Booking Keys:', Object.keys(bookingData));

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
              <div className="p-2">
                <div className="row">
                  <div className="col-md-12 d-flex justify-content-between">
                    <div>
                      <Link to="/booking-history">
                        <ArrowLeft size={"30px"} />
                      </Link>
                      <strong>INVOICE ({bookingData.booking_number})</strong>
                    </div>
                    <div>
                      <button id="btn" className="btn me-1">Print</button>
                      <button id="btn" className="btn me-1">Edit</button>
                      <button id="btn" className="btn">Download</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3">
                {/* Company Header */}
                <div className="p-3" style={{ background: "#EBEBEB" }}>
                  <div className="row mb-3">
                    <div className="col-12 d-flex justify-content-center">
                      <img src={logo} alt="" style={{ height: "40px", width: "150px" }} />
                    </div>
                    <div className="col-12 mt-2 d-flex justify-content-center">
                      <div className="text-center">
                        <h6>POWERED BY</h6>
                        <h5 className="text-muted">SAER KARO TRAVEL AND TOURS</h5>
                      </div>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-8 d-flex align-items-center gap-2">
                      <img src={travel} alt="" height={"150px"} />
                      <div>
                        <small><strong>{agencyData?.name || bookingData.agency?.name || "N/A"}</strong></small><br />
                        <small><strong>Booking Date:</strong> {new Date(bookingData.created_at).toLocaleDateString()}</small><br />
                        <small><strong>Package:</strong> {bookingData.umrah_package_name || "Custom Package"}</small>
                      </div>
                    </div>
                    <div className="col-md-4 d-flex align-items-center gap-2">
                      <div>
                        <small><strong>Shirka:</strong> {bookingData.user?.name || bookingData.user?.username || "N/A"}</small><br />
                        <small><strong>City:</strong> {agencyData?.branch_name || bookingData.branch?.name || "N/A"}</small><br />
                        <small><strong>HelpLine Number:</strong> {agencyData?.phone_number || bookingData.agency?.phone_number || "N/A"}</small><br />
                        <small><strong>Invoice Status:</strong> <span className="text-success">{bookingData.status}</span></small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pax Information */}
                <h6 className="fw-bold mb-3 mt-5">Pax Information</h6>
                <div className="table-responsive mb-4">
                  <table className="table table-sm text-center">
                    <thead className="table-light">
                      <tr>
                        <th className="fw-normal">Passenger Name</th>
                        <th className="fw-normal">Passport No</th>
                        <th className="fw-normal">PAX</th>
                        <th className="fw-normal">DOB</th>
                        <th className="fw-normal">Gender</th>
                        <th className="fw-normal">Visa Included</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingData.person_details?.map((person, index) => {
                        // Build full name from first_name and last_name
                        const fullName = person.first_name && person.last_name
                          ? `${person.first_name} ${person.last_name}`.trim()
                          : person.first_name || person.last_name || person.full_name || person.name || "N/A";

                        // Derive gender from person_title (MR = Male, MRS/MS/MISS = Female)
                        let gender = "N/A";
                        if (person.person_title) {
                          const title = person.person_title.toUpperCase();
                          if (title === "MR") {
                            gender = "Male";
                          } else if (title === "MRS" || title === "MS" || title === "MISS") {
                            gender = "Female";
                          }
                        }

                        return (
                          <tr key={index}>
                            <td>{fullName}</td>
                            <td>{person.passport_number || person.passport_no || "N/A"}</td>
                            <td>{person.age_group || person.person_type || person.pax_type || person.type || "N/A"}</td>
                            <td>{person.date_of_birth || person.dob || "N/A"}</td>
                            <td>{gender}</td>
                            <td>{person.is_visa_included ? "Yes" : "No"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Accommodation */}
                <h6 className="fw-bold mb-3 mt-5">Accommodation</h6>
                <div className="table-responsive mb-4">
                  <table className="table table-sm text-center">
                    <thead className="table-light">
                      <tr>
                        <th className="fw-normal">Hotel Name</th>
                        <th className="fw-normal">Check-in</th>
                        <th className="fw-normal">Check-Out</th>
                        <th className="fw-normal">Nights</th>
                        <th className="fw-normal">Type</th>
                        <th className="fw-normal">QTY</th>
                        <th className="fw-normal">Rate</th>
                        <th className="fw-normal">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingData.hotel_details?.map((hotel, index) => (
                        <tr key={index}>
                          <td>{hotel.hotel_name || hotel.name || "N/A"}</td>
                          <td>{hotel.check_in_date || hotel.checkin || "N/A"}</td>
                          <td>{hotel.check_out_date || hotel.checkout || "N/A"}</td>
                          <td>{hotel.number_of_nights || hotel.nights || 0}</td>
                          <td>{hotel.room_type || hotel.type || hotel.sharing_type || "Standard"}</td>
                          <td>{hotel.quantity || hotel.qty || 1}</td>
                          <td>PKR {hotel.price_in_pkr || hotel.price || 0}</td>
                          <td>PKR {hotel.total_in_pkr || hotel.total_price || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-end pe-3">
                    <strong>Total Accommodation: PKR {totalHotel.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Transportation */}
                <h6 className="fw-bold mb-3 mt-5">Transportation</h6>
                <div className="table-responsive mb-4">
                  <table className="table table-sm text-center">
                    <thead className="table-light">
                      <tr>
                        <th>Vehicle Type</th>
                        <th>Route</th>
                        <th>Rate</th>
                        <th>QTY</th>
                        <th>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingData.transport_details?.map((transport, index) => {
                        // Build route from sector details in format: R/T -Jed(A)-Mak(H)-Med(H)-Mak(H)-Jed(A)
                        let route = "N/A";
                        if (transport.sector_details && transport.sector_details.length > 0) {
                          const sectors = transport.sector_details.map(s => {
                            // Get city name (first 3 letters capitalized) - using departure_city from model
                            const cityName = s.departure_city || s.from_city_name || s.city_name || "";
                            const cityAbbr = cityName.substring(0, 3).toUpperCase();

                            // Determine location type: (A) for Airport, (H) for Hotel
                            const locationType = s.is_airport_pickup || s.sector_type?.includes('AIRPORT') ? '(A)' : '(H)';

                            return cityAbbr ? `${cityAbbr}${locationType}` : '';
                          }).filter(s => s);

                          // Add the last destination using arrival_city from last sector
                          if (transport.sector_details.length > 0) {
                            const lastSector = transport.sector_details[transport.sector_details.length - 1];
                            const toCityName = lastSector.arrival_city || lastSector.to_city_name || "";
                            const toCityAbbr = toCityName.substring(0, 3).toUpperCase();
                            const toLocationType = lastSector.is_airport_drop || lastSector.sector_type?.includes('AIRPORT') ? '(A)' : '(H)';
                            if (toCityAbbr) {
                              sectors.push(`${toCityAbbr}${toLocationType}`);
                            }
                          }

                          route = sectors.length > 0 ? `R/T -${sectors.join('-')}` : "N/A";
                        }
                        // Fallback to route field if sector_details doesn't exist
                        if (route === "N/A" && transport.route) {
                          route = transport.route;
                        }

                        return (
                          <tr key={index}>
                            <td>{transport.vehicle_type_name || transport.vehicle_type || "N/A"}</td>
                            <td>{route}</td>
                            <td>PKR {transport.price_in_pkr || transport.price || 0}</td>
                            <td>{transport.quantity || 1}</td>
                            <td>PKR {transport.total_price_in_pkr || transport.total_price || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-end pe-3">
                    <strong>Total Transportation: PKR {totalTransport.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Food Section */}
                <h6 className="fw-bold mb-3 mt-5">Food Details</h6>
                <div className="table-responsive mb-4">
                  <table className="table table-sm text-center">
                    <thead className="table-light">
                      <tr>
                        <th>Food Item</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingData.food_details?.length > 0 ? (
                        bookingData.food_details.map((food, index) => {
                          // Calculate total quantity from adults + children + infants
                          const totalPax = (food.total_adults || 0) + (food.total_children || 0) + (food.total_infants || 0);

                          // Calculate average price per person if we have pax count
                          let pricePerPerson = 0;
                          if (totalPax > 0 && food.total_price_pkr) {
                            pricePerPerson = Math.round(food.total_price_pkr / totalPax);
                          }

                          return (
                            <tr key={index}>
                              <td>{food.food || food.food_name || food.name || "N/A"}</td>
                              <td>{totalPax || food.quantity || 1}</td>
                              <td>PKR {pricePerPerson || food.adult_price || food.price || 0}</td>
                              <td>PKR {food.total_price_pkr || food.total_price_sar || food.total_price || 0}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-muted">No food details available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-end pe-3">
                    <strong>Total Food: PKR {totalFood.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Ziyarat Section */}
                <h6 className="fw-bold mb-3 mt-5">Ziyarat Details</h6>
                <div className="table-responsive mb-4">
                  <table className="table table-sm text-center">
                    <thead className="table-light">
                      <tr>
                        <th>Ziyarat Place</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingData.ziyarat_details?.length > 0 ? (
                        bookingData.ziyarat_details.map((ziyarat, index) => {
                          // Calculate total quantity from adults + children + infants (same as food)
                          const totalPax = (ziyarat.total_adults || 0) + (ziyarat.total_children || 0) + (ziyarat.total_infants || 0);

                          // Calculate average price per person if we have pax count
                          let pricePerPerson = 0;
                          if (totalPax > 0 && ziyarat.total_price_pkr) {
                            pricePerPerson = Math.round(ziyarat.total_price_pkr / totalPax);
                          }

                          // Get ziyarat name - use ziarat field or generic name as fallback
                          const ziyaratName = ziyarat.ziarat || ziyarat.ziyarat_name || ziyarat.name || "Ziyarat";

                          return (
                            <tr key={index}>
                              <td>{ziyaratName}</td>
                              <td>{totalPax || ziyarat.quantity || 1}</td>
                              <td>PKR {pricePerPerson || ziyarat.adult_price || ziyarat.price || 0}</td>
                              <td>PKR {ziyarat.total_price_pkr || ziyarat.total_price_sar || ziyarat.total_price || 0}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-muted">No ziyarat details available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-end pe-3">
                    <strong>Total Ziyarat: PKR {totalZiyarat.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Pilgrims & Tickets Detail */}
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3 mt-5">Pilgrims & Tickets Detail</h6>
                    <div className="table-responsive mb-4">
                      <table className="table table-sm">
                        <thead className="table-light">
                          <tr>
                            <th>Pax</th>
                            <th>Total Pax</th>
                            <th>Visa Rate</th>
                            <th>Ticket Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Calculate visa rates from person_details
                            const adults = bookingData.person_details?.filter(p => p.age_group === 'Adult') || [];
                            const children = bookingData.person_details?.filter(p => p.age_group === 'Child') || [];
                            const infants = bookingData.person_details?.filter(p => p.age_group === 'Infant') || [];

                            // Calculate average visa rate for each type
                            const adultVisaRate = adults.length > 0
                              ? Math.round(adults.reduce((sum, p) => sum + (p.visa_rate_in_pkr || p.visa_price || 0), 0) / adults.length)
                              : 0;
                            const childVisaRate = children.length > 0
                              ? Math.round(children.reduce((sum, p) => sum + (p.visa_rate_in_pkr || p.visa_price || 0), 0) / children.length)
                              : 0;
                            const infantVisaRate = infants.length > 0
                              ? Math.round(infants.reduce((sum, p) => sum + (p.visa_rate_in_pkr || p.visa_price || 0), 0) / infants.length)
                              : 0;

                            return (
                              <>
                                <tr>
                                  <td>Adult</td>
                                  <td>{bookingData.total_adult || adults.length || 0}</td>
                                  <td>PKR {adultVisaRate.toLocaleString()}</td>
                                  <td>PKR {bookingData.ticket_details?.[0]?.adult_price || 0}</td>
                                </tr>
                                <tr>
                                  <td>Child</td>
                                  <td>{bookingData.total_child || children.length || 0}</td>
                                  <td>PKR {childVisaRate.toLocaleString()}</td>
                                  <td>PKR {bookingData.ticket_details?.[0]?.child_price || 0}</td>
                                </tr>
                                <tr>
                                  <td>Infant</td>
                                  <td>{bookingData.total_infant || infants.length || 0}</td>
                                  <td>PKR {infantVisaRate.toLocaleString()}</td>
                                  <td>PKR {bookingData.ticket_details?.[0]?.infant_price || 0}</td>
                                </tr>
                                <tr>
                                  <td><strong>Total</strong></td>
                                  <td><strong>{bookingData.total_pax || 0}</strong></td>
                                  <td><strong>PKR {totalVisa.toLocaleString()}</strong></td>
                                  <td><strong>PKR {totalTicket.toLocaleString()}</strong></td>
                                </tr>
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                <h6 className="fw-bold mb-3 mt-5">Invoice Details</h6>
                <div className="row">
                  {/* Left Column */}
                  <div className="col-lg-8 col-md-7 col-12 mb-3">
                    <div className="mb-2">
                      <span>Booking Date: </span>
                      <span className="fw-bold">{new Date(bookingData.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mb-2">
                      <span>Booking#: </span>
                      <span className="fw-bold">{bookingData.booking_number}</span>
                    </div>
                    <div className="mb-2">
                      <span>Invoice Date: </span>
                      <span className="fw-bold">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Right Column - Price Summary */}
                  <div className="col-lg-4 col-md-5 col-12">
                    <div className="card border-0 h-100">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Total Pax:</span>
                          <strong>{bookingData.total_pax || 0}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Visa:</span>
                          <strong>PKR {totalVisa.toLocaleString()}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Tickets:</span>
                          <strong>PKR {totalTicket.toLocaleString()}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Hotel:</span>
                          <strong>PKR {totalHotel.toLocaleString()}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Transport:</span>
                          <strong>PKR {totalTransport.toLocaleString()}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Food:</span>
                          <strong>PKR {totalFood.toLocaleString()}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-3">
                          <span>Ziyarat:</span>
                          <strong>PKR {totalZiyarat.toLocaleString()}</strong>
                        </div>
                        <hr />
                        <div
                          className="d-flex justify-content-between align-items-center py-2 px-3 text-white rounded-5"
                          style={{ background: "#1B78CE" }}
                        >
                          <span><strong>Net PKR:</strong></span>
                          <strong>PKR {grandTotal.toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Notes */}
                  {bookingData.notes && (
                    <div className="card border-0 h-100 mt-3">
                      <div className="card-body p-3">
                        <h6 className="mb-2">
                          <strong>Booking Notes:</strong> {bookingData.notes}
                        </h6>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentBookingInvoice;