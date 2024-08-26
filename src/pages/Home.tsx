import React, { useState } from 'react';
import { Button, Form, Container, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { keycloak } from '../keycloak';  // Import keycloak instance

const Home: React.FC = () => {
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [error, setError] = useState('');  // State for error messages
    const navigate = useNavigate();

    const authenticatedUsername = keycloak.tokenParsed?.preferred_username;  // Get authenticated username from Keycloak

    const handleJoinRoom = () => {
        if (username === authenticatedUsername) {
            // Navigate to the whiteboard with username and roomId as query params
            navigate(`/whiteboard?username=${username}&roomId=${roomId}`);
        } else {
            setError('Username does not match the authenticated user. Please enter the correct username.');
        }
    };

    const handleCreateRoom = () => {
        if (username === authenticatedUsername) {
            // Generate a unique Room ID and navigate to the whiteboard
            const newRoomId = Math.random().toString(36).substring(2, 10);
            navigate(`/whiteboard?username=${username}&roomId=${newRoomId}`);
        } else {
            setError('Username does not match the authenticated user. Please enter the correct username.');
        }
    };

    return (
        <div className="main-container">
            <Container className="d-flex flex-column justify-content-center align-items-center h-100">
                <div className="header-section text-center mb-5">
                    <h1 className="app-title">Collaborative Whiteboard</h1>
                    <p className="text-muted">Join a room to collaborate or create your own session!</p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}  {/* Display error if any */}

                <Form className="form-section w-100" style={{ maxWidth: '500px' }}>
                    <Form.Group className="mb-4">
                        <Form.Label>User Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Row>
                        <Col>
                            <Form.Group className="mb-4">
                                <Form.Label>Room ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter Room ID"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="d-grid gap-2 mb-4">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleJoinRoom}
                            disabled={!username || !roomId}
                        >
                            Join Room
                        </Button>
                    </div>
                    <div className="text-center mb-4">or</div>
                    <div className="d-grid gap-2">
                        <Button
                            variant="success"
                            size="lg"
                            onClick={handleCreateRoom}
                            disabled={!username}
                        >
                            Create New Room
                        </Button>
                    </div>
                </Form>
            </Container>
        </div>
    );
};

export default Home;
