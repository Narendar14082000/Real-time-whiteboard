import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { Stage, Layer, Line } from 'react-konva';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { keycloak } from '../keycloak';
import './Whiteboard.css';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const Whiteboard: React.FC = () => {
    const [lines, setLines] = useState<any[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const stageRef = useRef<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const navigate = useNavigate();

    const query = useQuery();
    const username = query.get('username');  
    const roomId = query.get('roomId');      

    useEffect(() => {
        if (!roomId || !username) {
            navigate('/');  
            return;
        }

        const ws = new WebSocket('ws://localhost:3000');
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'join', roomId, username }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'drawing') {
                setLines((prevLines) => [...prevLines, message.line]);
            } else if (message.type === 'room-lines') {
                setLines(message.lines);
            } else if (message.type === 'user-joined') {
                console.log(`${message.username} joined the room.`);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed.');
        };

        return () => {
            ws.close();
        };
    }, [roomId, username, navigate]);

    const broadcastDrawing = (line: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'drawing', roomId, line }));
        }
    };

    const handleMouseDown = () => {
        setIsDrawing(true);
        const stage = stageRef.current;
        const pos = stage.getPointerPosition();
        const newLine = { tool, color, lineWidth, points: [pos.x, pos.y] };
        setLines([...lines, newLine]);
        broadcastDrawing(newLine);
    };

    const handleMouseMove = () => {
        if (!isDrawing) return;
        const stage = stageRef.current;
        const point = stage.getPointerPosition();
        const lastLine = lines[lines.length - 1];
        lastLine.points = lastLine.points.concat([point.x, point.y]);
        lines.splice(lines.length - 1, 1, lastLine);
        setLines([...lines]);
        broadcastDrawing(lastLine);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleLogout = () => {
        keycloak.logout();
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    return (
        <Container fluid className="whiteboard-container">
            <Row className="mb-4">
                
                <Col className="d-flex justify-content-end">
                <Button variant="secondary" onClick={handleBackToHome}>
                        Back to Home
                    </Button>
                    <Button variant="danger" onClick={handleLogout}>
                        Logout
                    </Button>
                </Col>
            </Row>
            <div className="header text-center mb-4">
                <h2>Welcome, {username}! Room ID: {roomId}</h2>
            </div>
            <div className="tools">
                <Button onClick={() => setTool('pen')}>Pen</Button>
                <Button onClick={() => setTool('eraser')}>Eraser</Button>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                <input
                    type="range"
                    min="1"
                    max="30"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                />
            </div>
            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                ref={stageRef}
            >
                <Layer>
                    {lines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke={line.tool === 'eraser' ? 'white' : line.color}
                            strokeWidth={line.lineWidth}
                            tension={0.5}
                            lineCap="round"
                            globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                        />
                    ))}
                </Layer>
            </Stage>
        </Container>
    );
};

export default Whiteboard;
