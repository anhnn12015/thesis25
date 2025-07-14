import React, { useState, useEffect } from 'react';
import { Button, Table, Form, FormControl, Modal } from 'react-bootstrap';
import Sidebar from './Sidebar';
import axios from 'axios';
import '../styles/usermanagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]); // State to store users data
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [filteredUsers, setFilteredUsers] = useState([]); // State to store filtered users data
  const [selectedUserId, setSelectedUserId] = useState(null); // State to store selected user ID for modal display
  const [selectedUser, setSelectedUser] = useState(null); // State to store selected user data
  const [showModal, setShowModal] = useState(false); // State to control modal display

  // Function to fetch all users from backend
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/user/users`);
      setUsers(response.data); // Update users state with fetched data
      setFilteredUsers(response.data); // Update filteredUsers state with fetched data initially
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Effect to fetch users data on component mount
  useEffect(() => {
    fetchUsers();
  }, []); // Effect runs only once on mount

  // Function to handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value); // Update search query state
  };

  // Function to handle search button click
  const handleSearch = () => {
    const searchTerm = searchQuery.toLowerCase();
    const filtered = users.filter(user => user.username.toLowerCase().includes(searchTerm));
    setFilteredUsers(filtered);
  };

  // Function to fetch user details from backend and display modal
  const fetchUserDetails = async (username) => {
    try {
      const response = await axios.get(`http://localhost:8080/user/user/${username}`);
      setSelectedUser(response.data); // Update selectedUser state with fetched user data
      setShowModal(true); // Show modal after fetching user details
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Function to delete a user by username
  const deleteUser = async (username) => {
    try {
      await axios.delete(`http://localhost:8080/user/user/${username}`);
      fetchUsers(); // Refresh users data after deletion
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Function to handle updating user status
  const updateUserStatus = async (id) => {
    try {
      await axios.post(`http://localhost:8080/user/status`, { id_user: id });
      fetchUsers(); // Refresh users data after updating status
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="content-container">
      <Sidebar />
      <div className="content">
        <h2>Quản lý Người dùng</h2>
        <div className="user-search">
          <div className="d-flex">
            <FormControl
              id="searchInput"
              type="text"
              placeholder="Tìm kiếm theo tên người dùng..."
              className="form-control"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Button className="btn btn-outline-success ml-2" onClick={handleSearch}>Tìm kiếm</Button>
          </div>
        </div>
        <div className="user-table">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
                <th>Role ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={user.status === 'online' ? 'status-online' : 'status-offline'}>
                      {user.status}
                    </span>
                  </td>
                  <td>{user.roleID}</td>
                  <td>
                    <Button variant="info" onClick={() => { fetchUserDetails(user.username); setSelectedUserId(user.id); }}>
                      Information
                    </Button>{' '}
                    <Button variant="danger" onClick={() => deleteUser(user.username)}>Delete</Button>{' '}
                    <Button variant="primary" onClick={() => updateUserStatus(user.id)}>Update Status</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        {/* Modal to display user details */}
        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Thông tin người dùng</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedUser && (
              <div className='color-black'>
                <p><strong>Username:</strong> {selectedUser.username}</p>
                <p><strong>Firstname:</strong> {selectedUser.firstname}</p>
                <p><strong>Lastname:</strong> {selectedUser.lastname}</p>
                <p><strong>DoB:</strong> {selectedUser.DoB}</p>
                <p><strong>Phone:</strong> {selectedUser.phone}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Address:</strong> {selectedUser.address}</p>
                <p><strong>Role ID:</strong> {selectedUser.roleID}</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Đóng</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default UserManagement;
