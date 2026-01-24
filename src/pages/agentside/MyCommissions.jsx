import React, { useEffect, useState, useMemo } from 'react';
import { Container, Table, Button, Form, Badge, Card } from 'react-bootstrap';
import { Search, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import AgentSidebar from '../../components/AgentSidebar'; // Corrected Import
import AgentHeader from '../../components/AgentHeader';   // Added Header
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MyCommissions = () => {
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;
    const navigate = useNavigate();

    const getAccessToken = () => localStorage.getItem('agentAccessToken') || localStorage.getItem('accessToken'); // Use agent token

    const getAxiosInstance = () => {
        const token = getAccessToken();
        return axios.create({
            baseURL: 'http://127.0.0.1:8000/api/',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const axiosInstance = getAxiosInstance();
            const response = await axiosInstance.get('commissions/earnings/?my_only=true');
            setCommissions(response.data || []);
        } catch (error) {
            console.error('Failed to fetch commissions', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCommissions = useMemo(() => {
        return commissions.filter((c) => {
            const matchesSearch =
                !searchQuery ||
                (c.booking_id && c.booking_id.toString().includes(searchQuery)) ||
                (c.booking_number && c.booking_number.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = !statusFilter || c.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [commissions, searchQuery, statusFilter]);

    const paginatedCommissions = useMemo(() => {
        const startIndex = (currentPage - 1) * perPage;
        return filteredCommissions.slice(startIndex, startIndex + perPage);
    }, [filteredCommissions, currentPage]);

    const totalPages = Math.ceil(filteredCommissions.length / perPage);

    // Calculate totals
    const totalEarned = filteredCommissions.reduce((sum, c) => sum + parseFloat(c.commission_amount || 0), 0);
    const totalPaid = filteredCommissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + parseFloat(c.commission_amount || 0), 0);
    const totalPending = filteredCommissions
        .filter(c => c.status === 'pending' || c.status === 'earned')
        .reduce((sum, c) => sum + parseFloat(c.commission_amount || 0), 0);

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: 'warning', text: 'Pending' },
            earned: { bg: 'info', text: 'Earned' },
            paid: { bg: 'success', text: 'Paid' },
            cancelled: { bg: 'danger', text: 'Cancelled' },
        };
        const config = styles[status] || { bg: 'secondary', text: status };
        return <Badge bg={config.bg}>{config.text}</Badge>;
    };

    return (
        <div className="d-flex">
            <AgentSidebar />
            <div className="flex-grow-1" style={{ backgroundColor: '#F7F8FC', minHeight: '100vh', overflowX: 'hidden' }}>
                <AgentHeader />
                <Container fluid className="px-4 py-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h3 className="fw-bold mb-1" style={{ color: '#111827' }}>
                                My Commissions
                            </h3>
                            <p className="text-muted mb-0">
                                Track your earnings and commission history
                            </p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-md-4">
                            <Card className="border-0 shadow-sm h-100 bg-primary text-white">
                                <Card.Body>
                                    <div className="d-flex align-items-center mb-2">
                                        <div className="rounded-circle bg-white bg-opacity-25 p-2 me-3">
                                            <TrendingUp size={24} />
                                        </div>
                                        <h6 className="mb-0 opacity-75">Total Earnings</h6>
                                    </div>
                                    <h2 className="fw-bold mb-0">PKR {totalEarned.toLocaleString()}</h2>
                                </Card.Body>
                            </Card>
                        </div>
                        <div className="col-md-4">
                            <Card className="border-0 shadow-sm h-100 bg-success text-white">
                                <Card.Body>
                                    <div className="d-flex align-items-center mb-2">
                                        <div className="rounded-circle bg-white bg-opacity-25 p-2 me-3">
                                            <CheckCircle size={24} />
                                        </div>
                                        <h6 className="mb-0 opacity-75">Paid Out</h6>
                                    </div>
                                    <h2 className="fw-bold mb-0">PKR {totalPaid.toLocaleString()}</h2>
                                </Card.Body>
                            </Card>
                        </div>
                        <div className="col-md-4">
                            <Card className="border-0 shadow-sm h-100 bg-warning text-dark">
                                <Card.Body>
                                    <div className="d-flex align-items-center mb-2">
                                        <div className="rounded-circle bg-white bg-opacity-25 p-2 me-3">
                                            <Clock size={24} />
                                        </div>
                                        <h6 className="mb-0 opacity-75">Pending Payout</h6>
                                    </div>
                                    <h2 className="fw-bold mb-0">PKR {totalPending.toLocaleString()}</h2>
                                </Card.Body>
                            </Card>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body>
                            <div className="d-flex gap-3 align-items-center flex-wrap">
                                <div className="input-group" style={{ maxWidth: '300px' }}>
                                    <span className="input-group-text bg-white border-end-0">
                                        <Search size={18} className="text-muted" />
                                    </span>
                                    <Form.Control
                                        placeholder="Search Booking ID..."
                                        className="border-start-0"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Form.Select
                                    style={{ maxWidth: '200px' }}
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="earned">Earned</option>
                                    <option value="paid">Paid</option>
                                    <option value="cancelled">Cancelled</option>
                                </Form.Select>
                                {(searchQuery || statusFilter) && (
                                    <Button
                                        variant="link"
                                        className="text-decoration-none text-muted"
                                        onClick={() => { setSearchQuery(''); setStatusFilter(''); }}
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Table */}
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="p-0">
                            <Table hover responsive className="mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="py-3 ps-4 border-0">Date</th>
                                        <th className="py-3 border-0">Booking Details</th>
                                        <th className="py-3 border-0">Service</th>
                                        <th className="py-3 border-0 text-end">Amount</th>
                                        <th className="py-3 border-0 text-center">Status</th>
                                        <th className="py-3 pe-4 border-0">Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginatedCommissions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5 text-muted">
                                                No commissions found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedCommissions.map((comm) => (
                                            <tr key={comm.id}>
                                                <td className="ps-4">
                                                    <div className="fw-medium">
                                                        {new Date(comm.created_at).toLocaleDateString()}
                                                    </div>
                                                    <small className="text-muted">
                                                        {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </small>
                                                </td>
                                                <td>
                                                    <div className="fw-bold text-primary">
                                                        #{comm.booking_number || comm.booking_id || '-'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg="light" text="dark" className="border">
                                                        {comm.service_type || 'General'}
                                                    </Badge>
                                                </td>
                                                <td className="text-end fw-bold">
                                                    PKR {parseFloat(comm.commission_amount).toLocaleString()}
                                                </td>
                                                <td className="text-center">
                                                    {getStatusBadge(comm.status)}
                                                </td>
                                                <td className="pe-4 text-muted small">
                                                    {comm.id}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                        {totalPages > 1 && (
                            <Card.Footer className="bg-white border-0 py-3">
                                <div className="d-flex justify-content-center">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="me-2"
                                    >
                                        Previous
                                    </Button>
                                    <span className="align-self-center mx-2 text-muted">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="ms-2"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </Card.Footer>
                        )}
                    </Card>

                </Container>
            </div>
        </div>
    );
};

export default MyCommissions;
