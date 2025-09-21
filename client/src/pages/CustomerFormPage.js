import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const response = await axios.get(`https://qwipo-customer-management-api.vercel.app/customers/${id}`);
      setFormData(response.data.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      alert('Failed to fetch customer details');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Phone number must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEdit) {
        await axios.put(`https://qwipo-customer-management-api.vercel.app/customers/${id}`, formData);
        alert('Customer updated successfully');
      } else {
        await axios.post('https://qwipo-customer-management-api.vercel.app/customers', formData);
        alert('Customer created successfully');
      }
      navigate('/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to save customer');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h2>{isEdit ? 'Edit Customer' : 'Create New Customer'}</h2>
      
      <form onSubmit={handleSubmit} className="customer-form">
        <div className="form-group">
          <label htmlFor="first_name">First Name:</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={errors.first_name ? 'error' : ''}
          />
          {errors.first_name && <span className="error-text">{errors.first_name}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="last_name">Last Name:</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={errors.last_name ? 'error' : ''}
          />
          {errors.last_name && <span className="error-text">{errors.last_name}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="phone_number">Phone Number:</label>
          <input
            type="text"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className={errors.phone_number ? 'error' : ''}
          />
          {errors.phone_number && <span className="error-text">{errors.phone_number}</span>}
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEdit ? 'Update Customer' : 'Create Customer')}
          </button>
          <button type="button" onClick={() => navigate('/customers')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CustomerFormPage;
