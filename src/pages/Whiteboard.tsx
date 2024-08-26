import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';  // Import useLocation
import { Stage, Layer, Line } from 'react-konva';
import { Button, Container } from 'react-bootstrap';
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

    const query = useQuery();
    const username = query.get('username');  // Get username from query params
    const roomId = query.get('roomId');      // Get roomId from query params

    const handleMouseDown = () => {
        setIsDrawing(true);
        const stage = stageRef.current;
        const pos = stage.getPointerPosition();
        setLines([...lines, { tool, color, lineWidth, points: [pos.x, pos.y] }]);
    };

    const handleMouseMove = () => {
        if (!isDrawing) return;
        const stage = stageRef.current;
        const point = stage.getPointerPosition();
        const lastLine = lines[lines.length - 1];
        lastLine.points = lastLine.points.concat([point.x, point.y]);
        lines.splice(lines.length - 1, 1, lastLine);
        setLines([...lines]);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    return (
        <Container fluid className="whiteboard-container">
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
