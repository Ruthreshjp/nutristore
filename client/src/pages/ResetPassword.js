    import React, { useState, useEffect } from 'react';
    import { useSearchParams, useNavigate } from 'react-router-dom';
    import axios from 'axios';

    function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (!urlToken) {
        setMessage('Invalid or missing reset token.');
        } else {
        setToken(urlToken);
        }
    }, [searchParams]);

    const handleReset = async () => {
        if (!token || !newPassword || !confirm) {
        return setMessage('All fields are required.');
        }

        if (newPassword !== confirm) {
        return setMessage('Passwords do not match.');
        }

        try {
        const res = await axios.post('http://localhost:5000/api/reset-password', {
            token,
            newPassword,
            confirmPassword: confirm,
        });

        setMessage(res.data.message || 'Password reset successful!');
        setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
        setMessage(`Error: ${err.response?.data?.message || err.message}`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md border border-blue-500/30">
            <h2 className="text-2xl font-bold text-blue-400 mb-4 text-center">Reset Your Password</h2>
            <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-700 text-white border border-blue-500/30 rounded"
            />
            <input
            type="password"
            placeholder="Confirm New Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-700 text-white border border-blue-500/30 rounded"
            />
            <button
            onClick={handleReset}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-800 transition-all duration-300"
            >
            Reset Password
            </button>
            {message && <p className="mt-4 text-center text-gray-300">{message}</p>}
        </div>
        </div>
    );
    }

    export default ResetPassword;
