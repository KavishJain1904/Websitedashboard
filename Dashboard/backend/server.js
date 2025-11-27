const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const analyticsData = google.analyticsdata('v1beta');
const key = require('./service-account.json');

const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: 'https://www.googleapis.com/auth/analytics.readonly',
});

const propertyId = '495329912';

app.get('/realtime', async (req, res) => {
    try {
        const authClient = await auth.getClient();
        const response = await analyticsData.properties.runRealtimeReport({
            property: `properties/${propertyId}`,
            auth: authClient,
            requestBody: {
                dimensions: [{ name: 'country' }],
                metrics: [{ name: 'activeUsers' }]
            }
        });
        res.json(response.data || {});
        console.log('Realtime data sent:', response.data);
    } catch (error) {
        console.error('Error fetching realtime analytics:', error);
        res.status(500).send('Failed to fetch realtime data');
    }
});

app.get('/realtime-pages', async (req, res) => {
    try {
        const authClient = await auth.getClient();
        const response = await analyticsData.properties.runRealtimeReport({
            property: `properties/${propertyId}`,
            auth: authClient,
            requestBody: {
                dimensions: [{ name: 'unifiedScreenName' }],
                metrics: [{ name: 'activeUsers' }]
            }
        });
        res.json(response.data || {});
        console.log('Realtime page data sent:', response.data);
    } catch (error) {
        console.error('Error fetching realtime page analytics:', error);
        res.status(500).json({
            error: 'Failed to fetch realtime page data',
            details: error.message
        });
    }
});

app.get('/page-views', async (req, res) => {
    try {
        const authClient = await auth.getClient();
        const { startDate = '7daysAgo', endDate = 'today' } = req.query;
        const response = await analyticsData.properties.runReport({
            property: `properties/${propertyId}`,
            auth: authClient,
            requestBody: {
                dateRanges: [{ startDate, endDate }],
                dimensions: [
                    { name: 'pagePath' },
                    { name: 'pageTitle' }
                ],
                metrics: [
                    { name: 'screenPageViews' },
                    { name: 'sessions' },
                    { name: 'activeUsers' }
                ],
                orderBys: [
                    { metric: { metricName: 'screenPageViews' }, desc: true }
                ]
            }
        });
        res.json(response.data || {});
        console.log('Page views data sent');
    } catch (error) {
        console.error('Error fetching page views:', error);
        res.status(500).send('Failed to fetch page views data');
    }
});

app.get('/dashboard-data', async (req, res) => {
    try {
        const authClient = await auth.getClient();
        const { startDate = '7daysAgo', endDate = 'today' } = req.query;
        const [realtimeCountry, realtimePages, historicalPages, topEvents] = await Promise.all([
            analyticsData.properties.runRealtimeReport({
                property: `properties/${propertyId}`,
                auth: authClient,
                requestBody: {
                    dimensions: [{ name: 'country' }],
                    metrics: [{ name: 'activeUsers' }]
                }
            }),
            analyticsData.properties.runRealtimeReport({
                property: `properties/${propertyId}`,
                auth: authClient,
                requestBody: {
                    dimensions: [
                        { name: 'pagePath' },
                        { name: 'pageTitle' }
                    ],
                    metrics: [{ name: 'activeUsers' }]
                }
            }),
            analyticsData.properties.runReport({
                property: `properties/${propertyId}`,
                auth: authClient,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [
                        { name: 'pagePath' },
                        { name: 'pageTitle' }
                    ],
                    metrics: [
                        { name: 'screenPageViews' },
                        { name: 'sessions' }
                    ],
                    orderBys: [
                        { metric: { metricName: 'screenPageViews' }, desc: true }
                    ]
                }
            }),
            analyticsData.properties.runReport({
                property: `properties/${propertyId}`,
                auth: authClient,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: 'eventName' }],
                    metrics: [{ name: 'eventCount' }],
                    orderBys: [
                        { metric: { metricName: 'eventCount' }, desc: true }
                    ]
                }
            })
        ]);
        const dashboardData = {
            realtimeByCountry: realtimeCountry.data || {},
            realtimeByPages: realtimePages.data || {},
            historicalPages: historicalPages.data || {},
            topEvents: topEvents.data || {},
            lastUpdated: new Date().toISOString()
        };
        res.json(dashboardData);
        console.log('Dashboard data sent');
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Failed to fetch dashboard data');
    }
});

app.get('/page-performance', async (req, res) => {
    try {
        const authClient = await auth.getClient();
        const { startDate = '7daysAgo', endDate = 'today' } = req.query;
        const response = await analyticsData.properties.runReport({
            property: `properties/${propertyId}`,
            auth: authClient,
            requestBody: {
                dateRanges: [{ startDate, endDate }],
                dimensions: [
                    { name: 'pagePath' },
                    { name: 'pageTitle' }
                ],
                metrics: [
                    { name: 'screenPageViews' },
                    { name: 'sessions' },
                    { name: 'activeUsers' },
                    { name: 'averageSessionDuration' },
                    { name: 'bounceRate' }
                ],
                orderBys: [
                    { metric: { metricName: 'screenPageViews' }, desc: true }
                ]
            }
        });
        res.json(response.data || {});
        console.log('Page performance data sent');
    } catch (error) {
        console.error('Error fetching page performance:', error);
        res.status(500).send('Failed to fetch page performance data');
    }
});

app.listen(port, () => {
    console.log(`🚀 Analytics Server running at http://localhost:${port}`);
});
