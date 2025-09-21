import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address_details: '',
    city: '',
    state: '',
    pin_code: ''
  });
  const [addressErrors, setAddressErrors] = useState({});

  useEffect(() => {
    fetchCustomerDetails();
    fetchAddresses();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      const response = await axios.get(`https://qwipo-customer-management-api.vercel.app/customers/${id}`);
      setCustomer(response.data.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      alert('Failed to fetch customer details');
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`https://qwipo-customer-management-api.vercel.app/customers/${id}/addresses`);
      setAddresses(response.data.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      alert('Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      await axios.delete(`https://qwipo-customer-management-api.vercel.app/customers/${id}`);
      alert('Customer deleted successfully');
      navigate('/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (addressErrors[name]) {
      setAddressErrors({
        ...addressErrors,
        [name]: ''
      });
    }
  };

  const validateAddressForm = () => {
    const newErrors = {};
    
    if (!addressForm.address_details.trim()) {
      newErrors.address_details = 'Address details are required';
    }
    
    if (!addressForm.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!addressForm.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!addressForm.pin_code.trim()) {
      newErrors.pin_code = 'PIN code is required';
    }
    
    setAddressErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    
    if (!validateAddressForm()) {
      return;
    }
    
    try {
      await axios.post(`https://qwipo-customer-management-api.vercel.app/customers/${id}/addresses`, addressForm);
      alert('Address added successfully');
      setShowAddressForm(false);
      setAddressForm({
        address_details: '',
        city: '',
        state: '',
        pin_code: ''
      });
      fetchAddresses();
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await axios.delete(`https://qwipo-customer-management-api.vercel.app/addresses/${addressId}`);
      alert('Address deleted successfully');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    }
  };

  if (loading) {
    return <div>Loading customer details...</div>;
  }

  if (!customer) {
    return <div>Customer not found</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Customer Details</h2>
        <div>
          <Link to={`/customers/${id}/edit`} className="btn btn-edit">
            Edit Customer
          </Link>
          <button onClick={handleDeleteCustomer} className="btn btn-delete">
            Delete Customer
          </button>
        </div>
      </div>

      <div className="customer-details">
        <h3>{customer.first_name} {customer.last_name}</h3>
        <p><strong>Phone:</strong> {customer.phone_number}</p>
        <p><strong>Customer ID:</strong> {customer.id}</p>
      </div>

      <div className="addresses-section">
        <div className="section-header">
          <h3>Addresses</h3>
          <button 
            onClick={() => setShowAddressForm(!showAddressForm)}
            className="btn btn-primary"
          >
            {showAddressForm ? 'Cancel' : 'Add New Address'}
          </button>
        </div>

        {showAddressForm && (
          <form onSubmit={handleAddAddress} className="address-form">
            <div className="form-group">
              <label htmlFor="address_details">Address Details:</label>
              <textarea
                id="address_details"
                name="address_details"
                value={addressForm.address_details}
                onChange={handleAddressChange}
                className={addressErrors.address_details ? 'error' : ''}
              />
              {addressErrors.address_details && (
                <span className="error-text">{addressErrors.address_details}</span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="city">City:</label>
              <input
                type="text"
                id="city"
                name="city"
                value={addressForm.city}
                onChange={handleAddressChange}
                className={addressErrors.city ? 'error' : ''}
              />
              {addressErrors.city && (
                <span className="error-text">{addressErrors.city}</span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="state">State:</label>
              <input
                type="text"
                id="state"
                name="state"
                value={addressForm.state}
                onChange={handleAddressChange}
                className={addressErrors.state ? 'error' : ''}
              />
              {addressErrors.state && (
                <span className="error-text">{addressErrors.state}</span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="pin_code">PIN Code:</label>
              <input
                type="text"
                id="pin_code"
                name="pin_code"
                value={addressForm.pin_code}
                onChange={handleAddressChange}
                className={addressErrors.pin_code ? 'error' : ''}
              />
              {addressErrors.pin_code && (
                <span className="error-text">{addressErrors.pin_code}</span>
              )}
            </div>
            
            <button type="submit">Add Address</button>
          </form>
        )}

        {addresses.length === 0 ? (
          <p>No addresses found for this customer.</p>
        ) : (
          <div className="addresses-list">
            {addresses.map((address) => (
              <div key={address.id} className="address-card">
                <p><strong>Address:</strong> {address.address_details}</p>
                <p><strong>City:</strong> {address.city}</p>
                <p><strong>State:</strong> {address.state}</p>
                <p><strong>PIN Code:</strong> {address.pin_code}</p>
                <button 
                  onClick={() => handleDeleteAddress(address.id)}
                  className="btn btn-delete"
                >
                  Delete Address
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDetailPage;
