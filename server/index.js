const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/cashier',   require('./routes/cashier'));
app.use('/api/pdf',       require('./routes/pdf'));
app.use('/api/client',    require('./routes/clientRoutes'));
app.use('/api/settings',  require('./routes/settingsRoutes'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stock-receipts', require('./routes/stockReceipts'));
app.use('/api/manager-notifications', require('./routes/managerNotifications'));
app.use('/api/storekeeper-notifications', require('./routes/storekeeperNotifications'));
app.use('/api/pdf', require('./routes/pdf'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`HAMSAAD server running on port ${PORT}`);
  require('./config/db');
});