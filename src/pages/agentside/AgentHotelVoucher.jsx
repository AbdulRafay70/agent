import React, { useState, useEffect } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import logo from "../../assets/logo.png";
import travel from "../../assets/travel.png";
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
          `http://127.0.0.1:8000/api/bookings/${id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const bookingData = response.data;

        // Log hotel details to see what data we have
        console.log("📊 Booking data:", bookingData);
        console.log("🏨 Hotel Details:", bookingData.hotel_details);
        console.log("🕌 Ziyarat details:", bookingData.ziyarat_details);
        console.log("✈️ Ticket details:", bookingData.ticket_details);
        console.log("🎫 Trip details:", bookingData.ticket_details?.[0]?.trip_details);

        setBooking(bookingData);
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
    if (!dateString) return "";
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

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}-${month} ${hours}:${minutes}`;
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

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body {
            margin: 0 !important; 
            padding: 0 !important;
            font-size: 10px !important;
          }
          @page {
            size: A4;
            margin: 0mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .voucher-content {
            page-break-inside: avoid !important;
            max-width: 90% !important;
            margin: 15px 0 0 0 !important;
            position: relative !important;
            left: 35px;
          }
          h5, h6 {
            font-size: 8px !important;
            margin: 1px 0 !important;
          }
          .section-title {
            font-size: 15px !important;
            padding: 2px 4px !important;
            margin-bottom: 2px !important;
          }
          .notes-title {
            font-size: 8px !important;
            padding: 2px 4px !important;
            margin-top: 20px !important;
          }
          .notes-title span{
            font-size: 12px !important;
            font-weight: 700 !important;
            padding: 2px 4px !important;
            margin-top: 20px !important;
          }
          .voucher-table {
            font-size: 6.5px !important;
            margin-bottom: 2px !important;
          }
          .voucher-table td, .voucher-table th {
            padding: 2px 3px !important;
            font-size: 10px !important;
            line-height: 1.2 !important;
          }
          .voucher-table td{
            padding: 4px 10px !important;
          }  
          .info-label, .info-value {
            font-size: 5px !important;
          }
          .mb-4 {
            margin-bottom: 2px !important;
          }
          .mb-3 {
            margin-bottom: 1px !important;
          }
          .mb-2 {
            margin-bottom: 1px !important;
          }
          .mt-2, .mt-3, .mt-4 {
            margin-top: 2px !important;
          }
          .p-4 {
            padding: 5px !important;
          }
          .p-3 {
            padding: 4px !important;
          }
          .p-2 {
            padding: 3px !important;
          }
          img {
            max-height: 50px !important;
          }
          /* Show footer QR code in print - multiple selectors for reliability */
          .footer-qr-code,
          div.footer-qr-code {
            display: block !important;
            visibility: visible !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .footer-qr-code img,
          div.footer-qr-code img,
          img[alt="Footer QR Code"],
          .text-center img[alt="Footer QR Code"] {
            display: block !important;
            visibility: visible !important;
            width: 60px !important;
            height: 60px !important;
            max-height: 60px !important;
            max-width: 60px !important;
            min-height: 60px !important;
            min-width: 60px !important;
            margin: 3px auto !important;
            padding: 3px !important;
            background: white !important;
            opacity: 1 !important;
          }
          .pt-3 {
            padding-top: 1px !important;
          }
          .row {
            margin: 0 !important;
          }
          .col-md-6, .col-md-8, .col-md-4, .col-md-10, .col-md-2 {
            padding: 0 3px !important;
          }
          .col-md-8 {
            width: 66% !important;
            float: left !important;
            display: inline-block !important;
          }
          .col-md-4 {
            width: 33% !important;
            float: left !important;
            display: inline-block !important;
            position: relative;
            left: 10px;
            top: 10px;
          }
          .col-md-4 {
          }
          .col-md-6 {
            width: 50% !important;
            float: left !important;
            display: inline-block !important;
          }
          .col-md-10 {
            width: 83% !important;
            float: left !important;
            display: inline-block !important;
          }
          .col-md-2 {
            width: 17% !important;
            float: left !important;
            display: inline-block !important;
          }
          .container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .px-3, .px-lg-4 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .mt-3 {
            margin-top: 0 !important;
          }
          .text-end .info-value {
            font-size: 12px !important;
          }
          small {
            font-size: 5px !important;
          }
          /* Make QR codes same size in print */
          img[alt="QR Code"],
          img.middle-qr-code {
            width: 100px !important;
            height: 100px !important;
            max-height: 80px !important;
            max-width: 80px !important;
            padding: 3px !important;
            background: white !important;
          }
          /* Reduce header padding significantly */
          .text-center.mb-4 {
            padding: 10px 8px !important;
            margin-bottom: 5px !important;
          }
          /* Hide footer QR code to save space */
          .text-center.pt-3 {
            display: none !important;
          }
          /* Compact rules section */
          .small {
            font-size: 5px !important;
            line-height: 1.2 !important;
          }
          p {
            margin: 1px 0 !important;
            font-size: 10px !important;
          }
          strong {
            font-size: 10px !important;
          }
          /* Compact flight tables */
          .row.mb-4 {
            margin-bottom: 3px !important;
          }
          /* Make logo smaller */
          .text-center.mb-4 img {
            max-height: 20px !important;
          }
          /* Fix booking information header */
          .row.mb-4 {
            padding: 8px !important;
          }
          .col-md-8 .info-value {
            font-size: 12px !important;
          }
          .col-md-8 .info-label {
            font-size: 12px !important;
          }
          .col-md-4 .info-value {
            font-size: 12px !important;
          }
          .col-md-4 .info-label {
            font-size: 12px !important;
            font-weight: 600 !important;
          }
          /* Agency logo in header - specific selector */
          .col-md-8 img[alt="Agency Logo"],
          .col-md-8 img[alt="Default Logo"] {
            height: 100px !important;
            width: 100px !important;
            max-height: 100px !important;
            max-width: 100px !important;
            object-fit: contain !important;
            padding: 3px !important;
          }
          /* Keep logo and text inline */
          .col-md-8.d-flex {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            page-break-inside: avoid !important;
          }
          .gap-3 {
            gap: 5px !important;
          }
          /* Ensure booking info section stays together */
          .row.mb-4 .col-md-8,
          .row.mb-4 .col-md-4 {
            page-break-inside: avoid !important;
            display: inline-block !important;
            vertical-align: top !important;
          }
          /* FOOTER QR CODE - MUST BE LAST TO OVERRIDE ALL OTHER IMG RULES */
          div.text-center.footer-qr-section img[alt="Footer QR Code"],
          .footer-qr-section img[alt="Footer QR Code"],
          img.footer-qr-code-img,
          img[alt="Footer QR Code"] {
            display: block !important;
            visibility: visible !important;
            width: 100px !important;
            height: 100px !important;
            max-height: 100px !important;
            max-width: 100px !important;
            min-height: 100px !important;
            min-width: 50px !important;
            margin: 3px auto !important;
            padding: 3px !important;
            background: white !important;
            opacity: 1 !important;
          }
          .footer-qr-section {
            display: block !important;
            margin-top: 3px !important;
            padding-top: 3px !important;
            page-break-inside: avoid !important;
          }
          /* Force Notes and Rules to second page */
          .page-break-section {
            page-break-before: always !important;
          }
        }
        /* Apply print styles when print-mode class is active */
        body.print-mode .no-print { display: none !important; }
        body.print-mode .voucher-content {
          page-break-inside: avoid !important;
          max-width: 90% !important;
          margin: 15px 0 0 0 !important;
          position: relative !important;
          left: 35px;
        }
        .voucher-table-header {
          background: #EAF2FF !important;
          color: #000 !important;
          font-weight: 600;
          font-size: 13px;
          padding: 10px 8px;
          border-left: none !important;
          border-right: none !important;
          border-top: none !important;
          border-bottom: 1px solid #dee2e6 !important;
          text-align: center !important;
        }
        /* Add border radius to first header row */
        .voucher-table thead tr:first-child th:first-child {
          border-top-left-radius: 8px !important;
        }
        .voucher-table thead tr:first-child th:last-child {
          border-top-right-radius: 8px !important;
        }
        .voucher-table {
          border-left: none !important;
          border-right: none !important;
          border-top: none;
          border-bottom: 1px solid #dee2e6;
          font-size: 13px;
        }
        .voucher-table td, .voucher-table th {
          padding: 8px;
          border-left: none !important;
          border-right: none !important;
          border-top: none !important;
          border-bottom: 1px solid #dee2e6;
        }
        .section-title {
          padding: 10px 15px;
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 15px;
        }
        .info-label {
          color: #666;
          font-weight: 500;
          font-size: 12px;
        }
        .info-value {
          color: #000;
          font-weight: 600;
          font-size: 13px;
        }
        .row.mb-4{
        position: relative;
        bottom: 35px;
        }
        /* Flight table vertical separator - must be more specific than .voucher-table td/th */
        .voucher-table .flight-separator-border,
        .voucher-table td.flight-separator-border,
        .voucher-table th.flight-separator-border {
          border-right: 2px solid #dee2e6 !important;
        }
        .text-center h5 {
  font-size: 14px !important;
}
      `}</style>

      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2 no-print">
          <AgentSidebar />
        </div>

        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <div className="no-print">
              <AgentHeader />
            </div>

            <div className="px-3 mt-3 px-lg-4">
              {/* Action Buttons */}
              <div className="p-2 no-print">
                <div className="row">
                  <div className="col-md-12 d-flex justify-content-between">
                    <div>
                      <Link to="/booking-history">
                        <ArrowLeft size={"30px"} />
                      </Link>
                      <strong>Order Number: {booking.booking_number}</strong>
                    </div>
                    <div>
                      <button id="btn" className="btn me-1" onClick={() => window.print()}>Print</button>
                      <button id="btn" className="btn me-1">Edit</button>
                      <button id="btn" className="btn" onClick={() => window.print()}>Download PDF</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Public Link */}
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

              {/* Voucher Content */}
              <div className="bg-white p-4 voucher-content" style={{ maxWidth: "1000px", margin: "0 auto" }}>
                {/* Combined Header and Booking Information */}
                <div className="mb-4" style={{ background: "#F8F9FA", padding: "20px", borderRadius: "8px" }}>
                  {/* Logo and Company Name */}
                  <div className="text-center mb-3">
                    <div style={{ background: "white", display: "inline-block", padding: "15px 40px", borderRadius: "8px", marginBottom: "10px" }}>
                      <img src={booking.organization?.logo || logo} alt="Organization Logo" style={{ height: "30px", width: "auto" }} />
                    </div>
                    <div style={{ color: "#000" }}>
                      <h6 style={{ fontSize: "9px", fontWeight: "400", marginBottom: "3px", opacity: "0.8" }}>POWERED BY</h6>
                      <h5 style={{ fontSize: "17px", fontWeight: "600", margin: "0" }}>{booking.organization?.name || "SAER KARO TRAVEL AND TOURS"}</h5>
                      {booking.organization?.type && (
                        <p style={{ fontSize: "10px", margin: "0", opacity: "0.7", position: "relative", left: "70px" }}>({booking.organization.type})</p>
                      )}
                    </div>
                  </div>

                  {/* Booking Information */}
                  <div className="row">
                    <div className="col-md-8 d-flex align-items-start gap-3">
                      {booking.agency?.logo ? (
                        <img src={booking.agency.logo} alt="Agency Logo" style={{ height: "80px", width: "80px", objectFit: "contain", borderRadius: "6px", padding: "5px", background: "white" }} />
                      ) : (
                        <img src={travel} alt="Default Logo" style={{ height: "80px", width: "80px", objectFit: "contain" }} />
                      )}
                      <div>
                        <div className="mb-2">
                          <span className="info-value" style={{ fontSize: "16px", color: "#000", fontWeight: "600" }}>{booking.agency?.ageny_name || booking.agency?.name || "B2 World Travel And Tours"}</span>
                        </div>
                        <div className="mb-1">
                          <span className="info-label">Voucher Date:</span> <span className="info-value">{formatDate(booking.date)}</span>
                        </div>
                        <div className="mb-1">
                          <span className="info-label">Booking Number:</span> <span className="info-value" style={{ color: "#4A90E2" }}>{booking.booking_number}</span>
                        </div>
                        <div>
                          <span className="info-label">Package:</span> <span className="info-value">{booking.umrah_package?.title || ""}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-1">
                        <span className="info-label" >Shirka:</span> <span className="info-value">شركة سهولة السفر لخدمات المعتمرين شخص واحد</span>
                      </div>
                      <div className="mb-1">
                        <span className="info-label">Address:</span> <span className="info-value">{booking.agency?.address || ""}</span>
                      </div>
                      <div className="mb-1">
                        <span className="info-label">Helpline Number:</span> <span className="info-value">{booking.agency?.phone_number || "+92 316 6615 6363"}</span>
                      </div>
                      <div>
                        <span className="info-label">Voucher Status:</span> <span className="info-value" style={{ color: booking.status === "Approved" ? "#10B981" : "#F59E0B" }}>{booking.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Members (Passengers) Section */}
                <div className="mb-4">
                  <div className="section-title">Members</div>
                  <div className="table-responsive">
                    <table className="table voucher-table table-sm align-middle mb-0">
                      <thead>
                        <tr>
                          <th colSpan="10" style={{ background: "#EAF2FF", padding: "8px 12px", fontSize: "13px", textAlign: "right", borderBottom: "1px solid #dee2e6", borderTop: "none", borderLeft: "none", borderRight: "none" }}>
                            <span style={{ color: "#666", fontWeight: "500" }}>Family Head:</span> <span style={{ color: "#000", fontWeight: "600" }}>{booking.person_details && booking.person_details.length > 0 ? `${booking.person_details[0].first_name} ${booking.person_details[0].last_name}` : "HAMZA JUTT"}</span>
                          </th>
                        </tr>
                        <tr className="text-center">
                          <th className="voucher-table-header">SNO</th>
                          <th className="voucher-table-header">Passport No.</th>
                          <th className="voucher-table-header">Mutamer Name</th>
                          <th className="voucher-table-header">G</th>
                          <th className="voucher-table-header">PAX</th>
                          <th className="voucher-table-header">MOFA#</th>
                          <th className="voucher-table-header">GRP#</th>
                          <th className="voucher-table-header">VISA#</th>
                          <th className="voucher-table-header">PNR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.person_details && booking.person_details.length > 0 ? (
                          booking.person_details.map((passenger, index) => (
                            <tr key={index}>
                              <td className="text-center">{index + 1}</td>
                              <td className="text-center">{passenger.passport_number || ""}</td>
                              <td className="text-center">{`${passenger.first_name || ""} ${passenger.last_name || ""}`.trim() || ""}</td>
                              <td className="text-center">{passenger.person_title === "MR" ? "M" : (passenger.person_title === "MRS" || passenger.person_title === "MS" || passenger.person_title === "MISS" || passenger.person_title === "MSTR") ? "F" : (passenger.gender === "Male" ? "M" : passenger.gender === "Female" ? "F" : "")}</td>
                              <td className="text-center">{passenger.age_group || "Adult"}</td>
                              <td className="text-center">{passenger.mofa_number || ""}</td>
                              <td className="text-center">{passenger.grp_number || ""}</td>
                              <td className="text-center">{passenger.visa_status || ""}</td>
                              <td className="text-center">{booking.ticket_details?.[0]?.pnr || ""}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center text-muted py-3">No passenger details available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Accommodation Section */}
                <div className="mb-4">
                  <div className="section-title">Accommodation</div>
                  <div className="table-responsive">
                    <table className="table voucher-table table-sm align-middle mb-0">
                      <thead>
                        <tr className="text-center">
                          <th className="voucher-table-header">City</th>
                          <th className="voucher-table-header">Hotel Name</th>
                          <th className="voucher-table-header">Voucher No.</th>
                          <th className="voucher-table-header">View</th>
                          <th className="voucher-table-header">Meal</th>
                          <th className="voucher-table-header">Conf#</th>
                          <th className="voucher-table-header">Room Type</th>
                          <th className="voucher-table-header">Checkin</th>
                          <th className="voucher-table-header">Checkout</th>
                          <th className="voucher-table-header">Nights</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.hotel_details && booking.hotel_details.length > 0 ? (
                          booking.hotel_details.map((hotel, index) => (
                            <tr key={index}>
                              <td className="text-center">{hotel.city_name || ""}</td>
                              <td className="text-center">{hotel.hotel_name || hotel.self_hotel_name || ""}</td>
                              <td className="text-center">{hotel.voucher_number || ""}</td>
                              <td className="text-center">{hotel.view || ""}</td>
                              <td className="text-center">{hotel.meal || "B&B"}</td>
                              <td className="text-center">{hotel.confirmation_number || ""}</td>
                              <td className="text-center">{hotel.room_type || hotel.sharing_type || ""}</td>
                              <td className="text-center">{formatDate(hotel.check_in_date)}</td>
                              <td className="text-center">{formatDate(hotel.check_out_date)}</td>
                              <td className="text-center">{hotel.number_of_nights || 0}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center text-muted py-3">No accommodation details available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-end mt-2">
                    <span className="info-value">Total Nights: {booking.hotel_details ? booking.hotel_details.reduce((sum, hotel) => sum + (hotel.number_of_nights || 0), 0) : 20}</span>
                  </div>
                </div>


                {/* Food Details Section - Only show if food_details exist */}
                {booking.food_details && booking.food_details.length > 0 && (
                  <div className="mb-4">
                    <div className="section-title">Food Details</div>
                    <div className="table-responsive">
                      <table className="table voucher-table table-sm align-middle mb-0">
                        <thead>
                          <tr className="text-center">
                            <th className="voucher-table-header">Food Type</th>
                            <th className="voucher-table-header">Adults</th>
                            <th className="voucher-table-header">Children</th>
                            <th className="voucher-table-header">Infants</th>
                          </tr>
                        </thead>
                        <tbody>
                          {booking.food_details.map((food, index) => (
                            <tr key={index}>
                              <td className="text-center">{food.food || ""}</td>
                              <td className="text-center">{food.total_adults || 0}</td>
                              <td className="text-center">{food.total_children || 0}</td>
                              <td className="text-center">{food.total_infants || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Ziyarat Details Section - Only show if ziyarat_details exist */}
                {booking.ziyarat_details && booking.ziyarat_details.length > 0 && (
                  <div className="mb-4">
                    <div className="section-title">Ziyarat Details</div>
                    <div className="table-responsive">
                      <table className="table voucher-table table-sm align-middle mb-0">
                        <thead>
                          <tr className="text-center">
                            <th className="voucher-table-header">Ziyarat Name</th>
                            <th className="voucher-table-header">City</th>
                            <th className="voucher-table-header">Date</th>
                            <th className="voucher-table-header">Adults</th>
                            <th className="voucher-table-header">Children</th>
                          </tr>
                        </thead>
                        <tbody>
                          {booking.ziyarat_details.map((ziyarat, index) => (
                            <tr key={index}>
                              <td className="text-center">{ziyarat.ziarat && ziyarat.ziarat.trim() !== "" ? ziyarat.ziarat : (ziyarat.ziyarat_name || `Ziyarat (City: ${ziyarat.city || 'N/A'})`)}</td>
                              <td className="text-center">{ziyarat.city || ""}</td>
                              <td className="text-center">{formatDate(ziyarat.date) === "" ? "DNS" : formatDate(ziyarat.date)}</td>
                              <td className="text-center">{ziyarat.total_adults || 0}</td>
                              <td className="text-center">{ziyarat.total_children || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Transport/Services Section */}
                <div className="mb-4">
                  <div className="section-title">Transport / Services</div>
                  <div className="row">
                    <div className="col-md-10">
                      <table className="table voucher-table table-sm align-middle mb-0">
                        <thead>
                          <tr className="text-center">
                            <th className="voucher-table-header">Voucher No.</th>
                            <th className="voucher-table-header">Transporter</th>
                            <th className="voucher-table-header">Type</th>
                            <th className="voucher-table-header">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {booking.transport_details && booking.transport_details.length > 0 ? (
                            booking.transport_details.map((transport, index) => (
                              <tr key={index}>
                                <td className="text-center">{transport.voucher_number || "90063523"}</td>
                                <td className="text-center">{transport.transporter_name || "Company Transport"}</td>
                                <td className="text-center">{transport.vehicle_name || "Economy By Car"}</td>
                                <td>{transport.vehicle_description || "Round Trip (Jed-Mak-Mad-Mak-Jed)"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center text-muted py-3">No transport details available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-2 text-center d-flex align-items-center justify-content-center">
                      <div>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/public-voucher/${booking.booking_number}?ref=${booking.public_ref}`)}`}
                          alt="QR Code"
                          className="middle-qr-code"
                          style={{ width: "100px", height: "100px", padding: "5px", background: "white" }}
                          onError={(e) => {
                            console.error("QR Code failed to load:", e.target.src);
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => console.log("QR Code loaded successfully")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flight Information - Merged Table */}
                <div className="mb-4">
                  <table className="table voucher-table table-sm align-middle mb-0">
                    <thead>
                      <tr className="text-center">
                        <th colSpan="4" style={{ background: "transparent", padding: "10px 15px", fontWeight: "600", fontSize: "16px", borderBottom: "1px solid #dee2e6" }}>Departure-Pakistan To KSA</th>
                        <th colSpan="4" style={{ background: "transparent", padding: "10px 15px", fontWeight: "600", fontSize: "16px", borderBottom: "1px solid #dee2e6" }}>Arrival-KSA To Pakistan</th>
                      </tr>
                      <tr className="text-center" >
                        <th className="voucher-table-header">Flight</th>
                        <th className="voucher-table-header">Sector</th>
                        <th className="voucher-table-header">Departure</th>
                        <th className="voucher-table-header flight-separator-border">Arrival</th>
                        <th className="voucher-table-header">Flight</th>
                        <th className="voucher-table-header">Sector</th>
                        <th className="voucher-table-header">Departure</th>
                        <th className="voucher-table-header">Arrival</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const departureFlights = booking.ticket_details && booking.ticket_details.length > 0 && booking.ticket_details[0].trip_details
                          ? booking.ticket_details[0].trip_details.filter(trip => trip.trip_type === 'departure' || trip.trip_type === 'Departure')
                          : [];
                        const returnFlights = booking.ticket_details && booking.ticket_details.length > 0 && booking.ticket_details[0].trip_details
                          ? booking.ticket_details[0].trip_details.filter(trip => trip.trip_type === 'return' || trip.trip_type === 'Return')
                          : [];
                        const maxRows = Math.max(departureFlights.length, returnFlights.length, 1);

                        return Array.from({ length: maxRows }).map((_, index) => {
                          const depFlight = departureFlights[index];
                          const retFlight = returnFlights[index];

                          return (
                            <tr key={index}>
                              {depFlight ? (
                                <>
                                  <td className="text-center">{depFlight.airline_code ? `${depFlight.airline_code}-${depFlight.flight_number || ""}` : (depFlight.flight_number || "")}</td>
                                  <td className="text-center">{`${depFlight.departure_city_code || depFlight.departure_city || ""}-${depFlight.arrival_city_code || depFlight.arrival_city || ""}`}</td>
                                  <td className="text-center">{formatDateTime(depFlight.departure_date_time)}</td>
                                  <td className="text-center flight-separator-border">{formatDateTime(depFlight.arrival_date_time)}</td>
                                </>
                              ) : (
                                <>
                                  <td className="text-center text-muted">-</td>
                                  <td className="text-center text-muted">-</td>
                                  <td className="text-center text-muted">-</td>
                                  <td className="text-center text-muted flight-separator-border">-</td>
                                </>
                              )}
                              {retFlight ? (
                                <>
                                  <td className="text-center">{retFlight.airline_code ? `${retFlight.airline_code}-${retFlight.flight_number || ""}` : (retFlight.flight_number || "")}</td>
                                  <td className="text-center">{`${retFlight.departure_city_code || retFlight.departure_city || ""}-${retFlight.arrival_city_code || retFlight.arrival_city || ""}`}</td>
                                  <td className="text-center">{formatDateTime(retFlight.departure_date_time)}</td>
                                  <td className="text-center">{formatDateTime(retFlight.arrival_date_time)}</td>
                                </>
                              ) : (
                                <>
                                  <td className="text-center text-muted">-</td>
                                  <td className="text-center text-muted">-</td>
                                  <td className="text-center text-muted">-</td>
                                  <td className="text-center text-muted">-</td>
                                </>
                              )}
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Notes Section */}
                <div className="mb-4 page-break-section">
                  <div className="notes-title"><span>Notes:</span>PLEASE ACCOMMODATE WITH PRIORITY</div>
                  <div className="p-3" style={{ borderLeft: "2px solid #dee2e6", fontSize: "12px", lineHeight: "1.6", margin: "10px" }}>
                    {/* Hotel Info */}
                    {booking.hotel_details && booking.hotel_details.filter(h => h.city_name?.toLowerCase().includes('makkah') || h.city_name?.toLowerCase().includes('mecca')).length > 0 && (
                      <p className="mb-2">
                        <strong>Makkah Hotel:</strong>{" "}
                        {booking.hotel_details
                          .filter(h => h.city_name?.toLowerCase().includes('makkah') || h.city_name?.toLowerCase().includes('mecca'))
                          .map((h, i) => `${h.hotel_name || h.self_hotel_name} (${h.number_of_nights} nights)`)
                          .join(", ")}
                      </p>
                    )}
                    {booking.hotel_details && booking.hotel_details.filter(h => h.city_name?.toLowerCase().includes('madina') || h.city_name?.toLowerCase().includes('medina')).length > 0 && (
                      <p className="mb-2">
                        <strong>Madina Hotel:</strong>{" "}
                        {booking.hotel_details
                          .filter(h => h.city_name?.toLowerCase().includes('madina') || h.city_name?.toLowerCase().includes('medina'))
                          .map((h, i) => `${h.hotel_name || h.self_hotel_name} (${h.number_of_nights} nights)`)
                          .join(", ")}
                      </p>
                    )}
                    {booking.transport_details && booking.transport_details.length > 0 && (
                      <p className="mb-0">
                        <strong>Transport:</strong>{" "}
                        {booking.transport_details.map((t, i) => t.vehicle_name || "Transport Service").join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rules Section */}
                <div className="mb-4">
                  <div className="section-title">Rules</div>
                  <div style={{ fontSize: "11px", lineHeight: "1.7" }}>
                    <p className="mb-2"><strong>1. Booking Confirmation:</strong> This voucher serves as proof of hotel booking and must be presented at check-in.</p>
                    <p className="mb-2"><strong>2. Check-in & Check-out:</strong> Standard check-in time is 3:00 PM and check-out time is 12:00 PM. Early check-in or late check-out is subject to hotel policy and availability.</p>
                    <p className="mb-2"><strong>3. Identification Requirement:</strong> Guests must present a valid passport, visa, and this voucher upon arrival.</p>
                    <p className="mb-2"><strong>4. Non-Transferable:</strong> This voucher is non-transferable and can only be used by the individual(s) named on the booking.</p>
                    <p className="mb-2"><strong>5. No Show & Late Arrival:</strong> Failure to check-in on the specified date without prior notice may result in cancellation without refund.</p>
                    <p className="mb-0"><strong>6. Amendments & Cancellations:</strong> Any changes or cancellations must be made through the travel agency and are subject to the agency and hotel's policies.</p>
                  </div>
                </div>

                {/* Footer QR Code - Compact */}
                <div className="text-center footer-qr-section" style={{ marginTop: "10px", paddingTop: "10px" }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/public-voucher/${booking.booking_number}?ref=${booking.public_ref}`)}`}
                    alt="Footer QR Code"
                    className="footer-qr-code-img"
                    style={{ width: "100px", height: "100px", padding: "5px", background: "white" }}
                    onLoad={() => console.log("Footer QR Code loaded")}
                  />
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
