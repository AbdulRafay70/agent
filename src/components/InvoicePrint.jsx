import React from 'react';
import './InvoicePrint.css';

const InvoicePrint = ({
  formData = {},
  hotelForms = [],
  transportForms = [],
  transportSectors = [],
  foodForms = [],
  ziaratForms = [],
  selectedFlight = null,
  calculatedVisaPrices = {},
  riyalRate = {},
  hotels = [],
  foodPrices = [],
  ziaratPrices = [],
  familyGroups = [],
  familyRoomTypes = {},
  airlinesMap = {},
  formatPriceWithCurrencyNetPrice = (n) => n,
  calculateHotelCost = () => ({ total: 0, perNight: 0 }),
  calculateTransportCost = () => 0,
  formatPriceWithCurrency = (n) => n,
}) => {
  const totalPax = (parseInt(formData.totalAdults || 0) || 0) + (parseInt(formData.totalChilds || 0) || 0) + (parseInt(formData.totalInfants || 0) || 0);

  // Helper: Check if service uses PKR (true) or SAR (false)
  const isServiceInPKR = (serviceType) => {
    if (!riyalRate) return true;
    const flagName = `is_${serviceType}_pkr`;
    return riyalRate[flagName] === true;
  };

  // Helper: Get currency symbol for service
  const getCurrency = (serviceType) => {
    return isServiceInPKR(serviceType) ? 'PKR' : 'SAR';
  };

  // Helper: Format price with currency
  const formatPrice = (price, serviceType) => {
    const currency = getCurrency(serviceType);
    return `${currency} ${(price || 0).toLocaleString()}`;
  };

  // Helper functions for date/time formatting
  const formatDate = (d) => {
    if (!d || isNaN(d)) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mon = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
    const yyyy = d.getFullYear();
    return `${dd}-${mon}-${yyyy}`;
  };
  
  const formatTime = (d) => {
    if (!d || isNaN(d)) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // Helper: Build travel/flight display string like "SV.234-LHE-JED 19-DEC-2024-23:20-01:20"
  const formatTravelString = () => {
    if (selectedFlight && selectedFlight.trip_details && selectedFlight.trip_details.length > 0) {
      // Get departure trip (first trip or trip_type === 'departure')
      const departureTrip = selectedFlight.trip_details.find(
        t => (t.trip_type || '').toString().toLowerCase() === 'departure'
      ) || selectedFlight.trip_details[0];

      if (departureTrip) {
        // Extract airline code and flight number
        const airlineObj = departureTrip.airline || {};
        const airlineId = airlineObj.id;
        // Lookup airline code from airlinesMap using airline ID
        const airlineData = airlinesMap[airlineId] || {};
        const airlineCode = (airlineData.code || airlineObj.code || airlineObj.iata || airlineObj.airline_code || airlineObj.iata_code || '').toString().toUpperCase();
        const flightNo = (departureTrip.flight_number || departureTrip.flight_no || departureTrip.flightNumber || '').toString();
        // Use dot between airline code and flight number (e.g. SV.234)
        const flightCode = (airlineCode && flightNo) ? `${airlineCode}.${flightNo}` : flightNo;

        // Extract city codes
        const depCity = departureTrip.departure_city || {};
        const arrCity = departureTrip.arrival_city || {};
        const orig = (depCity.code || depCity.city_code || '').toString().toUpperCase();
        const dest = (arrCity.code || arrCity.city_code || '').toString().toUpperCase();

        // Parse departure and arrival datetime
        let depDate = null, arrDate = null;
        try {
          if (departureTrip.departure_date_time) {
            depDate = new Date(departureTrip.departure_date_time);
          }
        } catch (e) { depDate = null; }
        try {
          if (departureTrip.arrival_date_time) {
            arrDate = new Date(departureTrip.arrival_date_time);
          }
        } catch (e) { arrDate = null; }

        const datePart = depDate ? formatDate(depDate) : (formData.travelDate || '—');
        const depTime = depDate ? formatTime(depDate) : '—';
        const arrTime = arrDate ? formatTime(arrDate) : '—';

        const parts = [];
        if (flightCode) parts.push(flightCode);
        if (orig && dest) parts.push(`${orig}-${dest}`);

        const prefix = parts.length ? parts.join('-') + ' ' : '';
        return `${prefix}${datePart}-${depTime}-${arrTime}`;
      }
    }

    // Fallback: raw travel date
    return formData.travelDate || formData.departureTravelDate || '—';
  };

  // Helper: Build return flight display string
  const formatReturnString = () => {
    if (selectedFlight && selectedFlight.trip_details && selectedFlight.trip_details.length > 1) {
      // Get return trip
      const returnTrip = selectedFlight.trip_details.find(
        t => (t.trip_type || '').toString().toLowerCase() === 'return'
      ) || selectedFlight.trip_details[1];

      if (returnTrip) {
        // Extract airline code and flight number
        const airlineObj = returnTrip.airline || {};
        const airlineId = airlineObj.id;
        // Lookup airline code from airlinesMap using airline ID
        const airlineData = airlinesMap[airlineId] || {};
        const airlineCode = (airlineData.code || airlineObj.code || airlineObj.iata || airlineObj.airline_code || airlineObj.iata_code || '').toString().toUpperCase();
        const flightNo = (returnTrip.flight_number || returnTrip.flight_no || returnTrip.flightNumber || '').toString();
        // Use dot between airline code and flight number for return trips as well
        const flightCode = (airlineCode && flightNo) ? `${airlineCode}.${flightNo}` : flightNo;

        // Extract city codes
        const depCity = returnTrip.departure_city || {};
        const arrCity = returnTrip.arrival_city || {};
        const orig = (depCity.code || depCity.city_code || '').toString().toUpperCase();
        const dest = (arrCity.code || arrCity.city_code || '').toString().toUpperCase();

        // Parse departure and arrival datetime
        let depDate = null, arrDate = null;
        try {
          if (returnTrip.departure_date_time) {
            depDate = new Date(returnTrip.departure_date_time);
          }
        } catch (e) { depDate = null; }
        try {
          if (returnTrip.arrival_date_time) {
            arrDate = new Date(returnTrip.arrival_date_time);
          }
        } catch (e) { arrDate = null; }

        const datePart = depDate ? formatDate(depDate) : (formData.returnDate || '—');
        const depTime = depDate ? formatTime(depDate) : '—';
        const arrTime = arrDate ? formatTime(arrDate) : '—';

        const parts = [];
        if (flightCode) parts.push(flightCode);
        if (orig && dest) parts.push(`${orig}-${dest}`);

        const prefix = parts.length ? parts.join('-') + ' ' : '';
        return `${prefix}${datePart}-${depTime}-${arrTime}`;
      }
    }

    // Fallback: raw return date
    return formData.returnDate || formData.returnReturnDate || '—';
  };

  // Helper: Generate current invoice date in DD-MMM-YYYY format
  const generateInvoiceDate = () => {
    const now = new Date();
    return formatDate(now);
  };

  // Generate hotel rows: one row per family per hotel
  const hotelRows = [];
  
  if (familyGroups && familyGroups.length > 0) {
    // Family mode: generate rows for each family × hotel combination
    familyGroups.forEach((familySize, familyIndex) => {
      hotelForms.filter(f => f.hotelId || f.isSelfHotel).forEach((form, hotelIndex) => {
        const roomTypeKey = `${familyIndex}_${hotelIndex}`;
        const selectedRoomType = familyRoomTypes[roomTypeKey];
        
        // Skip if no room type selected for this family-hotel combination
        if (!selectedRoomType) return;
        
        // Handle self-hotel case
        if (form.isSelfHotel) {
          const roomTypeLower = selectedRoomType.toLowerCase();
          let qty = 1;
          if (roomTypeLower === 'sharing') qty = familySize;
          else if (roomTypeLower === 'double') qty = 2;
          else if (roomTypeLower === 'triple') qty = 3;
          else if (roomTypeLower === 'quad') qty = 4;
          else if (roomTypeLower === 'quint') qty = 5;
          
          const nights = parseInt(form.noOfNights) || 0;
          const rate = 0;
          const net = rate * qty * nights;
          
          hotelRows.push({
            name: form.selfHotelName || 'Self Hotel',
            roomType: selectedRoomType,
            checkIn: form.checkIn || '',
            nights: nights,
            checkOut: form.checkOut || '',
            rate: rate,
            qty: qty,
            net: net,
          });
          return;
        }
        
        const hotel = hotels.find(h => String(h.id) === String(form.hotelId)) || {};
        
        // Debug logging
        console.log('🏨 Invoice Hotel Debug:', {
          hotelName: hotel.name,
          hotelId: form.hotelId,
          selectedRoomType: selectedRoomType,
          availablePrices: hotel.prices?.map(p => ({ room_type: p.room_type, price: p.price })),
          familyIndex,
          hotelIndex,
          roomTypeKey
        });
        
        const priceObj = hotel.prices?.find(p => p.room_type && p.room_type.toLowerCase() === selectedRoomType.toLowerCase());
        const rate = priceObj?.price || priceObj?.selling_price || 0;
        const nights = parseInt(form.noOfNights) || 0;
        
        // Calculate QTY based on room type
        const roomTypeLower = selectedRoomType.toLowerCase();
        let qty = 1;
        if (roomTypeLower === 'sharing') qty = familySize;
        else if (roomTypeLower === 'double') qty = 2;
        else if (roomTypeLower === 'triple') qty = 3;
        else if (roomTypeLower === 'quad') qty = 4;
        else if (roomTypeLower === 'quint') qty = 5;
        
        // Net = Rate × QTY × Nights
        const net = rate * qty * nights;
        
        console.log('💰 Price Calculation:', {
          priceObj,
          rate,
          qty,
          nights,
          net,
          calculation: `${rate} × ${qty} × ${nights} = ${net}`
        });
        
        hotelRows.push({
          name: hotel.name || 'N/A',
          roomType: selectedRoomType,
          checkIn: form.checkIn || '',
          nights: nights,
          checkOut: form.checkOut || '',
          rate: rate,
          qty: qty,
          net: net,
        });
      });
    });
  } else {
    // Non-family mode: fallback to original logic
    hotelForms.filter(f => f.hotelId || f.isSelfHotel).forEach((form, idx) => {
      // Handle self-hotel case
      if (form.isSelfHotel) {
        hotelRows.push({
          name: form.selfHotelName || 'Self Hotel',
          roomType: form.roomType || '',
          checkIn: form.checkIn || '',
          nights: form.noOfNights || 0,
          checkOut: form.checkOut || '',
          rate: 0,
          qty: 1,
          net: 0,
        });
        return;
      }
      
      const hotel = hotels.find(h => String(h.id) === String(form.hotelId)) || {};
      
      // Use the calculateHotelCost function passed from parent component
      const { perNight = 0, total = 0 } = calculateHotelCost(form);
      
      hotelRows.push({
        name: hotel.name || 'N/A',
        roomType: form.roomType || '',
        checkIn: form.checkIn || '',
        nights: form.noOfNights || 0,
        checkOut: form.checkOut || '',
        rate: perNight,
        qty: 1,
        net: total,
      });
    });
  }

  const transportRows = transportForms.filter(f => f.transportSectorId && !f.self).map((f) => {
    const sector = transportSectors.find(s => s.id.toString() === f.transportSectorId);
    const route = sector ? `${sector.small_sector?.departure_city_code || sector.small_sector?.departure_city || ''} → ${sector.small_sector?.arrival_city_code || sector.small_sector?.arrival_city || ''}` : (f.transportSector || '');
    return {
      vehicle: f.transportType || 'Vehicle',
      route,
      rate: calculateTransportCost(f),
      qty: 1,
      net: calculateTransportCost(f),
    };
  });

  const foodRows = foodForms.filter(f => f.foodId && !formData.foodSelf).map((f) => {
    const item = foodPrices.find(fp => String(fp.id) === String(f.foodId)) || {};
    const adults = parseInt(formData.totalAdults || 0) || 0;
    const childs = parseInt(formData.totalChilds || 0) || 0;
    const infants = parseInt(formData.totalInfants || 0) || 0;
    const adultPrice = item.adult_selling_price || 0;
    const childPrice = item.child_selling_price || 0;
    const infantPrice = item.infant_selling_price || 0;
    const net = (adults * adultPrice) + (childs * childPrice) + (infants * infantPrice);
    return { 
      title: item.title || item.name || 'Food', 
      adults, childs, infants,
      adultPrice, childPrice, infantPrice,
      net 
    };
  });

  const ziaratRows = ziaratForms.filter(f => f.ziaratId && !formData.ziaratSelf).map((f) => {
    const item = ziaratPrices.find(z => String(z.id) === String(f.ziaratId)) || {};
    const adults = parseInt(formData.totalAdults || 0) || 0;
    const childs = parseInt(formData.totalChilds || 0) || 0;
    const infants = parseInt(formData.totalInfants || 0) || 0;
    const adultPrice = item.adult_selling_price || 0;
    const childPrice = item.child_selling_price || 0;
    const infantPrice = item.infant_selling_price || 0;
    const net = (adults * adultPrice) + (childs * childPrice) + (infants * infantPrice);
    return { 
      title: item.ziarat_title || item.title || item.name || 'Ziarat',
      adults, childs, infants,
      adultPrice, childPrice, infantPrice,
      net 
    };
  });

  const visaCost = ((calculatedVisaPrices.adultPrice || 0) * (parseInt(formData.totalAdults || 0) || 0)) +
    ((calculatedVisaPrices.childPrice || 0) * (parseInt(formData.totalChilds || 0) || 0)) +
    ((calculatedVisaPrices.infantPrice || 0) * (parseInt(formData.totalInfants || 0) || 0));

  const flightCost = selectedFlight ? (
    (selectedFlight.adult_price || selectedFlight.adult_fare || 0) * (parseInt(formData.totalAdults || 0) || 0) +
    (selectedFlight.child_price || selectedFlight.child_fare || 0) * (parseInt(formData.totalChilds || 0) || 0) +
    (selectedFlight.infant_price || selectedFlight.infant_fare || 0) * (parseInt(formData.totalInfants || 0) || 0)
  ) : 0;

  const hotelTotal = hotelRows.reduce((s, r) => s + (r.net || 0), 0);
  const transportTotal = transportRows.reduce((s, r) => s + (r.net || 0), 0);
  const foodTotal = foodRows.reduce((s, r) => s + (r.net || 0), 0);
  const ziaratTotal = ziaratRows.reduce((s, r) => s + (r.net || 0), 0);

  // Helper: Convert service price to PKR for total calculation
  const convertToPKR = (price, serviceType) => {
    if (isServiceInPKR(serviceType)) {
      return price; // Already in PKR
    } else {
      return price * (riyalRate?.rate || 1); // Convert SAR to PKR
    }
  };

  // Convert each service to PKR before summing
  const visaCostPKR = convertToPKR(visaCost, 'visa');
  const hotelTotalPKR = convertToPKR(hotelTotal, 'hotel');
  const transportTotalPKR = convertToPKR(transportTotal, 'transport');
  const foodTotalPKR = convertToPKR(foodTotal, 'food');
  const ziaratTotalPKR = convertToPKR(ziaratTotal, 'ziarat');
  const flightCostPKR = flightCost; // Always PKR

  const netPKR = flightCostPKR + hotelTotalPKR + transportTotalPKR + foodTotalPKR + ziaratTotalPKR + visaCostPKR;

  return (
    <div className="invoice-print-root">
      <div className="invoice-grid">
        <div className="invoice-left">
          <section className="invoice-section">
            <h5 className="section-title">Pax Information</h5>
            <table className="table pax-table">
              <thead>
                <tr>
                  <th>Passenger Name</th>
                  <th>Passport No</th>
                  <th>PAX</th>
                  <th>DOB</th>
                  <th>PNR</th>
                  <th>Bed</th>
                  <th>Total Pax</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>N/A</td>
                  <td>N/A</td>
                  <td>Adult</td>
                  <td>N/A</td>
                  <td>{formData.pnr || 'N/A'}</td>
                  <td>{'—'}</td>
                  <td>{(parseInt(formData.totalAdults || 0) || 0)} Adult & {(parseInt(formData.totalChilds || 0) || 0)} Child</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="section-divider" />

          <section className="invoice-section">
            <h5 className="section-title">Accommodation</h5>
            <table className="table accom-table">
              <thead>
                <tr>
                  <th>Hotel Name</th>
                  <th>Type</th>
                  <th>Check-In</th>
                  <th>Nights</th>
                  <th>Check-Out</th>
                  <th>Rate</th>
                  <th>QTY</th>
                  <th>Net</th>
                  <th>Pkr Net</th>
                </tr>
              </thead>
              <tbody>
                {hotelRows.length > 0 ? (
                  <>
                    {hotelRows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.name}</td>
                        <td>{r.roomType}</td>
                        <td>{r.checkIn}</td>
                        <td>{r.nights}</td>
                        <td>{r.checkOut}</td>
                        <td>{formatPrice(r.rate, 'hotel')}</td>
                        <td>{r.qty}</td>
                        <td>{formatPrice(r.net, 'hotel')}</td>
                        <td>PKR {convertToPKR(r.net, 'hotel').toLocaleString()}</td>
                      </tr>
                    ))}

                    <tr className="fw-bold">
                      <td colSpan="3">Total Accommodation</td>
                      <td>{hotelForms.filter(f => f.hotelId || f.isSelfHotel).reduce((s, f) => s + (parseInt(f.noOfNights) || 0), 0)}</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td>{formatPrice(hotelTotal, 'hotel')}</td>
                      <td>PKR {hotelTotalPKR.toLocaleString()}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted">No hotels selected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <div className="section-divider" />

          <section className="invoice-section">
            <h5 className="section-title">Transportation</h5>
            <table className="table transport-table">
              <thead>
                <tr>
                  <th>Vehicle type</th>
                  <th>Route</th>
                  <th>Rate</th>
                  <th>QTY</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {transportRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.vehicle}</td>
                    <td>{r.route}</td>
                    <td>{formatPrice(r.rate, 'transport')}</td>
                    <td>{r.qty}</td>
                    <td>{formatPrice(r.net, 'transport')}</td>
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td colSpan="4">Total Transportation</td>
                  <td>{formatPrice(transportTotal, 'transport')}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="section-divider" />

          <section className="invoice-section">
            <h5 className="section-title">Food Services</h5>
            <table className="table food-table">
              <thead>
                <tr>
                  <th>Food Item</th>
                  <th>Adult Rate × Qty</th>
                  <th>Child Rate × Qty</th>
                  <th>Infant Rate × Qty</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {foodRows.length > 0 ? (
                  <>
                    {foodRows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.title}</td>
                        <td>{formatPrice(r.adultPrice, 'food')} × {r.adults}</td>
                        <td>{formatPrice(r.childPrice, 'food')} × {r.childs}</td>
                        <td>{formatPrice(r.infantPrice, 'food')} × {r.infants}</td>
                        <td>{formatPrice(r.net, 'food')}</td>
                      </tr>
                    ))}
                    <tr className="fw-bold">
                      <td colSpan="4">Total Food Services</td>
                      <td>{formatPrice(foodTotal, 'food')}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No food services selected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <div className="section-divider" />

          <section className="invoice-section">
            <h5 className="section-title">Ziarat Services</h5>
            <table className="table ziarat-table">
              <thead>
                <tr>
                  <th>Ziarat</th>
                  <th>Adult Rate × Qty</th>
                  <th>Child Rate × Qty</th>
                  <th>Infant Rate × Qty</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {ziaratRows.length > 0 ? (
                  <>
                    {ziaratRows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.title}</td>
                        <td>{formatPrice(r.adultPrice, 'ziarat')} × {r.adults}</td>
                        <td>{formatPrice(r.childPrice, 'ziarat')} × {r.childs}</td>
                        <td>{formatPrice(r.infantPrice, 'ziarat')} × {r.infants}</td>
                        <td>{formatPrice(r.net, 'ziarat')}</td>
                      </tr>
                    ))}
                    <tr className="fw-bold">
                      <td colSpan="4">Total Ziarat Services</td>
                      <td>{formatPrice(ziaratTotal, 'ziarat')}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No ziarat services selected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <div className="section-divider" />

          <section className="invoice-section">
            <h5 className="section-title">Pilgrims & Tickets Detail</h5>
            <table className="table visa-ticket-table">
              <thead>
                <tr>
                  <th>Pax</th>
                  <th>Total Pax</th>
                  <th>Visa Rate</th>
                  <th>Ticket Rate</th>
                </tr>
              </thead>
              <tbody>
                {(visaCost > 0 || selectedFlight) ? (
                  <>
                    <tr>
                      <td>Adult</td>
                      <td>{parseInt(formData.totalAdults || 0) || 0}</td>
                      <td>{formatPrice(calculatedVisaPrices.adultPrice || 0, 'visa')}</td>
                      <td>PKR {(selectedFlight?.adult_price || selectedFlight?.adult_fare || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Child</td>
                      <td>{parseInt(formData.totalChilds || 0) || 0}</td>
                      <td>{formatPrice(calculatedVisaPrices.childPrice || 0, 'visa')}</td>
                      <td>PKR {(selectedFlight?.child_price || selectedFlight?.child_fare || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Infant</td>
                      <td>{parseInt(formData.totalInfants || 0) || 0}</td>
                      <td>{formatPrice(calculatedVisaPrices.infantPrice || 0, 'visa')}</td>
                      <td>PKR {(selectedFlight?.infant_price || selectedFlight?.infant_fare || 0).toLocaleString()}</td>
                    </tr>
                    <tr className="fw-bold">
                      <td>Total</td>
                      <td>{(parseInt(formData.totalAdults || 0) || 0) + (parseInt(formData.totalChilds || 0) || 0) + (parseInt(formData.totalInfants || 0) || 0)}</td>
                      <td>{formatPrice(visaCost, 'visa')}</td>
                      <td>PKR {flightCost.toLocaleString()}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted">No visa or flight selected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>

      </div>

      {/* Bottom full-width Invoice Details section */}
      <div className="invoice-details-section">
        <h5 className="section-title">Invoice Details</h5>
        <div className="invoice-details" style={{display:'flex',gap:24,flexWrap:'wrap'}}>
          <div style={{flex:'1 1 520px',minWidth:300}}>
            <div className="summary-row"><span>Travel Date:</span><strong>{formatTravelString()}</strong></div>
            <div className="summary-row"><span>Return Date:</span><strong>{formatReturnString()}</strong></div>
            <div className="summary-row"><span>Invoice Date:</span><strong>{generateInvoiceDate()}</strong></div>
          </div>

          <div style={{flex:'0 0 320px',minWidth:260}}>
            <div className="summary-box">
              <div className="tot-row"><span>{getCurrency('visa')} Rate: Visa @ {riyalRate?.rate ?? '—'}</span><strong>{formatPrice(visaCost, 'visa')}</strong></div>
              <div className="tot-row"><span>Tickets :</span><strong>PKR {flightCost.toLocaleString()}</strong></div>
              <div className="tot-row"><span>{getCurrency('hotel')} Rate: Hotel @ {riyalRate?.rate ?? '—'}</span><strong>{formatPrice(hotelTotal, 'hotel')}</strong></div>
              <div className="tot-row"><span>{getCurrency('transport')} Rate: Transport @ {riyalRate?.rate ?? '—'}</span><strong>{formatPrice(transportTotal, 'transport')}</strong></div>
              {foodTotal > 0 && <div className="tot-row"><span>Food Services :</span><strong>{formatPrice(foodTotal, 'food')}</strong></div>}
              {ziaratTotal > 0 && <div className="tot-row"><span>Ziarat Services :</span><strong>{formatPrice(ziaratTotal, 'ziarat')}</strong></div>}
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                <div className="net-badge">Net Total = <strong>{formatPrice(netPKR, 'visa')}</strong></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoicePrint;
