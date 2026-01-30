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
  manualFamilies = [],
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
    // Always return true to force PKR display
    return true;
    // Original logic (commented out):
    // if (!riyalRate) return true;
    // const flagName = `is_${serviceType}_pkr`;
    // return riyalRate[flagName] === true;
  };

  // Helper: Get currency symbol for service
  const getCurrency = (serviceType) => {
    // Always return PKR
    return 'PKR';
    // Original logic (commented out):
    // return isServiceInPKR(serviceType) ? 'PKR' : 'SAR';
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
        const fullString = `${prefix}${datePart}-${depTime}-${arrTime}`;
        if (!datePart || datePart === '—') return formData.travelDate || formData.departureTravelDate || '—';
        return fullString;
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

  // Generate hotel rows: grouped by family
  // Structure: { [familyLabel]: [rows...] }
  const groupedHotelRows = {};

  if (familyGroups && familyGroups.length > 0) {
    familyGroups.forEach((familySize, familyIndex) => {
      const familyLabel = `Family ${familyIndex + 1}`;
      groupedHotelRows[familyLabel] = [];

      hotelForms.filter(f => f.hotelId || f.isSelfHotel || f.savedName).forEach((form, hotelIndex) => {
        const roomTypeKey = `${familyIndex}_${hotelIndex}`;
        const selectedRoomType = familyRoomTypes[roomTypeKey] || form.roomType || 'Sharing';
        if (!selectedRoomType) return;

        // Helper to get QTY based on room type
        const getQty = (rtype) => {
          const rlo = (rtype || '').toLowerCase();
          if (rlo === 'sharing') return familySize;
          // For non-sharing rooms, quantity is effectively 1 (Rate is Per Room)
          // Previously this returned 2/3/4 which multiplied Per Room Rate by 2/3/4 (wrong)
          return 1;
        }

        let name, rate = 0, qty = 1, nights = 0, net = 0;
        nights = parseInt(form.noOfNights) || 0;

        if (form.isSelfHotel) {
          name = form.selfHotelName || 'Self Hotel';
          qty = (selectedRoomType.toLowerCase() === 'sharing') ? familySize : 1;
          rate = 0;
          net = 0;
        } else {
          const hotel = hotels.find(h => String(h.id) === String(form.hotelId)) || {};
          name = hotel.name || form.hotelName || form.savedName || 'N/A';
          const priceObj = hotel.prices?.find(p => p.room_type && p.room_type.toLowerCase() === selectedRoomType.toLowerCase());
          rate = (form.savedRate !== undefined) ? form.savedRate : (priceObj?.price || priceObj?.selling_price || 0);

          qty = getQty(selectedRoomType);

          // Force recalculation: Net = Rate * Qty * Nights
          // If Sharing: Rate (Per Person) * FamilySize * Nights
          // If Room: Rate (Per Room) * 1 * Nights
          net = rate * qty * nights;
        }

        // We can't convert to PKR here easily as 'convertToPKR' is defined BELOW this block in original code.
        // We will store netSAR and convert during render/total calculation OR move convertToPKR up.
        // 'isServiceInPKR' is defined above. 'riyalRate' is available.
        // We can inline the conversion logic to be safe.
        const conversionRate = isServiceInPKR('hotel') ? 1 : (riyalRate?.rate || 1);
        const netPKR = isServiceInPKR('hotel') ? net : (net * conversionRate);

        groupedHotelRows[familyLabel].push({
          name,
          roomType: selectedRoomType,
          checkIn: form.checkIn || '',
          nights,
          checkOut: form.checkOut || '',
          rate,
          qty,
          netSAR: net,
          netPKR: netPKR
        });
      });
    });
  } else {
    // Non-family / General mode
    const label = 'Accommodation';
    groupedHotelRows[label] = [];

    hotelForms.filter(f => f.hotelId || f.isSelfHotel || f.savedName).forEach((form) => {
      let name, rate = 0, qty = 1, nights = 0, net = 0;
      nights = parseInt(form.noOfNights) || 0;

      if (form.isSelfHotel) {
        name = form.selfHotelName || 'Self Hotel';
        rate = 0;
        net = 0;
      } else {
        const hotel = hotels.find(h => String(h.id) === String(form.hotelId)) || {};
        // Use parent calculator helper or fallback
        const { perNight = 0, total = 0 } = (() => {
          try { return form.hotelId ? calculateHotelCost(form) : { perNight: 0, total: 0 }; }
          catch (e) { return { perNight: 0, total: 0 }; }
        })();

        name = hotel.name || form.hotelName || form.savedName || 'N/A';
        // Rate should be per-night
        rate = (form.savedRate !== undefined) ? form.savedRate : perNight;

        // Calculate Net from Rate * Nights (ignoring savedNet if it's wrong)
        // Assume Qty is 1 for non-family general mode unless specified
        net = rate * nights;
      }

      const conversionRate = isServiceInPKR('hotel') ? 1 : (riyalRate?.rate || 1);
      const netPKR = isServiceInPKR('hotel') ? net : (net * conversionRate);

      groupedHotelRows[label].push({
        name,
        roomType: form.roomType || '',
        checkIn: form.checkIn || '',
        nights,
        checkOut: form.checkOut || '',
        rate,
        qty: 1, // Default 1 for general
        netSAR: net,
        netPKR: netPKR
      });
    });
  }

  const transportRows = transportForms.filter(f => (f.transportSectorId || f.savedName)).map((f) => {
    const sector = transportSectors.find(s => s.id.toString() === f.transportSectorId);

    // Helper to format sector display (matching AgentUmrahCalculator logic)
    const getSectorLabel = (sector) => {
      if (!sector) return '';

      // If big_sector exists, show full route
      if (sector.big_sector && sector.big_sector.small_sectors && sector.big_sector.small_sectors.length > 0) {
        const cityCodes = [];
        const sortedSectors = sector.big_sector.small_sectors;

        // Add first departure city
        if (sortedSectors[0]) {
          cityCodes.push(sortedSectors[0].departure_city || sortedSectors[0].departure_city_code || '');
        }

        // Add all arrival cities
        sortedSectors.forEach(s => {
          cityCodes.push(s.arrival_city || s.arrival_city_code || '');
        });

        // Remove consecutive duplicates
        const uniqueCodes = cityCodes.filter((code, index, array) =>
          index === 0 || code !== array[index - 1]
        );

        return `${uniqueCodes.join('-')} (${sortedSectors.length})`;
      }

      // Otherwise show small sector route
      const departure = sector.small_sector?.departure_city_code || sector.small_sector?.departure_city || sector.departure_city_code || sector.departure_city || '';
      const arrival = sector.small_sector?.arrival_city_code || sector.small_sector?.arrival_city || sector.arrival_city_code || sector.arrival_city || '';
      const name = sector.name ? ` (${sector.name})` : '';

      if (!departure && !arrival) return sector.name || 'Unknown Route';

      return `${departure} → ${arrival}${name}`;
    };

    const route = sector ? getSectorLabel(sector) : (f.transportSector || '');
    return {
      vehicle: f.transportType || 'Vehicle',
      route,
      rate: (f.savedRate !== undefined) ? f.savedRate : calculateTransportCost(f),
      qty: 1,
      net: (f.savedNet !== undefined) ? f.savedNet : calculateTransportCost(f),
    };
  });

  const foodRows = foodForms.filter(f => (f.foodId || f.savedName) && !formData.foodSelf).map((f) => {
    const item = foodPrices.find(fp => String(fp.id) === String(f.foodId)) || {};
    const adults = parseInt(formData.totalAdults || 0) || 0;
    const childs = parseInt(formData.totalChilds || 0) || 0;
    const infants = parseInt(formData.totalInfants || 0) || 0;
    const adultPrice = item.adult_selling_price || 0;
    const childPrice = item.child_selling_price || 0;
    const infantPrice = item.infant_selling_price || 0;
    const net = (adults * adultPrice) + (childs * childPrice) + (infants * infantPrice);
    return {
      title: item.title || item.name || f.savedName || 'Food',
      adults, childs, infants,
      adultPrice: (f.savedAdultPrice !== undefined) ? f.savedAdultPrice : adultPrice,
      childPrice: (f.savedChildPrice !== undefined) ? f.savedChildPrice : childPrice,
      infantPrice: (f.savedInfantPrice !== undefined) ? f.savedInfantPrice : infantPrice,
      net: (f.savedNet && f.savedNet > 0) ? f.savedNet : net
    };
  });

  const ziaratRows = ziaratForms.filter(f => (f.ziaratId || f.savedName) && !formData.ziaratSelf).map((f) => {
    const item = ziaratPrices.find(z => String(z.id) === String(f.ziaratId)) || {};
    const adults = parseInt(formData.totalAdults || 0) || 0;
    const childs = parseInt(formData.totalChilds || 0) || 0;
    const infants = parseInt(formData.totalInfants || 0) || 0;
    const adultPrice = item.adult_selling_price || 0;
    const childPrice = item.child_selling_price || 0;
    const infantPrice = item.infant_selling_price || 0;
    const net = (adults * adultPrice) + (childs * childPrice) + (infants * infantPrice);
    return {
      title: item.ziarat_title || item.title || item.name || f.savedName || 'Ziarat',
      adults, childs, infants,
      adultPrice: (f.savedAdultPrice !== undefined) ? f.savedAdultPrice : adultPrice,
      childPrice: (f.savedChildPrice !== undefined) ? f.savedChildPrice : childPrice,
      infantPrice: (f.savedInfantPrice !== undefined) ? f.savedInfantPrice : infantPrice,
      net: (f.savedNet && f.savedNet > 0) ? f.savedNet : net
    };
  });

  const visaCost = ((calculatedVisaPrices.adultPrice || 0) * (parseInt(formData.totalAdults || 0) || 0)) +
    ((calculatedVisaPrices.childPrice || 0) * (parseInt(formData.totalChilds || 0) || 0)) +
    ((calculatedVisaPrices.infantPrice || 0) * (parseInt(formData.totalInfants || 0) || 0));

  const flightCost = selectedFlight ? (
    (selectedFlight.adult_selling_price || selectedFlight.adult_price || selectedFlight.adult_fare || 0) * (parseInt(formData.totalAdults || 0) || 0) +
    (selectedFlight.child_selling_price || selectedFlight.child_price || selectedFlight.child_fare || 0) * (parseInt(formData.totalChilds || 0) || 0) +
    (selectedFlight.infant_selling_price || selectedFlight.infant_price || selectedFlight.infant_fare || 0) * (parseInt(formData.totalInfants || 0) || 0)
  ) : 0;

  // Calculate total from grouped rows
  const allHotelRows = Object.values(groupedHotelRows).flat();
  const hotelTotal = allHotelRows.reduce((s, r) => s + (r.netSAR || 0), 0);

  // Calculate distinct PKR total for accuracy (summing individual converted rows is more precise than converting total)
  const hotelTotalPKR_Exact = allHotelRows.reduce((s, r) => s + (r.netPKR || 0), 0);

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
  // Use exact sum if available, else convert total
  const hotelTotalPKR = hotelTotalPKR_Exact;
  const transportTotalPKR = convertToPKR(transportTotal, 'transport');
  const foodTotalPKR = convertToPKR(foodTotal, 'food');
  const ziaratTotalPKR = convertToPKR(ziaratTotal, 'ziarat');
  const flightCostPKR = flightCost; // Always PKR

  const netPKR = flightCostPKR + hotelTotalPKR + transportTotalPKR + foodTotalPKR + ziaratTotalPKR + visaCostPKR;

  // Prepare iteration data for rendering multiple invoices
  const iterations = [];
  if (familyGroups && familyGroups.length > 0) {
    familyGroups.forEach((size, index) => {
      iterations.push({
        label: `Family ${index + 1}`,
        size: size,
        ratio: totalPax > 0 ? (size / totalPax) : 0,
        isDefault: false
      });
    });
  } else {
    iterations.push({
      label: 'Invoice',
      size: totalPax,
      ratio: 1,
      isDefault: true
    });
  }

  return (
    <div className="invoice-print-root">

      {iterations.map((iter, iterIndex) => {
        // Calculate allocated costs for this family iteration
        const ratio = iter.ratio;
        const familyVisaCost = visaCost * ratio;
        const familyTransportTotal = transportTotal * ratio;
        const familyFoodTotal = foodTotal * ratio;
        const familyZiaratTotal = ziaratTotal * ratio;
        const familyFlightCost = flightCost * ratio;

        // Get specific hotel rows for this family
        // For default mode, label is 'Accommodation'. For family mode, 'Family X'
        const familyHotelRows = groupedHotelRows[iter.label] || groupedHotelRows['Accommodation'] || [];
        const familyHotelTotal = familyHotelRows.reduce((s, r) => s + (r.netSAR || 0), 0);
        // Exact PKR sum for this family
        const familyHotelTotalPKR = familyHotelRows.reduce((s, r) => s + (r.netPKR || 0), 0);

        // Convert allocated costs to PKR
        const familyVisaCostPKR = isServiceInPKR('visa') ? familyVisaCost : (familyVisaCost * (riyalRate?.rate || 1));
        const familyTransportTotalPKR = isServiceInPKR('transport') ? familyTransportTotal : (familyTransportTotal * (riyalRate?.rate || 1));
        const familyFoodTotalPKR = isServiceInPKR('food') ? familyFoodTotal : (familyFoodTotal * (riyalRate?.rate || 1));
        const familyZiaratTotalPKR = isServiceInPKR('ziarat') ? familyZiaratTotal : (familyZiaratTotal * (riyalRate?.rate || 1));
        const familyFlightCostPKR = familyFlightCost; // Always PKR

        const familyNetPKR = familyFlightCostPKR + familyHotelTotalPKR + familyTransportTotalPKR + familyFoodTotalPKR + familyZiaratTotalPKR + familyVisaCostPKR;

        // Formatted display strings
        const pnrDisplay = formData.pnr || 'N/A';
        const paxDisplay = iter.isDefault ?
          `${(parseInt(formData.totalAdults || 0) || 0)} Adult & ${(parseInt(formData.totalChilds || 0) || 0)} Child`
          : `${iter.size} Person(s)`;

        return (
          <div key={iterIndex} className="family-invoice-block mb-5 pb-5 border-bottom">
            {/* Header for Family Section */}
            {!iter.isDefault && (
              <h4 className="text-center text-primary mb-4 fw-bold text-uppercase border-bottom pb-2">
                {iter.label} (Pax: {iter.size})
              </h4>
            )}

            <div className="invoice-grid">
              <div className="invoice-left">
                <section className="invoice-section">
                  <h5 className="section-title">Pax Information {iter.isDefault ? '' : `(${iter.label})`}</h5>
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
                        <td>{pnrDisplay}</td>
                        <td>{'—'}</td>
                        <td>{paxDisplay}</td>
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
                        <th>Rate per night</th>
                        <th>Exchange Rate</th>
                        <th>Pkr Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {familyHotelRows.length > 0 ? (
                        <>
                          {familyHotelRows.map((r, i) => {
                            const exchRate = riyalRate?.rate || 1;
                            return (
                              <tr key={i}>
                                <td>{r.name}</td>
                                <td>{r.roomType}</td>
                                <td>{r.checkIn}</td>
                                <td>{r.nights}</td>
                                <td>{r.checkOut}</td>
                                <td>{formatPrice(r.rate, 'hotel')}</td>
                                <td>{exchRate}</td>
                                <td>PKR {r.netPKR.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                          <tr className="fw-bold bg-light">
                            <td colSpan="3">Total Accommodation</td>
                            <td>{familyHotelRows.reduce((s, r) => s + (parseInt(r.nights) || 0), 0)}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td>PKR {familyHotelTotalPKR.toLocaleString()}</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center text-muted">No hotels selected</td>
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
                        <th>Exch. Rate</th>
                        <th>Net (Allocated)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transportRows.map((r, i) => {
                        const exchRate = riyalRate?.rate || 1;
                        return (
                          <tr key={i}>
                            <td>{r.vehicle}</td>
                            <td>{r.route}</td>
                            <td>{formatPrice(r.rate, 'transport')}</td>
                            <td>{r.qty}</td>
                            <td>{exchRate}</td>
                            <td>{formatPrice(r.net * ratio, 'transport')}</td>
                          </tr>
                        );
                      })}
                      <tr className="fw-bold">
                        <td colSpan="5">Total Transportation {ratio < 1 && `(${Math.round(ratio * 100)}% Share)`}</td>
                        <td>{formatPrice(familyTransportTotal, 'transport')}</td>
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
                        <th>Exch. Rate</th>
                        <th>Net (Allocated)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foodRows.length > 0 ? (
                        <>
                          {foodRows.map((r, i) => (
                            <tr key={i}>
                              <td>{r.title}</td>
                              <td>{riyalRate?.rate || 1}</td>
                              <td>{formatPrice(r.net * ratio, 'food')}</td>
                            </tr>
                          ))}
                          <tr className="fw-bold">
                            <td colSpan="2">Total Food Services {ratio < 1 && `(${Math.round(ratio * 100)}% Share)`}</td>
                            <td>{formatPrice(familyFoodTotal, 'food')}</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted">No food services selected</td>
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
                        <th>Exch. Rate</th>
                        <th>Net (Allocated)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ziaratRows.length > 0 ? (
                        <>
                          {ziaratRows.map((r, i) => (
                            <tr key={i}>
                              <td>{r.title}</td>
                              <td>{riyalRate?.rate || 1}</td>
                              <td>{formatPrice(r.net * ratio, 'ziarat')}</td>
                            </tr>
                          ))}
                          <tr className="fw-bold">
                            <td colSpan="2">Total Ziarat {ratio < 1 && `(${Math.round(ratio * 100)}% Share)`}</td>
                            <td>{formatPrice(familyZiaratTotal, 'ziarat')}</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted">No ziarat services selected</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>

                <div className="section-divider" />

                <section className="invoice-section">
                  <h5 className="section-title">Pilgrims & Tickets Detail</h5>
                  <table className="table pax-products-table">
                    <thead>
                      <tr>
                        <th>Pax</th>
                        <th>Total Pax</th>
                        <th>Visa Rate</th>
                        <th>Ticket Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Determine pax counts for this iteration
                        let iterAdults = 0;
                        let iterChildren = 0;
                        let iterInfants = 0;

                        if (!iter.isDefault && manualFamilies && manualFamilies[iterIndex]) {
                          const fam = manualFamilies[iterIndex];
                          iterAdults = parseInt(fam.adults || 0);
                          iterChildren = parseInt(fam.children || 0);
                          iterInfants = parseInt(fam.infants || 0);
                        } else if (iter.isDefault) {
                          iterAdults = parseInt(formData.totalAdults || 0);
                          iterChildren = parseInt(formData.totalChilds || 0);
                          iterInfants = parseInt(formData.totalInfants || 0);
                        } else {
                          // Fallback if manualFamilies missing but familyGroups exists (should rarely happen for manual mode)
                          // Approximate based on ratio, or just show 0 to avoid wrong info
                          iterAdults = Math.round((parseInt(formData.totalAdults || 0)) * ratio);
                          iterChildren = Math.round((parseInt(formData.totalChilds || 0)) * ratio);
                          iterInfants = Math.round((parseInt(formData.totalInfants || 0)) * ratio);
                        }

                        // Calculate total per family for table footer
                        const iterTotalPax = iterAdults + iterChildren + iterInfants;

                        return (
                          <>
                            {/* Adult Row */}
                            <tr>
                              <td>Adult</td>
                              <td>{iterAdults}</td>
                              <td>{formatPrice(convertToPKR(calculatedVisaPrices.adultPrice || 0, 'visa'), 'visa')}</td>
                              <td>{formatPrice(selectedFlight ? (selectedFlight.adult_selling_price || selectedFlight.adult_price || 0) : 0, 'flight')}</td>
                            </tr>
                            {/* Child Row */}
                            {iterChildren > 0 && (
                              <tr>
                                <td>Child</td>
                                <td>{iterChildren}</td>
                                <td>{formatPrice(convertToPKR(calculatedVisaPrices.childPrice || 0, 'visa'), 'visa')}</td>
                                <td>{formatPrice(selectedFlight ? (selectedFlight.child_selling_price || selectedFlight.child_price || 0) : 0, 'flight')}</td>
                              </tr>
                            )}
                            {/* Infant Row */}
                            {iterInfants > 0 && (
                              <tr>
                                <td>Infant</td>
                                <td>{iterInfants}</td>
                                <td>{formatPrice(convertToPKR(calculatedVisaPrices.infantPrice || 0, 'visa'), 'visa')}</td>
                                <td>{formatPrice(selectedFlight ? (selectedFlight.infant_selling_price || selectedFlight.infant_price || 0) : 0, 'flight')}</td>
                              </tr>
                            )}
                            {/* Total Row */}
                            <tr className="fw-bold bg-light">
                              <td>Total</td>
                              <td>{iterTotalPax}</td>
                              <td>{formatPrice(familyVisaCostPKR, 'visa')}</td>
                              <td>{formatPrice(familyFlightCostPKR, 'flight')}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </section>
              </div>
            </div>

            {/* Bottom full-width Invoice Details section FOR THIS FAMILY */}
            <div className="invoice-details-section">
              <h5 className="section-title">Invoice Summary {iter.isDefault ? '' : `(${iter.label})`}</h5>
              <div className="invoice-details" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 520px', minWidth: 300 }}>
                  <div className="summary-row"><span>Travel Date:</span><strong>{formatTravelString()}</strong></div>
                  <div className="summary-row"><span>Return Date:</span><strong>{formatReturnString()}</strong></div>
                  <div className="summary-row"><span>Invoice Date:</span><strong>{generateInvoiceDate()}</strong></div>
                </div>

                <div style={{ flex: '0 0 320px', minWidth: 260 }}>
                  <div className="summary-box">
                    <div className="tot-row"><span>{getCurrency('visa')} Rate: Visa @ {riyalRate?.rate ?? '—'}</span><strong>{formatPrice(familyVisaCost, 'visa')}</strong></div>
                    <div className="tot-row"><span>Tickets :</span><strong>PKR {familyFlightCost.toLocaleString()}</strong></div>
                    <div className="tot-row"><span>{getCurrency('hotel')} Rate: Hotel @ {riyalRate?.rate ?? '—'}</span><strong>{formatPrice(familyHotelTotal, 'hotel')}</strong></div>
                    <div className="tot-row"><span>{getCurrency('transport')} Rate: Transport @ {riyalRate?.rate ?? '—'}</span><strong>{formatPrice(familyTransportTotal, 'transport')}</strong></div>
                    {familyFoodTotal > 0 && <div className="tot-row"><span>Food Services :</span><strong>{formatPrice(familyFoodTotal, 'food')}</strong></div>}
                    {familyZiaratTotal > 0 && <div className="tot-row"><span>Ziarat Services :</span><strong>{formatPrice(familyZiaratTotal, 'ziarat')}</strong></div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <div className="net-badge">Net Total = <strong>PKR {familyNetPKR.toLocaleString()}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-break" style={{ pageBreakAfter: 'always', margin: '40px 0', borderTop: '2px dashed #ccc' }}></div>
          </div>
        );
      })}

      {/* GRAND TOTAL SUMMARY BLOCK */}
      <div className="grand-total-section p-4 bg-light rounded border mt-5">
        <h2 className="text-center text-success fw-bold text-uppercase mb-4">Grand Total Summary</h2>
        <div className="d-flex justify-content-center">
          <div className="card shadow-sm p-4" style={{ minWidth: '400px' }}>
            <div className="d-flex justify-content-between mb-2">
              <span className="fw-bold">Total Visa Cost:</span>
              <span>PKR {visaCostPKR.toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="fw-bold">Total Tickets Cost:</span>
              <span>PKR {flightCostPKR.toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="fw-bold">Total Accommodation:</span>
              <span>PKR {hotelTotalPKR.toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="fw-bold">Total Transport:</span>
              <span>PKR {transportTotalPKR.toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="fw-bold">Total Food:</span>
              <span>PKR {foodTotalPKR.toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="fw-bold">Total Ziarat:</span>
              <span>PKR {ziaratTotalPKR.toLocaleString()}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between mt-2">
              <span className="h4 fw-bold text-success">Grand Net Total:</span>
              <span className="h4 fw-bold text-success">PKR {netPKR.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

    </div >
  );
};

export default InvoicePrint;
