import React, { useState } from 'react';
import { Modal, Button, Card, Row, Col, Badge, Table } from 'react-bootstrap';
import { CheckCircle, XCircle, Info, Star } from 'lucide-react';

const BrandedFareSelector = ({ show, onHide, flight, onSelectBrand }) => {
  const [selectedBrand, setSelectedBrand] = useState(null);

  if (!flight || !flight.brands || flight.brands.length === 0) {
    return null;
  }

  const handleSelectBrand = () => {
    if (selectedBrand) {
      onSelectBrand(selectedBrand);
      onHide();
    }
  };

  const formatPrice = (price, currency) => {
    return `${currency} ${parseFloat(price || 0).toLocaleString()}`;
  };

  const getBrandBadge = (brandName) => {
    const name = brandName.toLowerCase();
    if (name.includes('saver') || name.includes('light')) return 'secondary';
    if (name.includes('flex') || name.includes('plus')) return 'primary';
    if (name.includes('business') || name.includes('premium')) return 'success';
    return 'info';
  };

  const getBenefitIcon = (value) => {
    if (value === true || value === 'Yes' || value === 'Included') {
      return <CheckCircle size={16} className="text-success" />;
    }
    if (value === false || value === 'No' || value === 'Not Included') {
      return <XCircle size={16} className="text-danger" />;
    }
    return <Info size={16} className="text-warning" />;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Star size={24} className="me-2 text-warning" />
          Choose Your Fare Type
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <p className="text-muted mb-4">
          Select the fare that best suits your travel needs. Each fare type offers different benefits and flexibility.
        </p>

        <Row>
          {flight.brands.map((brand, index) => (
            <Col lg={4} md={6} key={index} className="mb-4">
              <Card 
                className={`h-100 ${selectedBrand?.brandId === brand.brandId ? 'border-primary shadow-lg' : 'border'}`}
                style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                onClick={() => setSelectedBrand(brand)}
              >
                <Card.Header className={`text-center ${selectedBrand?.brandId === brand.brandId ? 'bg-primary text-white' : 'bg-light'}`}>
                  <h5 className="mb-0">{brand.brandName}</h5>
                  <Badge bg={getBrandBadge(brand.brandName)} className="mt-2">
                    {brand.brandTier || 'Standard'}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <div className="text-center mb-3 pb-3 border-bottom">
                    <h3 className="mb-0 text-primary">
                      {formatPrice(brand.total, brand.currency)}
                    </h3>
                    <small className="text-muted">Total Fare</small>
                    <div className="mt-2">
                      <small className="text-muted d-block">
                        Base: {formatPrice(brand.baseFare, brand.currency)}
                      </small>
                      <small className="text-muted d-block">
                        Tax: {formatPrice(brand.tax, brand.currency)}
                      </small>
                    </div>
                  </div>

                  <h6 className="mb-3 text-secondary">Included Benefits:</h6>
                  
                  <div className="mb-2 d-flex align-items-center justify-content-between">
                    <span className="small">Baggage</span>
                    <strong className="small text-success">
                      {brand.baggage || brand.baggageAllowance || '20 KG'}
                    </strong>
                  </div>

                  <div className="mb-2 d-flex align-items-center justify-content-between">
                    <span className="small">Cabin Bag</span>
                    <strong className="small">
                      {brand.cabinBaggage || '7 KG'}
                    </strong>
                  </div>

                  <div className="mb-2 d-flex align-items-center justify-content-between">
                    <span className="small">Cancellation</span>
                    <span>
                      {getBenefitIcon(brand.cancellable || brand.refundable)}
                      <small className="ms-1">
                        {brand.cancellable || brand.refundable ? 'Allowed' : 'Not Allowed'}
                      </small>
                    </span>
                  </div>

                  <div className="mb-2 d-flex align-items-center justify-content-between">
                    <span className="small">Date Change</span>
                    <span>
                      {getBenefitIcon(brand.dateChangeable)}
                      <small className="ms-1">
                        {brand.dateChangeable ? 'Allowed' : 'Not Allowed'}
                      </small>
                    </span>
                  </div>

                  <div className="mb-2 d-flex align-items-center justify-content-between">
                    <span className="small">Seat Selection</span>
                    <span>
                      {getBenefitIcon(brand.seatSelection)}
                      <small className="ms-1">
                        {brand.seatSelection || 'Standard'}
                      </small>
                    </span>
                  </div>

                  {brand.meals && (
                    <div className="mb-2 d-flex align-items-center justify-content-between">
                      <span className="small">Meals</span>
                      <span>
                        {getBenefitIcon(brand.meals)}
                        <small className="ms-1">{brand.meals}</small>
                      </span>
                    </div>
                  )}

                  {brand.priority && (
                    <div className="mb-2 d-flex align-items-center justify-content-between">
                      <span className="small">Priority Boarding</span>
                      <span>
                        {getBenefitIcon(brand.priority)}
                      </span>
                    </div>
                  )}

                  {brand.lounge && (
                    <div className="mb-2 d-flex align-items-center justify-content-between">
                      <span className="small">Lounge Access</span>
                      <span>
                        {getBenefitIcon(brand.lounge)}
                      </span>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="text-center">
                  {selectedBrand?.brandId === brand.brandId && (
                    <Badge bg="primary" className="w-100 py-2">
                      <CheckCircle size={16} className="me-1" />
                      Selected
                    </Badge>
                  )}
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="mt-4 p-3 bg-light rounded">
          <h6 className="mb-2">
            <Info size={18} className="me-2" />
            Important Information
          </h6>
          <ul className="mb-0 small">
            <li>Prices are per person and include all taxes</li>
            <li>Baggage allowance is checked baggage (cabin bag separate)</li>
            <li>Cancellation and change fees may apply as per fare rules</li>
            <li>Seat selection availability subject to airline policy</li>
          </ul>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSelectBrand}
          disabled={!selectedBrand}
        >
          Continue with {selectedBrand ? selectedBrand.brandName : 'Selected Fare'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BrandedFareSelector;
