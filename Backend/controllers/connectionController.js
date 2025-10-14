// Fix for connectionController.js
const Connection = require('../models/Connections');
const User = require('../models/user');
const mongoose = require('mongoose');
const Message=require('../models/Message')

// Send a connection request
exports.sendConnectionRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    // IMPORTANT: Use req.userId or req.user._id based on your auth middleware
    // Your auth middleware sets both req.userId and req.user._id
    const requesterId = req.userId || req.user._id;
    
    console.log('Request body:', req.body);
    console.log('Received request:', { 
      receiverId, 
      requesterId, 
      userObject: req.user 
    });

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      console.log('Invalid receiver ID:', receiverId);
      return res.status(400).json({ message: 'Invalid receiver ID' });
    }

    // Ensure requesterId is valid
    if (!mongoose.Types.ObjectId.isValid(requesterId)) {
      console.log('Invalid requester ID:', requesterId);
      return res.status(400).json({ message: 'Invalid requester ID' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    console.log('Receiver found:', receiver ? 'Yes' : 'No');
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-connection
    if (requesterId.toString() === receiverId) {
      return res.status(400).json({ message: 'Cannot send connection request to yourself' });
    }

    // Debug: Check Connection model
    console.log('Connection model exists:', !!Connection);
    console.log('Connection schema:', Connection.schema ? 'Available' : 'Not available');

    // Check if connection request already exists - with error handling
    let existingConnection;
    try {
      existingConnection = await Connection.findOne({
        $or: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId } // Check both directions
        ]
      });
      console.log('Existing connection:', existingConnection);
    } catch (err) {
      console.error('Error finding existing connection:', err);
      return res.status(500).json({ 
        message: 'Database error while checking for existing connections',
        error: err.message
      });
    }

    if (existingConnection) {
      // If the connection already exists but is from the other user to this user
      if (existingConnection.requesterId.toString() === receiverId && 
          existingConnection.receiverId.toString() === requesterId.toString()) {
        if (existingConnection.status === 'pending') {
          return res.status(409).json({ 
            message: 'This user has already sent you a connection request',
            connectionId: existingConnection._id
          });
        }
      }
      
      // If the connection already exists from this user
      if (existingConnection.status === 'pending') {
        return res.status(409).json({ message: 'Connection request already sent' });
      } else if (existingConnection.status === 'accepted') {
        return res.status(409).json({ message: 'You are already connected with this user' });
      } else if (existingConnection.status === 'rejected') {
        // Option to update a previously rejected request
        try {
          existingConnection.status = 'pending';
          await existingConnection.save();
          return res.status(200).json({ 
            message: 'Connection request sent',
            connection: existingConnection
          });
        } catch (err) {
          console.error('Error updating rejected connection:', err);
          return res.status(500).json({ 
            message: 'Failed to update connection status',
            error: err.message  
          });
        }
      }
    }

    // Create new connection request with error handling
    try {
      // Check that Connection is properly defined as a model
      if (!Connection.prototype || !Connection.prototype.constructor) {
        console.error('Connection is not a valid mongoose model');
        return res.status(500).json({ message: 'Server configuration error' });
      }
      
      const newConnection = new Connection({
        requesterId,
        receiverId,
        status: 'pending'
      });
      
      console.log('New connection created:', newConnection);
      await newConnection.save();
      console.log('Connection saved successfully');

      res.status(201).json({
        message: 'Connection request sent successfully',
        connection: newConnection
      });
    } catch (err) {
      console.error('Error creating new connection:', err);
      return res.status(500).json({ 
        message: 'Failed to create connection request',
        error: err.message
      });
    }
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ 
      message: 'Failed to send connection request',
      error: error.message 
    });
  }
};
// Also fix the other controller methods to use the correct user ID

// Get all connection requests for a user (received requests)
exports.getConnectionRequests = async (req, res) => {
  try {
    // Use req.userId instead of req.user.id
    const userId = req.userId || req.user._id;

    // Find pending connection requests where user is the receiver
    const pendingRequests = await Connection.find({
      receiverId: userId,
      status: 'pending'
    }).populate('requesterId', 'name UserName');

    res.status(200).json({
      count: pendingRequests.length,
      requests: pendingRequests
    });
  } catch (error) {
    console.error('Error getting connection requests:', error);
    res.status(500).json({ message: 'Failed to get connection requests' });
  }
};

// Get all sent connection requests by a user
exports.getSentConnectionRequests = async (req, res) => {
  try {
    // Use req.userId instead of req.user.id
    const userId = req.userId || req.user._id;

    // Find pending connection requests where user is the requester
    const sentRequests = await Connection.find({
      requesterId: userId,
      status: 'pending'
    }).populate('receiverId', 'name UserName');

    res.status(200).json({
      count: sentRequests.length,
      requests: sentRequests
    });
  } catch (error) {
    console.error('Error getting sent connection requests:', error);
    res.status(500).json({ message: 'Failed to get sent connection requests' });
  }
};

// Accept or reject a connection request
exports.respondToRequest = async (req, res) => {
  try {
    const { connectionId, action } = req.body;
    // Use req.userId instead of req.user.id
    const userId = req.userId || req.user._id;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use "accept" or "reject"' });
    }

    const connection = await Connection.findById(connectionId);
    
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    // Verify that the current user is the intended receiver
    if (connection.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    // Update connection status based on action
    connection.status = action === 'accept' ? 'accepted' : 'rejected';
    await connection.save();

    res.status(200).json({
      message: `Connection request ${action}ed successfully`,
      connection
    });
  } catch (error) {
    console.error('Error responding to connection request:', error);
    res.status(500).json({ message: 'Failed to respond to connection request' });
  }
};

// Get all connections for a user
exports.getUserConnections = async (req, res) => {
  try {
    // Use req.userId instead of req.user.id
    const userId = req.userId || req.user._id;

    // Find all accepted connections where user is either requester or receiver
    const connections = await Connection.find({
      $or: [{ requesterId: userId }, { receiverId: userId }],
      status: 'accepted'
    })
    .populate('requesterId', 'name UserName')
    .populate('receiverId', 'name UserName');

    // Format the response to show the connected user (not the current user)
    const formattedConnections = connections.map(conn => {
      const isRequester = conn.requesterId._id.toString() === userId.toString();
      const connectedUser = isRequester ? conn.receiverId : conn.requesterId;
      
      return {
        connectionId: conn._id,
        user: {
          id: connectedUser._id,
          name: connectedUser.name,
          UserName: connectedUser.UserName
        },
        since: conn.updatedAt
      };
    });

    res.status(200).json({
      count: formattedConnections.length,
      connections: formattedConnections
    });
  } catch (error) {
    console.error('Error getting user connections:', error);
    res.status(500).json({ message: 'Failed to get user connections' });
  }
};
exports.removeConnection = async (req, res) => {
  try {
    const userId = req.userId || req.user._id;
    const connectionId = req.params.id;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Check authorization
    if (
      connection.requesterId.toString() !== userId.toString() &&
      connection.receiverId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to remove this connection' });
    }

    // Identify the friend (the other user)
    const friendId =
      connection.requesterId.toString() === userId.toString()
        ? connection.receiverId
        : connection.requesterId;

    // Delete the connection
    await connection.deleteOne();

    // Delete chat history between both users
    await Message.deleteMany({
      $or: [
        { from: userId, to: friendId },
        { from: friendId, to: userId },
      ],
    });

    res.status(200).json({ message: 'Connection removed and chat history deleted' });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ message: 'Failed to remove connection' });
  }
};
