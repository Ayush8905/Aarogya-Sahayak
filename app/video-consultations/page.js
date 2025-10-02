'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import VideoConsultationRoom from '@/components/VideoConsultationRoom';
import SimpleWebRTCService from '../../lib/simple-webrtc';
import {
    Calendar,
    Clock,
    User,
    Phone,
    VideoIcon,
    Plus,
    Filter,
    Search,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';

export default function VideoConsultationsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeConsultation, setActiveConsultation] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Fetch video consultations
    useEffect(() => {
        fetchConsultations();
    }, [filter]);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filter !== 'all') queryParams.append('status', filter);

            const response = await fetch(`/api/video-consultations?${queryParams}`);
            if (!response.ok) {
                throw new Error('Failed to fetch consultations');
            }

            const data = await response.json();
            setConsultations(data.consultations || []);
        } catch (error) {
            console.error('Error fetching consultations:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter consultations based on search term
    const filteredConsultations = consultations.filter(consultation => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        const patientName = consultation.patient?.name?.toLowerCase() || '';
        const doctorName = consultation.doctor?.name?.toLowerCase() || '';
        const consultationId = consultation.consultationId?.toLowerCase() || '';

        return patientName.includes(searchLower) ||
            doctorName.includes(searchLower) ||
            consultationId.includes(searchLower);
    });

    // Join consultation room
    const joinConsultation = async (consultation) => {
        try {
            // Check if consultation can be joined
            if (consultation.status === 'cancelled') {
                alert('This consultation has been cancelled');
                return;
            }

            if (consultation.status === 'completed') {
                alert('This consultation has already been completed');
                return;
            }

            // Set active consultation to show video room
            setActiveConsultation(consultation);
        } catch (error) {
            console.error('Error joining consultation:', error);
            alert('Failed to join consultation');
        }
    };

    // Leave consultation room
    const leaveConsultation = () => {
        setActiveConsultation(null);
        // Refresh consultations to get updated status
        fetchConsultations();
    };

    // Cancel consultation
    const cancelConsultation = async (consultationId) => {
        try {
            const response = await fetch(`/api/video-consultations/${consultationId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to cancel consultation');
            }

            alert('Consultation cancelled successfully');
            fetchConsultations();
        } catch (error) {
            console.error('Error cancelling consultation:', error);
            alert('Failed to cancel consultation');
        }
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const badges = {
            scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar },
            'in-progress': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            completed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
            cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
        };

        const badge = badges[status] || badges.scheduled;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // If in a consultation room, show the video interface
    if (activeConsultation) {
        return (
            <VideoConsultationRoom
                consultationId={activeConsultation.consultationId}
                roomId={activeConsultation.roomId}
                onLeave={leaveConsultation}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Consultations</h1>
                    <p className="text-gray-600">Manage your telemedicine appointments</p>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search consultations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Filter */}
                        <div className="flex items-center space-x-4">
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>

                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Schedule</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Consultations List */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Consultations</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchConsultations}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredConsultations.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <VideoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Consultations Found</h3>
                        <p className="text-gray-600 mb-6">
                            {searchTerm ? 'No consultations match your search.' : 'You haven\'t scheduled any video consultations yet.'}
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Schedule Consultation
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredConsultations.map((consultation) => (
                            <div key={consultation._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <VideoIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                Consultation #{consultation.consultationId}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {session?.user?.role === 'patient'
                                                    ? `Dr. ${consultation.doctor?.name}`
                                                    : consultation.patient?.name}
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(consultation.status)}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {formatDate(consultation.scheduledTime)}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="w-4 h-4 mr-2" />
                                        {consultation.duration ? `${consultation.duration} minutes` : 'Duration TBD'}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <User className="w-4 h-4 mr-2" />
                                        {consultation.callType === 'video' ? 'Video Call' : 'Audio Call'}
                                    </div>
                                </div>

                                {consultation.notes && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                                            {consultation.notes}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3">
                                    {consultation.status === 'scheduled' && (
                                        <>
                                            <button
                                                onClick={() => cancelConsultation(consultation.consultationId)}
                                                className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => joinConsultation(consultation)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                                            >
                                                <VideoIcon className="w-4 h-4" />
                                                <span>Join</span>
                                            </button>
                                        </>
                                    )}

                                    {consultation.status === 'in-progress' && (
                                        <button
                                            onClick={() => joinConsultation(consultation)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                        >
                                            <VideoIcon className="w-4 h-4" />
                                            <span>Rejoin</span>
                                        </button>
                                    )}

                                    {consultation.status === 'completed' && (
                                        <button
                                            onClick={() => router.push(`/dashboard/consultations/${consultation._id}`)}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                        >
                                            View Report
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Consultation Modal */}
            {showCreateModal && (
                <CreateConsultationModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchConsultations();
                    }}
                />
            )}
        </div>
    );
}

// Create Consultation Modal Component
function CreateConsultationModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        appointmentId: '',
        doctorId: '',
        scheduledTime: '',
        callType: 'video',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);

    useEffect(() => {
        // Fetch appointments and doctors
        fetchAppointments();
        fetchDoctors();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await fetch('/api/appointments');
            if (response.ok) {
                const data = await response.json();
                setAppointments(data.appointments || []);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await fetch('/api/users?role=worker');
            if (response.ok) {
                const data = await response.json();
                setDoctors(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/video-consultations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create consultation');
            }

            alert('Video consultation scheduled successfully!');
            onSuccess();
        } catch (error) {
            console.error('Error creating consultation:', error);
            alert('Failed to schedule consultation: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Schedule Video Consultation</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Appointment
                        </label>
                        <select
                            value={formData.appointmentId}
                            onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select appointment</option>
                            {appointments.map(apt => (
                                <option key={apt._id} value={apt._id}>
                                    {apt.title} - {new Date(apt.scheduledDate).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Doctor
                        </label>
                        <select
                            value={formData.doctorId}
                            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select doctor</option>
                            {doctors.map(doctor => (
                                <option key={doctor._id} value={doctor._id}>
                                    {doctor.name} - {doctor.specialization || 'General'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Scheduled Time
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.scheduledTime}
                            onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Call Type
                        </label>
                        <select
                            value={formData.callType}
                            onChange={(e) => setFormData({ ...formData, callType: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="video">Video Call</option>
                            <option value="audio">Audio Only</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            placeholder="Any special notes for the consultation..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Scheduling...' : 'Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}