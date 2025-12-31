import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import logo from "../../assets/logo.png";
import travel from "../../assets/travel.png";
import codeImg from "../../assets/code.png";

const PublicHotelVoucher = () => {
    const { bookingNo } = useParams();
    const [searchParams] = useSearchParams();
    const ref = searchParams.get("ref");

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPublicBooking = async () => {
            try {
                const response = await axios.get(
                    `http://127.0.0.1:8000/api/public/booking-status/${bookingNo}/?ref=${ref}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
                setBooking(response.data);
            } catch (err) {
                console.error("Error fetching public booking:", err);
                setError(err.response?.data?.detail || err.message);
            } finally {
                setLoading(false);
            }
        };

        if (bookingNo && ref) {
            fetchPublicBooking();
        } else {
            setError("Invalid voucher link. Missing reference.");
            setLoading(false);
        }
    }, [bookingNo, ref]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">
                    <h4>Error Loading Voucher</h4>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!booking) return null;

    return (
        <div className="container-fluid p-0 bg-white">
            <div className="container py-4">
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
                                {booking.agency_info?.logo ? (
                                    <img src={`http://127.0.0.1:8000${booking.agency_info.logo}`} alt="Agency Logo" height={"120px"} style={{ objectFit: "contain" }} />
                                ) : (
                                    <img src={travel} alt="Default Logo" height={"120px"} />
                                )}
                                <div>
                                    <small>
                                        <strong style={{ fontSize: '1.2rem' }}>{booking.agency_info?.name || "Agency Name"}</strong>
                                    </small>
                                    <br />
                                    <small>
                                        <strong>Voucher Date:</strong> {formatDate(booking.creation_date)}
                                    </small>
                                    <br />
                                    <small>
                                        <strong>Package:</strong> {booking.umrah_package_info?.title || "N/A"}
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
                                        <strong>Total Pax:</strong> {booking.person_details?.length || 0}
                                    </small>
                                    <br />
                                    <small>
                                        <strong>Contact:</strong> {booking.agency_info?.phone_number || "Agency Phone"}
                                    </small>
                                    <br />
                                    <small>
                                        <strong>Voucher Status: </strong> <span className="badge bg-success">{booking.status}</span>
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Passenger Details Section */}
                    <div className="mb-4">
                        <h5 className="p-2 fw-bold mt-5 mb-3 bg-light border-start border-4 border-primary">Passenger Details</h5>
                        <div className="mb-2 text-end">
                            <small>
                                Family Head: <strong>{booking.person_details && booking.person_details.length > 0 ? `${booking.person_details[0].first_name} ${booking.person_details[0].last_name}` : "N/A"}</strong>
                            </small>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-bordered table-sm align-middle">
                                <thead style={{ background: "#EBEBEB" }}>
                                    <tr>
                                        <th className="text-center">S.No</th>
                                        <th>Passport No</th>
                                        <th>Mutamer Name</th>
                                        <th className="text-center">G</th>
                                        <th className="text-center">Pax Type</th>
                                        <th className="text-center">Passport No</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {booking.person_details?.map((mutamer, index) => (
                                        <tr key={index}>
                                            <td className="text-center">{index + 1}</td>
                                            <td>{mutamer.passport_number || "N/A"}</td>
                                            <td>{`${mutamer.person_title || ""} ${mutamer.first_name || ""} ${mutamer.last_name || ""}`.trim()}</td>
                                            <td className="text-center">{mutamer.gender || "M"}</td>
                                            <td className="text-center">{mutamer.age_group || "Adult"}</td>
                                            <td className="text-center">{mutamer.passport_number || "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Accommodation Section */}
                    <div className="mb-4">
                        <h5 className="p-2 fw-bold mt-4 mb-3 bg-light border-start border-4 border-primary">Accommodation</h5>
                        <div className="table-responsive">
                            <table className="table table-bordered table-sm">
                                <thead style={{ background: "#EBEBEB" }}>
                                    <tr>
                                        <th className="text-center">City</th>
                                        <th>Hotel Name</th>
                                        <th className="text-center">Room Type</th>
                                        <th className="text-center">Check-In</th>
                                        <th className="text-center">Check-Out</th>
                                        <th className="text-center">Nights</th>
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
                    </div>

                    {/* Food Details Section */}
                    <div className="mb-4">
                        <h5 className="p-2 fw-bold mt-4 mb-3 bg-light border-start border-4 border-primary">Food Details</h5>
                        <div className="table-responsive">
                            <table className="table table-bordered table-sm">
                                <thead style={{ background: "#EBEBEB" }}>
                                    <tr>
                                        <th>Food Type</th>
                                        <th className="text-center">Adults</th>
                                        <th className="text-center">Children</th>
                                        <th className="text-center">Infants</th>
                                        <th className="text-center">Amount (PKR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {booking.food_details && booking.food_details.length > 0 ? (
                                        booking.food_details.map((food, index) => (
                                            <tr key={index}>
                                                <td>{food.food}</td>
                                                <td className="text-center">{food.total_adults}</td>
                                                <td className="text-center">{food.total_children}</td>
                                                <td className="text-center">{food.total_infants}</td>
                                                <td className="text-center font-monospace">{food.total_price_pkr?.toLocaleString()}</td>
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
                            <strong>Total Food Amount: PKR {booking.total_food_amount_pkr?.toLocaleString() || 0}</strong>
                        </div>
                    </div>

                    {/* Ziyarat Details Section */}
                    <div className="mb-4">
                        <h5 className="p-2 fw-bold mt-4 mb-3 bg-light border-start border-4 border-primary">Ziyarat Details</h5>
                        <div className="table-responsive">
                            <table className="table table-bordered table-sm">
                                <thead style={{ background: "#EBEBEB" }}>
                                    <tr>
                                        <th>Ziyarat Name</th>
                                        <th className="text-center">City</th>
                                        <th className="text-center">Date</th>
                                        <th className="text-center">Adults</th>
                                        <th className="text-center">Children</th>
                                        <th className="text-center">Amount (PKR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {booking.ziyarat_details && booking.ziyarat_details.length > 0 ? (
                                        booking.ziyarat_details.map((ziyarat, index) => (
                                            <tr key={index}>
                                                <td>{ziyarat.ziarat}</td>
                                                <td className="text-center">{ziyarat.city}</td>
                                                <td className="text-center">{formatDate(ziyarat.date)}</td>
                                                <td className="text-center">{ziyarat.total_adults}</td>
                                                <td className="text-center">{ziyarat.total_children}</td>
                                                <td className="text-center font-monospace">{ziyarat.total_price_pkr?.toLocaleString()}</td>
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
                            <strong>Total Ziyarat Amount: PKR {booking.total_ziyarat_amount_pkr?.toLocaleString() || 0}</strong>
                        </div>
                    </div>

                    {/* Transport Section */}
                    <div className="mb-4">
                        <h5 className="p-2 fw-bold mt-4 mb-3 bg-light border-start border-4 border-primary">Transport / Services</h5>
                        <div className="row border border-black rounded g-0">
                            <div className="col-md-10 border-end border-black">
                                <div className="table-responsive">
                                    <table className="table table-sm border-0 mb-0">
                                        <thead style={{ background: "#EBEBEB" }}>
                                            <tr>
                                                <th className="text-center">Vehicle</th>
                                                <th>Description</th>
                                                <th className="text-center">Amount (PKR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {booking.transport_details && booking.transport_details.length > 0 ? (
                                                booking.transport_details.map((transport, index) => (
                                                    <tr key={index}>
                                                        <td className="text-center">{transport.vehicle_name || "N/A"}</td>
                                                        <td>{transport.vehicle_description || "Transport Service"}</td>
                                                        <td className="text-center font-monospace">{transport.price_in_pkr?.toLocaleString() || "0"}</td>
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
                            </div>
                            <div className="col-md-2 d-flex flex-column justify-content-center align-items-center p-3 border-start border-black">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/public-voucher/${booking.booking_number}?ref=${booking.public_ref}`)}`}
                                    alt="QR Code"
                                    style={{ width: "100px", height: "100px" }}
                                />
                                <div className="mt-1 text-center" style={{ fontSize: '10px' }}>Digital Voucher</div>
                            </div>
                        </div>
                    </div>

                    {/* Flight Information */}
                    <div className="row mb-4">
                        <div className="col-md-6 border-end">
                            <h5 className="fw-bold p-2 mb-2 bg-light">Departure Flights</h5>
                            <div className="table-responsive">
                                <table className="table table-bordered table-sm small">
                                    <thead style={{ background: "#EBEBEB" }}>
                                        <tr>
                                            <th className="text-center">Flight #</th>
                                            <th className="text-center">Sector</th>
                                            <th className="text-center">Departure</th>
                                            <th className="text-center">Arrival</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {booking.ticket_details && booking.ticket_details.length > 0 ? (
                                            booking.ticket_details.flatMap(ticket =>
                                                ticket.trip_details.filter(t => t.trip_type?.toLowerCase() === 'departure')
                                            ).map((trip, index) => (
                                                <tr key={index}>
                                                    <td className="text-center font-monospace">{trip.flight_number || "N/A"}</td>
                                                    <td className="text-center">{`${trip.departure_city || ""}-${trip.arrival_city || ""}`}</td>
                                                    <td className="text-center">{formatDate(trip.departure_date_time)}</td>
                                                    <td className="text-center">{formatDate(trip.arrival_date_time)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="4" className="text-center text-muted py-2">No departure details</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <h5 className="fw-bold p-2 mb-2 bg-light">Return Flights</h5>
                            <div className="table-responsive">
                                <table className="table table-bordered table-sm small">
                                    <thead style={{ background: "#EBEBEB" }}>
                                        <tr>
                                            <th className="text-center">Flight #</th>
                                            <th className="text-center">Sector</th>
                                            <th className="text-center">Departure</th>
                                            <th className="text-center">Arrival</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {booking.ticket_details && booking.ticket_details.length > 0 ? (
                                            booking.ticket_details.flatMap(ticket =>
                                                ticket.trip_details.filter(t => t.trip_type?.toLowerCase().includes('return'))
                                            ).map((trip, index) => (
                                                <tr key={index}>
                                                    <td className="text-center font-monospace">{trip.flight_number || "N/A"}</td>
                                                    <td className="text-center">{`${trip.departure_city || ""}-${trip.arrival_city || ""}`}</td>
                                                    <td className="text-center">{formatDate(trip.departure_date_time)}</td>
                                                    <td className="text-center">{formatDate(trip.arrival_date_time)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="4" className="text-center text-muted py-2">No return details</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="mb-4">
                        <h5 className="fw-bold p-2">Notes:</h5>
                        <div className="p-3 border rounded-2 border-black">
                            <p className="mb-2"><strong>{booking.client_note || "PLEASE ACCOMMODATE WITH PRIORITY"}</strong></p>
                            <div className="text-muted small">
                                {booking.hotel_details?.filter(h => h.city_name?.toLowerCase().includes('makkah')).map((h, i) => (
                                    <p key={i} className="mb-1"><strong>Makkah Hotel:</strong> {h.hotel_name || h.self_hotel_name} - {formatDate(h.check_in_date)} to {formatDate(h.check_out_date)} ({h.number_of_nights} nights)</p>
                                ))}
                                {booking.hotel_details?.filter(h => h.city_name?.toLowerCase().includes('madina')).map((h, i) => (
                                    <p key={i} className="mb-1"><strong>Madina Hotel:</strong> {h.hotel_name || h.self_hotel_name} - {formatDate(h.check_in_date)} to {formatDate(h.check_out_date)} ({h.number_of_nights} nights)</p>
                                ))}
                                {booking.transport_details?.map((t, i) => (
                                    <p key={i} className="mb-1"><strong>Transport:</strong> {t.vehicle_name} - PKR {t.price_in_pkr?.toLocaleString()}</p>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Rules Section */}
                    <div className="mb-4">
                        <h5 className="fw-bold p-2 bg-light">Rules</h5>
                        <div className="p-3 border rounded">
                            <p>1. Ensure all travel documents are valid for at least 6 months.</p>
                            <p>2. Report at the airport at least 4 hours before departure.</p>
                            <p>3. Accommodation and transport are as per confirmed booking details only.</p>
                            <p>4. In case of any issues, contact the agency lead provided above immediately.</p>
                        </div>
                    </div>

                    {/* Footer QR Code */}
                    <div className="text-center mt-4">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/public-voucher/${booking.booking_number}?ref=${booking.public_ref}`)}`}
                            alt="QR Code"
                            style={{
                                width: "150px",
                                height: "150px",
                            }}
                        />
                    </div>

                    <div className="text-center mt-5 no-print">
                        <button className="btn btn-primary" onClick={() => window.print()}>Print Voucher</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicHotelVoucher;
