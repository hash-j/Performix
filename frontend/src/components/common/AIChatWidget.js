import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, IconButton, TextField, CircularProgress, Collapse, Fade } from '@mui/material';
import { SmartToy as RobotIcon, Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import api from '../../services/api';

const AIChatWidget = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'ai', text: "Hello! I'm your SaaS AI executive assistant. How can we optimize your business today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, open]);

    const handleSend = async (e) => {
        e.preventDefault();
        if(!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: userMsg });
            setMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error connecting to my core brain.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
            
            {/* The Chat Window */}
            <Fade in={open}>
                <Paper 
                    sx={{ 
                        width: 320, 
                        height: 480, 
                        mb: 2, 
                        bgcolor: '#262626', 
                        display: open ? 'flex' : 'none', 
                        flexDirection: 'column',
                        borderRadius: 3,
                        border: '1px solid #8C0303',
                        boxShadow: '0 8px 32px rgba(242, 5, 5, 0.4)',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ bgcolor: '#8C0303', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RobotIcon sx={{ color: 'white' }} />
                            <Typography variant="subtitle1" color="white" fontWeight="bold">Copilot</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Chat Area */}
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {messages.map((msg, idx) => (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                                <Box sx={{ 
                                    bgcolor: msg.sender === 'user' ? '#400106' : '#262626',
                                    color: 'white',
                                    p: 1.5,
                                    borderRadius: 2,
                                    maxWidth: '85%',
                                    border: msg.sender === 'ai' ? '1px solid #2d2d44' : 'none'
                                }}>
                                    <Typography variant="body2">{msg.text}</Typography>
                                </Box>
                            </Box>
                        ))}
                        {loading && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <Box sx={{ bgcolor: '#262626', color: 'white', p: 1.5, borderRadius: 2, border: '1px solid #2d2d44' }}>
                                    <CircularProgress size={16} sx={{ color: '#F20505' }} />
                                </Box>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Box component="form" onSubmit={handleSend} sx={{ p: 2, bgcolor: '#1a1a1a', display: 'flex', gap: 1 }}>
                        <TextField 
                            fullWidth 
                            size="small" 
                            placeholder="Ask about your KPIs..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                            sx={{ input: { color: 'white' } }}
                        />
                        <IconButton type="submit" color="primary" disabled={loading || !input.trim()}>
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Paper>
            </Fade>

            {/* Floating Action Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton 
                    onClick={() => setOpen(!open)}
                    sx={{ 
                        bgcolor: '#F20505', 
                        color: 'white',
                        width: 60,
                        height: 60,
                        boxShadow: '0 4px 20px rgba(242, 5, 5, 0.4)',
                        '&:hover': { bgcolor: '#ff4d4d' }
                    }}
                >
                    {open ? <CloseIcon /> : <RobotIcon />}
                </IconButton>
            </Box>
        </Box>
    );
};

export default AIChatWidget;
