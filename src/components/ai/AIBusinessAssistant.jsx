/**
 * AI Business Assistant - Chat interface and insights display
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import axios from '../../utils/axios';

import { Iconify } from 'src/components/iconify';

const AIIcon = (props) => <Iconify icon="solar:brain-bold" width={20} {...props} />;
const TrendIcon = (props) => <Iconify icon="solar:chart-2-bold" width={20} {...props} />;
const WarningIcon = (props) => <Iconify icon="solar:danger-triangle-bold" width={20} {...props} />;
const IdeaIcon = (props) => <Iconify icon="solar:lightbulb-bold" width={20} {...props} />;
const SendIcon = (props) => <Iconify icon="solar:plain-2-bold" width={20} {...props} />;
const ExpandIcon = (props) => <Iconify icon="solar:alt-arrow-down-bold" width={20} {...props} />;
const SparkleIcon = (props) => <Iconify icon="solar:stars-bold" width={20} {...props} />;

const AIBusinessAssistant = ({ companyId }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [anomalies, setAnomalies] = useState(null);
  
  // Chat interface
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchAIData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const fetchAIData = async () => {
    try {
      setLoading(true);
      const [insightsRes, predictionsRes, recommendationsRes, anomaliesRes] = await Promise.all([
        axios.get(`/api/ai/insights/${companyId}?period_days=90`),
        axios.get(`/api/ai/predictions/revenue/${companyId}?forecast_days=30`),
        axios.get(`/api/ai/recommendations/${companyId}?context=general`),
        axios.get(`/api/ai/anomalies/${companyId}?period_days=30`)
      ]);

      setInsights(insightsRes.data);
      setPredictions(predictionsRes.data);
      setRecommendations(recommendationsRes.data.recommendations || []);
      setAnomalies(anomaliesRes.data);
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    try {
      setChatLoading(true);
      const response = await axios.post('/api/ai/ask', {
        company_id: companyId,
        question,
      });

      setChatHistory([
        ...chatHistory,
        { type: 'question', text: question },
        { type: 'answer', data: response.data }
      ]);
      setQuestion('');
    } catch (error) {
      console.error('Failed to ask question:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    return 'info';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AIIcon sx={{ fontSize: 40 }} color="primary" />
        <div>
          <Typography variant="h5">AI Business Assistant</Typography>
          <Typography variant="body2" color="text.secondary">
            Powered by GPT-4 • Real-time insights and predictions
          </Typography>
        </div>
      </Box>

      {/* Business Health Score */}
      {insights && (
        <Card sx={{ mb: 3, background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`, color: 'white' }}>
          <Box p={3}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h3" gutterBottom>
                  {insights.health_score}/100
                </Typography>
                <Typography variant="h6">Business Health Score</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                  {insights.summary}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  <Chip
                    icon={<TrendIcon />}
                    label={`Trend: ${insights.trend}`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                  <Chip
                    label={`${insights.strengths?.length || 0} Strengths`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                  <Chip
                    label={`${insights.concerns?.length || 0} Concerns`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Revenue Predictions */}
        <Grid item xs={12} md={6}>
          <Card>
            <Box p={2} borderBottom={1} borderColor="divider">
              <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                <TrendIcon color="primary" />
                Revenue Prediction (Next 30 Days)
              </Typography>
            </Box>
            <Box p={3}>
              {predictions && !predictions.error ? (
                <>
                  <Typography variant="h3" color="primary" gutterBottom>
                    ${predictions.next_30_days_prediction?.toLocaleString() || 'N/A'}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={predictions.confidence_level * 100}
                    sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Confidence: {(predictions.confidence_level * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Daily Average: ${predictions.daily_average_prediction?.toLocaleString()}
                  </Typography>
                  
                  {predictions.key_factors && predictions.key_factors.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>Key Factors:</Typography>
                      {predictions.key_factors.map((factor, index) => (
                        <Chip key={index} label={factor} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </Box>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  {predictions?.error || 'Insufficient data for prediction'}
                </Alert>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Anomaly Detection */}
        <Grid item xs={12} md={6}>
          <Card>
            <Box p={2} borderBottom={1} borderColor="divider">
              <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                <WarningIcon color="warning" />
                Anomaly Detection
              </Typography>
            </Box>
            <Box p={3}>
              {anomalies && anomalies.anomalies_detected > 0 ? (
                <>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Chip
                      label={`${anomalies.anomalies_detected} Detected`}
                      color={anomalies.severity === 'high' ? 'error' : anomalies.severity === 'medium' ? 'warning' : 'info'}
                    />
                    <Chip label={`Severity: ${anomalies.severity}`} />
                  </Stack>

                  {anomalies.findings?.map((finding, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandIcon />}>
                        <Typography variant="subtitle2">{finding.type.replace('_', ' ').toUpperCase()}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" paragraph>
                          {finding.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Recommendation: {finding.recommendation}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </>
              ) : (
                <Alert severity="success" icon={<SparkleIcon />}>
                  {anomalies?.overall_assessment || 'No anomalies detected. Everything looks normal!'}
                </Alert>
              )}
            </Box>
          </Card>
        </Grid>

        {/* AI Recommendations */}
        <Grid item xs={12}>
          <Card>
            <Box p={2} borderBottom={1} borderColor="divider">
              <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                <IdeaIcon color="warning" />
                AI-Powered Recommendations
              </Typography>
            </Box>
            <Box p={2}>
              <Grid container spacing={2}>
                {recommendations.map((rec, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Stack direction="row" spacing={1} mb={1}>
                        <Chip
                          label={rec.priority}
                          size="small"
                          color={getPriorityColor(rec.priority)}
                        />
                        <Chip label={rec.difficulty} size="small" variant="outlined" />
                      </Stack>
                      <Typography variant="subtitle2" gutterBottom>
                        {rec.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {rec.description}
                      </Typography>
                      <Typography variant="caption" color="primary">
                        Expected Impact: {rec.expected_impact}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Card>
        </Grid>

        {/* Chat Interface */}
        <Grid item xs={12}>
          <Card>
            <Box p={2} borderBottom={1} borderColor="divider">
              <Typography variant="h6">Ask the AI Assistant</Typography>
              <Typography variant="body2" color="text.secondary">
                Ask questions about your business in natural language
              </Typography>
            </Box>
            <Box p={2}>
              {/* Chat History */}
              <Box mb={2} maxHeight="300px" overflow="auto">
                {chatHistory.map((msg, index) => (
                  <Box key={index} mb={2}>
                    {msg.type === 'question' ? (
                      <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white', ml: 4 }}>
                        <Typography variant="body2">{msg.text}</Typography>
                      </Paper>
                    ) : (
                      <Paper variant="outlined" sx={{ p: 2, mr: 4 }}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          {msg.data.answer}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {msg.data.explanation}
                        </Typography>
                        {msg.data.recommendation && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            {msg.data.recommendation}
                          </Alert>
                        )}
                      </Paper>
                    )}
                  </Box>
                ))}
              </Box>

              {/* Input */}
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., What were my best selling products last month?"
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                  disabled={chatLoading}
                />
                <IconButton
                  color="primary"
                  onClick={handleAskQuestion}
                  disabled={chatLoading || !question.trim()}
                >
                  {chatLoading ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              </Stack>

              <Box mt={1}>
                <Typography variant="caption" color="text.secondary">
                  Examples: &quot;Should I restock Product X?&quot; &bull; &quot;What&apos;s my profit trend?&quot; &bull; &quot;Which store performs best?&quot;
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIBusinessAssistant;
