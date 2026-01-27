import React, { useState, useEffect } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import BookingExpiryTimer from "../../components/BookingExpiryTimer";
import logo from "../../assets/flightlogo.png";
import { Bag } from "react-bootstrap-icons";
import { Search, Utensils } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const AgentPackagesPay = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [selectedPayment, setSelectedPayment] = useState("bank-transfer");
  const [bookingId, setBookingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingExpiryTime, setBookingExpiryTime] = useState(null);
  const [isBookingExpired, setIsBookingExpired] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  // Discount states
  const [discountGroup, setDiscountGroup] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [computedTotal, setComputedTotal] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  // Load booking ID from URL params, location state, or sessionStorage
  useEffect(() => {
    // Try to get from query parameter first (?bookingId=343)
    const searchParams = new URLSearchParams(location.search);
    const queryBookingId = searchParams.get('bookingId');

    if (queryBookingId) {
      setBookingId(queryBookingId);
    } else if (id) {
      setBookingId(id);
    } else if (location.state?.bookingId) {
      setBookingId(location.state.bookingId);
    } else {
      const storedId = sessionStorage.getItem('last_booking_id');
      if (storedId) {
        setBookingId(storedId);
      }
    }
  }, [id, location.state, location.search]);

  // Fetch booking details including expiry time and discount group
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) return;
      try {
        const token = localStorage.getItem('agentAccessToken');
        const response = await axios.get(
          `http://127.0.0.1:8000/api/bookings/${bookingId}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data) {
          setBookingData(response.data);

          // Set computed total from booking
          if (response.data.total_amount) {
            setComputedTotal(response.data.total_amount);
          }

          if (response.data.status?.toLowerCase() === 'expired') {
            setIsBookingExpired(true);
            return;
          }
          if (response.data.expiry_time) {
            const expiryTime = new Date(response.data.expiry_time);
            if (expiryTime < new Date()) {
              setIsBookingExpired(true);
            } else {
              setBookingExpiryTime(response.data.expiry_time);
            }
          }

          // Fetch discount group if agency has one
          if (response.data.agency && response.data.agency.discount_group) {
            fetchDiscountGroup(response.data.agency.discount_group);
          }
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
      }
    };
    fetchBookingDetails();
  }, [bookingId]);

  // Fetch discount group details
  const fetchDiscountGroup = async (discountGroupId) => {
    try {
      const token = localStorage.getItem('agentAccessToken');
      const response = await axios.get(
        `http://127.0.0.1:8000/api/discount-groups/${discountGroupId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data) {
        setDiscountGroup(response.data);
        console.log('Discount group fetched:', response.data);
      }
    } catch (error) {
      console.error('Error fetching discount group:', error);
    }
  };

  // Calculate discount when discount group or booking data changes
  useEffect(() => {
    if (discountGroup && bookingData) {
      // For Umrah Packages, use umrah_package_discount_amount field
      const perPersonDiscount = parseFloat(discountGroup.discounts?.umrah_package_discount_amount) || 0;
      const totalPassengers = bookingData.total_pax || 0;
      const calculatedDiscount = perPersonDiscount * totalPassengers;

      setDiscountAmount(calculatedDiscount);
      setFinalAmount(computedTotal - calculatedDiscount);

      console.log(`Umrah Discount: ${perPersonDiscount} × ${totalPassengers} = ${calculatedDiscount}`);
    } else {
      setDiscountAmount(0);
      setFinalAmount(computedTotal);
    }
  }, [discountGroup, bookingData, computedTotal]);

  const handlePaymentSelect = (method) => {
    setSelectedPayment(method);
  };

  const [formData, setFormData] = useState({
    beneficiaryAccount: '0ufgkJHG',
    agentAccount: '1Bill',
    amount: 'Rs.120,222/',
    date: '2023-12-01',
    note: ''
  });

  // Helper to format transport route
  const getTransportRouteDisplay = (transportDetails) => {
    if (!transportDetails || transportDetails.length === 0) return "N/A";
    const transport = transportDetails[0];
    const transportInfo = transport.transport_sector_info || transport.transport_sector;
    if (!transportInfo) return "N/A";

    // Handle Big Sector (Chain of cities)
    if (transportInfo.big_sector) {
      const smalls = transportInfo.big_sector.small_sectors || [];
      if (smalls.length > 0) {
        const cities = [smalls[0].departure_city];
        smalls.forEach(s => cities.push(s.arrival_city));
        return cities.join(" ➔ ");
      }
      return transportInfo.big_sector.name || `Region #${transportInfo.big_sector.id}`;
    }

    // Handle Small Sector
    if (transportInfo.small_sector) {
      return `${transportInfo.small_sector.departure_city} ➔ ${transportInfo.small_sector.arrival_city}`;
    }

    // Fallback - use vehicle_name or type if specific route name unavailable
    return transportInfo.vehicle_name || transportInfo.vehicle_type || transportInfo.name || "N/A";
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSlipSelect = () => {
    // console.log('SLIP SELECT clicked');
    // Add your slip select logic here
  };

  const handleConfirmOrder = async () => {
    if (!bookingId) {
      toast.error('No booking ID found. Please create a booking first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('agentAccessToken');
      if (!token) {
        toast.error('Authentication required. Please login again.');
        return;
      }

      // Build discount fields if discount is applied
      const discountFields = {};
      if (discountAmount > 0 && discountGroup) {
        const perPersonDiscount = parseFloat(discountGroup.discounts?.umrah_package_discount_amount) || 0;
        const totalPax = bookingData?.total_pax || 0;

        discountFields.total_discount = discountAmount;
        discountFields.discount_group = discountGroup.id;
        discountFields.discount_notes = `${discountGroup.name} - Umrah Package Discount - ${totalPax} passengers × Rs. ${perPersonDiscount} = Rs. ${discountAmount}`;
        discountFields.total_amount = finalAmount;
        discountFields.total_ticket_amount = finalAmount;
      }

      // CREDIT PAYMENT FLOW
      if (selectedPayment === 'credit') {
        console.log('💳 Processing credit payment with discount...');

        const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        const patchBody = {
          status: 'Confirmed',
          payment_method: 'credit',
          is_paid: true,
          ...discountFields // Include discount fields
        };

        console.log('PATCH body:', patchBody);
        await axios.patch(`http://127.0.0.1:8000/api/bookings/${bookingId}/`, patchBody, { headers });
        console.log('✅ Booking confirmed with credit payment and discount');

        toast.success('Booking confirmed successfully with credit payment!');
        navigate('/booking-history');
        return;
      }

      // REGULAR PAYMENT FLOW (Bank Transfer, Cash, Cheque)
      const patchBody = {
        status: 'Confirmed',
        ...discountFields // Include discount fields
      };

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/bookings/${bookingId}/`,
        patchBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Booking confirmed successfully!');
      navigate('/booking-history');
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

                    {/* Line 2 (active) */}
                    <div
                      className="flex-grow-1"
                      style={{ height: "2px", backgroundColor: "#0d6efd" }}
                    ></div>

                    {/* Step 3 (still upcoming) */}
                    <div className="d-flex align-items-center">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "30px",
                          height: "30px",
                          fontSize: "14px",
                        }}
                      >
                        3
                      </div>
                      <span className="ms-2 text-primary fw-bold">Payment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Expiry Timer */}
              {bookingExpiryTime && !isBookingExpired && (
                <BookingExpiryTimer
                  expiryTime={bookingExpiryTime}
                  onExpired={() => setIsBookingExpired(true)}
                />
              )}

              {/* Booking Expired Message */}
              {isBookingExpired && (
                <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                  <div>
                    <h5 className="alert-heading mb-2">⏰ Booking Expired!</h5>
                    <p className="mb-0">This booking has expired. Please create a new booking.</p>
                    <button
                      className="btn btn-primary mt-3"
                      onClick={() => navigate('/booking-history')}
                    >
                      Go to Booking History
                    </button>
                  </div>
                </div>
              )}

              {/* Payment form - hidden when expired */}
              <div style={{ display: isBookingExpired ? 'none' : 'block' }}>

                {/* Package Details Card */}
                <div className="card mb-4">
                  <div className="card-body" style={{ background: "#F2F9FF" }}>
                    <div className="row">
                      <div className="col-md-8">
                        <h4 className="mb-3 fw-bold">Umrah Package</h4>
                        <div className="mb-2">
                          <strong>Hotels:</strong>
                          <div className="small text-muted">
                            {bookingData?.hotel_details?.map((hotel, i) => {
                              const cityName = hotel.hotel_info?.city_name || hotel.hotel?.city_name || hotel.hotel_info?.city || hotel.hotel?.city || "N/A";
                              const hotelName = hotel.hotel_info?.name || hotel.hotel?.name || "N/A";
                              return `${hotel.number_of_nights} Nights at ${cityName} (${hotelName})`;
                            }).join(" / ") || "N/A"}
                          </div>
                        </div>
                        <div className="mb-2">
                          <strong>Passengers:</strong>
                          <div className="small text-muted">
                            {bookingData?.total_adult} Adult - {bookingData?.total_child} Child - {bookingData?.total_infant} Infant
                          </div>
                        </div>
                        <div className="mb-2">
                          <strong>Transport:</strong>
                          <div className="small text-muted">
                            {getTransportRouteDisplay(bookingData?.transport_details)}
                          </div>
                        </div>
                        <div className="mb-2">
                          <strong>Flight:</strong>
                          <div className="small text-muted">
                            {bookingData?.ticket_details?.[0]?.trip_details?.[0]?.departure_date_time ? (
                              <>
                                Travel Date: {formatDateTime(bookingData.ticket_details[0].trip_details[0].departure_date_time)}
                                {bookingData.ticket_details[0].trip_details[1] && (
                                  <> | Return Date: {formatDateTime(bookingData.ticket_details[0].trip_details[1].departure_date_time)}</>
                                )}
                              </>
                            ) : "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <h4 className="mb-3">Prices</h4>
                        <div className="mb-2">
                          <div className="small text-muted">Hotel Components</div>
                          <div className="small fw-semibold">
                            Rs. {bookingData?.total_hotel_amount?.toLocaleString()}
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="small text-muted">Transport</div>
                          <div className="small fw-semibold">
                            Rs. {bookingData?.total_transport_amount?.toLocaleString()}
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="small text-muted">Flight & Visa</div>
                          <div className="small fw-semibold">
                            Rs. {(bookingData?.total_ticket_amount + bookingData?.total_visa_amount)?.toLocaleString()}
                          </div>
                        </div>
                        {bookingData?.riyal_rate > 0 && (
                          <div className="mt-3">
                            <div className="text-muted small">CONVERSION RATE</div>
                            <div className="fw-bold">RS {bookingData.riyal_rate} = 1 SAR</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5">

                  {/* Payment Method Selection */}
                  <h5 className="mb-0 mt-5 fw-bold">Select Payment Method</h5>
                  <div className="card border-0">
                    <div className="card-body">
                      <div className="row g-3">
                        {/* Payment Options in One Row */}
                        <div className="col-md-3">
                          <div
                            className={`card h-100 ${selectedPayment === "bank-transfer"
                              ? "border-primary bg-primary text-white"
                              : "border-secondary"
                              }`}
                            style={{ cursor: "pointer" }}
                            onClick={() => handlePaymentSelect("bank-transfer")}
                          >
                            <div className="card-body text-center position-relative">
                              <div className="mb-2">
                                <i className="bi bi-bank2 fs-2"></i>
                                {selectedPayment === "bank-transfer" && (
                                  <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-2">
                                    <i className="bi bi-exclamation-triangle"></i>
                                  </span>
                                )}
                              </div>
                              <h6 className="card-title">Bank Transfer</h6>
                              <small>1 Bill - Bank Transfer</small>
                              <br />
                              <small>Save PKR 3,214 on Fees</small>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-3">
                          <div
                            className={`card h-100 ${selectedPayment === "bill-payment"
                              ? "border-primary bg-primary text-white"
                              : "border-secondary"
                              }`}
                            style={{ cursor: "pointer" }}
                            onClick={() => handlePaymentSelect("bill-payment")}
                          >
                            <div className="card-body text-center">
                              <div className="mb-2">
                                <i className="bi bi-receipt fs-2"></i>
                              </div>
                              <h6 className="card-title">Bill Payment</h6>
                              <small>1 Bill - Bank Transfer</small>
                              <br />
                              <small>Save PKR 3,214 on Fees</small>
                              <br />
                              <small className="text-muted">
                                Agreement Process
                              </small>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-3">
                          <div
                            className={`card h-100 ${selectedPayment === "card"
                              ? "border-primary bg-primary text-white"
                              : "border-secondary"
                              }`}
                            style={{ cursor: "pointer" }}
                            onClick={() => handlePaymentSelect("card")}
                          >
                            <div className="card-body text-center">
                              <div className="mb-2">
                                <i className="bi bi-credit-card fs-2"></i>
                              </div>
                              <h6 className="card-title">Credit or Debit Card</h6>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-3">
                          <div
                            className={`card h-100 ${selectedPayment === "credit"
                              ? "border-primary bg-primary text-white"
                              : "border-secondary"
                              }`}
                            style={{ cursor: "pointer" }}
                            onClick={() => handlePaymentSelect("credit")}
                          >
                            <div className="card-body text-center">
                              <div className="mb-2">
                                <i className="bi bi-credit-card-2-front fs-2"></i>
                              </div>
                              <h6 className="card-title">Pay with Credit</h6>
                              <small>Use agency credit limit</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Payment Section */}
                  <div className="card mt-5 mb-4 p-3">
                    <h5 className="mb-0 fw-bold">Total Payment</h5>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-6">
                          <div className=" fw-bold">Package Total</div>
                          <div>
                            {bookingData ? `${bookingData.total_pax} Pax` : 'Loading...'}
                            {bookingData?.total_ticket_amount > 0 && ` (Ticket Only: Rs. ${bookingData.total_ticket_amount.toLocaleString()})`}
                          </div>
                        </div>
                        <div className="col-6">
                          <div className=" fw-bold">Total Amount</div>
                          <div className="fw-bold fs-5 text-primary">Rs. {computedTotal?.toLocaleString() || '0'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment input fields - hide when credit is selected */}
                  {selectedPayment !== 'credit' && (
                    <>
                      <div className="row g-3">
                        {/* Beneficiary Account */}
                        <div className="col-lg-3 col-md-6">
                          <label className="form-label text-muted small mb-1">
                            Beneficiary Account
                          </label>
                          <select
                            className="form-select"
                            name="beneficiaryAccount"
                            value={formData.beneficiaryAccount}
                            onChange={handleInputChange}
                          >
                            <option value="0ufgkJHG">0ufgkJHG</option>
                            <option value="account2">Account 2</option>
                            <option value="account3">Account 3</option>
                          </select>
                        </div>

                        {/* Agent Account */}
                        <div className="col-lg-3 col-md-6">
                          <label className="form-label text-muted small mb-1">
                            Agent Account
                          </label>
                          <select
                            className="form-select"
                            name="agentAccount"
                            value={formData.agentAccount}
                            onChange={handleInputChange}
                          >
                            <option value="1Bill">1Bill</option>
                            <option value="2Bill">2Bill</option>
                            <option value="3Bill">3Bill</option>
                          </select>
                        </div>

                        {/* Amount */}
                        <div className="col-lg-3 col-md-6">
                          <label className="form-label text-muted small mb-1">
                            Amount
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            placeholder="Type Rs.120,222/."
                          />
                        </div>

                        {/* Date */}
                        <div className="col-lg-3 col-md-6">
                          <label className="form-label text-muted small mb-1">
                            Date
                          </label>
                          <div className="input-group">
                            <input
                              type="date"
                              className="form-control"
                              name="date"
                              value={formData.date}
                              onChange={handleInputChange}
                            />
                            <span className="input-group-text">
                              <i className="bi bi-calendar3"></i>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="row mt-3 mb-4">
                        {/* Note */}
                        <div className="col-lg-4 col-md-4">
                          <label className="form-label text-muted small mb-1">
                            Note
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="note"
                            value={formData.note}
                            onChange={handleInputChange}
                            placeholder="Type Note"
                          />
                        </div>

                        {/* SLIP SELECT Button */}
                        <div className="col-lg-2 col-md-2 d-flex align-items-end">
                          <button
                            type="button"
                            className="btn btn-primary px-4 py-2 fw-semibold"
                            onClick={handleSlipSelect}
                          >
                            SLIP SELECT
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Credit Payment Message */}
                  {selectedPayment === 'credit' && (
                    <div className="card border-info bg-light mt-4 mb-4">
                      <div className="card-body">
                        <h6 className="card-title text-info">
                          <i className="bi bi-credit-card-2-front me-2"></i>
                          💳 Credit Payment Selected
                        </h6>
                        <p className="card-text mb-0">
                          Your booking will be confirmed and the amount will be deducted from your agency's credit limit.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Discount Breakdown Display */}
                  {bookingData && (
                    <div className="card border-success bg-light mt-4 mb-4">
                      <div className="card-body">
                        <h6 className="card-title text-success mb-3">
                          💰 Payment Summary
                        </h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Original Amount:</span>
                          <span className="fw-semibold">Rs. {computedTotal?.toLocaleString() || '0'}</span>
                        </div>
                        {discountAmount > 0 && (
                          <>
                            <div className="d-flex justify-content-between mb-2 text-success">
                              <span>
                                Discount Applied ({discountGroup?.name || 'Agency Discount'}):
                              </span>
                              <span className="fw-semibold">- Rs. {discountAmount?.toLocaleString()}</span>
                            </div>
                            <hr className="my-2" />
                          </>
                        )}
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold">Total Amount to Pay:</span>
                          <span className="fw-bold text-primary fs-5">
                            Rs. {(discountAmount > 0 ? finalAmount : computedTotal)?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 d-flex justify-content-start gap-2">
                    <button id="btn" className="btn">
                      Hold Booking
                    </button>
                    <button
                      id="btn"
                      className="btn"
                      onClick={handleConfirmOrder}
                      disabled={isSubmitting || !bookingId}
                    >
                      {isSubmitting ? 'Confirming...' : 'Confirm Order'}
                    </button>
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

export default AgentPackagesPay;
