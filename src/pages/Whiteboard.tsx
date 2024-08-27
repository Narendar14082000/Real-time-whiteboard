import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stage, Layer, Line, Circle } from 'react-konva';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { keycloak } from '../keycloak';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './Whiteboard.css';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const Whiteboard: React.FC = () => {
    const [lines, setLines] = useState<any[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#FFFFFF');
    const [lineWidth, setLineWidth] = useState(5);
    const stageRef = useRef<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const navigate = useNavigate();
    
    const [history, setHistory] = useState<any[]>([]); // For undo/redo functionality
    const [redoStack, setRedoStack] = useState<any[]>([]); // Redo stack
    const [cursors, setCursors] = useState<{ [key: string]: { x: number, y: number, color: string } }>({}); // Store cursor positions

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
            } else if (message.type === 'cursor-move') {
                setCursors(prevCursors => ({
                    ...prevCursors,
                    [message.username]: { x: message.x, y: message.y, color: message.color }
                }));
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

    const broadcastCursor = (x: number, y: number) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'cursor-move', roomId, username, x, y, color }));
        }
    };

    const handleMouseDown = () => {
        setIsDrawing(true);
        const stage = stageRef.current;
        const pos = stage.getPointerPosition();
        const newLine = { tool, color, lineWidth, points: [pos.x, pos.y] };
        setLines([...lines, newLine]);
        setHistory([...history, lines]);  // Save the current state in history
        setRedoStack([]); // Clear the redo stack
        broadcastDrawing(newLine);
    };

    const handleMouseMove = () => {
        const stage = stageRef.current;
        const point = stage.getPointerPosition();

        if (isDrawing) {
            const lastLine = lines[lines.length - 1];
            lastLine.points = lastLine.points.concat([point.x, point.y]);
            lines.splice(lines.length - 1, 1, lastLine);
            setLines([...lines]);
            broadcastDrawing(lastLine);
        }

        // Broadcast cursor position regardless of drawing
        broadcastCursor(point.x, point.y);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleUndo = () => {
        if (lines.length === 0) return;
        const lastState = lines.slice(0, -1);
        setRedoStack([...redoStack, lines]);
        setLines(lastState);
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        const nextState = redoStack[redoStack.length - 1];
        setLines(nextState);
        setRedoStack(redoStack.slice(0, -1));
    };

    const handleSaveAsImage = async () => {
        const stage = stageRef.current.getStage();
        const dataURL = stage.toDataURL({ pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = 'whiteboard.png';
        link.href = dataURL;
        link.click();
    };

    const handleSaveAsPDF = async () => {
        const stage = stageRef.current.getStage();
        const dataURL = stage.toDataURL({ pixelRatio: 2 });

        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(dataURL);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(dataURL, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('whiteboard.pdf');
    };

    const handleLogout = () => {
        keycloak.logout();
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    return (
        <Container fluid className="whiteboard-container">
            {/* Header with Name and Room ID */}
            <Row className="header-row fixed-top">
                <Col className="header-col text-center">
                    <h2 className="header-title">Whiteboard Session</h2>
                    <p className="header-subtitle">
                        User: <span className="header-highlight">{username}</span> | Room ID: <span className="header-highlight">{roomId}</span>
                    </p>
                </Col>
            </Row>

            {/* Scrollable Drawing Area */}
            <div className="board-area">
            <div className="board-area-inner">
                <Stage
                    width={window.innerWidth}
                    height={window.innerHeight * 2}  // Adjusting height for scrollable area
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
                                stroke={line.tool === 'eraser' ? 'black' : line.color}
                                strokeWidth={line.lineWidth}
                                tension={0.5}
                                lineCap="round"
                                globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                            />
                        ))}
                        {/* Render Cursors for Other Users */}
                        {Object.keys(cursors).map((user, index) => (
                            <Circle
                                key={user}
                                x={cursors[user].x}
                                y={cursors[user].y}
                                radius={5}
                                fill={cursors[user].color}
                            />
                        ))}
                    </Layer>
                </Stage>
                </div>
            </div>

            {/* Tools at Bottom */}
            <div className="tools-bar fixed-bottom d-flex justify-content-center">
                
                <Button variant="light" onClick={handleUndo} className="tool-button">Undo</Button>
                <Button variant="light" onClick={handleRedo} className="tool-button">Redo</Button>
                <Button variant="light" onClick={() => setTool('pen')} className="tool-button">Pen</Button>
                <Button variant="light" onClick={() => setTool('eraser')} className="tool-button">Eraser</Button>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="tool-color-picker" />
                <input
                    type="range"
                    min="1"
                    max="30"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                    className="tool-slider"
                />
                <Button variant="light" onClick={handleSaveAsImage} className="tool-button">Save as Image</Button>
                <Button variant="light" onClick={handleSaveAsPDF} className="tool-button">Save as PDF</Button>
                
            </div>
        </Container>
    );
};

export default Whiteboard;
